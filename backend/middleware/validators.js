const { body, validationResult } = require('express-validator');

// Middleware to evaluate validation chains and return standardized errors
const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  };
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is mandatory')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is mandatory')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Mobile number is mandatory for account security and verification')
    .matches(/^[+]?[0-9]{10,15}$/).withMessage('Please provide a valid 10 to 15 digit mobile number'),
  body('password')
    .notEmpty().withMessage('Password is mandatory')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const otpVerifyValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must consist of numbers only'),
];

const skillValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Skill title is required')
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),
  body('type')
    .isIn(['teach', 'want']).withMessage("Skill type must be 'teach' or 'want'"),
  body('category')
    .optional()
    .isIn(['Tech', 'Music', 'Language', 'Fitness', 'Art', 'Cooking', 'Academic', 'Other'])
    .withMessage('Invalid skill category'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Expert'])
    .withMessage('Invalid proficiency level'),
  body('mode')
    .optional()
    .isIn(['online', 'in-person', 'both'])
    .withMessage('Invalid delivery mode'),
];

const swapRequestValidation = [
  body('toUser')
    .notEmpty().withMessage('Target user ID is required')
    .isMongoId().withMessage('Invalid user identifier format'),
  body('offeredSkill')
    .notEmpty().withMessage('Offered skill is required')
    .isMongoId().withMessage('Invalid offered skill identifier format'),
  body('requestedSkill')
    .notEmpty().withMessage('Requested skill is required')
    .isMongoId().withMessage('Invalid requested skill identifier format'),
];

const sessionValidation = [
  body('swapRequestId')
    .notEmpty().withMessage('Swap request identifier is required')
    .isMongoId().withMessage('Invalid swap request identifier'),
  body('scheduledDateTime')
    .notEmpty().withMessage('Scheduled date and time is required')
    .isISO8601().withMessage('Please provide a valid date/time format'),
  body('mode')
    .isIn(['online', 'in-person']).withMessage("Session mode must be 'online' or 'in-person'"),
];

const reviewValidation = [
  body('sessionId')
    .notEmpty().withMessage('Session identifier is required')
    .isMongoId().withMessage('Invalid session identifier'),
  body('revieweeId')
    .notEmpty().withMessage('Reviewee identifier is required')
    .isMongoId().withMessage('Invalid reviewee identifier'),
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
];

const messageValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Message text is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  otpVerifyValidation,
  skillValidation,
  swapRequestValidation,
  sessionValidation,
  reviewValidation,
  messageValidation,
};
