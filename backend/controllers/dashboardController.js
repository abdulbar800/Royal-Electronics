const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

// @desc    Get Dashboard Statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        const [
            totalOrders,
            totalUsers,
            totalProducts,
            totalRevenue,
            todayOrders,
            todayRevenue,
            monthOrders,
            monthRevenue,
            previousMonthRevenue,
            pendingOrders,
            cancelledOrders,
            lowStockProducts,
            recentOrders,
            topProducts,
            totalStock,
            productStockList
        ] = await Promise.all([
            // Total orders - Cancelled ko exclude karo
            Order.countDocuments({ orderStatus: { $ne: 'Cancelled' } }),
            // Total users
            User.countDocuments(),
            // Total products
            Product.countDocuments(),
            // Total revenue - Cancelled ko exclude karo
            Order.aggregate([
                { $match: { isPaid: true, orderStatus: { $ne: 'Cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            // Today's orders - Cancelled ko exclude karo
            Order.countDocuments({ 
                createdAt: { $gte: startOfToday },
                orderStatus: { $ne: 'Cancelled' }
            }),
            // Today's revenue - Cancelled ko exclude karo
            Order.aggregate([
                { 
                    $match: { 
                        isPaid: true, 
                        createdAt: { $gte: startOfToday },
                        orderStatus: { $ne: 'Cancelled' }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            // Month orders - Cancelled ko exclude karo
            Order.countDocuments({ 
                createdAt: { $gte: startOfMonth },
                orderStatus: { $ne: 'Cancelled' }
            }),
            // Month revenue - Cancelled ko exclude karo
            Order.aggregate([
                { 
                    $match: { 
                        isPaid: true, 
                        createdAt: { $gte: startOfMonth },
                        orderStatus: { $ne: 'Cancelled' }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            // Previous month revenue - Cancelled ko exclude karo
            Order.aggregate([
                { 
                    $match: { 
                        isPaid: true, 
                        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
                        orderStatus: { $ne: 'Cancelled' }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            // Pending orders
            Order.countDocuments({ orderStatus: 'Pending' }),
            // Cancelled orders
            Order.countDocuments({ orderStatus: 'Cancelled' }),
            // Low stock products (stock < 10)
            Product.countDocuments({ stock: { $lt: 10 } }),
            // Recent orders - Cancelled ko exclude karo
            Order.find({ orderStatus: { $ne: 'Cancelled' } })
                .populate('user', 'name email')
                .sort({ createdAt: -1 })
                .limit(10),
            // Top selling products - Cancelled ko exclude karo
            Order.aggregate([
                { $match: { isPaid: true, orderStatus: { $ne: 'Cancelled' } } },
                { $unwind: '$orderItems' },
                {
                    $group: {
                        _id: '$orderItems.name',
                        totalSold: { $sum: '$orderItems.quantity' },
                        totalRevenue: { 
                            $sum: { 
                                $multiply: ['$orderItems.price', '$orderItems.quantity'] 
                            }
                        }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 5 }
            ]),
            // Total stock
            Product.aggregate([
                { $group: { _id: null, totalStock: { $sum: '$stock' } } }
            ]),
            // Product stock list
            Product.find()
                .select('name stock category')
                .sort({ stock: 1 })
        ]);

        // Previous Month Comparison
        const previousMonthRevenueValue = previousMonthRevenue[0]?.total || 0;
        const currentMonthRevenue = monthRevenue[0]?.total || 0;

        let revenueGrowth = 0;
        if (previousMonthRevenueValue === 0 && currentMonthRevenue === 0) {
            revenueGrowth = 0;
        } else if (previousMonthRevenueValue === 0) {
            revenueGrowth = 100;
        } else {
            revenueGrowth = Math.round(((currentMonthRevenue - previousMonthRevenueValue) / previousMonthRevenueValue) * 100);
        }

        // Monthly Revenue Data
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const revenue = await Order.aggregate([
                {
                    $match: {
                        isPaid: true,
                        createdAt: { $gte: start, $lte: end },
                        orderStatus: { $ne: 'Cancelled' }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]);

            monthlyRevenue.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: revenue[0]?.total || 0
            });
        }

        // Last 7 Days Data
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));

            const orders = await Order.countDocuments({
                createdAt: { $gte: start, $lte: end },
                orderStatus: { $ne: 'Cancelled' }
            });

            const revenue = await Order.aggregate([
                {
                    $match: {
                        isPaid: true,
                        createdAt: { $gte: start, $lte: end },
                        orderStatus: { $ne: 'Cancelled' }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]);

            dailyData.push({
                date: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                orders: orders || 0,
                revenue: revenue[0]?.total || 0
            });
        }

        res.json({
            success: true,
            stats: {
                overview: {
                    totalOrders: totalOrders || 0,
                    totalUsers: totalUsers || 0,
                    totalProducts: totalProducts || 0,
                    totalRevenue: totalRevenue[0]?.total || 0
                },
                today: {
                    orders: todayOrders || 0,
                    revenue: todayRevenue[0]?.total || 0
                },
                month: {
                    orders: monthOrders || 0,
                    revenue: currentMonthRevenue,
                    revenueGrowth: revenueGrowth,
                    previousMonthRevenue: previousMonthRevenueValue
                },
                pendingOrders: pendingOrders || 0,
                cancelledOrders: cancelledOrders || 0,
                lowStockProducts: lowStockProducts || 0,
                totalStock: totalStock[0]?.totalStock || 0,
                productStockList: productStockList || [],
                recentOrders: recentOrders || [],
                topProducts: topProducts || [],
                dailyData: dailyData,
                monthlyRevenue: monthlyRevenue
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get Chart Data
// @route   GET /api/admin/dashboard/chart
// @access  Private/Admin
const getChartData = async (req, res) => {
    try {
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));

            const orders = await Order.countDocuments({
                createdAt: { $gte: start, $lte: end },
                orderStatus: { $ne: 'Cancelled' }
            });

            const revenue = await Order.aggregate([
                {
                    $match: {
                        isPaid: true,
                        createdAt: { $gte: start, $lte: end },
                        orderStatus: { $ne: 'Cancelled' }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]);

            dailyData.push({
                date: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                orders: orders || 0,
                revenue: revenue[0]?.total || 0
            });
        }

        res.json({
            success: true,
            data: dailyData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get Recent Orders
// @route   GET /api/admin/dashboard/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res) => {
    try {
        const orders = await Order.find({ orderStatus: { $ne: 'Cancelled' } })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get Category Revenue
// @route   GET /api/admin/dashboard/category-revenue
// @access  Private/Admin
const getCategoryRevenue = async (req, res) => {
    try {
        const categoryRevenue = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderItems.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
                    totalSold: { $sum: '$orderItems.quantity' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.json({
            success: true,
            data: categoryRevenue
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getStats,
    getChartData,
    getRecentOrders,
    getCategoryRevenue
};
