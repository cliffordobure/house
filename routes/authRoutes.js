const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyToken,
  sendLandlordReferral,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  landlordReferralValidation,
  validate,
} = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// @route   GET /api/auth/verify
router.get('/verify', protect, verifyToken);

// @route   POST /api/auth/send-landlord-referral
router.post('/send-landlord-referral', protect, authorize('tenant'), landlordReferralValidation, validate, sendLandlordReferral);

module.exports = router;

