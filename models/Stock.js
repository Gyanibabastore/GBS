const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  deviceName: { type: String, required: true },
  brand: { type: String, required: true },
  variant: { type: String, required: true },
  color: { type: String, default: 'N/A' },
   deal:Boolean,
  imageUrl: { type: String },
  
  bookingAmountSeller: Number,
  returnAmount: Number ,

  availableCount: { type: Number, default: 0 },   // 🔹 for stock still available
  soldCount: { type: Number, default: 0 },        // 🔹 for tracking sold stock

  deliveryDate: { type: Date },   // optional, if needed for available items
  soldAt: [                       // 🔹 Track all sold instances
    {
      soldDate: { type: Date, default: Date.now },
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      bookingAmountSeller: { type: Number },
      returnAmount: { type: Number }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
