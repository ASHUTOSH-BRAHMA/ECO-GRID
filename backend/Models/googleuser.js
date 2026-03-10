import mongoose from "mongoose";

const googleSchema = mongoose.Schema({
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
    image:{
       type:String
    },
    userType: {
        type: String,
        required: true,
        enum: ['prosumer', 'consumer', 'utility'],
        default:'consumer'
    },
    onboardingCompleted: { type: Boolean, default: false }, // ✅ Change from isNewUser
    createdAt: {
        type: Date,
        default: Date.now
    } 
});

export default mongoose.model('googleusers', googleSchema);

