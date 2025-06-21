const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('🛂 Checking file type:', file.mimetype);
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg'
    ) {
      cb(null, true);
    } else {
      console.log('❌ Invalid file type');
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

module.exports = upload;
