const express = require('express');
const router = express.Router();
const { getSeats } = require('../controllers/publicController');

// Public seat view
router.get('/seats', getSeats);

module.exports = router;
