const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/messageController');

router.get('/:swapRequestId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
