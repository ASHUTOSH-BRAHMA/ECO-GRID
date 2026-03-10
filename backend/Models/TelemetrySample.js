import mongoose from "mongoose";

const TelemetrySampleSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
            trim: true,
            default: "esp32-site-001"
        },
        sourceType: {
            type: String,
            default: "aggregate",
            trim: true
        },
        voltage: {
            type: Number,
            required: true
        },
        current: {
            type: Number,
            required: true
        },
        power: {
            type: Number,
            required: true
        },
        energy: {
            type: Number,
            required: true
        },
        voltage_v: {
            type: Number,
            required: true
        },
        current_ma: {
            type: Number,
            required: true
        },
        power_mw: {
            type: Number,
            required: true
        },
        energy_mwh_total: {
            type: Number,
            required: true
        },
        power_w: {
            type: Number,
            required: true
        },
        instant_load_kw: {
            type: Number,
            required: true
        },
        energy_kwh_total: {
            type: Number,
            required: true
        },
        energy_delta_kwh: {
            type: Number,
            default: 0
        },
        site_demand_kwh: {
            type: Number,
            default: 0
        },
        site_supply_kwh: {
            type: Number,
            default: 0
        },
        grid_balance_kwh: {
            type: Number,
            default: 0
        },
        load_trend: {
            type: String,
            default: "stable"
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        versionKey: false
    }
);

TelemetrySampleSchema.index({ deviceId: 1, timestamp: -1 });

export default mongoose.model("TelemetrySample", TelemetrySampleSchema);
