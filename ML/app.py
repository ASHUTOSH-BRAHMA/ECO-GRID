from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import numpy as np
import requests
from datetime import datetime, timedelta
import os
import time
from dotenv import load_dotenv

# 1. Load environment variables at the very top
load_dotenv()

app = Flask(__name__)

# Configure CORS dynamically
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
CORS(app, origins=[origin.strip() for origin in allowed_origins.split(",") if origin.strip()])

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# ──────────────────────────────────────────────
# Weather cache — 10-minute TTL per location key
# ──────────────────────────────────────────────
_weather_cache = {}   # key -> (timestamp, data)
WEATHER_CACHE_TTL = 600  # seconds

MODEL_PATHS = {
    "demand":   "energy_demand.h5",
    "price":    "energy_price.h5",
    "produced": "energy_produced.h5",
}

# ──────────────────────────────────────────────
# Lazy-load models
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
                # Ensure we handle various input shape formats
                shape = models[key].input_shape
                if isinstance(shape, list):
                    shape = shape[0]
                model_input_shapes[key] = shape
                print(f"[OK] Loaded {key} model from {path}")
            else:
                print(f"[WARN] Model file not found: {path}")
    except Exception as e:
        print(f"[ERROR] Could not load models: {e}")

# Pre-load models at startup
load_models()

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
SEASON_MAP = {12: 0, 1: 0, 2: 0,   # winter
              3: 1, 4: 1, 5: 1,    # spring
              6: 2, 7: 2, 8: 2,    # summer
              9: 3, 10: 3, 11: 3}  # autumn

def wind_deg_to_dir(deg):
    return int((deg + 22.5) / 45) % 8

def build_feature_row(dt: datetime, weather: dict) -> list:
    """Creates the 15-feature vector required by the LSTM models."""
    return [
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        dt.weekday(),
        SEASON_MAP.get(dt.month, 0),
        weather.get("temp", 15),
        weather.get("feels_like", 15),
        weather.get("humidity", 60),
        weather.get("pressure", 1013),
        weather.get("wind_speed", 3),
        wind_deg_to_dir(weather.get("wind_deg", 0)),
        weather.get("clouds", 20),
        weather.get("rain_1h", 0),
        int(dt.weekday() >= 5), # is_weekend
    ]

def fetch_forecast(city=None, lat=None, lon=None):
    if not OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not configured in .env")

    # Build a stable cache key from location
    cache_key = f"{city}:{lat}:{lon}"
    cached = _weather_cache.get(cache_key)
    if cached and (time.time() - cached[0]) < WEATHER_CACHE_TTL:
        return cached[1]  # cache hit — return instantly

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {"appid": OPENWEATHER_API_KEY, "units": "metric", "cnt": 40}

    if lat is not None and lon is not None:
        params["lat"], params["lon"] = lat, lon
    elif city:
        params["q"] = city
    else:
        raise ValueError("Either city or lat/lon must be provided")

    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    _weather_cache[cache_key] = (time.time(), data)  # store with timestamp
    return data

def dynamic_price(base_price, demand, produced):
    surplus_ratio = (produced - demand) / max(demand, 1)
    if surplus_ratio > 0.3: factor = 0.75
    elif surplus_ratio > 0: factor = 0.90
    elif surplus_ratio > -0.2: factor = 1.10
    else: factor = 1.35
    return round(base_price * factor, 4)

def run_inference(feature_rows: list) -> list:
    use_real = all(k in models for k in ("demand", "price", "produced"))
    results = []

    for i, (dt, weather, features) in enumerate(feature_rows):
        if use_real:
            # Reshape for LSTM (1 sample, 1 timestep, 15 features)
            x15 = np.array(features, dtype=np.float32).reshape(1, 1, 15)
            
            demand = float(models["demand"].predict(x15, verbose=0)[0][0])
            produced = float(models["produced"].predict(x15, verbose=0)[0][0])
            
            # Prepare 16th feature for the Price model
            ratio = demand / max(produced, 1e-6)
            x16 = np.append(features, ratio).astype(np.float32).reshape(1, 1, 16)
            price = float(models["price"].predict(x16, verbose=0)[0][0])
        else:
            # Mock Fallback
            np.random.seed(i + dt.day * 24 + dt.hour)
            hour = dt.hour
            temp = weather.get("temp", 15)
            demand = max(50, 250 + 80 * np.sin((hour - 6) * np.pi / 12) + abs(temp - 18) * 3 + np.random.normal(0, 10))
            produced = max(0, 180 * np.sin((hour - 6) * np.pi / 12) + np.random.normal(0, 15))
            price = max(0.05, 0.12 + 0.04 * np.sin((hour - 6) * np.pi / 12) + np.random.normal(0, 0.005))

        adj_price = dynamic_price(price, demand, produced)
        
        results.append({
            "date": dt.strftime("%Y-%m-%d"),
            "hour": dt.hour,
            "demand": round(demand, 2),
            "produced": round(produced, 2),
            "surplus": round(produced - demand, 2),
            "price": round(adj_price, 4),
            "temp": round(weather.get("temp", 15), 1),
            "humidity": round(weather.get("humidity", 60), 1),
        })
    return results

def aggregate_daily(hourly_records: list) -> list:
    from collections import defaultdict
    days = defaultdict(list)
    for rec in hourly_records:
        days[rec["date"]].append(rec)

    result = []
    for date_str in sorted(days.keys()):
        recs = days[date_str]
        result.append({
            "date": date_str,
            "demand":   round(float(np.mean([r["demand"] for r in recs])), 2),
            "produced": round(float(np.mean([r["produced"] for r in recs])), 2),
            "surplus":  round(float(np.mean([r["surplus"] for r in recs])), 2),
            "price":    round(float(np.mean([r["price"] for r in recs])), 4),
            "temp":     round(float(np.mean([r["temp"] for r in recs])), 1),
            "humidity": round(float(np.mean([r["humidity"] for r in recs])), 1),
        })
    return result

# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    city = data.get("city", "").strip()
    lat, lon = data.get("lat"), data.get("lon")
    
    if not city and (lat is None or lon is None):
        return jsonify({"error": "Location required"}), 400

    try:
        forecast_data = fetch_forecast(city=city, lat=lat, lon=lon)
        
        feature_rows = []
        for item in forecast_data["list"]:
            dt = datetime.fromtimestamp(item["dt"])
            weather = {
                "temp": item["main"]["temp"],
                "feels_like": item["main"]["feels_like"],
                "humidity": item["main"]["humidity"],
                "pressure": item["main"]["pressure"],
                "wind_speed": item["wind"]["speed"],
                "wind_deg": item["wind"].get("deg", 0),
                "clouds": item["clouds"]["all"],
                "rain_1h": item.get("rain", {}).get("3h", 0) / 3,
            }
            feature_rows.append((dt, weather, build_feature_row(dt, weather)))

        hourly = run_inference(feature_rows)
        return jsonify({
            "city": forecast_data["city"]["name"],
            "daily": aggregate_daily(hourly),
            "hourly": hourly
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(debug=debug, port=port)