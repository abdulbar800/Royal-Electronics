const TwoFactor = require('../models/TwoFactor');
const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

// Generate backup codes
const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push(code);
    }
    return codes;
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Enable 2FA
// @route   POST /api/2fa/enable
// @access  Private
const enableTwoFactor = async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Royal Electronics (${req.user.email})`
        });

        let twoFactor = await TwoFactor.findOne({ user: req.user._id });
        if (twoFactor) {
            twoFactor.secret = secret.base32;
            twoFactor.isEnabled = false;
            twoFactor.verified = false;
            twoFactor.backupCodes = [];
        } else {
            twoFactor = await TwoFactor.create({
                user: req.user._id,
                secret: secret.base32,
                isEnabled: false,
                verified: false,
                backupCodes: []
            });
        }

        const backupCodes = generateBackupCodes();
        twoFactor.backupCodes = backupCodes.map(code => ({
            code: code,
            used: false
        }));
        await twoFactor.save();

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            message: '2FA setup initiated - scan QR and verify to enable',
            secret: secret.base32,
            qrCode: qrCodeUrl,
            backupCodes: backupCodes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify 2FA Setup
// @route   POST /api/2fa/verify
// @access  Private
const verifyTwoFactor = async (req, res) => {
    try {
        const { token } = req.body;

        const twoFactor = await TwoFactor.findOne({ user: req.user._id });
        if (!twoFactor) {
            return res.status(404).json({
                success: false,
                message: '2FA not enabled'
            });
        }

        const verified = speakeasy.totp.verify({
            secret: twoFactor.secret,
            encoding: 'base32',
            token: token,
            window: 1 //  thoda time-drift allow karo (30 sec ka ek window)
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA code'
            });
        }

        twoFactor.verified = true;
        twoFactor.isEnabled = true;
        await twoFactor.save();

        const user = await User.findById(req.user._id);
        user.isTwoFactorEnabled = true;
        await user.save();

        res.json({
            success: true,
            message: '2FA verified and enabled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const verifyLoginToken = async (req, res) => {
    try {
        const { userId, token, backupCode } = req.body;

        if (!userId || (!token && !backupCode)) {
            return res.status(400).json({
                success: false,
                message: 'User ID and verification code are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const twoFactor = await TwoFactor.findOne({ user: userId });
        if (!twoFactor || !twoFactor.isEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA not enabled for this user'
            });
        }

        let verified = false;

        if (token) {
            verified = speakeasy.totp.verify({
                secret: twoFactor.secret,
                encoding: 'base32',
                token: token,
                window: 1
            });
        } else if (backupCode) {
            //  Backup code se bhi login allow karo (agar authenticator app access na ho)
            const codeEntry = twoFactor.backupCodes.find(
                c => c.code === backupCode.toUpperCase() && !c.used
            );
            if (codeEntry) {
                codeEntry.used = true;
                await twoFactor.save();
                verified = true;
            }
        }

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA code'
            });
        }

        //  2FA pass ho gaya - AB login complete karo, JWT do
        user.lastLogin = Date.now();
        user.loginCount += 1;
        await user.save();

        res.json({
            success: true,
            message: '2FA verified successfully',
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Disable 2FA
// @route   DELETE /api/2fa/disable
// @access  Private
const disableTwoFactor = async (req, res) => {
    try {
        const { token } = req.body;

        const twoFactor = await TwoFactor.findOne({ user: req.user._id });
        if (!twoFactor || !twoFactor.isEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }

        const verified = speakeasy.totp.verify({
            secret: twoFactor.secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA code'
            });
        }

        twoFactor.isEnabled = false;
        twoFactor.verified = false;
        await twoFactor.save();

        const user = await User.findById(req.user._id);
        user.isTwoFactorEnabled = false;
        await user.save();

        res.json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    enableTwoFactor,
    verifyTwoFactor,
    verifyLoginToken,
    disableTwoFactor
};