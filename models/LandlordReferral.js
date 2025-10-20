const mongoose = require('mongoose');

const landlordReferralSchema = new mongoose.Schema(
  {
    tenantEmail: {
      type: String,
      required: [true, 'Tenant email is required'],
      lowercase: true,
      trim: true,
    },
    tenantName: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
    },
    tenantPhone: {
      type: String,
      required: [true, 'Tenant phone is required'],
      trim: true,
    },
    landlordEmail: {
      type: String,
      required: [true, 'Landlord email is required'],
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'registered', 'declined'],
      default: 'pending',
    },
    landlordResponse: {
      type: String,
      default: null,
      trim: true,
    },
    contactedAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
landlordReferralSchema.index({ landlordEmail: 1 });
landlordReferralSchema.index({ tenantEmail: 1 });
landlordReferralSchema.index({ status: 1 });
landlordReferralSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LandlordReferral', landlordReferralSchema);
