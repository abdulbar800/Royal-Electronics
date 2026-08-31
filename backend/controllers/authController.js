const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/sendEmail');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is not defined!');
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ============================================
// REGISTER - OTP bhi bhejega
// ============================================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isEmailVerified: false
        });

        // ✅ Generate OTP for email verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 600000; // 10 minutes
        user.resetOTPAttempts = 0;
        await user.save();

        console.log(`📧 Registration OTP for ${email}: ${otp}`);

        // ✅ Send OTP email
        const emailSent = await sendOTPEmail(email, otp);

        if (!emailSent) {
            console.log('⚠️ OTP generated but email failed');
        }

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                token: generateToken(user._id),
                message: 'Registration successful! Please verify your email with OTP.'
            });
        }
    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                message: `Too many failed login attempts. Account locked. Try again in ${minutesLeft} minute(s).`
            });
        }

        if (user.lockUntil && user.lockUntil <= Date.now()) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCK_DURATION_MS;
                user.failedLoginAttempts = 0;
                await user.save();
                return res.status(423).json({
                    message: `Too many failed login attempts. Account locked for 15 minutes.`
                });
            }

            await user.save();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;

        if (user.isTwoFactorEnabled) {
            await user.save();
            return res.json({
                success: true,
                requires2FA: true,
                userId: user._id,
                message: 'Password correct. Please enter your 2FA code.'
            });
        }

        user.lastLogin = Date.now();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            token: token
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-resetOTP -resetOTPExpires -resetOTPAttempts');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================================
// SEND RESET OTP (Forgot Password)
// ============================================
const sendResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 600000;
        user.resetOTPAttempts = 0;
        await user.save();

        console.log(`📧 Forgot Password OTP for ${email}: ${otp}`);

        const emailSent = await sendOTPEmail(email, otp);

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'OTP generated but email failed. Check email credentials.'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// VERIFY RESET OTP
// ============================================
const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });

        if (!user || !user.resetOTP || !user.resetOTPExpires) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        if (user.resetOTPExpires < Date.now()) {
            user.resetOTP = null;
            user.resetOTPExpires = null;
            user.resetOTPAttempts = 0;
            await user.save();
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        if (user.resetOTP !== otp) {
            user.resetOTPAttempts = (user.resetOTPAttempts || 0) + 1;

            if (user.resetOTPAttempts >= 5) {
                user.resetOTP = null;
                user.resetOTPExpires = null;
                user.resetOTPAttempts = 0;
                await user.save();
                return res.status(400).json({
                    success: false,
                    message: 'Too many incorrect attempts. Please request a new OTP.'
                });
            }

            await user.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${5 - user.resetOTPAttempts} attempts remaining.`
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOTP = null;
        user.resetOTPExpires = null;
        user.resetOTPAttempts = 0;
        user.failedLoginAttempts = 0; 
        user.lockUntil = null;
        
        // ✅ Agar email verify nahi hai toh verify kar do
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            user.emailVerifiedAt = Date.now();
        }
        
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUsers,
    sendResetOTP,
    verifyResetOTP
};