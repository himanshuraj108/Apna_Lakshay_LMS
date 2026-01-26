const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,
    getAnalytics,
    exportAttendance,
    createFloor,
    deleteFloor,
    createRoom,
    deleteRoom,
    getFloors,
    updatePrices,
    assignSeat,
    markAttendance,
    getAttendance,
    quickCheckIn,
    quickCheckOut,
    getActiveStudents,
    bulkCheckIn,
    bulkCheckOut,
    getFees,
    markFeePaid,
    sendNotification,
    getRequests,
    handleRequest,
    getActionHistory,
    deleteActionLog,
    clearActionHistory,
    getPasswordActivity,
    resetStudentPassword,
    getArchivedStudents,
    getArchivedStudent,
    deleteArchivedStudent,
    clearArchives,
    // Shift Management
    getShifts,
    createShift,
    updateShift,
    deleteShift,
    // Settings
    getSettings,
    updateSettings,
    fixSeatOccupancy,
    // QR Kiosk
    generateQrToken,
    getQrToken,
    resetAllQrTokens,
    markAttendanceByQrAdmin
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
router.delete('/action-history/clear', clearActionHistory);
router.delete('/action-history/:id', deleteActionLog);
router.get('/password-activity', getPasswordActivity);
// ...
// Archives
router.get('/archives', getArchivedStudents);
router.delete('/archives/clear', clearArchives);
router.get('/archives/:id', getArchivedStudent);
router.delete('/archives/:id', deleteArchivedStudent);

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
router.post('/fix-seats', fixSeatOccupancy);

// Attendance
router.post('/attendance', markAttendance);
router.get('/attendance/:date', getAttendance);
router.post('/attendance/check-in', quickCheckIn);
router.post('/attendance/check-out', quickCheckOut);
router.get('/attendance/active/students', getActiveStudents);
router.post('/attendance/bulk-check-in', bulkCheckIn);
router.post('/attendance/bulk-check-out', bulkCheckOut);
router.post('/attendance/mark', markAttendanceByQrAdmin);
router.get('/analytics', getAnalytics);


// QR Kiosk Management
router.post('/qr/generate', generateQrToken);
router.get('/qr/token', getQrToken);
router.post('/reset-student-qrs', resetAllQrTokens);

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
router.delete('/archives/:id', deleteArchivedStudent);

// Shift Management
router.route('/shifts')
    .get(getShifts)
    .post(createShift);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

// System Settings
router.route('/settings')
    .get(getSettings)
    .put(updateSettings);

module.exports = router;
