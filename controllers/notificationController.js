const User = require('../models/User');
const {
  sendNotificationToDevice,
  sendNotificationToMultipleDevices,
} = require('../utils/firebase');

// @desc    Register FCM token
// @route   POST /api/notifications/register-token
// @access  Private
exports.registerToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    // Update user with FCM token
    await User.findByIdAndUpdate(req.user._id, {
      fcmToken: fcmToken,
    });

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully',
    });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Send notification to user
// @route   POST /api/notifications/send
// @access  Private (Admin/Owner)
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'User has not registered for notifications',
      });
    }

    // Send notification
    await sendNotificationToDevice(user.fcmToken, title, body, data || {});

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send notification',
    });
  }
};

// @desc    Send notification to multiple users
// @route   POST /api/notifications/send-multiple
// @access  Private (Admin/Owner)
exports.sendMultipleNotifications = async (req, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required',
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
    }

    // Get all users with FCM tokens
    const users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $exists: true, $ne: null },
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users with registered tokens found',
      });
    }

    const fcmTokens = users.map((user) => user.fcmToken);

    // Send notifications
    await sendNotificationToMultipleDevices(fcmTokens, title, body, data || {});

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${users.length} users`,
    });
  } catch (error) {
    console.error('Send multiple notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send notifications',
    });
  }
};

