const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, swapRequestValidation } = require('../middleware/validators');
const {
  createSwapRequest,
  getSwaps,
  getSwapCounts,
  getIncoming,
  getSent,
  getActive,
  getAllMySwaps,
  acceptSwap,
  declineSwap,
  cancelSwap,
} = require('../controllers/swapController');

router.get('/counts', protect, getSwapCounts);
router.get('/incoming', protect, getIncoming);
router.get('/sent', protect, getSent);
router.get('/active', protect, getActive);
router.get('/all', protect, getAllMySwaps);

router.post('/', protect, validate(swapRequestValidation), createSwapRequest);
router.get('/', protect, getSwaps);

// Accept
router.patch('/:id/accept', protect, acceptSwap);
router.put('/:id/accept', protect, acceptSwap);

// Reject / Decline
router.patch('/:id/reject', protect, declineSwap);
router.put('/:id/reject', protect, declineSwap);
router.patch('/:id/decline', protect, declineSwap);
router.put('/:id/decline', protect, declineSwap);

// Cancel / Withdraw
router.patch('/:id/cancel', protect, cancelSwap);
router.put('/:id/cancel', protect, cancelSwap);

module.exports = router;
