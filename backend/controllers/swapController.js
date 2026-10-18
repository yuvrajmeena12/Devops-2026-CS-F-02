const SwapRequest = require('../models/SwapRequest');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Review = require('../models/Review');
const notify = require('../utils/notify');
const cache = require('../utils/cache');

// POST /api/swaps (Propose swap with collision guard and ownership checks)
const createSwapRequest = async (req, res) => {
  try {
    const {
      toUser,
      providerId,
      offeredSkill,
      offeredSkillId,
      requestedSkill,
      skillId,
      message,
    } = req.body;

    const targetSkillId = requestedSkill || skillId;
    const myOfferedSkillId = offeredSkill || offeredSkillId;

    if (!targetSkillId) {
      return res.status(400).json({ success: false, message: 'Requested skill ID is required' });
    }

    const targetSkill = await Skill.findById(targetSkillId);
    if (!targetSkill) {
      return res.status(404).json({ success: false, message: 'Requested skill does not exist' });
    }

    const targetUserId = toUser || providerId || targetSkill.user;

    // Self-swap prevention
    if (String(targetUserId) === String(req.user._id) || String(targetSkill.user) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot propose a swap with yourself' });
    }

    // Ownership verification for offered skill if provided
    let verifiedOfferedSkill = null;
    if (myOfferedSkillId) {
      const ownedSkill = await Skill.findOne({ _id: myOfferedSkillId, user: req.user._id });
      if (!ownedSkill) {
        return res.status(400).json({ success: false, message: 'You can only offer skills that you own' });
      }
      if (ownedSkill.type !== 'teach') {
        return res.status(400).json({ success: false, message: 'Offered skill must be a skill you teach' });
      }
      verifiedOfferedSkill = ownedSkill._id;
    }

    // Collision check: prevent duplicate active proposals
    const ACTIVE_STATUSES = ['pending', 'accepted', 'scheduled', 'in_progress'];
    const collision = await SwapRequest.findOne({
      fromUser: req.user._id,
      requestedSkill: targetSkill._id,
      status: { $in: ACTIVE_STATUSES },
    });

    if (collision) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active proposal or swap in progress for this skill',
      });
    }

    const swap = await SwapRequest.create({
      fromUser: req.user._id,
      toUser: targetUserId,
      requester: req.user._id,
      provider: targetUserId,
      offeredSkill: verifiedOfferedSkill,
      requestedSkill: targetSkill._id,
      message: message ? String(message).trim() : '',
      status: 'pending',
    });

    await swap.populate('fromUser toUser', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount');
    await swap.populate('offeredSkill requestedSkill');

    // Notify provider
    await notify({
      recipient: targetUserId,
      actor: req.user._id,
      type: 'swap_request',
      message: `${req.user.name} proposed a skill swap for "${targetSkill.title || targetSkill.name}"`,
      link: '/my-swaps',
      relatedId: swap._id,
    });

    cache.invalidate(`dash:${String(req.user._id)}`);
    cache.invalidate(`dash:${String(targetUserId)}`);

    res.status(201).json({
      success: true,
      message: 'Swap proposal submitted successfully',
      swap,
      id: swap._id,
      status: swap.status,
      ...swap.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps (Filtered with tab buckets, pagination, and batch hydration)
const getSwaps = async (req, res) => {
  try {
    const { tab = 'all', direction, page = 1, limit = 20 } = req.query;
    const me = req.user._id;

    const query = {};

    if (direction === 'sent') query.fromUser = me;
    else if (direction === 'received') query.toUser = me;
    else query.$or = [{ fromUser: me }, { toUser: me }];

    if (tab === 'pending') query.status = 'pending';
    else if (tab === 'active') query.status = { $in: ['accepted', 'scheduled', 'in_progress'] };
    else if (tab === 'completed') query.status = 'completed';
    else if (tab === 'closed') query.status = { $in: ['rejected', 'declined', 'cancelled'] };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const [swaps, total] = await Promise.all([
      SwapRequest.find(query)
        .populate('fromUser toUser requester provider', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount')
        .populate('offeredSkill requestedSkill')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      SwapRequest.countDocuments(query),
    ]);

    // Batch hydration: bulk fetch active sessions and reviews for returned swaps
    const swapIds = swaps.map((s) => s._id);
    const [sessions, reviews] = await Promise.all([
      Session.find({ swapRequest: { $in: swapIds } }).sort({ createdAt: -1 }).lean(),
      Review.find({ swap: { $in: swapIds }, reviewer: me }).lean(),
    ]);

    const sessionBySwap = new Map();
    sessions.forEach((sess) => {
      const k = String(sess.swapRequest || sess.swap);
      if (!sessionBySwap.has(k)) sessionBySwap.set(k, sess);
    });

    const reviewedSwapSet = new Set(reviews.map((r) => String(r.swap)));

    const items = swaps.map((s) => {
      const isRequester = String(s.fromUser?._id || s.requester?._id || s.fromUser) === String(me);
      const isProvider = String(s.toUser?._id || s.provider?._id || s.toUser) === String(me);
      const session = sessionBySwap.get(String(s._id)) || null;
      const hasReviewed = reviewedSwapSet.has(String(s._id));

      const allowedActions = {
        canAccept: isProvider && s.status === 'pending',
        canDecline: isProvider && s.status === 'pending',
        canCancel: (isRequester && s.status === 'pending') || (['accepted', 'scheduled'].includes(s.status)),
        canSchedule: ['accepted', 'scheduled'].includes(s.status),
        canComplete: ['scheduled', 'in_progress'].includes(s.status),
        canReview: s.status === 'completed' && !hasReviewed,
      };

      return {
        ...s,
        id: s._id,
        session,
        hasReviewed,
        allowedActions,
      };
    });

    res.set('X-Total-Count', total.toString());
    const response = items;
    response.items = items;
    response.page = parsedPage;
    response.limit = parsedLimit;
    response.total = total;
    response.hasMore = total > skip + parsedLimit;

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps/counts (Tab badges and incoming pending total)
const getSwapCounts = async (req, res) => {
  try {
    const me = req.user._id;

    const [pending, active, completed, closed, incomingPending] = await Promise.all([
      SwapRequest.countDocuments({
        $or: [{ fromUser: me }, { toUser: me }],
        status: 'pending',
      }),
      SwapRequest.countDocuments({
        $or: [{ fromUser: me }, { toUser: me }],
        status: { $in: ['accepted', 'scheduled', 'in_progress'] },
      }),
      SwapRequest.countDocuments({
        $or: [{ fromUser: me }, { toUser: me }],
        status: 'completed',
      }),
      SwapRequest.countDocuments({
        $or: [{ fromUser: me }, { toUser: me }],
        status: { $in: ['rejected', 'declined', 'cancelled'] },
      }),
      SwapRequest.countDocuments({
        toUser: me,
        status: 'pending',
      }),
    ]);

    const total = pending + active + completed + closed;

    res.json({
      counts: {
        pending,
        active,
        completed,
        closed,
        all: total,
      },
      incomingPending,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps/incoming
const getIncoming = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ toUser: req.user._id })
      .populate('fromUser toUser requester provider', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps/sent
const getSent = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ fromUser: req.user._id })
      .populate('fromUser toUser requester provider', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps/active
const getActive = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({
      status: { $in: ['accepted', 'scheduled', 'in_progress'] },
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    })
      .populate('fromUser toUser requester provider', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/swaps/all
const getAllMySwaps = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    })
      .populate('fromUser toUser requester provider', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount')
      .populate('offeredSkill requestedSkill')
      .sort({ createdAt: -1 });
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/swaps/:id/accept & PUT /api/swaps/:id/accept (Provider only)
const acceptSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    // Authorization: only target provider can accept
    if (String(swap.toUser) !== String(req.user._id) && String(swap.provider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the requested skill provider can accept this proposal' });
    }

    if (swap.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Proposal cannot be accepted from '${swap.status}' state` });
    }

    swap.status = 'accepted';
    swap.respondedAt = new Date();
    await swap.save();

    await notify({
      recipient: swap.fromUser,
      actor: req.user._id,
      type: 'swap_accepted',
      message: `${req.user.name} accepted your skill swap request! You can now schedule a session.`,
      link: '/my-swaps',
      relatedId: swap._id,
    });

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(req.user._id)}`);

    res.json({ success: true, message: 'Swap request accepted', status: 'accepted', swap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/swaps/:id/reject & PUT /api/swaps/:id/decline (Provider only)
const declineSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    if (String(swap.toUser) !== String(req.user._id) && String(swap.provider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the requested skill provider can decline this proposal' });
    }

    if (swap.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Proposal cannot be declined from '${swap.status}' state` });
    }

    swap.status = 'rejected';
    swap.respondedAt = new Date();
    await swap.save();

    await notify({
      recipient: swap.fromUser,
      actor: req.user._id,
      type: 'swap_rejected',
      message: `${req.user.name} politely declined your swap proposal`,
      link: '/my-swaps',
      relatedId: swap._id,
    });

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(req.user._id)}`);

    res.json({ success: true, message: 'Swap request declined', status: 'rejected', swap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/swaps/:id/cancel & PUT /api/swaps/:id/cancel (With cascading session cleanup)
const cancelSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ success: false, message: 'Swap request not found' });

    const isRequester = String(swap.fromUser) === String(req.user._id) || String(swap.requester) === String(req.user._id);
    const isProvider = String(swap.toUser) === String(req.user._id) || String(swap.provider) === String(req.user._id);

    if (!isRequester && !isProvider) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this swap' });
    }

    if (swap.status === 'in_progress' || swap.status === 'completed') {
      return res.status(400).json({ success: false, message: `Cannot cancel a swap that is ${swap.status}` });
    }

    if (swap.status === 'pending' && !isRequester) {
      return res.status(403).json({ success: false, message: 'Providers must decline pending requests rather than withdraw' });
    }

    swap.status = 'cancelled';
    await swap.save();

    // Cascading cleanup: Cancel all upcoming scheduled sessions for this swap
    await Session.updateMany(
      { swapRequest: swap._id, status: { $in: ['proposed', 'scheduled'] } },
      { $set: { status: 'cancelled' } }
    );

    const counterpartId = isRequester ? swap.toUser : swap.fromUser;
    await notify({
      recipient: counterpartId,
      actor: req.user._id,
      type: 'swap_cancelled',
      message: `${req.user.name} cancelled the skill swap`,
      link: '/my-swaps',
      relatedId: swap._id,
    });

    cache.invalidate(`dash:${String(swap.fromUser)}`);
    cache.invalidate(`dash:${String(swap.toUser)}`);

    res.json({ success: true, message: 'Swap cancelled successfully', status: 'cancelled', swap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSwapRequest,
  getSwaps,
  getSwapCounts,
  getIncoming,
  getSent,
  getActive,
  getAllMySwaps,
  acceptSwap,
  declineSwap,
  cancelSwap,
};
