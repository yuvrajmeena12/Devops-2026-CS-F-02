const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { listMatches } = require('../controllers/matchController');

router.get('/', protect, searchLimiter, listMatches);

module.exports = router;
