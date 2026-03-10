import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true,
        enum: ['prosumer', 'consumer', 'utility']
    },
    onboardingCompleted: { type: Boolean, default: false }, // ✅ Change from isNewUser
    createdAt: {
        type: Date,
        default: Date.now
    } 
});

export default mongoose.model('Users', UserSchema);
