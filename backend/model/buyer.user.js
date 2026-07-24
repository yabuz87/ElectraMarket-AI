import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^\+?[0-9]\d{1,14}$/,
    },
    history: {
        type: Object,
        
    },
    favourites:{
        productId:[],
        count:{type:Number,default:0}


    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    preferences: {
        type: Object,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationTokenHash: {
        type: String,
        select: false,
    },
    verificationTokenExpiresAt: {
        type: Date,
        select: false,
    },
    activityLogs: {
        type: Array,
        default: [],
    },
    referralCode: {
        type: String,
        default:"0303"
    },
    cart:{
        type:Object,
    }
});

export default mongoose.model("Buyer", userSchema);
