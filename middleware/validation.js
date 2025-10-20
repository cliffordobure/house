const { body, validationResult } = require('express-validator');

// Handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Registration validation rules
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^254\d{9}$/)
    .withMessage('Phone number must be in format 254XXXXXXXXX'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['owner', 'tenant'])
    .withMessage('Role must be either owner or tenant'),
  body('houseCode')
    .if(body('role').equals('tenant'))
    .notEmpty()
    .withMessage('House code is required for tenants'),
];

// Login validation rules
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Property creation validation rules
exports.propertyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Property name is required'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('rentAmount')
    .notEmpty()
    .withMessage('Rent amount is required')
    .isNumeric()
    .withMessage('Rent amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rent amount must be positive'),
  body('paybill')
    .trim()
    .notEmpty()
    .withMessage('Paybill number is required'),
  body('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Property code is required')
    .isLength({ min: 3 })
    .withMessage('Property code must be at least 3 characters'),
];

// Payment initiation validation rules
exports.paymentValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Invalid property ID'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 1, max: 150000 })
    .withMessage('Amount must be between 1 and 150,000'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^254\d{9}$/)
    .withMessage('Phone number must be in format 254XXXXXXXXX'),
];

// Complaint creation validation rules
exports.complaintValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Invalid property ID'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Complaint title is required'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Complaint description is required'),
];

