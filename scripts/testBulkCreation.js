const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const testBulkCreation = async () => {
  try {
    console.log('🧪 Testing Bulk Property Creation API...\n');

    // Test data
    const testData = {
      propertyTemplate: {
        name: "Test Apartments",
        location: "Nairobi, Kenya",
        rentAmount: 20000,
        paybill: "4032786",
        accountNumber: "TEST001",
        description: "Test property for bulk creation",
        propertyType: "apartment",
        numberOfRooms: 1,
        photos: []
      },
      numberOfRooms: 5,
      roomPrefix: "Unit",
      startingNumber: 1
    };

    // First, login as owner to get token
    console.log('1. Logging in as owner...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'owner@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test bulk creation
    console.log('2. Testing bulk property creation...');
    const startTime = Date.now();
    
    const bulkResponse = await axios.post(
      'http://localhost:5000/api/properties/bulk-create',
      testData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ Bulk creation successful!');
    console.log(`📊 Results:`);
    console.log(`   - Properties created: ${bulkResponse.data.count}`);
    console.log(`   - Time taken: ${duration}ms`);
    console.log(`   - Properties:`);
    
    bulkResponse.data.properties.forEach((property, index) => {
      console.log(`     ${index + 1}. ${property.name} (${property.code})`);
    });

    console.log('\n🎉 Bulk creation test completed successfully!');

    // Clean up - delete test properties
    console.log('\n3. Cleaning up test properties...');
    const Property = require('./models/Property');
    
    await Property.deleteMany({
      code: { $in: bulkResponse.data.properties.map(p => p.code) }
    });
    
    console.log('✅ Test properties cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Run the test
testBulkCreation().then(() => {
  console.log('\n✨ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});

