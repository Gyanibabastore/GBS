const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isBuyer } = require('../middleware/roleRedirect');
const buyerController = require('../controllers/buyerController');

// Dashboard Route
router.get('/dashboard/:buyerId', protect, isBuyer, buyerController.getBuyerDashboard);

// Orders Page Route – Secure with token and buyer role
router.get('/:buyerId/orders', protect, isBuyer, buyerController.getBuyerOrders);

router.get('/out-for-delivery', protect, isBuyer, buyerController.getOutForDelivery);
router.post('/out-for-delivery', protect, isBuyer, buyerController.postOutForDelivery);

// GET all devices and pending orders for buyer
router.get('/manage-orders/:buyerId', protect, isBuyer, buyerController.getManageOrders);
router.post('/:buyerId/orders', protect, isBuyer, buyerController.updateBuyerOrder);

router.get('/deals', protect, isBuyer, buyerController.getDeals);
router.get('/payment-history', protect, isBuyer, buyerController.getPaymentHistory);

router.get('/:buyerId/profile/', buyerController.getProfile);

// Edit Profile (with OTP verification step before update)
router.get('/:buyerId/profile/edit', buyerController.editProfileForm);
router.post('/:buyerId/profile/edit', buyerController.updateProfile);
// Send OTP before Edit


module.exports = router;
