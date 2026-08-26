const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter } = require('../middleware/rateLimiter');
const {
    enableTwoFactor,
    verifyTwoFactor,
    verifyLoginToken,
    disableTwoFactor
} = require('../controllers/twoFactorController');

// TEST ROUTE
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '2FA route is working!'
    });
});


router.post('/enable', protect, enableTwoFactor);
router.post('/verify', protect, verifyTwoFactor);
router.post('/verify-login', otpLimiter, verifyLoginToken); 
router.delete('/disable', protect, disableTwoFactor);

module.exports = router;