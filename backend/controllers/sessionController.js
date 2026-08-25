const Session = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const { createNotification } = require('../utils/notify');

// POST /api/sessions  (propose a schedule for an accepted swap)
const createSession = async (req, res) => {
  try {
    const { swapRequestId, scheduledDateTime, mode, meetingLink, address } = req.body;
    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isParticipant =
      swap.fromUser.toString() === req.user._id.toString() ||
      swap.toUser.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ message: 'Not part of this swap' });

    const session = await Session.create({
      swapRequest: swapRequestId,
      scheduledDateTime,
      mode,
      meetingLink,
      address,
      confirmedByFrom: swap.fromUser.toString() === req.user._id.toString(),
      confirmedByTo: swap.toUser.toString() === req.user._id.toString(),
    });

    const otherUser =
      swap.fromUser.toString() === req.user._id.toString() ? swap.toUser : swap.fromUser;
    await createNotification(otherUser, 'session_scheduled', `${req.user.name} proposed a session time`, session._id);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/confirm
const confirmSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('swapRequest');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const swap = session.swapRequest;
    if (swap.fromUser.toString() === req.user._id.toString()) session.confirmedByFrom = true;
    if (swap.toUser.toString() === req.user._id.toString()) session.confirmedByTo = true;

    if (session.confirmedByFrom && session.confirmedByTo) session.status = 'scheduled';
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/sessions/:id/complete
const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('swapRequest');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'completed';
    await session.save();

    session.swapRequest.status = 'completed';
    await session.swapRequest.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/sessions/swap/:swapRequestId
const getSessionsBySwap = async (req, res) => {
  try {
    const sessions = await Session.find({ swapRequest: req.params.swapRequestId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSession, confirmSession, completeSession, getSessionsBySwap };
