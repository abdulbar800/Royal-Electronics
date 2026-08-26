const Joi = require('joi');


const validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(50).required()
            .messages({
                'string.min': 'Name must be at least 3 characters',
                'string.max': 'Name cannot exceed 50 characters',
                'any.required': 'Name is required'
            }),
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please enter a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string().min(6).max(30).required()
            .messages({
                'string.min': 'Password must be at least 6 characters',
                'string.max': 'Password cannot exceed 30 characters',
                'any.required': 'Password is required'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// LOGIN VALIDATION
// ============================================
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please enter a valid email',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required()
            .messages({
                'any.required': 'Password is required'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// PRODUCT VALIDATION
// ============================================
const validateProduct = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required()
            .messages({
                'string.min': 'Product name must be at least 3 characters',
                'string.max': 'Product name cannot exceed 100 characters',
                'any.required': 'Product name is required'
            }),
        description: Joi.string().min(10).max(1000).required()
            .messages({
                'string.min': 'Description must be at least 10 characters',
                'string.max': 'Description cannot exceed 1000 characters',
                'any.required': 'Description is required'
            }),
        price: Joi.number().min(0).required()
            .messages({
                'number.min': 'Price cannot be negative',
                'any.required': 'Price is required'
            }),
        category: Joi.string().required()
            .messages({
                'any.required': 'Category is required'
            }),
        brand: Joi.string().required()
            .messages({
                'any.required': 'Brand is required'
            }),
        stock: Joi.number().min(0).required()
            .messages({
                'number.min': 'Stock cannot be negative',
                'any.required': 'Stock is required'
            }),
        images: Joi.array().items(Joi.string()),
        video: Joi.string().allow(null, '')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// ORDER VALIDATION - WITH UPI
// ============================================
const validateOrder = (req, res, next) => {
    const schema = Joi.object({
        shippingAddress: Joi.object({
            address: Joi.string().required()
                .messages({
                    'any.required': 'Address is required'
                }),
            city: Joi.string().required()
                .messages({
                    'any.required': 'City is required'
                }),
            state: Joi.string().required()
                .messages({
                    'any.required': 'State is required'
                }),
            zipCode: Joi.string().required()
                .messages({
                    'any.required': 'Zip Code is required'
                }),
            country: Joi.string().required()
                .messages({
                    'any.required': 'Country is required'
                })
        }).required(),
        paymentMethod: Joi.string().valid('Credit Card', 'Debit Card', 'PayPal', 'Razorpay', 'COD', 'UPI').required()
            .messages({
                'any.only': 'Payment method must be one of: Credit Card, Debit Card, PayPal, Razorpay, COD, UPI',
                'any.required': 'Payment method is required'
            }),
        taxPrice: Joi.number().min(0).default(0),
        shippingPrice: Joi.number().min(0).default(0),
        couponCode: Joi.string().allow(null, ''),
        upiId: Joi.string().allow(null, '')
            .when('paymentMethod', {
                is: 'UPI',
                then: Joi.string().required()
                    .messages({
                        'any.required': 'UPI ID is required for UPI payment'
                    })
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// COUPON VALIDATION
// ============================================
const validateCoupon = (req, res, next) => {
    const schema = Joi.object({
        code: Joi.string().min(3).max(20).required()
            .messages({
                'string.min': 'Coupon code must be at least 3 characters',
                'string.max': 'Coupon code cannot exceed 20 characters',
                'any.required': 'Coupon code is required'
            }),
        description: Joi.string().min(3).max(200).required()
            .messages({
                'string.min': 'Description must be at least 3 characters',
                'string.max': 'Description cannot exceed 200 characters',
                'any.required': 'Description is required'
            }),
        discountType: Joi.string().valid('percentage', 'fixed').required()
            .messages({
                'any.only': 'Discount type must be percentage or fixed',
                'any.required': 'Discount type is required'
            }),
        discountValue: Joi.number().min(0).required()
            .messages({
                'number.min': 'Discount value cannot be negative',
                'any.required': 'Discount value is required'
            }),
        minOrderAmount: Joi.number().min(0).default(0),
        maxDiscount: Joi.number().min(0).allow(null),
        expiryDate: Joi.date().required()
            .messages({
                'any.required': 'Expiry date is required'
            }),
        usageLimit: Joi.number().min(1).default(1)
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// REVIEW VALIDATION
// ============================================
const validateReview = (req, res, next) => {
    const schema = Joi.object({
        rating: Joi.number().min(1).max(5).required()
            .messages({
                'number.min': 'Rating must be at least 1',
                'number.max': 'Rating cannot exceed 5',
                'any.required': 'Rating is required'
            }),
        comment: Joi.string().min(2).max(500).required()
            .messages({
                'string.min': 'Comment must be at least 2 characters',
                'string.max': 'Comment cannot exceed 500 characters',
                'any.required': 'Comment is required'
            })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};

// ============================================
// EXPORT ALL VALIDATORS
// ============================================
module.exports = {
    validateRegister,
    validateLogin,
    validateProduct,
    validateOrder,
    validateCoupon,
    validateReview
};