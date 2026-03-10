import mongoose from "mongoose";

const EnergyDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false // Optional for dummy data generator initially, or tie it to the system
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    produced: {
        type: Number,
        required: true,
        default: 0
    },
    consumed: {
        type: Number,
        required: true,
        default: 0
    },
    batteryLevel: {
        type: Number,
        default: 100
    },
    solar: {
        type: Number,
        default: 0
    },
    wind: {
        type: Number,
        default: 0
    },
    hydro: {
        type: Number,
        default: 0
    }
});

export default mongoose.model('EnergyData', EnergyDataSchema);
