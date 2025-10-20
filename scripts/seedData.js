const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Property = require('../models/Property');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');

    // Clear existing data
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Property.deleteMany({});

    console.log('Existing data cleared...');

    // Create sample owner
    const owner = await User.create({
      name: 'John Owner',
      email: 'owner@test.com',
      phone: '254712345678',
      password: 'password123',
      role: 'owner',
      isApproved: true,
    });

    console.log('✅ Sample owner created');

    // Create sample properties
    const properties = await Property.create([
      {
        ownerId: owner._id,
        ownerName: owner.name,
        name: 'Sunrise Apartments',
        location: 'Westlands, Nairobi',
        rentAmount: 25000,
        paybill: '4032786',
        accountNumber: 'ACC001',
        code: 'SUN-A1-001',
        propertyType: 'apartment',
        numberOfRooms: 2,
        description: 'Modern 2-bedroom apartment with parking',
        photos: [],
      },
      {
        ownerId: owner._id,
        ownerName: owner.name,
        name: 'Palm View Estate',
        location: 'Kilimani, Nairobi',
        rentAmount: 35000,
        paybill: '4032786',
        accountNumber: 'ACC002',
        code: 'PALM-B2-002',
        propertyType: 'apartment',
        numberOfRooms: 3,
        description: 'Spacious 3-bedroom with balcony',
        photos: [],
      },
    ]);

    console.log('✅ Sample properties created');

    // Create sample tenants
    const tenant1 = await User.create({
      name: 'Jane Tenant',
      email: 'tenant1@test.com',
      phone: '254723456789',
      password: 'password123',
      role: 'tenant',
      linkedProperty: properties[0]._id,
      isApproved: false,
    });

    const tenant2 = await User.create({
      name: 'Mike Tenant',
      email: 'tenant2@test.com',
      phone: '254734567890',
      password: 'password123',
      role: 'tenant',
      linkedProperty: properties[1]._id,
      isApproved: false,
    });

    // Add tenants to properties
    await Property.findByIdAndUpdate(properties[0]._id, {
      $push: { tenants: tenant1._id },
    });

    await Property.findByIdAndUpdate(properties[1]._id, {
      $push: { tenants: tenant2._id },
    });

    console.log('✅ Sample tenants created');

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║     Sample Data Created Successfully!     ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('📧 Sample Users:\n');
    console.log('Owner:');
    console.log('  Email: owner@test.com');
    console.log('  Password: password123\n');
    
    console.log('Tenant 1:');
    console.log('  Email: tenant1@test.com');
    console.log('  Password: password123');
    console.log('  House Code: SUN-A1-001\n');
    
    console.log('Tenant 2:');
    console.log('  Email: tenant2@test.com');
    console.log('  Password: password123');
    console.log('  House Code: PALM-B2-002\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

