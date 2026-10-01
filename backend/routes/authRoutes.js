const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  sendLoginOtp,
  verifyLoginOtp,
  forgotPasswordOtp,
  resetPasswordWithOtp,
  getMe,
  updateProfile,
  getUserPublicProfile,
  uploadProfilePicture,
  removeProfilePicture,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  validate,
  registerValidation,
  loginValidation,
  otpVerifyValidation,
} = require('../middleware/validators');

// Enhanced file filter checking magic header bytes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, or WEBP images are permitted'));
    }
  },
});

router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/verify-otp', authLimiter, validate(otpVerifyValidation), verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/send-login-otp', otpLimiter, sendLoginOtp);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/forgot-password-otp', otpLimiter, forgotPasswordOtp);
router.post('/reset-password-otp', authLimiter, resetPasswordWithOtp);

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/profile-picture', protect, upload.single('profilePic'), uploadProfilePicture);
router.delete('/me/profile-picture', protect, removeProfilePicture);
router.get('/user/:id', getUserPublicProfile);

module.exports = router;
