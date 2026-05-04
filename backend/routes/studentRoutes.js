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
    getAvailableShifts,
    requestSeatChange,
    markAttendanceByQr,
    markSelfAttendance,
    markAttendanceByPin,
    markAttendanceDirectly,
    getReceipt,
    getMonthlyReport,
    createFeePaymentOrder,
    verifyFeePayment
} = require('../controllers/studentController');
const { askDoubt, syncDoubtSession } = require('../controllers/doubtController');
const { getCurrentAffairs } = require('../controllers/currentAffairsController');
const { getExamAlerts } = require('../controllers/examAlertsController');
const { getBooks } = require('../controllers/booksController');
const { getNotes } = require('../controllers/notesController');
const { generateTest, evaluateTest, getExamPattern, submitTest, getMyMockTests } = require('../controllers/mockTestController');
const { protect, checkMaintenanceMode, authorizeActive } = require('../middleware/auth');


const { getCardConfig } = require('../controllers/manageCardsController');

// All routes are protected and maintenance-checked
router.use(protect, checkMaintenanceMode);

// Dashboard
router.get('/dashboard', getDashboard);

// Card Config (readable by students to apply admin settings)
router.get('/card-config', getCardConfig);

// Monthly Performance Report
router.get('/report', getMonthlyReport);

// Current Affairs
router.get('/current-affairs', getCurrentAffairs);

// AI Doubt Board
router.post('/doubt/ask', authorizeActive, askDoubt);
router.post('/doubt/sync-session', syncDoubtSession);

// Exam Alerts (RSS feed aggregation)
router.get('/exam-alerts', getExamAlerts);

// Books (Google Books API)
router.get('/books', getBooks);

// Notes (Internet Archive API)
router.get('/notes', getNotes);

// AI Mock Test (Gemini/Groq API)
router.get('/mock-test/pattern/:examCode', getExamPattern);
router.post('/mock-test/generate', generateTest);
router.post('/mock-test/evaluate', evaluateTest);
router.post('/mock-test/submit/:attemptId', submitTest);
router.get('/mock-test/history', getMyMockTests);

// My Seat
router.get('/seat', getMySeat);

// Attendance
router.get('/attendance', authorizeActive, getAttendance);
router.post('/attendance/qr-scan', authorizeActive, markAttendanceByQr);
router.post('/attendance/mark-self', authorizeActive, markSelfAttendance);
router.post('/attendance/mark-pin', authorizeActive, markAttendanceByPin);
router.post('/attendance/mark-direct', authorizeActive, markAttendanceDirectly);

// Fees
router.get('/fees', getFees);
router.get('/fees/:id/receipt', getReceipt);
router.post('/fees/:id/create-order', createFeePaymentOrder);
router.post('/fees/:id/verify-payment', verifyFeePayment);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Requests (Require Active Membership for new requests)
router.post('/request', authorizeActive, submitRequest);
router.get('/request', getMyRequests);
router.put('/request/:id/withdraw', withdrawRequest);
router.get('/available-shifts', authorizeActive, getAvailableShifts);
router.post('/request-seat-change', authorizeActive, requestSeatChange);

// Profile
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/profile/image', uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);

module.exports = router;
