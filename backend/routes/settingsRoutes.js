const express = require('express');
const router = express.Router();
const { protect, adminOnly: admin } = require('../middleware/auth');
const { getSettings, updateSettings, getPublicSettings } = require('../controllers/settingsController');

// Public route for frontend detection
router.get('/public', getPublicSettings);

// Admin routes
router.get('/', protect, admin, getSettings);
router.put('/', protect, admin, updateSettings);

module.exports = router;
