const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getStudents,
    getStudent,
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
    getActionHistory,
    getPasswordActivity
} = require('../controllers/adminController');
const {
    addSeat,
    deleteSeat,
    updateSeat,
    bulkUpdatePrices,
    updateRoomLayout,
    updateRoomPrices,
    updateFloorPrices
} = require('../controllers/seatController');
const { protect, adminOnly } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect, adminOnly);

// Action History
router.get('/action-history', getActionHistory);
router.get('/password-activity', getPasswordActivity);

// Dashboard
router.get('/dashboard', getDashboard);

// Student management
router.route('/students')
    .get(getStudents)
    .post(createStudent);

router.route('/students/:id')
    .get(getStudent)
    .put(updateStudent)
    .delete(deleteStudent);

// Floor/Room/Seat management
router.get('/floors', getFloors);
router.put('/prices', updatePrices);
router.post('/seats/assign', assignSeat);

// New Seat Management Routes
router.post('/seats', addSeat);  // Add seat to wall
router.put('/seats/bulk-price', bulkUpdatePrices);  // Bulk price update all seats (must be before :id)
router.put('/seats/:id', updateSeat);  // Update seat (rename or edit prices)
router.delete('/seats/:id', deleteSeat);  // Delete seat
router.put('/rooms/:roomId/prices', updateRoomPrices);  // Update all seats in a room
router.put('/floors/:floorId/prices', updateFloorPrices);  // Update all seats on a floor
router.put('/rooms/:id/layout', updateRoomLayout);  // Update room layout

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
