const axios = require('axios');

const testRegistrationFlow = async () => {
  try {
    console.log('🧪 Testing Enhanced Tenant Registration Flow...\n');

    const baseUrl = 'http://localhost:5000/api';

    // Test 1: Tenant registration with house code (existing flow)
    console.log('1. Testing tenant registration with house code...');
    try {
      const response1 = await axios.post(`${baseUrl}/auth/register`, {
        name: 'John Tenant',
        email: 'john.tenant@test.com',
        phone: '254712345678',
        password: 'password123',
        role: 'tenant',
        houseCode: 'SUN-A1-001'
      });

      console.log('✅ Tenant with house code registered successfully');
      console.log(`   User ID: ${response1.data.user._id}`);
      console.log(`   Linked Property: ${response1.data.user.linkedProperty ? 'Yes' : 'No'}`);
      console.log(`   Referral Created: ${response1.data.referralCreated ? 'Yes' : 'No'}\n`);
    } catch (error) {
      console.log('❌ Tenant with house code registration failed:');
      console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 2: Tenant registration with landlord email (new flow)
    console.log('2. Testing tenant registration with landlord email...');
    try {
      const response2 = await axios.post(`${baseUrl}/auth/register`, {
        name: 'Jane Tenant',
        email: 'jane.tenant@test.com',
        phone: '254723456789',
        password: 'password123',
        role: 'tenant',
        landlordEmail: 'landlord@example.com'
      });

      console.log('✅ Tenant with landlord email registered successfully');
      console.log(`   User ID: ${response2.data.user._id}`);
      console.log(`   Linked Property: ${response2.data.user.linkedProperty ? 'Yes' : 'No'}`);
      console.log(`   Referral Created: ${response2.data.referralCreated ? 'Yes' : 'No'}`);
      console.log(`   Message: ${response2.data.message}\n`);
    } catch (error) {
      console.log('❌ Tenant with landlord email registration failed:');
      console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 3: Owner registration (should work as before)
    console.log('3. Testing owner registration...');
    try {
      const response3 = await axios.post(`${baseUrl}/auth/register`, {
        name: 'Property Owner',
        email: 'owner.new@test.com',
        phone: '254734567890',
        password: 'password123',
        role: 'owner'
      });

      console.log('✅ Owner registered successfully');
      console.log(`   User ID: ${response3.data.user._id}`);
      console.log(`   Is Approved: ${response3.data.user.isApproved}\n`);
    } catch (error) {
      console.log('❌ Owner registration failed:');
      console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 4: Invalid tenant registration (no house code or landlord email)
    console.log('4. Testing invalid tenant registration (no house code or landlord email)...');
    try {
      await axios.post(`${baseUrl}/auth/register`, {
        name: 'Invalid Tenant',
        email: 'invalid.tenant@test.com',
        phone: '254745678901',
        password: 'password123',
        role: 'tenant'
      });
      console.log('❌ Invalid registration should have failed but succeeded\n');
    } catch (error) {
      console.log('✅ Invalid registration correctly rejected');
      console.log(`   Error: ${error.response?.data?.message}\n`);
    }

    // Test 5: Tenant with both house code and landlord email (should fail)
    console.log('5. Testing tenant with both house code and landlord email...');
    try {
      await axios.post(`${baseUrl}/auth/register`, {
        name: 'Confused Tenant',
        email: 'confused.tenant@test.com',
        phone: '254756789012',
        password: 'password123',
        role: 'tenant',
        houseCode: 'SUN-A1-001',
        landlordEmail: 'landlord@example.com'
      });
      console.log('❌ Registration with both should have failed but succeeded\n');
    } catch (error) {
      console.log('✅ Registration with both correctly rejected');
      console.log(`   Error: ${error.response?.data?.message}\n`);
    }

    // Test 6: Duplicate email registration
    console.log('6. Testing duplicate email registration...');
    try {
      await axios.post(`${baseUrl}/auth/register`, {
        name: 'Duplicate User',
        email: 'john.tenant@test.com', // Same email as test 1
        phone: '254767890123',
        password: 'password123',
        role: 'tenant',
        houseCode: 'SUN-A1-002'
      });
      console.log('❌ Duplicate email should have failed but succeeded\n');
    } catch (error) {
      console.log('✅ Duplicate email correctly rejected');
      console.log(`   Error: ${error.response?.data?.message}\n`);
    }

    console.log('🎉 Registration flow testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testRegistrationFlow().then(() => {
  console.log('\n✨ All registration flow tests completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
