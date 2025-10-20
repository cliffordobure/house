# PropertyHub Backend - Quick Start Guide

Get your PropertyHub backend up and running in minutes!

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Copy example environment file
cp env.example .env

# Edit .env with your credentials
# At minimum, update these:
# - MONGODB_URI (use local MongoDB or Atlas)
# - JWT_SECRET (generate a random string)
```

### Step 3: Start MongoDB
```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Get connection string from atlas.mongodb.com
```

### Step 4: Create Admin User
```bash
npm run create-admin
```

This creates an admin account:
- Email: `admin@propertyhub.com`
- Password: `admin123456`

### Step 5: Seed Sample Data (Optional)
```bash
npm run seed
```

This creates sample users and properties for testing.

### Step 6: Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000` 🎉

---

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:5000
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@propertyhub.com",
    "password": "admin123456"
  }'
```

Copy the `token` from the response.

### 3. Verify Token
```bash
curl http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Sample Test Accounts

After running `npm run seed`, you'll have these accounts:

### Owner Account
- **Email**: owner@test.com
- **Password**: password123
- **Role**: Owner
- **Can**: Create properties, manage tenants

### Tenant Account 1
- **Email**: tenant1@test.com
- **Password**: password123
- **House Code**: SUN-A1-001
- **Role**: Tenant

### Tenant Account 2
- **Email**: tenant2@test.com
- **Password**: password123
- **House Code**: PALM-B2-002
- **Role**: Tenant

---

## 🔧 Configuration Guide

### Minimum Required Configuration

Edit your `.env` file:

```env
# Required
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/propertyhub
JWT_SECRET=your_random_secret_at_least_32_characters_long

# Optional (for full functionality)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### MongoDB Options

**Option 1: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/propertyhub
```

**Option 2: MongoDB Atlas (Cloud)**
1. Create free account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create cluster and get connection string
3. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/propertyhub
```

---

## 📱 Optional Integrations

### M-Pesa Integration (for Payments)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get credentials
3. Add to `.env`:
```env
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/callback
MPESA_ENVIRONMENT=sandbox
```

### Cloudinary (for Image Uploads)

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### Firebase (for Push Notifications)

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Get service account credentials
3. Add to `.env`:
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_email
```

---

## 🎯 Common Tasks

### Create a New Owner
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Property Owner",
    "email": "owner@example.com",
    "phone": "254712345678",
    "password": "password123",
    "role": "owner"
  }'
```

### Create a Property (as Owner)
```bash
curl -X POST http://localhost:5000/api/properties/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer OWNER_TOKEN" \
  -d '{
    "name": "My Apartment",
    "location": "Nairobi",
    "rentAmount": 25000,
    "paybill": "4032786",
    "accountNumber": "ACC001",
    "code": "APT-001",
    "propertyType": "apartment",
    "numberOfRooms": 2,
    "description": "Beautiful 2BR apartment"
  }'
```

### Register a Tenant
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenant Name",
    "email": "tenant@example.com",
    "phone": "254712345679",
    "password": "password123",
    "role": "tenant",
    "houseCode": "APT-001"
  }'
```

---

## 🐛 Troubleshooting

### Server Won't Start

**MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB with `mongod` or check your MongoDB Atlas connection string.

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change port in `.env` or kill process using port 5000.

### Authentication Issues

**Invalid Token**
- Make sure you're including the token in the Authorization header
- Token format: `Bearer your_token_here`
- Check if token has expired (tokens expire after 30 days)

### Database Issues

**Can't Connect to MongoDB**
- Check if MongoDB is running: `ps aux | grep mongod`
- Verify MONGODB_URI in `.env`
- For Atlas: check IP whitelist

---

## 📚 Next Steps

1. **Read Full Documentation**: Check `README.md` for detailed information
2. **API Reference**: See `API_QUICK_REFERENCE.md` for all endpoints
3. **Deployment**: Read `DEPLOYMENT.md` for production deployment
4. **Test with Postman**: Import endpoints and test functionality

---

## 🆘 Getting Help

- **API Documentation**: See `README.md`
- **API Reference**: See `API_QUICK_REFERENCE.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Check Issues**: Review error messages in console

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] MongoDB is running
- [ ] Admin user created (`npm run create-admin`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Can access `http://localhost:5000`
- [ ] Can login with admin credentials
- [ ] Token verification works

---

**Ready to build something amazing! 🎉**

For detailed documentation, see `README.md`

