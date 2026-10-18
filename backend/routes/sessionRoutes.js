const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, sessionValidation } = require('../middleware/validators');
const {
  createSession,
  confirmSession,
  completeSession,
  getSessions,
  getSessionsBySwap,
  cancelSession,
} = require('../controllers/sessionController');

router.post('/', protect, validate(sessionValidation), createSession);
router.get('/', protect, getSessions);
router.put('/:id/confirm', protect, confirmSession);
router.patch('/:id/complete', protect, completeSession);
router.put('/:id/complete', protect, completeSession);
router.patch('/:id/cancel', protect, cancelSession);
router.put('/:id/cancel', protect, cancelSession);
router.get('/swap/:swapRequestId', protect, getSessionsBySwap);

module.exports = router;
