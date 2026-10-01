const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { publicApiLimiter } = require('../middleware/rateLimiter');
const { validate, skillValidation } = require('../middleware/validators');
const {
  addSkill,
  browseSkills,
  getMySkills,
  updateSkill,
  deleteSkill,
  getMatches,
  getSkillsByUser,
  uploadCertificate,
  removeCertificate,
  getCertificate,
} = require('../controllers/skillController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype.toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, PNG, or JPG files are allowed'));
  },
});

router.get('/matches', protect, getMatches);
router.get('/mine', protect, getMySkills);
router.get('/user/:userId', publicApiLimiter, getSkillsByUser);
router.get('/', protect, publicApiLimiter, browseSkills);
router.post('/', protect, validate(skillValidation), addSkill);
router.post('/:id/certificate', protect, upload.single('certificate'), uploadCertificate);
router.get('/:id/certificate', protect, getCertificate);
router.delete('/:id/certificate', protect, removeCertificate);
router.put('/:id', protect, validate(skillValidation), updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
