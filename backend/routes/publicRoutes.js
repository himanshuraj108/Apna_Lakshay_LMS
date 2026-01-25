const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public seat view
router.get('/seats', publicController.getSeats);
router.get('/check-email', publicController.checkEmailAvailability);
router.post('/register', publicController.registerStudent);

// Public shifts for configuration reading
router.get('/shifts', publicController.getShifts);

module.exports = router;
