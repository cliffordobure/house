const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// @desc    Get tenants by property
// @route   GET /api/tenants/property/:propertyId
// @access  Private (Owner)
exports.getTenantsByProperty = async (req, res) => {
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

    const tenants = await User.find({
      _id: { $in: property.tenants },
      role: 'tenant',
    }).select('-password');

    // Get rent balance for each tenant
    const tenantsWithBalance = await Promise.all(
      tenants.map(async (tenant) => {
        const payments = await Payment.find({
          tenantId: tenant._id,
          propertyId: property._id,
          status: 'success',
        }).sort({ date: -1 });

        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const balance = property.rentAmount - (totalPaid % property.rentAmount);

        // Calculate due date (assuming rent is due on the 5th of each month)
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), 5);
        if (today.getDate() > 5) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        return {
          ...tenant.toObject(),
          rentBalance: {
            totalRent: property.rentAmount,
            totalPaid: totalPaid,
            balance: balance,
            dueDate: dueDate,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      tenants: tenantsWithBalance,
    });
  } catch (error) {
    console.error('Get tenants by property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get tenant's property by user ID
// @route   GET /api/tenants/user-property/:userId
// @access  Private (Tenant)
exports.getUserProperty = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Get user and their linked property
    const user = await User.findById(userId).select('linkedProperty role');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is a tenant
    if (user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants have linked properties',
      });
    }

    // Check if tenant has a linked property
    if (!user.linkedProperty) {
      return res.status(404).json({
        success: false,
        message: 'No property linked to this tenant. Please link a property first.',
      });
    }

    // Get the property details
    const property = await Property.findById(user.linkedProperty)
      .select('_id name code location rentAmount paybill accountNumber ownerId ownerName photos')
      .populate('ownerId', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Linked property not found. Please contact support.',
      });
    }

    res.status(200).json({
      success: true,
      property: {
        _id: property._id,
        propertyId: property._id, // Explicitly include propertyId
        name: property.name,
        code: property.code,
        location: property.location,
        rentAmount: property.rentAmount,
        paybill: property.paybill,
        accountNumber: property.accountNumber,
        ownerId: property.ownerId?._id,
        ownerName: property.ownerName || property.ownerId?.name,
        ownerEmail: property.ownerId?.email,
        ownerPhone: property.ownerId?.phone,
        photos: property.photos || [],
      },
    });
  } catch (error) {
    console.error('Get user property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user property',
    });
  }
};

// @desc    Get tenant details
// @route   GET /api/tenants/:id
// @access  Private
exports.getTenantDetails = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id)
      .select('-password')
      .populate('linkedProperty');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    // Check authorization
    if (
      req.user.role === 'tenant' &&
      tenant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this tenant',
      });
    }

    if (req.user.role === 'owner') {
      const property = await Property.findOne({
        _id: tenant.linkedProperty,
        ownerId: req.user._id,
      });

      if (!property) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this tenant',
        });
      }
    }

    // Get rent balance
    if (tenant.linkedProperty) {
      const property = await Property.findById(tenant.linkedProperty);
      const payments = await Payment.find({
        tenantId: tenant._id,
        propertyId: property._id,
        status: 'success',
      }).sort({ date: -1 });

      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = property.rentAmount - (totalPaid % property.rentAmount);

      // Calculate due date
      const today = new Date();
      const dueDate = new Date(today.getFullYear(), today.getMonth(), 5);
      if (today.getDate() > 5) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const tenantWithBalance = {
        ...tenant.toObject(),
        rentBalance: {
          totalRent: property.rentAmount,
          totalPaid: totalPaid,
          balance: balance,
          dueDate: dueDate,
        },
      };

      return res.status(200).json({
        success: true,
        tenant: tenantWithBalance,
      });
    }

    res.status(200).json({
      success: true,
      tenant,
    });
  } catch (error) {
    console.error('Get tenant details error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

