const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSession,
  confirmSession,
  completeSession,
  getSessionsBySwap,
} = require('../controllers/sessionController');

router.post('/', protect, createSession);
router.put('/:id/confirm', protect, confirmSession);
router.put('/:id/complete', protect, completeSession);
router.get('/swap/:swapRequestId', protect, getSessionsBySwap);

module.exports = router;
