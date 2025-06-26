// utils/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Folder path where files will be uploaded
const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'payment');

// Ensure directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

module.exports = upload;
