const rateLimit = require('express-rate-limit');



// GENERAL API LIMITER
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5000 : 10000,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (req.path.startsWith('/api/admin')) return true;
        if (req.path.startsWith('/api/products') && req.method === 'POST') {
            return req.user && req.user.role === 'admin';
        }
        return false;
    }
});

//  LOGIN LIMITER
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 500, // ✅ 100 -> 20 (tighter for brute-force)
    message: {
        success: false,
        message: 'Too many login attempts, please try after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// REGISTER LIMITER
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 20 : 200, // ✅ 50 -> 20
    message: {
        success: false,
        message: 'Too many registration attempts, please try after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//  NAYA: OTP LIMITER (send-otp, verify-otp, send-reset-otp, verify-reset-otp
// - sab per-endpoint bruteforce/spam se bachane ke liye)
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 200,
    message: {
        success: false,
        message: 'Too many OTP requests, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//  PRODUCT CREATE LIMITER (Admin ke liye alag)
const productCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 500,
    message: {
        success: false,
        message: 'Too many product creation attempts, please try after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.user && req.user.role === 'admin';
    }
});

// ORDER CREATE LIMITER
const orderCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 1000,
    message: {
        success: false,
        message: 'Too many order attempts, please try after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    limiter,
    loginLimiter,
    registerLimiter,
    otpLimiter,
    productCreateLimiter,
    orderCreateLimiter
};