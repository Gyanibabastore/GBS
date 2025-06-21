const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleRedirect');
const upload = require('../middleware/upload'); // <-- imported multer config

router.get('/dashboard', protect, isAdmin, adminController.getDashboard);

// Cards' target routes
router.get('/orders', protect, isAdmin, adminController.getTotalOrders);
router.get('/sold-devices', protect, isAdmin, adminController.getSoldDevices);
router.get('/stock', protect, isAdmin, adminController.getAvailableStock);
router.get('/buyers', protect, isAdmin, adminController.getAllBuyers);
router.get('/sellers', protect, isAdmin, adminController.getAllSellers);
router.get('/payments', protect, isAdmin, adminController.getAllSellerPayments);
router.get('/dues', protect, isAdmin, adminController.getTotalPaymentDue);
router.get('/ofd', protect, isAdmin, adminController.getAllDeliveries);
router.post('/ofd/delivered', protect, isAdmin, adminController.markDelivered);
router.get('/buyer-details/:buyerId', protect, isAdmin, adminController.getBuyerDetails);
router.get('/sellers-details/:sellerId', protect, isAdmin, adminController.getSellerDetails);
router.get('/buyer-payment/:buyerId', protect, isAdmin, adminController.getBuyerPaymentDetails);
router.get('/seller-payment/:sellerId', protect, isAdmin, adminController.getSellerPaymentDetails);
router.get('/deals', protect, isAdmin, adminController.renderDealsPage);
router.get('/sellerdeals', protect, isAdmin, adminController.rendersellerdealsPage);
// router.post('/deal/toggle', protect,isAdmin,adminController.toggleDealStatus);

router.post('/deal/activate', protect,isAdmin,adminController.activateDeal);
// Payment routes
router.get('/addpayment', protect, isAdmin, adminController.renderAddPayment);
router.post('/:id/payments', protect, isAdmin, (req, res, next) => {
  req.folderName = 'payment_proofs';
  next();
}, upload.single('image'),adminController.postPayment);

// Deal creation
router.post('/deals/create', protect, isAdmin, adminController.createDeal);
router.post('/orders/mark-sold',protect,isAdmin,adminController.updateOrdersToSold);
module.exports = router;
