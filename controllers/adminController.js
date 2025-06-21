const Order = require('../models/Order');

const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Payment = require('../models/Payment');

const Deal = require('../models/Deal');
const moment = require('moment');









const Stock = require('../models/Stock'); // Adjust path as needed








exports.getDashboard = async (req, res) => {
  try {
    const { month, date } = req.query;
    const filter = {};

    if (month) {
      const start = moment(month).startOf('month').toDate();
      const end = moment(month).endOf('month').toDate();
      filter.createdAt = { $gte: start, $lte: end };
    } else if (date) {
      const start = moment(date).startOf('day').toDate();
      const end = moment(date).endOf('day').toDate();
      filter.createdAt = { $gte: start, $lte: end };
    }

    const allStocks = await Stock.find(filter);
    const allOrders = await Order.find(filter);

    const totalOrders = allStocks.reduce((sum, s) => sum + s.availableCount + s.soldCount, 0);
    const soldStock = allStocks.reduce((sum, s) => sum + s.soldCount, 0);
    const availableStock = allStocks.reduce((sum, s) => sum + s.availableCount, 0);
    const outForDeliveryCount = allOrders.filter(o => o.status === 'out-for-delivery' && !o.sellerId).length;

    const buyerCount = await Buyer.countDocuments();
    const sellerCount = await Seller.countDocuments();

    const totalPaymentsResult = await Seller.aggregate([{ $group: { _id: null, total: { $sum: '$advance' } } }]);
    const totalOrderValue = totalPaymentsResult[0]?.total || 0;

    const totalDuesResult = await Buyer.aggregate([{ $group: { _id: null, total: { $sum: '$dueAmount' } } }]);
    const totalDue = totalDuesResult[0]?.total || 0;

    const soldBrandCount = {};
    const availableBrandCount = {};

    allStocks.forEach(stock => {
      const brand = stock.brand || 'Unknown';
      soldBrandCount[brand] = (soldBrandCount[brand] || 0) + stock.soldCount;
      availableBrandCount[brand] = (availableBrandCount[brand] || 0) + stock.availableCount;
    });

    const barChartData = Array.from(new Set([...Object.keys(soldBrandCount), ...Object.keys(availableBrandCount)])).map(brand => ({
      brand,
      sold: soldBrandCount[brand] || 0,
      available: availableBrandCount[brand] || 0
    }));

    res.render('admin/dashboard', {
      totalOrders,
      soldStock,
      availableStock,
      buyerCount,
      sellerCount,
      totalOrderValue,
      totalDue,
      outForDeliveryCount,
      soldBrandData: Object.entries(soldBrandCount).map(([brand, count]) => ({ brand, count })),
      availableBrandData: Object.entries(availableBrandCount).map(([brand, count]) => ({ brand, count })),
      barChartData
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Dashboard loading failed.');
    res.status(500).render('error/500', { msg: 'Dashboard loading failed.' });
  }
};

exports.getTotalOrders = async (req, res) => {
  try {
    const { month, date } = req.query;
    const matchQuery = {};

    if (month) {
      const start = moment(month, 'YYYY-MM').startOf('month').toDate();
      const end = moment(month, 'YYYY-MM').endOf('month').toDate();
      matchQuery.createdAt = { $gte: start, $lte: end };
    }
    if (date) {
      const start = moment(date, 'YYYY-MM-DD').startOf('day').toDate();
      const end = moment(date, 'YYYY-MM-DD').endOf('day').toDate();
      matchQuery.createdAt = { $gte: start, $lte: end };
    }

    const allStocks = await Stock.find(matchQuery).lean();
    const deviceMap = new Map();

    for (let stock of allStocks) {
      const key = `${stock.brand}-${stock.deviceName}-${stock.variant}-${stock.color}`;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          brand: stock.brand,
          model: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          delivered: 0,
          sold: 0,
          available: 0
        });
      }
      const item = deviceMap.get(key);
      item.sold += stock.soldCount;
      item.available += stock.availableCount;
      item.delivered += stock.soldCount + stock.availableCount;
    }

    const ordersList = Array.from(deviceMap.values());
    const soldBrandMap = {};
    for (let item of ordersList) {
      soldBrandMap[item.brand] = (soldBrandMap[item.brand] || 0) + item.sold;
    }
    const soldBrandData = Object.entries(soldBrandMap).map(([brand, count]) => ({ brand, count }));

    const availableBrandMap = {};
    for (let item of ordersList) {
      availableBrandMap[item.brand] = (availableBrandMap[item.brand] || 0) + item.available;
    }
    const availableBrandData = Object.entries(availableBrandMap).map(([brand, count]) => ({ brand, count }));

    res.render('admin/orders', {
      orders: ordersList,
      soldBrandData,
      availableBrandData,
      selectedMonth: month || '',
      selectedDate: date || ''
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load order data.');
    res.status(500).render('error/500', { msg: 'Order page loading failed.' });
  }
};

exports.getSoldDevices = async (req, res) => {
  try {
    const { soldDate, soldMonth } = req.query;
    const match = {};

    if (soldDate) {
      const start = new Date(soldDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(soldDate);
      end.setHours(23, 59, 59, 999);
      match['soldAt.date'] = { $gte: start, $lte: end };
    } else if (soldMonth) {
      const [year, month] = soldMonth.split('-');
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      match['soldAt.date'] = { $gte: start, $lte: end };
    }

    const stocks = await Stock.find(match).lean();
    const deviceMap = new Map();
    const brandWiseSold = {};

    for (let stock of stocks) {
      if (!stock.soldAt || !Array.isArray(stock.soldAt)) continue;

      for (let soldEntry of stock.soldAt) {
        const soldDateObj = new Date(soldEntry.date || stock.updatedAt || stock.createdAt);
        const soldDateStr = soldDateObj.toISOString().split('T')[0];

        const key = `${stock.brand}-${stock.deviceName}-${stock.variant}-${stock.color}-${soldDateStr}`;
        if (!deviceMap.has(key)) {
          deviceMap.set(key, {
            brand: stock.brand,
            model: stock.deviceName,
            variant: stock.variant,
            color: stock.color,
            soldDate: soldDateStr,
            quantitySold: 0
          });
        }

        deviceMap.get(key).quantitySold += 1;
        brandWiseSold[stock.brand] = (brandWiseSold[stock.brand] || 0) + 1;
      }
    }

    res.render('admin/soldDevice', {
      soldDevices: Array.from(deviceMap.values()),
      brandBarLabels: Object.keys(brandWiseSold),
      brandBarData: Object.values(brandWiseSold),
      selectedDate: soldDate || '',
      selectedMonth: soldMonth || ''
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load sold device data.');
    res.status(500).render('error/500', { msg: 'Sold devices data load failed.' });
  }
};

exports.getAvailableStock = async (req, res) => {
  try {
    const allStocks = await Stock.find().lean();
    const stockMap = new Map();
    const brandTotals = {};

    for (let stock of allStocks) {
      const key = `${stock.brand}-${stock.deviceName}-${stock.variant}-${stock.color}`;
      const soldCount = Array.isArray(stock.soldAt) ? stock.soldAt.length : 0;
      const available = stock.availableCount - soldCount;
      if (available <= 0) continue;

      if (!stockMap.has(key)) {
        stockMap.set(key, {
          brand: stock.brand,
          model: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          quantity: 0
        });
      }

      stockMap.get(key).quantity += available;
      brandTotals[stock.brand] = (brandTotals[stock.brand] || 0) + available;
    }

    res.render('admin/availableStock', {
      stockData: Array.from(stockMap.values()),
      chartLabels: Object.keys(brandTotals),
      chartValues: Object.values(brandTotals)
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load available stock.');
    res.status(500).render('error/500', { msg: 'Available stock loading failed.' });
  }
};








//---------------------------------buyer



// Utility to assign unique color to each buyer (optional but looks better)
const getColor = (i) => {
  const colors = ['#007bff', '#28a745', '#dc3545', '#17a2b8', '#ffc107', '#6f42c1', '#fd7e14'];
  return colors[i % colors.length];
};
// buyer controller
exports.getAllBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find().sort({ createdAt: -1 });

    const buyersWithColor = buyers.map((b, i) => ({
      name: b.name,
      mobile: b.mobile,
      email: b.email,
      upi: b.upi,
      id: b._id.toString(),
      color: getColor(i)
    }));

    res.render('admin/buyer', { buyers: buyersWithColor });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load buyers');
    res.status(500).render('error/500', { msg: 'Failed to load buyers' });
  }
};

// seller controller
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().sort({ createdAt: -1 });

    const sellerData = sellers.map((seller, i) => ({
      id: seller._id.toString(),
      name: seller.name,
      mobile: seller.mobile,
      email: seller.email,
      upi: seller.upi,
      color: getColor(i)
    }));

    res.render('admin/seller', { sellers: sellerData });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    req.flash('error', 'Failed to load sellers');
    res.status(500).render('error/500', { msg: 'Failed to load sellers' });
  }
};

// seller payments
exports.getAllSellerPayments = async (req, res) => {
  try {
    const { filterDate, filterMonth } = req.query;

    const payments = await Payment.find({ role: 'Seller' }).populate('userId').lean();

    const allPayments = payments.map(payment => ({
      name: payment.userId?.name || 'N/A',
      phone: payment.userId?.phone || 'N/A',
      amount: payment.amount,
      mode: payment.mode,
      proofImg: payment.proofImage,
      date: payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A',
    }));

    let filtered = allPayments;
    if (filterDate) {
      filtered = filtered.filter(p => p.date === new Date(filterDate).toLocaleDateString());
    } else if (filterMonth) {
      filtered = filtered.filter(p => {
        const month = new Date(p.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        return month === filterMonth;
      });
    }

    const totalAdvance = filtered.reduce((acc, p) => acc + p.amount, 0);

    const months = [...new Set(allPayments.map(p => new Date(p.date).toLocaleString('default', { month: 'long', year: 'numeric' })))]

    res.render('admin/paymentRecived', {
      payments: filtered,
      totalAdvance,
      filterDate,
      filterMonth,
      months
    });
  } catch (err) {
    console.error('Error in getAllSellerPayments:', err);
    req.flash('error', 'Failed to load seller payments');
    res.status(500).render('error/500', { msg: 'Failed to load seller payments' });
  }
};

// total payment due
exports.getTotalPaymentDue = async (req, res) => {
  try {
    const { filterDate, filterMonth } = req.query;

    const buyers = await Buyer.find().select('dueAmount').lean();
    const totalDue = buyers.reduce((acc, buyer) => acc + (buyer.dueAmount || 0), 0);

    let paymentFilter = { role: 'buyer' };

    if (filterMonth) {
      const [monthName, year] = filterMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 1);
      paymentFilter.date = { $gte: start, $lt: end };
    }

    if (filterDate) {
      const start = new Date(filterDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      paymentFilter.date = { $gte: start, $lt: end };
    }

    const paymentDocs = await Payment.find(paymentFilter).populate('buyerId', 'name').sort({ date: -1 }).lean();

    const payments = paymentDocs.map(p => ({
      buyerName: p.buyerId?.name || 'Unknown Buyer',
      amount: p.amount || 0,
      mode: p.mode || 'N/A',
      date: p.date.toDateString(),
      reference: p.reference || 'N/A',
      proofImage: p.proofImage || ''
    }));

    const allBuyerPayments = await Payment.find({ role: 'buyer' }).select('date').lean();
    const monthSet = new Set();
    allBuyerPayments.forEach(p => {
      const date = new Date(p.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthSet.add(monthYear);
    });
    const months = Array.from(monthSet).sort((a, b) => new Date(a) - new Date(b));

    res.render('admin/paymentDue', {
      payments,
      totalDue,
      months,
      filterMonth,
      filterDate
    });
  } catch (err) {
    console.error('Error loading payment due page:', err);
    req.flash('error', 'Failed to load due payments');
    res.status(500).render('error/500', { msg: 'Failed to load due payments' });
  }
};

// out-for-delivery (OFD)
exports.getAllDeliveries = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const orders = await Order.find({
      'outForDelivery.status': 'out-for-delivery'
    }).populate('buyerId', 'name phone').lean();

    const deliveries = orders.map(order => ({
      id: order._id,
      buyerId: order.buyerId?._id,
      buyerName: order.buyerId?.name || 'N/A',
      buyerPhone: order.buyerId?.phone || 'N/A',
      brand: order.brand,
      model: order.deviceName,
      variant: order.variant,
      color: order.color,
      pincode: order.outForDelivery?.pincode || 'N/A',
      trackingId: order.outForDelivery?.tracking || 'N/A',
      otp: order.outForDelivery?.otp || 'N/A',
      delivered: order.outForDelivery?.status === 'delivered',
    }));

    const deliveredCount = deliveries.filter(d => d.delivered).length;
    const pendingCount = deliveries.length - deliveredCount;

    res.render('admin/ofd', {
      deliveries,
      deliveredCount,
      pendingCount
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load deliveries');
    res.status(500).render('error/500', { msg: 'Failed to load deliveries' });
  }
};







// const Stock = require('../models/Stock'); // make sure it's imported

exports.markDelivered = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'Order ID is required' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'delivered') {
      return res.status(200).json({ message: 'Order is already marked as delivered' });
    }

    // Update status
    order.status = 'delivered';
    order.deal = false;
    order.deliveryDate = new Date();
    order.outForDelivery.status = 'delivered';

    const returned = order.returnAmount;
    const margin = order.margin;
    await order.save();

    if (order.buyerId) {
      await Buyer.findByIdAndUpdate(order.buyerId, {
        $inc: { totalEarning: margin, dueAmount: returned }
      });
    }

    // Update stock
    const stockKey = {
      brand: order.brand,
      deviceName: order.deviceName,
      variant: order.variant,
      color: order.color
    };

    const stockDoc = await Stock.findOne(stockKey);
    if (stockDoc) {
      stockDoc.availableCount += 1;
      await stockDoc.save();
    } else {
      await Stock.create({
        ...stockKey,
        availableCount: 1,
        soldCount: 0,
        soldAt: [],
        bookingAmount: order.bookingAmount || 0,
        bookingAmountSeller: order.bookingAmountSeller || 0,
        returnAmount: order.returnAmount || 0,
        imageUrl: order.imageUrl || ''
      });
    }

    return res.status(200).json({ message: 'Order marked as delivered and stock updated' });

  } catch (err) {
    console.error('Error in markDelivered:', err);
    return res.status(500).json({ message: 'Internal server error while marking delivered.' });
  }
};













exports.getBuyerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const selectedMonth = req.query.month || '';

    const buyer = await Buyer.findById(id).lean();
    if (!buyer) {
      return res.status(404).render('error/404', { msg: 'Buyer not found' });
    }

    let monthStart = null, monthEnd = null;
    if (selectedMonth) {
      const [monthName, year] = selectedMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      monthStart = new Date(year, monthIndex, 1);
      monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    }

    let deliveredOrders = await Order.find({
      buyerId: buyer._id,
      status: 'delivered',
    }).lean();

    let outForDeliveryOrders = await Order.find({
      buyerId: buyer._id,
      status: 'out-for-delivery',
    }).lean();

    if (selectedMonth) {
      deliveredOrders = deliveredOrders.filter(order => {
        const date = new Date(order.createdAt);
        return date >= monthStart && date <= monthEnd;
      });

      outForDeliveryOrders = outForDeliveryOrders.filter(order => {
        const date = new Date(order.createdAt);
        return date >= monthStart && date <= monthEnd;
      });
    }

    const transformedOrders = deliveredOrders.map(order => {
      const date = new Date(order.deliveryDate);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;
      return {
        brand: order.brand || 'N/A',
        deviceName: order.deviceName,
        variant: order.variant || 'N/A',
        color: order.color || 'N/A',
        deliveryDate: formattedDate,
        colorCode: order.colorCode || '#007bff',
      };
    });

    const brandCountMap = {};
    [...deliveredOrders, ...outForDeliveryOrders].forEach(order => {
      brandCountMap[order.brand] = (brandCountMap[order.brand] || 0) + 1;
    });

    const outForDeliveryMap = {};
    outForDeliveryOrders.forEach(order => {
      outForDeliveryMap[order.brand] = (outForDeliveryMap[order.brand] || 0) + 1;
    });

    const barChartLabels = Object.keys(brandCountMap);
    const barChartData = Object.values(brandCountMap);
    const pieChartLabels = Object.keys(outForDeliveryMap);
    const pieChartData = Object.values(outForDeliveryMap);

    const now = new Date();
    const monthOptions = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    });

    res.render('admin/buyerDetails', {
      buyer: { ...buyer, orders: transformedOrders },
      monthOptions,
      selectedMonth,
      barChartLabels,
      barChartData,
      pieChartLabels,
      pieChartData
    });

  } catch (error) {
    console.error(error);
    res.status(500).render('error/500', { msg: 'Error loading buyer details.' });
  }
};






















exports.getSellerDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const selectedMonth = req.query.month || '';

    const seller = await Seller.findById(sellerId).lean();
    if (!seller) {
      return res.status(404).render('error/404', { msg: 'Seller not found' });
    }

    let monthStart = null, monthEnd = null;
    if (selectedMonth) {
      const [monthName, year] = selectedMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      monthStart = new Date(year, monthIndex, 1);
      monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    }

    let allOrders = await Order.find({
      sellerId,
      status: { $in: ['sold', 'out-for-delivery'] }
    }).lean();

    if (selectedMonth) {
      allOrders = allOrders.filter(order => {
        const date = new Date(order.createdAt);
        return date >= monthStart && date <= monthEnd;
      });
    }

    const soldOrders = allOrders.filter(order => order.status === 'sold');
    const outForDeliveryOrders = allOrders.filter(order =>
      order.status === 'out-for-delivery' && !order.buyerId
    );

    const devices = [...soldOrders, ...outForDeliveryOrders].map(order => ({
      name: order.deviceName || 'N/A',
      variant: order.variant || 'N/A',
      color: order.color || 'N/A',
      brand: order.brand || 'Unknown',
      quantitySold: 1,
      bookingAmount: order.bookingAmount,
      borderColor: order.colorCode || '#007bff',
      status: order.status,
      orderId: order._id,
      orderDate: order.createdAt.toDateString(),
      isOutForDelivery: order.status === 'out-for-delivery',
      sellerId: order.sellerId
    }));

    const pieChartMap = {};
    const barChartMap = {};

    outForDeliveryOrders.forEach(order => {
      pieChartMap[order.deviceName] = (pieChartMap[order.deviceName] || 0) + 1;
    });

    soldOrders.forEach(order => {
      barChartMap[order.deviceName] = (barChartMap[order.deviceName] || 0) + 1;
    });

    const pieChartLabels = Object.keys(pieChartMap);
    const pieChartData = Object.values(pieChartMap);
    const barChartLabels = Object.keys(barChartMap);
    const barChartData = Object.values(barChartMap);

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
      return { value: label, label };
    });

    res.render('admin/sellerDetails', {
      seller,
      selectedMonth,
      months,
      devices,
      orders: devices,
      pieChartLabels,
      pieChartData,
      barChartLabels,
      barChartData
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Error loading seller details.' });
  }
};






exports.getBuyerPaymentDetails = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await Buyer.findById(buyerId);
    if (!buyer) return res.status(404).render('error/404', { msg: 'Buyer not found' });

    const payments = await Payment.find({
      toId: buyerId,
      toRole: 'buyer'
    }).sort({ date: -1 });

    const totalPayment = payments.reduce((sum, txn) => sum + txn.amount, 0);
    const totalDue = buyer.dueAmount || 0;

    res.render('admin/buyer-payment-details', {
      buyer,
      totalPayment,
      totalDue,
      payments
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Error fetching buyer payment details' });
  }
};
















exports.getSellerPaymentDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).render('error/404', { msg: 'Seller not found' });

    const payments = await Payment.find({
      toId: sellerId,
      role: 'Seller'
    }).sort({ date: -1 });

    const totalReceived = payments.reduce((sum, txn) => sum + txn.amount, 0);
    const totalAdvance = seller.advance || 0;

    res.render('admin/seller-payment', {
      seller,
      totalReceived,
      totalAdvance,
      payments
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500', { msg: 'Error fetching seller payment details' });
  }
};















exports.renderDealsPage = async (req, res) => {
  try {
    res.render('admin/createDeal');
  } catch (err) {
    console.error('Failed to render deals page:', err);
    res.status(500).render('error/500', { msg: 'Failed to load create deal page' });
  }
};

exports.createDeal = async (req, res) => {
try {
    const {
      brand,
      modelName,
      variant,
      color,
      modelImage,
      buyLink,
      bookingAmount,
      returnAmount,
      margin,
      pincode,
      address,
      cardWorking,
      status
    } = req.body;

    const newDeal = new Deal({
      deviceName: modelName, // mapped
      brand,
      variant,
      color,
      imageUrl: modelImage, // mapped
      buyLink,
      bookingAmount: Number(bookingAmount), // string → number
      returnAmount: Number(returnAmount),
      margin: Number(margin),
      pincode,
      address,
      cardWorking,
      status: status === 'on' ? 'active' : 'inactive',
      createdBy: req.user?._id || null // if using auth, populate from token/session
    });

    await newDeal.save();
res.redirect('/admin/dashboard');  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



exports.postPayment = async (req, res) => {
  try {
    const user = req.user;
    const fromRole = user.role;
    const fromId = user._id;
    const { toRole, toId, receivedFromName, amount, mode } = req.body;

    if ((fromRole === 'admin' && toRole !== 'buyer') || (fromRole === 'seller' && toRole !== 'admin')) {
      req.flash('error', 'Invalid payment direction.');
      return res.redirect('back');
    }

    if (!req.file) {
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
      await Seller.findByIdAndUpdate(fromId, { $inc: { advance: -paymentAmount } });
    } else if (fromRole === 'admin' && toRole === 'buyer') {
      await Buyer.findByIdAndUpdate(toId, { $inc: { dueAmount: -paymentAmount } });
    }

    req.flash('success', '✅ Payment submitted successfully.');
    res.redirect(`/admin/buyer-payment/${toId}`);
  } catch (err) {
    console.error("🔥 Payment Processing Error:", err);
    res.status(500).render('error/500', { msg: 'Failed to save payment.' });
  }
};

exports.renderAddPayment = (req, res) => {
  const buyerId = req.query.buyerId;
  const sellerId = req.query.sellerId;

  if (!buyerId && !sellerId) {
    return res.status(400).render('error/404', { msg: 'Buyer or Seller ID is required.' });
  }

  res.render('admin/addpayment', {
    buyerId,
    sellerId,
    adminId: req.user.id
  });
};

// RENDER STOCK PAGE
exports.rendersellerdealsPage = async (req, res) => {
  try {
    console.log('📦 Fetching all stocks from DB...');
    const allStocks = await Stock.find();
    console.log('✅ All stocks fetched:', allStocks.length);

    const modelMap = new Map();

    for (const stock of allStocks) {
      const key = `${stock.brand}|${stock.deviceName}|${stock.variant}|${stock.color}`;
      console.log('🔍 Processing stock key:', key);

      if (!modelMap.has(key)) {
        console.log('🆕 Adding to modelMap:', {
          brand: stock.brand,
          deviceName: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          imageUrl: stock.imageUrl,
          returnAmount: stock.returnAmount,
          bookingAmountSeller: stock.bookingAmountSeller,
          deal: stock.deal,
          _id: stock._id
        });

        modelMap.set(key, {
          brand: stock.brand,
          deviceName: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          imageUrl: stock.imageUrl,
          returnAmount: stock.returnAmount,
          bookingAmountSeller: stock.bookingAmountSeller,
          deal: stock.deal,
          _id: stock._id
        });
      } else {
        console.log('⚠️ Duplicate model key skipped:', key);
      }
    }
   
    const products = Array.from(modelMap.values());
    console.log('📦 Final products being rendered:', products);

    console.log('📦 Final grouped products to render:', products.length);
    res.render('admin/sellerdeals', { products });
  } catch (err) {
    console.error('❌ Error loading seller deals:', err);
    res.status(500).render('error/500', { msg: 'Error loading seller deals' });
  }
};

exports.activateDeal = async (req, res) => {
  try {
    const { stockId, deal, bookingAmountSeller } = req.body;

    // Validate input
    if (!stockId) return res.status(400).json({ error: 'Stock ID is required' });

    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    stock.deal = deal;
    stock.bookingAmountSeller = bookingAmountSeller;
    await stock.save();

    return res.status(200).json({ message: `Stock deal ${deal ? 'activated' : 'deactivated'} successfully.` });
  } catch (err) {
    console.error('❌ Toggle deal error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};




exports.updateOrdersToSold = async (req, res) => {
  try {
    const { sellerId, buyerId } = req.query;
    const { bookingAmountSeller } = req.body;
    const fromRole = req.user.role;

    if (!bookingAmountSeller || (!sellerId && !buyerId)) {
      return res.status(400).render('error/404', { msg: "Missing bookingAmountSeller or sellerId/buyerId" });
    }

    const query = sellerId
      ? { sellerId, status: "out-for-delivery" }
      : { buyerId, status: "out-for-delivery" };

    const orders = await Order.find(query);

    if (orders.length === 0) {
      return res.status(404).render('error/404', { msg: "No matching orders found." });
    }

    const bookingAmount = parseInt(bookingAmountSeller);
    const total = bookingAmount * orders.length;

    for (let order of orders) {
      order.status = 'sold';
      order.bookingAmountSeller = bookingAmount;
      order.margin = (order.returnAmount || 0) - bookingAmount;
      await order.save();

      const stock = await Stock.findOne({
        deviceName: order.deviceName,
        variant: order.variant,
        color: order.color
      });

      if (stock) {
        stock.availableCount = Math.max(0, stock.availableCount - 1);
        stock.soldCount += 1;
        stock.soldAt.push({
          date: new Date(),
          orderId: order._id,
          sellerId: order.sellerId
        });
        await stock.save();
      } else {
        console.warn(`⚠️ No stock found for order ID: ${order._id}`);
      }
    }

    if (fromRole === 'seller') {
      await Seller.findByIdAndUpdate(sellerId, { $inc: { advance: total } });
    } else if (fromRole === 'admin' && buyerId) {
      await Buyer.findByIdAndUpdate(buyerId, { $inc: { due: -total } });
    }

    const redirectPath = sellerId
      ? `/admin/sellers-details/${sellerId}`
      : `/admin/buyer-details/${buyerId}`;

    req.flash('success', '✅ Orders updated to SOLD successfully');
    res.redirect(redirectPath);
  } catch (err) {
    console.error("🔥 Error updating orders to sold:", err);
    res.status(500).render('error/500', { msg: "Failed to update orders" });
  }
};
