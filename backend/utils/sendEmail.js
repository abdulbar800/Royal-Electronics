const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

console.log('=================================');
console.log('EMAIL CONFIGURATION (Resend)');
console.log('=================================');
console.log('RESEND_API_KEY:', RESEND_API_KEY ? 'SET' : 'MISSING');
console.log('=================================');

if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing in .env');
    console.error('Please add RESEND_API_KEY to .env file');
}

const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = 'Royal Electronics <onboarding@resend.dev>';

const sendEmail = async (to, subject, html) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html
        });

        if (error) {
            console.error('Email send failed:', error.message || error);
            return false;
        }

        console.log('Email sent:', data.id);
        return true;
    } catch (error) {
        console.error('Email send failed:', error.message);
        return false;
    }
};

const sendOTPEmail = async (to, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #e63950;">Royal Electronics</h2>
            <p>Aapne password reset request kiya hai. Neeche diya gaya OTP use karein:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background: #f5f5f5; padding: 16px; text-align: center; border-radius: 6px; margin: 16px 0;">
                ${otp}
            </div>
            <p>Ye OTP <strong>10 minutes</strong> ke liye valid hai.</p>
            <p style="color: #888; font-size: 13px;">Agar aapne ye request nahi ki, to is email ko ignore karein.</p>
        </div>
    `;
    return sendEmail(to, 'Password Reset OTP - Royal Electronics', html);
};

module.exports = { sendEmail, sendOTPEmail };
