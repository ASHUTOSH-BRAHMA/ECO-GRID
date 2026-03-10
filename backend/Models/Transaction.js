import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    },
    type: {
        type: String,
        enum: ['sold', 'bought'],
        required: true
    },
    energyKwh: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EnergyListing',
        required: false
    },
    listingTitle: {
        type: String,
        default: ''
    },
    txHash: {
        type: String,
        default: ''
    },
    counterparty: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Transaction', TransactionSchema);
