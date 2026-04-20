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
    updateRoom,
    deleteRoom,
    getFloors,
    updatePrices,
    assignSeat,
    markAttendance,
    getAttendance,
    getMonthlyAttendance,
    getYearlyAttendance,
    quickCheckIn,
    quickCheckOut,
    getActiveStudents,
    bulkCheckIn,
    bulkCheckOut,
    getFees,
    markFeePaid,
    getVacantSeats,
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
    fixSeatOccupancy,
    // QR Kiosk
    generateQrToken,
    getQrToken,
    resetAllQrTokens,
    markAttendanceByQrAdmin,
    getStudentMockTests,
    swapSeats
} = require('../controllers/adminController');

// Settings come from settingsController
const { getSettings, updateSettings } = require('../controllers/settingsController');

// Holiday controller
const { declareHoliday, getHolidays, deleteHoliday } = require('../controllers/holidayController');

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
router.get('/students/:id/mock-tests', getStudentMockTests);

// Floor/Room/Seat management
router.get('/floors', getFloors);
router.post('/floors', createFloor);
router.delete('/floors/:id', deleteFloor);
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);
router.put('/prices', updatePrices);
router.post('/seats/swap', swapSeats);
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
router.get('/attendance/monthly/:year/:month', getMonthlyAttendance);
router.get('/attendance/yearly/:year', getYearlyAttendance);
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
router.get('/vacant-seats', getVacantSeats);

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

// Manage Cards
const {
    getCardConfig, updateCardConfig,
    getAiCreditConfig, updateAiCreditConfig,
    getStudentsWithAiCredits, updateStudentAiCredits, applyFormulaToAll
} = require('../controllers/manageCardsController');

router.get('/card-config', getCardConfig);
router.put('/card-config', updateCardConfig);
router.get('/ai-credit-config', getAiCreditConfig);
router.put('/ai-credit-config', updateAiCreditConfig);
router.get('/ai-credits/students', getStudentsWithAiCredits);
router.patch('/ai-credits/students/:id', updateStudentAiCredits);
router.post('/ai-credits/apply-formula', applyFormulaToAll);

// Holiday Management
router.route('/holidays')
    .get(getHolidays)
    .post(declareHoliday);
router.delete('/holidays/:id', deleteHoliday);

// Student Chat History (Doubt Board)
const { getStudentsWithChatHistory, getStudentChatHistory } = require('../controllers/doubtController');
router.get('/chat-history', getStudentsWithChatHistory);
router.get('/chat-history/:studentId', getStudentChatHistory);

module.exports = router;
