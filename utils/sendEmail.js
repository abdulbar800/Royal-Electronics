const brevo = require('@getbrevo/brevo');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL; // Brevo par jo email verify kiya hai wahi yahan daalo

console.log('=================================');
console.log('EMAIL CONFIGURATION (Brevo)');
console.log('=================================');
console.log('BREVO_API_KEY:', BREVO_API_KEY ? 'SET' : 'MISSING');
console.log('SENDER_EMAIL:', SENDER_EMAIL ? 'SET' : 'MISSING');
console.log('=================================');

if (!BREVO_API_KEY || !SENDER_EMAIL) {
    console.error('BREVO_API_KEY ya SENDER_EMAIL .env me missing hai');
    console.error('Please add BREVO_API_KEY aur SENDER_EMAIL to .env file');
}

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

const sendEmail = async (to, subject, html) => {
    try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.sender = { name: 'Royal Electronics', email: SENDER_EMAIL };
        sendSmtpEmail.to = [{ email: to }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent:', data.body ? data.body.messageId : data.messageId);
        return true;
    } catch (error) {
        console.error('Email send failed:', error.response ? JSON.stringify(error.response.body) : error.message);
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