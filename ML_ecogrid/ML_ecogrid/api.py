import json
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import tensorflow as tf
import warnings
warnings.filterwarnings("ignore")

from ml_utils import (
    approx_solar, approx_wind, approx_hydro, approx_demand,
    compute_carbon_intensity, compute_renewable_mix, compute_volatility,
    detect_alerts, get_hour_of_day_pattern, get_seasonality_pattern
)

app = FastAPI(title="GreenChain Energy Forecasting API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model once at startup ────────────────────────────────────────────────
print("Loading model...")
model       = tf.keras.models.load_model("model/lstm_model.keras")
feat_scaler = joblib.load("model/feature_scaler.pkl")
tgt_scaler  = joblib.load("model/target_scaler.pkl")
with open("model/config.json") as f:
    config  = json.load(f)

LOOKBACK     = config["lookback"]
FEATURE_COLS = config["feature_cols"]
TARGET_COLS  = config["target_cols"]
print(f"Model loaded — {len(FEATURE_COLS)} features, lookback={LOOKBACK} ✅")

# ── Zone metadata ─────────────────────────────────────────────────────────────
ZONE_META = {
    "Northern":     {"lat": 28.6139, "lng": 77.2090, "zone_id": 1, "urban": 1},
    "Southern":     {"lat": 12.9716, "lng": 77.5946, "zone_id": 2, "urban": 1},
    "Eastern":      {"lat": 22.5726, "lng": 88.3639, "zone_id": 3, "urban": 1},
    "Western":      {"lat": 19.0760, "lng": 72.8777, "zone_id": 4, "urban": 1},
    "NorthEastern": {"lat": 26.1445, "lng": 91.7362, "zone_id": 5, "urban": 0},
}

BASE_PRICE = {
    "Northern": 4.2, "Southern": 3.8, "Eastern": 3.5,
    "Western":  4.0, "NorthEastern": 5.1,
}

# ── Fetch live weather ────────────────────────────────────────────────────────
def fetch_live_weather(lat, lng):
    url    = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude":  lat,
        "longitude": lng,
        "hourly": ",".join([
            "wind_speed_10m", "wind_direction_10m",
            "temperature_2m", "relative_humidity_2m", "precipitation",
            "cloud_cover", "shortwave_radiation", "direct_normal_irradiance",
            "diffuse_radiation", "surface_pressure"
        ]),
        "timezone":     "Asia/Kolkata",
        "past_days":    2,
        "forecast_days": 4
    }
    resp = requests.get(url, params=params, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Open-Meteo API failed")

    hourly = resp.json()["hourly"]
    df     = pd.DataFrame(hourly)
    df.rename(columns={
        "time":                  "timestamp",
        "wind_speed_10m":        "windspeed_10m",
        "wind_direction_10m":    "winddirection_10m",
        "relative_humidity_2m":  "relativehumidity_2m",
        "cloud_cover":           "cloudcover",
    }, inplace=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.fillna(0, inplace=True)
    return df

# ── Build one feature vector ──────────────────────────────────────────────────
def build_feature_vector(row, zone_name, meta, prev_s, prev_d, prev_p):
    ts      = pd.Timestamp(row["timestamp"])
    hour    = ts.hour
    month   = ts.month
    dow     = ts.dayofweek

    irr     = float(row.get("shortwave_radiation", 0) or 0)
    cloud   = float(row.get("cloudcover", 0) or 0)
    ws10    = float(row.get("windspeed_10m", 0) or 0)
    temp    = float(row.get("temperature_2m", 25) or 25)

    solar   = approx_solar(irr, cloud, zone_name)
    wind    = approx_wind(ws10, zone_name)
    hydro   = approx_hydro(month, zone_name)
    demand  = approx_demand(temp, hour, dow, month, zone_name)
    thermal = max(0, demand - solar - wind - hydro)
    supply  = solar + wind + hydro + thermal
    surplus = supply - demand

    bp = BASE_PRICE[zone_name]

    def lag(arr, n):
        return arr[-n] if len(arr) >= n else (arr[-1] if arr else 0)

    def roll(arr, n):
        return float(np.mean(arr[-n:])) if len(arr) >= n else (float(np.mean(arr)) if arr else 0)

    vec = {
        "windspeed_10m":               ws10,
        "winddirection_10m":           float(row.get("winddirection_10m", 0) or 0),
        "temperature_2m":              temp,
        "relativehumidity_2m":         float(row.get("relativehumidity_2m", 60) or 60),
        "precipitation":               float(row.get("precipitation", 0) or 0),
        "cloudcover":                  cloud,
        "shortwave_radiation":         irr,
        "direct_normal_irradiance":    float(row.get("direct_normal_irradiance", 0) or 0),
        "diffuse_radiation":           float(row.get("diffuse_radiation", 0) or 0),
        "surface_pressure":            float(row.get("surface_pressure", 1013) or 1013),
        "hour":                        hour,
        "day":                         ts.day,
        "month":                       month,
        "dayofweek":                   dow,
        "is_weekend":                  int(dow >= 5),
        "is_holiday":                  0,
        "zone_id":                     meta["zone_id"],
        "latitude":                    meta["lat"],
        "longitude":                   meta["lng"],
        "urban":                       meta["urban"],
        "solar_gen_gw":                solar,
        "wind_gen_gw":                 wind,
        "hydro_gen_gw":                hydro,
        "thermal_gen_gw":              thermal,
        "surplus_deficit_gw":          surplus,
        "total_supply_gw_lag1h":       lag(prev_s, 1),
        "total_supply_gw_lag2h":       lag(prev_s, 2),
        "total_supply_gw_lag3h":       lag(prev_s, 3),
        "total_supply_gw_lag6h":       lag(prev_s, 6),
        "total_supply_gw_lag12h":      lag(prev_s, 12),
        "total_supply_gw_lag24h":      lag(prev_s, 24),
        "demand_gw_lag1h":             lag(prev_d, 1),
        "demand_gw_lag2h":             lag(prev_d, 2),
        "demand_gw_lag3h":             lag(prev_d, 3),
        "demand_gw_lag6h":             lag(prev_d, 6),
        "demand_gw_lag12h":            lag(prev_d, 12),
        "demand_gw_lag24h":            lag(prev_d, 24),
        "price_inr_kwh_lag1h":         lag(prev_p, 1),
        "price_inr_kwh_lag2h":         lag(prev_p, 2),
        "price_inr_kwh_lag3h":         lag(prev_p, 3),
        "price_inr_kwh_lag6h":         lag(prev_p, 6),
        "price_inr_kwh_lag12h":        lag(prev_p, 12),
        "price_inr_kwh_lag24h":        lag(prev_p, 24),
        "total_supply_gw_roll6h":      roll(prev_s, 6),
        "total_supply_gw_roll24h":     roll(prev_s, 24),
        "demand_gw_roll6h":            roll(prev_d, 6),
        "demand_gw_roll24h":           roll(prev_d, 24),
        "price_inr_kwh_roll6h":        roll(prev_p, 6),
        "price_inr_kwh_roll24h":       roll(prev_p, 24),
    }

    return [vec[c] for c in FEATURE_COLS], solar, wind, hydro, thermal, supply, demand

# ── Main forecast endpoint ────────────────────────────────────────────────────
class ForecastRequest(BaseModel):
    zone_name:      str
    forecast_hours: int = 72

@app.post("/forecast")
async def forecast(req: ForecastRequest):
    zone = req.zone_name
    if zone not in ZONE_META:
        raise HTTPException(400, f"Unknown zone. Choose from: {list(ZONE_META.keys())}")

    meta       = ZONE_META[zone]
    weather_df = fetch_live_weather(meta["lat"], meta["lng"])

    # Build lookback sequence from past 24hrs of real weather
    past_weather = weather_df[weather_df["timestamp"] <= pd.Timestamp.now()].tail(LOOKBACK)

    prev_s, prev_d, prev_p = [], [], []
    sequence = []

    for _, row in past_weather.iterrows():
        vec, s, w, h, t, supply, demand = build_feature_vector(
            row, zone, meta, prev_s, prev_d, prev_p
        )
        sequence.append(vec)
        prev_s.append(supply)
        prev_d.append(demand)
        prev_p.append(BASE_PRICE[zone])

    # Pad if less than LOOKBACK rows
    while len(sequence) < LOOKBACK:
        sequence.insert(0, sequence[0] if sequence else [0] * len(FEATURE_COLS))

    X         = np.array(sequence[-LOOKBACK:])
    X_scaled  = feat_scaler.transform(X)
    X_input   = X_scaled.reshape(1, LOOKBACK, len(FEATURE_COLS))

    # Get future weather rows for autoregressive forecast
    now          = pd.Timestamp.now()
    future_wx    = weather_df[weather_df["timestamp"] > now].head(req.forecast_hours)
    future_rows  = list(future_wx.iterrows()) if len(future_wx) > 0 else []

    forecasts    = []
    current_inp  = X_input.copy()

    for step in range(req.forecast_hours):
        pred_scaled = model.predict(current_inp, verbose=0)
        pred        = tgt_scaler.inverse_transform(pred_scaled)[0]

        supply_pred = round(float(pred[0]), 3)
        demand_pred = round(float(pred[1]), 3)
        price_pred  = round(float(pred[2]), 3)
        ts          = (now + timedelta(hours=step + 1)).strftime("%Y-%m-%dT%H:%M")

        # Derive generation breakdown from weather if available
        if step < len(future_rows):
            _, frow   = future_rows[step]
            irr       = float(frow.get("shortwave_radiation", 0) or 0)
            cloud     = float(frow.get("cloudcover", 0) or 0)
            ws        = float(frow.get("windspeed_10m", 0) or 0)
            month_f   = frow["timestamp"].month
            solar_f   = approx_solar(irr, cloud, zone)
            wind_f    = approx_wind(ws, zone)
            hydro_f   = approx_hydro(month_f, zone)
            thermal_f = max(0, supply_pred - solar_f - wind_f - hydro_f)
        else:
            month_f   = (now + timedelta(hours=step + 1)).month
            solar_f   = approx_solar(0, 50, zone)
            wind_f    = approx_wind(5, zone)
            hydro_f   = approx_hydro(month_f, zone)
            thermal_f = max(0, supply_pred - solar_f - wind_f - hydro_f)

        forecasts.append({
            "timestamp":       ts,
            "total_supply_gw": supply_pred,
            "demand_gw":       demand_pred,
            "price_inr_kwh":   price_pred,
            "surplus_deficit": round(supply_pred - demand_pred, 3),
            "solar_gw":        round(solar_f, 3),
            "wind_gw":         round(wind_f, 3),
            "hydro_gw":        round(hydro_f, 3),
            "thermal_gw":      round(thermal_f, 3),
        })

        prev_s.append(supply_pred)
        prev_d.append(demand_pred)
        prev_p.append(price_pred)

        # Roll window
        if step < len(future_rows):
            _, frow = future_rows[step]
            new_vec, *_ = build_feature_vector(frow, zone, meta, prev_s, prev_d, prev_p)
        else:
            new_vec = sequence[-1]

        new_scaled   = feat_scaler.transform([new_vec])
        current_inp  = np.concatenate([
            current_inp[:, 1:, :],
            new_scaled.reshape(1, 1, len(FEATURE_COLS))
        ], axis=1)

    # Derive all analytics
    alerts, buy_windows, sell_windows = detect_alerts(forecasts, zone)
    volatility   = compute_volatility([f["price_inr_kwh"] for f in forecasts])

    last_solar   = forecasts[0]["solar_gw"]
    last_wind    = forecasts[0]["wind_gw"]
    last_hydro   = forecasts[0]["hydro_gw"]
    last_thermal = forecasts[0]["thermal_gw"]

    renewable_mix    = compute_renewable_mix(last_solar, last_wind, last_hydro, last_thermal)
    carbon_intensity = compute_carbon_intensity(last_solar, last_wind, last_hydro, last_thermal)

    # Current weather summary for weather impact panel
    latest_wx = past_weather.iloc[-1] if len(past_weather) > 0 else {}
    weather_now = {
        "temperature":  round(float(latest_wx.get("temperature_2m", 0) or 0), 1),
        "windspeed":    round(float(latest_wx.get("windspeed_10m", 0) or 0), 1),
        "cloudcover":   round(float(latest_wx.get("cloudcover", 0) or 0), 1),
        "irradiance":   round(float(latest_wx.get("shortwave_radiation", 0) or 0), 1),
        "humidity":     round(float(latest_wx.get("relativehumidity_2m", 0) or 0), 1),
        "precipitation":round(float(latest_wx.get("precipitation", 0) or 0), 2),
    }

    return {
        "zone":              zone,
        "generated_at":      now.strftime("%Y-%m-%dT%H:%M"),
        "forecast_hours":    req.forecast_hours,
        "forecast":          forecasts,
        "alerts":            alerts,
        "buy_windows":       buy_windows,
        "sell_windows":      sell_windows,
        "volatility_index":  volatility,
        "renewable_mix":     renewable_mix,
        "carbon_intensity":  carbon_intensity,
        "weather_now":       weather_now,
        "hour_of_day":       get_hour_of_day_pattern(),
        "seasonality":       get_seasonality_pattern(zone),
        "model_metrics":     config.get("metrics", {}),
    }

# ── All zones summary (for zone comparison panel) ─────────────────────────────
@app.get("/zones/summary")
async def zones_summary():
    summary = []
    for zone_name, meta in ZONE_META.items():
        try:
            weather_df = fetch_live_weather(meta["lat"], meta["lng"])
            latest     = weather_df[weather_df["timestamp"] <= pd.Timestamp.now()].iloc[-1]
            irr        = float(latest.get("shortwave_radiation", 0) or 0)
            cloud      = float(latest.get("cloudcover", 0) or 0)
            ws         = float(latest.get("windspeed_10m", 0) or 0)
            temp       = float(latest.get("temperature_2m", 25) or 25)
            month      = latest["timestamp"].month
            dow        = latest["timestamp"].dayofweek
            hour       = latest["timestamp"].hour

            solar   = approx_solar(irr, cloud, zone_name)
            wind    = approx_wind(ws, zone_name)
            hydro   = approx_hydro(month, zone_name)
            demand  = approx_demand(temp, hour, dow, month, zone_name)
            thermal = max(0, demand - solar - wind - hydro)
            supply  = solar + wind + hydro + thermal
            surplus = supply - demand

            summary.append({
                "zone":             zone_name,
                "price":            round(BASE_PRICE[zone_name], 2),
                "demand_gw":        round(demand, 2),
                "supply_gw":        round(supply, 2),
                "surplus_deficit":  round(surplus, 2),
                "carbon_intensity": compute_carbon_intensity(solar, wind, hydro, thermal),
                "renewable_mix":    compute_renewable_mix(solar, wind, hydro, thermal),
                "status":           "surplus" if surplus > 0 else "deficit",
            })
        except Exception as e:
            summary.append({"zone": zone_name, "error": str(e)})

    return {"zones": summary}

@app.get("/zones")
def get_zones():
    return {"zones": list(ZONE_META.keys())}

@app.get("/health")
def health():
    return {"status": "ok", "model": "lstm_v1", "features": len(FEATURE_COLS)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
