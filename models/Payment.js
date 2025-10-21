const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide payment amount'],
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'cash', 'bank'],
      default: 'mpesa',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'pending',
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    checkoutRequestId: {
      type: String,
      default: null,
    },
    merchantRequestId: {
      type: String,
      default: null,
    },
    // Disbursement fields (B2B to property owner)
    disbursementStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'not_required'],
      default: 'pending',
    },
    disbursementAmount: {
      type: Number,
      default: null,
    },
    disbursementTransactionId: {
      type: String,
      default: null,
    },
    disbursementConversationId: {
      type: String,
      default: null,
    },
    disbursementOriginatorConversationId: {
      type: String,
      default: null,
    },
    disbursementDate: {
      type: Date,
      default: null,
    },
    disbursementFailureReason: {
      type: String,
      default: null,
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    ownerPaybill: {
      type: String,
      default: null,
    },
    ownerAccountNumber: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
paymentSchema.index({ tenantId: 1, date: -1 });
paymentSchema.index({ propertyId: 1, date: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ disbursementStatus: 1 });
paymentSchema.index({ checkoutRequestId: 1 });
paymentSchema.index({ disbursementConversationId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

