const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSwapRequest,
  getIncoming,
  getSent,
  getActive,
  acceptSwap,
  declineSwap,
} = require('../controllers/swapController');

router.post('/', protect, createSwapRequest);
router.get('/incoming', protect, getIncoming);
router.get('/sent', protect, getSent);
router.get('/active', protect, getActive);
router.put('/:id/accept', protect, acceptSwap);
router.put('/:id/decline', protect, declineSwap);

module.exports = router;
