# PropertyHub Backend - Project Structure

Complete overview of the backend architecture and file organization.

## 📁 Directory Structure

```
server/
│
├── 📄 server.js                    # Main application entry point
├── 📄 package.json                 # Project dependencies and scripts
├── 📄 .env                         # Environment variables (gitignored)
├── 📄 env.example                  # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📚 Documentation
│   ├── README.md                   # Complete project documentation
│   ├── QUICK_START.md             # 5-minute setup guide
│   ├── API_QUICK_REFERENCE.md     # API endpoints quick reference
│   ├── DEPLOYMENT.md              # Production deployment guide
│   └── PROJECT_STRUCTURE.md       # This file
│
├── 📂 config/                      # Configuration files
│   └── database.js                # MongoDB connection setup
│
├── 📂 models/                      # Mongoose data models
│   ├── User.js                    # User schema (Admin/Owner/Tenant)
│   ├── Property.js                # Property schema
│   ├── Payment.js                 # Payment transaction schema
│   └── Complaint.js               # Complaint schema
│
├── 📂 controllers/                 # Business logic handlers
│   ├── authController.js          # Authentication logic
│   ├── propertyController.js      # Property management
│   ├── tenantController.js        # Tenant management
│   ├── paymentController.js       # Payment & M-Pesa integration
│   ├── complaintController.js     # Complaint handling
│   ├── adminController.js         # Admin operations
│   ├── uploadController.js        # File upload handling
│   └── notificationController.js  # Push notification management
│
├── 📂 routes/                      # API route definitions
│   ├── authRoutes.js              # /api/auth/* routes
│   ├── propertyRoutes.js          # /api/properties/* routes
│   ├── tenantRoutes.js            # /api/tenants/* routes
│   ├── paymentRoutes.js           # /api/payments/* routes
│   ├── complaintRoutes.js         # /api/complaints/* routes
│   ├── adminRoutes.js             # /api/admin/* routes
│   ├── uploadRoutes.js            # /api/upload/* routes
│   └── notificationRoutes.js      # /api/notifications/* routes
│
├── 📂 middleware/                  # Express middleware
│   ├── auth.js                    # JWT authentication & authorization
│   ├── errorHandler.js            # Global error handling
│   └── validation.js              # Request validation rules
│
├── 📂 utils/                       # Utility functions & services
│   ├── mpesa.js                   # M-Pesa Daraja API integration
│   ├── cloudinary.js              # Cloudinary image upload
│   ├── firebase.js                # Firebase Cloud Messaging (FCM)
│   └── jwt.js                     # JWT token generation
│
└── 📂 scripts/                     # Utility scripts
    ├── createAdmin.js             # Create admin user script
    └── seedData.js                # Seed sample data for testing
```

---

## 🔄 Request Flow

```
Client Request
    ↓
Express Server (server.js)
    ↓
Rate Limiting Middleware
    ↓
Route Handler (routes/)
    ↓
Authentication Middleware (middleware/auth.js) [if protected]
    ↓
Validation Middleware (middleware/validation.js)
    ↓
Controller (controllers/)
    ↓
├── Database Operations (models/)
├── External Services (utils/)
│   ├── M-Pesa API
│   ├── Cloudinary
│   └── Firebase FCM
    ↓
Response / Error Handler
    ↓
Client Response
```

---

## 📊 Data Models

### User Model
```javascript
{
  _id: ObjectId
  name: String
  email: String (unique)
  phone: String
  role: String (admin/owner/tenant)
  password: String (hashed)
  linkedProperty: ObjectId (ref: Property)
  isApproved: Boolean
  profileImage: String
  fcmToken: String
  createdAt: Date
  updatedAt: Date
}
```

### Property Model
```javascript
{
  _id: ObjectId
  ownerId: ObjectId (ref: User)
  ownerName: String
  name: String
  location: String
  rentAmount: Number
  paybill: String
  accountNumber: String
  code: String (unique)
  tenants: [ObjectId] (ref: User)
  photos: [String]
  propertyType: String
  numberOfRooms: Number
  description: String
  createdAt: Date
  updatedAt: Date
}
```

### Payment Model
```javascript
{
  _id: ObjectId
  tenantId: ObjectId (ref: User)
  tenantName: String
  propertyId: ObjectId (ref: Property)
  propertyName: String
  amount: Number
  date: Date
  paymentMethod: String (mpesa/cash/bank)
  transactionId: String (unique)
  status: String (success/pending/failed)
  phoneNumber: String
  failureReason: String
  checkoutRequestId: String
  merchantRequestId: String
  createdAt: Date
  updatedAt: Date
}
```

### Complaint Model
```javascript
{
  _id: ObjectId
  tenantId: ObjectId (ref: User)
  tenantName: String
  propertyId: ObjectId (ref: Property)
  propertyName: String
  title: String
  description: String
  images: [String]
  status: String (pending/in-progress/resolved)
  ownerResponse: String
  resolvedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔐 Authentication & Authorization

### Roles
- **Admin**: Full system access
- **Owner**: Manage own properties and tenants
- **Tenant**: View property info, make payments, submit complaints

### Protected Routes
```javascript
// Middleware chain example
router.get('/properties/my-properties',
  protect,              // Verify JWT token
  authorize('owner'),   // Check role
  getMyProperties       // Controller
);
```

### Token Flow
1. User logs in → Server generates JWT
2. Client stores token
3. Client sends token in Authorization header
4. Server verifies token and extracts user info
5. Request proceeds or 401/403 returned

---

## 🔌 External Integrations

### 1. M-Pesa Daraja API
**Purpose**: Payment processing  
**Location**: `utils/mpesa.js`  
**Endpoints Used**:
- OAuth: Generate access token
- STK Push: Initiate payment
- Callback: Receive payment status

### 2. Cloudinary
**Purpose**: Image storage and management  
**Location**: `utils/cloudinary.js`  
**Features**:
- Image upload with optimization
- Image transformation
- Secure storage

### 3. Firebase Cloud Messaging (FCM)
**Purpose**: Push notifications  
**Location**: `utils/firebase.js`  
**Notifications**:
- Payment confirmations
- Complaint updates
- Rent reminders
- Account approvals

---

## 🛡️ Security Features

### Implemented Security
- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **JWT Authentication**: 30-day expiration
- ✅ **Role-Based Access Control**: Protect routes by role
- ✅ **Helmet**: Security headers
- ✅ **CORS**: Controlled cross-origin access
- ✅ **Rate Limiting**: Prevent abuse
- ✅ **Input Validation**: express-validator
- ✅ **MongoDB Injection Prevention**: Mongoose sanitization

### Rate Limits
- Auth endpoints: 20 req/min per IP
- API endpoints: 100 req/min per user
- No limit on M-Pesa callbacks

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` - Register user
- `POST /login` - Login user
- `GET /verify` - Verify token

### Properties (`/api/properties`)
- `GET /` - Get all (admin)
- `GET /my-properties` - Get owner's properties
- `GET /:id` - Get by ID
- `POST /create` - Create property
- `PUT /update/:id` - Update property
- `DELETE /delete/:id` - Delete property
- `POST /link` - Link tenant to property

### Tenants (`/api/tenants`)
- `GET /property/:propertyId` - Get by property
- `GET /:id` - Get tenant details

### Payments (`/api/payments`)
- `POST /initiate` - STK Push
- `POST /callback` - M-Pesa callback
- `GET /history/:tenantId` - Payment history
- `GET /property/:propertyId` - By property
- `GET /balance/:tenantId` - Rent balance

### Complaints (`/api/complaints`)
- `GET /` - Get all
- `POST /create` - Create complaint
- `PUT /update/:id` - Update status
- `POST /resolve/:id` - Resolve
- `GET /property/:propertyId` - By property
- `GET /tenant/:tenantId` - By tenant

### Admin (`/api/admin`)
- `POST /approve-owner/:ownerId` - Approve owner
- `GET /stats` - System statistics
- `GET /transactions` - All transactions
- `GET /users` - All users
- `DELETE /users/:userId` - Delete user

### Uploads (`/api/upload`)
- `POST /image` - Upload single image
- `POST /images` - Upload multiple

### Notifications (`/api/notifications`)
- `POST /register-token` - Register FCM token
- `POST /send` - Send to user
- `POST /send-multiple` - Send to multiple

---

## 🚀 NPM Scripts

```json
{
  "start": "node server.js",           // Production mode
  "dev": "nodemon server.js",          // Development with auto-reload
  "create-admin": "node scripts/createAdmin.js",  // Create admin user
  "seed": "node scripts/seedData.js"   // Seed sample data
}
```

---

## 🔧 Configuration Files

### package.json
- Project metadata
- Dependencies
- Scripts

### .env
- Environment variables
- API credentials
- Configuration

### .gitignore
- node_modules/
- .env
- *.log
- uploads/

---

## 📦 Key Dependencies

### Core
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables

### Authentication & Security
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation

### External Services
- `axios` - HTTP client (M-Pesa API)
- `cloudinary` - Image storage
- `multer` - File upload handling
- `firebase-admin` - Push notifications

### Utilities
- `moment` - Date/time handling
- `morgan` - HTTP request logging

---

## 🎯 Development Workflow

### 1. Setup
```bash
npm install
cp env.example .env
# Edit .env
```

### 2. Database
```bash
# Start MongoDB
mongod
```

### 3. Initialize
```bash
npm run create-admin
npm run seed
```

### 4. Development
```bash
npm run dev
```

### 5. Testing
- Use Postman or cURL
- Test with sample accounts
- Verify all endpoints

### 6. Deployment
```bash
# See DEPLOYMENT.md
```

---

## 📈 Scalability Considerations

### Current Architecture
- Single server instance
- MongoDB for data storage
- Cloud services for media and notifications

### Future Enhancements
- Load balancing for multiple instances
- Redis for caching and sessions
- Message queue for async tasks
- Microservices architecture
- Database read replicas
- CDN for static assets

---

## 🧪 Testing Strategy

### Manual Testing
- API endpoint testing with Postman
- M-Pesa sandbox testing
- Image upload verification
- Push notification testing

### Recommended Testing Tools
- **Postman**: API testing
- **ngrok**: Webhook testing (M-Pesa callbacks)
- **MongoDB Compass**: Database visualization
- **Postman/cURL**: API requests

---

## 📝 Code Organization Principles

1. **Separation of Concerns**: Routes → Controllers → Models
2. **DRY (Don't Repeat Yourself)**: Reusable utilities
3. **Modular Design**: Independent modules
4. **Error Handling**: Centralized error handler
5. **Configuration**: Environment-based config
6. **Security First**: Multiple security layers
7. **Scalable Structure**: Easy to extend

---

## 🎓 Learning Resources

### Understanding the Stack
- **Express.js**: [expressjs.com](https://expressjs.com)
- **MongoDB**: [mongodb.com/docs](https://docs.mongodb.com)
- **Mongoose**: [mongoosejs.com](https://mongoosejs.com)
- **JWT**: [jwt.io](https://jwt.io)

### Integration Docs
- **M-Pesa Daraja**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- **Cloudinary**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **Firebase**: [firebase.google.com/docs](https://firebase.google.com/docs)

---

**Built with modern best practices and scalability in mind! 🚀**

