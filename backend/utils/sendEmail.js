const axios = require('axios');

const sendOTPEmail = async (email, otp, type = 'reset') => {
    try {
        const url = 'https://api.brevo.com/v3/smtp/email';

        const isRegistration = type === 'register';

        const title = isRegistration
            ? 'Email Verification OTP'
            : 'Password Reset OTP';

        const description = isRegistration
            ? 'Use the OTP below to verify your email address:'
            : 'We received a request to reset your password. Use the OTP below to complete the process:';

        const subject = isRegistration
            ? 'Email Verification OTP - Royal Electronics'
            : 'Password Reset OTP - Royal Electronics';

        const textContent = isRegistration
            ? `Your OTP for email verification is: ${otp}\n\nThis OTP is valid for 10 minutes.`
            : `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    
                    <div style="background: #2563eb; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Royal Electronics</h1>
                        <p style="color: #e0e7ff; margin: 5px 0 0;">Your Trusted Electronics Store</p>
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #1e293b; margin-top: 0;">🔐 ${title}</h2>
                        <p style="color: #475569; line-height: 1.6;">Hello,</p>
                        <p style="color: #475569; line-height: 1.6;">${description}</p>
                         
                        <div style="background: #f1f5f9; padding: 25px; text-align: center; border-radius: 10px; margin: 25px 0; border: 2px dashed #2563eb;">
                            <span style="font-size: 42px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                        </div>
                         
                        <p style="color: #475569; line-height: 1.6;">This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p style="color: #475569; line-height: 1.6;">If you didn't request this, please ignore this email.</p>
                         
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
                         
                        <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 0;">Need help? Contact support@royalelectronics.com</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 15px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Royal Electronics. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const emailData = {
            sender: {
                email: process.env.SENDER_EMAIL,
                name: 'Royal Electronics'
            },
            to: [
                {
                    email: email,
                    name: 'Customer'
                }
            ],
            subject: subject,
            textContent: textContent,
            htmlContent: htmlContent
        };

        const response = await axios.post(url, emailData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            }
        });

        console.log('✅ OTP email sent successfully to:', email);
        return true;

    } catch (error) {
        console.error('OTP email sending failed:', error.response?.data?.message || error.message);
        return false;
    }
};

module.exports = {
    sendOTPEmail
};