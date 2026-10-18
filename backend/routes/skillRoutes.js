const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { validate, skillValidation } = require('../middleware/validators');
const {
  getCategories,
  browseSkills,
  getMySkills,
  getSkillsByUser,
  getSkillById,
  addSkill,
  updateSkill,
  deleteSkill,
  uploadCertificate,
  removeCertificate,
  getCertificate,
} = require('../controllers/skillController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const { listMatches } = require('../controllers/matchController');

// Middleware to capture proof or certificate in single file upload
const uploadProofFile = (req, res, next) => {
  upload.fields([
    { name: 'proof', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (req.files) {
      if (req.files.proof && req.files.proof[0]) req.file = req.files.proof[0];
      else if (req.files.certificate && req.files.certificate[0]) req.file = req.files.certificate[0];
      else if (req.files.file && req.files.file[0]) req.file = req.files.file[0];
    }
    next();
  });
};

router.get('/categories', getCategories);
router.get('/matches', protect, searchLimiter, listMatches);
router.get('/explore', searchLimiter, browseSkills);
router.get('/mine', protect, getMySkills);
router.get('/user/:userId', getSkillsByUser);

router.post('/', protect, uploadProofFile, validate(skillValidation), addSkill);
router.get('/:id', getSkillById);
router.put('/:id', protect, uploadProofFile, validate(skillValidation), updateSkill);
router.delete('/:id', protect, deleteSkill);

// Proof and certificate streaming and management
router.get('/:id/proof', getCertificate);
router.get('/:id/certificate', getCertificate);
router.post('/:id/certificate', protect, upload.single('certificate'), uploadCertificate);
router.delete('/:id/certificate', protect, removeCertificate);

// Base listing
router.get('/', searchLimiter, browseSkills);

module.exports = router;
