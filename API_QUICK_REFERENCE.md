# PropertyHub API Quick Reference

Quick reference guide for testing the API endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

# Option 1: Tenant with house code
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "password": "password123",
  "role": "tenant",
  "houseCode": "SUN-A1-001"
}

# Option 2: Tenant with landlord referral
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "254723456789",
  "password": "password123",
  "role": "tenant",
  "landlordEmail": "landlord@example.com"
}

# Option 3: Owner registration
{
  "name": "Property Owner",
  "email": "owner@example.com",
  "phone": "254734567890",
  "password": "password123",
  "role": "owner"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

# Response includes: token, user
# Use token for authenticated requests
```

### Verify Token
```bash
GET /api/auth/verify
Authorization: Bearer <token>
```

---

## Properties

### Create Property (Owner)
```bash
POST /api/properties/create
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "name": "Sunrise Apartments",
  "location": "Westlands, Nairobi",
  "rentAmount": 25000,
  "paybill": "4032786",
  "accountNumber": "ACC001",
  "code": "SUN-A1-001",
  "propertyType": "apartment",
  "numberOfRooms": 2,
  "description": "Modern 2-bedroom apartment",
  "photos": []
}
```

### Get My Properties (Owner)
```bash
GET /api/properties/my-properties
Authorization: Bearer <owner_token>
```

### Get Property by ID
```bash
GET /api/properties/:id
Authorization: Bearer <token>
```

### Update Property (Owner)
```bash
PUT /api/properties/update/:id
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "rentAmount": 30000,
  "description": "Updated description"
}
```

### Delete Property (Owner)
```bash
DELETE /api/properties/delete/:id
Authorization: Bearer <owner_token>
```

### Link to Property (Tenant)
```bash
POST /api/properties/link
Authorization: Bearer <tenant_token>
Content-Type: application/json

{
  "houseCode": "SUN-A1-001"
}
```

### Bulk Create Properties (Owner)
```bash
POST /api/properties/bulk-create
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "propertyTemplate": {
    "name": "Sunset Apartments",
    "location": "Westlands, Nairobi",
    "rentAmount": 25000,
    "paybill": "4032786",
    "accountNumber": "ACC001",
    "description": "Modern apartment",
    "propertyType": "apartment",
    "numberOfRooms": 1,
    "photos": []
  },
  "numberOfRooms": 90,
  "roomPrefix": "Room",
  "startingNumber": 1
}
```

---

## Payments

### Initiate Payment (Tenant)
```bash
POST /api/payments/initiate
Authorization: Bearer <tenant_token>
Content-Type: application/json

{
  "propertyId": "64a5f8b9c2e4f1a2b3c4d5e7",
  "amount": 10000,
  "phoneNumber": "254712345678"
}
```

### Get Payment History
```bash
GET /api/payments/history/:tenantId
Authorization: Bearer <token>
```

### Get Payments by Property (Owner)
```bash
GET /api/payments/property/:propertyId
Authorization: Bearer <owner_token>
```

### Get Rent Balance
```bash
GET /api/payments/balance/:tenantId
Authorization: Bearer <token>
```

---

## Complaints

### Create Complaint (Tenant)
```bash
POST /api/complaints/create
Authorization: Bearer <tenant_token>
Content-Type: application/json

{
  "propertyId": "64a5f8b9c2e4f1a2b3c4d5e7",
  "title": "Leaking Pipe",
  "description": "The kitchen pipe is leaking badly",
  "images": []
}
```

### Get All Complaints (Owner/Admin)
```bash
GET /api/complaints
Authorization: Bearer <owner_or_admin_token>
```

### Update Complaint (Owner)
```bash
PUT /api/complaints/update/:id
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "status": "in-progress",
  "ownerResponse": "We are working on it"
}
```

### Resolve Complaint (Owner)
```bash
POST /api/complaints/resolve/:id
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "ownerResponse": "Issue has been fixed"
}
```

### Get Complaints by Property
```bash
GET /api/complaints/property/:propertyId
Authorization: Bearer <owner_token>
```

### Get Complaints by Tenant
```bash
GET /api/complaints/tenant/:tenantId
Authorization: Bearer <token>
```

---

## Tenants

### Get Tenants by Property (Owner)
```bash
GET /api/tenants/property/:propertyId
Authorization: Bearer <owner_token>
```

### Get Tenant Details
```bash
GET /api/tenants/:id
Authorization: Bearer <token>
```

---

## Admin

### Approve Owner
```bash
POST /api/admin/approve-owner/:ownerId
Authorization: Bearer <admin_token>
```

### Get System Statistics
```bash
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

### Get All Transactions
```bash
GET /api/admin/transactions
Authorization: Bearer <admin_token>
```

### Get All Users
```bash
GET /api/admin/users?role=tenant
Authorization: Bearer <admin_token>
```

### Delete User
```bash
DELETE /api/admin/users/:userId
Authorization: Bearer <admin_token>
```

### Get Landlord Referrals
```bash
GET /api/admin/landlord-referrals?status=pending&page=1&limit=20
Authorization: Bearer <admin_token>
```

### Update Referral Status
```bash
PUT /api/admin/landlord-referrals/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "contacted",
  "landlordResponse": "Landlord showed interest",
  "notes": "Follow up in 3 days"
}
```

### Get Referral Statistics
```bash
GET /api/admin/referral-stats
Authorization: Bearer <admin_token>
```

---

## Uploads

### Upload Single Image
```bash
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: [File]
```

### Upload Multiple Images
```bash
POST /api/upload/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: [File, File, ...]
```

---

## Notifications

### Register FCM Token
```bash
POST /api/notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "fcmToken": "device_fcm_token_here"
}
```

### Send Notification
```bash
POST /api/notifications/send
Authorization: Bearer <owner_or_admin_token>
Content-Type: application/json

{
  "userId": "64a5f8b9c2e4f1a2b3c4d5e6",
  "title": "Rent Reminder",
  "body": "Your rent is due in 3 days",
  "data": {
    "type": "rent_reminder"
  }
}
```

---

## Testing with cURL

### Example: Register and Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "254712345678",
    "password": "password123",
    "role": "owner"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Example: Create Property
```bash
curl -X POST http://localhost:5000/api/properties/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Property",
    "location": "Nairobi",
    "rentAmount": 20000,
    "paybill": "4032786",
    "accountNumber": "ACC001",
    "code": "TEST-001",
    "propertyType": "apartment",
    "numberOfRooms": 2,
    "description": "Test property"
  }'
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Phone Number Format

Always use Kenyan format: `254XXXXXXXXX`
- Remove leading `0` or `+`
- Example: `0712345678` → `254712345678`

---

## Testing M-Pesa in Sandbox

- Use any valid Kenyan phone number
- Amount: 1 to 150,000 KES
- Enter your M-Pesa PIN when prompted on your phone

---

For detailed documentation, see the main README.md file.

