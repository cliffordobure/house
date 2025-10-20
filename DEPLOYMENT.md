# PropertyHub Backend - Deployment Guide

This guide will help you deploy your PropertyHub backend to various platforms.

## Table of Contents
1. [Heroku Deployment](#heroku-deployment)
2. [Railway Deployment](#railway-deployment)
3. [Render Deployment](#render-deployment)
4. [DigitalOcean Deployment](#digitalocean-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Production Checklist](#production-checklist)

---

## Heroku Deployment

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps

1. **Create a Procfile**
   ```bash
   echo "web: node server.js" > Procfile
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create propertyhub-api
   ```

4. **Add MongoDB Atlas**
   ```bash
   # Use MongoDB Atlas for production database
   # Get connection string from Atlas dashboard
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_production_jwt_secret
   heroku config:set MONGODB_URI=your_mongodb_atlas_uri
   heroku config:set MPESA_CONSUMER_KEY=your_key
   heroku config:set MPESA_CONSUMER_SECRET=your_secret
   # ... set all other environment variables
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

7. **Create Admin User**
   ```bash
   heroku run node scripts/createAdmin.js
   ```

8. **View Logs**
   ```bash
   heroku logs --tail
   ```

---

## Railway Deployment

### Steps

1. **Visit Railway.app**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Note the connection string

4. **Set Environment Variables**
   - Go to your service settings
   - Add all environment variables from `.env`
   - Update `MONGODB_URI` with Railway's MongoDB connection string

5. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Monitor deployment in the dashboard

6. **Get Domain**
   - Railway provides a free domain: `your-app.up.railway.app`
   - Or connect your custom domain

---

## Render Deployment

### Steps

1. **Visit Render.com**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select branch (main)

3. **Configure Service**
   ```
   Name: propertyhub-api
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   - Click "Environment" tab
   - Add all variables from `.env`
   - Make sure to set `NODE_ENV=production`

5. **Add MongoDB**
   - Use MongoDB Atlas
   - Or create MongoDB instance on Render

6. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

7. **Auto-Deploy**
   - Enable auto-deploy for automatic deployments on push

---

## DigitalOcean Deployment

### Using DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean dashboard
   - Click "Apps" → "Create App"
   - Connect GitHub repository

2. **Configure App**
   ```
   Type: Web Service
   Environment: Node.js
   Build Command: npm install
   Run Command: npm start
   ```

3. **Add Environment Variables**
   - Add all production environment variables
   - Use managed MongoDB database

4. **Deploy**
   - Click "Next" → "Deploy"
   - Wait for deployment to complete

### Using Droplet with PM2

1. **Create Droplet**
   ```bash
   # Choose Ubuntu 20.04
   # Select size and region
   ```

2. **SSH into Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/propertyhub-backend.git
   cd propertyhub-backend
   npm install
   ```

6. **Create .env File**
   ```bash
   nano .env
   # Add all production environment variables
   ```

7. **Start with PM2**
   ```bash
   pm2 start server.js --name propertyhub-api
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/propertyhub
   ```

   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/propertyhub /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your_domain.com
   ```

---

## AWS Deployment

### Using Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   eb init
   # Select region
   # Select Node.js platform
   ```

3. **Create Environment**
   ```bash
   eb create propertyhub-production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv NODE_ENV=production JWT_SECRET=your_secret
   # Set all other variables
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

6. **Open Application**
   ```bash
   eb open
   ```

---

## Production Checklist

### Security
- [ ] Strong JWT_SECRET (min 32 characters, random)
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins (not '*')
- [ ] Use environment variables for all secrets
- [ ] Enable Helmet security headers
- [ ] Review and adjust rate limits
- [ ] Enable MongoDB authentication
- [ ] Use MongoDB Atlas IP whitelist

### Database
- [ ] Use MongoDB Atlas or managed database
- [ ] Enable automatic backups
- [ ] Set up monitoring
- [ ] Create database indexes
- [ ] Plan for scaling

### M-Pesa
- [ ] Switch to production environment
- [ ] Update callback URLs to production
- [ ] Test with real transactions
- [ ] Monitor transaction logs
- [ ] Set up error alerts

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure logging (e.g., Winston)
- [ ] Set up uptime monitoring
- [ ] Monitor API performance
- [ ] Set up alerts for failures

### Performance
- [ ] Enable gzip compression
- [ ] Implement caching where appropriate
- [ ] Optimize database queries
- [ ] Set up CDN for static assets
- [ ] Monitor response times

### Documentation
- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] Create backup/restore procedures

### Testing
- [ ] Test all endpoints in production
- [ ] Verify M-Pesa integration
- [ ] Test file uploads
- [ ] Verify push notifications
- [ ] Load test critical endpoints

---

## Environment Variables for Production

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/propertyhub?retryWrites=true&w=majority

# JWT (Use strong random secret)
JWT_SECRET=<generate-strong-random-secret-min-32-chars>

# M-Pesa Production
MPESA_CONSUMER_KEY=<production-key>
MPESA_CONSUMER_SECRET=<production-secret>
MPESA_BUSINESS_SHORT_CODE=<your-paybill>
MPESA_PASSKEY=<production-passkey>
MPESA_CALLBACK_URL=https://api.yourdomain.com/api/payments/callback
MPESA_ENVIRONMENT=production

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Firebase
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_PRIVATE_KEY=<your-private-key>
FIREBASE_CLIENT_EMAIL=<your-client-email>

# CORS
FRONTEND_URL=https://yourdomain.com
```

---

## Post-Deployment

1. **Create Admin User**
   ```bash
   node scripts/createAdmin.js
   ```

2. **Seed Sample Data (Optional)**
   ```bash
   node scripts/seedData.js
   ```

3. **Test Critical Endpoints**
   - Authentication
   - Property creation
   - Payment initiation
   - Image upload
   - Push notifications

4. **Monitor Logs**
   - Check for errors
   - Monitor API usage
   - Watch for failed payments

5. **Set Up Backups**
   - Database backups
   - Environment variable backups
   - Code repository backups

---

## Troubleshooting Production Issues

### Application Won't Start
- Check environment variables
- Verify MongoDB connection
- Check Node.js version
- Review logs for errors

### M-Pesa Not Working
- Verify production credentials
- Check callback URL is HTTPS
- Ensure URL is publicly accessible
- Check M-Pesa logs on Daraja portal

### Database Connection Issues
- Verify MongoDB URI
- Check IP whitelist on Atlas
- Verify database user credentials
- Check network connectivity

### High Response Times
- Check database indexes
- Monitor query performance
- Check server resources
- Consider caching

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review error logs
- Contact platform support
- Consult community forums

---

**Good luck with your deployment! 🚀**

