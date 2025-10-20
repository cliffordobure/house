# M-Pesa Sandbox Setup Guide

## 🔧 Quick Fix for STK Push

Your STK Push isn't working because you need the **sandbox test passkey**. Here's how to fix it:

### Option 1: Update Your .env File (Recommended)

Update your `.env` file with these **sandbox test credentials**:

```env
# M-Pesa Sandbox Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-backend-url.com/api/payments/callback
MPESA_ENVIRONMENT=sandbox
```

### Option 2: Get Your Own Sandbox Credentials

1. **Go to M-Pesa Daraja Portal**
   - Visit: https://developer.safaricom.co.ke
   - Login to your account

2. **Create/Select Your App**
   - Go to "My Apps"
   - Create a new app or select existing one
   - Choose "Lipa Na M-Pesa Online" API

3. **Get Test Credentials**
   - Go to "Test Credentials" section
   - Copy your Consumer Key and Consumer Secret
   - Use the provided test passkey

4. **Update Your .env**
   ```env
   MPESA_CONSUMER_KEY=your_actual_consumer_key
   MPESA_CONSUMER_SECRET=your_actual_consumer_secret
   MPESA_PASSKEY=your_actual_test_passkey
   ```

---

## 🧪 Testing STK Push

### Test Phone Numbers (Sandbox)
Use these test phone numbers for sandbox testing:
- `254708374149`
- `254700000000`
- Any valid Kenyan number format: `254XXXXXXXXX`

### Test Amounts
- Minimum: 1 KES
- Maximum: 150,000 KES

### Test Request Example
```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyId": "YOUR_PROPERTY_ID",
    "amount": 100,
    "phoneNumber": "254708374149"
  }'
```

---

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid passkey" error**
   - **Solution**: Use the sandbox test passkey provided above
   - **Check**: Ensure `MPESA_ENVIRONMENT=sandbox`

2. **"Invalid consumer key/secret" error**
   - **Solution**: Get your actual consumer key/secret from Daraja portal
   - **Check**: Ensure credentials are correct

3. **"STK Push not sent" error**
   - **Solution**: Check phone number format (must be 254XXXXXXXXX)
   - **Check**: Ensure callback URL is publicly accessible

4. **"Access token failed" error**
   - **Solution**: Verify consumer key and secret
   - **Check**: Ensure you're using sandbox URLs

### Debug Steps

1. **Check Environment Variables**
   ```bash
   # In your terminal
   echo $MPESA_CONSUMER_KEY
   echo $MPESA_PASSKEY
   ```

2. **Test Access Token Generation**
   ```bash
   # Add this to your server.js temporarily
   const mpesa = require('./utils/mpesa');
   mpesa.getAccessToken().then(token => {
     console.log('Access Token:', token);
   }).catch(err => {
     console.error('Token Error:', err);
   });
   ```

3. **Check Server Logs**
   - Look for M-Pesa service initialization messages
   - Check for "Using M-Pesa sandbox test credentials" message

---

## 📱 Callback URL Setup

For testing, you need a publicly accessible callback URL:

### Option 1: Use ngrok (Local Testing)
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 5000

# Use the HTTPS URL for callback
# Example: https://abc123.ngrok.io/api/payments/callback
```

### Option 2: Use Your Deployed Backend
```env
MPESA_CALLBACK_URL=https://your-backend-url.com/api/payments/callback
```

---

## ✅ Verification Checklist

- [ ] Updated `.env` with sandbox credentials
- [ ] `MPESA_ENVIRONMENT=sandbox`
- [ ] Valid consumer key and secret
- [ ] Sandbox test passkey
- [ ] Publicly accessible callback URL
- [ ] Server restarted after .env changes
- [ ] Test with valid phone number format

---

## 🚀 Quick Test

After updating your `.env` file:

1. **Restart your server**
   ```bash
   npm run dev
   ```

2. **Test STK Push**
   ```bash
   # Use the test script or make a manual request
   curl -X POST http://localhost:5000/api/payments/initiate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "propertyId": "YOUR_PROPERTY_ID",
       "amount": 100,
       "phoneNumber": "254708374149"
     }'
   ```

3. **Check your phone**
   - You should receive an STK Push prompt
   - Enter your M-Pesa PIN
   - Payment should be processed

---

## 📞 Support

If you're still having issues:

1. **Check Daraja Portal**: https://developer.safaricom.co.ke/docs
2. **Verify Credentials**: Ensure you're using the correct test credentials
3. **Test Environment**: Make sure you're in sandbox mode
4. **Phone Format**: Use 254XXXXXXXXX format

---

**Your STK Push should work now! 🎉**

