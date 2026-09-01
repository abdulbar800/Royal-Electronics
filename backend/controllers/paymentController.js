const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', orderId } = req.body;

        const options = {
            amount: amount * 100,
            currency: currency,
            receipt: orderId || `order_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            orderId: orderId
        });
    } catch (error) {
        console.error(' Payment order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { order_id, payment_id, signature, orderId } = req.body;

        // Verify signature
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(order_id + '|' + payment_id)
            .digest('hex');

        if (generated_signature !== signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        //  Update order payment status
        const order = await Order.findById(orderId);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
                id: payment_id,
                status: 'Completed',
                update_time: new Date().toISOString()
            };
            await order.save();

            //  SEND PAYMENT SUCCESS EMAIL
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
                            .payment-box { background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
                            .total { font-size: 24px; font-weight: bold; color: #e94560; }
                            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                            .emoji-big { font-size: 48px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🛒 Royal Electronics</div>
                                <p style="color: #666;">Payment Successful!</p>
                            </div>

                            <div class="payment-box">
                                <div class="emoji-big">💳</div>
                                <h2 style="color: #2e7d32;">Payment Successful!</h2>
                                <p style="color: #2e7d32;">Your payment has been confirmed.</p>
                            </div>

                            <p>Hello <strong>${order.user?.name || 'Customer'}</strong>,</p>

                            <p>Great news! Your payment has been successfully processed.</p>

                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Order ID:</strong> ${order._id}</p>
                                <p><strong>Payment ID:</strong> ${payment_id}</p>
                                <p><strong>Amount Paid:</strong> <span class="total">₹${order.totalPrice.toFixed(2)}</span></p>
                            </div>

                            <p style="color: #666;">Your order will be processed shortly. You will receive a confirmation once it's shipped.</p>

                            <div class="footer">
                                <p>© 2026 Royal Electronics. All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                await sendEmail(
                    order.user?.email || req.user?.email,
                    ` Payment Successful #${order._id.toString().slice(-6)} - Royal Electronics`,
                    emailHtml
                );

                console.log('Payment success email sent to:', order.user?.email);
            } catch (emailError) {
                console.error(' Payment email error:', emailError.message);
            }
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            order
        });
    } catch (error) {
        console.error(' Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { createPaymentOrder, verifyPayment };
