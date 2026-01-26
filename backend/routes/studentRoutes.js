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
    getMyRequests,
    withdrawRequest,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    changePassword,
    requestSeatChange,
    markAttendanceByQr
} = require('../controllers/studentController');
const { protect, checkCrashMode, authorizeActive } = require('../middleware/auth');

// All routes are protected and crash-checked
router.use(protect, checkCrashMode);

// Dashboard
router.get('/dashboard', getDashboard);

// My Seat
router.get('/seat', getMySeat);

// Attendance
router.get('/attendance', authorizeActive, getAttendance);
router.post('/attendance/qr-scan', authorizeActive, markAttendanceByQr);

// Fees
router.get('/fees', getFees);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Requests (Require Active Membership for new requests)
router.post('/request', authorizeActive, submitRequest);
router.get('/request', getMyRequests);
router.put('/request/:id/withdraw', withdrawRequest);
router.post('/request-seat-change', authorizeActive, requestSeatChange);

// Profile
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/profile/image', uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);

module.exports = router;
