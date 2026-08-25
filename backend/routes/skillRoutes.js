const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
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

// Certificates are kept in memory only long enough to base64-encode and
// save to MongoDB — never written to disk (Render's free-tier disk isn't
// persistent across restarts, so saving there would silently lose files).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB — keeps documents well under MongoDB's 16MB doc limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, PNG, or JPG files are allowed'));
  },
});

router.get('/matches', protect, getMatches);
router.get('/mine', protect, getMySkills);
router.get('/user/:userId', getSkillsByUser);
router.get('/', protect, browseSkills);
router.post('/', protect, addSkill);
router.post('/:id/certificate', protect, upload.single('certificate'), uploadCertificate);
router.get('/:id/certificate', protect, getCertificate);
router.delete('/:id/certificate', protect, removeCertificate);
router.put('/:id', protect, updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;
