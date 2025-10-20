const Property = require('../models/Property');
const User = require('../models/User');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private (Admin)
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('tenants', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get owner's properties
// @route   GET /api/properties/my-properties
// @access  Private (Owner)
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id })
      .populate('tenants', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Private
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('tenants', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check authorization
    if (
      req.user.role === 'owner' &&
      property.ownerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this property',
      });
    }

    if (
      req.user.role === 'tenant' &&
      property._id.toString() !== req.user.linkedProperty?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this property',
      });
    }

    res.status(200).json({
      success: true,
      property,
    });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create property
// @route   POST /api/properties/create
// @access  Private (Owner)
exports.createProperty = async (req, res) => {
  try {
    const {
      name,
      location,
      rentAmount,
      paybill,
      accountNumber,
      code,
      photos,
      propertyType,
      numberOfRooms,
      description,
    } = req.body;

    // Check if property code already exists
    const existingProperty = await Property.findOne({ code: code.toUpperCase() });
    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Property code already exists',
      });
    }

    const property = await Property.create({
      ownerId: req.user._id,
      ownerName: req.user.name,
      name,
      location,
      rentAmount,
      paybill,
      accountNumber,
      code: code.toUpperCase(),
      photos: photos || [],
      propertyType,
      numberOfRooms,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property,
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/update/:id
// @access  Private (Owner)
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if user owns the property
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property',
      });
    }

    const {
      name,
      location,
      rentAmount,
      paybill,
      accountNumber,
      photos,
      propertyType,
      numberOfRooms,
      description,
    } = req.body;

    // Update fields
    if (name) property.name = name;
    if (location) property.location = location;
    if (rentAmount) property.rentAmount = rentAmount;
    if (paybill) property.paybill = paybill;
    if (accountNumber) property.accountNumber = accountNumber;
    if (photos) property.photos = photos;
    if (propertyType) property.propertyType = propertyType;
    if (numberOfRooms !== undefined) property.numberOfRooms = numberOfRooms;
    if (description !== undefined) property.description = description;

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property,
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/delete/:id
// @access  Private (Owner)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if user owns the property
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property',
      });
    }

    // Remove property reference from tenants
    await User.updateMany(
      { linkedProperty: property._id },
      { $set: { linkedProperty: null } }
    );

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Link tenant to property
// @route   POST /api/properties/link
// @access  Private (Tenant)
exports.linkToProperty = async (req, res) => {
  try {
    const { houseCode } = req.body;

    if (!houseCode) {
      return res.status(400).json({
        success: false,
        message: 'House code is required',
      });
    }

    const property = await Property.findOne({ code: houseCode.toUpperCase() });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Invalid house code',
      });
    }

    // Check if already linked
    if (req.user.linkedProperty) {
      return res.status(400).json({
        success: false,
        message: 'You are already linked to a property',
      });
    }

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      linkedProperty: property._id,
    });

    // Add tenant to property
    await Property.findByIdAndUpdate(property._id, {
      $addToSet: { tenants: req.user._id },
    });

    res.status(200).json({
      success: true,
      message: 'Successfully linked to property',
      property,
    });
  } catch (error) {
    console.error('Link to property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Bulk create properties
// @route   POST /api/properties/bulk-create
// @access  Private (Owner)
exports.bulkCreateProperties = async (req, res) => {
  try {
    const { 
      propertyTemplate, 
      numberOfRooms, 
      roomPrefix, 
      startingNumber 
    } = req.body;

    // Validate required fields
    if (!propertyTemplate || !numberOfRooms || !roomPrefix || startingNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: 'propertyTemplate, numberOfRooms, roomPrefix, and startingNumber are required',
      });
    }

    // Validate numberOfRooms
    if (numberOfRooms < 1 || numberOfRooms > 200) {
      return res.status(400).json({
        success: false,
        message: 'numberOfRooms must be between 1 and 200',
      });
    }

    // Validate propertyTemplate required fields
    const requiredFields = ['name', 'location', 'rentAmount', 'paybill', 'accountNumber'];
    for (const field of requiredFields) {
      if (!propertyTemplate[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required in propertyTemplate`,
        });
      }
    }

    const properties = [];
    const existingCodes = new Set();

    // Generate properties
    for (let i = 0; i < numberOfRooms; i++) {
      const roomNumber = startingNumber + i;
      const baseName = propertyTemplate.name.replace(/\s*-\s*Room\s*\d+$/, ''); // Remove existing room suffix
      const propertyName = `${baseName} - ${roomPrefix} ${roomNumber}`;
      
      // Generate unique house code
      let houseCode;
      let attempts = 0;
      do {
        houseCode = generateHouseCode(baseName, roomNumber, attempts);
        attempts++;
      } while (existingCodes.has(houseCode) && attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate unique house codes. Please try with fewer rooms.',
        });
      }

      existingCodes.add(houseCode);

      const property = {
        ownerId: req.user._id,
        ownerName: req.user.name,
        name: propertyName,
        location: propertyTemplate.location,
        rentAmount: propertyTemplate.rentAmount,
        paybill: propertyTemplate.paybill,
        accountNumber: propertyTemplate.accountNumber,
        code: houseCode,
        tenants: [],
        photos: propertyTemplate.photos || [],
        propertyType: propertyTemplate.propertyType || 'apartment',
        numberOfRooms: propertyTemplate.numberOfRooms || 1,
        description: `${propertyTemplate.description || 'Modern apartment'} - ${roomPrefix} ${roomNumber}`,
      };

      properties.push(property);
    }

    // Check for existing codes in database
    const existingProperties = await Property.find({
      code: { $in: Array.from(existingCodes) }
    });

    if (existingProperties.length > 0) {
      const existingCodesList = existingProperties.map(p => p.code).join(', ');
      return res.status(400).json({
        success: false,
        message: `Some house codes already exist: ${existingCodesList}`,
      });
    }

    // Bulk insert to MongoDB
    const createdProperties = await Property.insertMany(properties);
    
    res.status(201).json({
      success: true,
      message: `Successfully created ${createdProperties.length} properties`,
      count: createdProperties.length,
      properties: createdProperties.map(p => ({
        _id: p._id,
        name: p.name,
        code: p.code,
        location: p.location,
        rentAmount: p.rentAmount,
      })),
    });
  } catch (error) {
    console.error('Bulk create properties error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Some property codes already exist. Please try again.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create properties',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Helper function to generate house code
function generateHouseCode(baseName, roomNumber, attempt = 0) {
  // Clean base name and create abbreviation
  const cleanName = baseName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3); // Take first 3 characters

  // Format room number with leading zeros
  const formattedRoomNumber = roomNumber.toString().padStart(3, '0');
  
  // Add attempt suffix if needed for uniqueness
  const suffix = attempt > 0 ? `-${attempt}` : '';
  
  return `${cleanName}-${formattedRoomNumber}${suffix}`.toUpperCase();
}

