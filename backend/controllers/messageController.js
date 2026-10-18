const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const notify = require('../utils/notify');
const cache = require('../utils/cache');

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Retrieve all messages involving this user sorted newest first
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate('sender', 'name profilePicUrl avatar isVerified location rating')
      .populate('recipient', 'name profilePicUrl avatar isVerified location rating')
      .sort({ createdAt: -1 });

    const conversationMap = new Map();

    for (const msg of messages) {
      if (!msg.sender || !msg.recipient) continue;
      const isSender = String(msg.sender._id) === String(userId);
      const otherUser = isSender ? msg.recipient : msg.sender;
      const otherId = String(otherUser._id);

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          id: otherId,
          user: otherUser,
          otherUser,
          lastMessage: msg.text || msg.content || '',
          content: msg.text || msg.content || '',
          lastMessageDate: msg.createdAt,
          updatedAt: msg.createdAt,
          lastSenderId: msg.sender._id,
          unreadCount: 0,
          swapRequestId: msg.swapRequest,
          conversationKey: msg.conversationKey || Message.keyFor(userId, otherId),
        });
      }

      if (!isSender && !msg.read) {
        const conv = conversationMap.get(otherId);
        conv.unreadCount += 1;
      }
    }

    res.json(Array.from(conversationMap.values()));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/user/:userId
const getMessagesWithUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;
    const { before, limit = 50 } = req.query;

    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const convKey = Message.keyFor(currentUserId, targetUserId);

    const query = {
      $or: [
        { conversationKey: convKey },
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    // Sort newest first to fetch latest up to limit, then reverse for display
    const rawMessages = await Message.find(query)
      .populate('sender', 'name profilePicUrl avatar isVerified')
      .populate('recipient', 'name profilePicUrl avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    const messages = rawMessages.reverse();

    // Mark unread messages sent to me as read
    const now = new Date();
    await Message.updateMany(
      {
        recipient: currentUserId,
        sender: targetUserId,
        read: false,
      },
      {
        $set: { read: true, readAt: now },
      }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/messages/swap/:swapRequestId
const getMessagesBySwap = async (req, res) => {
  try {
    const swapId = req.params.swapRequestId;
    const messages = await Message.find({
      $or: [{ swapRequest: swapId }, { swap: swapId }],
    })
      .populate('sender', 'name profilePicUrl avatar isVerified')
      .populate('recipient', 'name profilePicUrl avatar isVerified')
      .sort({ createdAt: 1 });

    // Mark as read for current user
    const now = new Date();
    await Message.updateMany(
      {
        $or: [{ swapRequest: swapId }, { swap: swapId }],
        recipient: req.user._id,
        read: false,
      },
      {
        $set: { read: true, readAt: now },
      }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/messages/read/:otherUserId (Explicitly mark conversation as read)
const markConversationRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const now = new Date();
    const result = await Message.updateMany(
      {
        sender: otherUserId,
        recipient: req.user._id,
        read: false,
      },
      {
        $set: { read: true, readAt: now },
      }
    );

    res.json({
      success: true,
      message: 'Conversation marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const {
      recipientId,
      toUserId,
      swapRequestId,
      swapId,
      text,
      content,
      skillId,
    } = req.body;

    const messageText = (text || content || '').trim();
    if (!messageText) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    if (messageText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters',
      });
    }

    let targetRecipientId = recipientId || toUserId;
    const targetSwapId = swapRequestId || swapId;

    if (!targetRecipientId && targetSwapId) {
      const swap = await SwapRequest.findById(targetSwapId);
      if (swap) {
        const fromId = String(swap.fromUser || swap.requester);
        const toId = String(swap.toUser || swap.provider);
        targetRecipientId = fromId === String(req.user._id) ? toId : fromId;
      }
    }

    if (!targetRecipientId) {
      return res.status(400).json({ success: false, message: 'Recipient identifier is required' });
    }

    if (String(targetRecipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot send a message to yourself' });
    }

    const convKey = Message.keyFor(req.user._id, targetRecipientId);

    const message = await Message.create({
      conversationKey: convKey,
      sender: req.user._id,
      recipient: targetRecipientId,
      swapRequest: targetSwapId || undefined,
      skill: skillId || undefined,
      text: messageText,
      content: messageText,
      read: false,
      readAt: null,
    });

    await message.populate('sender', 'name profilePicUrl avatar isVerified');
    await message.populate('recipient', 'name profilePicUrl avatar isVerified');

    // 10-minute debounced notification using 10-minute bucket in dedupeKey
    const tenMinBucket = Math.floor(Date.now() / (10 * 60 * 1000));
    const dedupeKey = `msg:${convKey}:${tenMinBucket}`;

    const snippet = messageText.length > 50 ? `${messageText.slice(0, 47)}...` : messageText;
    await notify({
      recipient: targetRecipientId,
      actor: req.user._id,
      type: 'message_received',
      message: `${req.user.name} sent you a message: "${snippet}"`,
      link: '/messages',
      relatedId: message._id,
      dedupeKey,
    });

    res.status(201).json({
      success: true,
      message,
      ...message.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  getUnreadCount,
  getMessagesWithUser,
  getMessagesBySwap,
  markConversationRead,
  sendMessage,
};
