const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');


router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Notification route is working!' });
});


router.get('/', protect, (req, res) => {
    res.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        message: 'Notification route working'
    });
});

// protect + admin 
router.post('/admin', protect, admin, (req, res) => {
    res.status(201).json({
        success: true,
        message: ' Notification created successfully (TEST)',
        notification: {
            _id: 'test_' + Date.now(),
            title: req.body.title || 'Test Notification',
            message: req.body.message || 'This is a test',
            type: req.body.type || 'system',
            isRead: false,
            createdAt: new Date().toISOString()
        }
    });
});

module.exports = router;