const rateLimit = require('express-rate-limit');

// 1. Global API Limiter (all /api routes)
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200, // Max 200 requests per IP
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 2. Strict Auth Limiter (Login attempts)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 login attempts per IP
    message: {
        success: false,
        error: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// 3. Contact Form Limiter (Spam prevention)
const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 messages per hour per IP
    message: {
        success: false,
        error: 'Too many messages sent from this IP. Please wait an hour before contacting again.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    apiLimiter,
    authLimiter,
    messageLimiter
};