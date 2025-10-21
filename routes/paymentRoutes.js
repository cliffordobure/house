const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  paymentCallback,
  getPaymentHistory,
  getPaymentsByProperty,
  getRentBalance,
  b2bCallback,
  manualDisbursement,
  getDisbursementStatus,
  getOwnerDisbursements,
  retryFailedDisbursements,
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

// @route   POST /api/payments/b2b-callback
router.post('/b2b-callback', b2bCallback);

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

// @route   POST /api/payments/disburse/:paymentId
router.post(
  '/disburse/:paymentId',
  protect,
  authorize('owner', 'admin'),
  manualDisbursement
);

// @route   GET /api/payments/disbursement-status/:paymentId
router.get('/disbursement-status/:paymentId', protect, getDisbursementStatus);

// @route   GET /api/payments/disbursements/owner
router.get(
  '/disbursements/owner',
  protect,
  authorize('owner'),
  getOwnerDisbursements
);

// @route   POST /api/payments/retry-failed-disbursements
router.post(
  '/retry-failed-disbursements',
  protect,
  authorize('admin'),
  retryFailedDisbursements
);

module.exports = router;

