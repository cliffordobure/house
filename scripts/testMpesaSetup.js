const axios = require('axios');
const mpesaService = require('../utils/mpesa');

const testMpesaSetup = async () => {
  try {
    console.log('🧪 Testing M-Pesa Setup...\n');

    // Test 1: Check configuration
    console.log('1. Checking M-Pesa configuration...');
    console.log(`   Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
    console.log(`   Business Short Code: ${process.env.MPESA_BUSINESS_SHORT_CODE || '174379'}`);
    console.log(`   Consumer Key: ${process.env.MPESA_CONSUMER_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Consumer Secret: ${process.env.MPESA_CONSUMER_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Passkey: ${process.env.MPESA_PASSKEY ? '✅ Set' : '⚠️  Using sandbox default'}`);
    console.log(`   Callback URL: ${process.env.MPESA_CALLBACK_URL || '❌ Missing'}\n`);

    // Test 2: Generate access token
    console.log('2. Testing access token generation...');
    const accessToken = await mpesaService.getAccessToken();
    console.log('✅ Access token generated successfully');
    console.log(`   Token: ${accessToken.substring(0, 20)}...\n`);

    // Test 3: Test STK Push (dry run)
    console.log('3. Testing STK Push generation...');
    const testPhone = '254708374149';
    const testAmount = 100;
    
    try {
      const stkResponse = await mpesaService.initiateSTKPush(
        testPhone,
        testAmount,
        'TEST001',
        'Test Payment'
      );
      
      console.log('✅ STK Push initiated successfully');
      console.log(`   Checkout Request ID: ${stkResponse.CheckoutRequestID}`);
      console.log(`   Merchant Request ID: ${stkResponse.MerchantRequestID}\n`);
      
      console.log('📱 Check your phone for STK Push prompt!');
      console.log('   Phone: ' + testPhone);
      console.log('   Amount: KES ' + testAmount);
      
    } catch (stkError) {
      console.log('❌ STK Push failed:');
      console.log(`   Error: ${stkError.message}\n`);
      
      if (stkError.message.includes('passkey')) {
        console.log('💡 Solution: Update your .env file with sandbox passkey:');
        console.log('   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919\n');
      }
    }

    console.log('🎉 M-Pesa setup test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('consumer')) {
      console.log('\n💡 Solution: Get your consumer key and secret from:');
      console.log('   https://developer.safaricom.co.ke');
    }
    
    process.exit(1);
  }
};

// Run the test
testMpesaSetup().then(() => {
  console.log('\n✨ All tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});

