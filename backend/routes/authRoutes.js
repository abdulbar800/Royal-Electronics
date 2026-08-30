const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    getUsers,
    sendResetOTP,
    verifyResetOTP
} = require('../controllers/authController');
const {
    sendVerificationOTP,
    verifyOTP,
    resendOTP
} = require('../controllers/emailController');

const {
    validateRegister,
    validateLogin
} = require('../middleware/validation');

//  NAYA: OTP-specific rate limiter (rateLimiter.js mein add kiya)
const { otpLimiter } = require('../middleware/rateLimiter');


router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

// FIX: OTP routes pe ab dedicated rate-limiter lagi hai
router.post('/send-otp', otpLimiter, sendVerificationOTP);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);

router.post('/send-reset-otp', otpLimiter, sendResetOTP);
router.post('/verify-reset-otp', otpLimiter, verifyResetOTP);

// ============================================
// PROTECTED ROUTES
// ============================================

router.get('/users', protect, admin, getUsers);

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                isTwoFactorEnabled: user.isTwoFactorEnabled
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.put('/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this user'
            });
        }

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error(' Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.put('/users/:id/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        //FIX: password field select:false hai ab, explicitly select karo
        const user = await User.findById(req.params.id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to change this user\'s password'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;