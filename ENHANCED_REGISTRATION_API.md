# Enhanced Tenant Registration Flow - Backend Implementation

## 🎯 Overview

The backend has been updated to support the new tenant registration flow that allows tenants to register without a house code and refer their landlords to the platform.

## 📋 New Registration Flow

### Option 1: Tenant with House Code (Existing)
```
Tenant Registration → Provide house code → Link to property → Complete registration
```

### Option 2: Tenant without House Code (New)
```
Tenant Registration → Provide landlord email → Send invitation → Complete registration
```

## 🔧 Backend Changes Implemented

### 1. New Database Model

#### LandlordReferral Model
```javascript
{
  tenantEmail: String,      // Tenant's email
  tenantName: String,       // Tenant's name
  tenantPhone: String,      // Tenant's phone
  landlordEmail: String,    // Landlord's email
  status: String,           // pending, contacted, registered, declined
  landlordResponse: String,  // Landlord's response
  contactedAt: Date,        // When landlord was contacted
  respondedAt: Date,        // When landlord responded
  notes: String,            // Admin notes
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Updated User Model
```javascript
{
  // ... existing fields
  status: String,           // active, inactive, pending
  referralCode: String,     // For future referral tracking
}
```

### 3. Enhanced Registration API

#### Endpoint: `POST /api/auth/register`

**New Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "password": "password123",
  "role": "tenant",
  "houseCode": "SUN-A1-001",           // Optional - only if tenant has house code
  "landlordEmail": "landlord@example.com" // Optional - only if tenant refers landlord
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Landlord invitation sent successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "tenant",
    "linkedProperty": null,
    "isApproved": false,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "referralCreated": true
}
```

### 4. Email Service

#### Landlord Invitation Email
- **Professional HTML template** with PropertyHub branding
- **Tenant details** for landlord reference
- **Platform benefits** explanation
- **Direct registration link** with referral tracking
- **Responsive design** for all devices

#### Welcome Email
- **Sent to all new users** after registration
- **Role-specific content** (tenant/owner)
- **Login link** for immediate access

### 5. New Admin Endpoints

#### Get Landlord Referrals
```bash
GET /api/admin/landlord-referrals
Authorization: Bearer <admin_token>

# Query parameters:
# - status: pending, contacted, registered, declined
# - page: page number (default: 1)
# - limit: items per page (default: 20)
```

#### Update Referral Status
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

#### Get Referral Statistics
```bash
GET /api/admin/referral-stats
Authorization: Bearer <admin_token>

# Response:
{
  "success": true,
  "stats": {
    "total": 150,
    "recent": 25,
    "byStatus": {
      "pending": 45,
      "contacted": 30,
      "registered": 20,
      "declined": 5
    }
  }
}
```

## 🚀 Usage Examples

### 1. Tenant Registration with House Code
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Tenant",
    "email": "john@example.com",
    "phone": "254712345678",
    "password": "password123",
    "role": "tenant",
    "houseCode": "SUN-A1-001"
  }'
```

### 2. Tenant Registration with Landlord Referral
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Tenant",
    "email": "jane@example.com",
    "phone": "254723456789",
    "password": "password123",
    "role": "tenant",
    "landlordEmail": "landlord@example.com"
  }'
```

### 3. Owner Registration (Unchanged)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Property Owner",
    "email": "owner@example.com",
    "phone": "254734567890",
    "password": "password123",
    "role": "owner"
  }'
```

## 🔒 Validation Rules

### Required Fields
- `name`: Minimum 2 characters
- `email`: Valid email format
- `phone`: Kenyan format (254XXXXXXXXX)
- `password`: Minimum 6 characters
- `role`: Either "owner" or "tenant"

### Tenant-Specific Rules
- **Either** `houseCode` **OR** `landlordEmail` must be provided
- **Cannot** provide both `houseCode` and `landlordEmail`
- `houseCode`: Minimum 3 characters (if provided)
- `landlordEmail`: Valid email format (if provided)

### Error Responses
```json
// Missing required fields
{
  "success": false,
  "message": "All required fields must be provided"
}

// Tenant without house code or landlord email
{
  "success": false,
  "message": "Tenants must provide either house code or landlord email"
}

// Tenant with both house code and landlord email
{
  "success": false,
  "message": "Please provide either house code OR landlord email, not both"
}

// Invalid house code
{
  "success": false,
  "message": "Invalid house code"
}

// Duplicate user
{
  "success": false,
  "message": "User with this email or phone already exists"
}
```

## 📧 Email Configuration

### Environment Variables
Add to your `.env` file:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@propertyhub.com

# Frontend URL for email links
FRONTEND_URL=https://your-frontend-url.com
```

### Email Service Setup
1. **Gmail Setup** (for development):
   - Enable 2-factor authentication
   - Generate app password
   - Use app password in `EMAIL_PASS`

2. **Production Setup**:
   - Use SendGrid, AWS SES, or similar service
   - Update email configuration accordingly

## 🧪 Testing

### Test Script
```bash
# Test the new registration flow
npm run test-registration
```

This will test:
- ✅ Tenant registration with house code
- ✅ Tenant registration with landlord email
- ✅ Owner registration
- ✅ Invalid registration scenarios
- ✅ Duplicate email handling

### Manual Testing
1. **Start server**: `npm run dev`
2. **Seed data**: `npm run seed` (creates test properties)
3. **Test registration**: Use the examples above
4. **Check email**: Verify landlord invitation emails
5. **Admin panel**: Check referrals in admin endpoints

## 📊 Admin Dashboard Integration

### Referral Management
Admins can now:
- **View all referrals** with pagination
- **Filter by status** (pending, contacted, registered, declined)
- **Update referral status** with notes
- **Track conversion rates** and statistics
- **Monitor email delivery** success

### Statistics Available
- **Total referrals** count
- **Recent referrals** (last 7 days)
- **Status breakdown** (pending, contacted, registered, declined)
- **Conversion rates** (referrals to registrations)

## 🔄 Integration with Flutter App

The Flutter app can now:

### Registration Screen Updates
```dart
// New registration options
enum RegistrationType {
  withHouseCode,
  withLandlordEmail,
}

// API call with new fields
final response = await authService.register({
  'name': name,
  'email': email,
  'phone': phone,
  'password': password,
  'role': 'tenant',
  'houseCode': houseCode,        // Optional
  'landlordEmail': landlordEmail, // Optional
});
```

### Response Handling
```dart
if (response['success']) {
  if (response['referralCreated']) {
    showSuccessMessage('Registration successful! Landlord invitation sent.');
  } else {
    showSuccessMessage('Registration successful!');
  }
}
```

## 🚀 Deployment Checklist

### Database Updates
- [ ] Deploy new `LandlordReferral` model
- [ ] Update `User` model with new fields
- [ ] Create database indexes for performance

### Environment Variables
- [ ] Add email configuration
- [ ] Set `FRONTEND_URL` for email links
- [ ] Configure email service credentials

### Testing
- [ ] Test registration flows
- [ ] Verify email delivery
- [ ] Test admin endpoints
- [ ] Check error handling

### Monitoring
- [ ] Set up email delivery monitoring
- [ ] Track referral conversion rates
- [ ] Monitor registration success rates

## 📈 Benefits

### For Tenants
- ✅ **Flexible registration** - can register without house code
- ✅ **Easy landlord referral** - invite landlords to join
- ✅ **Immediate access** - start using the app right away

### For Landlords
- ✅ **Professional invitations** - branded email invitations
- ✅ **Clear benefits** - understand platform value
- ✅ **Easy registration** - direct link to sign up

### For Platform
- ✅ **Increased user acquisition** - more tenants can register
- ✅ **Landlord growth** - referrals bring new landlords
- ✅ **Better onboarding** - smoother registration experience
- ✅ **Data tracking** - monitor referral success rates

## 🔧 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check email credentials in `.env`
   - Verify SMTP settings
   - Check spam folder

2. **Registration failing**
   - Verify validation rules
   - Check database connection
   - Review error logs

3. **Referral not created**
   - Check LandlordReferral model
   - Verify email service
   - Review error handling

### Debug Steps
1. **Check logs** for detailed error messages
2. **Test email service** independently
3. **Verify database** models and indexes
4. **Test API endpoints** with Postman/curl

---

## ✅ Summary

The enhanced tenant registration flow is now fully implemented with:

- ✅ **Dual registration paths** for tenants
- ✅ **Professional email invitations** for landlords
- ✅ **Comprehensive admin management** tools
- ✅ **Robust validation** and error handling
- ✅ **Complete testing** suite
- ✅ **Production-ready** implementation

**Your backend is now perfectly aligned with your Flutter app! 🎉**
