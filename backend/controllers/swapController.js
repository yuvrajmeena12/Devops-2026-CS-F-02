const SwapRequest = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const { createNotification } = require('../utils/notify');

// POST /api/swaps
const createSwapRequest = async (req, res) => {
  try {
    const { toUser, offeredSkill, requestedSkill, message } = req.body;
    if (!toUser || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ message: 'toUser, offeredSkill and requestedSkill are required' });
    }
    if (toUser === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot send a swap request to yourself' });
    }

    const swap = await SwapRequest.create({
      fromUser: req.user._id,
      toUser,
      offeredSkill,
      requestedSkill,
      message,
    });

    await createNotification(
      toUser,
      'new_request',
      `${req.user.name} sent you a swap request`,
      swap._id
    );

    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/swaps/incoming
const getIncoming = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ toUser: req.user._id })
      .populate('fromUser', 'name profilePicUrl trustScore')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/swaps/sent
const getSent = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ fromUser: req.user._id })
      .populate('toUser', 'name profilePicUrl trustScore')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/swaps/active  (accepted swaps involving the user)
const getActive = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({
      status: 'accepted',
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    })
      .populate('fromUser toUser', 'name profilePicUrl trustScore')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/swaps/:id/accept
const acceptSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findOne({ _id: req.params.id, toUser: req.user._id });
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });
    swap.status = 'accepted';
    await swap.save();
    await createNotification(swap.fromUser, 'request_accepted', `${req.user.name} accepted your swap request`, swap._id);
    res.json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/swaps/:id/decline
const declineSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findOne({ _id: req.params.id, toUser: req.user._id });
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });
    swap.status = 'declined';
    await swap.save();
    await createNotification(swap.fromUser, 'request_declined', `${req.user.name} declined your swap request`, swap._id);
    res.json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSwapRequest, getIncoming, getSent, getActive, acceptSwap, declineSwap };
