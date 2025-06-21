const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dc2x4wqa1',
  api_key: '152384728446337',
  api_secret: '7N3L2aZz7bFG8nFEIvWSZlOyO5M'
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'misc';

    if (req.folderName) {
      folder = req.folderName;
    }

    const publicId = `${Date.now()}-${file.originalname}`;

    console.log('📤 Starting upload to Cloudinary...');
    console.log('📁 Folder:', folder);
    console.log('🆔 Public ID:', publicId);

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      public_id: publicId,
    };
  },
});

module.exports = { cloudinary, storage };
