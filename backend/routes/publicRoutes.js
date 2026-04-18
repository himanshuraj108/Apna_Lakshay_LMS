const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { getPublicSettings } = require('../controllers/settingsController');
const { getVacantSeats } = require('../controllers/adminController');

// Public seat view
router.get('/seats', publicController.getSeats);
router.get('/check-email', publicController.checkEmailAvailability);
router.post('/register', publicController.registerStudent);

// Public shifts for configuration reading
router.get('/shifts', publicController.getShifts);

// Public settings (location, system status, etc.)
router.get('/settings', getPublicSettings);

// Public office/security attendance route
router.get('/office/attendance/:date', publicController.getOfficeAttendance);

// Public office/security vacant seats route
router.get('/office/vacant-seats', getVacantSeats);

module.exports = router;
