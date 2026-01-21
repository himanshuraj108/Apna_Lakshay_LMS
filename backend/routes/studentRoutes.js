const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getMySeat,
    getAttendance,
    getFees,
    getNotifications,
    markNotificationRead,
    submitRequest,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

// All routes are protected (student only)
router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// My Seat
router.get('/seat', getMySeat);

// Attendance
router.get('/attendance', getAttendance);

// Fees
router.get('/fees', getFees);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Requests
router.post('/request', submitRequest);

// Profile
router.put('/profile', updateProfile);
router.post('/profile/image', uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);

module.exports = router;
