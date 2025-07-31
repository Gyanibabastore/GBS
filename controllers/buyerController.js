

const Buyer = require('../models/Buyer');
const Order = require('../models/Order');
  
const Deal = require('../models/Deal');
const Payment = require('../models/Payment');













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

    const orderMap = {};
    const statusPriority = { delivered: 3, pending: 2, canceled: 1 };

    orders.forEach(order => {
      const brand = (order.brand || '').trim().toLowerCase();
      const deviceName = (order.deviceName || '').trim().toLowerCase();
      const variant = (order.variant || '').trim().toLowerCase();
      const color = (order.color || '').trim().toLowerCase();
      const bookingAmount = order.bookingAmount || 0;
      const returnAmount = order.returnAmount || 0;
      const margin = order.margin || 0;
      const imageUrl = order.imageUrl || '';
      const placedDate = order.placedDate?.toISOString().split('T')[0] || '';
      const id=order._id;
      const status = order.outForDelivery?.status || 'pending';
      const quantity = Number(order.quantity) || 1;

      // 👇 Include status in the key so they are grouped separately
      const key = `${brand}|${deviceName}|${variant}|${color}|${bookingAmount}|${returnAmount}|${margin}|${imageUrl}|${placedDate}|${status}`;

      if (!orderMap[key]) {
        orderMap[key] = {
          id,
          status,
          deviceModel: `${order.brand || 'Unknown'} ${order.deviceName || ''}`,
          variant: order.variant || '',
          color: order.color || '',
          imageUrl: order.imageUrl || '',
          bookingAmount: order.bookingAmount,
          returnAmount: order.returnAmount,
          margin: order.margin,
          quantity,
          orderDate: order.placedDate
            ? new Date(order.placedDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : ''
        };
      } else {
        orderMap[key].quantity += quantity;
      }
    });

    const groupedOrders = Object.values(orderMap);
     console.log(groupedOrders);
     
    res.render('buyer/orders', {
      orders: groupedOrders,
      defaultStatus: 'delivered',
      buyer
    });

  } catch (error) {
    console.error('❌ Error fetching buyer orders:', error);
    res.status(500).render('error/500', { msg: 'Unable to load orders at this time.' });
  }
};






































// Manage Orders Page
exports.getManageOrders = async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
  //  console.log(buyerId);
    // Find buyer
    const buyer = await Buyer.findById(buyerId).lean();
    if (!buyer) {
      return res.status(404).render('error/404', { msg: 'Buyer not found' });
    }

    // Get all active deals
   let deals = await Deal.find({
      status: 'active',
      $or: [
        { buyerIds: { $exists: false } },
        { buyerIds: { $size: 0 } },
        { buyerIds: buyer._id }
      ]
    }).lean();
    // console.log(deals);
    // Inject private deal quantities from buyer schema
    if (buyer.dealQuantities && buyer.dealQuantities.length > 0) {
      deals = deals.map(deal => {
        if (deal.buyerIds && deal.buyerIds.length > 0) {
          const match = buyer.dealQuantities.find(q => q.dealId.toString() === deal._id.toString());
          if (match) {
            return {
              ...deal,
              quantity: match.quantity
            };
          }
        }
        return deal;
      });
    }
      
    // Get all pending orders for this buyer
    const rawOrders = await Order.find({
      buyerId: buyerId,
      status: 'pending'
    }).lean();

    // Group pending orders by brand, deviceName, variant, color, and date
    const groupedOrdersMap = new Map();

    rawOrders.forEach(order => {
      let dateKey = 'unknown';
      if (order.date && !isNaN(new Date(order.date))) {
        dateKey = new Date(order.date).toISOString().slice(0, 10);
      }

      const key = `${order.brand}|${order.deviceName}|${order.variant}|${order.color}|${dateKey}`;

      if (!groupedOrdersMap.has(key)) {
        groupedOrdersMap.set(key, {
          ...order,
          quantity: order.quantity || 1,
          date: order.date || new Date()
        });
      } else {
        groupedOrdersMap.get(key).quantity += order.quantity || 1;
      }
    });

    const groupedPendingOrders = Array.from(groupedOrdersMap.values());

    res.render('buyer/manageOrder', {
      products: deals,
      pendingOrders: groupedPendingOrders,
      buyerId: buyerId,
      buyer
    });

  } catch (error) {
    console.error('❌ Manage Order Error:', error);
    res.status(500).render('error/500', { msg: 'Error loading manage order page.' });
  }
};




exports.updateBuyerOrder = async (req, res) => {
  try {
    console.log("🔁 Order update route hit");

    const buyer = await Buyer.findById(req.params.buyerId);
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    console.log("📥 Request Body:", req.body);
    const {
      deviceName, brand, variant, bookingAmount,
      returnAmount, imageUrl, margin, quantity, color
    } = req.body;

    const parsedQuantity = parseInt(quantity) || 0;
    if (parsedQuantity < 1) {
      req.flash('error', 'Invalid quantity.');
      return res.redirect(`/buyer/manage-orders/${req.params.buyerId}`);
    }

    const deal = await Deal.findOne({ brand, deviceName, variant, color });
    if (!deal) {
      req.flash('error', `No matching deal found for ${deviceName}`);
      return res.redirect(`/buyer/manage-orders/${req.params.buyerId}`);
    }

    console.log("📦 Matching Deal Found:", deal._id);
    const isUnlimited = deal.quantity === 'unlimited';
    const isPublic = typeof deal.quantity === 'number';
    const buyerDealIndex = buyer.dealQuantities.findIndex(dq => dq.dealId.toString() === deal._id.toString());
    const buyerDeal = buyer.dealQuantities[buyerDealIndex];

    if (isUnlimited) {
      console.log("♾️ Unlimited deal — placing order");
    } else if (isPublic || !buyerDeal) {
      const availableQty = parseInt(deal.quantity);
      console.log("📊 Public deal — available:", availableQty, "requested:", parsedQuantity);

      if (parsedQuantity > availableQty) {
        req.flash('error', `Only ${availableQty} unit(s) left in deal.`);
        return res.redirect(`/buyer/manage-orders/${req.params.buyerId}`);
      }

      deal.quantity = availableQty - parsedQuantity;

      // Inactivate if zero
      if (deal.quantity == 0) {
        deal.status = 'inactive';
        console.log("⛔ Deal marked inactive (public)");
      }

      await deal.save();
      console.log(`✅ Deal quantity updated to ${deal.quantity}`);
    } else {
      console.log("👤 Buyer-specific deal quantity found:", buyerDeal.quantity, "requested:", parsedQuantity);

      if (parsedQuantity > buyerDeal.quantity) {
        req.flash('error', `Only ${buyerDeal.quantity} unit(s) left for you.`);
        return res.redirect(`/buyer/manage-orders/${req.params.buyerId}`);
      }

      buyerDeal.quantity -= parsedQuantity;

      if (buyerDeal.quantity <= 0) {
        buyer.dealQuantities.splice(buyerDealIndex, 1); // remove deal from buyer
        console.log("🗑️ Removed deal from buyer.dealQuantities (quantity 0)");

        // Check if all buyer quantities are removed → mark deal inactive
        const isAllBuyersExhausted = buyer.dealQuantities.every(dq => dq.dealId.toString() !== deal._id.toString());
        if (isAllBuyersExhausted) {
          deal.status = 'inactive';
          await deal.save();
          console.log("⛔ Deal marked inactive (buyer-specific all buyers exhausted)");
        }
      }

      await buyer.save();
      console.log(`✅ Buyer's deal quantity updated`);
    }

    // Insert orders
    const ordersToInsert = [];
    for (let i = 0; i < parsedQuantity; i++) {
      ordersToInsert.push({
        buyerId: buyer._id,
        deviceName,
        brand,
        variant,
        bookingAmount: parseInt(bookingAmount) || 0,
        returnAmount: parseInt(returnAmount) || 0,
        margin: parseInt(margin) || 0,
        imageUrl,
        color,
        status: 'pending',
        placedDate: new Date(),
        createdAt: new Date()
      });
    }
     
    await Order.insertMany(ordersToInsert);
    console.log(`✅ Inserted ${parsedQuantity} order(s) for buyer ${buyer.name}`);
     
    req.flash('success', `✅ Successfully placed ${parsedQuantity} order(s).`);

    res.redirect(`/buyer/manage-orders/${req.params.buyerId}#orders`);
  } catch (error) {
    console.error('❌ Order creation failed:', error);
    res.status(500).render('error/500', { msg: 'Could not create order' });
  }
};









exports.getOutForDelivery = async (req, res) => {
  try {
    

    const buyerId = req.user.id;
    const buyer = await Buyer.findById(buyerId).lean();
    const orders = await Order.find({ buyerId, status: 'out-for-delivery' }).lean();

    // 🔽 Get dropdown data from all deals
    const deals = await Deal.find({}).lean();
    const groupedData = {};

    deals.forEach(deal => {
      if (!groupedData[deal.brand]) {
        groupedData[deal.brand] = {
          models: new Set(),
          variants: new Set(),
          colors: new Set(),
          pincodes: new Set(),
        };
      }

      groupedData[deal.brand].models.add(deal.deviceName);
      groupedData[deal.brand].variants.add(deal.variant);
      groupedData[deal.brand].colors.add(deal.color);
      groupedData[deal.brand].pincodes.add(deal.pincode);
    });

    // 🔁 Convert Sets to Arrays
    for (const brand in groupedData) {
      groupedData[brand].models = Array.from(groupedData[brand].models);
      groupedData[brand].variants = Array.from(groupedData[brand].variants);
      groupedData[brand].colors = Array.from(groupedData[brand].colors);
      groupedData[brand].pincodes = Array.from(groupedData[brand].pincodes);
    }

    console.log("RENDERING DROPDOWN DATA:", {
      brands: Object.keys(groupedData),
      dropdownMap: groupedData
    });
   console.log("🎯 Flash Success:", req.flash('success'));
console.log("🎯 Flash Error:", req.flash('error'));

    // ✅ Render with flash messages included
    res.render('buyer/ofd', {
      deliveries: orders,
      brands: Object.keys(groupedData),
      dropdownMap: groupedData,
      buyer,
      messages: {
    success: req.flash('success'),
    error: req.flash('error')
  }
      
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
      req.flash('error', '❌ No matching pending order found');
      return res.status(404).redirect('/buyer/out-for-delivery');
    }

    if (!trackingId || !otp || !mobileLast4 || !name) {
      req.flash('error', '❌ Please fill all required fields');
      return res.redirect('/buyer/out-for-delivery');
    }

    if (order.outForDelivery?.tracking === trackingId) {
      req.flash('error', '❌ This tracking ID is already used');
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
    req.flash('success', '✅ Order marked as out for delivery');
    res.redirect('/buyer/out-for-delivery');

  } catch (err) {
    console.error('Post OFD Error:', err);
    req.flash('error', '❌ Something went wrong while updating order');
    res.redirect('/buyer/out-for-delivery');
  }
};

// Get Deals Page
exports.getDeals = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user.id).lean();

    let deals = await Deal.find({
      status: 'active',
      $or: [
        { buyerIds: { $exists: false } },
        { buyerIds: { $size: 0 } },
        { buyerIds: buyer._id }
      ]
    }).lean();

    if (buyer.dealQuantities && buyer.dealQuantities.length > 0) {
      deals = deals.map(deal => {
        if (deal.buyerIds && deal.buyerIds.length > 0) {
          const match = buyer.dealQuantities.find(q => q.dealId.toString() === deal._id.toString());
          if (match) {
            return {
              ...deal,
              quantity: match.quantity
            };
          }
        }
        return deal;
      });
    }

    res.render('buyer/deals', { deals, buyer });
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
    if (!buyer) {
      return res.status(404).render('error/404', { msg: 'Buyer not found' });
    }

    // Base filter
    const filter = {
      fromRole: 'admin',
      toRole: 'buyer',
      toId: buyerId
    };

    let selectedDate = null;

    if (date) {
      selectedDate = new Date(date + 'T00:00:00'); // ensure start of day
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = {
        $gte: selectedDate,
        $lt: nextDay
      };

      console.log("🕵️‍♂️ Date filter applied:", filter.date);
    } else {
      console.log("ℹ️ No date filter applied");
    }

    // Get payments
    const payments = await Payment.find(filter).sort({ date: -1 });

    // Use buyer's stored values
    const totalEarning = buyer.totalEarning || 0;
    const totalDue = buyer.dueAmount || 0;

    res.render('buyer/payment', {
      payments,
      totalEarning,
      totalDue,
      selectedDate: date || '',
      buyer
    });

  } catch (err) {
    console.error("❌ Error in getPaymentHistory:", err);
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







exports.cancelOrderRequest = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.cancelRequest) {
      return res.status(400).json({ message: "Cancel already requested" });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    order.cancelRequest = true;
    await order.save();

    return res.status(200).json({ message: "Cancel request sent successfully" });
  } catch (err) {
    console.error("❌ Cancel request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


