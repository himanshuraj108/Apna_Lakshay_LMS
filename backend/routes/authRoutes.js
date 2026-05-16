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
    verifyOtpAndAutoLogin,
    verifySeatLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Public kiosk attendance (no auth required — used from Login screen)
router.post('/check-phone', checkPhone);
router.post('/kiosk-attendance', markKioskAttendancePublic);
router.post('/send-otp-phone', sendOtpByPhone);
router.post('/verify-otp-login', verifyOtpAndAutoLogin);
router.post('/verify-seat-login', verifySeatLogin);

// Sub-Admin login (public)
const { loginSubAdmin } = require('../controllers/subAdminController');
router.post('/sub-admin-login', loginSubAdmin);

module.exports = router;
