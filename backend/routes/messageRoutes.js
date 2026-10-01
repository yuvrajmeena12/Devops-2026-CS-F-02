const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, messageValidation } = require('../middleware/validators');
const {
  getConversations,
  getMessagesWithUser,
  getMessagesBySwap,
  sendMessage,
} = require('../controllers/messageController');

router.get('/conversations', protect, getConversations);
router.get('/user/:userId', protect, getMessagesWithUser);
router.get('/swap/:swapRequestId', protect, getMessagesBySwap);
router.get('/:swapRequestId', protect, getMessagesBySwap); // backward compatibility
router.post('/', protect, validate(messageValidation), sendMessage);

module.exports = router;
