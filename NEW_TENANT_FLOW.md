# New Tenant Registration Flow - Backend Implementation

## 🎯 Overview

The backend has been updated to match the new Flutter app tenant registration flow. Tenants can now register with just basic information and complete their setup after login.

## 🔄 New User Flow

### **Before (Old Flow)**
```
Registration → Must provide house code → Blocked if no code → ❌
```

### **After (New Flow)**
```
Registration → Simple signup (no house code) → ✅
           ↓
    Login to Dashboard
           ↓
    Setup Screen (Choose one):
    ├─ Option 1: Enter house code → Link to property → ✅
    └─ Option 2: Refer landlord → Send invitation → ✅
```

## 📋 API Changes

### 1. **Simplified Registration**

#### **Endpoint:** `POST /api/auth/register`

**Old Request (Removed):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "password": "password123",
  "role": "tenant",
  "houseCode": "SUN-A1-001"  // ❌ No longer required
}
```

**New Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "254712345678",
  "password": "password123",
  "role": "tenant"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "254712345678",
    "role": "tenant",
    "linkedProperty": null,  // Will be set up later
    "isApproved": false,
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. **New Landlord Referral Endpoint**

#### **Endpoint:** `POST /api/auth/send-landlord-referral`

**Authentication:** Required (Tenant only)

**Request:**
```json
{
  "landlordName": "John Landlord",
  "landlordEmail": "landlord@example.com",
  "landlordPhone": "0712345678",  // Optional
  "propertyAddress": "123 Main Street, Nairobi"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Landlord referral sent successfully",
  "referral": {
    "_id": "referral_id",
    "landlordEmail": "landlord@example.com",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// Duplicate referral
{
  "success": false,
  "message": "You have already sent a referral to this landlord"
}

// Not a tenant
{
  "success": false,
  "message": "Only tenants can send landlord referrals"
}

// Missing required fields
{
  "success": false,
  "message": "Landlord name and email are required"
}
```

### 3. **Existing Property Link Endpoint** (Unchanged)

#### **Endpoint:** `POST /api/properties/link`

**Authentication:** Required (Tenant only)

**Request:**
```json
{
  "houseCode": "SUN-A1-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property linked successfully",
  "property": {
    "_id": "property_id",
    "name": "Sunrise Apartments",
    "code": "SUN-A1-001",
    "location": "Westlands, Nairobi",
    "rentAmount": 25000
  }
}
```

## 🔧 Backend Implementation Details

### **Files Modified:**

1. **`controllers/authController.js`**
   - ✅ Simplified `register()` function - removed house code logic
   - ✅ Added `sendLandlordReferral()` function - new endpoint

2. **`routes/authRoutes.js`**
   - ✅ Added `/send-landlord-referral` route with tenant authorization

3. **`middleware/validation.js`**
   - ✅ Removed house code validation from registration
   - ✅ Added `landlordReferralValidation` rules

4. **`utils/emailService.js`**
   - ✅ Updated landlord invitation template with landlord name
   - ✅ Added property address field support

5. **`package.json`**
   - ✅ Added test script: `npm run test-new-flow`

## 📱 Flutter App Integration

### **Registration Flow:**

```dart
// Step 1: Simple registration (no house code)
final response = await authService.register({
  'name': name,
  'email': email,
  'phone': phone,
  'password': password,
  'role': 'tenant',
});

// Step 2: After login, show setup screen
// User sees two options:
// - Enter house code
// - Refer landlord
```

### **House Code Linking:**

```dart
// Option 1: Link with house code
final response = await propertyService.linkProperty({
  'houseCode': houseCode,
});
```

### **Landlord Referral:**

```dart
// Option 2: Send landlord referral
final response = await authService.sendLandlordReferral({
  'landlordName': landlordName,
  'landlordEmail': landlordEmail,
  'landlordPhone': landlordPhone,  // Optional
  'propertyAddress': propertyAddress,  // Optional
});
```

## 🧪 Testing

### **Test Script:**

```bash
npm run test-new-flow
```

### **Test Coverage:**

✅ **Simple tenant registration** (no house code)  
✅ **Owner registration** (unchanged)  
✅ **Landlord referral** after registration  
✅ **Duplicate referral** prevention  
✅ **Property linking** with house code  
✅ **Invalid referral** validation  
✅ **Authorization** (only tenants can send referrals)  

### **Test Results:**

```
🧪 Testing New Tenant Registration Flow...

1. Testing simple tenant registration (no house code)...
✅ Tenant registration successful (no house code required)
   User ID: 68f6a65e7d29d339d6c5aa78
   Linked Property: None (to be set up later)
   Token received: Yes

2. Testing owner registration...
✅ Owner registration successful

3. Testing landlord referral (after registration)...
✅ Landlord referral sent successfully
   Status: pending

4. Testing duplicate landlord referral (should fail)...
✅ Duplicate referral correctly rejected

5. Testing property linking with house code...
✅ Property linked successfully

6. Testing invalid landlord referral (missing fields)...
✅ Invalid referral correctly rejected

7. Testing owner sending referral (should fail)...
✅ Owner referral correctly rejected

🎉 New tenant registration flow testing completed!
```

## 🎯 Benefits

### **For Tenants:**
✅ **Simple registration** - No need for house code upfront  
✅ **Immediate access** - Can use the app right away  
✅ **Flexible setup** - Choose when to link property or refer landlord  
✅ **Landlord referral** - Easy to invite landlord to join platform  

### **For Landlords:**
✅ **Professional invitations** - Receive personalized email invites  
✅ **Tenant details** - See which tenant invited them  
✅ **Easy registration** - Direct link to sign up  

### **For Platform:**
✅ **Higher conversion** - No registration blockers  
✅ **Landlord acquisition** - Tenant referrals bring new landlords  
✅ **Better UX** - Smooth onboarding experience  
✅ **Growth loop** - Tenants refer landlords who add more properties  

## 📊 User Journey

### **Tenant Journey:**

1. **Register** → Simple signup with name, email, phone, password
2. **Login** → Access dashboard immediately
3. **Setup Screen** → See two setup options:
   - **Has house code?** → Enter code → Link to property → Full access
   - **No house code?** → Refer landlord → Send invitation → Wait for landlord
4. **Dashboard** → Access all features (view rent, make payments, submit complaints)

### **Landlord Journey (via Referral):**

1. **Receive Email** → Professional invitation from tenant
2. **Click Link** → Direct to registration page
3. **Register** → Create owner account
4. **Add Property** → Create property with house code
5. **Link Tenant** → Tenant can now link using the house code

## 🔐 Security & Authorization

### **Registration:**
- ✅ Email uniqueness check
- ✅ Phone number uniqueness check
- ✅ Password hashing (bcrypt)
- ✅ JWT token generation

### **Landlord Referral:**
- ✅ **Authentication required** - Must be logged in
- ✅ **Role-based access** - Only tenants can send referrals
- ✅ **Duplicate prevention** - Can't send multiple referrals to same landlord
- ✅ **Email validation** - Valid email format required
- ✅ **Rate limiting** - Protected by global rate limiter

### **Property Linking:**
- ✅ **Authentication required** - Must be logged in
- ✅ **Role-based access** - Only tenants can link
- ✅ **House code validation** - Must exist in database
- ✅ **Single property** - Tenant can only link to one property

## 📧 Email Notifications

### **Landlord Invitation Email:**

```
From: PropertyHub <noreply@propertyhub.com>
To: landlord@example.com
Subject: PropertyHub - Your Tenant Invites You to Join

Hello John Landlord,

Your tenant John Doe has registered on PropertyHub and would 
like you to join our platform to manage your property digitally.

Tenant Details:
- Name: John Doe
- Email: john@example.com
- Phone: 254712345678
- Property Address: 123 Main Street, Nairobi

By joining PropertyHub, you can:
✓ Manage properties digitally
✓ Receive rent payments via M-Pesa
✓ Handle tenant complaints efficiently
✓ Track rent collection and balances
✓ Generate reports and analytics

[Join PropertyHub Now Button]
```

## 🚀 Deployment Checklist

### **Backend Changes:**
- [x] Update registration controller
- [x] Add landlord referral endpoint
- [x] Update validation middleware
- [x] Update email service
- [x] Add test scripts
- [x] Update API documentation

### **Testing:**
- [x] Test simple registration
- [x] Test landlord referral
- [x] Test property linking
- [x] Test authorization
- [x] Test validation
- [x] Test email sending

### **Documentation:**
- [x] Update API quick reference
- [x] Create new tenant flow guide
- [x] Add test scripts
- [x] Update README

## ✅ Summary

The new tenant registration flow is now fully implemented and tested:

✅ **Simplified Registration** - No house code required during signup  
✅ **Post-Registration Setup** - Tenants choose setup option after login  
✅ **Landlord Referral System** - Send professional invitations  
✅ **Property Linking** - Link to property with house code  
✅ **Comprehensive Testing** - All scenarios covered  
✅ **Complete Documentation** - API docs and guides updated  

**Your backend is now perfectly aligned with your Flutter app's new tenant registration flow! 🎉**

---

## 📞 API Endpoints Summary

| Endpoint | Method | Auth | Role | Description |
|----------|--------|------|------|-------------|
| `/api/auth/register` | POST | No | All | Simple registration (no house code) |
| `/api/auth/send-landlord-referral` | POST | Yes | Tenant | Send landlord invitation |
| `/api/properties/link` | POST | Yes | Tenant | Link to property with house code |
| `/api/admin/landlord-referrals` | GET | Yes | Admin | View all referrals |
| `/api/admin/landlord-referrals/:id` | PUT | Yes | Admin | Update referral status |

---

**Ready to launch! 🚀**

