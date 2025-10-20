const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');
const { upload } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth');

// @route   POST /api/upload/image
router.post('/image', protect, upload.single('image'), uploadImage);

// @route   POST /api/upload/images
router.post('/images', protect, upload.array('images', 10), uploadMultipleImages);

module.exports = router;

