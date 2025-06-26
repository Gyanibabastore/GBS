const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Admin = require('../models/Admin');

const SECRET = process.env.JWT_SECRET || 'MY_SECRET_KEY';

const decodeUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    req.flash?.('error', 'Please login to continue');
    return res.status(401).redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const userId = decoded.id;

    let user = await Buyer.findById(userId) || await Seller.findById(userId) || await Admin.findById(userId);
    if (!user) {
      res.clearCookie('token');
      return res.status(401).redirect('/login');
    }

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error('JWT decode failed:', err);
    res.clearCookie('token');
    return res.status(403).redirect('/login');
  }
};

const isBuyer = [decodeUser, (req, res, next) => {
  if (req.role !== 'buyer') return res.status(403).send('Only buyers allowed');
  next();
}];

const isSeller = [decodeUser, (req, res, next) => {
  if (req.role !== 'seller') return res.status(403).send('Only sellers allowed');
  next();
}];

const isAdmin = [decodeUser, (req, res, next) => {
  if (req.role !== 'admin') return res.status(403).send('Only admins allowed');
  next();
}];

const isLoggedIn = decodeUser;

module.exports = { isBuyer, isSeller, isAdmin, isLoggedIn };
