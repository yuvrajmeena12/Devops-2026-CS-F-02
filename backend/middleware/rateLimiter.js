const rateLimit = require('express-rate-limit');

// Authentication endpoints limiter (login, register, password changes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again later.',
  },
});

// General public read and search endpoints limiter
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded. Please throttle requests.',
  },
});

// Search & Match queries limiter
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Search query rate limit exceeded. Please wait a moment.',
  },
});

// Direct message send rate limiter (60 messages per minute)
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Message rate limit exceeded. You can send at most 60 messages per minute.',
  },
});

module.exports = {
  authLimiter,
  publicApiLimiter,
  searchLimiter,
  messageLimiter,
};
