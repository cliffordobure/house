const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  paymentCallback,
  getPaymentHistory,
  getPaymentsByProperty,
  getRentBalance,
} = require('../controllers/paymentController');
const { paymentValidation, validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/payments/initiate
router.post(
  '/initiate',
  protect,
  authorize('tenant'),
  paymentValidation,
  validate,
  initiatePayment
);

// @route   POST /api/payments/callback
router.post('/callback', paymentCallback);

// @route   GET /api/payments/history/:tenantId
router.get('/history/:tenantId', protect, getPaymentHistory);

// @route   GET /api/payments/property/:propertyId
router.get(
  '/property/:propertyId',
  protect,
  authorize('owner', 'admin'),
  getPaymentsByProperty
);

// @route   GET /api/payments/balance/:tenantId
router.get('/balance/:tenantId', protect, getRentBalance);

module.exports = router;

