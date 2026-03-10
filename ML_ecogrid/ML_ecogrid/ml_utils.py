import numpy as np

ZONE_CAPACITY = {
    "Northern":     {"solar": 18.5, "wind": 4.2,  "hydro": 22.1, "thermal": 68.3, "peak_demand": 85.0},
    "Southern":     {"solar": 22.3, "wind": 18.6, "hydro": 11.4, "thermal": 42.1, "peak_demand": 58.0},
    "Eastern":      {"solar": 4.1,  "wind": 0.8,  "hydro": 5.2,  "thermal": 38.6, "peak_demand": 32.0},
    "Western":      {"solar": 26.4, "wind": 12.3, "hydro": 3.8,  "thermal": 72.4, "peak_demand": 76.0},
    "NorthEastern": {"solar": 0.6,  "wind": 0.1,  "hydro": 2.8,  "thermal": 3.2,  "peak_demand": 4.5},
}

CARBON_INTENSITY = {
    "solar":   20,
    "wind":    11,
    "hydro":   24,
    "thermal": 820,
}

def get_cap(zone_name):
    return ZONE_CAPACITY[zone_name]

def approx_solar(irradiance, cloudcover, zone_name):
    cap          = get_cap(zone_name)
    irr_norm     = min(irradiance or 0, 1000) / 1000
    cloud_factor = 1 - ((cloudcover or 0) / 100) * 0.7
    return max(0, cap["solar"] * irr_norm * cloud_factor)

def approx_wind(windspeed_10m, zone_name):
    cap = get_cap(zone_name)
    ws  = min(windspeed_10m or 0, 25)
    if ws < 3:    wf = 0
    elif ws < 12: wf = (ws - 3) / 9
    elif ws < 25: wf = 1.0
    else:         wf = 0
    return max(0, cap["wind"] * wf)

def approx_hydro(month, zone_name):
    cap = get_cap(zone_name)
    if month in [6, 7, 8, 9]:   seasonal = 0.85
    elif month in [10, 11]:      seasonal = 0.65
    elif month in [3, 4, 5]:     seasonal = 0.45
    else:                        seasonal = 0.55
    return max(0, cap["hydro"] * seasonal)

def approx_demand(temp, hour, dayofweek, month, zone_name):
    cap         = get_cap(zone_name)
    temp_factor = (1 + (temp - 28) * 0.02  if temp > 28 else
                   1 + (15 - temp) * 0.015 if temp < 15 else 1.0)
    if hour in [18, 19, 20, 21, 22]:  hour_factor = 1.15
    elif hour in [9, 10, 11, 12, 13]: hour_factor = 1.05
    elif hour in [2, 3, 4, 5]:        hour_factor = 0.65
    else:                              hour_factor = 0.90
    day_factor = 0.85 if dayofweek >= 5 else 1.0
    return max(0, cap["peak_demand"] * 0.72 * temp_factor * hour_factor * day_factor)

def compute_carbon_intensity(solar, wind, hydro, thermal):
    total = solar + wind + hydro + thermal
    if total <= 0:
        return 500.0
    ci = (
        solar   * CARBON_INTENSITY["solar"]   +
        wind    * CARBON_INTENSITY["wind"]    +
        hydro   * CARBON_INTENSITY["hydro"]   +
        thermal * CARBON_INTENSITY["thermal"]
    ) / total
    return round(ci, 1)

def compute_renewable_mix(solar, wind, hydro, thermal):
    total = solar + wind + hydro + thermal + 0.001
    return {
        "solar":   round(solar   / total * 100, 1),
        "wind":    round(wind    / total * 100, 1),
        "hydro":   round(hydro   / total * 100, 1),
        "thermal": round(thermal / total * 100, 1),
    }

def compute_volatility(prices):
    if len(prices) < 2:
        return 0.0
    base = np.mean(prices)
    if base <= 0:
        return 0.0
    return round(float(np.std(prices) / base * 100), 1)

def detect_alerts(forecast_list, zone_name):
    alerts       = []
    buy_windows  = []
    sell_windows = []

    prices  = [f["price_inr_kwh"]  for f in forecast_list]
    demands = [f["demand_gw"]       for f in forecast_list]
    supply  = [f["total_supply_gw"] for f in forecast_list]
    times   = [f["timestamp"]       for f in forecast_list]

    avg_price  = np.mean(prices)
    avg_demand = np.mean(demands)

    for i, (t, p, d, s) in enumerate(zip(times, prices, demands, supply)):
        hour = int(t[11:13])

        if d > avg_demand * 1.15 and hour in range(17, 23):
            severity = "high" if d > avg_demand * 1.25 else "medium"
            alerts.append({
                "type":     "peak_demand",
                "time":     t,
                "message":  f"{zone_name} grid — demand spike expected at {hour}:00, price ~₹{p:.2f}/kWh",
                "severity": severity
            })

        if s - d > avg_demand * 0.08:
            alerts.append({
                "type":     "surplus",
                "time":     t,
                "message":  f"{zone_name} — energy surplus at {hour}:00, good buy window",
                "severity": "low"
            })

        if p < avg_price * 0.90:
            buy_windows.append({"time": t, "price": round(p, 3)})
        elif p > avg_price * 1.10:
            sell_windows.append({"time": t, "price": round(p, 3)})

    return alerts[:10], buy_windows[:24], sell_windows[:24]

def get_hour_of_day_pattern():
    pattern = {
        0: 0.65, 1: 0.62, 2: 0.60, 3: 0.58, 4: 0.59, 5: 0.63,
        6: 0.72, 7: 0.80, 8: 0.88, 9: 0.95, 10: 0.97, 11: 0.98,
        12: 1.00, 13: 0.99, 14: 0.96, 15: 0.93, 16: 0.95, 17: 1.05,
        18: 1.15, 19: 1.18, 20: 1.15, 21: 1.10, 22: 1.00, 23: 0.80
    }
    return [{"hour": h, "factor": v} for h, v in pattern.items()]

def get_seasonality_pattern(zone_name):
    base = {
        "Northern":     [0.85, 0.82, 0.90, 1.05, 1.15, 1.10, 0.95, 0.92, 0.88, 0.87, 0.86, 0.88],
        "Southern":     [0.90, 0.88, 0.95, 1.08, 1.12, 1.05, 0.98, 0.96, 0.92, 0.90, 0.89, 0.91],
        "Eastern":      [0.88, 0.85, 0.90, 0.98, 1.05, 1.08, 1.02, 1.00, 0.95, 0.92, 0.90, 0.89],
        "Western":      [0.87, 0.84, 0.92, 1.06, 1.14, 1.08, 0.96, 0.94, 0.90, 0.88, 0.87, 0.89],
        "NorthEastern": [0.90, 0.88, 0.92, 0.98, 1.02, 1.05, 1.08, 1.06, 1.00, 0.95, 0.92, 0.91],
    }
    months  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    factors = base.get(zone_name, base["Northern"])
    return [{"month": m, "factor": f} for m, f in zip(months, factors)]