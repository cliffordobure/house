const Complaint = require('../models/Complaint');
const Property = require('../models/Property');
const User = require('../models/User');
const { sendNotificationToDevice } = require('../utils/firebase');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private (Admin/Owner)
exports.getAllComplaints = async (req, res) => {
  try {
    let complaints;

    if (req.user.role === 'admin') {
      // Admin can see all complaints
      complaints = await Complaint.find().sort({ createdAt: -1 });
    } else if (req.user.role === 'owner') {
      // Owner can only see complaints for their properties
      const properties = await Property.find({ ownerId: req.user._id });
      const propertyIds = properties.map((p) => p._id);

      complaints = await Complaint.find({
        propertyId: { $in: propertyIds },
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create complaint
// @route   POST /api/complaints/create
// @access  Private (Tenant)
exports.createComplaint = async (req, res) => {
  try {
    const { propertyId, title, description, images } = req.body;

    // Verify property
    const property = await Property.findById(propertyId).populate('ownerId');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Verify tenant is linked to property
    if (req.user.linkedProperty?.toString() !== propertyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not linked to this property',
      });
    }

    const complaint = await Complaint.create({
      tenantId: req.user._id,
      tenantName: req.user.name,
      propertyId: property._id,
      propertyName: property.name,
      title,
      description,
      images: images || [],
      status: 'pending',
    });

    // Send notification to property owner
    if (property.ownerId && property.ownerId.fcmToken) {
      await sendNotificationToDevice(
        property.ownerId.fcmToken,
        'New Complaint',
        `${req.user.name} submitted a complaint: ${title}`,
        {
          type: 'new_complaint',
          complaintId: complaint._id.toString(),
          propertyId: property._id.toString(),
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/update/:id
// @access  Private (Owner)
exports.updateComplaint = async (req, res) => {
  try {
    const { status, ownerResponse } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify owner owns the property
    const property = await Property.findById(complaint.propertyId);
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this complaint',
      });
    }

    if (status) complaint.status = status;
    if (ownerResponse) complaint.ownerResponse = ownerResponse;

    await complaint.save();

    // Send notification to tenant
    const tenant = await User.findById(complaint.tenantId);
    if (tenant && tenant.fcmToken) {
      await sendNotificationToDevice(
        tenant.fcmToken,
        'Complaint Update',
        `Your complaint "${complaint.title}" has been updated`,
        {
          type: 'complaint_update',
          complaintId: complaint._id.toString(),
          status: complaint.status,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint,
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Resolve complaint
// @route   POST /api/complaints/resolve/:id
// @access  Private (Owner)
exports.resolveComplaint = async (req, res) => {
  try {
    const { ownerResponse } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify owner owns the property
    const property = await Property.findById(complaint.propertyId);
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to resolve this complaint',
      });
    }

    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    if (ownerResponse) complaint.ownerResponse = ownerResponse;

    await complaint.save();

    // Send notification to tenant
    const tenant = await User.findById(complaint.tenantId);
    if (tenant && tenant.fcmToken) {
      await sendNotificationToDevice(
        tenant.fcmToken,
        'Complaint Resolved',
        `Your complaint "${complaint.title}" has been resolved`,
        {
          type: 'complaint_resolved',
          complaintId: complaint._id.toString(),
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully',
      complaint,
    });
  } catch (error) {
    console.error('Resolve complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get complaints by property
// @route   GET /api/complaints/property/:propertyId
// @access  Private (Owner)
exports.getComplaintsByProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

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
        message: 'Not authorized to access this property',
      });
    }

    const complaints = await Complaint.find({
      propertyId: req.params.propertyId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get complaints by property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get complaints by tenant
// @route   GET /api/complaints/tenant/:tenantId
// @access  Private
exports.getComplaintsByTenant = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    // Check authorization
    if (
      req.user.role === 'tenant' &&
      tenantId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these complaints',
      });
    }

    const complaints = await Complaint.find({ tenantId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error('Get complaints by tenant error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

