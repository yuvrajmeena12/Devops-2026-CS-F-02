const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.skillswap_token) {
    token = req.cookies.skillswap_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no session token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skillswapsecret2026xyz123');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    // Token version revocation: if tokenVersion exists and does not match, session is invalidated
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ success: false, message: 'Session has been invalidated. Please log in again.' });
      }
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Administrative access required' });
};

module.exports = { protect, adminOnly };
