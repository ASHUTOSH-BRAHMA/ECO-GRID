"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, CloudSun, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import NavBar from "./NavBar";
import { FORECAST_API_URL, ML_ECOGRID_API_URL } from "../config";

const EnergyDemandForecast = () => {
  const [source, setSource] = useState("ml");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("Northern");
  const [forecastHours, setForecastHours] = useState(72);
  const [zones, setZones] = useState([]);

  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (source !== "ecogrid") {
      return;
    }

    const fetchZones = async () => {
      try {
        const response = await fetch(`${ML_ECOGRID_API_URL}/zones`);
        const data = await response.json();
        const zoneList = data?.zones || [];
        setZones(zoneList);
        if (zoneList.length && !zoneList.includes(zone)) {
          setZone(zoneList[0]);
        }
      } catch {
        setZones(["Northern", "Southern", "Eastern", "Western", "NorthEastern"]);
      }
    };

    fetchZones();
  }, [source, zone]);

  const displayRows = useMemo(() => {
    if (!result) return [];
    if (source === "ml") return (result.hourly || []).slice(0, 24);
    return (result.forecast || []).slice(0, 48);
  }, [result, source]);

  const generateForecast = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;
      if (source === "ml") {
        response = await fetch(`${FORECAST_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: city.trim() }),
        });
      } else {
        response = await fetch(`${ML_ECOGRID_API_URL}/forecast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zone_name: zone, forecast_hours: Number(forecastHours) || 72 }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to fetch forecast");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const canRun = source === "ml" ? city.trim().length > 0 : zone.trim().length > 0;

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 font-sans relative mt-16">
        <motion.header
          className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white py-16 px-4 text-center relative z-10 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">Energy Forecast</h1>
          <p className="text-lg md:text-xl opacity-90">Integrated ML Forecasting: City Model + Zone LSTM</p>
        </motion.header>

        <main className="max-w-6xl mx-auto p-6 -mt-12 relative z-10 pb-20">
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-green-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap gap-3 mb-5">
              <button
                onClick={() => {
                  setSource("ml");
                  setResult(null);
                  setError("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${source === "ml" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}
              >
                ML City Model
              </button>
              <button
                onClick={() => {
                  setSource("ecogrid");
                  setResult(null);
                  setError("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${source === "ecogrid" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"}`}
              >
                ML_EcoGrid Zone Model
              </button>
            </div>

            {source === "ml" ? (
              <div className="grid md:grid-cols-[1fr_auto] gap-4">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city (for example: Delhi, London, New York)"
                  className="w-full p-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none bg-green-50/50"
                />
                <button
                  onClick={generateForecast}
                  disabled={loading || !canRun}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <span className="flex items-center justify-center"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Predicting</span> : "Generate Forecast"}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-[1fr_180px_auto] gap-4">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full p-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none bg-green-50/50"
                >
                  {(zones.length ? zones : ["Northern", "Southern", "Eastern", "Western", "NorthEastern"]).map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="24"
                  max="96"
                  value={forecastHours}
                  onChange={(e) => setForecastHours(Number(e.target.value) || 72)}
                  className="w-full p-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none bg-green-50/50"
                  placeholder="Hours"
                />
                <button
                  onClick={generateForecast}
                  disabled={loading || !canRun}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <span className="flex items-center justify-center"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Predicting</span> : "Generate Forecast"}
                </button>
              </div>
            )}
          </motion.div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8 shadow-md">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {result && source === "ml" && (
            <motion.div className="rounded-2xl overflow-hidden shadow-xl border border-green-200 bg-white" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-gradient-to-r from-green-700 to-emerald-700 text-white p-6">
                <h3 className="text-2xl font-bold flex items-center"><BarChart3 className="h-6 w-6 mr-2" />{result.city?.name}, {result.city?.country}</h3>
                <p className="text-green-100 mt-1">Coordinates: {result.city?.lat}, {result.city?.lon}</p>
              </div>

              <div className="p-6 border-b border-green-100">
                <h4 className="text-lg font-bold text-green-800 mb-4">Daily Summary</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(result.daily || []).map((day) => (
                    <div key={day.date} className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <p className="font-semibold text-green-800 mb-2">{day.date}</p>
                      <p className="text-sm text-gray-700">Demand: {day.demand} kWh</p>
                      <p className="text-sm text-gray-700">Produced: {day.produced} kWh</p>
                      <p className={`text-sm font-medium ${day.surplus >= 0 ? "text-green-700" : "text-red-600"}`}>Surplus: {day.surplus} kWh</p>
                      <p className="text-sm text-gray-700">Price: {day.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowDetails((prev) => !prev)} className="w-full bg-white hover:bg-green-50 text-green-800 py-4 font-medium flex items-center justify-center transition-colors border-b border-green-100">
                {showDetails ? "Hide" : "Show"} Hourly Data {showDetails ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </button>

              {showDetails && (
                <div className="p-4 md:p-6 max-h-[480px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-green-50 text-green-700 uppercase">
                      <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Hour</th><th className="px-3 py-2">Demand</th><th className="px-3 py-2">Produced</th><th className="px-3 py-2">Surplus</th><th className="px-3 py-2">Price</th></tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, index) => (
                        <tr key={`${row.date}-${row.hour}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-green-50/40"}>
                          <td className="px-3 py-2 border-b border-green-100">{row.date}</td>
                          <td className="px-3 py-2 border-b border-green-100">{row.hour}:00</td>
                          <td className="px-3 py-2 border-b border-green-100">{row.demand}</td>
                          <td className="px-3 py-2 border-b border-green-100">{row.produced}</td>
                          <td className={`px-3 py-2 border-b border-green-100 font-medium ${row.surplus >= 0 ? "text-green-700" : "text-red-600"}`}>{row.surplus}</td>
                          <td className="px-3 py-2 border-b border-green-100">{row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {result && source === "ecogrid" && (
            <motion.div className="rounded-2xl overflow-hidden shadow-xl border border-green-200 bg-white" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-gradient-to-r from-green-700 to-emerald-700 text-white p-6">
                <h3 className="text-2xl font-bold flex items-center"><CloudSun className="h-6 w-6 mr-2" />Zone: {result.zone}</h3>
                <p className="text-green-100 mt-1">Generated: {result.generated_at} | Volatility Index: {result.volatility_index}</p>
              </div>

              <div className="p-6 border-b border-green-100 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4"><p className="text-sm text-gray-600">Solar Mix</p><p className="text-xl font-semibold text-green-800">{result.renewable_mix?.solar}%</p></div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4"><p className="text-sm text-gray-600">Wind Mix</p><p className="text-xl font-semibold text-green-800">{result.renewable_mix?.wind}%</p></div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4"><p className="text-sm text-gray-600">Hydro Mix</p><p className="text-xl font-semibold text-green-800">{result.renewable_mix?.hydro}%</p></div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4"><p className="text-sm text-gray-600">Carbon Intensity</p><p className="text-xl font-semibold text-green-800">{result.carbon_intensity}</p></div>
              </div>

              <button onClick={() => setShowDetails((prev) => !prev)} className="w-full bg-white hover:bg-green-50 text-green-800 py-4 font-medium flex items-center justify-center transition-colors border-b border-green-100">
                {showDetails ? "Hide" : "Show"} Zone Forecast Details {showDetails ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
              </button>

              {showDetails && (
                <div className="p-4 md:p-6 space-y-6">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-green-50 text-green-700 uppercase">
                        <tr><th className="px-3 py-2">Timestamp</th><th className="px-3 py-2">Supply</th><th className="px-3 py-2">Demand</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Surplus/Deficit</th></tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row, index) => (
                          <tr key={`${row.timestamp}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-green-50/40"}>
                            <td className="px-3 py-2 border-b border-green-100">{row.timestamp}</td>
                            <td className="px-3 py-2 border-b border-green-100">{row.total_supply_gw}</td>
                            <td className="px-3 py-2 border-b border-green-100">{row.demand_gw}</td>
                            <td className="px-3 py-2 border-b border-green-100">{row.price_inr_kwh}</td>
                            <td className={`px-3 py-2 border-b border-green-100 font-medium ${row.surplus_deficit >= 0 ? "text-green-700" : "text-red-600"}`}>{row.surplus_deficit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Alerts</h4>
                      {(result.alerts || []).length ? (result.alerts || []).slice(0, 6).map((a, i) => <p key={`${a.time}-${i}`} className="text-sm text-gray-700 mb-1">{a.time}: {a.message}</p>) : <p className="text-sm text-gray-600">No alerts.</p>}
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Trade Windows</h4>
                      <p className="text-sm text-gray-700 mb-2">Buy windows: {(result.buy_windows || []).length}</p>
                      <p className="text-sm text-gray-700">Sell windows: {(result.sell_windows || []).length}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
};

export default EnergyDemandForecast;
