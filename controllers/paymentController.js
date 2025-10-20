const Payment = require('../models/Payment');
const Property = require('../models/Property');
const User = require('../models/User');
const mpesaService = require('../utils/mpesa');
const { sendNotificationToDevice } = require('../utils/firebase');

// @desc    Initiate M-Pesa payment (STK Push)
// @route   POST /api/payments/initiate
// @access  Private (Tenant)
exports.initiatePayment = async (req, res) => {
  try {
    const { propertyId, amount, phoneNumber } = req.body;

    // Verify property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Verify tenant is linked to property
    if (req.user.linkedProperty?.toString() !== propertyId) {
      return res.status(403).json({
        success: false,
        message: 'You are not linked to this property',
      });
    }

    // Format phone number
    const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${req.user._id.toString().slice(-4)}`;

    // Create pending payment record
    const payment = await Payment.create({
      tenantId: req.user._id,
      tenantName: req.user.name,
      propertyId: property._id,
      propertyName: property.name,
      amount: amount,
      paymentMethod: 'mpesa',
      transactionId: transactionId,
      status: 'pending',
      phoneNumber: formattedPhone,
    });

    // Initiate STK Push
    try {
      const stkResponse = await mpesaService.initiateSTKPush(
        formattedPhone,
        amount,
        property.code,
        `Rent payment for ${property.name}`
      );

      // Update payment with M-Pesa details
      payment.checkoutRequestId = stkResponse.CheckoutRequestID;
      payment.merchantRequestId = stkResponse.MerchantRequestID;
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      });
    } catch (mpesaError) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.failureReason = mpesaError.message;
      await payment.save();

      throw mpesaError;
    }
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
    });
  }
};

// @desc    M-Pesa payment callback
// @route   POST /api/payments/callback
// @access  Public (Called by Safaricom)
exports.paymentCallback = async (req, res) => {
  try {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    
    if (!Body || !Body.stkCallback) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    }

    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find payment by checkout request ID
    const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    }

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata.Item;
      const mpesaReceiptNumber = metadata.find(
        (item) => item.Name === 'MpesaReceiptNumber'
      )?.Value;

      payment.status = 'success';
      payment.transactionId = mpesaReceiptNumber || payment.transactionId;
      await payment.save();

      // Send notification to tenant
      const tenant = await User.findById(payment.tenantId);
      if (tenant && tenant.fcmToken) {
        await sendNotificationToDevice(
          tenant.fcmToken,
          'Payment Successful',
          `Your payment of KES ${payment.amount} has been received successfully`,
          {
            type: 'payment_success',
            paymentId: payment._id.toString(),
            amount: payment.amount.toString(),
          }
        );
      }

      // Send notification to owner
      const property = await Property.findById(payment.propertyId).populate('ownerId');
      if (property && property.ownerId && property.ownerId.fcmToken) {
        await sendNotificationToDevice(
          property.ownerId.fcmToken,
          'Payment Received',
          `${payment.tenantName} paid KES ${payment.amount} for ${payment.propertyName}`,
          {
            type: 'payment_received',
            paymentId: payment._id.toString(),
            tenantId: payment.tenantId.toString(),
          }
        );
      }

      console.log('Payment successful:', mpesaReceiptNumber);
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = ResultDesc;
      await payment.save();

      console.log('Payment failed:', ResultDesc);
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history/:tenantId
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    // Check authorization
    if (
      req.user.role === 'tenant' &&
      tenantId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment history',
      });
    }

    const payments = await Payment.find({ tenantId })
      .sort({ date: -1 })
      .populate('propertyId', 'name');

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get payments by property
// @route   GET /api/payments/property/:propertyId
// @access  Private (Owner)
exports.getPaymentsByProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Check if user owns the property
    if (property.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this property',
      });
    }

    const payments = await Payment.find({ propertyId: req.params.propertyId })
      .sort({ date: -1 })
      .populate('tenantId', 'name email phone');

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Get payments by property error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get rent balance
// @route   GET /api/payments/balance/:tenantId
// @access  Private
exports.getRentBalance = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    // Check authorization
    if (
      req.user.role === 'tenant' &&
      tenantId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this balance',
      });
    }

    const tenant = await User.findById(tenantId).populate('linkedProperty');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    if (!tenant.linkedProperty) {
      return res.status(404).json({
        success: false,
        message: 'Tenant is not linked to any property',
      });
    }

    const property = tenant.linkedProperty;

    // Get all successful payments
    const payments = await Payment.find({
      tenantId: tenantId,
      propertyId: property._id,
      status: 'success',
    }).sort({ date: -1 }).limit(5);

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = property.rentAmount - (totalPaid % property.rentAmount);

    // Calculate due date (5th of each month)
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 5);
    if (today.getDate() > 5) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const lastPayment = payments.length > 0 ? payments[0] : null;

    res.status(200).json({
      success: true,
      balance: {
        tenantId: tenant._id,
        propertyId: property._id,
        totalRent: property.rentAmount,
        totalPaid: totalPaid,
        balance: balance,
        dueDate: dueDate,
        lastPaymentDate: lastPayment ? lastPayment.date : null,
        recentPayments: payments.map(p => ({
          _id: p._id,
          amount: p.amount,
          date: p.date,
          status: p.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get rent balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

