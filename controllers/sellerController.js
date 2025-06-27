const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// GET seller dashboard
// ✅ Full Controller: getSellerDashboard

function groupOrders(orders) {
  const grouped = new Map();

  for (const order of orders) {
    console.log("🧾 Order Brand:", order.brand);

    const key = `${order.brand}|${order.deviceName}|${order.variant}|${order.color}`;
    const modelTitle = `${order.deviceName} (${order.variant})`;
    const price = order.bookingAmountSeller || 0;

    if (!grouped.has(key)) {
      grouped.set(key, {
        modelTitle,
        brand: order.brand,
        color: order.color,
        quantity: 1,
        totalPrice: price,
        sellerName: order.sellerName || "You",
        date: order.placedDate || order.deliveryDate || order.createdAt
      });
    } else {
      const existing = grouped.get(key);
      existing.quantity += 1;
      existing.totalPrice += price;
    }
  }

  return Array.from(grouped.values());
}

exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // 🔍 Get seller with discounts
    const seller = await Seller.findById(sellerId).lean();
    const sellerDiscounts = seller?.discounts || [];
    const dueAmount = seller?.advance || 0;

    // 🔍 All active deals
    const stockDeals = await Stock.find({ deal: true, availableCount: { $gt: 0 } });

    const modelMap = new Map();

    for (const stock of stockDeals) {
      const key = `${stock.deviceName}|${stock.variant}|${stock.color}`;
      const isLowStock = stock.availableCount < 2;

      // 🔍 Try to find matching discount
      const matchingDiscount = sellerDiscounts.find(d => d.stockId.toString() === stock._id.toString());
      const discountAmount = matchingDiscount ? matchingDiscount.amount : 0;

      if (matchingDiscount) {
        console.log(`✅ Discount matched for stock ${stock._id}: ₹${discountAmount}`);
      } else {
        console.log(`⛔ No discount for stock ${stock._id}`);
      }

      if (!modelMap.has(key)) {
        modelMap.set(key, {
          title: `${stock.deviceName} (${stock.variant})`,
          brand: stock.brand,
          image: stock.imageUrl,
          color: stock.color,
          buyerprice: stock.returnAmount,
          booking: stock.bookingAmountSeller,
          discount: discountAmount, // ✅ Push discount here
          stock: stock.availableCount,
          lowStock: isLowStock
        });
      } else {
        const existing = modelMap.get(key);
        existing.stock += stock.availableCount;
        if (stock.availableCount < 2) existing.lowStock = true;
        existing.discount += discountAmount; // Add if multiple matching
      }
    }

    const models = Array.from(modelMap.values());

    // 🔁 Orders
    const rawPending = await Order.find({ sellerId, status: 'out-for-delivery' }).sort({ deliveryDate: -1 });
    const rawDelivered = await Order.find({ sellerId, status: 'sold' }).sort({ deliveryDate: -1 });

    const pendingOrders = groupOrders(rawPending);
    const deliveredOrders = groupOrders(rawDelivered);

    console.log("📦 Final models with discount:");
    console.log(models);

    res.render('seller/dashboard', {
      sellerId,
      models,
      pendingOrders,
      deliveredOrders,
      dueAmount
    });

  } catch (err) {
    console.error('❌ Dashboard Error:', err);
    res.status(500).render('error/500', { msg: 'Failed to load seller dashboard.' });
  }
};


exports.placeSellerOrder = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log("🛒 Received Cart:", cart);

    const newOrders = [];
    let totalBookingAmount = 0;
    let totalMargin = 0;

    for (const item of cart) {
      const deviceName = item.title.split(' (')[0];
      const variant = item.title.split('(')[1]?.replace(')', '') || '';
      const quantity = item.quantity || 1;
      const color = item.color || '';

      const booking = item.booking;
      const buyerprice = item.buyerprice;

      
      for (let i = 0; i < quantity; i++) {
        const stock = await Stock.findOne({
          brand: item.brand,
          deviceName,
          variant,
          color
        });

        if (!stock || stock.availableCount <= 0) {
          console.warn(`⚠️ Stock not available for ${item.brand} ${deviceName} ${variant} ${color}`);
          continue;
        }

        const order = await Order.create({
          sellerId,
          deviceName,
          brand: item.brand,
          variant,
          color,
          imageUrl: item.image,
          bookingAmount: buyerprice,
          placedDate: new Date(),
          status: 'out-for-delivery',
          bookingAmountSeller:booking,
          
        });

        stock.availableCount -= 1;
        await stock.save();

        newOrders.push(order);
      }
    }

    if (newOrders.length === 0) {
      return res.status(400).json({ message: 'No valid orders could be placed due to stock limits.' });
    }

    // ✅ Update seller advance and earnings
    await Seller.findByIdAndUpdate(
      sellerId,
      {
        $inc: {
          advance: totalBookingAmount,
          earning: totalMargin
        }
      }
    );

    console.log(`💰 Added ₹${totalBookingAmount} to seller's advance`);
    console.log(`📈 Added ₹${totalMargin} to seller's earning`);

    return res.status(200).json({ message: 'Orders placed successfully.', count: newOrders.length });
  } catch (err) {
    console.error('❌ Order Placement Error:', err);
    return res.status(500).json({ message: 'Server error. Failed to place orders.' });
  }
};



// GET render add payment page
exports.renderAddPayment = (req, res) => {
  const sellerId = req.user.id;
  const buyerId = 12345;

  if (!buyerId && !sellerId) {
    return res.status(404).render('error/404', { msg: 'Buyer or Seller ID missing.' });
  }

  res.render('seller/addPayment', {
    buyerId,
    sellerId,
    adminId: req.user.id
  });
};

exports.postPayment = async (req, res) => {
  try {
    // ✅ Use values from the submitted form
    const {
      fromRole,
      fromId,
      toRole,
      toId,
      receivedFromName,
      amount,
      mode
    } = req.body;

    console.log("🧾 Incoming Payment Form Data:");
    console.log({ fromRole, fromId, toRole, toId, receivedFromName, amount, mode });

    if (!req.file || !req.file.path) {
      req.flash('error', 'Payment proof image is required.');
      return res.redirect('back');
    }

    if (fromRole === 'seller' && toRole !== 'admin') {
      req.flash('error', 'Seller can only send payment to admin.');
      return res.redirect('back');
    }
    if (fromRole === 'admin' && !['buyer', 'seller'].includes(toRole)) {
      req.flash('error', 'Admin can only send payment to buyer or seller.');
      return res.redirect('back');
    }

    const paymentData = {
      fromRole,
      fromId,
      toRole,
      toId,
      receivedFromName,
      amount,
      mode,
      image: req.file.path
    };

    console.log("📦 Final Payment Data to be saved:");
    console.log(paymentData);

    const payment = new Payment(paymentData);
    await payment.save();

    const paymentAmount = parseInt(amount);

    if (fromRole === 'seller') {
      await Seller.findByIdAndUpdate(fromId, {
        $inc: { advance: -paymentAmount }
      });
    } else if (fromRole === 'admin') {
      if (toRole === 'buyer') {
        await Buyer.findByIdAndUpdate(toId, {
          $inc: { dueAmount: -paymentAmount }
        });
      } else if (toRole === 'seller') {
        await Seller.findByIdAndUpdate(toId, {
          $inc: { advance: paymentAmount }
        });
      }
    }

    req.flash('success', 'Payment recorded successfully.');
    const redirectPath =
      toRole === 'admin'
        ? `/seller/dashboard/${fromId}`
        : `/admin/${toRole}-payment/${toId}`;
    res.redirect(redirectPath);
  } catch (err) {
    console.error("🔥 Payment Processing Error:", err);
    res.status(500).render('error/500', { msg: 'Failed to save payment.' });
  }
};

