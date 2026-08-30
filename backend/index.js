const path = require('path');
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, '.env') });


console.log('=================================');
console.log('EMAIL CONFIGURATION');
console.log('=================================');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL ? 'SET' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

console.log('=================================');
console.log('RAZORPAY CONFIGURATION');
console.log('=================================');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : ' MISSING');
console.log(' RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? ' SET' : ' MISSING');

if (process.env.RAZORPAY_KEY_ID && process.env.NODE_ENV !== 'production') {
    console.log(' KEY VALUE:', process.env.RAZORPAY_KEY_ID);
}
console.log('=================================');


const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const xss = require('xss');
const connectDB = require("./config/db");
const { limiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');

// ROUTES
const userRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const couponRoutes = require('./routes/couponRoutes');


connectDB();


const app = express();

//  CORS
const allowedOrigins = [
  process.env.CLIENT_URL, 
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));

//  RATE LIMITING
app.use('/api', limiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

//  Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


const sanitizeMongoOperators = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            //  Malicious operator-key ko hata do
            delete obj[key];
            continue;
        }
        if (obj[key] && typeof obj[key] === 'object') {
            sanitizeMongoOperators(obj[key]);
        }
    }
};

const mongoSanitizeMiddleware = (req, res, next) => {
   
    if (req.body) sanitizeMongoOperators(req.body);
    if (req.params) sanitizeMongoOperators(req.params);
    if (req.query) sanitizeMongoOperators(req.query);
    next();
};

app.use(mongoSanitizeMiddleware);

// XSS Protection
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            
            if (key.toLowerCase().includes('password')) continue;

            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        }
    }
    if (req.query) {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = xss(req.query[key]);
            }
        }
    }
    next();
};

app.use(sanitizeInput);

// ============================================
// ROUTES
// ============================================
console.log(' Server starting...');

app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Server is running!' });
});

app.get("/", (req, res) => {
    res.send("Royal Electronics backend is working properly!");
});

app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/coupons', couponRoutes);

// ============================================
//  ERROR HANDLING
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error(' Error:', err.message);

    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Something went wrong!'
        : err.message;

    res.status(status).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// ============================================
//  SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` Security: All protections active`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Razorpay: ${process.env.RAZORPAY_KEY_ID ? 'Configured ' : 'Not Configured '}`);
});