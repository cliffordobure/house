const axios = require('axios');

const testPhoneNumberFormats = async () => {
  try {
    console.log('🧪 Testing Phone Number Format Support...\n');

    const baseUrl = 'http://localhost:5000/api';

    // Test different phone number formats
    const phoneFormats = [
      { format: '254712345678', description: '254XXXXXXXXX format' },
      { format: '+254712345678', description: '+254XXXXXXXXX format' },
      { format: '0712345678', description: '07XXXXXXXX format' },
      { format: '712345678', description: '7XXXXXXXX format' },
    ];

    console.log('Testing registration with different phone number formats:\n');

    for (let i = 0; i < phoneFormats.length; i++) {
      const phoneFormat = phoneFormats[i];
      const testEmail = `test.phone${i + 1}@example.com`;
      
      console.log(`${i + 1}. Testing ${phoneFormat.description}: ${phoneFormat.format}`);
      
      try {
        const response = await axios.post(`${baseUrl}/auth/register`, {
          name: `Test User ${i + 1}`,
          email: testEmail,
          phone: phoneFormat.format,
          password: 'password123',
          role: 'owner'
        });

        console.log(`   ✅ Registration successful`);
        console.log(`   📱 Phone stored as: ${response.data.user.phone}\n`);
        
      } catch (error) {
        console.log(`   ❌ Registration failed:`);
        console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // Test M-Pesa phone number formatting
    console.log('Testing M-Pesa phone number formatting:\n');
    
    const mpesaService = require('../utils/mpesa');
    
    const testNumbers = [
      '254712345678',
      '+254712345678', 
      '0712345678',
      '712345678'
    ];

    testNumbers.forEach((phone, index) => {
      try {
        const formatted = mpesaService.formatPhoneNumber(phone);
        console.log(`${index + 1}. ${phone} → ${formatted} ✅`);
      } catch (error) {
        console.log(`${index + 1}. ${phone} → Error: ${error.message} ❌`);
      }
    });

    console.log('\n🎉 Phone number format testing completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testPhoneNumberFormats().then(() => {
  console.log('\n✨ All phone number format tests completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
