const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');

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

