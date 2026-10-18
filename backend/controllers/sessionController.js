const Session = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const notify = require('../utils/notify');
const { recomputeReputation } = require('../utils/reputation');
const cache = require('../utils/cache');

const MIN_LEAD_MS = 5 * 60 * 1000; // 5 minutes minimum lead time

// POST /api/sessions (Schedule or reschedule exchange session)
const createSession = async (req, res) => {
  try {
    const {
      swapRequestId,
      swapId,
      scheduledDateTime,
      scheduledAt,
      durationMinutes = 60,
      mode = 'online',
      meetingLink,
      address,
      details,
    } = req.body;

    const targetSwapId = swapRequestId || swapId;
    if (!targetSwapId) {
      return res.status(400).json({ success: false, message: 'Swap request identifier is required' });
    }

    const swap = await SwapRequest.findById(targetSwapId);
    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    const isRequester = String(swap.fromUser) === String(req.user._id) || String(swap.requester) === String(req.user._id);
    const isProvider = String(swap.toUser) === String(req.user._id) || String(swap.provider) === String(req.user._id);

    if (!isRequester && !isProvider) {
      return res.status(403).json({ success: false, message: 'Only participants in this swap can schedule sessions' });
    }

    if (!['accepted', 'scheduled'].includes(swap.status)) {
      return res.status(400).json({
        success: false,
        message: `Sessions can only be scheduled for swaps in 'accepted' or 'scheduled' state (currently '${swap.status}')`,
      });
    }

    const rawDate = scheduledDateTime || scheduledAt;
    if (!rawDate) {
      return res.status(400).json({ success: false, message: 'Scheduled date and time is required' });
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date/time format' });
    }

    // Lead time validation: minimum 5 minutes in future
    if (parsedDate.getTime() < Date.now() + MIN_LEAD_MS) {
      return res.status(400).json({
        success: false,
        message: 'Session start time must be at least 5 minutes in the future',
      });
    }

    // Duration validation: 15 to 480 minutes
    const parsedDuration = parseInt(durationMinutes, 10) || 60;
    if (parsedDuration < 15 || parsedDuration > 480) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 15 and 480 minutes',
      });
    }

    // HTTPS meeting link validation
    if (meetingLink && meetingLink.trim()) {
      if (!/^https:\/\/[^\s]+$/i.test(meetingLink.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Virtual meeting link must be a valid HTTPS URL (e.g. Google Meet, Zoom, Teams)',
        });
      }
    }

    // Rescheduling: Automatically cancel previous scheduled sessions for this swap
    await Session.updateMany(
      { swapRequest: swap._id, status: { $in: ['proposed', 'scheduled'] } },
      { $set: { status: 'cancelled' } }
    );

    const counterpartId = isRequester ? swap.toUser : swap.fromUser;

    const session = await Session.create({
      swapRequest: swap._id,
      swap: swap._id,
      participants: [swap.fromUser, swap.toUser],
      scheduledBy: req.user._id,
      scheduledDateTime: parsedDate,
      scheduledAt: parsedDate,
      durationMinutes: parsedDuration,
      mode: mode === 'in-person' ? 'in-person' : 'online',
      meetingLink: meetingLink ? meetingLink.trim() : '',
      address: address ? address.trim() : '',
      details: details ? details.trim() : '',
      confirmedByFrom: true,
      confirmedByTo: true,
      status: 'scheduled',
    });

    // Sync swap status and clear completion confirmations on reschedule
    swap.status = 'scheduled';
    swap.completionConfirmedBy = [];
    await swap.save();

    await notify({
      recipient: counterpartId,
      actor: req.user._id,
      type: 'session_scheduled',
      message: `${req.user.name} scheduled a swap session for ${parsedDate.toLocaleDateString()} at ${parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      link: '/my-swaps',
      relatedId: session._id,
    });

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(swap.toUser)}`);

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      session,
      ...session.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions (List sessions by scope)
const getSessions = async (req, res) => {
  try {
    const { scope = 'upcoming', page = 1, limit = 20 } = req.query;
    const me = req.user._id;

    const query = { participants: me };
    const now = new Date();

    if (scope === 'upcoming') {
      query.status = 'scheduled';
      query.scheduledDateTime = { $gte: now };
    } else if (scope === 'completed') {
      query.status = 'completed';
    } else if (scope === 'cancelled') {
      query.status = 'cancelled';
    }

    const sortOrder = scope === 'upcoming' ? { scheduledDateTime: 1 } : { scheduledDateTime: -1 };
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate({
          path: 'swapRequest swap',
          populate: [
            { path: 'requestedSkill', select: 'title name' },
            { path: 'offeredSkill', select: 'title name' },
            { path: 'fromUser', select: 'name profilePicUrl' },
            { path: 'toUser', select: 'name profilePicUrl' },
          ],
        })
        .sort(sortOrder)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Session.countDocuments(query),
    ]);

    const formatted = sessions.map((s) => ({
      ...s,
      id: s._id,
      scheduledAt: s.scheduledDateTime || s.scheduledAt,
    }));

    res.json({
      items: formatted,
      page: parsedPage,
      limit: parsedLimit,
      total,
      hasMore: total > skip + parsedLimit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/swap/:swapRequestId
const getSessionsBySwap = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ swapRequest: req.params.swapRequestId }, { swap: req.params.swapRequestId }],
    }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/sessions/:id/cancel (Cancel scheduled session and revert swap to accepted)
const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const swap = await SwapRequest.findById(session.swapRequest || session.swap);
    if (!swap) return res.status(404).json({ success: false, message: 'Parent swap request not found' });

    const isRequester = String(swap.fromUser) === String(req.user._id);
    const isProvider = String(swap.toUser) === String(req.user._id);

    if (!isRequester && !isProvider) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this session' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed session' });
    }

    session.status = 'cancelled';
    await session.save();

    // Revert swap back to accepted so participants can reschedule
    swap.status = 'accepted';
    swap.completionConfirmedBy = [];
    await swap.save();

    const counterpartId = isRequester ? swap.toUser : swap.fromUser;
    await notify({
      recipient: counterpartId,
      actor: req.user._id,
      type: 'session_cancelled',
      message: `${req.user.name} cancelled the scheduled session. You can reschedule whenever you are ready.`,
      link: '/my-swaps',
      relatedId: session._id,
    });

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(swap.toUser)}`);

    res.json({
      success: true,
      message: 'Session cancelled and swap agreement reverted to accepted state for rescheduling',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/sessions/:id/complete & PUT /api/sessions/:id/complete (Time-gated, two-party mutual completion)
const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const swap = await SwapRequest.findById(session.swapRequest || session.swap);
    if (!swap) return res.status(404).json({ success: false, message: 'Parent swap request not found' });

    const isRequester = String(swap.fromUser) === String(req.user._id);
    const isProvider = String(swap.toUser) === String(req.user._id);

    if (!isRequester && !isProvider) {
      return res.status(403).json({ success: false, message: 'Only swap participants can confirm completion' });
    }

    // 1. Time-gate verification: start time must have arrived
    const sessionTime = new Date(session.scheduledDateTime || session.scheduledAt).getTime();
    if (sessionTime > Date.now()) {
      return res.status(403).json({
        success: false,
        message: 'You can mark a session complete once its start time has passed',
      });
    }

    // 2. Idempotent addition to completionConfirmedBy array using MongoDB $addToSet
    const updatedSwap = await SwapRequest.findByIdAndUpdate(
      swap._id,
      { $addToSet: { completionConfirmedBy: req.user._id } },
      { new: true }
    );

    const counterpartId = isRequester ? swap.toUser : swap.fromUser;
    const confirmedCount = updatedSwap.completionConfirmedBy.length;
    const bothConfirmed = confirmedCount >= 2;

    if (!bothConfirmed) {
      // First party confirmed
      updatedSwap.status = 'in_progress';
      await updatedSwap.save();

      await notify({
        recipient: counterpartId,
        actor: req.user._id,
        type: 'swap_completed',
        message: `${req.user.name} marked your exchange session as completed. Confirm to finalize the swap!`,
        link: '/my-swaps',
        relatedId: updatedSwap._id,
      });

      return res.json({
        success: true,
        message: 'Completion recorded. Awaiting partner confirmation.',
        swapStatus: 'in_progress',
        awaitingOther: true,
        session,
      });
    }

    // Both parties confirmed: complete the swap!
    updatedSwap.status = 'completed';
    updatedSwap.completedAt = new Date();
    await updatedSwap.save();

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Recompute reputation for both participants
    await Promise.all([
      recomputeReputation(swap.fromUser),
      recomputeReputation(swap.toUser),
    ]);

    // Send notifications to both participants encouraging reviews
    await Promise.all([
      notify({
        recipient: swap.fromUser,
        actor: req.user._id,
        type: 'swap_completed',
        message: '🎉 Skill swap completed! Leave a review for your partner to build their reputation.',
        link: '/my-swaps',
        relatedId: updatedSwap._id,
      }),
      notify({
        recipient: swap.toUser,
        actor: req.user._id,
        type: 'swap_completed',
        message: '🎉 Skill swap completed! Leave a review for your partner to build their reputation.',
        link: '/my-swaps',
        relatedId: updatedSwap._id,
      }),
    ]);

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(swap.toUser)}`);

    res.json({
      success: true,
      message: 'Mutual confirmation complete! The swap is now completed.',
      swapStatus: 'completed',
      awaitingOther: false,
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/sessions/:id/confirm (Legacy bridge for existing frontend stepper)
const confirmSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    session.status = 'scheduled';
    session.confirmedByFrom = true;
    session.confirmedByTo = true;
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionsBySwap,
  cancelSession,
  completeSession,
  confirmSession,
};
