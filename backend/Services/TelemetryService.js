import TelemetrySample from "../Models/TelemetrySample.js";
import UserProfile from "../Models/UserProfile.js";
import Transaction from "../Models/Transaction.js";
import EnergyListing from "../Models/EnergyListing.js";
import Users from "../Models/Users.js";

const WINDOW_MS = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000
};

const DEFAULT_PRICE_TOKENS = 2;
const DEFAULT_GRID_RATE_USD = 0.15;
const DEVICE_FRESHNESS_MS = 20 * 1000;

const round = (value, digits = 4) => Number(Number(value || 0).toFixed(digits));

const average = (values) => {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdDev = (values) => {
    if (values.length < 2) return 0;
    const avg = average(values);
    const variance = average(values.map((value) => (value - avg) ** 2));
    return Math.sqrt(variance);
};

const getWindowStart = (windowKey = "24h") => {
    const now = Date.now();
    const duration = WINDOW_MS[windowKey] || WINDOW_MS["24h"];
    return new Date(now - duration);
};

const getTimeBand = (date = new Date()) => {
    const hour = date.getHours();

    if (hour >= 17 && hour < 22) {
        return { name: "peak", multiplier: 1.25 };
    }

    if ((hour >= 7 && hour < 17) || (hour >= 22 && hour < 24)) {
        return { name: "shoulder", multiplier: 1.05 };
    }

    return { name: "off_peak", multiplier: 0.85 };
};

const getLoadMultiplier = (instantLoadKw, avg15mKw) => {
    if (!avg15mKw) return 1;

    const ratio = instantLoadKw / avg15mKw;

    if (ratio >= 1.5) return 1.3;
    if (ratio >= 1.25) return 1.18;
    if (ratio >= 1.1) return 1.08;
    if (ratio <= 0.8) return 0.94;

    return 1;
};

const getSurgeMultiplier = (instantLoadKw) => {
    if (instantLoadKw >= 0.02) return 1.12;
    if (instantLoadKw >= 0.01) return 1.06;
    return 1;
};

const getStabilityDiscount = (loads) => {
    if (loads.length < 3) return 1;
    const avgLoad = average(loads);
    if (!avgLoad) return 1;

    const volatility = stdDev(loads) / avgLoad;
    return volatility <= 0.08 ? 0.96 : 1;
};

const getLoadTrend = (avg1mKw, avg15mKw) => {
    if (!avg15mKw) return "stable";
    const ratio = avg1mKw / avg15mKw;

    if (ratio >= 1.1) return "rising";
    if (ratio <= 0.9) return "falling";
    return "stable";
};

const formatKwh = (value, digits = 3) => `${round(value, digits)} kWh`;
const formatUsd = (value, digits = 3) => `$${round(value, digits)}/kWh`;
const formatTokenRate = (value, digits = 2) => round(value, digits);

const buildDerivedSample = (payload, previousSample, recentSamples = []) => {
    const timestamp = new Date();
    const voltage_v = Number(payload.voltage);
    const current_ma = Number(payload.current);
    const power_mw = Number(payload.power);
    const energy_mwh_total = Number(payload.energy);
    const power_w = power_mw / 1000;
    const instant_load_kw = power_w / 1000;
    const energy_kwh_total = energy_mwh_total / 1000000;

    let energy_delta_kwh = 0;
    if (previousSample) {
        const delta = energy_kwh_total - Number(previousSample.energy_kwh_total || 0);
        energy_delta_kwh = delta >= 0 ? delta : 0;
    }

    const demandFloor = Math.max(energy_delta_kwh, instant_load_kw / 12);
    const modeledSupplyFactor = payload.sourceType === "solar" ? 1.08 : payload.sourceType === "wind" ? 1.04 : 1;
    const site_demand_kwh = round(demandFloor, 6);
    const site_supply_kwh = round(site_demand_kwh * modeledSupplyFactor, 6);
    const grid_balance_kwh = round(site_supply_kwh - site_demand_kwh, 6);

    const oneMinuteLoads = recentSamples
        .filter((sample) => timestamp - new Date(sample.timestamp) <= WINDOW_MS["1m"])
        .map((sample) => Number(sample.instant_load_kw || 0));
    const fifteenMinuteLoads = recentSamples
        .filter((sample) => timestamp - new Date(sample.timestamp) <= WINDOW_MS["15m"])
        .map((sample) => Number(sample.instant_load_kw || 0));

    const avg1mKw = average([...oneMinuteLoads, instant_load_kw]);
    const avg15mKw = average([...fifteenMinuteLoads, instant_load_kw]);
    const load_trend = getLoadTrend(avg1mKw, avg15mKw);

    return {
        deviceId: payload.deviceId || "esp32-site-001",
        sourceType: payload.sourceType || "aggregate",
        voltage: voltage_v,
        current: current_ma,
        power: power_mw,
        energy: energy_mwh_total,
        voltage_v: round(voltage_v, 3),
        current_ma: round(current_ma, 3),
        power_mw: round(power_mw, 3),
        energy_mwh_total: round(energy_mwh_total, 3),
        power_w: round(power_w, 6),
        instant_load_kw: round(instant_load_kw, 6),
        energy_kwh_total: round(energy_kwh_total, 6),
        energy_delta_kwh,
        site_demand_kwh,
        site_supply_kwh,
        grid_balance_kwh,
        load_trend,
        timestamp
    };
};

export const validateTelemetryPayload = (payload = {}) => {
    const fields = ["voltage", "current", "power", "energy"];
    for (const field of fields) {
        const value = Number(payload[field]);
        if (!Number.isFinite(value)) {
            return { valid: false, message: `${field} must be a number` };
        }
    }

    if (Number(payload.voltage) < 0 || Number(payload.voltage) > 400) {
        return { valid: false, message: "voltage out of range" };
    }

    if (Number(payload.current) < 0 || Number(payload.current) > 100000) {
        return { valid: false, message: "current out of range" };
    }

    if (Number(payload.power) < 0 || Number(payload.power) > 100000000) {
        return { valid: false, message: "power out of range" };
    }

    if (Number(payload.energy) < 0) {
        return { valid: false, message: "energy must be non-negative" };
    }

    return { valid: true };
};

export const createTelemetrySample = async (payload) => {
    const recentSamples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(180)
        .lean();

    const previousSample = recentSamples[0] || null;
    const derivedSample = buildDerivedSample(payload, previousSample, recentSamples);

    const sample = await TelemetrySample.create(derivedSample);
    return sample.toObject();
};

export const getRecentSamples = async ({ window = "24h", limit = 500 } = {}) => {
    const samples = await TelemetrySample.find({ timestamp: { $gte: getWindowStart(window) } })
        .sort({ timestamp: 1 })
        .limit(limit)
        .lean();

    return samples;
};

export const getLatestSample = async () => {
    return TelemetrySample.findOne().sort({ timestamp: -1 }).lean();
};

const getRollingStats = (samples, latestSample) => {
    const now = latestSample ? new Date(latestSample.timestamp) : new Date();
    const withLatest = latestSample ? [...samples, latestSample] : samples;
    const loads = withLatest.map((sample) => Number(sample.instant_load_kw || 0));

    const oneMinute = withLatest.filter((sample) => now - new Date(sample.timestamp) <= WINDOW_MS["1m"]);
    const fiveMinute = withLatest.filter((sample) => now - new Date(sample.timestamp) <= WINDOW_MS["5m"]);
    const fifteenMinute = withLatest.filter((sample) => now - new Date(sample.timestamp) <= WINDOW_MS["15m"]);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todaySamples = withLatest.filter((sample) => new Date(sample.timestamp) >= todayStart);

    const avg1mKw = average(oneMinute.map((sample) => Number(sample.instant_load_kw || 0)));
    const avg5mKw = average(fiveMinute.map((sample) => Number(sample.instant_load_kw || 0)));
    const avg15mKw = average(fifteenMinute.map((sample) => Number(sample.instant_load_kw || 0)));
    const peakTodayKw = Math.max(...todaySamples.map((sample) => Number(sample.instant_load_kw || 0)), 0);
    const totalEnergyTodayKwh = todaySamples.reduce((sum, sample) => sum + Number(sample.energy_delta_kwh || 0), 0);
    const totalSupplyTodayKwh = todaySamples.reduce((sum, sample) => sum + Number(sample.site_supply_kwh || 0), 0);
    const totalDemandTodayKwh = todaySamples.reduce((sum, sample) => sum + Number(sample.site_demand_kwh || 0), 0);
    const hourlyEnergyDeltaKwh = withLatest
        .filter((sample) => now - new Date(sample.timestamp) <= WINDOW_MS["1h"])
        .reduce((sum, sample) => sum + Number(sample.energy_delta_kwh || 0), 0);

    return {
        avg1mKw: round(avg1mKw, 6),
        avg5mKw: round(avg5mKw, 6),
        avg15mKw: round(avg15mKw, 6),
        peakTodayKw: round(peakTodayKw, 6),
        totalEnergyTodayKwh: round(totalEnergyTodayKwh, 6),
        totalSupplyTodayKwh: round(totalSupplyTodayKwh, 6),
        totalDemandTodayKwh: round(totalDemandTodayKwh, 6),
        hourlyEnergyDeltaKwh: round(hourlyEnergyDeltaKwh, 6),
        stabilityScore: avg15mKw ? round(1 - Math.min(stdDev(loads) / (avg15mKw || 1), 1), 4) : 0
    };
};

export const getCurrentPricing = async (latestSample, profile = null) => {
    const recentSamples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(180)
        .lean();

    const currentSample = latestSample || recentSamples[0] || null;

    const rollingStats = getRollingStats(recentSamples, currentSample);
    const baseRate = Number(profile?.energyPrice || DEFAULT_PRICE_TOKENS);
    const timeBand = getTimeBand(currentSample ? new Date(currentSample.timestamp) : new Date());
    const loadMultiplier = getLoadMultiplier(Number(currentSample?.instant_load_kw || 0), rollingStats.avg15mKw);
    const surgeMultiplier = getSurgeMultiplier(Number(currentSample?.instant_load_kw || 0));
    const stabilityDiscount = getStabilityDiscount(
        recentSamples
            .slice(0, 30)
            .map((sample) => Number(sample.instant_load_kw || 0))
    );

    const finalRatePerKwh = round(
        baseRate * timeBand.multiplier * loadMultiplier * surgeMultiplier * stabilityDiscount,
        4
    );

    const usdRate = round(finalRatePerKwh * 0.05, 4);
    const reasonCodes = [
        `time_band:${timeBand.name}`,
        `load:${loadMultiplier.toFixed(2)}x`,
        `surge:${surgeMultiplier.toFixed(2)}x`,
        `stability:${stabilityDiscount.toFixed(2)}x`
    ];

    return {
        success: true,
        energyPrice: finalRatePerKwh,
        base_rate: round(baseRate, 4),
        grid_reference_rate_usd: DEFAULT_GRID_RATE_USD,
        time_band: timeBand.name,
        time_multiplier: round(timeBand.multiplier, 4),
        load_multiplier: round(loadMultiplier, 4),
        surge_multiplier: round(surgeMultiplier, 4),
        stability_discount: round(stabilityDiscount, 4),
        final_rate_per_kwh: finalRatePerKwh,
        display_rate_usd: usdRate,
        reason_codes: reasonCodes
    };
};

export const buildSocketPayload = async (latestSample) => {
    const recentSamples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(180)
        .lean();
    const rollingStats = getRollingStats(recentSamples, latestSample);
    const pricing = await getCurrentPricing(latestSample);
    const now = Date.now();
    const freshnessMs = latestSample ? now - new Date(latestSample.timestamp).getTime() : null;

    return {
        timestamp: latestSample?.timestamp || new Date().toISOString(),
        deviceId: latestSample?.deviceId || "esp32-site-001",
        sourceType: latestSample?.sourceType || "aggregate",
        voltage: latestSample?.voltage_v || 0,
        current: latestSample?.current_ma || 0,
        power: latestSample?.power_mw || 0,
        energy: latestSample?.energy_mwh_total || 0,
        voltage_v: latestSample?.voltage_v || 0,
        current_ma: latestSample?.current_ma || 0,
        power_mw: latestSample?.power_mw || 0,
        power_w: latestSample?.power_w || 0,
        energy_mwh_total: latestSample?.energy_mwh_total || 0,
        energy_kwh_total: latestSample?.energy_kwh_total || 0,
        energy_delta_kwh: latestSample?.energy_delta_kwh || 0,
        produced: latestSample?.site_supply_kwh || 0,
        consumed: latestSample?.site_demand_kwh || 0,
        site_supply_kwh: latestSample?.site_supply_kwh || 0,
        site_demand_kwh: latestSample?.site_demand_kwh || 0,
        grid_balance_kwh: latestSample?.grid_balance_kwh || 0,
        solarOutput: latestSample?.sourceType === "solar" ? latestSample?.power_w || 0 : 0,
        windOutput: latestSample?.sourceType === "wind" ? latestSample?.power_w || 0 : 0,
        gridPrice: pricing.display_rate_usd,
        pricing,
        rolling: rollingStats,
        deviceStatus: freshnessMs !== null && freshnessMs <= DEVICE_FRESHNESS_MS ? "online" : "offline",
        freshnessMs
    };
};

export const getLegacyEnergyHistory = async () => {
    const samples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

    return samples
        .reverse()
        .map((sample) => ({
            timestamp: sample.timestamp,
            produced: round(sample.site_supply_kwh, 6),
            consumed: round(sample.site_demand_kwh, 6),
            batteryLevel: Math.max(0, Math.min(100, round(100 - (sample.instant_load_kw || 0) * 800, 2))),
            solar: sample.sourceType === "solar" ? round(sample.power_w, 4) : 0,
            wind: sample.sourceType === "wind" ? round(sample.power_w, 4) : 0,
            hydro: sample.sourceType === "hydro" ? round(sample.power_w, 4) : 0
        }));
};

export const getTelemetryHistory = async (window = "24h") => {
    const samples = await getRecentSamples({ window, limit: 1000 });
    return samples.map((sample) => ({
        timestamp: sample.timestamp,
        voltage_v: sample.voltage_v,
        current_ma: sample.current_ma,
        power_mw: sample.power_mw,
        power_w: sample.power_w,
        energy_kwh_total: sample.energy_kwh_total,
        energy_delta_kwh: sample.energy_delta_kwh,
        instant_load_kw: sample.instant_load_kw,
        site_demand_kwh: sample.site_demand_kwh,
        site_supply_kwh: sample.site_supply_kwh,
        grid_balance_kwh: sample.grid_balance_kwh,
        load_trend: sample.load_trend
    }));
};

export const getSiteSummary = async (userId = null) => {
    const latestSample = await getLatestSample();
    const recentSamples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(500)
        .lean();
    const rollingStats = getRollingStats(recentSamples, latestSample);
    const profile = userId ? await UserProfile.findOne({ user: userId }).lean() : null;
    const pricing = await getCurrentPricing(latestSample, profile);
    const socketPayload = await buildSocketPayload(latestSample);
    const totalTransactions = await Transaction.countDocuments();
    const totalListings = await EnergyListing.countDocuments();
    const producerCount = await Users.countDocuments({ userType: "prosumer" });
    const consumerCount = await Users.countDocuments({ userType: "consumer" });

    const currentPowerW = Number(latestSample?.power_w || 0);
    const alertState = currentPowerW >= 20
        ? "high_load"
        : currentPowerW >= 10
            ? "elevated_load"
            : "normal";

    const alerts = [];
    if (alertState === "high_load") {
        alerts.push({
            id: "high-load",
            type: "warning",
            message: "Site demand is above the configured high-load threshold.",
            time: "live"
        });
    }
    if (socketPayload.deviceStatus !== "online") {
        alerts.push({
            id: "device-offline",
            type: "warning",
            message: "Smart meter packets are stale. Device may be offline.",
            time: "live"
        });
    }
    if (alerts.length === 0) {
        alerts.push({
            id: "site-healthy",
            type: "success",
            message: "Site telemetry is stable and within the target load band.",
            time: "live"
        });
    }

    const energyMix = [
        { name: "Solar", value: latestSample?.sourceType === "solar" ? 100 : 0, color: "#fbbf24" },
        { name: "Wind", value: latestSample?.sourceType === "wind" ? 100 : 0, color: "#3b82f6" },
        { name: "Hydro", value: latestSample?.sourceType === "hydro" ? 100 : 0, color: "#06b6d4" },
        { name: "Grid", value: latestSample?.sourceType === "aggregate" || !latestSample?.sourceType ? 100 : 0, color: "#6b7280" }
    ];

    return {
        success: true,
        deviceStatus: socketPayload.deviceStatus,
        freshnessMs: socketPayload.freshnessMs,
        current: {
            voltage_v: latestSample?.voltage_v || 0,
            current_ma: latestSample?.current_ma || 0,
            power_mw: latestSample?.power_mw || 0,
            power_w: latestSample?.power_w || 0,
            instant_load_kw: latestSample?.instant_load_kw || 0,
            energy_mwh_total: latestSample?.energy_mwh_total || 0,
            energy_kwh_total: latestSample?.energy_kwh_total || 0,
            energy_delta_kwh: latestSample?.energy_delta_kwh || 0,
            load_trend: latestSample?.load_trend || "stable"
        },
        pricing,
        totals: {
            peak_power_today_kw: rollingStats.peakTodayKw,
            average_load_1m_kw: rollingStats.avg1mKw,
            average_load_5m_kw: rollingStats.avg5mKw,
            average_load_15m_kw: rollingStats.avg15mKw,
            total_energy_today_kwh: rollingStats.totalEnergyTodayKwh,
            total_supply_today_kwh: rollingStats.totalSupplyTodayKwh,
            total_demand_today_kwh: rollingStats.totalDemandTodayKwh,
            hourly_energy_delta_kwh: rollingStats.hourlyEnergyDeltaKwh,
            stability_score: rollingStats.stabilityScore
        },
        market: {
            totalTransactions,
            totalListings,
            totalProducers: producerCount,
            totalConsumers: consumerCount
        },
        alertState,
        alerts,
        energyMix
    };
};

export const getTelemetryLatest = async () => {
    const latestSample = await getLatestSample();
    if (!latestSample) {
        return { success: true, sample: null };
    }

    return {
        success: true,
        sample: await buildSocketPayload(latestSample)
    };
};

export const getSiteForecast = async (hours = 24, userId = null) => {
    const recentSamples = await TelemetrySample.find()
        .sort({ timestamp: -1 })
        .limit(500)
        .lean();
    const latestSample = recentSamples[0] || null;
    const profile = userId ? await UserProfile.findOne({ user: userId }).lean() : null;
    const pricing = await getCurrentPricing(latestSample, profile);
    const rollingStats = getRollingStats(recentSamples, latestSample);

    const baseLoadKw = rollingStats.avg15mKw || Number(latestSample?.instant_load_kw || 0);
    const now = latestSample ? new Date(latestSample.timestamp) : new Date();
    const forecast = [];

    for (let index = 1; index <= hours; index += 1) {
        const timestamp = new Date(now.getTime() + index * 60 * 60 * 1000);
        const hour = timestamp.getHours();
        const timeBand = getTimeBand(timestamp);
        const dayFactor = hour >= 17 && hour < 22 ? 1.18 : hour >= 0 && hour < 6 ? 0.82 : 1;
        const trendFactor = latestSample?.load_trend === "rising" ? 1.04 : latestSample?.load_trend === "falling" ? 0.96 : 1;
        const forecastDemandKw = round(baseLoadKw * dayFactor * trendFactor, 6);
        const forecastDemandKwh = round(forecastDemandKw, 6);
        const forecastSupplyKwh = round(
            forecastDemandKwh * (latestSample?.sourceType === "solar" && hour >= 7 && hour < 18 ? 1.06 : 1),
            6
        );
        const forecastPrice = round(
            pricing.base_rate * timeBand.multiplier * getLoadMultiplier(forecastDemandKw, rollingStats.avg15mKw || forecastDemandKw),
            4
        );

        forecast.push({
            timestamp: timestamp.toISOString(),
            hour,
            demand_kwh: forecastDemandKwh,
            supply_kwh: forecastSupplyKwh,
            balance_kwh: round(forecastSupplyKwh - forecastDemandKwh, 6),
            price_tokens_per_kwh: forecastPrice,
            confidence: recentSamples.length >= 24 ? "medium" : "low"
        });
    }

    return {
        success: true,
        baseline_load_kw: round(baseLoadKw, 6),
        forecast
    };
};

export const getMarketplaceOpportunities = async (userId = null) => {
    const summary = await getSiteSummary(userId);
    const forecast = await getSiteForecast(12, userId);
    const opportunities = [];
    const currentPrice = Number(summary.pricing.final_rate_per_kwh || DEFAULT_PRICE_TOKENS);

    if (summary.alertState === "high_load") {
        opportunities.push({
            id: "high-load-window",
            title: "High Load Window",
            type: "buy",
            message: "Current site load is elevated. Buy energy during the next low-price window.",
            priority: "high",
            recommendedPrice: round(currentPrice * 0.96, 4)
        });
    }

    const cheapestWindow = [...forecast.forecast].sort(
        (left, right) => left.price_tokens_per_kwh - right.price_tokens_per_kwh
    )[0];
    if (cheapestWindow) {
        opportunities.push({
            id: "cheapest-forecast-window",
            title: "Lowest Forecast Tariff",
            type: "buy",
            message: `Best expected price arrives at ${new Date(cheapestWindow.timestamp).toLocaleTimeString()}.`,
            priority: "medium",
            recommendedPrice: cheapestWindow.price_tokens_per_kwh
        });
    }

    const strongestWindow = [...forecast.forecast].sort(
        (left, right) => right.balance_kwh - left.balance_kwh
    )[0];
    if (strongestWindow && strongestWindow.balance_kwh > 0) {
        opportunities.push({
            id: "balanced-export-window",
            title: "Balanced Export Window",
            type: "sell",
            message: `Forecast balance improves around ${new Date(strongestWindow.timestamp).toLocaleTimeString()}.`,
            priority: "low",
            recommendedPrice: round(strongestWindow.price_tokens_per_kwh * 1.03, 4)
        });
    }

    return {
        success: true,
        opportunities
    };
};
