// models/Payment.js

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  fromRole: {
    type: String,
    enum: ['admin', 'buyer', 'seller'],
    required: true
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'fromRole'
  },
  toRole: {
    type: String,
    enum: ['admin', 'buyer', 'seller'],
    required: true
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'toRole'
  },
  receivedFromName: {
    type: String, // e.g., "Paytm Wallet", "SBI UPI"
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  mode: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank', 'Other'],
    required: true
  },
  image: {
    type: String, // payment proof
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
