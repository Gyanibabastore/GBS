const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      req.flash('error', 'Unauthorized access. Please login first.');
      return res.status(401).render('error/404', { msg: 'Unauthorized. No token provided.' });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth Middleware Error:', err);
    req.flash('error', 'Session expired or invalid token.');
    return res.status(403).render('error/500', { msg: 'Invalid or expired token. Please log in again.' });
  }
};
