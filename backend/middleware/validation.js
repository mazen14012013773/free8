const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and can only contain letters, numbers, and underscores'),
  body('role')
    .optional()
    .isIn(['client', 'freelancer'])
    .withMessage('Role must be either client or freelancer'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Service validation rules
const createServiceValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Title must be between 10 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('category')
    .isIn([
      'graphics-design',
      'digital-marketing',
      'writing-translation',
      'video-animation',
      'music-audio',
      'programming-tech',
      'business',
      'lifestyle',
      'data',
      'photography'
    ])
    .withMessage('Invalid category'),
  body('subcategory')
    .trim()
    .notEmpty()
    .withMessage('Subcategory is required'),
  body('packages')
    .isArray({ min: 1, max: 3 })
    .withMessage('At least one package is required'),
  body('packages.*.name')
    .isIn(['basic', 'standard', 'premium'])
    .withMessage('Package name must be basic, standard, or premium'),
  body('packages.*.title')
    .trim()
    .notEmpty()
    .withMessage('Package title is required'),
  body('packages.*.price')
    .isFloat({ min: 5 })
    .withMessage('Package price must be at least $5'),
  body('packages.*.deliveryTime')
    .isInt({ min: 1 })
    .withMessage('Delivery time must be at least 1 day'),
  handleValidationErrors
];

// Order validation rules
const createOrderValidation = [
  body('serviceId')
    .isMongoId()
    .withMessage('Invalid service ID'),
  body('packageName')
    .isIn(['basic', 'standard', 'premium'])
    .withMessage('Package name must be basic, standard, or premium'),
  body('requirements')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Requirements must be between 10 and 2000 characters'),
  handleValidationErrors
];

// Review validation rules
const createReviewValidation = [
  body('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review must be between 10 and 1000 characters'),
  body('communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  body('serviceQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Service quality rating must be between 1 and 5'),
  handleValidationErrors
];

// Message validation rules
const sendMessageValidation = [
  body('recipientId')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('conversationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid conversation ID'),
  handleValidationErrors
];

// Report validation rules
const createReportValidation = [
  body('type')
    .isIn(['user', 'service', 'order', 'message', 'review'])
    .withMessage('Invalid report type'),
  body('targetId')
    .isMongoId()
    .withMessage('Invalid target ID'),
  body('reason')
    .isIn([
      'inappropriate_content',
      'spam',
      'harassment',
      'fake_profile',
      'scam',
      'copyright_violation',
      'terms_violation',
      'payment_issue',
      'quality_issue',
      'other'
    ])
    .withMessage('Invalid reason'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  handleValidationErrors
];

// Profile update validation
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('skills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 skills allowed'),
  body('skills.*')
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each skill cannot exceed 30 characters'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  createServiceValidation,
  createOrderValidation,
  createReviewValidation,
  sendMessageValidation,
  createReportValidation,
  updateProfileValidation
};