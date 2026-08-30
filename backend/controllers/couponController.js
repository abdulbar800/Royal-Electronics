const Coupon = require('../models/Coupon');
const Order = require('../models/order');


// ======================================================
// CREATE COUPON
// ======================================================
const createCoupon = async (req, res) => {

    try {

        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            expiryDate,
            usageLimit
        } = req.body;


        const exists = await Coupon.findOne({
            code: code.toUpperCase()
        });


        if (exists) {

            return res.status(400).json({

                success: false,

                message:
                    'Coupon code already exists'

            });
        }


        const coupon = await Coupon.create({

            code: code.toUpperCase(),

            description,

            discountType,

            discountValue,

            minOrderAmount:
                minOrderAmount || 0,

            maxDiscount:
                maxDiscount || null,

            expiryDate,

            usageLimit:
                usageLimit || 1,

            isActive: true,

            createdBy: req.user._id

        });


        res.status(201).json({

            success: true,

            coupon

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// GET ALL COUPONS
// ======================================================
const getCoupons = async (req, res) => {

    try {

        const coupons = await Coupon.find()
            .populate(
                'createdBy',
                'name email'
            )
            .sort({
                createdAt: -1
            });


        res.json({

            success: true,

            count: coupons.length,

            coupons

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// GET COUPON BY ID
// ======================================================
const getCouponById = async (req, res) => {

    try {

        const coupon = await Coupon.findById(
            req.params.id
        ).populate(
            'createdBy',
            'name email'
        );


        if (!coupon) {

            return res.status(404).json({

                success: false,

                message: 'Coupon not found'

            });
        }


        res.json({

            success: true,

            coupon

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// UPDATE COUPON
// ======================================================
const updateCoupon = async (req, res) => {

    try {

        const coupon =
            await Coupon.findById(
                req.params.id
            );


        if (!coupon) {

            return res.status(404).json({

                success: false,

                message: 'Coupon not found'

            });
        }


        const updatedCoupon =
            await Coupon.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );


        res.json({

            success: true,

            coupon: updatedCoupon

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// DELETE COUPON
// ======================================================
const deleteCoupon = async (req, res) => {

    try {

        const coupon =
            await Coupon.findById(
                req.params.id
            );


        if (!coupon) {

            return res.status(404).json({

                success: false,

                message: 'Coupon not found'

            });
        }


        await coupon.deleteOne();


        res.json({

            success: true,

            message:
                'Coupon deleted successfully'

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// VALIDATE COUPON
// ======================================================
const validateCoupon = async (req, res) => {

    try {

        const {
            code,
            orderAmount
        } = req.body;


        if (!code) {

            return res.status(400).json({

                success: false,

                message:
                    'Coupon code is required'

            });
        }


        const coupon =
            await Coupon.findOne({

                code:
                    code.toUpperCase(),

                isActive: true

            });


        if (!coupon) {

            return res.status(404).json({

                success: false,

                message:
                    'Invalid coupon code'

            });
        }


        // Start date
        if (
            new Date() <
            new Date(coupon.startDate)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Coupon is not active yet'

            });
        }


        // Expiry
        if (
            new Date() >
            new Date(coupon.expiryDate)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Coupon has expired'

            });
        }


        // Usage
        if (
            coupon.usedCount >=
            coupon.usageLimit
        ) {

            return res.status(400).json({

                success: false,

                message:
                    'Coupon usage limit reached'

            });
        }


        // Minimum amount
        if (
            Number(orderAmount) <
            coupon.minOrderAmount
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Minimum order amount should be ₹${coupon.minOrderAmount}`

            });
        }


        // Calculate discount
        let discountAmount = 0;


        if (
            coupon.discountType ===
            'percentage'
        ) {

            discountAmount =
                (
                    Number(orderAmount) *
                    coupon.discountValue
                ) / 100;


            if (
                coupon.maxDiscount !== null &&
                coupon.maxDiscount !== undefined &&
                discountAmount >
                    coupon.maxDiscount
            ) {

                discountAmount =
                    coupon.maxDiscount;
            }


        } else {

            discountAmount =
                coupon.discountValue;

        }


        // Never discount more than order
        if (
            discountAmount >
            Number(orderAmount)
        ) {

            discountAmount =
                Number(orderAmount);
        }


        discountAmount =
            Math.round(
                discountAmount * 100
            ) / 100;


        res.json({

            success: true,

            valid: true,

            coupon: {

                code: coupon.code,

                description:
                    coupon.description,

                discountType:
                    coupon.discountType,

                discountValue:
                    coupon.discountValue

            },

            discountAmount

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


// ======================================================
// APPLY COUPON
// ======================================================
// Old endpoint kept for compatibility.
// Checkout.js no longer uses this endpoint.
// Coupon is now applied during order creation.
// ======================================================
const applyCoupon = async (req, res) => {

    return res.status(400).json({

        success: false,

        message:
            'Coupon is applied automatically when the order is placed. Please place the order again.'

    });
};


// ======================================================
// TOGGLE COUPON STATUS
// ======================================================
const toggleCouponStatus = async (req, res) => {

    try {

        const coupon =
            await Coupon.findById(
                req.params.id
            );


        if (!coupon) {

            return res.status(404).json({

                success: false,

                message:
                    'Coupon not found'

            });
        }


        coupon.isActive =
            !coupon.isActive;


        await coupon.save();


        res.json({

            success: true,

            message:
                `Coupon ${
                    coupon.isActive
                        ? 'activated'
                        : 'deactivated'
                } successfully`,

            coupon

        });


    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


module.exports = {

    createCoupon,

    getCoupons,

    getCouponById,

    updateCoupon,

    deleteCoupon,

    validateCoupon,

    applyCoupon,

    toggleCouponStatus

};
