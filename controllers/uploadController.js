const { uploadImage } = require('../utils/cloudinary');

// @desc    Upload image
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadImage(req.file, 'propertyhub');

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    // Upload all images to Cloudinary
    const { uploadMultipleImages } = require('../utils/cloudinary');
    const imageUrls = await uploadMultipleImages(req.files, 'propertyhub');

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      imageUrls,
    });
  } catch (error) {
    console.error('Upload multiple images error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images',
    });
  }
};

