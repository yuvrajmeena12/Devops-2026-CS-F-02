const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const SwapRequest = require('../models/SwapRequest');
const notify = require('./notify');
const { VERIFICATION_THRESHOLD, VERIFICATION_MIN_RATING } = require('./constants');

/**
 * Recomputes a user's reputation purely from reviews tied to completed swaps.
 * Verified Badge rule: At least 5 completed swaps with >= 3.5 average rating.
 */
async function recomputeReputation(userId) {
  const id = new mongoose.Types.ObjectId(String(userId));

  // Aggregate quantitative reviews
  const [agg] = await Review.aggregate([
    { $match: { reviewee: id } },
    { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
  ]);

  const ratingCount = agg ? agg.count : 0;
  const ratingAvg = agg ? Math.round(agg.avg * 100) / 100 : 0;

  // Count confirmed completed swaps where user participated
  const completedSwaps = await SwapRequest.countDocuments({
    status: 'completed',
    $or: [{ fromUser: id }, { toUser: id }, { requester: id }, { provider: id }],
  });

  const isEligible = ratingCount >= VERIFICATION_THRESHOLD && ratingAvg >= VERIFICATION_MIN_RATING;

  const userBefore = await User.findById(id).select('isVerified verified');
  const wasVerified = userBefore ? Boolean(userBefore.isVerified || userBefore.verified) : false;

  const updateFields = {
    rating: ratingAvg,
    ratingAvg,
    trustScore: ratingAvg,
    ratingCount,
    completedSwapsCount: completedSwaps,
    completedSwaps,
    isVerified: isEligible,
    verified: isEligible,
  };

  if (isEligible && !wasVerified) {
    updateFields.verifiedAt = new Date();
  }

  await User.updateOne({ _id: id }, { $set: updateFields });

  if (isEligible && !wasVerified) {
    await notify({
      recipient: id,
      type: 'badge_earned',
      message: `🎉 Congratulations! You earned the SkillSwap Verified Member Badge with ${completedSwaps} completed swaps and a ${ratingAvg} average rating.`,
      link: '/profile',
      dedupeKey: `badge_earned:${String(id)}`,
    });
  }

  return {
    ratingCount,
    ratingAvg,
    completedSwaps,
    isVerified: isEligible,
    verified: isEligible,
  };
}

module.exports = { recomputeReputation };
