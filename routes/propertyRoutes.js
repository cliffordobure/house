const express = require('express');
const router = express.Router();
const {
  getAllProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  linkToProperty,
} = require('../controllers/propertyController');
const { propertyValidation, validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/properties
router.get('/', protect, authorize('admin'), getAllProperties);

// @route   GET /api/properties/my-properties
router.get('/my-properties', protect, authorize('owner'), getMyProperties);

// @route   GET /api/properties/:id
router.get('/:id', protect, getPropertyById);

// @route   POST /api/properties/create
router.post(
  '/create',
  protect,
  authorize('owner'),
  propertyValidation,
  validate,
  createProperty
);

// @route   PUT /api/properties/update/:id
router.put('/update/:id', protect, authorize('owner'), updateProperty);

// @route   DELETE /api/properties/delete/:id
router.delete('/delete/:id', protect, authorize('owner'), deleteProperty);

// @route   POST /api/properties/link
router.post('/link', protect, authorize('tenant'), linkToProperty);

module.exports = router;

