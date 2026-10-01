const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validate, reviewValidation } = require('../middleware/validators');
const { createReview, getReviewsForUser } = require('../controllers/reviewController');

router.post('/', protect, validate(reviewValidation), createReview);
router.get('/user/:userId', getReviewsForUser);

module.exports = router;
