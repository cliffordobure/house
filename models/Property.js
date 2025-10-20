const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a property name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    rentAmount: {
      type: Number,
      required: [true, 'Please provide rent amount'],
      min: 0,
    },
    paybill: {
      type: String,
      required: [true, 'Please provide paybill number'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Please provide account number'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide property code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    tenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    photos: [
      {
        type: String,
      },
    ],
    propertyType: {
      type: String,
      default: null,
      trim: true,
    },
    numberOfRooms: {
      type: Number,
      default: null,
      min: 0,
    },
    description: {
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
propertySchema.index({ code: 1 });
propertySchema.index({ ownerId: 1 });

module.exports = mongoose.model('Property', propertySchema);

