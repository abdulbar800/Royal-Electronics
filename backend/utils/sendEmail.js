const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

console.log('=================================');
console.log('EMAIL CONFIGURATION (MailerSend)');
console.log('=================================');
console.log('MAILERSEND_API_KEY:', MAILERSEND_API_KEY ? 'SET' : 'MISSING');
console.log('SENDER_EMAIL:', SENDER_EMAIL ? 'SET' : 'MISSING');
console.log('=================================');

if (!MAILERSEND_API_KEY || !SENDER_EMAIL) {
    console.error('MAILERSEND_API_KEY ya SENDER_EMAIL .env me missing hai');
    console.error('Please add MAILERSEND_API_KEY aur SENDER_EMAIL to .env file');
}

// SDK use nahi kiya, seedha MailerSend ka REST API call kiya hai fetch se,
// taaki kisi bhi SDK version mismatch ka jhanjhat na ho
const sendEmail = async (to, subject, html) => {
    try {
        const response = await fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: { email: SENDER_EMAIL, name: 'Royal Electronics' },
                to: [{ email: to }],
                subject: subject,
                html: html
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            console.error('Email send failed:', JSON.stringify(data));
            return false;
        }

        const messageId = response.headers.get('x-message-id');
        console.log('Email sent:', messageId || 'success');
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