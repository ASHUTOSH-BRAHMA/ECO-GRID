// mockData.js — mirrors exact structure returned by FastAPI /forecast and /zones/summary
// MERN dev replaces api.js fetch calls with real endpoints, this file becomes unused

const MOCK_ZONES_SUMMARY = {
  zones: [
    { zone:"Northern",     price:4.2,  demand_gw:62.7,  supply_gw:61.5,  surplus_deficit:-1.2, carbon_intensity:641, renewable_mix:{solar:1.4,wind:1.0,hydro:15.9,thermal:81.7}, status:"deficit" },
    { zone:"Southern",     price:3.8,  demand_gw:42.4,  supply_gw:44.1,  surplus_deficit:1.7,  carbon_intensity:571, renewable_mix:{solar:3.2,wind:15.6,hydro:12.1,thermal:69.1}, status:"surplus" },
    { zone:"Eastern",      price:3.5,  demand_gw:22.5,  supply_gw:21.8,  surplus_deficit:-0.7, carbon_intensity:727, renewable_mix:{solar:0.0,wind:1.3,hydro:10.4,thermal:88.3}, status:"deficit" },
    { zone:"Western",      price:4.0,  demand_gw:53.9,  supply_gw:55.2,  surplus_deficit:1.3,  carbon_intensity:567, renewable_mix:{solar:5.4,wind:22.8,hydro:3.2,thermal:68.6}, status:"surplus" },
    { zone:"NorthEastern", price:5.1,  demand_gw:3.2,   supply_gw:3.1,   surplus_deficit:-0.1, carbon_intensity:497, renewable_mix:{solar:0.0,wind:0.8,hydro:39.8,thermal:59.4}, status:"deficit" },
  ]
};

function generateMockForecast(zone, hours) {
  const BASE = { Northern:4.2, Southern:3.8, Eastern:3.5, Western:4.0, NorthEastern:5.1 };
  const DEMAND_BASE = { Northern:62, Southern:42, Eastern:22, Western:54, NorthEastern:3.2 };
  const base_price  = BASE[zone] || 4.0;
  const base_demand = DEMAND_BASE[zone] || 40;

  const forecast = [];
  const now = new Date();

  for (let i = 1; i <= hours; i++) {
    const ts   = new Date(now.getTime() + i * 3600000);
    const h    = ts.getHours();
    const m    = ts.getMonth() + 1;

    // Hour factor
    const hf = h>=18&&h<=22 ? 1.15 : h>=9&&h<=13 ? 1.05 : h>=2&&h<=5 ? 0.65 : 0.90;
    // Season factor
    const sf = [3,4,5,6].includes(m) ? 1.2 : [12,1,2].includes(m) ? 1.1 : 1.0;
    // Noise
    const noise = () => 0.95 + Math.random() * 0.1;

    const demand  = +(base_demand * hf * sf * noise()).toFixed(3);
    const solar   = h>=7&&h<=18 ? +(base_demand*0.15*Math.sin((h-7)/11*Math.PI)*noise()).toFixed(3) : 0;
    const wind    = +(base_demand*0.05*noise()).toFixed(3);
    const hydro   = +([6,7,8,9].includes(m) ? base_demand*0.18 : base_demand*0.12).toFixed(3);
    const thermal = +(Math.max(0, demand - solar - wind - hydro) * noise()).toFixed(3);
    const supply  = +(solar + wind + hydro + thermal).toFixed(3);
    const price   = +(base_price * hf * sf * (1 - (supply-demand)/demand * 0.5) * noise()).toFixed(4);

    forecast.push({
      timestamp:       ts.toISOString().slice(0,16).replace('T','T'),
      total_supply_gw: supply,
      demand_gw:       demand,
      price_inr_kwh:   Math.max(1.5, Math.min(12, price)),
      surplus_deficit: +(supply - demand).toFixed(3),
      solar_gw:        solar,
      wind_gw:         wind,
      hydro_gw:        hydro,
      thermal_gw:      thermal,
    });
  }

  const prices   = forecast.map(f => f.price_inr_kwh);
  const demands  = forecast.map(f => f.demand_gw);
  const avgPrice = prices.reduce((a,b)=>a+b,0)/prices.length;
  const avgDemand= demands.reduce((a,b)=>a+b,0)/demands.length;

  const alerts = [], buy_windows = [], sell_windows = [];
  forecast.forEach(f => {
    const h = parseInt(f.timestamp.slice(11,13));
    if (f.demand_gw > avgDemand * 1.15 && h >= 17 && h <= 22) {
      alerts.push({ type:"peak_demand", time:f.timestamp, message:`${zone} grid — demand spike at ${h}:00, price ~₹${f.price_inr_kwh.toFixed(2)}/kWh`, severity: f.demand_gw > avgDemand*1.25 ? "high":"medium" });
    }
    if (f.price_inr_kwh < avgPrice * 0.9)  buy_windows.push({ time:f.timestamp, price:+f.price_inr_kwh.toFixed(3) });
    if (f.price_inr_kwh > avgPrice * 1.1)  sell_windows.push({ time:f.timestamp, price:+f.price_inr_kwh.toFixed(3) });
  });

  const f0 = forecast[0];
  const total = f0.solar_gw + f0.wind_gw + f0.hydro_gw + f0.thermal_gw + 0.001;
  const volStd = Math.sqrt(prices.map(p=>(p-avgPrice)**2).reduce((a,b)=>a+b,0)/prices.length);

  return {
    zone, generated_at: new Date().toISOString().slice(0,16),
    forecast_hours: hours,
    forecast,
    alerts: alerts.slice(0,8),
    buy_windows: buy_windows.slice(0,20),
    sell_windows: sell_windows.slice(0,20),
    volatility_index: +(volStd/avgPrice*100).toFixed(1),
    renewable_mix: {
      solar:   +(f0.solar_gw/total*100).toFixed(1),
      wind:    +(f0.wind_gw/total*100).toFixed(1),
      hydro:   +(f0.hydro_gw/total*100).toFixed(1),
      thermal: +(f0.thermal_gw/total*100).toFixed(1),
    },
    carbon_intensity: +(f0.solar_gw*20 + f0.wind_gw*11 + f0.hydro_gw*24 + f0.thermal_gw*820)/total,
    weather_now: { temperature:30.4, windspeed:4.3, cloudcover:0, irradiance:480, humidity:38, precipitation:0 },
    hour_of_day: Array.from({length:24},(_,h)=>({ hour:h, factor:[0.65,0.62,0.60,0.58,0.59,0.63,0.72,0.80,0.88,0.95,0.97,0.98,1.00,0.99,0.96,0.93,0.95,1.05,1.15,1.18,1.15,1.10,1.00,0.80][h] })),
    seasonality: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((month,i) => ({ month, factor:[0.85,0.82,0.90,1.05,1.15,1.10,0.95,0.92,0.88,0.87,0.86,0.88][i] })),
    model_metrics: { total_supply_gw:{MAE:3.29,RMSE:4.09,MAPE:6.72}, demand_gw:{MAE:3.14,RMSE:3.88,MAPE:6.93}, price_inr_kwh:{MAE:0.47,RMSE:0.55,MAPE:10.67} }
  };
}