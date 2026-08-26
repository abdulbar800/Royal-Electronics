const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendEmail } = require('../utils/sendEmail');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// ======================================================
// RAZORPAY INIT
// ======================================================
console.log('========================================');
console.log('🔑 RAZORPAY KEYS CHECK:');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('📱 Key ID:', keyId ? `SET (${keyId.substring(0, 15)}...)` : '❌ MISSING');
console.log('📱 Key Secret:', keySecret ? 'SET' : '❌ MISSING');

if (keyId && keyId.startsWith('rzp_test_')) {
    console.log('TEST MODE: Test keys detected.');
} else if (keyId && keyId.startsWith('rzp_live_')) {
    console.log(' LIVE MODE: Live keys detected.');
} else {
    console.log(' Unknown key format.');
}

console.log('========================================');

let razorpay;
try {
    razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
    console.log(' Razorpay initialized successfully');
} catch (error) {
    console.error('❌ Razorpay initialization failed:', error.message);
    razorpay = null;
}

// ======================================================
// SEND ORDER CONFIRMATION EMAIL
// ======================================================
const sendOrderConfirmation = async (req, order) => {
    try {
        let discountHtml = '';

        if (order.couponApplied && order.discountPrice > 0) {
            discountHtml = `
                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="color: #2e7d32; margin: 0 0 8px 0;">
                        🏷️ Coupon <strong>${order.couponApplied.code}</strong> applied!
                    </p>
                    <p style="color: #2e7d32; margin: 0;">
                        You saved <strong>₹${order.discountPrice.toFixed(2)}</strong>
                    </p>
                </div>
            `;
        }

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 2px solid #e94560; padding-bottom: 20px; }
                    .logo { font-size: 28px; font-weight: bold; color: #e94560; }
                    .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .total { font-size: 24px; font-weight: bold; color: #e94560; }
                    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                    .payment-status { background-color: #e8f5e9; padding: 10px; border-radius: 8px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🛒 Royal Electronics</div>
                        <p style="color: #666;">Order Confirmation</p>
                    </div>
                    <h2 style="color: #333;">Thank You for Your Order!</h2>
                    <p>Hello <strong>${req.user.name}</strong>,</p>
                    <p>${order.isPaid
                        ? 'Your order has been placed and payment confirmed successfully.'
                        : 'Your order has been placed successfully.'}</p>
                    <div class="payment-status">
                        <p><strong>${order.isPaid ? '✅' : '⏳'} Payment Status:</strong> ${
                            order.isPaid
                                ? 'Paid'
                                : (order.paymentMethod === 'COD' ? 'Pay on Delivery' : 'Pending')
                        }</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        ${order.discountPrice > 0 ? `<p><strong>💰 Discount Applied:</strong> ₹${order.discountPrice.toFixed(2)}</p>` : ''}
                    </div>
                    <div class="order-details">
                        <p><strong>Order ID:</strong> ${order._id}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                        <p><strong>Subtotal:</strong> ₹${order.subtotalPrice.toFixed(2)}</p>
                        ${order.discountPrice > 0 ? `
                            <p style="color: #2e7d32;">
                                <strong>Discount:</strong> -₹${order.discountPrice.toFixed(2)}
                            </p>
                        ` : ''}
                        <p><strong>Shipping:</strong> ${order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice.toFixed(2)}`}</p>
                        <p><strong>Tax:</strong> ₹${order.taxPrice.toFixed(2)}</p>
                        <p><strong>Final Total Amount:</strong> <span class="total">₹${order.totalPrice.toFixed(2)}</span></p>
                    </div>
                    ${discountHtml}
                    <h3>Items Ordered:</h3>
                    <ul>
                        ${order.orderItems.map(item => `
                            <li>${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</li>
                        `).join('')}
                    </ul>
                    <p><strong>Shipping Address:</strong></p>
                    <p>${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}</p>
                    <div class="footer">
                        <p>© 2026 Royal Electronics. All rights reserved.</p>
                        <p>Thank you for shopping with us!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await sendEmail(
            req.user.email,
            `Order Confirmation #${order._id.toString().slice(-6)} - Royal Electronics`,
            emailHtml
        );

        console.log(' Confirmation email sent to:', req.user.email);
    } catch (error) {
        console.error(' Email send error:', error.message);
    }
};

// ======================================================
// CREATE ORDER - FINAL FIXED VERSION
// ======================================================
const createOrder = async (req, res) => {
    let cart = null;
    let order = null;

    try {
        const {
            shippingAddress,
            paymentMethod,
            taxPrice = 0,
            shippingPrice = 0,
            couponCode
        } = req.body;

        console.log('📦 Order Data:', { paymentMethod, couponCode });

        if (!['RAZORPAY', 'COD'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method. Use RAZORPAY or COD'
            });
        }

        // --------------------------------------------------
        // GET CART
        // --------------------------------------------------
        cart = await Cart.findOne({
            user: req.user._id
        }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // --------------------------------------------------
        // CALCULATE
        // --------------------------------------------------
        let subtotalPrice = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}`
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotalPrice += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.images && product.images[0] ? product.images[0] : ''
            });
        }

        subtotalPrice = Math.round(subtotalPrice * 100) / 100;

        // --------------------------------------------------
        // COUPON
        // --------------------------------------------------
        let discountAmount = 0;
        let couponApplied = null;
        let coupon = null;

        if (couponCode && couponCode.trim()) {
            coupon = await Coupon.findOne({
                code: couponCode.trim().toUpperCase(),
                isActive: true
            });

            if (!coupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coupon code'
                });
            }

            // ... (coupon validations) ...
            if (new Date() < new Date(coupon.startDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not active yet'
                });
            }

            if (new Date() > new Date(coupon.expiryDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon has expired'
                });
            }

            if (coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon usage limit reached'
                });
            }

            if (subtotalPrice < coupon.minOrderAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order amount should be ₹${coupon.minOrderAmount}`
                });
            }

            if (coupon.discountType === 'percentage') {
                discountAmount = (subtotalPrice * coupon.discountValue) / 100;
                if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (discountAmount > subtotalPrice) {
                discountAmount = subtotalPrice;
            }

            discountAmount = Math.round(discountAmount * 100) / 100;

            couponApplied = {
                code: coupon.code,
                discountAmount: discountAmount,
                couponId: coupon._id
            };

            console.log(` Coupon Applied: ${coupon.code}, Discount: ₹${discountAmount}`);
        }

        // --------------------------------------------------
        // FINAL PRICE
        // --------------------------------------------------
        const finalTotal = Math.round(
            (subtotalPrice - discountAmount + Number(taxPrice) + Number(shippingPrice)) * 100
        ) / 100;

        console.log(` Subtotal: ₹${subtotalPrice}`);
        console.log(` Discount: ₹${discountAmount}`);
        console.log(` Final Total: ₹${finalTotal}`);

        // ======================================================
        //  COD - Direct Order Place (Cart Clear + Email)
        // ======================================================
        if (paymentMethod === 'COD') {
            // 1. Reduce Stock
            for (const item of cart.items) {
                const product = item.product;
                product.stock -= item.quantity;
                await product.save();
            }

            // 2. Create Order
            order = await Order.create({
                user: req.user._id,
                orderItems,
                shippingAddress,
                paymentMethod: 'COD',
                subtotalPrice,
                discountPrice: discountAmount,
                couponApplied,
                taxPrice: Number(taxPrice),
                shippingPrice: Number(shippingPrice),
                totalPrice: finalTotal,
                isPaid: false,
                orderStatus: 'Processing'
            });

            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }

            // 3. Clear Cart
            if (cart) {
                cart.items = [];
                await cart.save();
                console.log(' Cart cleared for COD order');
            }

            // 4. Send Email
            const freshOrder = await Order.findById(order._id);
            await sendOrderConfirmation(req, freshOrder);

            return res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                order: freshOrder,
                paymentMethod: 'COD'
            });
        }

        // ======================================================
        // RAZORPAY - FLOW
        // ======================================================
        // 1. Reduce Stock (Pehle hi kar dete hain, agar fail hoga toh rollback kar denge)
        for (const item of cart.items) {
            const product = item.product;
            product.stock -= item.quantity;
            await product.save();
        }

        // 2. Create Order (isPaid = false)
        order = await Order.create({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: 'RAZORPAY',
            subtotalPrice,
            discountPrice: discountAmount,
            couponApplied,
            taxPrice: Number(taxPrice),
            shippingPrice: Number(shippingPrice),
            totalPrice: finalTotal,
            isPaid: false,
            orderStatus: 'Pending'
        });

        if (coupon) {
            coupon.usedCount += 1;
            await coupon.save();
        }

        const freshOrder = await Order.findById(order._id);

        // 3. Razorpay Order Create Karein
        try {
            const amountInPaise = Math.round(finalTotal * 100);

            console.log(`💰 Razorpay Amount: ₹${finalTotal} → ${amountInPaise} paise`);

            const razorpayOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `order_${freshOrder._id}`,
                notes: {
                    orderId: freshOrder._id.toString(),
                    userId: req.user._id.toString(),
                    subtotal: subtotalPrice.toString(),
                    discount: discountAmount.toString(),
                    finalTotal: finalTotal.toString()
                }
            });

            console.log('========================================');
            console.log('RAZORPAY ORDER CREATED:');
            console.log(' Order ID:', razorpayOrder.id);
            console.log(` Amount: ₹${finalTotal} (${razorpayOrder.amount} paise)`);
            console.log('========================================');

            //  NOTE: Cart yahin par CLEAR NAHI karte.
            // Cart sirf tab clear hoga jab payment verify/confirm ho jaayega
            // (confirmPayment function mein), taaki payment fail/cancel hone par
            // items cart mein wapas mil jayein.

            // 4. RESPONSE - Key ID bhejna
            const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxx';
            console.log(' Sending Key ID to Frontend:', razorpayKeyId);

            return res.status(201).json({
                success: true,
                message: 'Complete payment using Razorpay',
                order: freshOrder,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key_id: razorpayKeyId
                },
                paymentMethod: 'RAZORPAY',
                discountApplied: discountAmount,
                finalAmount: finalTotal
            });

        } catch (razorpayError) {
            console.error(' Razorpay order creation error:', razorpayError);
            console.error(' Status Code:', razorpayError.statusCode);
            console.error(' Error Details:', razorpayError.error || razorpayError.message);

            // ======================================================
            //  RAZORPAY FAILED - ROLLBACK
            // ======================================================
            console.log(' Razorpay failed - Rolling back order...');

            // 1. ORDER DELETE KARO (My Orders se hat jayega)
            if (order) {
                await Order.findByIdAndDelete(order._id);
                console.log('Order deleted from database');
            }

            // 2. STOCK RESTORE KARO
            for (const item of orderItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
            console.log(' Stock restored');

            // 3. COUPON USAGE RESTORE KARO
            if (coupon) {
                coupon.usedCount -= 1;
                await coupon.save();
                console.log('Coupon usage restored');
            }

            // 4. CART RESTORE KARO - cart items already intact hain (kabhi clear hi nahi hue)
            console.log(' Cart is intact - items still in cart');

            let errorMessage = 'Payment gateway error. Please try again.';
            if (razorpayError.statusCode === 401) {
                errorMessage = 'Authentication failed. Please check your Razorpay API keys.';
                console.error(' 401 Error: Invalid API keys.');
            } else if (razorpayError.statusCode === 400) {
                errorMessage = 'Invalid request. Please check your payment details.';
            }

            return res.status(500).json({
                success: false,
                message: errorMessage,
                error: razorpayError.error || razorpayError.message,
                orderDeleted: true
            });
        }

    } catch (error) {
        console.error(' Order creation error:', error);

        if (cart) {
            console.log('Order failed - Cart is intact');
        }

        if (order) {
            await Order.findByIdAndDelete(order._id).catch(() => {});
            console.log('Order deleted due to error');
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
// CONFIRM PAYMENT (payment success ke baad - cart yahan clear hoga)
// ======================================================
const confirmPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        //  SECURITY: teeno values zaroori hain signature verify karne ke liye
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification details'
            });
        }

        const order = await Order.findById(orderId).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (order.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Order already paid'
            });
        }

       
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            console.error(' SECURITY: Invalid payment signature - possible fraud attempt for order:', orderId);
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed - invalid signature'
            });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.orderStatus = 'Processing';
        order.paymentResult = {
            id: razorpayPaymentId,
            status: 'success'
        };
        await order.save();

        // PAYMENT CONFIRM HO GAYA - AB CART CLEAR KARO
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
            console.log(' Cart cleared after successful payment confirmation');
        }

        //  SEND EMAIL ONLY AFTER PAYMENT
        await sendOrderConfirmation(req, order);

        res.json({
            success: true,
            message: 'Payment confirmed successfully',
            order: order
        });

    } catch (error) {
        console.error(' Confirm payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
//  CANCEL PENDING (UNPAID) ORDER - Payment modal closed/failed
// ======================================================
const cancelPendingOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (order.isPaid) {
            return res.status(400).json({
                success: false,
                message: 'Order already paid, cannot cancel'
            });
        }

        // 1. Stock restore
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }
        console.log('Stock restored for pending order:', order._id);

        // 2. Coupon usage restore
        if (order.couponApplied && order.couponApplied.couponId) {
            const coupon = await Coupon.findById(order.couponApplied.couponId);
            if (coupon) {
                coupon.usedCount = Math.max(0, coupon.usedCount - 1);
                await coupon.save();
            }
        }

        //  NOTE: Cart ko yahan TOUCH NAHI karna.
        // Razorpay order creation ke waqt cart clear hi nahi hota (sirf payment
        // confirm hone par clear hota hai), isliye cancel/fail hone par cart
        // mein items already maujood hain. Dobara add karne se quantity double
        // ho jaati thi (1 -> 2) - yahi purana bug tha, ab fix kar diya.

        // 3. Order delete kar do
        await Order.findByIdAndDelete(order._id);
        console.log(' Pending order deleted:', order._id);

        res.json({
            success: true,
            message: 'Order cancelled, items restored to cart'
        });
    } catch (error) {
        console.error(' Cancel pending order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
// GET MY ORDERS
//  FIX: Sirf paid orders (RAZORPAY) ya COD orders dikhao.
// Unpaid/pending Razorpay orders My Orders mein nahi dikhne chahiye.
// ======================================================
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id,
            $or: [
                { paymentMethod: 'COD' },
                { isPaid: true }
            ]
        }).sort({
            createdAt: -1
        });

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

// ======================================================
// GET ORDER BY ID
// ======================================================
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate(
            'user',
            'name email'
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
// UPDATE ORDER STATUS (Admin)
// ======================================================
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus, trackingNumber } = req.body;

        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.orderStatus = orderStatus || order.orderStatus;

        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        }

        if (orderStatus === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            order.isPaid = true;
            order.paidAt = Date.now();

            console.log(` Order ${order._id} marked as Delivered and Paid`);

            try {
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; border-bottom: 2px solid #e94560; padding-bottom: 20px; }
                            .logo { font-size: 28px; font-weight: bold; color: #e94560; }
                            .delivery-box { background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
                            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                            .emoji-big { font-size: 48px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🛒 Royal Electronics</div>
                                <p style="color: #666;">Order Delivered!</p>
                            </div>
                            <div class="delivery-box">
                                <div class="emoji-big">📦</div>
                                <h2 style="color: #2e7d32;">Your Order Has Been Delivered!</h2>
                            </div>
                            <p>Hello <strong>${order.user.name}</strong>,</p>
                            <p>Great news! Your order has been successfully delivered.</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Order ID:</strong> ${order._id}</p>
                                <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                                <p><strong>Total Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                            </div>
                            <p style="color: #666;">Thank you for shopping with us!</p>
                            <div class="footer">
                                <p>© 2026 Royal Electronics. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await sendEmail(
                    order.user.email,
                    `📦 Order Delivered #${order._id.toString().slice(-6)} - Royal Electronics`,
                    emailHtml
                );

                console.log(' Delivery email sent to:', order.user.email);
            } catch (emailError) {
                console.error(' Delivery email error:', emailError.message);
            }
        }

        await order.save();

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error(' Update order status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
// UPDATE PAYMENT STATUS
// ======================================================
const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentResult } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = paymentResult;

        await order.save();

        const populatedOrder = await Order.findById(req.params.id).populate('user', 'name email');
        await sendOrderConfirmation({ user: populatedOrder.user }, populatedOrder);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ======================================================
// CANCEL ORDER
// ======================================================
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        if (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order that is shipped or delivered'
            });
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }

        if (order.couponApplied && order.couponApplied.couponId) {
            const coupon = await Coupon.findById(order.couponApplied.couponId);
            if (coupon) {
                coupon.usedCount = Math.max(0, coupon.usedCount - 1);
                await coupon.save();
                console.log(` Coupon ${coupon.code} used count decreased to ${coupon.usedCount}`);
            }
        }

        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
                console.log(` Stock restored for ${product.name}: +${item.quantity}`);
            }
        }

        order.orderStatus = 'Cancelled';
        await order.save();

        try {
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; border-bottom: 2px solid #e94560; padding-bottom: 20px; }
                        .logo { font-size: 28px; font-weight: bold; color: #e94560; }
                        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">🛒 Royal Electronics</div>
                            <p style="color: #666;">Order Cancellation</p>
                        </div>
                        <h2 style="color: #333;">Order Cancelled</h2>
                        <p>Hello <strong>${req.user.name}</strong>,</p>
                        <p>Your order <strong>#${order._id.toString().slice(-6)}</strong> has been cancelled successfully.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Order ID:</strong> ${order._id}</p>
                            <p><strong>Total Amount:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                            ${order.couponApplied ? `
                                <p><strong>Coupon Applied:</strong> ${order.couponApplied.code}</p>
                            ` : ''}
                        </div>
                        <p style="color: #666;">If you didn't request this cancellation, please contact us immediately.</p>
                        <div class="footer">
                            <p>© 2026 Royal Electronics. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            await sendEmail(
                req.user.email,
                `❌ Order Cancelled #${order._id.toString().slice(-6)} - Royal Electronics`,
                emailHtml
            );

            console.log(' Cancellation email sent to:', req.user.email);
        } catch (emailError) {
            console.error(' Email send error:', emailError.message);
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully and stock restored',
            order
        });

    } catch (error) {
        console.error(' Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    cancelPendingOrder,
    confirmPayment,
    sendOrderConfirmation
};