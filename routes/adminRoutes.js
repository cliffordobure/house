const express = require('express');
const router = express.Router();
const {
  approveOwner,
  getSystemStats,
  getAllTransactions,
  getAllUsers,
  deleteUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/admin/approve-owner/:ownerId
router.post('/approve-owner/:ownerId', protect, authorize('admin'), approveOwner);

// @route   GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), getSystemStats);

// @route   GET /api/admin/transactions
router.get('/transactions', protect, authorize('admin'), getAllTransactions);

// @route   GET /api/admin/users
router.get('/users', protect, authorize('admin'), getAllUsers);

// @route   DELETE /api/admin/users/:userId
router.delete('/users/:userId', protect, authorize('admin'), deleteUser);

module.exports = router;

