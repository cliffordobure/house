const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@propertyhub.com' });

    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@propertyhub.com',
      phone: '254700000000',
      password: 'admin123456',
      role: 'admin',
      isApproved: true,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email: admin@propertyhub.com');
    console.log('Password: admin123456');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

