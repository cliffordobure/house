const Payment = require('../models/Payment');
const Property = require('../models/Property');
const User = require('../models/User');
const mpesaService = require('../utils/mpesa');
const { sendNotificationToDevice } = require('../utils/firebase');

// Helper function to process disbursement to property owner
async function processDisbursement(payment) {
  try {
    console.log(`Processing disbursement for payment ${payment._id}`);

    // Validate payment is ready for disbursement
    if (payment.status !== 'success') {
      throw new Error('Payment must be successful before disbursement');
    }

    if (!payment.ownerPaybill || !payment.ownerAccountNumber) {
      throw new Error('Owner payment details not found');
    }

    if (payment.disbursementStatus === 'completed') {
      console.log('Disbursement already completed');
      return;
    }

    if (payment.disbursementStatus === 'processing') {
      console.log('Disbursement already in progress');
      return;
    }

    // Update status to processing
    payment.disbursementStatus = 'processing';
    await payment.save();

    // Initiate B2B payment to property owner
    const b2bResponse = await mpesaService.initiateB2B(
      payment.ownerPaybill,
      payment.disbursementAmount,
      payment.ownerAccountNumber,
      `Rent disbursement for ${payment.propertyName} - Tenant: ${payment.tenantName}`
    );

    // Update payment with B2B details
    payment.disbursementConversationId = b2bResponse.ConversationID;
    payment.disbursementOriginatorConversationId = b2bResponse.OriginatorConversationID;
    await payment.save();

    console.log(`Disbursement initiated successfully:`, {
      paymentId: payment._id,
      conversationId: b2bResponse.ConversationID,
      amount: payment.disbursementAmount,
      toPaybill: payment.ownerPaybill,
      toAccount: payment.ownerAccountNumber,
    });

    return b2bResponse;
  } catch (error) {
    console.error('Disbursement error:', error);
    
    // Update payment with failure details
    payment.disbursementStatus = 'failed';
    payment.disbursementFailureReason = error.message;
    await payment.save();

    throw error;
  }
}

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

    // Calculate platform fee (configurable - default 5%)
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5');
    const platformFee = (amount * platformFeePercentage) / 100;
    const disbursementAmount = amount - platformFee;

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
      // Store owner payment details for disbursement
      ownerPaybill: property.paybill,
      ownerAccountNumber: property.accountNumber,
      platformFee: platformFee,
      disbursementAmount: disbursementAmount,
      disbursementStatus: 'pending',
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

      // Trigger automatic disbursement to property owner
      const autoDisbursement = process.env.AUTO_DISBURSEMENT === 'true' || true; // Default to true
      if (autoDisbursement) {
        try {
          console.log('Triggering automatic disbursement...');
          await processDisbursement(payment);
        } catch (disbursementError) {
          console.error('Auto-disbursement failed (will retry manually):', disbursementError.message);
          // Don't throw - payment is already successful, disbursement can be retried
        }
      }
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

// @desc    B2B payment callback (Disbursement result)
// @route   POST /api/payments/b2b-callback
// @access  Public (Called by Safaricom)
exports.b2bCallback = async (req, res) => {
  try {
    console.log('B2B Callback Received:', JSON.stringify(req.body, null, 2));

    const { Result } = req.body;

    if (!Result) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    }

    const { ConversationID, OriginatorConversationID, ResultCode, ResultDesc, ResultParameters } = Result;

    // Find payment by conversation ID
    const payment = await Payment.findOne({ 
      disbursementConversationId: ConversationID 
    });

    if (!payment) {
      console.error('Payment not found for ConversationID:', ConversationID);
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success',
      });
    }

    if (ResultCode === 0) {
      // Disbursement successful
      let transactionId = null;

      if (ResultParameters && ResultParameters.ResultParameter) {
        const transactionIdParam = ResultParameters.ResultParameter.find(
          (param) => param.Key === 'TransactionID'
        );
        transactionId = transactionIdParam?.Value;
      }

      payment.disbursementStatus = 'completed';
      payment.disbursementTransactionId = transactionId || payment.disbursementConversationId;
      payment.disbursementDate = new Date();
      await payment.save();

      console.log('Disbursement successful:', transactionId);

      // Notify property owner about disbursement
      const property = await Property.findById(payment.propertyId).populate('ownerId');
      if (property && property.ownerId && property.ownerId.fcmToken) {
        await sendNotificationToDevice(
          property.ownerId.fcmToken,
          'Disbursement Received',
          `KES ${payment.disbursementAmount} has been sent to your paybill ${payment.ownerPaybill}`,
          {
            type: 'disbursement_received',
            paymentId: payment._id.toString(),
            amount: payment.disbursementAmount.toString(),
          }
        );
      }
    } else {
      // Disbursement failed
      payment.disbursementStatus = 'failed';
      payment.disbursementFailureReason = ResultDesc;
      await payment.save();

      console.log('Disbursement failed:', ResultDesc);

      // Notify admin about failed disbursement
      console.error('ADMIN ALERT: Disbursement failed', {
        paymentId: payment._id,
        amount: payment.disbursementAmount,
        reason: ResultDesc,
        ownerPaybill: payment.ownerPaybill,
      });
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  } catch (error) {
    console.error('B2B callback error:', error);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  }
};

// @desc    Manually trigger disbursement (for retries or testing)
// @route   POST /api/payments/disburse/:paymentId
// @access  Private (Admin/Owner)
exports.manualDisbursement = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Authorization check
    if (req.user.role === 'owner') {
      const property = await Property.findById(payment.propertyId);
      if (!property || property.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to disburse this payment',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin or property owner can trigger disbursement',
      });
    }

    // Process disbursement
    await processDisbursement(payment);

    res.status(200).json({
      success: true,
      message: 'Disbursement initiated successfully',
      disbursementConversationId: payment.disbursementConversationId,
    });
  } catch (error) {
    console.error('Manual disbursement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate disbursement',
    });
  }
};

// @desc    Get disbursement status
// @route   GET /api/payments/disbursement-status/:paymentId
// @access  Private
exports.getDisbursementStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Authorization check
    if (req.user.role === 'tenant' && payment.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this disbursement',
      });
    }

    if (req.user.role === 'owner') {
      const property = await Property.findById(payment.propertyId);
      if (!property || property.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this disbursement',
        });
      }
    }

    res.status(200).json({
      success: true,
      disbursement: {
        paymentId: payment._id,
        amount: payment.amount,
        disbursementAmount: payment.disbursementAmount,
        platformFee: payment.platformFee,
        status: payment.disbursementStatus,
        transactionId: payment.disbursementTransactionId,
        date: payment.disbursementDate,
        failureReason: payment.disbursementFailureReason,
        ownerPaybill: payment.ownerPaybill,
        ownerAccountNumber: payment.ownerAccountNumber,
      },
    });
  } catch (error) {
    console.error('Get disbursement status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get disbursement history for property owner
// @route   GET /api/payments/disbursements/owner
// @access  Private (Owner)
exports.getOwnerDisbursements = async (req, res) => {
  try {
    // Get all properties owned by this user
    const properties = await Property.find({ ownerId: req.user._id });
    const propertyIds = properties.map(p => p._id);

    // Get all payments for these properties with successful disbursements
    const disbursements = await Payment.find({
      propertyId: { $in: propertyIds },
      status: 'success',
    })
      .sort({ disbursementDate: -1 })
      .select('amount disbursementAmount platformFee disbursementStatus disbursementTransactionId disbursementDate propertyName tenantName ownerPaybill ownerAccountNumber')
      .limit(100);

    // Calculate summary
    const summary = {
      totalDisbursed: 0,
      totalPlatformFees: 0,
      pendingDisbursements: 0,
      failedDisbursements: 0,
    };

    disbursements.forEach(d => {
      if (d.disbursementStatus === 'completed') {
        summary.totalDisbursed += d.disbursementAmount || 0;
        summary.totalPlatformFees += d.platformFee || 0;
      } else if (d.disbursementStatus === 'pending' || d.disbursementStatus === 'processing') {
        summary.pendingDisbursements += 1;
      } else if (d.disbursementStatus === 'failed') {
        summary.failedDisbursements += 1;
      }
    });

    res.status(200).json({
      success: true,
      summary,
      disbursements,
    });
  } catch (error) {
    console.error('Get owner disbursements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Retry failed disbursements (Admin only)
// @route   POST /api/payments/retry-failed-disbursements
// @access  Private (Admin)
exports.retryFailedDisbursements = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can retry failed disbursements',
      });
    }

    // Find all failed disbursements
    const failedPayments = await Payment.find({
      status: 'success',
      disbursementStatus: 'failed',
    }).limit(10); // Process 10 at a time

    const results = {
      total: failedPayments.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const payment of failedPayments) {
      try {
        await processDisbursement(payment);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          paymentId: payment._id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Retried ${results.total} failed disbursements`,
      results,
    });
  } catch (error) {
    console.error('Retry failed disbursements error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

