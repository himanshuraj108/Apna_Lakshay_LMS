const multer = require('multer');
const { storage } = require('../config/cloudinary');

// File filter - only images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    // For Cloudinary storage, file.originalname might be available, but mimetype is safer
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG, GIF) and PDF files are allowed!'));
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
