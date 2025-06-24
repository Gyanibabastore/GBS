const otpUtils = require('../utils/otp');
const tokenUtils = require('../utils/token');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
let otpStore = {};          // Signup OTP
let loginOtpStore = {};     // Login OTP
let forgotOtpStore = {};    // Forgot OTP

// Render Signup Page
exports.renderSignupPage = (req, res) => {
  res.render('auth/signup');
};

// Send Signup OTP
exports.sendOtp = async (req, res) => {
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const exists = await (role === 'buyer' ? Buyer : Seller).findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: `${role} already exists` });

    const otp = otpUtils.generateOtp();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    await otpUtils.sendOtpEmail(email, otp, name, role);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify Signup OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ verified: false, message: 'Invalid or expired OTP' });
  }

  delete otpStore[email];
  const token = tokenUtils.generateToken({ email });
  res.json({ verified: true, token });
};

// Signup User
exports.signup = async (req, res) => {
  const { role, name, email, mobile, shopName, upi, password } = req.body;
  if (!role || !email || !password || !name || !mobile || !upi)
    return res.status(400).send('Missing required fields');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;

    if (role === 'buyer') {
      newUser = await Buyer.create({ name, email, mobile, upi, password: hashedPassword, role });
    } else if (role === 'seller') {
      if (!shopName) return res.status(400).send('Shop name required');
      newUser = await Seller.create({ name, email, mobile, upi, shopName, password: hashedPassword, role });
    } else {
      return res.status(400).send('Invalid role');
    }

    const token = tokenUtils.generateToken({ id: newUser._id, email, role });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000
    });

    return res.redirect(`/${role}/dashboard/${newUser._id}`);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Signup failed');
  }
};

// Render Login Page
exports.login = (req, res) => {
  res.render('auth/login');
};

// Send Login OTP
exports.sendLoginOtp = async (req, res) => {
  const { email, role, password } = req.body;
  if (!email || !role || !password)
    return res.status(400).json({ success: false, message: 'Email, role, password required' });

  try {
    const user = await (role === 'buyer' ? Buyer : Seller).findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: `No ${role} found` });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid password' });

    const otp = otpUtils.generateOtp();
    loginOtpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    await otpUtils.sendLoginOtpEmail(email, otp, user.name, role);
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// Verify Login OTP
exports.verifyLoginOtp = async (req, res) => {
  const { email, otp, role } = req.body;
  const record = loginOtpStore[email];

  if (!record || record.otp !== otp || Date.now() > record.expires)
    return res.status(400).json({ verified: false, message: 'Invalid or expired OTP' });

  delete loginOtpStore[email];

  const user = await (role === 'buyer' ? Buyer : Seller).findOne({ email });
  if (!user) return res.status(404).json({ verified: false, message: 'User not found' });

  const token = tokenUtils.generateToken({ id: user._id, email, role });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000
  });

  res.status(200).json({ verified: true, token, userId: user._id, role });
};

// Render Forgot Page
exports.forgotPasswordPage = (req, res) => {
  res.render('auth/forgot');
};

// Send Forgot OTP
exports.sendForgotOtp = async (req, res) => {
  const { email, role } = req.body;
  const user = await (role === 'buyer' ? Buyer : Seller).findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: `No ${role} found` });

  const otp = otpUtils.generateOtp();
  forgotOtpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
  await otpUtils.sendForgotOtpEmail(email, otp, user.name, role);
  res.json({ success: true });
};

// Verify Forgot OTP
exports.verifyForgotOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = forgotOtpStore[email];

  if (!record || record.otp !== otp || Date.now() > record.expires)
    return res.status(400).json({ verified: false, message: 'Invalid or expired OTP' });

  res.json({ verified: true });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, role, newPassword } = req.body;
  const hashed = await bcrypt.hash(newPassword, 10);

  const model = role === 'buyer' ? Buyer : Seller;
  await model.findOneAndUpdate({ email }, { password: hashed });

  delete forgotOtpStore[email];
  res.json({ success: true, message: 'Password reset successful' });
};




exports.adminlogin = (req, res) => {
  res.render('auth/adminlogin');
};

exports.adminlogincontroller = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('auth/adminLogin', { error: 'Email and password required' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render('auth/adminLogin', { error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render('auth/adminLogin', { error: 'Invalid email or password' });
    }

    // ✅ Generate token using tokenUtils
    const token = tokenUtils.generateToken({
      id: admin._id,
      email: admin.email,
      role: 'admin'
    });

    // ✅ Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set secure only in production
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    // ✅ Redirect to admin dashboard
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.render('auth/adminLogin', { error: 'Server error. Try again.' });
  }
};



exports.buyerlogout = async (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).send('Failed to log out');
      }
      res.clearCookie('connect.sid'); // optional: clear session cookie
      res.redirect('/auth/login');   // redirect to login or home page
    });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).send('Logout failed');
  }
};


exports.adminlogout = async (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).send('Failed to log out');
      }
      res.clearCookie('connect.sid'); // optional: clear session cookie
      res.redirect('/auth/admin/login');   // redirect to login or home page
    });
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).send('Logout failed');
  }
};