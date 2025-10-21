# Environment Variables Setup for B2B Disbursement

## Required Environment Variables

Add these to your `.env` file:

```env
# ===========================================
# EXISTING STK PUSH CONFIGURATION
# ===========================================
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=123456
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/callback
MPESA_ENVIRONMENT=sandbox  # Options: 'sandbox' or 'production'

# ===========================================
# NEW B2B DISBURSEMENT CONFIGURATION
# ===========================================
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_encrypted_security_credential_here
MPESA_B2B_CALLBACK_URL=https://yourdomain.com/api/payments/b2b-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/payments/b2b-callback

# ===========================================
# PLATFORM CONFIGURATION
# ===========================================
PLATFORM_FEE_PERCENTAGE=5
AUTO_DISBURSEMENT=true
```

## Sandbox Test Values

For testing, use these Safaricom sandbox credentials:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_INITIATOR_NAME=testapi
MPESA_CONSUMER_KEY=<your_sandbox_consumer_key>
MPESA_CONSUMER_SECRET=<your_sandbox_consumer_secret>
```

**Test credentials:**
- Test Phone: `254708374149`
- Test PIN: `1234`
- Test Owner Paybill: `600000`

## How to Generate Security Credential

### For Sandbox

1. Download sandbox certificate from Daraja Portal
2. Use this command:
```bash
echo -n 'Safcom496!' | openssl rsautl -encrypt -pubin -inkey sandbox_cert.pem | base64
```

### For Production

1. Get production certificate from Daraja Portal
2. Use your actual initiator password:
```bash
echo -n 'YourActualPassword' | openssl rsautl -encrypt -pubin -inkey production_cert.pem | base64
```

## Production Deployment Checklist

- [ ] Request B2B API activation from Safaricom
- [ ] Get production initiator name and password
- [ ] Generate production security credential
- [ ] Update `MPESA_ENVIRONMENT` to `production`
- [ ] Use production consumer key/secret
- [ ] Update callback URLs to production domain (HTTPS)
- [ ] Test with small amounts first
- [ ] Set up monitoring for failed disbursements

