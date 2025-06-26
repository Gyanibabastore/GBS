const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderStatusEnum = ['pending', 'out-for-delivery', 'delivered', 'sold', 'cancelled'];

const OrderSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer' },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
  

  // Order level status
  status: {
    type: String,
    enum: orderStatusEnum,
    default: 'pending'
  },
   quantity:Number,
  deviceName: String,
  brand: String,
  variant: String,
  imageUrl: String,
  otp:String,
  bookingAmount: Number,
  returnAmount: Number,
  bookingAmountSeller:Number,
  margin: Number,
  placedDate: Date,
  deliveryDate: Date,
  soldAt:Date,
 color: {
    type: String,
    required: true
  },
  // ✅ Embedded outForDelivery section
  outForDelivery: {
    name:String,
    otp: String,
    tracking: String,
    pincode: String,
    last4Digit: String,
    status: {
      type: String,
      enum: orderStatusEnum,
      default: 'pending'
    },
    assignedAt: Date
  },
   deal:Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
