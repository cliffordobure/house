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
    const { name, email, phone, password, role, houseCode, landlordEmail } = req.body;

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

    let linkedProperty = null;
    let referralCreated = false;

    // Handle tenant-specific logic
    if (role === 'tenant') {
      // Validate that either houseCode OR landlordEmail is provided
      if (!houseCode && !landlordEmail) {
        return res.status(400).json({
          success: false,
          message: 'Tenants must provide either house code or landlord email',
        });
      }
      
      if (houseCode && landlordEmail) {
        return res.status(400).json({
          success: false,
          message: 'Please provide either house code OR landlord email, not both',
        });
      }

      // Handle house code registration
      if (houseCode) {
        const property = await Property.findOne({ code: houseCode.toUpperCase() });
        
        if (!property) {
          return res.status(404).json({
            success: false,
            message: 'Invalid house code',
          });
        }

        // Check if property has available space (optional - you can add maxTenants field to Property model)
        // if (property.tenants && property.tenants.length >= property.maxTenants) {
        //   return res.status(400).json({
        //     success: false,
        //     message: 'This property is full',
        //   });
        // }

        linkedProperty = property._id;
      }

      // Handle landlord referral
      if (landlordEmail) {
        try {
          await createLandlordReferral({
            tenantEmail: email,
            tenantName: name,
            tenantPhone: phone,
            landlordEmail: landlordEmail,
          });
          referralCreated = true;
        } catch (referralError) {
          console.error('Error creating landlord referral:', referralError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create landlord referral',
          });
        }
      }
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
      status: 'active',
    });

    // If tenant with house code, add to property's tenant list
    if (role === 'tenant' && linkedProperty) {
      await Property.findByIdAndUpdate(linkedProperty, {
        $addToSet: { tenants: user._id },
      });
    }

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

    // Prepare response message
    let message = 'Registration successful';
    if (referralCreated) {
      message += '. Landlord invitation sent successfully';
    }

    res.status(201).json({
      success: true,
      message,
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
      referralCreated,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// Helper function to create landlord referral
const createLandlordReferral = async (referralData) => {
  try {
    // Check if referral already exists
    const existingReferral = await LandlordReferral.findOne({
      tenantEmail: referralData.tenantEmail,
      landlordEmail: referralData.landlordEmail,
    });

    if (existingReferral) {
      throw new Error('Referral already exists for this landlord');
    }

    // Create referral record
    const referral = await LandlordReferral.create({
      tenantEmail: referralData.tenantEmail,
      tenantName: referralData.tenantName,
      tenantPhone: referralData.tenantPhone,
      landlordEmail: referralData.landlordEmail,
      status: 'pending',
    });

    // Send email to landlord
    await emailService.sendLandlordInvitationEmail({
      landlordEmail: referralData.landlordEmail,
      tenantName: referralData.tenantName,
      tenantEmail: referralData.tenantEmail,
      tenantPhone: referralData.tenantPhone,
    });

    console.log(`Landlord referral created for ${referralData.landlordEmail}`);
    return referral;
  } catch (error) {
    console.error('Error creating landlord referral:', error);
    throw error;
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

