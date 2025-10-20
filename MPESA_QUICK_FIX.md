# 🚀 Quick Fix for M-Pesa STK Push

## The Problem
Your STK Push isn't working because you don't have the M-Pesa passkey for sandbox testing.

## ✅ The Solution

### Step 1: Update Your .env File

Add these **sandbox test credentials** to your `.env` file:

```env
# M-Pesa Sandbox Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-backend-url.com/api/payments/callback
MPESA_ENVIRONMENT=sandbox
```

### Step 2: Get Your Consumer Key & Secret

1. Go to: https://developer.safaricom.co.ke
2. Login to your account
3. Go to "My Apps" → Create/Select your app
4. Copy your Consumer Key and Consumer Secret
5. Update your `.env` file with these values

### Step 3: Test Your Setup

```bash
# Test M-Pesa configuration
npm run test-mpesa
```

This will:
- ✅ Check your configuration
- ✅ Test access token generation
- ✅ Test STK Push (sends to your phone!)

### Step 4: Test STK Push

```bash
# Test with a real payment request
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyId": "YOUR_PROPERTY_ID",
    "amount": 100,
    "phoneNumber": "254708374149"
  }'
```

## 📱 Test Phone Numbers

Use these for sandbox testing:
- `254708374149`
- `254700000000`
- Any valid Kenyan number: `254XXXXXXXXX`

## 🔧 What I Fixed

I updated your `utils/mpesa.js` to automatically use sandbox test credentials when no passkey is provided:

```javascript
// Use sandbox test credentials if passkey is not provided
if (this.environment === 'sandbox' && !this.passkey) {
  console.log('⚠️  Using M-Pesa sandbox test credentials');
  this.businessShortCode = '174379'; // Sandbox test shortcode
  this.passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox test passkey
}
```

## 🎯 Next Steps

1. **Update your `.env`** with the sandbox passkey above
2. **Get your consumer key/secret** from Daraja portal
3. **Restart your server**: `npm run dev`
4. **Test**: `npm run test-mpesa`
5. **Check your phone** for STK Push prompt!

## 📞 Need Help?

- **Daraja Portal**: https://developer.safaricom.co.ke/docs
- **Test Credentials**: Use the passkey I provided above
- **Phone Format**: Always use `254XXXXXXXXX`

---

**Your STK Push should work now! 🎉**

