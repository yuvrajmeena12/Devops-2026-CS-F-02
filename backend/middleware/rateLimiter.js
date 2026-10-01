const rateLimit = require('express-rate-limit');

// Authentication endpoints limiter (login, register, OTP verification)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again in 15 minutes.',
  },
});

// Sensitive OTP creation/resend limiter (stricter to prevent SMS/Email exhaustion)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 6, // 6 OTP requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this network. Please wait before requesting another code.',
  },
});

// General public read and search endpoints limiter
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please throttle requests.',
  },
});

module.exports = {
  authLimiter,
  otpLimiter,
  publicApiLimiter,
};
