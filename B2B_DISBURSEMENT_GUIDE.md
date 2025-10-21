# B2B Automated Disbursement System Guide

## 📋 Overview

This system implements **automatic disbursement** to property owners using M-Pesa's B2B (Business to Business) API. When a tenant pays rent via STK Push, the system:

1. ✅ Collects payment to **your paybill** via STK Push
2. 💰 Deducts a configurable **platform fee** (default 5%)
3. 🚀 Automatically disburses remaining amount to **owner's paybill**
4. 📊 Tracks both collection and disbursement status
5. 🔄 Supports manual retries for failed disbursements

---

## 🎯 How It Works

### Payment Flow

```
Tenant → STK Push → Your Paybill → [Platform Fee] → Owner's Paybill
                         ↓                               ↓
                   STK Callback                    B2B Callback
                         ↓                               ↓
                   Payment Success              Disbursement Success
```

### Step-by-Step Process

1. **Tenant initiates payment**
   - Tenant pays rent via STK Push
   - Money goes to your (platform) paybill
   - Payment record created with status: `pending`

2. **STK Push callback**
   - Safaricom confirms payment success
   - Payment status updated to: `success`
   - Disbursement automatically triggered (if enabled)

3. **Automatic disbursement**
   - Platform fee calculated and deducted
   - B2B payment initiated to owner's paybill
   - Disbursement status updated to: `processing`

4. **B2B callback**
   - Safaricom confirms disbursement success
   - Disbursement status updated to: `completed`
   - Owner receives notification

---

## 🔧 Setup Requirements

### 1. Daraja API Credentials

You need the following from Safaricom Daraja Portal:

#### For STK Push (Already configured)
- ✅ Consumer Key
- ✅ Consumer Secret
- ✅ Business Short Code (Your paybill)
- ✅ Passkey

#### For B2B Disbursement (NEW)
- 🆕 **Initiator Name** - Your API operator username
- 🆕 **Security Credential** - Encrypted password for the initiator
- 🆕 **B2B Callback URL** - Where Safaricom sends disbursement results

### 2. Environment Variables

Add these to your `.env` file:

```env
# Existing STK Push variables
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_paybill
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/callback
MPESA_ENVIRONMENT=sandbox  # or 'production'

# NEW B2B Disbursement variables
MPESA_INITIATOR_NAME=your_initiator_name
MPESA_SECURITY_CREDENTIAL=your_encrypted_password
MPESA_B2B_CALLBACK_URL=https://yourdomain.com/api/payments/b2b-callback
MPESA_TIMEOUT_URL=https://yourdomain.com/api/payments/b2b-callback

# Platform configuration
PLATFORM_FEE_PERCENTAGE=5  # Default: 5%
AUTO_DISBURSEMENT=true     # Enable/disable auto-disbursement
```

### 3. How to Get Initiator Credentials

#### Sandbox (Testing)
1. Go to [Daraja Portal](https://developer.safaricom.co.ke)
2. Navigate to **Test Credentials**
3. Use test initiator: `testapi`
4. Test security credential: Provided in portal

#### Production
1. Contact Safaricom support
2. Request B2B API activation
3. Receive initiator name and password
4. Generate security credential using Daraja's certificate

### 4. Generate Security Credential

The security credential is your initiator password encrypted with Safaricom's public certificate:

```bash
# For sandbox - use this command:
echo -n 'Safcom496!' | openssl rsautl -encrypt -pubin -inkey sandbox_cert.pem | base64

# For production - use Safaricom's production certificate
```

---

## 📡 API Endpoints

### 1. Initiate Payment (Tenant)
```http
POST /api/payments/initiate
Authorization: Bearer <tenant_token>

{
  "propertyId": "property_id",
  "amount": 10000,
  "phoneNumber": "254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "checkoutRequestId": "ws_CO_123456789",
  "merchantRequestId": "12345-67890-1"
}
```

### 2. Manual Disbursement (Owner/Admin)
```http
POST /api/payments/disburse/:paymentId
Authorization: Bearer <owner_token>
```

**Use cases:**
- Retry failed disbursements
- Manual disbursement if auto-disbursement is disabled
- Testing disbursement flow

**Response:**
```json
{
  "success": true,
  "message": "Disbursement initiated successfully",
  "disbursementConversationId": "AG_20231215_00001234567890"
}
```

### 3. Get Disbursement Status
```http
GET /api/payments/disbursement-status/:paymentId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "disbursement": {
    "paymentId": "payment_id",
    "amount": 10000,
    "disbursementAmount": 9500,
    "platformFee": 500,
    "status": "completed",
    "transactionId": "QAB123456",
    "date": "2023-12-15T10:30:00Z",
    "ownerPaybill": "123456",
    "ownerAccountNumber": "PROP001"
  }
}
```

### 4. Get Owner Disbursement History
```http
GET /api/payments/disbursements/owner
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalDisbursed": 95000,
    "totalPlatformFees": 5000,
    "pendingDisbursements": 2,
    "failedDisbursements": 0
  },
  "disbursements": [
    {
      "amount": 10000,
      "disbursementAmount": 9500,
      "platformFee": 500,
      "disbursementStatus": "completed",
      "disbursementTransactionId": "QAB123456",
      "disbursementDate": "2023-12-15T10:30:00Z",
      "propertyName": "Sunset Apartments",
      "tenantName": "John Doe"
    }
  ]
}
```

### 5. Retry Failed Disbursements (Admin)
```http
POST /api/payments/retry-failed-disbursements
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Retried 3 failed disbursements",
  "results": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "errors": [
      {
        "paymentId": "payment_id",
        "error": "Insufficient balance"
      }
    ]
  }
}
```

---

## 💾 Database Schema Updates

### Payment Model Fields

New fields added to track disbursements:

```javascript
{
  // Disbursement tracking
  disbursementStatus: 'pending' | 'processing' | 'completed' | 'failed',
  disbursementAmount: Number,        // Amount sent to owner (after fee)
  disbursementTransactionId: String, // M-Pesa transaction ID
  disbursementConversationId: String,
  disbursementDate: Date,
  disbursementFailureReason: String,
  
  // Platform fee
  platformFee: Number,               // Amount retained as commission
  
  // Owner payment details (copied from property)
  ownerPaybill: String,              // Owner's paybill number
  ownerAccountNumber: String         // Owner's account number
}
```

---

## 🔄 Disbursement Statuses

| Status | Description |
|--------|-------------|
| `pending` | Payment successful, disbursement not yet initiated |
| `processing` | B2B request sent to Safaricom, awaiting response |
| `completed` | Disbursement successful, owner received money |
| `failed` | Disbursement failed (can be retried manually) |
| `not_required` | For manual/cash payments that don't need disbursement |

---

## ⚙️ Configuration Options

### Platform Fee

Control how much commission the platform takes:

```env
PLATFORM_FEE_PERCENTAGE=5  # Takes 5% from each payment
```

**Example:**
- Tenant pays: KES 10,000
- Platform fee (5%): KES 500
- Owner receives: KES 9,500

### Auto-Disbursement

Enable or disable automatic disbursement:

```env
AUTO_DISBURSEMENT=true   # Disburse immediately after payment
AUTO_DISBURSEMENT=false  # Manual disbursement only
```

**When to disable:**
- Testing phase
- Manual review required
- Batch processing preferred (weekly/monthly)

---

## 🚨 Error Handling

### Failed Disbursements

Disbursements can fail due to:
- ❌ Invalid paybill number
- ❌ Invalid account number
- ❌ Insufficient balance in your paybill
- ❌ Network issues
- ❌ Safaricom system downtime

### Retry Mechanism

1. **Automatic retry**: Not implemented (to avoid duplicate transactions)
2. **Manual retry**: Use manual disbursement endpoint
3. **Bulk retry**: Admin can retry all failed disbursements

### Monitoring Failed Disbursements

```javascript
// Admin dashboard should monitor:
- Payments with disbursementStatus: 'failed'
- Payments with disbursementStatus: 'pending' (older than 1 hour)
```

---

## 🧪 Testing Guide

### 1. Sandbox Testing

Use Safaricom's test credentials:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=test_key
MPESA_CONSUMER_SECRET=test_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_INITIATOR_NAME=testapi
```

### 2. Test Flow

1. **Create test property** with test paybill:
   ```json
   {
     "name": "Test Property",
     "paybill": "600000",  // Sandbox test paybill
     "accountNumber": "TEST001",
     "rentAmount": 1000
   }
   ```

2. **Initiate test payment:**
   - Use test phone: `254708374149`
   - Amount: 1 KES (minimum for testing)
   - Pin: `1234`

3. **Monitor logs:**
   ```bash
   # Watch for these logs:
   - "Payment successful"
   - "Triggering automatic disbursement"
   - "B2B Response"
   - "Disbursement successful"
   ```

4. **Check disbursement status:**
   ```http
   GET /api/payments/disbursement-status/:paymentId
   ```

### 3. Test Callbacks Locally

Use ngrok to expose your local server:

```bash
ngrok http 5000
```

Update URLs in Daraja portal:
- STK Callback: `https://your-ngrok-url.ngrok.io/api/payments/callback`
- B2B Callback: `https://your-ngrok-url.ngrok.io/api/payments/b2b-callback`

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Disbursement Success Rate**
   ```javascript
   successRate = (completed / total) * 100
   ```

2. **Average Disbursement Time**
   ```javascript
   avgTime = disbursementDate - paymentDate
   ```

3. **Platform Revenue**
   ```javascript
   totalRevenue = sum(platformFee) for all completed payments
   ```

4. **Failed Disbursements**
   - Count
   - Reasons
   - Retry success rate

### Database Queries

```javascript
// Get disbursement stats
const stats = await Payment.aggregate([
  { $match: { status: 'success' } },
  { $group: {
    _id: '$disbursementStatus',
    count: { $sum: 1 },
    totalAmount: { $sum: '$disbursementAmount' },
    totalFees: { $sum: '$platformFee' }
  }}
]);

// Get failed disbursements
const failed = await Payment.find({
  status: 'success',
  disbursementStatus: 'failed'
}).populate('propertyId');
```

---

## 🔐 Security Considerations

### 1. Protect Callback URLs

The B2B callback endpoint is public (called by Safaricom), but you should:
- Validate request source (IP whitelisting)
- Log all callbacks for audit
- Handle malicious payloads gracefully

### 2. Secure Credentials

```bash
# Never commit these to git:
MPESA_INITIATOR_NAME
MPESA_SECURITY_CREDENTIAL
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
```

### 3. Authorization Checks

- ✅ Only property owner or admin can trigger manual disbursement
- ✅ Only admin can retry failed disbursements
- ✅ Tenants can only view their own disbursement status

---

## 🚀 Production Deployment Checklist

### Before Going Live

- [ ] Test complete flow in sandbox
- [ ] Verify all callbacks work (STK + B2B)
- [ ] Get production credentials from Safaricom
- [ ] Update environment variables to production
- [ ] Test with small amounts first
- [ ] Set up monitoring/alerts for failed disbursements
- [ ] Document manual disbursement process for support team
- [ ] Configure appropriate platform fee percentage
- [ ] Set up database backups
- [ ] Implement transaction reconciliation process

### Production Environment Variables

```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=<production_key>
MPESA_CONSUMER_SECRET=<production_secret>
MPESA_BUSINESS_SHORT_CODE=<your_paybill>
MPESA_INITIATOR_NAME=<production_initiator>
MPESA_SECURITY_CREDENTIAL=<production_credential>
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/callback
MPESA_B2B_CALLBACK_URL=https://yourdomain.com/api/payments/b2b-callback
PLATFORM_FEE_PERCENTAGE=5
AUTO_DISBURSEMENT=true
```

---

## 🆘 Troubleshooting

### Issue: Disbursement not triggered automatically

**Possible causes:**
1. `AUTO_DISBURSEMENT` not set to `true`
2. Missing B2B credentials
3. Error in callback handler

**Solution:**
```bash
# Check logs for errors
# Trigger manual disbursement
POST /api/payments/disburse/:paymentId
```

### Issue: B2B API returns "Invalid Initiator"

**Solution:**
- Verify `MPESA_INITIATOR_NAME` matches Daraja portal
- Check if B2B API is activated for your account
- Contact Safaricom support

### Issue: Security Credential error

**Solution:**
- Regenerate security credential using correct certificate
- Ensure no extra spaces or line breaks in .env file
- Verify certificate is for correct environment (sandbox/production)

### Issue: "Insufficient balance" error

**Solution:**
- Check your paybill has sufficient balance for disbursement
- Remember: You need `disbursementAmount + transaction_fees` available
- Contact Safaricom for transaction fee details

### Issue: Disbursement stuck in "processing"

**Solution:**
- B2B callback may not have been received
- Query transaction status manually
- After 5 minutes, mark as failed and retry

---

## 📞 Support & Resources

### Safaricom Daraja Support
- Email: apisupport@safaricom.co.ke
- Portal: https://developer.safaricom.co.ke
- Documentation: https://developer.safaricom.co.ke/APIs/BusinessToBusinessB2B

### Code Repositories
- Main implementation: `utils/mpesa.js`
- Controller logic: `controllers/paymentController.js`
- Database model: `models/Payment.js`
- API routes: `routes/paymentRoutes.js`

### Useful Commands

```bash
# Check failed disbursements
db.payments.find({ disbursementStatus: 'failed' })

# Check pending disbursements
db.payments.find({ 
  status: 'success',
  disbursementStatus: 'pending',
  createdAt: { $lt: new Date(Date.now() - 3600000) } // older than 1 hour
})

# Calculate platform revenue
db.payments.aggregate([
  { $match: { disbursementStatus: 'completed' } },
  { $group: { _id: null, total: { $sum: '$platformFee' } } }
])
```

---

## 🎓 Best Practices

1. **Always test in sandbox first**
   - Verify complete flow
   - Test error scenarios
   - Check callback handling

2. **Monitor disbursement health**
   - Set up alerts for failed disbursements
   - Review failures daily
   - Track success rate metrics

3. **Keep audit logs**
   - Log all B2B API calls
   - Store callback payloads
   - Track manual interventions

4. **Handle edge cases**
   - Network timeouts
   - Duplicate callbacks
   - Partial failures

5. **Maintain float balance**
   - Keep sufficient balance in your paybill
   - Monitor daily disbursement volume
   - Set up balance alerts

6. **Clear communication**
   - Inform owners about platform fees
   - Set clear disbursement timelines
   - Provide disbursement receipts/statements

---

## 📈 Future Enhancements

Potential improvements to consider:

1. **Scheduled Disbursements**
   - Daily batch processing
   - Weekly/monthly disbursements
   - Owner preference configuration

2. **Disbursement Scheduling**
   - Allow owners to set preferred disbursement time
   - Minimum threshold before disbursement
   - Hold period for dispute resolution

3. **Advanced Reporting**
   - Owner disbursement statements
   - Platform revenue analytics
   - Transaction reconciliation reports

4. **Multi-currency Support**
   - Support for different currencies
   - Exchange rate handling

5. **Notifications**
   - Email notifications for disbursements
   - SMS alerts for failures
   - Owner dashboard with real-time status

---

## ✅ Summary

You now have a fully functional B2B automated disbursement system that:

- ✅ Collects payments via STK Push to your paybill
- ✅ Automatically calculates and deducts platform fee
- ✅ Instantly disburses to property owners' paybills
- ✅ Tracks all disbursement statuses
- ✅ Supports manual retries for failures
- ✅ Provides comprehensive history and analytics

**Next Steps:**
1. Set up environment variables
2. Test in sandbox
3. Deploy to production
4. Monitor and optimize

---

**Last Updated:** December 2023
**Version:** 1.0
**Author:** AI Development Team

