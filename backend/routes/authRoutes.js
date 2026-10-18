const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  getUserPublicProfile,
  uploadProfilePicture,
  removeProfilePicture,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
} = require('../middleware/validators');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Non-OTP Authentication Endpoints
router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/change-password', protect, authLimiter, validate(changePasswordValidation), changePassword);
router.put('/change-password', protect, authLimiter, validate(changePasswordValidation), changePassword);
router.post('/logout', protect, logout);

// Profile Management
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/profile-picture', protect, upload.single('profilePic'), uploadProfilePicture);
router.post('/me/avatar', protect, upload.single('avatar'), uploadProfilePicture);
router.delete('/me/profile-picture', protect, removeProfilePicture);
router.delete('/me/avatar', protect, removeProfilePicture);
router.get('/user/:id', getUserPublicProfile);

module.exports = router;
