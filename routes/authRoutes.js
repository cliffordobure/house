const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyToken,
} = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  validate,
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// @route   POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// @route   GET /api/auth/verify
router.get('/verify', protect, verifyToken);

module.exports = router;

