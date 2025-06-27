const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SellerSchema = new Schema({
  name: String,
  shopName:String,
  email: String,
  mobile: String,
  upi: String,
  advance: {
    type: Number,
    default: 0
  },
 discounts: [
    {
      stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
      amount: Number
    }
  ],
  password: String,
  earning:{
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Seller', SellerSchema);
