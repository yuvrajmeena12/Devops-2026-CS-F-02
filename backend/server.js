const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const sanitizeInput = require('./middleware/sanitize');

dotenv.config();

// Enforce that JWT_SECRET is present in production
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret')) {
  console.error('CRITICAL FATAL ERROR: JWT_SECRET must be configured with a secure secret in production!');
  process.exit(1);
}

connectDB();

const app = express();

// Security HTTP headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Safe CORS Configuration
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(s => s.trim()) 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, docker health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not permitted'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request payload parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL query & body sanitization
app.use(sanitizeInput);

// Structured HTTP logging (anonymized, skips sensitive authorization data)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check endpoint for Docker, Jenkins, and load balancers
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() }));

// Mount Application Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/swaps', require('./routes/swapRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Route Catch-All
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Requested API endpoint not found' });
});

// Centralized Secure Error Handler (No sensitive stack or system path leakage)
app.use((err, req, res, next) => {
  // Log error internally for devops and debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Internal Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // Never leak internal stack trace to client
  const statusCode = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(statusCode).json({
    success: false,
    message: err.status ? err.message : (process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message),
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`SkillSwap secure server running on port ${PORT}`));

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server safely');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
