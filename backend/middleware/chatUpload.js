const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/chat';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - only images and PDFs
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
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
