const User = require('../models/User');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
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

