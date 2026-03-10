import mongoose from "mongoose";

const { Schema, model } = mongoose;

const UserProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    location: {
        type: String,
        required: true
    },
    energyUsage: {
        type: Number,
        required: true
    },
    hasSolarPanels: {
        type: Boolean,
        required: true
    },
    walletAddress: {
        type: String,
        default: ""
    },
    energyPrice: {
        type: Number,
        default: 2.0,
        min: 0.1,
        max: 10.0
    }
});

const UserProfile = model("UserProfile", UserProfileSchema);
export default UserProfile;
