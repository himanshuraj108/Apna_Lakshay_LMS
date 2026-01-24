const express = require('express');
const router = express.Router();
const { getSeats, getShifts } = require('../controllers/publicController');

// Public seat view
router.get('/seats', getSeats);

// Public shifts for configuration reading
router.get('/shifts', getShifts);

module.exports = router;
