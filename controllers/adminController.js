const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Payment = require('../models/Payment');
const Deal = require('../models/Deal');
const moment = require('moment');
const sendWhatsApp = require('../utils/whatsapp');
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
    const pendingOrderCount = allOrders.filter(o => o.status === 'pending').length;

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
      const device = stock.deviceName || 'Unknown Device';
      const label = `${brand} - ${device}`;

      soldBrandCount[label] = (soldBrandCount[label] || 0) + stock.soldCount;
      availableBrandCount[label] = (availableBrandCount[label] || 0) + stock.availableCount;
    });

    const barChartData = Array.from(new Set([
      ...Object.keys(soldBrandCount),
      ...Object.keys(availableBrandCount)
    ])).map(label => ({
      label,
      sold: soldBrandCount[label] || 0,
      available: availableBrandCount[label] || 0
    }));

    // 🔥 Make the value available globally in EJS (for this render only)
    res.locals.pendingOrderCount = pendingOrderCount;

    res.render('admin/dashboard', {
      totalOrders,
      soldStock,
      availableStock,
      buyerCount,
      sellerCount,
      totalOrderValue,
      totalDue,
      outForDeliveryCount,
      soldBrandData: Object.entries(soldBrandCount).map(([label, count]) => ({ label, count })),
      availableBrandData: Object.entries(availableBrandCount).map(([label, count]) => ({ label, count })),
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

    // ✅ Brand + Model wise sold
    const soldBrandMap = {};
    for (let item of ordersList) {
      const key = `${item.brand} - ${item.model}`;
      soldBrandMap[key] = (soldBrandMap[key] || 0) + item.sold;
    }
    const soldBrandData = Object.entries(soldBrandMap).map(([brand, count]) => ({ brand, count }));

    // ✅ Brand + Model wise available
    const availableBrandMap = {};
    for (let item of ordersList) {
      const key = `${item.brand} - ${item.model}`;
      availableBrandMap[key] = (availableBrandMap[key] || 0) + item.available;
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
    const brandDeviceWiseSold = {}; // 🔄 changed to brand + device

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

        const label = `${stock.brand} - ${stock.deviceName}`;
        brandDeviceWiseSold[label] = (brandDeviceWiseSold[label] || 0) + 1;
      }
    }

    res.render('admin/soldDevice', {
      soldDevices: Array.from(deviceMap.values()),
      brandBarLabels: Object.keys(brandDeviceWiseSold),
      brandBarData: Object.values(brandDeviceWiseSold),
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
    console.log('📦 Fetching all stock entries from DB...');
    const allStocks = await Stock.find().lean();
    console.log(`✅ Total stocks fetched: ${allStocks.length}`);

    const stockMap = new Map();
    const labelTotals = {}; // Now label = brand + device

    for (let stock of allStocks) {
      const key = `${stock.brand}-${stock.deviceName}-${stock.variant}-${stock.color}`;
      const available = stock.availableCount || 0;

      console.log(`🔍 Processing: ${key}`);
      console.log(`   ➤ availableCount (raw): ${available}`);

      if (available <= 0) {
        console.log(`❌ Skipping ${key} - No available stock`);
        continue;
      }

      if (!stockMap.has(key)) {
        console.log(`🆕 Adding new key to stockMap: ${key}`);
        stockMap.set(key, {
          brand: stock.brand,
          model: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          quantity: 0
        });
      }

      stockMap.get(key).quantity += available;
      console.log(`   ➕ Updated quantity: ${stockMap.get(key).quantity}`);

      const label = `${stock.brand} - ${stock.deviceName}`;
      labelTotals[label] = (labelTotals[label] || 0) + available;
      console.log(`   🏷️ Label total so far: ${labelTotals[label]}`);
    }

    const stockDataArray = Array.from(stockMap.values());

    console.log('📊 Final grouped stock data:', stockDataArray);
    console.log('📈 Chart Labels:', Object.keys(labelTotals));
    console.log('📉 Chart Values:', Object.values(labelTotals));

    res.render('admin/availableStock', {
      stockData: stockDataArray,
      chartLabels: Object.keys(labelTotals),
      chartValues: Object.values(labelTotals)
    });

  } catch (err) {
    console.error('❌ Error in getAvailableStock:', err);
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

exports.getAllSellerPayments = async (req, res) => {
  try {
    const { filterDate, filterMonth, mode } = req.query;
    console.log("📥 Seller Filters:", { filterDate, filterMonth });

    // Always filter fromRole = seller
    const paymentFilter = { fromRole: 'seller' };

    // Apply date filter
    if (filterDate) {
      const start = new Date(filterDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(filterDate);
      end.setUTCHours(23, 59, 59, 999);
      paymentFilter.date = { $gte: start, $lte: end };
      console.log("📅 Date Filter:", start.toISOString(), '→', end.toISOString());
    }

    // Apply month filter
    else if (filterMonth) {
      const [monthName, year] = filterMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 1);
      paymentFilter.date = { $gte: start, $lt: end };
      console.log("🗓️ Month Filter:", start.toISOString(), '→', end.toISOString());
    }

    console.log("🔎 Final Seller Payment Filter:", paymentFilter);

    // Get matching payments
    const paymentDocs = await Payment.find(paymentFilter).sort({ date: -1 }).lean();
    console.log("📄 Payments Found:", paymentDocs.length);

    // Map payments and manually extract seller details from toId (or fromId if you use that)
    const payments = await Promise.all(
      paymentDocs.map(async (p) => {
        let seller = null;

        // Fetch seller if toId is ObjectId or populated
        const sellerId = typeof p.toId === 'object' && p.toId._id ? p.toId._id : p.toId;

        if (sellerId) {
          seller = await Seller.findById(sellerId).lean();
        }

        return {
          name: seller?.name || 'N/A',
          phone: seller?.mobile || 'N/A',
          amount: p.amount,
          mode: p.mode,
          proofImg: p.image,
          date: p.date ? new Date(p.date).toLocaleDateString() : 'N/A',
        };
      })
    );

    // Get total advance from all sellers
    const allSellers = await Seller.find().lean();
    const totalAdvance = allSellers.reduce((sum, s) => sum + (s.advance || 0), 0);

    // Month list
    const allSellerPayments = await Payment.find({ fromRole: 'seller' }).select('date').lean();
    const monthSet = new Set();
    allSellerPayments.forEach(p => {
      const d = new Date(p.date);
      const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthSet.add(monthYear);
    });
    const months = Array.from(monthSet).sort((a, b) => new Date(`1 ${a}`) - new Date(`1 ${b}`));

    // JSON response for AJAX
    if (req.headers.accept === 'application/json' || mode === 'json') {
      return res.json({ totalAdvance, payments });
    }

    // Render the page
    res.render('admin/paymentRecived', {
      payments,
      totalAdvance,
      filterDate,
      filterMonth,
      months,
    });

  } catch (err) {
    console.error('❌ Error in getAllSellerPayments:', err);
    res.status(500).render('error/500', { msg: 'Failed to load seller payments' });
  }
};



exports.getTotalPaymentDue = async (req, res) => {
  try {
    const { filterDate, filterMonth, mode } = req.query;

    console.log("🔍 Incoming Filters:", { filterDate, filterMonth });

    // 1. Total Due Amount
    const buyers = await Buyer.find().select('dueAmount').lean();
    const totalDue = buyers.reduce((acc, b) => acc + (b.dueAmount || 0), 0);
    console.log("💰 Total Due Amount:", totalDue);

    // 2. Payment Filter
    const paymentFilter = { fromRole: 'admin' };

    if (filterDate) {
      const start = new Date(filterDate);
      start.setUTCHours(0, 0, 0, 0); // Start of the day (UTC)
      const end = new Date(filterDate);
      end.setUTCHours(23, 59, 59, 999); // End of the day (UTC)
      paymentFilter.date = { $gte: start, $lte: end };

      console.log("📅 Filtering by date range:", start.toISOString(), '→', end.toISOString());
    } else if (filterMonth) {
      const [monthName, year] = filterMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 1);
      paymentFilter.date = { $gte: start, $lt: end };

      console.log("🗓️ Filtering by month range:", start.toISOString(), '→', end.toISOString());
    }

    console.log("🔎 Final Payment Filter:", paymentFilter);

    // 3. Get Filtered Payments
    const paymentDocs = await Payment.find(paymentFilter).sort({ date: -1 }).lean();
    console.log("🧾 Raw Payments Found:", paymentDocs.length);

    const payments = await Promise.all(paymentDocs.map(async p => {
      let buyer = null;
      if (p.toRole === 'buyer') {
        const buyerId = typeof p.toId === 'object' ? p.toId._id : p.toId;
        if (buyerId) {
          buyer = await Buyer.findById(buyerId).lean();
        }
      }

      return {
        _id: p._id.toString(),
        fromRole: p.fromRole,
        fromId: p.fromId,
        toRole: p.toRole,
        toId: p.toId,
        receivedFromName: p.receivedFromName,
        amount: p.amount,
        mode: p.mode,
        date: p.date ? p.date.toDateString() : 'N/A',
        proofImage: p.image,
        buyer: buyer ? {
          name: buyer.name || 'N/A',
          email: buyer.email || 'N/A',
          mobile: buyer.mobile || 'N/A'
        } : null
      };
    }));

    // 4. Build Filter Months
    const allAdminPayments = await Payment.find({ fromRole: 'admin' }).select('date').lean();
    const monthSet = new Set();
    allAdminPayments.forEach(p => {
      const d = new Date(p.date);
      const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthSet.add(monthYear);
    });

    const months = Array.from(monthSet).sort((a, b) => new Date(`1 ${a}`) - new Date(`1 ${b}`));

    // ✅ Conditional Response
    if (req.headers.accept === 'application/json' || mode === 'json') {
      return res.json({ totalDue, payments });
    }

    // Render EJS page
    res.render('admin/paymentDue', {
      totalDue,
      payments,
      months,
      filterDate,
      filterMonth
    });

  } catch (err) {
    console.error('❌ Error in getTotalPaymentDue:', err);
    if (req.headers.accept === 'application/json') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(500).render('error/500', { msg: 'Failed to load payments' });
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
      buyer:order.outForDelivery?.name,
      pincode: order.outForDelivery?.pincode || 'N/A',
      trackingId: order.outForDelivery?.tracking || 'N/A',
      otp: order.outForDelivery?.otp || 'N/A',
      delivered: order.outForDelivery?.status === 'delivered',
    }));
   

    const pendingCount = deliveries.length ;
   
    res.render('admin/ofd', {
      deliveries,
      
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

    // ✅ Group delivered orders
    const groupedMap = new Map();
    deliveredOrders.forEach(order => {
      const key = `${order.brand}|${order.deviceName}|${order.variant}|${order.color}`;
      const colorCode = order.colorCode || '#007bff';
      const image = order.imageUrl || '/images/default-phone.png';

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          brand: order.brand || 'N/A',
          deviceName: order.deviceName,
          variant: order.variant || 'N/A',
          color: order.color || 'N/A',
          colorCode,
          count: 1,
          image
        });
      } else {
        groupedMap.get(key).count += 1;
      }
    });

    const transformedOrders = Array.from(groupedMap.values());

    // ✅ Brand+Model wise chart data
    const brandCountMap = {};
    [...deliveredOrders, ...outForDeliveryOrders].forEach(order => {
      const key = `${order.brand} - ${order.deviceName}`;
      brandCountMap[key] = (brandCountMap[key] || 0) + 1;
    });

    const outForDeliveryMap = {};
    outForDeliveryOrders.forEach(order => {
      const key = `${order.brand} - ${order.deviceName}`;
      outForDeliveryMap[key] = (outForDeliveryMap[key] || 0) + 1;
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

    // Separate grouping for sold and out-for-delivery
   const groupByStatus = (orders, status) => {
  const map = new Map();

  for (const order of orders.filter(o => o.status === status)) {
    const key = `${order.brand}-${order.deviceName}-${order.variant}-${order.color}`;

    if (!map.has(key)) {
      map.set(key, {
        name: order.deviceName || 'N/A',
        variant: order.variant || 'N/A',
        color: order.color || 'N/A',
        brand: order.brand || 'Unknown',
        bookingAmounts: [order.bookingAmount || 0],
        bookingAmountsBuyer: [order.bookingAmount || 0],
        bookingAmountsSeller: [order.bookingAmountSeller || 0], // ✅ properly initialized
        image: order.imageUrl || '/images/default-phone.png',
        borderColor: order.colorCode || '#007bff',
        status: order.status,
        orderDate: new Date(order.createdAt).toDateString(),
        sellerId: order.sellerId,
        count: 1
      });
    } else {
      const existing = map.get(key);
      existing.count += 1;
      existing.bookingAmounts.push(order.bookingAmount || 0);
      existing.bookingAmountsBuyer.push(order.bookingAmount || 0);
      existing.bookingAmountsSeller.push(order.bookingAmountSeller || 0); // ✅ safe push
    }
  }

  return Array.from(map.values()).map(device => ({
    ...device,
    bookingAmount: (device.bookingAmounts || []).reduce((sum, amt) => sum + amt, 0),
    bookingAmountSeller: (device.bookingAmountsSeller || []).reduce((sum, amt) => sum + amt, 0)
  }));
};


    const soldDevices = groupByStatus(allOrders, 'sold');
    const outForDeliveryDevices = groupByStatus(allOrders, 'out-for-delivery');

    // Chart Logic
    const pieChartMap = {};
    const barChartMap = {};

    allOrders.forEach(order => {
      const key = `${order.brand} - ${order.deviceName}`;
      if (order.status === 'out-for-delivery') {
        pieChartMap[key] = (pieChartMap[key] || 0) + 1;
      } else if (order.status === 'sold') {
        barChartMap[key] = (barChartMap[key] || 0) + 1;
      }
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
      soldDevices,
      outForDeliveryDevices,
      pieChartLabels,
      pieChartData,
      barChartLabels,
      barChartData
    });

 } catch (err) {
  console.error(err); // 🔍 Check what this says
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
     console.log(sellerId);
    const payments = await Payment.find({
      fromId: sellerId,
      fromRole: 'seller'
    }).sort({ date: -1 });

    const totalReceived = payments.reduce((sum, txn) => sum + txn.amount, 0);
    const totalAdvance = seller.advance || 0;
    console.log(payments);
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
    const allDeals = await Deal.find().populate('buyerIds', 'name email').lean();

    const allBuyers = await Buyer.find().lean();
    res.render('admin/createDeal', { deals: allDeals, buyers: allBuyers });
  } catch (err) {
    console.error('Failed to render deals page:', err);
    res.status(500).render('error/500', { msg: 'Failed to load create deal page' });
  }
};


exports.toggleDealStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const quantityToAdd = req.body?.quantityToAdd;

    const deal = await Deal.findById(id);
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });

    // Add quantity if passed
    if (quantityToAdd !== undefined) {
      const qty = parseInt(quantityToAdd);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid quantity' });
      }

      if (deal.quantity === 'unlimited') {
        return res.status(400).json({ success: false, message: 'Cannot add to unlimited quantity' });
      }

      deal.quantity = (deal.quantity || 0) + qty;
    }

    const isActivating = deal.status === 'inactive';
    if (isActivating && deal.quantity !== 'unlimited' && (deal.quantity === 0 || deal.quantity === '0')) {
      return res.status(400).json({ success: false, message: 'Cannot activate deal with 0 quantity' });
    }

    deal.status = isActivating ? 'active' : 'inactive';
    await deal.save();

    res.json({ success: true, newStatus: deal.status });
  } catch (err) {
    console.error('Failed to toggle deal status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};








exports.createDeal = async (req, res) => {
  console.log("📩 Raw Request Body:", req.body);
  try {
    const {
      brand, modelName, variant, color,
      modelImage, buyLink, bookingAmount, returnAmount, margin,
      pincode, address, cardWorking, status,
      sendToAll, buyerIds, allBuyerQty, buyerQuantities, unlimitedCheckbox
    } = req.body;

    const sendToAllFinal = sendToAll === 'true' || (!buyerIds && !sendToAll);
    console.log("🟠 Final sendToAll value:", sendToAllFinal);

    let assignedBuyers = [];
    if (sendToAllFinal) {
      assignedBuyers = [];
      console.log("✅ 'Send to all' selected. Will send to all buyers.");
    } else if (buyerIds) {
      assignedBuyers = Array.isArray(buyerIds) ? buyerIds : [buyerIds];
      console.log("✅ Specific buyers selected:", assignedBuyers);
    }

    // Handle quantity
    let finalQuantity = 'unlimited';
    if (unlimitedCheckbox !== 'on') {
      if (sendToAllFinal && allBuyerQty) {
        finalQuantity = parseInt(allBuyerQty);
      } else {
        finalQuantity = null; // Don't store in deal
      }
    }

    const dealData = {
      deviceName: modelName,
      brand,
      variant,
      color,
      imageUrl: modelImage,
      buyLink,
      bookingAmount: Number(bookingAmount),
      returnAmount: Number(returnAmount),
      margin: Number(margin),
      pincode,
      address,
      cardWorking,
      status: status === 'on' ? 'active' : 'inactive',
      buyerIds: assignedBuyers,
      quantity: finalQuantity,
      createdBy: req.user?._id || null
    };

    console.log("📝 Deal to be saved:", dealData);
    const newDeal = new Deal(dealData);
    await newDeal.save();
    console.log("✅ Deal saved to DB");

    // Save buyer-quantity mapping in Buyer schema if not sendToAll
    if (!sendToAllFinal && Array.isArray(buyerIds) && Array.isArray(buyerQuantities)) {
      for (let i = 0; i < buyerIds.length; i++) {
        const buyerId = buyerIds[i];
        const qty = parseInt(buyerQuantities[i]);

        if (!isNaN(qty) && qty > 0) {
          await Buyer.updateOne(
            { _id: buyerId },
            {
              $push: {
                dealQuantities: {
                  dealId: newDeal._id,
                  quantity: qty
                }
              }
            }
          );

          console.log(`🧾 Quantity ${qty} saved for buyer ${buyerId} in deal ${newDeal._id}`);
        }
      }
    }

    // Send WhatsApp notifications
    let buyersToNotify = [];
    if (sendToAllFinal) {
      buyersToNotify = await Buyer.find({}, 'mobile name').lean();
      console.log(`📨 Found ${buyersToNotify.length} buyers (ALL)`);
    } else if (assignedBuyers.length > 0) {
      buyersToNotify = await Buyer.find({ _id: { $in: assignedBuyers } }, 'mobile name').lean();
      console.log(`📨 Found ${buyersToNotify.length} buyers (SELECTED)`);
    }

    const message =
      `📢 *New Deal!*\n\n` +
      `📱 *${brand} ${modelName}*\n` +
      `🎨 Variant: *${variant}* | Color: *${color}*\n` +
      `💰 Booking: ₹${bookingAmount}\n\n` +
      `🌐 Visit us: https://gyanibabastore.in`;

    for (const buyer of buyersToNotify) {
      if (buyer.mobile) {
        console.log(`📞 Sending WhatsApp to ${buyer.name || 'Unnamed'} (${buyer.mobile})`);
        try {
          await sendWhatsApp(
            buyer.mobile,
            message,
            modelImage,
            'Buy Now',
            buyLink || 'https://gyanibabastore.in'
          );
          console.log(`✅ Sent to ${buyer.mobile}`);
        } catch (err) {
          console.warn(`❌ WhatsApp error for ${buyer.mobile}:`, err.message);
        }
      }
    }

    console.log("✅ All WhatsApp messages processed");
    res.redirect('/admin/deals');
  } catch (err) {
    console.error("❌ Error in createDeal:", err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};






exports.postPayment = async (req, res) => {
  try {
    const user = req.user;

    const fromRole = "admin"; // ✅ Normalize
    const fromId = user._id;
    const { toRole, toId, receivedFromName, amount, mode } = req.body;
    
    // ✅ Validate roles
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
      await Buyer.findByIdAndUpdate(toId, { $inc: { dueAmount: -paymentAmount } }); // ✅ matches schema
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
    let totalAvailableCount = 0;

    for (const stock of allStocks) {
      const key = `${stock.brand}|${stock.deviceName}|${stock.variant}|${stock.color}`;
      const availableCount = stock.availableCount || 0;
      totalAvailableCount += availableCount;

      if (!modelMap.has(key)) {
        modelMap.set(key, {
          brand: stock.brand,
          deviceName: stock.deviceName,
          variant: stock.variant,
          color: stock.color,
          imageUrl: stock.imageUrl,
          returnAmount: stock.returnAmount,
          bookingAmountSeller: stock.bookingAmountSeller,
          deal: stock.deal,
          _id: stock._id,
          availableCount: availableCount // ✅ initialize
        });
      } else {
        // ✅ aggregate availableCount if duplicate group
        const existing = modelMap.get(key);
        existing.availableCount += availableCount;
      }
    }

    const products = Array.from(modelMap.values());
    console.log('📦 Grouped products:', products.length);
    console.log('📊 Total Available Count (all):', totalAvailableCount);

    res.render('admin/sellerdeals', { products, totalAvailableCount });
  } catch (err) {
    console.error('❌ Error loading seller deals:', err);
    res.status(500).render('error/500', { msg: 'Error loading seller deals' });
  }
};


exports.activateDeal = async (req, res) => {
  try {
    const { stockId, deal, bookingAmountSeller } = req.body;

    if (!stockId) return res.status(400).json({ error: 'Stock ID is required' });

    const stock = await Stock.findById(stockId);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    if (deal && stock.availableCount === 0) {
      return res.status(400).json({ error: 'Cannot activate deal — Stock is zero.' });
    }

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
  console.log("hiii you entered");
  try {
    const { sellerId } = req.query;
    const { bookingAmountSeller, customCount, brand, deviceName, variant, color, bookingAmountBuyer } = req.body;

    console.log("kart body", req.body);
    console.log("sellerId", sellerId);

    if (!sellerId || !bookingAmountSeller || !bookingAmountBuyer || !customCount || !brand || !deviceName || !variant || !color) {
      console.warn("❌ Missing required fields");
      return res.status(400).render('error/404', { msg: "Missing required fields" });
    }

    const limit = parseInt(customCount);
    const bookingSellerAmt = parseInt(bookingAmountSeller);
    const bookingBuyerAmt = parseInt(bookingAmountBuyer);

    const orders = await Order.find({
      sellerId,
      status: 'out-for-delivery',
      brand,
      deviceName,
      variant,
      color
    }).sort({ createdAt: 1 }).limit(limit);

    if (!orders.length) {
      console.warn("❌ No matching out-for-delivery orders for seller:", sellerId);
      return res.status(404).render('error/404', { msg: "No pending orders found for seller" });
    }

    const marginPerUnit = bookingSellerAmt - bookingBuyerAmt;
    const totalEarning = marginPerUnit * limit;

    for (const order of orders) {
      const stock = await Stock.findOne({
        brand: order.brand,
        deviceName: order.deviceName,
        variant: order.variant,
        color: order.color
      });

      order.status = 'sold';
      order.bookingAmountSeller = bookingSellerAmt;
      order.margin = marginPerUnit;
      await order.save();

      if (stock) {
        stock.soldCount += 1;
        stock.soldAt.push({ date: new Date(), orderId: order._id, sellerId });
        await stock.save();
      }
    }

    await Seller.findByIdAndUpdate(sellerId, {
      $inc: {
        earning: totalEarning,
        advance: bookingSellerAmt * limit // ✅ Add total amount to advance
      }
    });

    console.log(`✅ Total margin (earning) added for seller ${sellerId}: ₹${totalEarning}`);
    req.flash('success', `✅ Orders marked as sold. Earning: ₹${totalEarning}`);
    res.redirect(`/admin/sellers-details/${sellerId}`);

  } catch (err) {
    console.error("🔥 Error in updateOrdersToSold:", err);
    res.status(500).render('error/500', { msg: 'Error updating orders to sold.' });
  }
};











// Show all pending orders (based on status or flag)
exports.getPendingDeals = async (req, res) => {
  try {
    const pendingOrders = await Order.aggregate([
      {
        $match: { status: 'pending' }
      },
      {
        $lookup: {
          from: 'buyers',
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyerInfo'
        }
      },
      {
        $unwind: '$buyerInfo'
      },
      {
        $group: {
          _id: {
            buyerName: '$buyerInfo.name',
            brand: '$brand',
            deviceName: '$deviceName',
            variant: '$variant',
            color: '$color'
          },
          totalOrders: {
            $sum: {
              $cond: [
                { $ifNull: ['$quantity', false] },
                '$quantity',
                1
              ]
            }
          },
          buyers: { $addToSet: '$buyerInfo.name' }
        }
      },
      {
        $sort: { '_id.buyerName': 1 }
      }
    ]);

    res.render('admin/pendingOrders', {
      groupedOrders: pendingOrders
    });

  } catch (err) {
    console.error('❌ Error in getPendingDeals:', err);
    res.status(500).render('error/500', {
      msg: 'Server error while fetching pending orders.'
    });
  }
};
