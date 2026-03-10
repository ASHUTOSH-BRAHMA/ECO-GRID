import Transaction from '../Models/Transaction.js';
import UserProfile from '../Models/UserProfile.js';
import {
    validateTelemetryPayload,
    createTelemetrySample,
    getLegacyEnergyHistory,
    getCurrentPricing,
    getTelemetryLatest,
    getTelemetryHistory,
    getSiteSummary,
    getSiteForecast,
    getMarketplaceOpportunities,
    buildSocketPayload
} from '../Services/TelemetryService.js';

export const getEnergyData = async (req, res) => {
    try {
        const data = await getLegacyEnergyHistory();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching energy data", error: err.message });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const data = await Transaction.find().sort({ timestamp: -1 }).limit(50);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching transactions", error: err.message });
    }
};

// Get user's energy price
export const getUserEnergyPrice = async (req, res) => {
    try {
        const userId = req.user._id;
        const profile = await UserProfile.findOne({ user: userId });
        const pricing = await getCurrentPricing(null, profile);

        res.status(200).json(pricing);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching energy price", error: err.message });
    }
};

// Update user's energy price
export const updateUserEnergyPrice = async (req, res) => {
    try {
        const userId = req.user._id;
        const { energyPrice } = req.body;
        
        if (energyPrice === undefined || energyPrice < 0.1 || energyPrice > 10) {
            return res.status(400).json({ 
                message: "Invalid energy price. Must be between 0.1 and 10.0" 
            });
        }
        
        const profile = await UserProfile.findOneAndUpdate(
            { user: userId },
            { energyPrice: parseFloat(energyPrice) },
            { new: true, upsert: true }
        );

        const pricing = await getCurrentPricing(null, profile);

        res.status(200).json({
            ...pricing,
            message: "Base tariff updated successfully"
        });
    } catch (err) {
        res.status(500).json({ message: "Server error updating energy price", error: err.message });
    }
};

export const ingestEnergyTelemetry = async (req, res) => {
    try {
        if (process.env.DEVICE_API_KEY && req.body.apiKey !== process.env.DEVICE_API_KEY) {
            return res.status(401).json({ success: false, message: "Invalid device API key" });
        }

        const validation = validateTelemetryPayload(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.message });
        }

        const sample = await createTelemetrySample(req.body);
        const socketPayload = await buildSocketPayload(sample);
        const io = req.app.get('io');

        if (io) {
            io.to('energy-updates').emit('energy-data', socketPayload);
        }

        res.status(201).json({
            success: true,
            message: "Telemetry ingested",
            sample: socketPayload
        });
    } catch (err) {
        res.status(500).json({ message: "Server error ingesting telemetry", error: err.message });
    }
};

export const getLatestTelemetry = async (req, res) => {
    try {
        const latest = await getTelemetryLatest();
        res.status(200).json(latest);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching latest telemetry", error: err.message });
    }
};

export const getTelemetryHistoryController = async (req, res) => {
    try {
        const window = req.query.window || "24h";
        const history = await getTelemetryHistory(window);
        res.status(200).json({ success: true, window, history });
    } catch (err) {
        res.status(500).json({ message: "Server error fetching telemetry history", error: err.message });
    }
};

export const getSiteSummaryController = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const summary = await getSiteSummary(userId);
        res.status(200).json(summary);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching site summary", error: err.message });
    }
};

export const getSiteForecastController = async (req, res) => {
    try {
        const hours = Number(req.query.hours || 24);
        const userId = req.user?._id || null;
        const forecast = await getSiteForecast(hours, userId);
        res.status(200).json(forecast);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching site forecast", error: err.message });
    }
};

export const getMarketplaceOpportunitiesController = async (req, res) => {
    try {
        const userId = req.user?._id || null;
        const opportunities = await getMarketplaceOpportunities(userId);
        res.status(200).json(opportunities);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching marketplace opportunities", error: err.message });
    }
};
