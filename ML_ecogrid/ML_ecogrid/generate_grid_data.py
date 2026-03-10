import pandas as pd
import numpy as np
import os

# Realistic installed capacity (GW) per zone — based on CEA 2023 reports
ZONE_CAPACITY = {
    "Northern":     {"solar": 18.5, "wind": 4.2,  "hydro": 22.1, "thermal": 68.3, "peak_demand": 85.0},
    "Southern":     {"solar": 22.3, "wind": 18.6, "hydro": 11.4, "thermal": 42.1, "peak_demand": 58.0},
    "Eastern":      {"solar": 4.1,  "wind": 0.8,  "hydro": 5.2,  "thermal": 38.6, "peak_demand": 32.0},
    "Western":      {"solar": 26.4, "wind": 12.3, "hydro": 3.8,  "thermal": 72.4, "peak_demand": 76.0},
    "NorthEastern": {"solar": 0.6,  "wind": 0.1,  "hydro": 2.8,  "thermal": 3.2,  "peak_demand": 4.5},
}

def generate_grid(df):
    results = []

    for zone_name, cap in ZONE_CAPACITY.items():
        print(f"  Processing {zone_name}...")
        z = df[df["zone_name"] == zone_name].copy().reset_index(drop=True)

        # ── Solar ────────────────────────────────────────────────────────
        irr_norm     = z["shortwave_radiation"].clip(0, 1000) / 1000
        cloud_factor = 1 - (z["cloudcover"] / 100) * 0.7
        solar = (cap["solar"] * irr_norm * cloud_factor
                 * np.random.uniform(0.88, 1.0, len(z))).clip(0)

        # ── Wind ─────────────────────────────────────────────────────────
        ws = z["windspeed_80m"].clip(0, 25)
        wf = np.where(ws < 3,  0,
             np.where(ws < 12, (ws - 3) / 9,
             np.where(ws < 25, 1.0, 0)))
        wind = (cap["wind"] * wf
                * np.random.uniform(0.88, 1.0, len(z))).clip(0)

        # ── Hydro ────────────────────────────────────────────────────────
        m = z["month"]
        hydro_seasonal = np.where(m.isin([6,7,8,9]),  0.85,
                         np.where(m.isin([10,11]),     0.65,
                         np.where(m.isin([3,4,5]),     0.45, 0.55)))
        hydro = (cap["hydro"] * hydro_seasonal
                 * np.random.uniform(0.92, 1.0, len(z))).clip(0)

        # ── Demand ───────────────────────────────────────────────────────
        temp        = z["temperature_2m"]
        temp_factor = np.where(temp > 28, 1 + (temp - 28) * 0.02,
                      np.where(temp < 15, 1 + (15 - temp) * 0.015, 1.0))

        h           = z["hour"]
        hour_factor = np.where(h.isin([18,19,20,21,22]), 1.15,
                      np.where(h.isin([9,10,11,12,13]),  1.05,
                      np.where(h.isin([2,3,4,5]),        0.65, 0.90)))

        day_factor  = np.where((z["is_weekend"] == 1) | (z["is_holiday"] == 1), 0.85, 1.0)

        demand = (cap["peak_demand"] * 0.72
                  * temp_factor * hour_factor * day_factor
                  * np.random.uniform(0.97, 1.03, len(z))).clip(0)

        # ── Thermal (fills gap with realistic ramp constraints) ───────────
        renewable    = solar + wind + hydro

        # Thermal can't instantly ramp — add ±5% scheduling noise
        thermal_base = (demand - renewable).clip(0, cap["thermal"])
        thermal_noise = thermal_base * np.random.uniform(-0.05, 0.08, len(z))
        thermal      = (thermal_base + thermal_noise).clip(0, cap["thermal"])

        total_supply = renewable + thermal

        # Realistic surplus/deficit: grid never perfectly balanced
        # Add transmission loss ~2-4% and scheduling errors
        transmission_loss = total_supply * np.random.uniform(0.02, 0.04, len(z))
        surplus = (total_supply - demand - transmission_loss).round(3)

        z["solar_gen_gw"]       = solar.round(3)
        z["wind_gen_gw"]        = wind.round(3)
        z["hydro_gen_gw"]       = hydro.round(3)
        z["thermal_gen_gw"]     = thermal.round(3)
        z["total_supply_gw"]    = total_supply.round(3)
        z["demand_gw"]          = demand.round(3)
        z["surplus_deficit_gw"] = surplus.round(3)

        results.append(z)
        print(f"    Avg demand: {demand.mean():.2f} GW | Avg supply: {total_supply.mean():.2f} GW")

    return pd.concat(results, ignore_index=True)

def main():
    path = "raw/weather_all_zones.csv"
    if not os.path.exists(path):
        print("ERROR: Run fetch_weather.py first!")
        return

    os.makedirs("processed", exist_ok=True)
    print("Loading weather data...")
    df = pd.read_csv(path, parse_dates=["timestamp"])
    print(f"  {len(df)} rows loaded\n")

    result = generate_grid(df)
    result.sort_values(["zone_name", "timestamp"], inplace=True)
    result.to_csv("processed/grid_data_all_zones.csv", index=False)
    print(f"\nSaved — {len(result)} rows, {len(result.columns)} columns")

if __name__ == "__main__":
    print("Generating grid data for all 5 zones...")
    main()