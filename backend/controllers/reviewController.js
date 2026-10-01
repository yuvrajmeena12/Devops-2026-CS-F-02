const Review = require('../models/Review');
const Session = require('../models/Session');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

const VERIFICATION_THRESHOLD = parseInt(process.env.VERIFICATION_THRESHOLD, 10) || 5;

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { sessionId, revieweeId, rating, comment } = req.body;
    if (!sessionId || !revieweeId || !rating) {
      return res.status(400).json({ message: 'sessionId, revieweeId, and rating are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Mark session completed if not already
    if (session.status !== 'completed') {
      session.status = 'completed';
      await session.save();
      if (session.swapRequest) {
        await SwapRequest.findByIdAndUpdate(session.swapRequest, { status: 'completed' });
      }
    }

    const existing = await Review.findOne({ session: sessionId, reviewer: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      session: sessionId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: Number(rating),
      comment: comment || '',
    });

    // Recalculate reviewee's rating & completed swaps count
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;

    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      reviewee.rating = roundedRating;
      reviewee.trustScore = roundedRating;
      reviewee.ratingCount = allReviews.length;
      reviewee.completedSwapsCount = (reviewee.completedSwapsCount || 0) + 1;

      // Check for SkillSwap Verified Badge eligibility (Threshold 5–10 completed + rated exchanges)
      if (reviewee.completedSwapsCount >= VERIFICATION_THRESHOLD && roundedRating >= 3.5 && !reviewee.isVerified) {
        reviewee.isVerified = true;
        await createNotification(
          revieweeId,
          'verified_badge',
          `🎉 Congratulations! You have completed ${reviewee.completedSwapsCount} rated skill exchanges and earned the SkillSwap Verified Badge!`,
          review._id
        );
      }

      await reviewee.save();
    }

    await createNotification(
      revieweeId,
      'new_review',
      `${req.user.name} rated your skill exchange (${rating} ★)${comment ? `: "${comment}"` : ''}`,
      review._id
    );

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/user/:userId
const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name profilePicUrl isVerified')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getReviewsForUser };
