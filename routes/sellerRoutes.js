const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { isSeller } = require('../middleware/roleRedirect');
// const upload = require('../utils/multerConfig'); // <-- imported multer config
const upload = require('../middleware/upload');
router.get('/dashboard/:sellerId', protect, isSeller, sellerController.getSellerDashboard);
router.post('/order', protect, isSeller, sellerController.placeSellerOrder);
 router.get('/addpayment', protect, isSeller, sellerController.renderAddPayment);
 router.post('/:id/payments', protect, isSeller, (req, res, next) => {
  req.folderName = 'payment_proofs';
  next();
},upload.single('image'), sellerController.postPayment);
module.exports = router;
