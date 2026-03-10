import mongoose from "mongoose";

const { Schema, model } = mongoose;

const EnergyListingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Solar', 'Wind', 'Hydro', 'Biomass']
    },
    icon: {
        type: String,
        default: "☀️"
    },
    energySource: {
        type: String,
        enum: ['residential', 'commercial', 'industrial', 'community'],
        default: 'residential'
    },
    certifications: [{
        type: String
    }],
    availability: {
        type: String,
        enum: ['available', 'limited', 'sold_out'],
        default: 'available'
    },
    producer: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const EnergyListing = model("EnergyListing", EnergyListingSchema);
export default EnergyListing; 