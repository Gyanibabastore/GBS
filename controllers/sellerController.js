const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Order = require('../models/Order');
const Stock = require('../models/stock');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// GET seller dashboard
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const stockDeals = await Stock.find({ deal: true, availableCount: { $gt: 0 } });
    const modelMap = new Map();

    for (const stock of stockDeals) {
      const key = `${stock.deviceName}|${stock.variant}|${stock.color}`;
      if (!modelMap.has(key)) {
        modelMap.set(key, {
          title: `${stock.deviceName} (${stock.variant})`,
          brand: stock.brand,
          image: stock.imageUrl,
          color: stock.color,
          booking: stock.bookingAmountSeller,
          stock: stock.availableCount
        });
      } else {
        modelMap.get(key).stock += stock.availableCount;
      }
    }

    const models = Array.from(modelMap.values());

    const pendingOrders = await Order.find({ sellerId, status: 'out-for-delivery' }).sort({ deliveryDate: -1 });
    const deliveredSellerOrders = await Order.find({ sellerId, status: 'sold' }).sort({ deliveryDate: -1 });

    const formatOrder = (order) => ({
      id: order._id,
      modelTitle: `${order.deviceName} (${order.variant})`,
      quantity: 1,
      color: order.color,
      totalPrice: order.bookingAmount || order.bookingAmountSeller || 0,
      date: order.placedDate || order.deliveryDate || order.createdAt
    });

    const formattedPending = pendingOrders.map(order => ({ ...formatOrder(order), date: order.placedDate }));
    const formattedDelivered = deliveredSellerOrders.map(order => ({ ...formatOrder(order), date: order.deliveryDate }));

    res.render('seller/dashboard', {
      sellerId,
      models,
      pendingOrders: formattedPending,
      deliveredOrders: formattedDelivered
    });

  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).render('error/500', { msg: 'Failed to load seller dashboard.' });
  }
};

// POST place seller orders
// POST place seller orders
exports.placeSellerOrder = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      req.flash('error', 'Cart is empty');
      return res.redirect('/seller/dashboard');
    }

    const newOrders = [];

    for (const item of cart) {
      const deviceName = item.title.split(' (')[0];
      const variant = item.title.split('(')[1]?.replace(')', '') || '';
      const quantity = item.quantity || 1;
      const color = item.color || '';

      for (let i = 0; i < quantity; i++) {
        const order = await Order.create({
          sellerId,
          deviceName,
          brand: item.brand,
          variant,
          color,
          imageUrl: item.image,
          bookingAmount: item.booking,
          placedDate: new Date(),
          status: 'out-for-delivery'
        });

        newOrders.push(order);
      }
    }

    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(200).json({ message: 'Orders placed successfully.' });
    }

    req.flash('success', 'Orders placed successfully.');
    res.redirect('/seller/dashboard');
  } catch (err) {
    console.error('Order Placement Error:', err);

    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({ message: 'Server error. Failed to place orders.' });
    }

    res.status(500).render('error/500', { msg: 'Failed to place orders.' });
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

// POST payment
exports.postPayment = async (req, res) => {
  try {
    const user = req.user;
    const fromRole = user.role;
    const fromId = user.id;

    const {
      toRole,
      toId,
      receivedFromName,
      amount,
      mode
    } = req.body;

    if (fromRole === 'seller' && toRole !== 'admin') {
      req.flash('error', 'Seller can only send payment to admin.');
      return res.redirect('back');
    }
    if (fromRole === 'admin' && !['buyer', 'seller'].includes(toRole)) {
      req.flash('error', 'Admin can only send payment to buyer or seller.');
      return res.redirect('back');
    }

    if (!req.file || !req.file.path) {
      req.flash('error', 'Payment proof image is required.');
      return res.redirect('back');
    }

    const payment = new Payment({
      fromRole,
      fromId,
      toRole,
      toId,
      receivedFromName,
      amount,
      mode,
      image: req.file.path
    });

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
