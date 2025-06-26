const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BuyerSchema = new Schema({
  name: String,
  email: String,
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  upi: String,
  
  password: String,

  dueAmount: {
    type: Number,
    default: 0
  },
  totalEarning: {
    type: Number,
    default: 0
  },
  dealQuantities: [
    {
      dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deal',
        required: true
      },
      quantity: {
        type: Number,
        
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Buyer', BuyerSchema);
