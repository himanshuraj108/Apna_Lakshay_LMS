const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

const {
    // Admin — Absence
    markAbsent, removeAbsent, getAbsencesByDate, checkAbsent,
    // Admin — Walkin Slots
    createWalkinSlot, getWalkinSlots, updateWalkinSlot, deleteWalkinSlot,
    // Admin — Requests
    getWalkinRequests, approveWalkinRequest, rejectWalkinRequest,
    // Student/Public
    getAvailableSeats, submitWalkinRequest, getMyWalkinRequests,
    checkInWalkin, checkOutWalkin,
    // Flexible Student Instant Occupy / Release
    getTodayOccupiedSeat, occupyWalkinSeat, releaseWalkinSeat,
    // Utility
    getAllSeatsForWalkin
} = require('../controllers/walkinController');

// ── Admin: Absence management ─────────────────────────────────────────
router.post('/absence/:studentId', protect, adminOnly, markAbsent);
router.delete('/absence/:studentId', protect, adminOnly, removeAbsent);
router.get('/absence', protect, adminOnly, getAbsencesByDate);
router.get('/absence/:studentId/check', protect, adminOnly, checkAbsent);

// ── Admin: Walkin Slot management ─────────────────────────────────────
router.get('/slots', protect, getWalkinSlots);            // students can also see active slots
router.post('/slots', protect, adminOnly, createWalkinSlot);
router.put('/slots/:id', protect, adminOnly, updateWalkinSlot);
router.delete('/slots/:id', protect, adminOnly, deleteWalkinSlot);

// ── Admin: Request management ─────────────────────────────────────────
router.get('/requests', protect, adminOnly, getWalkinRequests);
router.patch('/requests/:id/approve', protect, adminOnly, approveWalkinRequest);
router.patch('/requests/:id/reject', protect, adminOnly, rejectWalkinRequest);

// ── Utility: All seats list (for admin eligible-seats picker) ─────────
router.get('/all-seats', protect, adminOnly, getAllSeatsForWalkin);

// ── Student: Available seats + request submission ─────────────────────
router.get('/available-seats', protect, getAvailableSeats);
router.post('/request', protect, submitWalkinRequest);
router.get('/my-requests', protect, getMyWalkinRequests);

// ── Student: Flexible Instant Occupy / Release / Today Status ─────────
router.get('/today-seat', protect, getTodayOccupiedSeat);
router.post('/occupy', protect, occupyWalkinSeat);
router.delete('/occupy', protect, releaseWalkinSeat);

// ── Student: Check In / Check Out ─────────────────────────────────────
router.patch('/requests/:id/checkin', protect, checkInWalkin);
router.patch('/requests/:id/checkout', protect, checkOutWalkin);

module.exports = router;

