# B2B Disbursement API Reference

Quick reference for all disbursement-related endpoints.

---

## 🔐 Authentication

All endpoints (except callbacks) require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📍 Endpoints

### 1. Initiate Payment (with Auto-Disbursement)

**Endpoint:** `POST /api/payments/initiate`  
**Auth:** Required (Tenant)  
**Description:** Tenant initiates rent payment. If successful, automatically triggers disbursement to owner.

**Request:**
```json
{
  "propertyId": "64abc123...",
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

**Flow:**
1. Creates payment record with owner's paybill/account
2. Calculates platform fee and disbursement amount
3. Sends STK Push to tenant
4. On success, automatically disburses to owner (if enabled)

---

### 2. STK Push Callback

**Endpoint:** `POST /api/payments/callback`  
**Auth:** None (Called by Safaricom)  
**Description:** Receives payment confirmation from Safaricom and triggers auto-disbursement.

**Called by:** Safaricom M-Pesa API  
**Action:** Marks payment as successful and triggers `processDisbursement()`

---

### 3. B2B Callback

**Endpoint:** `POST /api/payments/b2b-callback`  
**Auth:** None (Called by Safaricom)  
**Description:** Receives disbursement result from Safaricom B2B API.

**Request (from Safaricom):**
```json
{
  "Result": {
    "ConversationID": "AG_20231215_00001234567890",
    "OriginatorConversationID": "12345-67890-1",
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "ResultParameters": {
      "ResultParameter": [
        {
          "Key": "TransactionID",
          "Value": "QAB123456"
        }
      ]
    }
  }
}
```

**Action:**
- `ResultCode: 0` → Marks disbursement as `completed`
- `ResultCode: ≠ 0` → Marks disbursement as `failed`
- Notifies property owner

---

### 4. Manual Disbursement

**Endpoint:** `POST /api/payments/disburse/:paymentId`  
**Auth:** Required (Owner or Admin)  
**Description:** Manually trigger disbursement for a payment.

**Use Cases:**
- Retry failed disbursements
- Manual disbursement when auto-disbursement is disabled
- Testing

**Request:**
```http
POST /api/payments/disburse/64abc123...
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Disbursement initiated successfully",
  "disbursementConversationId": "AG_20231215_00001234567890"
}
```

**Authorization:**
- Property owner can disburse for their properties
- Admin can disburse for any property

---

### 5. Get Disbursement Status

**Endpoint:** `GET /api/payments/disbursement-status/:paymentId`  
**Auth:** Required (Tenant, Owner, or Admin)  
**Description:** Check disbursement status for a specific payment.

**Request:**
```http
GET /api/payments/disbursement-status/64abc123...
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "disbursement": {
    "paymentId": "64abc123...",
    "amount": 10000,
    "disbursementAmount": 9500,
    "platformFee": 500,
    "status": "completed",
    "transactionId": "QAB123456",
    "date": "2023-12-15T10:30:00Z",
    "failureReason": null,
    "ownerPaybill": "123456",
    "ownerAccountNumber": "PROP001"
  }
}
```

**Statuses:**
- `pending` - Awaiting disbursement
- `processing` - B2B request sent, waiting for callback
- `completed` - Successfully disbursed
- `failed` - Disbursement failed (check `failureReason`)

---

### 6. Get Owner Disbursements

**Endpoint:** `GET /api/payments/disbursements/owner`  
**Auth:** Required (Owner)  
**Description:** Get disbursement history for logged-in property owner.

**Request:**
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
      "_id": "64abc123...",
      "amount": 10000,
      "disbursementAmount": 9500,
      "platformFee": 500,
      "disbursementStatus": "completed",
      "disbursementTransactionId": "QAB123456",
      "disbursementDate": "2023-12-15T10:30:00Z",
      "propertyName": "Sunset Apartments",
      "tenantName": "John Doe",
      "ownerPaybill": "123456",
      "ownerAccountNumber": "PROP001"
    }
  ]
}
```

**Features:**
- Summary statistics
- Last 100 disbursements
- Sorted by date (newest first)

---

### 7. Retry Failed Disbursements

**Endpoint:** `POST /api/payments/retry-failed-disbursements`  
**Auth:** Required (Admin only)  
**Description:** Batch retry all failed disbursements.

**Request:**
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
        "paymentId": "64abc123...",
        "error": "Insufficient balance"
      }
    ]
  }
}
```

**Limits:**
- Processes 10 failed disbursements at a time
- Admin only
- Use for bulk recovery

---

## 🔄 Complete Flow Example

### Scenario: Tenant pays rent for a property

1. **Tenant initiates payment:**
```bash
POST /api/payments/initiate
{
  "propertyId": "64abc123...",
  "amount": 10000,
  "phoneNumber": "254712345678"
}
```

2. **System actions:**
   - Creates payment record
   - Stores owner paybill: `123456`
   - Stores owner account: `PROP001`
   - Calculates platform fee: `500` (5%)
   - Calculates disbursement: `9500`
   - Sends STK Push to tenant

3. **Safaricom sends callback:**
```bash
POST /api/payments/callback
{
  "Body": {
    "stkCallback": {
      "ResultCode": 0,
      "CheckoutRequestID": "ws_CO_123456789"
    }
  }
}
```

4. **System auto-disburses:**
   - Marks payment as `success`
   - Calls `processDisbursement()`
   - Initiates B2B to paybill `123456`, account `PROP001`
   - Amount: `9500`

5. **Safaricom sends B2B callback:**
```bash
POST /api/payments/b2b-callback
{
  "Result": {
    "ResultCode": 0,
    "ConversationID": "AG_20231215_00001234567890",
    "TransactionID": "QAB123456"
  }
}
```

6. **System completes:**
   - Marks disbursement as `completed`
   - Stores transaction ID: `QAB123456`
   - Notifies owner via FCM

7. **Owner checks status:**
```bash
GET /api/payments/disbursements/owner
# Shows completed disbursement with all details
```

---

## 💡 Testing with Postman/Curl

### Test Payment Initiation

```bash
curl -X POST https://yourapi.com/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "64abc123...",
    "amount": 1,
    "phoneNumber": "254708374149"
  }'
```

### Test Manual Disbursement

```bash
curl -X POST https://yourapi.com/api/payments/disburse/64abc123... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Disbursement Status

```bash
curl -X GET https://yourapi.com/api/payments/disbursement-status/64abc123... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Owner Disbursements

```bash
curl -X GET https://yourapi.com/api/payments/disbursements/owner \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN"
```

---

## ⚠️ Error Responses

### Common Errors

**Unauthorized:**
```json
{
  "success": false,
  "message": "Not authorized to access this resource"
}
```

**Payment Not Found:**
```json
{
  "success": false,
  "message": "Payment not found"
}
```

**Disbursement Failed:**
```json
{
  "success": false,
  "message": "Failed to initiate B2B payment"
}
```

**Invalid Paybill:**
```json
{
  "success": false,
  "message": "Invalid receiver paybill number"
}
```

---

## 🔍 Monitoring Queries

### Get Pending Disbursements

```javascript
const pending = await Payment.find({
  status: 'success',
  disbursementStatus: 'pending',
  createdAt: { $lt: new Date(Date.now() - 3600000) } // older than 1 hour
});
```

### Get Failed Disbursements

```javascript
const failed = await Payment.find({
  status: 'success',
  disbursementStatus: 'failed'
}).populate('propertyId');
```

### Calculate Platform Revenue

```javascript
const revenue = await Payment.aggregate([
  { $match: { disbursementStatus: 'completed' } },
  { $group: { 
    _id: null, 
    total: { $sum: '$platformFee' },
    count: { $sum: 1 }
  }}
]);
```

---

## 📚 Related Documentation

- **Full Guide:** See `B2B_DISBURSEMENT_GUIDE.md`
- **Environment Setup:** See `B2B_ENV_SETUP.md`
- **Daraja B2B Docs:** https://developer.safaricom.co.ke/APIs/BusinessToBusinessB2B

---

**Last Updated:** December 2023

