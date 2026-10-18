const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { messageLimiter } = require('../middleware/rateLimiter');
const { validate, messageValidation } = require('../middleware/validators');
const {
  getConversations,
  getUnreadCount,
  getMessagesWithUser,
  getMessagesBySwap,
  markConversationRead,
  sendMessage,
} = require('../controllers/messageController');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/user/:userId', protect, getMessagesWithUser);
router.get('/swap/:swapRequestId', protect, getMessagesBySwap);
router.get('/:swapRequestId', protect, getMessagesBySwap); // backward compatibility
router.patch('/read/:otherUserId', protect, markConversationRead);
router.put('/read/:otherUserId', protect, markConversationRead);
router.post('/', protect, messageLimiter, validate(messageValidation), sendMessage);

module.exports = router;
