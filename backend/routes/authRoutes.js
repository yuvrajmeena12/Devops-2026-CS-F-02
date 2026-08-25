const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, login, getMe, updateProfile, getUserPublicProfile, forgotPassword, resetPassword, uploadProfilePicture, removeProfilePicture } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — profile pics should stay small
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPG, or WEBP images are allowed'));
  },
});

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/profile-picture', protect, upload.single('profilePic'), uploadProfilePicture);
router.delete('/me/profile-picture', protect, removeProfilePicture);
router.get('/user/:id', getUserPublicProfile);

module.exports = router;
