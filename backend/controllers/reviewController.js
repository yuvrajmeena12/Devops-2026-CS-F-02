const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { sessionId, revieweeId, rating, comment } = req.body;
    if (!sessionId || !revieweeId || !rating) {
      return res.status(400).json({ message: 'sessionId, revieweeId and rating are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review a completed session' });
    }

    const existing = await Review.findOne({ session: sessionId, reviewer: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this session' });

    const review = await Review.create({
      session: sessionId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment,
    });

    // Recalculate reviewee's trust score
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      trustScore: Math.round(avg * 10) / 10,
      $inc: { completedSwapsCount: 1 },
    });

    await createNotification(revieweeId, 'new_review', `${req.user.name} left you a review`, review._id);

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/reviews/user/:userId
const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name profilePicUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getReviewsForUser };
