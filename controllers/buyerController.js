

const Buyer = require('../models/Buyer');
const Order = require('../models/Order');
  
const Deal = require('../models/Deal');
const Payment = require('../models/Payment');

exports.getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
    const buyer = await Buyer.findById(buyerId).lean();
    if (!buyer) {
      req.flash('error', 'Buyer not found');
      return res.status(404).render('error/404', { msg: 'Buyer not found' });
    }

    const orders = await Order.find({ buyerId }).lean();
    const totalOrders = orders.length;
    const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
    const pendingOrdersCount = orders.filter(o => o.status === 'out-for-delivery').length;

    res.render('buyer/dashboard', {
      dashboardData: {
        _id: buyer._id,
        name: buyer.name,
        totalOrders,
        deliveredOrdersCount,
        pendingOrdersCount,
        totalDue: buyer.dueAmount || 0,
        totalEarning: buyer.totalEarning || 0
      },
      buyer
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).render('error/500', { msg: 'Failed to load dashboard' });
  }
};

// Buyer Orders
exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
 const buyer = await Buyer.findById(buyerId).lean();
    if (req.user.id !== buyerId) {
      req.flash('error', 'Unauthorized access');
      return res.status(403).redirect('/auth/login');
    }
    
    const orders = await Order.find({ buyerId }).sort({ placedDate: -1 }).lean();
    const mappedOrders = orders.map(order => ({
      status: order.outForDelivery?.status || 'pending',
      deviceModel: `${order.brand || 'Unknown'} ${order.deviceName || ''}`,
      variant: order.variant || '',
      color: order.color || '',
      imageUrl: order.imageUrl || '',
      bookingAmount: order.bookingAmount,
      returnAmount: order.returnAmount,
      margin: order.margin,
      quantity: order.quantity,
      orderDate: order.placedDate ? new Date(order.placedDate).toLocaleDateString() : ''
    }));

    res.render('buyer/orders', {
      orders: mappedOrders,
      defaultStatus: 'delivered',
      buyer
    });

  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).render('error/500', { msg: 'Could not fetch orders' });
  }
};

// Out For Delivery - GET
exports.getOutForDelivery = async (req, res) => {
  try {
    const buyerId = req.user.id;
     const buyer = await Buyer.findById(buyerId).lean();
    const orders = await Order.find({ buyerId, status: 'out-for-delivery' }).lean();
    const brands = await Deal.distinct("brand");
    const models = await Deal.distinct("deviceName");
    const variants = await Deal.distinct("variant");
    const pincodes = await Deal.distinct("pincode");
    const colors = await Deal.distinct("color");

    res.render('buyer/ofd', {
      deliveries: orders,
      brands,
      models,
      variants,
      pincodes,
      colors,
      buyer
    });

  } catch (err) {
    console.error('Out-for-delivery error:', err);
    res.status(500).render('error/500', { msg: 'Could not load deliveries' });
  }
};

// Out For Delivery - POST
exports.postOutForDelivery = async (req, res) => {
  try {
    const {
      name, brand, model, variant, color, pincode, otp, trackingId, mobileLast4
    } = req.body;

    const buyerId = req.user.id;

    const order = await Order.findOne({
      buyerId,
      brand,
      deviceName: model,
      variant,
      color,
      status: 'pending'
    });

    if (!order) {
      req.flash('error', 'No matching pending order found');
      return res.status(404).redirect('/buyer/out-for-delivery');
    }

    if (order.outForDelivery?.trackingId === trackingId) {
      req.flash('error', 'This tracking ID is already used');
      return res.redirect('/buyer/out-for-delivery');
    }

    order.orderName = name;
    order.status = 'out-for-delivery';
    order.outForDelivery = {
      name,
      pincode,
      otp,
      tracking: trackingId,
      last4Digit: mobileLast4,
      status: 'out-for-delivery',
      assignedAt: new Date()
    };

    await order.save();
    req.flash('success', 'Order marked as out for delivery');
    res.redirect('/buyer/out-for-delivery');

  } catch (err) {
    console.error('Post OFD Error:', err);
    res.status(500).render('error/500', { msg: 'Something went wrong while updating order' });
  }
};







exports.getBuyerDashboard = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.buyerId).lean();
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    const orders = await Order.find({ buyerId: buyer._id }).lean();
    const totalOrders = orders.length;
    const deliveredOrdersCount = orders.filter(order => order.status === 'delivered').length;
    const pendingOrdersCount = orders.filter(order => order.status === 'out-for-delivery').length;

    res.render('buyer/dashboard', {
      dashboardData: {
        _id: buyer._id,
        name: buyer.name,
        totalOrders,
        deliveredOrdersCount,
        pendingOrdersCount,
        totalDue: buyer.dueAmount || 0,
        totalEarning: buyer.totalEarning || 0,
        
      },
      buyer
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).render('error/500', { msg: 'Something went wrong while loading dashboard.' });
  }
};

// Orders Page
exports.getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
     const buyer = await Buyer.findById(buyerId).lean();
    if (req.user.id !== buyerId) {
      req.flash('error', 'Unauthorized access');
      return res.redirect('/auth/login');
    }

    const orders = await Order.find({ buyerId }).sort({ placedDate: -1 }).lean();
    const mappedOrders = orders.map(order => ({
      status: order.outForDelivery?.status || 'pending',
      deviceModel: `${order.brand || 'Unknown'} ${order.deviceName || ''}`,
      variant: order.variant || '',
      color: order.color || '',
      imageUrl: order.imageUrl || '',
      bookingAmount: order.bookingAmount,
      returnAmount: order.returnAmount,
      margin: order.margin,
      quantity: order.quantity,
      orderDate: order.placedDate ? new Date(order.placedDate).toLocaleDateString() : ''
    }));
   console.log("✅ Mapped Orders Rendered to EJS:", mappedOrders);
    res.render('buyer/orders', {
      orders: mappedOrders,
      defaultStatus: 'delivered',
      buyer
    });

  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    res.status(500).render('error/500', { msg: 'Unable to load orders at this time.' });
  }
};

// Manage Orders Page
exports.getManageOrders = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.buyerId).lean();
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    const deals = await Deal.find({ status: 'active' }).lean();
    const quantities = deals.map(() => 1); // default quantity = 1

    const pendingOrders = (buyer.orders || []).filter(order => order.status === 'pending');
    console.log(`📦 Found ${deals.length} active deals. Sending to EJS.`);

    res.render('buyer/manageOrder', {
      products: deals,
      quantities,
      pendingOrders,
      buyerId: req.params.buyerId,
      buyer
    });

  } catch (error) {
    console.error('❌ Manage Order Error:', error);
    res.status(500).render('error/500', { msg: 'Error loading manage order page.' });
  }
};

exports.updateBuyerOrder = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.buyerId);
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    const {
      deviceName, brand, variant, bookingAmount, returnAmount,
      imageUrl, margin, quantity, color
    } = req.body;
    console.log("this is body that coming ",req.body);
    const parsedQuantity = parseInt(quantity) || 0;
    console.log(`📝 Order requested: ${parsedQuantity} units of ${deviceName}`);

    const ordersToInsert = [];
    for (let i = 0; i < parsedQuantity; i++) {
      ordersToInsert.push({
        buyerId: req.params.buyerId,
        deviceName,
        brand,
        variant,
        bookingAmount: parseInt(bookingAmount) || 0,
        returnAmount: parseInt(returnAmount) || 0,
        margin: parseInt(margin) || 0,
        imageUrl,
        status: 'pending',
        color,
        placedDate: new Date(),
        createdAt: new Date()
      });
    }
    console.log("this what i inserting in order",ordersToInsert);
    await Order.insertMany(ordersToInsert);
    console.log(`✅ ${parsedQuantity} orders inserted.`);

    req.flash('success', `${parsedQuantity} orders created successfully.`);
    res.redirect(`/buyer/${req.params.buyerId}/orders`);

  } catch (error) {
    console.error('❌ Order creation failed:', error);
    res.status(500).render('error/500', { msg: 'Unable to create orders at this time.' });
  }
};

// Get Out For Delivery Page
exports.getOutForDelivery = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.id, status: 'out-for-delivery' });
    const brands = await Deal.distinct("brand");
    const models = await Deal.distinct("deviceName");
    const variants = await Deal.distinct("variant");
    const pincodes = await Deal.distinct("pincode");
    const colors = await Deal.distinct("color");
 const buyer = await Buyer.findById(req.user.id).lean(); // ✅ Add this line

    res.render('buyer/ofd', {
      deliveries: orders,
      brands,
      models,
      variants,
      pincodes,
      colors,
      buyer // ✅ Pass buyer to EJS for navbar etc.
    });


  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Error fetching delivery data' });
  }
};

// Post Out For Delivery Request
exports.postOutForDelivery = async (req, res) => {
  try {
    const { name, brand, model, variant, color, pincode, otp, trackingId, mobileLast4 } = req.body;
    const buyerId = req.user.id;

    const order = await Order.findOne({
      buyerId,
      brand,
      deviceName: model,
      variant,
      color,
      status: 'pending'
    });

    if (!order) {
      req.flash('error', 'No matching pending order found.');
      return res.redirect('/buyer/out-for-delivery');
    }

    if (order.outForDelivery?.trackingId === trackingId) {
      req.flash('error', 'This Tracking ID is already used.');
      return res.redirect('/buyer/out-for-delivery');
    }

    order.orderName = name;
    order.status = 'out-for-delivery';
    order.outForDelivery = {
      name, pincode, otp,
      tracking: trackingId,
      last4Digit: mobileLast4,
      status: 'out-for-delivery',
      assignedAt: new Date()
    };

    await order.save();
    req.flash('success', 'Order sent out for delivery successfully.');
    res.redirect('/buyer/out-for-delivery');

  } catch (err) {
    console.error('Post OFD Error:', err);
    res.status(500).render('error/500', { msg: 'Something went wrong during delivery process.' });
  }
};

// Get Deals Page
exports.getDeals = async (req, res) => {
  try {
     const buyer = await Buyer.findById(req.user.id).lean();
    const deals = await Deal.find({ status: 'active' });
    res.render('buyer/deals', { deals,buyer });
  } catch (error) {
    console.error('Error fetching deals:', error.message);
    res.status(500).render('error/500', { msg: 'Unable to fetch deals' });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { date } = req.query;

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    let filter = {
      fromRole: 'admin',
      toRole: 'buyer',
      toId: buyerId
    };

    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      filter.date = { $gte: selectedDate, $lt: nextDay };
    }

    const payments = await Payment.find(filter).sort({ date: -1 });
    const totalEarning = await Payment.aggregate([
      { $match: { ...filter } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const sumEarnings = totalEarning[0]?.total || 0;
    const totalDue = buyer.margin - sumEarnings;

    res.render('buyer/payment', {
      payments,
      totalEarning: sumEarnings,
      totalDue,
      selectedDate: date || '',
      buyer
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Error loading payment history' });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.buyerId).lean();
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });
    res.render('buyer/profile', { buyer });
  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Unable to load profile' });
  }
};

// Edit Profile Page
exports.editProfileForm = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.buyerId).lean();
    if (!buyer) return res.status(404).render('404', { msg: 'Buyer not found' });
    res.render('buyer/editProfile', { buyer });
  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Unable to load profile edit form' });
  }
};

// Update Profile POST
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, mobile, address, pincode, upi } = req.body;
    const buyer = await Buyer.findById(req.params.buyerId);

    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

    buyer.name = name;
    buyer.email = email;
    buyer.mobile = mobile;
    buyer.address = address;
    buyer.pincode = pincode;
    buyer.upi = upi;
    await buyer.save();

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Update error:', error);
res.status(500).render('error/500', { msg: 'server error' });
  }  }
;
