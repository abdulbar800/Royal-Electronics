const EmailVerification = require('../models/EmailVerification');
const User = require('../models/User');
const { sendEmail } = require('../utils/sendEmail'); // FIX: destructure karna zaroori tha,
                                                       // kyunki utils/sendEmail.js { sendEmail, sendOTPEmail }
                                                       // export karta hai, function seedha nahi

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send Email Verification OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendVerificationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Save OTP in database
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

        // Send OTP via email
        const message = `
            <h2>Email Verification</h2>
            <p>Your OTP for email verification is:</p>
            <h1 style="color: #e94560; font-size: 32px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br/>Royal Electronics Team</p>
        `;

        // FIX: sendEmail(to, subject, html) - utils/sendEmail.js ka signature
        // 3 positional args leta hai, object nahi
        await sendEmail(user.email, 'Email Verification OTP - Royal Electronics', message);

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

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find OTP record
        const record = await EmailVerification.findOne({ email, otp });

        if (!record) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check attempts
        if (record.attempts >= record.maxAttempts) {
            await EmailVerification.findOneAndDelete({ email });
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request new OTP'
            });
        }

        // Increment attempts
        record.attempts += 1;
        await record.save();

        // Verify user
        const user = await User.findOne({ email });
        if (user) {
            user.isEmailVerified = true;
            user.emailVerifiedAt = Date.now();
            await user.save();
        }

        // Delete OTP record
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

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
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

        // Delete old OTP
        await EmailVerification.findOneAndDelete({ email });

        // Generate new OTP
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

        // Send new OTP via email
        const message = `
            <h2>Resend OTP - Email Verification</h2>
            <p>Your new OTP is:</p>
            <h1 style="color: #e94560; font-size: 32px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Thanks,<br/>Royal Electronics Team</p>
        `;

        // FIX: same signature fix
        await sendEmail(user.email, 'Resend OTP - Royal Electronics', message);

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