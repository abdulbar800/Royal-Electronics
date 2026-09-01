const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: String,
    price: Number,
    image: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    stock: Number
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Cart', cartSchema);