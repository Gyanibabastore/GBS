const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'MY_SECRET_KEY';

exports.generateToken = (payload) => {
return jwt.sign(payload, SECRET, { expiresIn: '7d' });

};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};
