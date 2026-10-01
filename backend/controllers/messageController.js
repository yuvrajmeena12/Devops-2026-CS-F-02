const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate('sender', 'name profilePicUrl isVerified location')
      .populate('recipient', 'name profilePicUrl isVerified location')
      .sort({ createdAt: -1 });

    const conversationMap = new Map();

    for (const msg of messages) {
      if (!msg.sender || !msg.recipient) continue;
      const isSender = msg.sender._id.toString() === userId.toString();
      const otherUser = isSender ? msg.recipient : msg.sender;
      const otherId = otherUser._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageDate: msg.createdAt,
          lastSenderId: msg.sender._id,
          unreadCount: 0,
          swapRequestId: msg.swapRequest,
        });
      }

      if (!isSender && !msg.read) {
        const conv = conversationMap.get(otherId);
        conv.unreadCount += 1;
      }
    }

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/user/:userId
const getMessagesWithUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'name profilePicUrl isVerified')
      .populate('recipient', 'name profilePicUrl isVerified')
      .sort({ createdAt: 1 });

    // Mark unread messages sent to me as read
    await Message.updateMany(
      { sender: targetUserId, recipient: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/swap/:swapRequestId
const getMessagesBySwap = async (req, res) => {
  try {
    const messages = await Message.find({ swapRequest: req.params.swapRequestId })
      .populate('sender', 'name profilePicUrl isVerified')
      .populate('recipient', 'name profilePicUrl isVerified')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { swapRequest: req.params.swapRequestId, recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { recipientId, swapRequestId, text, skillId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    let targetRecipientId = recipientId;
    let targetSwapRequest = swapRequestId;

    if (!targetRecipientId && targetSwapRequest) {
      const swap = await SwapRequest.findById(targetSwapRequest);
      if (swap) {
        targetRecipientId = swap.fromUser.toString() === req.user._id.toString() ? swap.toUser : swap.fromUser;
      }
    }

    if (!targetRecipientId) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: targetRecipientId,
      swapRequest: targetSwapRequest || undefined,
      skill: skillId || undefined,
      text: text.trim(),
    });

    await message.populate('sender', 'name profilePicUrl isVerified');
    await message.populate('recipient', 'name profilePicUrl isVerified');

    await createNotification(
      targetRecipientId,
      'new_message',
      `${req.user.name} sent you a message: "${text.length > 40 ? text.substring(0, 40) + '...' : text}"`,
      targetSwapRequest || message._id
    );

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessagesWithUser,
  getMessagesBySwap,
  sendMessage,
};
