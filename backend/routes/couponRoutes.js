const express = require('express');

const router = express.Router();

const {
    protect,
    admin
} = require('../middleware/authMiddleware');


const {

    createCoupon,

    getCoupons,

    getCouponById,

    updateCoupon,

    deleteCoupon,

    validateCoupon: validateCouponCode,

    applyCoupon,

    toggleCouponStatus

} = require('../controllers/couponController');


// Validation middleware
const {
    validateCoupon
} = require('../middleware/validation');


// ======================================================
// USER ROUTES
// ======================================================

router.post(
    '/validate',
    protect,
    validateCouponCode
);


// Old endpoint kept for compatibility
router.post(
    '/apply',
    protect,
    applyCoupon
);


// ======================================================
// ADMIN ROUTES
// ======================================================

router.post(
    '/',
    protect,
    admin,
    validateCoupon,
    createCoupon
);


router.get(
    '/',
    protect,
    admin,
    getCoupons
);


router.get(
    '/:id',
    protect,
    admin,
    getCouponById
);


router.put(
    '/:id',
    protect,
    admin,
    updateCoupon
);


router.delete(
    '/:id',
    protect,
    admin,
    deleteCoupon
);


router.put(
    '/:id/toggle',
    protect,
    admin,
    toggleCouponStatus
);


module.exports = router;