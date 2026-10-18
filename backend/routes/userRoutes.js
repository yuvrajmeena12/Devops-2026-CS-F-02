const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getUserPublicProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, changePasswordValidation } = require('../middleware/validators');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/:id', getUserPublicProfile);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, upload.single('avatar'), uploadProfilePicture);
router.delete('/me/avatar', protect, removeProfilePicture);
router.post('/change-password', protect, authLimiter, validate(changePasswordValidation), changePassword);

module.exports = router;
