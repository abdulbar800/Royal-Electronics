const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: String
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Credit Card', 'Debit Card', 'PayPal', 'Razorpay', 'COD', 'UPI', 'RAZORPAY']
    },
    upiId: {
        type: String,
        default: null
    },
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String
    },
    subtotalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    discountPrice: {
        type: Number,
        required: true,
        default: 0
    },
    couponApplied: {
        code: String,
        discountAmount: {
            type: Number,
            default: 0
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon'
        }
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: Date,
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: Date,
    trackingNumber: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);