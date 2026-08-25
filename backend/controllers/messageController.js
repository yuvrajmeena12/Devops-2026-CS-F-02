const Message = require('../models/Message');
const SwapRequest = require('../models/SwapRequest');
const { createNotification } = require('../utils/notify');

// GET /api/messages/:swapRequestId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ swapRequest: req.params.swapRequestId })
      .populate('sender', 'name profilePicUrl')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { swapRequestId, text } = req.body;
    if (!text || !swapRequestId) return res.status(400).json({ message: 'swapRequestId and text are required' });

    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const message = await Message.create({ swapRequest: swapRequestId, sender: req.user._id, text });
    await message.populate('sender', 'name profilePicUrl');

    const otherUser = swap.fromUser.toString() === req.user._id.toString() ? swap.toUser : swap.fromUser;
    await createNotification(otherUser, 'new_message', `${req.user.name} sent you a message`, swapRequestId);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage };
