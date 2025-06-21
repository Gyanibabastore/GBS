// models/Deal.js

const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  bookingAmount: {
    type: Number,
    required: true
  },
  returnAmount: {
    type: Number,
    required: true
  },
  margin: {
    type: Number,
    required: true
  },
  cardWorking: {
    type: String, // e.g., "SIM", "WiFi", "All", etc.
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  buyLink: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin or seller who created it
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Deal', dealSchema);
