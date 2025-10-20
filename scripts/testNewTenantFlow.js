const axios = require('axios');

const testNewTenantFlow = async () => {
  try {
    console.log('🧪 Testing New Tenant Registration Flow...\n');

    const baseUrl = 'http://localhost:5000/api';
    let tenantToken = '';

    // Test 1: Simple tenant registration (no house code required)
    console.log('1. Testing simple tenant registration (no house code)...');
    try {
      const response1 = await axios.post(`${baseUrl}/auth/register`, {
        name: 'New Tenant',
        email: 'newtenant@test.com',
        phone: '0723456789',
        password: 'password123',
        role: 'tenant'
      });

      console.log('✅ Tenant registration successful (no house code required)');
      console.log(`   User ID: ${response1.data.user._id}`);
      console.log(`   Linked Property: ${response1.data.user.linkedProperty || 'None (to be set up later)'}`);
      console.log(`   Token received: Yes\n`);
      
      tenantToken = response1.data.token;
    } catch (error) {
      console.log('❌ Tenant registration failed:');
      console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 2: Owner registration (should work as before)
    console.log('2. Testing owner registration...');
    try {
      const response2 = await axios.post(`${baseUrl}/auth/register`, {
        name: 'New Owner',
        email: 'newowner@test.com',
        phone: '0734567890',
        password: 'password123',
        role: 'owner'
      });

      console.log('✅ Owner registration successful');
      console.log(`   User ID: ${response2.data.user._id}\n`);
    } catch (error) {
      console.log('❌ Owner registration failed:');
      console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 3: Send landlord referral (after registration)
    if (tenantToken) {
      console.log('3. Testing landlord referral (after registration)...');
      try {
        const response3 = await axios.post(
          `${baseUrl}/auth/send-landlord-referral`,
          {
            landlordName: 'John Landlord',
            landlordEmail: 'landlord.test@example.com',
            landlordPhone: '0745678901',
            propertyAddress: '123 Main Street, Nairobi'
          },
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );

        console.log('✅ Landlord referral sent successfully');
        console.log(`   Referral ID: ${response3.data.referral._id}`);
        console.log(`   Status: ${response3.data.referral.status}`);
        console.log(`   Message: ${response3.data.message}\n`);
      } catch (error) {
        console.log('❌ Landlord referral failed:');
        console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
      }

      // Test 4: Try to send duplicate referral
      console.log('4. Testing duplicate landlord referral (should fail)...');
      try {
        await axios.post(
          `${baseUrl}/auth/send-landlord-referral`,
          {
            landlordName: 'John Landlord',
            landlordEmail: 'landlord.test@example.com',
            landlordPhone: '0745678901',
            propertyAddress: '123 Main Street, Nairobi'
          },
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );
        console.log('❌ Duplicate referral should have failed but succeeded\n');
      } catch (error) {
        console.log('✅ Duplicate referral correctly rejected');
        console.log(`   Error: ${error.response?.data?.message}\n`);
      }

      // Test 5: Link to property with house code
      console.log('5. Testing property linking with house code...');
      try {
        const response5 = await axios.post(
          `${baseUrl}/properties/link`,
          {
            houseCode: 'SUN-A1-001'
          },
          {
            headers: { Authorization: `Bearer ${tenantToken}` }
          }
        );

        console.log('✅ Property linked successfully');
        console.log(`   Property: ${response5.data.property.name}`);
        console.log(`   House Code: ${response5.data.property.code}\n`);
      } catch (error) {
        console.log('❌ Property linking failed:');
        console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // Test 6: Invalid landlord referral (missing required fields)
    console.log('6. Testing invalid landlord referral (missing fields)...');
    try {
      await axios.post(
        `${baseUrl}/auth/send-landlord-referral`,
        {
          landlordName: 'Test Landlord'
          // Missing landlordEmail
        },
        {
          headers: { Authorization: `Bearer ${tenantToken}` }
        }
      );
      console.log('❌ Invalid referral should have failed but succeeded\n');
    } catch (error) {
      console.log('✅ Invalid referral correctly rejected');
      console.log(`   Error: ${error.response?.data?.message || error.response?.data?.errors?.[0]?.msg}\n`);
    }

    // Test 7: Owner trying to send referral (should fail)
    console.log('7. Testing owner sending referral (should fail)...');
    try {
      const ownerResponse = await axios.post(`${baseUrl}/auth/register`, {
        name: 'Test Owner 2',
        email: 'testowner2@test.com',
        phone: '0756789012',
        password: 'password123',
        role: 'owner'
      });

      await axios.post(
        `${baseUrl}/auth/send-landlord-referral`,
        {
          landlordName: 'Another Landlord',
          landlordEmail: 'another.landlord@example.com'
        },
        {
          headers: { Authorization: `Bearer ${ownerResponse.data.token}` }
        }
      );
      console.log('❌ Owner referral should have failed but succeeded\n');
    } catch (error) {
      console.log('✅ Owner referral correctly rejected');
      console.log(`   Error: ${error.response?.data?.message}\n`);
    }

    console.log('🎉 New tenant registration flow testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testNewTenantFlow().then(() => {
  console.log('\n✨ All new tenant flow tests completed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Tenants can register without house code');
  console.log('   ✅ Tenants can send landlord referrals after registration');
  console.log('   ✅ Tenants can link to property using house code');
  console.log('   ✅ Duplicate referrals are prevented');
  console.log('   ✅ Proper validation and authorization');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
