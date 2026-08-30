const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getStats,
    getChartData,
    getRecentOrders,
    getCategoryRevenue
} = require('../controllers/dashboardController');

// TEST ROUTE
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Dashboard route is working!'
    });
});

//  REAL DATA ROUTES
router.get('/dashboard/stats', protect, admin, getStats);
router.get('/dashboard/chart', protect, admin, getChartData);
router.get('/dashboard/recent-orders', protect, admin, getRecentOrders);
router.get('/dashboard/category-revenue', protect, admin, getCategoryRevenue);

module.exports = router;