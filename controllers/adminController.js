const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const LandlordReferral = require('../models/LandlordReferral');
const { sendNotificationToDevice } = require('../utils/firebase');

// @desc    Approve owner
// @route   POST /api/admin/approve-owner/:ownerId
// @access  Private (Admin)
exports.approveOwner = async (req, res) => {
  try {
    const owner = await User.findById(req.params.ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    if (owner.role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'User is not an owner',
      });
    }

    owner.isApproved = true;
    await owner.save();

    // Send notification to owner
    if (owner.fcmToken) {
      await sendNotificationToDevice(
        owner.fcmToken,
        'Account Approved',
        'Your owner account has been approved. You can now manage your properties.',
        {
          type: 'account_approved',
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Owner approved successfully',
    });
  } catch (error) {
    console.error('Approve owner error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    
    const allPayments = await Payment.find({ status: 'success' });
    const totalPayments = allPayments.length;
    const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

    res.status(200).json({
      success: true,
      stats: {
        totalProperties,
        totalOwners,
        totalTenants,
        totalPayments,
        totalRevenue,
        pendingComplaints,
        resolvedComplaints,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin)
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find()
      .sort({ date: -1 })
      .populate('tenantId', 'name email phone')
      .populate('propertyId', 'name location');

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('linkedProperty', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is an owner, delete their properties
    if (user.role === 'owner') {
      await Property.deleteMany({ ownerId: user._id });
    }

    // If user is a tenant, remove from property
    if (user.role === 'tenant' && user.linkedProperty) {
      await Property.findByIdAndUpdate(user.linkedProperty, {
        $pull: { tenants: user._id },
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get landlord referrals
// @route   GET /api/admin/landlord-referrals
// @access  Private (Admin)
exports.getLandlordReferrals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const referrals = await LandlordReferral.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LandlordReferral.countDocuments(filter);

    res.status(200).json({
      success: true,
      referrals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get landlord referrals error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update referral status
// @route   PUT /api/admin/landlord-referrals/:id
// @access  Private (Admin)
exports.updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, landlordResponse, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['pending', 'contacted', 'registered', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      });
    }

    const updateData = {
      status,
      respondedAt: new Date(),
    };

    if (landlordResponse) updateData.landlordResponse = landlordResponse;
    if (notes) updateData.notes = notes;

    const referral = await LandlordReferral.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Referral status updated successfully',
      referral,
    });
  } catch (error) {
    console.error('Update referral status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get referral statistics
// @route   GET /api/admin/referral-stats
// @access  Private (Admin)
exports.getReferralStats = async (req, res) => {
  try {
    const stats = await LandlordReferral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalReferrals = await LandlordReferral.countDocuments();
    const recentReferrals = await LandlordReferral.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    const formattedStats = {
      total: totalReferrals,
      recent: recentReferrals,
      byStatus: {},
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      stats: formattedStats,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

