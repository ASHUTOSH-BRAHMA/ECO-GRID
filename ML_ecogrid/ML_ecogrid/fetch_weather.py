import requests
import pandas as pd
import time
import os

# 5 India Grid Zones — representative coordinates
GRID_ZONES = {
    "Northern":     {"lat": 28.6139, "lng": 77.2090, "zone_id": 1, "urban": 1},   # Delhi
    "Southern":     {"lat": 12.9716, "lng": 77.5946, "zone_id": 2, "urban": 1},   # Bangalore
    "Eastern":      {"lat": 22.5726, "lng": 88.3639, "zone_id": 3, "urban": 1},   # Kolkata
    "Western":      {"lat": 19.0760, "lng": 72.8777, "zone_id": 4, "urban": 1},   # Mumbai
    "NorthEastern": {"lat": 26.1445, "lng": 91.7362, "zone_id": 5, "urban": 0},   # Guwahati
}

# 2023 only
START_DATE = "2023-01-01"
END_DATE   = "2023-12-31"

WEATHER_VARIABLES = [
    "wind_speed_10m",
    "wind_speed_80m",
    "wind_speed_120m",
    "wind_direction_10m",
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "cloud_cover",
    "shortwave_radiation",
    "direct_normal_irradiance",
    "diffuse_radiation",
    "surface_pressure"
]

# Rename API response columns to our internal names
RENAME_MAP = {
    "wind_speed_10m":       "windspeed_10m",
    "wind_speed_80m":       "windspeed_80m",
    "wind_speed_120m":      "windspeed_120m",
    "wind_direction_10m":   "winddirection_10m",
    "relative_humidity_2m": "relativehumidity_2m",
    "cloud_cover":          "cloudcover",
}

INDIAN_HOLIDAYS_2023 = [
    "2023-01-26",  # Republic Day
    "2023-03-08",  # Holi
    "2023-04-07",  # Good Friday
    "2023-04-14",  # Ambedkar Jayanti
    "2023-04-22",  # Eid ul-Fitr
    "2023-08-15",  # Independence Day
    "2023-09-19",  # Ganesh Chaturthi
    "2023-10-02",  # Gandhi Jayanti
    "2023-10-24",  # Dussehra
    "2023-11-13",  # Diwali
    "2023-11-27",  # Guru Nanak Jayanti
    "2023-12-25",  # Christmas
]

def fetch_zone(zone_name, zone_info):
    print(f"  Fetching {zone_name}...")

    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude":   zone_info["lat"],
        "longitude":  zone_info["lng"],
        "start_date": START_DATE,
        "end_date":   END_DATE,
        "hourly":     ",".join(WEATHER_VARIABLES),
        "timezone":   "Asia/Kolkata"
    }

    resp = requests.get(url, params=params, timeout=30)
    if resp.status_code != 200:
        print(f"    ERROR {resp.status_code} for {zone_name}")
        return None

    hourly = resp.json()["hourly"]
    df = pd.DataFrame(hourly)
    df.rename(columns={"time": "timestamp"}, inplace=True)
    df.rename(columns=RENAME_MAP, inplace=True)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Location features
    df["zone_name"] = zone_name
    df["zone_id"]   = zone_info["zone_id"]
    df["latitude"]  = zone_info["lat"]
    df["longitude"] = zone_info["lng"]
    df["urban"]     = zone_info["urban"]

    # Time features
    df["hour"]       = df["timestamp"].dt.hour
    df["day"]        = df["timestamp"].dt.day
    df["month"]      = df["timestamp"].dt.month
    df["dayofweek"]  = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)

    holiday_dates = pd.to_datetime(INDIAN_HOLIDAYS_2023).date
    df["is_holiday"] = df["timestamp"].dt.date.isin(holiday_dates).astype(int)

    print(f"    Done — {len(df)} rows")
    return df

def main():
    os.makedirs("raw", exist_ok=True)
    all_zones = []

    for zone_name, zone_info in GRID_ZONES.items():
        df = fetch_zone(zone_name, zone_info)
        if df is not None:
            all_zones.append(df)
            df.to_csv(f"raw/weather_{zone_name.lower()}.csv", index=False)
        time.sleep(1)

    if all_zones:
        combined = pd.concat(all_zones, ignore_index=True)
        combined.sort_values(["zone_name", "timestamp"], inplace=True)
        combined.to_csv("raw/weather_all_zones.csv", index=False)
        print(f"\nDone! Total rows: {len(combined)}")
        print(f"Expected: ~43,800 (5 zones x 8760 hours)")

if __name__ == "__main__":
    print("Fetching 2023 weather for all 5 India grid zones...")
    main()