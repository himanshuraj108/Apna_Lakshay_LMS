const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getFloors,
    updatePrices,
    assignSeat,
    markAttendance,
    getAttendance,
    getFees,
    markFeePaid,
    sendNotification,
    getRequests,
    handleRequest,
    getActionHistory
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect, adminOnly);

// Action History
router.get('/action-history', getActionHistory);

// Dashboard
router.get('/dashboard', getDashboard);

// Student management
router.route('/students')
    .get(getStudents)
    .post(createStudent);

router.route('/students/:id')
    .put(updateStudent)
    .delete(deleteStudent);

// Floor/Room/Seat management
router.get('/floors', getFloors);
router.put('/prices', updatePrices);
router.post('/seats/assign', assignSeat);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/:date', getAttendance);

// Fees
router.get('/fees', getFees);
router.put('/fees/:id/paid', markFeePaid);

// Notifications
router.post('/notifications', sendNotification);

// Requests
router.get('/requests', getRequests);
router.put('/requests/:id', handleRequest);

module.exports = router;
