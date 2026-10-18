const Review = require('../models/Review');
const Session = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const notify = require('../utils/notify');
const { recomputeReputation } = require('../utils/reputation');
const cache = require('../utils/cache');

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const {
      swapId,
      swapRequestId,
      sessionId,
      revieweeId,
      rating,
      comment,
      feedback,
      text,
    } = req.body;

    const targetRating = parseInt(rating, 10);
    if (!targetRating || targetRating < 1 || targetRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    let targetSwap = null;
    let targetSession = null;

    const targetSwapId = swapId || swapRequestId;
    if (targetSwapId) {
      targetSwap = await SwapRequest.findById(targetSwapId);
    }

    if (sessionId) {
      targetSession = await Session.findById(sessionId);
      if (targetSession && !targetSwap && (targetSession.swapRequest || targetSession.swap)) {
        targetSwap = await SwapRequest.findById(targetSession.swapRequest || targetSession.swap);
      }
    }

    if (!targetSwap) {
      return res.status(404).json({ success: false, message: 'Swap exchange not found' });
    }

    // Must be completed
    if (targetSwap.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted for completed swaps (current status: '${targetSwap.status}')`,
      });
    }

    const requesterId = String(targetSwap.fromUser || targetSwap.requester);
    const providerId = String(targetSwap.toUser || targetSwap.provider);
    const myId = String(req.user._id);

    if (myId !== requesterId && myId !== providerId) {
      return res.status(403).json({
        success: false,
        message: 'Only participants in this swap are permitted to submit a review',
      });
    }

    const counterpartId = myId === requesterId ? providerId : requesterId;
    if (revieweeId && String(revieweeId) !== counterpartId) {
      return res.status(400).json({
        success: false,
        message: 'Reviewee must be the other participant in this swap',
      });
    }

    // Check duplicate
    const existing = await Review.findOne({ swap: targetSwap._id, reviewer: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this swap exchange',
      });
    }

    const reviewText = (comment || feedback || text || '').trim();

    const review = await Review.create({
      swap: targetSwap._id,
      session: targetSession ? targetSession._id : null,
      reviewer: req.user._id,
      reviewee: counterpartId,
      rating: targetRating,
      comment: reviewText,
      text: reviewText,
    });

    // Recalculate reviewee's reputation & check Verified Badge
    await recomputeReputation(counterpartId);

    // Notify reviewee
    await notify({
      recipient: counterpartId,
      actor: req.user._id,
      type: 'review_received',
      message: `${req.user.name} reviewed your skill exchange (${targetRating} ★)${reviewText ? `: "${reviewText}"` : ''}`,
      link: '/my-swaps',
      relatedId: review._id,
    });

    cache.invalidate(`dash:${counterpartId}`);
    cache.invalidate(`dash:${myId}`);

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name profilePicUrl avatar isVerified rating')
      .populate('reviewee', 'name profilePicUrl avatar isVerified rating');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview,
      ...populatedReview.toObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this swap exchange',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/user/:userId
const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const total = await Review.countDocuments({ reviewee: userId });
    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name profilePicUrl avatar isVerified rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/swap/:swapId
const getReviewsForSwap = async (req, res) => {
  try {
    const { swapId } = req.params;
    const reviews = await Review.find({ swap: swapId })
      .populate('reviewer', 'name profilePicUrl avatar isVerified rating')
      .populate('reviewee', 'name profilePicUrl avatar isVerified rating')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/received
const getMyReceivedReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const total = await Review.countDocuments({ reviewee: req.user._id });
    const reviews = await Review.find({ reviewee: req.user._id })
      .populate('reviewer', 'name profilePicUrl avatar isVerified rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/given
const getMyGivenReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const total = await Review.countDocuments({ reviewer: req.user._id });
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('reviewee', 'name profilePicUrl avatar isVerified rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForSwap,
  getMyReceivedReviews,
  getMyGivenReviews,
};
