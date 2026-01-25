const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    createFloor,
    deleteFloor,
    createRoom,
    deleteRoom,
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
    getPasswordActivity,
    resetStudentPassword,
    getArchivedStudents,
    getArchivedStudent,
    // Shift Management
    getShifts,
    createShift,
    updateShift,
    deleteShift,
    getSettings,
    updateSettings
} = require('../controllers/adminController');

// ... existing routes ...

// Shift Management
router.route('/shifts')
    .get(getShifts)
    .post(createShift); // Kept original structure for post
router.put('/shifts/:id', updateShift); // Added PUT route
router.delete('/shifts/:id', deleteShift);

// System Settings
router.route('/settings')
    .get(getSettings)
    .put(updateSettings);

module.exports = router;
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

router.post('/students/:id/reset-password', resetStudentPassword);

// Floor/Room/Seat management
router.get('/floors', getFloors);
router.post('/floors', createFloor);
router.delete('/floors/:id', deleteFloor);
router.post('/rooms', createRoom);
router.delete('/rooms/:id', deleteRoom);
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

// Archives
router.get('/archives', getArchivedStudents);
router.get('/archives/:id', getArchivedStudent);

// Shift Management
router.route('/shifts')
    .get(getShifts)
    .post(createShift); // Kept original structure for post
router.put('/shifts/:id', updateShift); // Added PUT route
router.delete('/shifts/:id', deleteShift);

module.exports = router;
