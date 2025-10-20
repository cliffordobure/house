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
    .custom((value) => {
      // Remove any spaces or special characters except + at the beginning
      const cleanPhone = value.replace(/\s/g, '');
      
      // Check for different phone number formats
      const patterns = [
        /^254\d{9}$/,        // 254XXXXXXXXX
        /^\+254\d{9}$/,      // +254XXXXXXXXX
        /^07\d{8}$/,         // 07XXXXXXXX
        /^7\d{8}$/           // 7XXXXXXXX
      ];
      
      const isValid = patterns.some(pattern => pattern.test(cleanPhone));
      
      if (!isValid) {
        throw new Error('Phone number must be in format: 254XXXXXXXXX, +254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX');
      }
      
      return true;
    }),
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

// Landlord referral validation rules
exports.landlordReferralValidation = [
  body('landlordName')
    .trim()
    .notEmpty()
    .withMessage('Landlord name is required')
    .isLength({ min: 2 })
    .withMessage('Landlord name must be at least 2 characters'),
  body('landlordEmail')
    .trim()
    .notEmpty()
    .withMessage('Landlord email is required')
    .isEmail()
    .withMessage('Please provide a valid landlord email'),
  body('landlordPhone')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Optional field
      
      const cleanPhone = value.replace(/\s/g, '');
      const patterns = [
        /^254\d{9}$/,
        /^\+254\d{9}$/,
        /^07\d{8}$/,
        /^7\d{8}$/
      ];
      
      const isValid = patterns.some(pattern => pattern.test(cleanPhone));
      
      if (!isValid) {
        throw new Error('Phone number must be in format: 254XXXXXXXXX, +254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX');
      }
      
      return true;
    }),
  body('propertyAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Property address must not exceed 500 characters'),
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
    .custom((value) => {
      // Remove any spaces or special characters except + at the beginning
      const cleanPhone = value.replace(/\s/g, '');
      
      // Check for different phone number formats
      const patterns = [
        /^254\d{9}$/,        // 254XXXXXXXXX
        /^\+254\d{9}$/,      // +254XXXXXXXXX
        /^07\d{8}$/,         // 07XXXXXXXX
        /^7\d{8}$/           // 7XXXXXXXX
      ];
      
      const isValid = patterns.some(pattern => pattern.test(cleanPhone));
      
      if (!isValid) {
        throw new Error('Phone number must be in format: 254XXXXXXXXX, +254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX');
      }
      
      return true;
    }),
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

// Bulk property creation validation rules
exports.bulkPropertyValidation = [
  body('propertyTemplate')
    .notEmpty()
    .withMessage('Property template is required')
    .isObject()
    .withMessage('Property template must be an object'),
  body('propertyTemplate.name')
    .trim()
    .notEmpty()
    .withMessage('Property name is required'),
  body('propertyTemplate.location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),
  body('propertyTemplate.rentAmount')
    .notEmpty()
    .withMessage('Rent amount is required')
    .isNumeric()
    .withMessage('Rent amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Rent amount must be positive'),
  body('propertyTemplate.paybill')
    .trim()
    .notEmpty()
    .withMessage('Paybill number is required'),
  body('propertyTemplate.accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required'),
  body('numberOfRooms')
    .notEmpty()
    .withMessage('Number of rooms is required')
    .isInt({ min: 1, max: 200 })
    .withMessage('Number of rooms must be between 1 and 200'),
  body('roomPrefix')
    .trim()
    .notEmpty()
    .withMessage('Room prefix is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Room prefix must be between 1 and 20 characters'),
  body('startingNumber')
    .notEmpty()
    .withMessage('Starting number is required')
    .isInt({ min: 1 })
    .withMessage('Starting number must be a positive integer'),
];

