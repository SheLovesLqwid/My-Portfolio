const { body, validationResult, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log validation failures for security monitoring
    console.warn('Validation failed:', {
      ip: req.ip,
      url: req.originalUrl,
      errors: errors.array(),
      timestamp: new Date()
    });
    
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

// Enhanced password validation
const validateStrongPassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Sanitization helpers
const sanitizeString = (field) => body(field).trim().escape();
const sanitizeEmail = (field) => body(field).isEmail().normalizeEmail().escape();

// MongoDB ObjectId validation
const validateObjectId = (field) => param(field).isMongoId().withMessage('Invalid ID format');

const validateUser = [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Auditor', 'Manager', 'User']).withMessage('Invalid role'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateRisk = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isIn(['Operational', 'Technical', 'Financial', 'Strategic', 'Compliance', 'Reputational']).withMessage('Invalid category'),
  body('likelihood').isInt({ min: 1, max: 5 }).withMessage('Likelihood must be between 1 and 5'),
  body('impact').isInt({ min: 1, max: 5 }).withMessage('Impact must be between 1 and 5'),
  body('treatment').isIn(['Accept', 'Mitigate', 'Transfer', 'Avoid']).withMessage('Invalid treatment'),
  body('reviewDate').isISO8601().withMessage('Invalid review date'),
  handleValidationErrors
];

const validateSoA = [
  body('controlId').trim().notEmpty().withMessage('Control ID is required'),
  body('controlTitle').trim().isLength({ min: 3 }).withMessage('Control title must be at least 3 characters'),
  body('controlDescription').trim().isLength({ min: 10 }).withMessage('Control description must be at least 10 characters'),
  body('applicability').isIn(['Applicable', 'Not Applicable']).withMessage('Invalid applicability'),
  body('implementationStatus').isIn(['Not Implemented', 'Partially Implemented', 'Implemented', 'Not Applicable']).withMessage('Invalid implementation status'),
  body('justification').trim().isLength({ min: 10 }).withMessage('Justification must be at least 10 characters'),
  body('nextReviewDate').isISO8601().withMessage('Invalid next review date'),
  handleValidationErrors
];

const validateAudit = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('type').isIn(['Internal', 'External', 'Certification', 'Surveillance']).withMessage('Invalid audit type'),
  body('scope').trim().isLength({ min: 10 }).withMessage('Scope must be at least 10 characters'),
  body('objectives').trim().isLength({ min: 10 }).withMessage('Objectives must be at least 10 characters'),
  body('auditCriteria').trim().isLength({ min: 10 }).withMessage('Audit criteria must be at least 10 characters'),
  body('plannedStartDate').isISO8601().withMessage('Invalid planned start date'),
  body('plannedEndDate').isISO8601().withMessage('Invalid planned end date'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateLogin,
  validateRisk,
  validateSoA,
  validateAudit,
  handleValidationErrors
};
