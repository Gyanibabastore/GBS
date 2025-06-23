const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const blocker = require('../middleware/blocker'); // ✅ add blocker

// Signup OTP
router.get('/signup', authController.renderSignupPage);
router.post('/send-otp', blocker, authController.sendOtp);
router.post('/verify-otp', blocker, authController.verifyOtp);
router.post('/signup', blocker, authController.signup);

// Login OTP
router.get('/login', authController.login);
router.post('/login/send-otp', blocker, authController.sendLoginOtp);
router.post('/login/verify-otp', blocker, authController.verifyLoginOtp);

// Forgot Password OTP
router.get('/forgot', authController.forgotPasswordPage);
router.post('/forgot/send-otp', blocker, authController.sendForgotOtp);
router.post('/forgot/verify-otp', blocker, authController.verifyForgotOtp);
router.post('/forgot/reset-password', blocker, authController.resetPassword);

// admin login
router.get('/admin/login', authController.adminlogin);
router.post('/admin/login', authController.adminlogincontroller);
//logout
router.get('/buyer/logout', authController.buyerlogout);

router.get('/admin/logout', authController.adminlogout);

module.exports = router;
