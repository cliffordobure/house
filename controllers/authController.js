const User = require('../models/User');
const Property = require('../models/Property');
const { generateToken } = require('../utils/jwt');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, houseCode } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    let linkedProperty = null;

    // If tenant, verify and link to property
    if (role === 'tenant') {
      if (!houseCode) {
        return res.status(400).json({
          success: false,
          message: 'House code is required for tenants',
        });
      }

      const property = await Property.findOne({ code: houseCode.toUpperCase() });
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Invalid house code',
        });
      }

      linkedProperty = property._id;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      linkedProperty,
      isApproved: role === 'tenant' ? false : true, // Tenants need approval
    });

    // If tenant, add to property's tenant list
    if (role === 'tenant' && linkedProperty) {
      await Property.findByIdAndUpdate(linkedProperty, {
        $addToSet: { tenants: user._id },
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        linkedProperty: user.linkedProperty,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        linkedProperty: user.linkedProperty,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Verify token and get user
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        linkedProperty: user.linkedProperty,
        isApproved: user.isApproved,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

