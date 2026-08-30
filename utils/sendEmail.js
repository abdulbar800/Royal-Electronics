const nodemailer = require('nodemailer');


const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('=================================');
console.log('EMAIL CONFIGURATION');
console.log('=================================');
console.log('EMAIL_USER:', EMAIL_USER ? 'SET' : 'MISSING');
console.log('EMAIL_PASS:', EMAIL_PASS ? 'SET' : 'MISSING');
console.log('=================================');

// Check if credentials exist
if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('EMAIL_USER or EMAIL_PASS is missing in .env');
    console.error('Please add EMAIL_USER and EMAIL_PASS to .env file');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter error:', error.message);
    } else {
        console.log('Email server ready to send messages');
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Royal Electronics" <${EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log('Email sent:', info.messageId);
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