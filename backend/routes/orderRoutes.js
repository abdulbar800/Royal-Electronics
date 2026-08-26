const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    cancelPendingOrder,
    confirmPayment
} = require('../controllers/orderController');

// CREATE ORDER - Razorpay / COD
router.post('/', protect, createOrder);

//  GET ALL MY ORDERS
router.get('/myorders', protect, getMyOrders);

// CANCEL PENDING (UNPAID) ORDER - payment modal closed/failed
// NOTE: ye route '/:id' se PEHLE hona zaroori hai, warna '/:id' isko match kar lega
router.post('/:id/cancel-pending', protect, cancelPendingOrder);

// CONFIRM PAYMENT (Razorpay Success Callback)
router.post('/:orderId/confirm-payment', protect, confirmPayment);

//  GET ORDER BY ID
router.get('/:id', protect, getOrderById);

// UPDATE ORDER STATUS (Admin Only)
router.put('/:id/status', protect, admin, updateOrderStatus);

// PDATE PAYMENT STATUS
router.put('/:id/pay', protect, updatePaymentStatus);

// CANCEL ORDER
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;