const express = require('express');
const router = express.Router();
const {
    login,
    getMe,
    logout,
    forgotPassword,
    verifyOTP,
    resetPassword,
    checkPhone,
    markKioskAttendancePublic,
    sendOtpByPhone,
    verifyOtpAndAutoLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Public kiosk attendance (no auth required — used from Login screen)
router.post('/check-phone', checkPhone);
router.post('/kiosk-attendance', markKioskAttendancePublic);
router.post('/send-otp-phone', sendOtpByPhone);
router.post('/verify-otp-login', verifyOtpAndAutoLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
