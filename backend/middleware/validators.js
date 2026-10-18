const { body, validationResult } = require('express-validator');
const { CATEGORIES, LEVELS } = require('../utils/constants');

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
    .isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is mandatory')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is mandatory')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[0-9\s-]{7,15}$/).withMessage('Please provide a valid phone number'),
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

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

const skillValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('Title must be between 2 and 120 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
  body('type')
    .optional()
    .isIn(['teach', 'want', 'learn']).withMessage("Skill type must be 'teach' or 'learn'"),
  body('category')
    .optional()
    .isIn(CATEGORIES).withMessage(`Invalid skill category. Must be one of: ${CATEGORIES.join(', ')}`),
  body('level')
    .optional()
    .custom((val) => {
      const lower = String(val).toLowerCase();
      if (!LEVELS.includes(lower)) {
        throw new Error(`Invalid level. Allowed: ${LEVELS.join(', ')}`);
      }
      return true;
    }),
  body('mode')
    .optional()
    .isIn(['online', 'in-person', 'both'])
    .withMessage('Invalid delivery mode'),
];

const swapRequestValidation = [
  body('toUser')
    .optional()
    .isMongoId().withMessage('Invalid user identifier format'),
  body('requestedSkill')
    .optional()
    .isMongoId().withMessage('Invalid requested skill identifier format'),
];

const sessionValidation = [
  body('durationMinutes')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('meetingLink')
    .optional({ checkFalsy: true })
    .matches(/^https:\/\/[^\s]+$/i).withMessage('Meeting link must be a valid HTTPS URL'),
];

const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
];

const messageValidation = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  skillValidation,
  swapRequestValidation,
  sessionValidation,
  reviewValidation,
  messageValidation,
};
