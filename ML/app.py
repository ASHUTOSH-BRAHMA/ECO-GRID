from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import numpy as np
import requests
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ──────────────────────────────────────────────
# CONFIG  –  fill in your real keys / paths
# ──────────────────────────────────────────────
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

MODEL_PATHS = {
    "demand":   "energy_demand.h5",
    "price":    "energy_price.h5",
    "produced": "energy_produced.h5",
}

# ──────────────────────────────────────────────
# Lazy-load models (won't crash if .h5 missing)
# ──────────────────────────────────────────────
models = {}
model_input_shapes = {}

def load_models():
    global models, model_input_shapes
    if models:
        return
    try:
        from tensorflow.keras.models import load_model
        for key, path in MODEL_PATHS.items():
            if os.path.exists(path):
                models[key] = load_model(path)
                shape = models[key].input_shape
                if isinstance(shape, list):
                    shape = shape[0]
                model_input_shapes[key] = shape
                print(f"[OK] Loaded {key} model from {path}")
            else:
                print(f"[WARN] Model file not found: {path}")
    except Exception as e:
        print(f"[ERROR] Could not load models: {e}")

# Pre-load models to improve prediction latency
load_models()


def _expected_feature_count(shape, fallback):
    try:
        if shape and len(shape) >= 2 and shape[-1] is not None:
            return int(shape[-1])
    except Exception:
        pass
    return fallback


def _prepare_model_input(model_key, features):
    shape = model_input_shapes.get(model_key)
    expected = _expected_feature_count(shape, len(features))
    vec = np.array(features, dtype=np.float32)

    if vec.size < expected:
        vec = np.pad(vec, (0, expected - vec.size), mode="constant")
    elif vec.size > expected:
        vec = vec[:expected]

    if shape and len(shape) == 2:
        return vec.reshape(1, expected)
    return vec.reshape(1, 1, expected)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
SEASON_MAP = {12: 0, 1: 0, 2: 0,   # winter
              3: 1, 4: 1, 5: 1,    # spring
              6: 2, 7: 2, 8: 2,    # summer
              9: 3, 10: 3, 11: 3}  # autumn

def wind_deg_to_dir(deg):
    """Convert wind degrees to 0-7 index (N, NE, E, SE, S, SW, W, NW)."""
    return int((deg + 22.5) / 45) % 8

def build_feature_row(dt: datetime, weather: dict) -> list:
    return [
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        dt.weekday(),
        SEASON_MAP[dt.month],
        weather.get("temp", 15),
        weather.get("feels_like", 15),
        weather.get("humidity", 60),
        weather.get("pressure", 1013),
        weather.get("wind_speed", 3),
        wind_deg_to_dir(weather.get("wind_deg", 0)),
        weather.get("clouds", 20),
        weather.get("rain_1h", 0),
        int(dt.weekday() >= 5),   # ← ADD THIS: is_weekend (most common 15th feature)
    ]

def fetch_forecast(city: str = None, lat: float = None, lon: float = None):
    """Fetch 5-day / 3-hour forecast from OpenWeatherMap."""
    if not OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not configured")
    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40,          # 5 days × 8 slots
    }
    
    if lat is not None and lon is not None:
        params["lat"] = lat
        params["lon"] = lon
    elif city:
        params["q"] = city
    else:
        raise ValueError("Either city or lat/lon must be provided")
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    return r.json()


def aggregate_daily(hourly_records: list) -> list:
    """Average hourly records into daily buckets."""
    from collections import defaultdict
    days = defaultdict(list)
    for rec in hourly_records:
        days[rec["date"]].append(rec)

    result = []
    for date_str in sorted(days.keys()):
        recs = days[date_str]
        result.append({
            "date": date_str,
            "demand":   round(np.mean([r["demand"]   for r in recs]), 2),
            "produced": round(np.mean([r["produced"] for r in recs]), 2),
            "surplus":  round(np.mean([r["surplus"]  for r in recs]), 2),
            "price":    round(np.mean([r["price"]    for r in recs]), 2),
            "temp":     round(np.mean([r["temp"]     for r in recs]), 1),
            "humidity": round(np.mean([r["humidity"] for r in recs]), 1),
        })
    return result


def dynamic_price(base_price: float, demand: float, produced: float) -> float:
    """Simple supply-demand dynamic pricing."""
    surplus_ratio = (produced - demand) / max(demand, 1)
    if surplus_ratio > 0.3:
        factor = 0.75   # lots of surplus → cheaper
    elif surplus_ratio > 0:
        factor = 0.90
    elif surplus_ratio > -0.2:
        factor = 1.10   # slight deficit
    else:
        factor = 1.35   # high deficit
    return round(base_price * factor, 4)


def run_inference(feature_rows: list) -> dict:
    """
    Run LSTM inference with proper 24-timestep sliding windows.

    Models were trained with shape (None, 24, 15):
      - demand   : 15 features
      - produced : 15 features
      - price    : 16 features (15 + 1 derived: demand/produced ratio)

    We zero-pad early windows (i < 24) so every row gets a prediction.
    Falls back to physics-based mock values when .h5 files are unavailable.
    """
    load_models()
    use_real = all(k in models for k in ("demand", "price", "produced"))
    SEQ_LEN = 24

    # Build a padded feature matrix: shape (total_rows, 15)
    all_features = np.array([f for (_, _, f) in feature_rows], dtype=np.float32)
    n = len(all_features)

    results = []
    for i, (dt, weather, features) in enumerate(feature_rows):
        if all(k in models for k in ("demand", "price", "produced")):
            x15 = np.array(features, dtype=np.float32).reshape(1, 1, 15)
            # Predict demand and produced first (both expect 15 features)
            demand   = float(models["demand"].predict(x15,   verbose=0)[0][0])
            produced = float(models["produced"].predict(x15, verbose=0)[0][0])
            # Price model expects 16 features: 15 base + demand/produced ratio
            ratio = demand / max(produced, 1e-6)
            x16 = np.append(features, ratio).astype(np.float32).reshape(1, 1, 16)
            price = float(models["price"].predict(x16, verbose=0)[0][0])
        else:
            # ── Physics-based mock fallback ──────────────────────────────
            np.random.seed(i + dt.day * 24 + dt.hour)
            hour = dt.hour
            temp = weather.get("temp", 15)

            demand = 250 + 80 * np.sin((hour - 6) * np.pi / 12) \
                     + abs(temp - 18) * 3 + np.random.normal(0, 10)
            demand = max(demand, 50)

            produced = max(0, 180 * np.sin((hour - 6) * np.pi / 12)
                          + np.random.normal(0, 15))

            price = 0.12 + 0.04 * np.sin((hour - 6) * np.pi / 12) \
                    + np.random.normal(0, 0.005)
            price = max(price, 0.05)

        adj_price = dynamic_price(price, demand, produced)
        surplus   = produced - demand

        results.append({
            "date":     dt.strftime("%Y-%m-%d"),
            "hour":     dt.hour,
            "demand":   round(demand,   2),
            "produced": round(produced, 2),
            "surplus":  round(surplus,  2),
            "price":    round(adj_price, 4),
            "temp":     round(weather.get("temp", 15), 1),
            "humidity": round(weather.get("humidity", 60), 1),
        })
    return results


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    city = data.get("city", "").strip()
    lat = data.get("lat")
    lon = data.get("lon")
    
    if not city and (lat is None or lon is None):
        return jsonify({"error": "City name or coordinates are required"}), 400

    try:
        forecast_data = fetch_forecast(city=city, lat=lat, lon=lon)
    except requests.exceptions.HTTPError as e:
        code = e.response.status_code if e.response else 0
        if code == 401:
            return jsonify({"error": "Invalid OpenWeatherMap API key"}), 400
        if code == 404:
            return jsonify({"error": f"City '{city}' not found"}), 404
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    city_info = {
        "name":    forecast_data["city"]["name"],
        "country": forecast_data["city"]["country"],
        "lat":     forecast_data["city"]["coord"]["lat"],
        "lon":     forecast_data["city"]["coord"]["lon"],
    }

    feature_rows = []
    for item in forecast_data["list"]:
        dt = datetime.fromtimestamp(item["dt"])
        weather = {
            "temp":       item["main"]["temp"],
            "feels_like": item["main"]["feels_like"],
            "humidity":   item["main"]["humidity"],
            "pressure":   item["main"]["pressure"],
            "wind_speed": item["wind"]["speed"],
            "wind_deg":   item["wind"].get("deg", 0),
            "clouds":     item["clouds"]["all"],
            "rain_1h":    item.get("rain", {}).get("3h", 0) / 3,
        }
        features = build_feature_row(dt, weather)
        feature_rows.append((dt, weather, features))

    hourly = run_inference(feature_rows)
    daily  = aggregate_daily(hourly)

    return jsonify({
        "city":   city_info,
        "daily":  daily,
        "hourly": hourly,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
