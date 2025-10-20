const User = require('../models/User');
const Property = require('../models/Property');
const LandlordReferral = require('../models/LandlordReferral');
const { generateToken } = require('../utils/jwt');
const emailService = require('../utils/emailService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    // Create user (no property linking during registration)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      linkedProperty: null, // Property will be linked later via setup
      isApproved: role === 'tenant' ? false : true, // Tenants need approval after linking
      status: 'active',
    });

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email (optional)
    try {
      await emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

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
        status: user.status,
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

// @desc    Send landlord referral
// @route   POST /api/auth/send-landlord-referral
// @access  Private (Tenant)
exports.sendLandlordReferral = async (req, res) => {
  try {
    const { landlordName, landlordEmail, landlordPhone, propertyAddress } = req.body;

    // Validate required fields
    if (!landlordName || !landlordEmail) {
      return res.status(400).json({
        success: false,
        message: 'Landlord name and email are required',
      });
    }

    // Check if user is a tenant
    if (req.user.role !== 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Only tenants can send landlord referrals',
      });
    }

    // Check if referral already exists for this tenant-landlord combination
    const existingReferral = await LandlordReferral.findOne({
      tenantEmail: req.user.email,
      landlordEmail: landlordEmail,
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'You have already sent a referral to this landlord',
      });
    }

    // Create referral record
    const referral = await LandlordReferral.create({
      tenantEmail: req.user.email,
      tenantName: req.user.name,
      tenantPhone: req.user.phone,
      landlordEmail: landlordEmail,
      status: 'pending',
      notes: propertyAddress ? `Property address: ${propertyAddress}` : null,
    });

    // Send email to landlord
    try {
      await emailService.sendLandlordInvitationEmail({
        landlordEmail: landlordEmail,
        landlordName: landlordName,
        tenantName: req.user.name,
        tenantEmail: req.user.email,
        tenantPhone: req.user.phone,
        propertyAddress: propertyAddress,
      });
      console.log(`✅ Landlord invitation sent to ${landlordEmail}`);
    } catch (emailError) {
      console.error('Error sending landlord invitation email:', emailError);
      // Don't fail the request if email fails - referral is still created
    }

    res.status(201).json({
      success: true,
      message: 'Landlord referral sent successfully',
      referral: {
        _id: referral._id,
        landlordEmail: referral.landlordEmail,
        status: referral.status,
        createdAt: referral.createdAt,
      },
    });
  } catch (error) {
    console.error('Send landlord referral error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send landlord referral',
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

