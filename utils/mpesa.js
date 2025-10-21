const axios = require('axios');
const moment = require('moment');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.businessShortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.b2bCallbackUrl = process.env.MPESA_B2B_CALLBACK_URL || process.env.MPESA_CALLBACK_URL;
    this.timeoutUrl = process.env.MPESA_TIMEOUT_URL || process.env.MPESA_CALLBACK_URL;
    this.initiatorName = process.env.MPESA_INITIATOR_NAME;
    this.securityCredential = process.env.MPESA_SECURITY_CREDENTIAL;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    this.baseUrl = this.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Use sandbox test credentials if passkey is not provided
    if (this.environment === 'sandbox' && !this.passkey) {
      console.log('⚠️  Using M-Pesa sandbox test credentials');
      this.businessShortCode = '174379'; // Sandbox test shortcode
      this.passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'; // Sandbox test passkey
    }
  }

  // Generate access token
  async getAccessToken() {
    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error generating access token:', error.response?.data || error.message);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  // Generate password for STK Push
  generatePassword() {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(
      `${this.businessShortCode}${this.passkey}${timestamp}`
    ).toString('base64');

    return { password, timestamp };
  }

  // Initiate STK Push
  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const stkPushData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.floor(amount),
        PartyA: phoneNumber,
        PartyB: this.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc || 'Rent Payment',
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        stkPushData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating STK Push:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment');
    }
  }

  // Query STK Push transaction status
  async querySTKPushStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const queryData = {
        BusinessShortCode: this.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        queryData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying STK Push status:', error.response?.data || error.message);
      throw new Error('Failed to query transaction status');
    }
  }

  // Format phone number to M-Pesa format (254XXXXXXXXX)
  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.toString().trim();
    
    // Remove any spaces
    formatted = formatted.replace(/\s/g, '');
    
    // Remove + if present
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    
    // Handle different formats
    if (formatted.startsWith('07')) {
      // 07XXXXXXXX -> 2547XXXXXXXX
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('7')) {
      // 7XXXXXXXX -> 2547XXXXXXXX
      formatted = '254' + formatted;
    } else if (formatted.startsWith('254')) {
      // Already in correct format
      formatted = formatted;
    } else {
      // Default: add 254 prefix
      formatted = '254' + formatted;
    }
    
    // Validate final format
    if (!/^254\d{9}$/.test(formatted)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}. Expected formats: 254XXXXXXXXX, +254XXXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX`);
    }
    
    return formatted;
  }

  // Initiate B2B Payment (Business to Business - Pay to another Paybill)
  async initiateB2B(receiverPartyPublicName, amount, accountReference, remarks) {
    try {
      const accessToken = await this.getAccessToken();

      // Validate required credentials
      if (!this.initiatorName || !this.securityCredential) {
        throw new Error('B2B requires MPESA_INITIATOR_NAME and MPESA_SECURITY_CREDENTIAL environment variables');
      }

      const b2bData = {
        Initiator: this.initiatorName,
        SecurityCredential: this.securityCredential,
        CommandID: 'BusinessPayBill',
        SenderIdentifierType: '4', // 4 = Paybill
        RecieverIdentifierType: '4', // 4 = Paybill
        Amount: Math.floor(amount),
        PartyA: this.businessShortCode, // Your paybill
        PartyB: receiverPartyPublicName, // Owner's paybill
        AccountReference: accountReference, // Owner's account number
        Remarks: remarks || 'Rent disbursement',
        QueueTimeOutURL: this.timeoutUrl,
        ResultURL: this.b2bCallbackUrl,
      };

      console.log('Initiating B2B payment:', {
        from: b2bData.PartyA,
        to: b2bData.PartyB,
        amount: b2bData.Amount,
        account: b2bData.AccountReference,
      });

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2b/v1/paymentrequest`,
        b2bData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log('B2B Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initiating B2B payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errorMessage || 'Failed to initiate B2B payment');
    }
  }

  // Register C2B URLs (Optional - for production setup)
  async registerUrls(shortCode, confirmationUrl, validationUrl) {
    try {
      const accessToken = await this.getAccessToken();

      const registerData = {
        ShortCode: shortCode || this.businessShortCode,
        ResponseType: 'Completed', // or 'Cancelled'
        ConfirmationURL: confirmationUrl || this.callbackUrl,
        ValidationURL: validationUrl || this.callbackUrl,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/c2b/v1/registerurl`,
        registerData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error registering URLs:', error.response?.data || error.message);
      throw new Error('Failed to register URLs');
    }
  }

  // Query B2B transaction status
  async queryB2BStatus(transactionId) {
    try {
      const accessToken = await this.getAccessToken();

      const queryData = {
        Initiator: this.initiatorName,
        SecurityCredential: this.securityCredential,
        CommandID: 'TransactionStatusQuery',
        TransactionID: transactionId,
        PartyA: this.businessShortCode,
        IdentifierType: '4', // 4 = Paybill
        ResultURL: this.b2bCallbackUrl,
        QueueTimeOutURL: this.timeoutUrl,
        Remarks: 'Status query',
        Occasion: 'Status check',
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        queryData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying B2B status:', error.response?.data || error.message);
      throw new Error('Failed to query B2B transaction status');
    }
  }
}

module.exports = new MpesaService();

