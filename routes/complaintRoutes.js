const express = require('express');
const router = express.Router();
const {
  getAllComplaints,
  createComplaint,
  updateComplaint,
  resolveComplaint,
  getComplaintsByProperty,
  getComplaintsByTenant,
  getComplaintsByTenantAndProperty,
} = require('../controllers/complaintController');
const { complaintValidation, validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/complaints
router.get('/', protect, authorize('admin', 'owner'), getAllComplaints);

// @route   POST /api/complaints/create
router.post(
  '/create',
  protect,
  authorize('tenant'),
  complaintValidation,
  validate,
  createComplaint
);

// @route   PUT /api/complaints/update/:id
router.put('/update/:id', protect, authorize('owner'), updateComplaint);

// @route   POST /api/complaints/resolve/:id
router.post('/resolve/:id', protect, authorize('owner'), resolveComplaint);

// @route   GET /api/complaints/property/:propertyId
router.get(
  '/property/:propertyId',
  protect,
  authorize('owner', 'admin'),
  getComplaintsByProperty
);

// @route   GET /api/complaints/tenant/:tenantId
router.get('/tenant/:tenantId', protect, getComplaintsByTenant);

// @route   GET /api/complaints/tenant/:tenantId/property/:propertyId
router.get('/tenant/:tenantId/property/:propertyId', protect, getComplaintsByTenantAndProperty);

module.exports = router;

