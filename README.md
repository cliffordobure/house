# PropertyHub Backend API

A comprehensive property management system backend built with Node.js, Express, MongoDB, and integrated with M-Pesa STK Push for payments.

## Features

- 🔐 **User Authentication** - JWT-based authentication with role-based access control (Admin, Owner, Tenant)
- 🏢 **Property Management** - Full CRUD operations for properties
- 👥 **Tenant Management** - Track tenants and their linked properties
- 💰 **M-Pesa Integration** - STK Push payment integration with Safaricom Daraja API
- 📝 **Complaint System** - Tenants can submit and track complaints
- 🔔 **Push Notifications** - Firebase Cloud Messaging for real-time notifications
- 📸 **Image Upload** - Cloudinary integration for image storage
- 📊 **Admin Dashboard** - System statistics and user management
- 🛡️ **Security** - Helmet, rate limiting, and CORS protection

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: M-Pesa Daraja API
- **Cloud Storage**: Cloudinary
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Security**: Helmet, express-rate-limit, bcryptjs
- **Validation**: express-validator

## Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── propertyController.js
│   ├── tenantController.js
│   ├── paymentController.js
│   ├── complaintController.js
│   ├── adminController.js
│   ├── uploadController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js              # JWT authentication & authorization
│   ├── errorHandler.js      # Global error handler
│   └── validation.js        # Request validation rules
├── models/
│   ├── User.js              # User schema
│   ├── Property.js          # Property schema
│   ├── Payment.js           # Payment schema
│   └── Complaint.js         # Complaint schema
├── routes/
│   ├── authRoutes.js
│   ├── propertyRoutes.js
│   ├── tenantRoutes.js
│   ├── paymentRoutes.js
│   ├── complaintRoutes.js
│   ├── adminRoutes.js
│   ├── uploadRoutes.js
│   └── notificationRoutes.js
├── utils/
│   ├── mpesa.js             # M-Pesa service utilities
│   ├── cloudinary.js        # Cloudinary upload utilities
│   ├── firebase.js          # Firebase FCM utilities
│   └── jwt.js               # JWT token generation
├── .gitignore
├── package.json
├── server.js                # Main application entry point
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- M-Pesa Daraja API credentials (for payment integration)
- Cloudinary account (for image uploads)
- Firebase project (for push notifications)

### Setup Steps

1. **Clone the repository**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the `env.example` file to `.env` and fill in your credentials:
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your actual credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/propertyhub
   JWT_SECRET=your_secure_jwt_secret_key
   
   # M-Pesa Configuration
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=174379
   MPESA_PASSKEY=your_passkey
   MPESA_CALLBACK_URL=https://your-backend.com/api/payments/callback
   MPESA_ENVIRONMENT=sandbox
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud database
   ```

5. **Run the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication APIs
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

#### Property APIs
- `GET /api/properties` - Get all properties (Admin)
- `GET /api/properties/my-properties` - Get owner's properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties/create` - Create new property (Owner)
- `PUT /api/properties/update/:id` - Update property (Owner)
- `DELETE /api/properties/delete/:id` - Delete property (Owner)
- `POST /api/properties/link` - Link tenant to property

#### Tenant APIs
- `GET /api/tenants/property/:propertyId` - Get tenants by property (Owner)
- `GET /api/tenants/:id` - Get tenant details

#### Payment APIs
- `POST /api/payments/initiate` - Initiate M-Pesa STK Push (Tenant)
- `POST /api/payments/callback` - M-Pesa callback (Webhook)
- `GET /api/payments/history/:tenantId` - Get payment history
- `GET /api/payments/property/:propertyId` - Get payments by property (Owner)
- `GET /api/payments/balance/:tenantId` - Get rent balance

#### Complaint APIs
- `GET /api/complaints` - Get all complaints (Admin/Owner)
- `POST /api/complaints/create` - Create complaint (Tenant)
- `PUT /api/complaints/update/:id` - Update complaint (Owner)
- `POST /api/complaints/resolve/:id` - Resolve complaint (Owner)
- `GET /api/complaints/property/:propertyId` - Get complaints by property
- `GET /api/complaints/tenant/:tenantId` - Get complaints by tenant

#### Admin APIs
- `POST /api/admin/approve-owner/:ownerId` - Approve owner account
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:userId` - Delete user

#### Upload APIs
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images

#### Notification APIs
- `POST /api/notifications/register-token` - Register FCM token
- `POST /api/notifications/send` - Send notification to user
- `POST /api/notifications/send-multiple` - Send to multiple users

For detailed API documentation with request/response examples, see the API documentation provided.

## M-Pesa Integration Setup

### Getting M-Pesa Credentials

1. **Register on Daraja API Portal**
   - Visit [https://developer.safaricom.co.ke](https://developer.safaricom.co.ke)
   - Create an account and login

2. **Create an App**
   - Go to "My Apps" and create a new app
   - Select "Lipa Na M-Pesa Online" API
   - Note down your Consumer Key and Consumer Secret

3. **Get Test Credentials**
   - For sandbox testing, use the provided test credentials
   - Business Short Code: 174379
   - Passkey: Available in the test credentials section

4. **Configure Callback URL**
   - You need a publicly accessible URL for callbacks
   - Use ngrok for local testing: `ngrok http 5000`
   - Set the callback URL in your `.env` file

### Testing M-Pesa Payments

Use the Safaricom sandbox with these test credentials:
- Phone Number: Any valid Kenyan number (254XXXXXXXXX)
- Amount: 1 to 150,000 KES

## Cloudinary Setup

1. Create a free account at [https://cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env` file

## Firebase Setup (Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Generate a new private key
5. Add the credentials to your `.env` file

## Rate Limiting

The API has rate limiting enabled:
- **Auth endpoints**: 20 requests per minute
- **API endpoints**: 100 requests per minute per user

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Helmet for security headers
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Request validation
- ✅ MongoDB injection prevention

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT | Yes |
| `MPESA_CONSUMER_KEY` | M-Pesa consumer key | Yes |
| `MPESA_CONSUMER_SECRET` | M-Pesa consumer secret | Yes |
| `MPESA_BUSINESS_SHORT_CODE` | M-Pesa paybill number | Yes |
| `MPESA_PASSKEY` | M-Pesa passkey | Yes |
| `MPESA_CALLBACK_URL` | M-Pesa callback URL | Yes |
| `MPESA_ENVIRONMENT` | sandbox or production | No (default: sandbox) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | No |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Error Handling

The API uses a centralized error handling system that returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Testing with Postman

1. Import the API endpoints into Postman
2. Register a new user with role "owner" or "tenant"
3. Use the returned JWT token for authenticated requests
4. Test M-Pesa payments in sandbox mode

## Production Deployment

### Deployment Checklist

- [ ] Set `NODE_ENV=production` in environment variables
- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Use MongoDB Atlas or production MongoDB instance
- [ ] Switch M-Pesa to production environment
- [ ] Set up proper SSL certificate (HTTPS)
- [ ] Configure production callback URLs
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Review and adjust rate limits
- [ ] Set proper CORS origin (don't use '*')

### Deployment Options

- **Heroku**: Add Procfile with `web: node server.js`
- **Railway**: Connect GitHub repo and deploy
- **DigitalOcean**: Use App Platform or Droplet with PM2
- **AWS**: Use Elastic Beanstalk or EC2 with PM2
- **Render**: Connect GitHub repo and deploy

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGODB_URI is correct
- For Atlas, whitelist your IP address

### M-Pesa STK Push Not Working
- Verify all M-Pesa credentials are correct
- Ensure callback URL is publicly accessible
- Check phone number format (254XXXXXXXXX)
- Test with sandbox credentials first

### Image Upload Failing
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure file is an image format

### Push Notifications Not Sending
- Verify Firebase credentials
- Ensure FCM token is registered
- Check Firebase project settings

## Support

For issues and questions:
- Email: support@propertyhub.com
- Documentation: https://docs.propertyhub.com

## License

ISC

## Author

PropertyHub Development Team

---

**Built with ❤️ using Node.js, Express, and MongoDB**

