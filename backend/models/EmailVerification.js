const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    }
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);