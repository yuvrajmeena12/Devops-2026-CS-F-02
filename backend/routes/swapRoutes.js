const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, swapRequestValidation } = require('../middleware/validators');
const {
  createSwapRequest,
  getIncoming,
  getSent,
  getActive,
  getAllMySwaps,
  acceptSwap,
  declineSwap,
  cancelSwap,
} = require('../controllers/swapController');

router.post('/', protect, validate(swapRequestValidation), createSwapRequest);
router.get('/incoming', protect, getIncoming);
router.get('/sent', protect, getSent);
router.get('/active', protect, getActive);
router.get('/all', protect, getAllMySwaps);
router.put('/:id/accept', protect, acceptSwap);
router.put('/:id/decline', protect, declineSwap);
router.put('/:id/cancel', protect, cancelSwap);

module.exports = router;
