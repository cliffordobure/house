const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Only initialize if email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('✅ Email service initialized');
    } else {
      console.log('⚠️  Email service not configured - emails will be logged to console');
      this.transporter = null;
    }
  }

  async sendLandlordInvitationEmail(data) {
    try {
      const emailTemplate = this.generateLandlordInvitationTemplate(data);
      
      if (this.transporter) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@propertyhub.com',
          to: data.landlordEmail,
          subject: 'PropertyHub - Your Tenant Invites You to Join',
          html: emailTemplate,
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Landlord invitation email sent:', result.messageId);
        return result;
      } else {
        // Log email to console if no transporter configured
        console.log('📧 LANDLORD INVITATION EMAIL (not sent - no email service configured):');
        console.log('To:', data.landlordEmail);
        console.log('Subject: PropertyHub - Your Tenant Invites You to Join');
        console.log('Template:', emailTemplate.substring(0, 200) + '...');
        return { messageId: 'console-logged' };
      }
    } catch (error) {
      console.error('Error sending landlord invitation email:', error);
      throw error;
    }
  }

  generateLandlordInvitationTemplate(data) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const registrationUrl = `${frontendUrl}/register?role=owner&referral=${encodeURIComponent(data.tenantEmail)}`;
    const landlordName = data.landlordName || 'Landlord';
    const propertyInfo = data.propertyAddress ? `<li><strong>Property Address:</strong> ${data.propertyAddress}</li>` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PropertyHub - Landlord Invitation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563EB;">
            <h1 style="color: #2563EB; margin: 0; font-size: 28px;">PropertyHub</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Digital Property Management</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">Your Tenant Invites You to Join PropertyHub</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Hello ${landlordName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Your tenant <strong>${data.tenantName}</strong> has registered on PropertyHub and would like you to join our platform to manage your property digitally.
            </p>

            <!-- Tenant Details Box -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563EB;">
              <h3 style="color: #2563EB; margin-top: 0;">Tenant Details:</h3>
              <ul style="color: #555; padding-left: 20px;">
                <li><strong>Name:</strong> ${data.tenantName}</li>
                <li><strong>Email:</strong> ${data.tenantEmail}</li>
                <li><strong>Phone:</strong> ${data.tenantPhone}</li>
                ${propertyInfo}
              </ul>
            </div>

            <!-- Benefits Section -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333;">By joining PropertyHub, you can:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>📱 <strong>Manage properties digitally</strong> - Add, edit, and track all your properties</li>
                <li>💰 <strong>Receive rent payments via M-Pesa</strong> - Secure, instant payments</li>
                <li>📝 <strong>Handle tenant complaints efficiently</strong> - Track and resolve issues</li>
                <li>📊 <strong>Track rent collection and balances</strong> - Real-time financial overview</li>
                <li>📈 <strong>Generate reports and analytics</strong> - Make data-driven decisions</li>
                <li>🔔 <strong>Get instant notifications</strong> - Stay updated on all activities</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${registrationUrl}" 
                 style="background-color: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);">
                Join PropertyHub Now
              </a>
            </div>

            <!-- Additional Info -->
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h4 style="color: #2563EB; margin-top: 0;">What happens next?</h4>
              <ol style="color: #555; line-height: 1.6;">
                <li>Click the button above to register as a property owner</li>
                <li>Create your account and add your property details</li>
                <li>Your tenant will be automatically linked to your property</li>
                <li>Start managing rent collection and tenant communications</li>
              </ol>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              If you have any questions, please contact us at 
              <a href="mailto:support@propertyhub.com" style="color: #2563EB;">support@propertyhub.com</a>
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Best regards,<br>
              <strong>The PropertyHub Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              © 2024 PropertyHub. All rights reserved.
            </p>
            <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
              This email was sent because your tenant invited you to join PropertyHub.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(userData) {
    try {
      const emailTemplate = this.generateWelcomeTemplate(userData);
      
      if (this.transporter) {
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@propertyhub.com',
          to: userData.email,
          subject: `Welcome to PropertyHub, ${userData.name}!`,
          html: emailTemplate,
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent:', result.messageId);
        return result;
      } else {
        // Log email to console if no transporter configured
        console.log('📧 WELCOME EMAIL (not sent - no email service configured):');
        console.log('To:', userData.email);
        console.log('Subject: Welcome to PropertyHub, ' + userData.name + '!');
        console.log('Template:', emailTemplate.substring(0, 200) + '...');
        return { messageId: 'console-logged' };
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  generateWelcomeTemplate(userData) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/login`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to PropertyHub</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2563EB;">
            <h1 style="color: #2563EB; margin: 0; font-size: 28px;">PropertyHub</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Digital Property Management</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to PropertyHub, ${userData.name}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Thank you for joining PropertyHub! Your account has been created successfully.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                Login to Your Account
              </a>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              If you have any questions, please contact us at 
              <a href="mailto:support@propertyhub.com" style="color: #2563EB;">support@propertyhub.com</a>
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              Best regards,<br>
              <strong>The PropertyHub Team</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
