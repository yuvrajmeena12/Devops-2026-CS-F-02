const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, reviewValidation } = require('../middleware/validators');
const {
  createReview,
  getReviewsForUser,
  getReviewsForSwap,
  getMyReceivedReviews,
  getMyGivenReviews,
} = require('../controllers/reviewController');

router.post('/', protect, validate(reviewValidation), createReview);
router.get('/received', protect, getMyReceivedReviews);
router.get('/given', protect, getMyGivenReviews);
router.get('/swap/:swapId', protect, getReviewsForSwap);
router.get('/user/:userId', getReviewsForUser);

module.exports = router;
