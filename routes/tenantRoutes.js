const express = require('express');
const router = express.Router();
const {
  getTenantsByProperty,
  getTenantDetails,
} = require('../controllers/tenantController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tenants/property/:propertyId
router.get(
  '/property/:propertyId',
  protect,
  authorize('owner', 'admin'),
  getTenantsByProperty
);

// @route   GET /api/tenants/:id
router.get('/:id', protect, getTenantDetails);

module.exports = router;

