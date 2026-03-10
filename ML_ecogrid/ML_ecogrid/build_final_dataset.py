import pandas as pd
import numpy as np
import os

BASE_PRICE = {
    "Northern":     4.2,
    "Southern":     3.8,
    "Eastern":      3.5,
    "Western":      4.0,
    "NorthEastern": 5.1,
}

def add_price(df):
    print("  Adding prices...")
    results = []

    for zone_name, grp in df.groupby("zone_name"):
        base = BASE_PRICE[zone_name]
        grp  = grp.copy()

        sd_ratio        = grp["surplus_deficit_gw"] / grp["demand_gw"].clip(0.1)
        imbalance       = 1 - sd_ratio.clip(-0.5, 0.5) * 0.8

        h               = grp["hour"]
        peak_factor     = np.where(h.isin([18,19,20,21,22]), 1.35,
                          np.where(h.isin([9,10,11,12]),     1.10,
                          np.where(h.isin([2,3,4,5]),        0.75, 1.0)))

        m               = grp["month"]
        season_factor   = np.where(m.isin([3,4,5,6]),  1.20,
                          np.where(m.isin([12,1,2]),    1.10, 1.0))

        ren_share       = (grp["solar_gen_gw"] + grp["wind_gen_gw"]) / grp["total_supply_gw"].clip(0.1)
        ren_factor      = 1 - ren_share * 0.15

        price = (base * imbalance * peak_factor * season_factor * ren_factor
                 * np.random.uniform(0.96, 1.04, len(grp))).clip(1.5, 12.0)

        grp["price_inr_kwh"] = price.round(4)
        results.append(grp)

    return pd.concat(results, ignore_index=True)


def add_lag_features(df):
    print("  Adding lag features...")
    df   = df.sort_values(["zone_name", "timestamp"]).reset_index(drop=True)
    cols = ["total_supply_gw", "demand_gw", "price_inr_kwh"]
    lags = [1, 2, 3, 6, 12, 24]

    for col in cols:
        for lag in lags:
            df[f"{col}_lag{lag}h"] = df.groupby("zone_name", group_keys=False)[col].shift(lag)

    return df


def add_rolling_features(df):
    print("  Adding rolling features...")
    df   = df.sort_values(["zone_name", "timestamp"]).reset_index(drop=True)
    cols = ["total_supply_gw", "demand_gw", "price_inr_kwh"]

    for col in cols:
        df[f"{col}_roll6h"]  = df.groupby("zone_name", group_keys=False)[col].transform(lambda x: x.rolling(6,  min_periods=1).mean())
        df[f"{col}_roll24h"] = df.groupby("zone_name", group_keys=False)[col].transform(lambda x: x.rolling(24, min_periods=1).mean())

    return df


def main():
    path = "processed/grid_data_all_zones.csv"
    if not os.path.exists(path):
        print("ERROR: Run generate_grid_data.py first!")
        return

    os.makedirs("processed", exist_ok=True)
    print("Loading grid data...")
    df = pd.read_csv(path, parse_dates=["timestamp"])
    print(f"  {len(df)} rows\n")

    # Drop columns that are entirely empty (windspeed_80m, windspeed_120m)
    empty_cols = [c for c in df.columns if df[c].isna().all()]
    if empty_cols:
        print(f"  Dropping empty columns: {empty_cols}")
        df.drop(columns=empty_cols, inplace=True)

    # Fill any remaining NaNs in weather columns with 0
    weather_cols = ["windspeed_10m", "windspeed_80m", "windspeed_120m",
                    "winddirection_10m", "relativehumidity_2m", "precipitation",
                    "cloudcover", "shortwave_radiation", "direct_normal_irradiance",
                    "diffuse_radiation", "surface_pressure"]
    for c in weather_cols:
        if c in df.columns:
            df[c] = df[c].fillna(0)

    df = add_price(df)
    df = add_lag_features(df)
    df = add_rolling_features(df)

    before = len(df)
    df = df.dropna(subset=["total_supply_gw_lag24h", "demand_gw_lag24h", "price_inr_kwh_lag24h"])
    df.reset_index(drop=True, inplace=True)
    print(f"  Dropped {before - len(df)} rows (first 24 rows per zone, expected)")

    df.to_csv("processed/final_dataset.csv", index=False)

    print(f"\n✅ Final dataset ready!")
    print(f"   Rows     : {len(df)}")
    print(f"   Columns  : {len(df.columns)}")
    print(f"   Zones    : {df['zone_name'].unique()}")
    print(f"\nTarget columns stats:")
    print(df[["total_supply_gw", "demand_gw", "price_inr_kwh"]].describe().round(3))

if __name__ == "__main__":
    print("Building final dataset...")
    main()