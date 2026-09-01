const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/sendEmail');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        const otp = generateOTP();

        await EmailVerification.findOneAndDelete({ email });
        await EmailVerification.create({
            email,
            otp,
            attempts: 0
        });

        console.log('=================================');
        console.log('📧 EMAIL VERIFICATION OTP');
        console.log('=================================');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 OTP: ${otp}`);
        console.log('=================================');

        const emailSent = await sendOTPEmail(user.email, otp, 'register');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'OTP generated but email failed'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const record = await EmailVerification.findOne({ email, otp });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (record.attempts >= record.maxAttempts) {
            await EmailVerification.findOneAndDelete({ email });
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request new OTP'
            });
        }

        record.attempts += 1;
        await record.save();

        const user = await User.findOne({ email });
        if (user) {
            user.isEmailVerified = true;
            user.emailVerifiedAt = Date.now();
            await user.save();
        }

        await EmailVerification.findOneAndDelete({ email });

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        await EmailVerification.findOneAndDelete({ email });

        const otp = generateOTP();

        await EmailVerification.create({
            email,
            otp,
            attempts: 0
        });

        console.log('=================================');
        console.log('RESEND OTP');
        console.log('=================================');
        console.log(`Email: ${email}`);
        console.log(`New OTP: ${otp}`);
        console.log('=================================');

        const emailSent = await sendOTPEmail(user.email, otp, 'register');

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'OTP generated but email failed'
            });
        }

        res.json({
            success: true,
            message: 'New OTP sent successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { sendVerificationOTP, verifyOTP, resendOTP };