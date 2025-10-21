const express = require('express');
const router = express.Router();
const {
  getTenantsByProperty,
  getTenantDetails,
  getUserProperty,
  unlinkProperty,
  kickOutTenant,
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tenants/property/:propertyId
router.get(
  '/property/:propertyId',
  protect,
  authorize('owner', 'admin'),
  getTenantsByProperty
);

// @route   GET /api/tenants/user-property/:userId
router.get('/user-property/:userId', protect, getUserProperty);

// @route   GET /api/tenants/:id
router.get('/:id', protect, getTenantDetails);

// @route   POST /api/tenants/unlink
router.post('/unlink', protect, authorize('tenant'), unlinkProperty);

// @route   POST /api/tenants/kick-out
router.post('/kick-out', protect, authorize('owner', 'admin'), kickOutTenant);

module.exports = router;

