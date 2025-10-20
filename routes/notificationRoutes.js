const express = require('express');
const router = express.Router();
const {
  registerToken,
  sendNotification,
  sendMultipleNotifications,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/notifications/register-token
router.post('/register-token', protect, registerToken);

// @route   POST /api/notifications/send
router.post('/send', protect, authorize('admin', 'owner'), sendNotification);

// @route   POST /api/notifications/send-multiple
router.post(
  '/send-multiple',
  protect,
  authorize('admin', 'owner'),
  sendMultipleNotifications
);

module.exports = router;

