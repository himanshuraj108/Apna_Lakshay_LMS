// Simplified adminController - just basic exports
const mongoose = require('mongoose');
const User = require('../models/User');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const ActionLog = require('../models/ActionLog');
const PasswordLog = require('../models/PasswordLog');
const ArchivedStudent = require('../models/ArchivedStudent');
const Shift = require('../models/Shift');
const Settings = require('../models/Settings');
const SystemSetting = require('../models/SystemSetting');
const MockTestAttempt = require('../models/MockTestAttempt');
const TempSeatAssignment = require('../models/TempSeatAssignment');
const { getClient } = require('../utils/redis');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Polyfill for Node < 15.6.0
const randomUUID = crypto.randomUUID || (() => crypto.randomBytes(16).toString('hex'));

const logAutomation = (msg) => {
    const logFile = path.join(__dirname, '../../admin_automation.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

// Email service for notifications (with safe loading)
let emailService;
try {
    emailService = require('../services/emailService');
    console.log('✅ Email service loaded successfully');
} catch (error) {
    console.error('⚠️ Email service failed to load:', error.message);
    // Fallback: Create a mock emailService to prevent crashes
    emailService = {
        sendCredentialsEmail: async () => console.log('Email service not available'),
        sendSeatAssignmentEmail: async () => console.log('Email service not available'),
        sendRequestResponseEmail: async () => console.log('Email service not available'),
        sendFeeConfirmationEmail: async () => console.log('Email service not available'),
        sendAnnouncementEmail: async () => console.log('Email service not available'),
        sendSeatChangeRequestEmail: async () => console.log('Email service not available'),
        sendSeatChangeApprovedEmail: async () => console.log('Email service not available'),
        sendSeatChangeRejectedEmail: async () => console.log('Email service not available'),
        sendOTPEmail: async () => console.log('Email service not available'),
        sendShiftChangeApprovedEmail: async () => console.log('Email service not available'),
        sendShiftChangeRejectedEmail: async () => console.log('Email service not available'),
        sendFeeUpdateEmail: async () => console.log('Email service not available'),
        sendPartialFeeEmail: async () => console.log('Email service not available')
    };
}

// Helper to get India Standard Time (UTC+5:30)
const getISTDate = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
};

// ... (existing imports)

// ==========================================
// DYNAMIC SHIFT MANAGEMENT
// ==========================================

// @desc    Get all shifts
// @route   GET /api/admin/shifts
// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query; // week, month
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate = new Date();
        if (period === 'month') {
            startDate.setDate(startDate.getDate() - 30);
        } else {
            startDate.setDate(startDate.getDate() - 7);
        }
        startDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Current Occupancy (Exact date match for today's attendance document)
        const activeCount = await Attendance.countDocuments({
            date: today,
            isActive: true
        });

        // 2. Daily Attendance Trends (Last X days)
        const dailyTrendsPromise = Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
                    presentCount: { $sum: 1 },
                    avgDuration: { $avg: "$duration" },
                    totalDuration: { $sum: "$duration" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Peak Hours Analysis (Based on entry times)
        // We only look at recent data (last 30 days) for relevant patterns
        const peakMonthStart = new Date();
        peakMonthStart.setDate(peakMonthStart.getDate() - 30);

        const peakHoursPromise = Attendance.aggregate([
            {
                $match: {
                    date: { $gte: peakMonthStart },
                    entryTime: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    hour: { $substr: ["$entryTime", 0, 2] }
                }
            },
            {
                $group: {
                    _id: "$hour",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Student Performance (Top 5 by duration)
        const topStudentsPromise = Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: "$student",
                    totalDuration: { $sum: "$duration" },
                    daysPresent: { $sum: 1 }
                }
            },
            { $sort: { totalDuration: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    name: "$studentInfo.name",
                    email: "$studentInfo.email",
                    totalDuration: 1,
                    daysPresent: 1
                }
            }
        ]);

        const [dailyTrends, peakHours, topStudents] = await Promise.all([
            dailyTrendsPromise,
            peakHoursPromise,
            topStudentsPromise
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                activeCount,
                period,
                dailyTrends,
                peakHours,
                topStudents
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Analytics error',
            error: error.message
        });
    }
};

// Export attendance data
exports.exportAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('TEST MODE Params:', { startDate, endDate });

        if (!startDate || !endDate) {
            return res.json({ success: true, data: [], message: "No dates provided (Test)" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid Date (Test Mode)' });
        }

        // Return dummy data to prove route works
        return res.json({
            success: true,
            data: [{
                Date: start.toLocaleDateString(),
                Student: 'Test User',
                Status: 'present',
                Notes: 'Database Bypassed for Debugging'
            }]
        });

        /*
        // ORIGINAL LOGIC COMMENTED OUT
        // ... (Query logic is temporarily disabled)
        */
    } catch (error) {
        console.error('Test Mode Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getShifts = async (req, res) => {
    try {
        const shifts = await Shift.find({ isActive: true }).sort({ startTime: 1 });
        res.status(200).json({ success: true, shifts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create a new shift
// @route   POST /api/admin/shifts
exports.createShift = async (req, res) => {
    try {
        const { name, startTime, endTime } = req.body;

        const existingShift = await Shift.findOne({ name });
        if (existingShift) {
            return res.status(400).json({ success: false, message: 'Shift name already exists' });
        }

        // Check for time overlaps with existing shifts
        const { doTimeRangesOverlap } = require('../utils/timeUtils');
        const allShifts = await Shift.find({ isActive: true });

        const overlappingShifts = allShifts.filter(existing =>
            doTimeRangesOverlap(
                startTime,
                endTime,
                existing.startTime,
                existing.endTime
            )
        );

        const shift = await Shift.create({ name, startTime, endTime });

        await logAction(req, 'create_shift', 'Shift', shift._id, shift.name, `Created shift ${shift.name} (${startTime}-${endTime})`);

        // Return success with optional warning about overlaps
        if (overlappingShifts.length > 0) {
            return res.status(201).json({
                success: true,
                shift,
                warning: `This shift overlaps with ${overlappingShifts.length} existing shift(s)`,
                overlappingShifts: overlappingShifts.map(s => ({
                    name: s.name,
                    startTime: s.startTime,
                    endTime: s.endTime
                }))
            });
        }

        res.status(201).json({ success: true, shift });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Update a shift
// @route   PUT /api/admin/shifts/:id
exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime } = req.body;

        const shift = await Shift.findById(id);
        if (!shift) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        // Check for duplicate name if name is being changed
        if (name && name !== shift.name) {
            const duplicate = await Shift.findOne({ name });
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'Shift name already exists' });
            }
            shift.name = name;
        }

        shift.startTime = startTime || shift.startTime;
        shift.endTime = endTime || shift.endTime;

        await shift.save();

        await logAction(req, 'update_shift', 'Shift', id, shift.name, `Updated shift ${shift.name}`);

        res.status(200).json({ success: true, message: 'Shift updated successfully', shift });
    } catch (error) {
        console.error('Update Shift Error:', error);
        // Handle MongoDB duplicate key error fallback
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Shift name already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete a shift
// @route   DELETE /api/admin/shifts/:id
exports.deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        const shift = await Shift.findById(id);

        if (!shift) {
            return res.status(404).json({ success: false, message: 'Shift not found' });
        }

        // Check if any active assignments use this shift
        const activeUsage = await Seat.countDocuments({
            'assignments': {
                $elemMatch: { shift: id, status: 'active' }
            }
        });

        if (activeUsage > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete shift. It is currently assigned to active students.' });
        }

        await Shift.findByIdAndDelete(id);

        await logAction(req, 'delete_shift', 'Shift', id, shift.name, `Deleted shift ${shift.name}`);

        res.status(200).json({ success: true, message: 'Shift deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
// ==========================================

// Email service import moved to top-level

// Helper functions moved to bottom for clean hoisting

// Dashboard
// Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const mode = req.query.mode || 'default';
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // 1. Total Students (Filtered by System Mode, ignoring isActive to count ALL students)
        const totalStudents = await User.countDocuments({
            role: 'student',
            $or: [
                { systemMode: mode },
                ...(mode === 'default' ? [{ systemMode: { $exists: false } }] : [])
            ]
        });

        // 2. Total Seats & AC vs Non-AC breakdown
        const totalSeats = await Seat.countDocuments();

        const seatAcAgg = await Seat.aggregate([
            {
                $lookup: {
                    from: 'rooms',
                    localField: 'room',
                    foreignField: '_id',
                    as: 'roomInfo'
                }
            },
            { $unwind: { path: '$roomInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    hasAc: { $ifNull: ['$roomInfo.hasAc', false] },
                    assignments: 1
                }
            }
        ]);

        let acTotalSeats = 0;
        let nonAcTotalSeats = 0;
        let acOccupiedSeats = 0;
        let nonAcOccupiedSeats = 0;

        seatAcAgg.forEach(s => {
            const hasAc = s.hasAc === true;
            if (hasAc) acTotalSeats++;
            else nonAcTotalSeats++;

            const hasActiveAssignment = s.assignments && s.assignments.some(a => a.status === 'active');
            if (hasActiveAssignment) {
                if (hasAc) acOccupiedSeats++;
                else nonAcOccupiedSeats++;
            }
        });

        const acVacantSeats = Math.max(0, acTotalSeats - acOccupiedSeats);
        const nonAcVacantSeats = Math.max(0, nonAcTotalSeats - nonAcOccupiedSeats);

        // 3. Occupied Seats — count DISTINCT physical seats that have at least one active assignment
        //    (a student with 2 shifts on 1 seat = 1 occupied seat, not 2)
        const occupiedSeatsAgg = await Seat.aggregate([
            { $unwind: '$assignments' },
            { $match: { 'assignments.status': 'active' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignments.student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    $or: [
                        { 'studentInfo.systemMode': mode },
                        ...(mode === 'default' ? [{ 'studentInfo.systemMode': { $exists: false } }] : [])
                    ]
                }
            },
            // Group by seat _id to get distinct physical seats + collect all students & prices
            {
                $group: {
                    _id: '$_id',  // seat document ID = 1 physical seat
                    studentIds: { $addToSet: '$studentInfo._id' },
                    prices: { $push: '$assignments.price' }
                }
            }
        ]);

        // Distinct physical seats occupied
        const occupiedSeats = occupiedSeatsAgg.length;

        // 1b. Active Students — distinct across all occupied seats
        const activeStudentIdSet = new Set();
        let expectedMonthlyFee = 0;
        occupiedSeatsAgg.forEach(seat => {
            seat.studentIds.forEach(id => activeStudentIdSet.add(id.toString()));
            seat.prices.forEach(p => { if (p) expectedMonthlyFee += p; });
        });
        const activeStudents = activeStudentIdSet.size;

        // 3b. expectedMonthlyFee already computed above

        // 4. Fees Collected
        const feesCollectedAgg = await Fee.aggregate([
            { $match: { status: 'paid' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    $or: [
                        { 'studentInfo.systemMode': mode },
                        ...(mode === 'default' ? [{ 'studentInfo.systemMode': { $exists: false } }] : [])
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const feesCollected = feesCollectedAgg[0]?.total || 0;

        // 4b. Today's Fee Collection
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayFeesCollectedAgg = await Fee.aggregate([
            {
                $match: {
                    status: 'paid',
                    $or: [
                        { paidDate: { $gte: startOfToday } },
                        { paidDate: null, updatedAt: { $gte: startOfToday } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    $or: [
                        { 'studentInfo.systemMode': mode },
                        ...(mode === 'default' ? [{ 'studentInfo.systemMode': { $exists: false } }] : [])
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const todayFeesCollected = todayFeesCollectedAgg[0]?.total || 0;

        // 5. Pending Requests
        const pendingRequestsAgg = await Request.aggregate([
            { $match: { status: 'pending' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    $or: [
                        { 'studentInfo.systemMode': mode },
                        ...(mode === 'default' ? [{ 'systemMode': { $exists: false } }] : [])
                    ]
                }
            },
            { $count: 'count' }
        ]);
        const pendingRequests = pendingRequestsAgg[0]?.count || 0;

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                activeStudents,
                totalSeats,
                occupiedSeats,
                availableSeats: totalSeats - occupiedSeats, // Dynamic availability based on this mode's occupancy
                acVacantSeats,
                nonAcVacantSeats,
                acTotalSeats,
                nonAcTotalSeats,
                expectedMonthlyFee,
                feesCollected,
                todayFeesCollected,
                pendingRequests
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all students
exports.getStudents = async (req, res) => {
    try {
        // Return both active and inactive students (filtered on frontend)
        const query = { role: 'student' };

        const students = await User.find(query)
            .populate('createdBy', 'name')
            .populate({
                path: 'seat',
                populate: {
                    path: 'room floor assignments.shift'
                }
            })
            .lean() // Use lean for performance and easier modification
            .sort({ createdAt: -1 });

        // Get latest UNPAID fee for all fetched students (prefer pending/overdue over paid)
        const studentIds = students.map(s => s._id);
        const latestFees = await Fee.aggregate([
            { $match: { student: { $in: studentIds }, status: { $in: ['pending', 'overdue', 'partial'] } } },
            { $sort: { year: -1, month: -1, createdAt: -1 } },
            {
                $group: {
                    _id: '$student',
                    amount: { $first: '$amount' }
                }
            }
        ]);

        const feeMap = {};
        latestFees.forEach(f => {
            feeMap[f._id.toString()] = f.amount;
        });

        const io = req.app.get('io');

        // Fetch temp assignments BEFORE mapping students (needed inside map)
        const tempAssignments = await TempSeatAssignment.find({
            borrowerStudent: { $in: studentIds },
            status: 'active'
        })
            .populate({ path: 'seat', select: 'number room floor', populate: [{ path: 'room', select: 'name roomId hasAc' }, { path: 'floor', select: 'name' }] })
            .populate('shift', 'name startTime endTime')
            .populate('originalOwner', 'name studentId')
            .lean();

        // Build a map: studentId -> [tempAssignments]
        const tempMap = {};
        tempAssignments.forEach(ta => {
            const sid = ta.borrowerStudent.toString();
            if (!tempMap[sid]) tempMap[sid] = [];
            tempMap[sid].push(ta);
        });

        // Fetch ALL active seat assignments for these students across ALL seats
        // (needed for split-assigned students who appear on multiple seats)
        const allActiveSeats = await Seat.find({
            'assignments': { $elemMatch: { student: { $in: studentIds }, status: 'active' } }
        }).populate('assignments.shift', 'name startTime endTime').populate('room', 'name roomId hasAc').populate('floor', 'name').lean();

        // Build map: studentId -> [{ seat, assignment }]
        const studentSeatMap = {};
        for (const seat of allActiveSeats) {
            for (const a of seat.assignments) {
                if (a.status !== 'active') continue;
                const sid = a.student.toString();
                if (!studentSeatMap[sid]) studentSeatMap[sid] = [];
                studentSeatMap[sid].push({ seat, assignment: a });
            }
        }

        // Transform students to include resolved shift info and ensure registrationSource
        const studentsWithShift = students.map(student => {
            let shiftInfo = null;
            let shiftDetails = null;
            let shiftsArr = [];
            const seatNumbers = [];

            const mySeatAssignments = studentSeatMap[student._id.toString()] || [];
            if (mySeatAssignments.length > 0) {
                const seenSeats = new Set();
                for (const { seat: aSeat, assignment: a } of mySeatAssignments) {
                    const sNum = aSeat.number;
                    if (sNum && !seenSeats.has(sNum)) { seenSeats.add(sNum); seatNumbers.push(sNum); }
                    let shiftEntry = null;
                    if (a.shift && a.shift.name) {
                        shiftEntry = { _id: a.shift._id, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime, price: a.price, seatNumber: sNum };
                    } else if (a.legacyShift) {
                        shiftEntry = { name: a.legacyShift, price: a.price, seatNumber: sNum };
                    } else if (a.type === 'full_day') {
                        shiftEntry = { name: 'Full Day', price: a.price, seatNumber: sNum };
                    }
                    if (shiftEntry) shiftsArr.push(shiftEntry);
                }
                if (shiftsArr.length > 0) {
                    shiftInfo = shiftsArr.map(s => s.name).join(' + ');
                    shiftDetails = { startTime: shiftsArr[0].startTime, endTime: shiftsArr[0].endTime };
                }
            } else if (student.seat && student.seat.assignments) {
                // Fallback: only primary seat (no split assignments found)
                const myAssignments = student.seat.assignments.filter(a =>
                    a.status === 'active' && a.student.toString() === student._id.toString()
                );

                shiftsArr = myAssignments.map(a => {
                    if (a.shift && a.shift.name) {
                        return { _id: a.shift._id, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime, price: a.price };
                    } else if (a.legacyShift) {
                        return { name: a.legacyShift, price: a.price };
                    } else if (a.type === 'full_day') {
                        return { name: 'Full Day', price: a.price };
                    }
                    return null;
                }).filter(Boolean);

                // Backward compat: single shift fields from first assignment
                if (shiftsArr.length > 0) {
                    shiftInfo = shiftsArr.map(s => s.name).join(' + ');
                    shiftDetails = { startTime: shiftsArr[0].startTime, endTime: shiftsArr[0].endTime };
                }
            }

            let isTemporarySeat = false;
            let resolvedSeat = student.seat;
            let resolvedSeatNumber = seatNumbers.length > 0 ? seatNumbers[0] : (student.seat?.number || null);

            if (shiftsArr.length === 0 && tempMap[student._id.toString()]?.length > 0) {
                const firstTemp = tempMap[student._id.toString()][0];
                isTemporarySeat = true;
                if (firstTemp.seat) {
                    resolvedSeat = firstTemp.seat;
                    resolvedSeatNumber = firstTemp.seat.number;
                }
                if (firstTemp.shift) {
                    shiftInfo = firstTemp.shift.name;
                    shiftDetails = { startTime: firstTemp.shift.startTime, endTime: firstTemp.shift.endTime };
                    shiftsArr = [{ _id: firstTemp.shift._id, name: firstTemp.shift.name, startTime: firstTemp.shift.startTime, endTime: firstTemp.shift.endTime }];
                }
            } else if (tempMap[student._id.toString()]?.length > 0) {
                isTemporarySeat = true;
            }

            // Calculate online status
            const userRoom = io ? io.sockets.adapter.rooms.get(`user:${student._id}`) : null;
            const isOnline = userRoom ? userRoom.size > 0 : false;

            return {
                ...student,
                seat: resolvedSeat,
                seatNumber: resolvedSeatNumber,
                seatNumbers,                   // all seat numbers for split-assigned students
                shift: shiftInfo,              // backward compat: "Shift 1 + Shift 3"
                shiftDetails,                  // backward compat: first shift times
                shifts: shiftsArr,             // full array [{name, startTime, endTime, seatNumber}]
                isTemporary: isTemporarySeat,
                isTemporarySeat,
                registrationSource: student.registrationSource || 'admin',
                currentFee: feeMap[student._id.toString()] || null,
                tempAssignments: tempMap[student._id.toString()] || [],
                isOnline,
                isLoggedIn: student.isLoggedIn || false,
                lastLogin: student.lastLogin || null,
                lastActive: student.lastActive || null
            };
        });

        res.status(200).json({
            success: true,
            students: studentsWithShift
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get single student by ID (supports full _id or last 8 chars)
exports.getStudent = async (req, res) => {
    try {
        let { id } = req.params;

        // Handle "AL-" or "HL-" prefix from ID card text
        if (id && (id.toUpperCase().startsWith('AL-') || id.toUpperCase().startsWith('HL-'))) {
            id = id.substring(3);
        }

        let student;

        // Check if valid ObjectId
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            student = await User.findById(id)
                .populate('createdBy', 'name')
                .populate({
                    path: 'seat',
                    populate: { path: 'room floor assignments.shift' }
                })
                .lean();
        } else {
            // Try searching by last 8 characters (active students only)
            const allStudents = await User.find({ role: 'student', isActive: true })
                .populate('createdBy', 'name')
                .populate({
                    path: 'seat',
                    populate: { path: 'room floor assignments.shift' }
                })
                .lean();
            student = allStudents.find(s => s._id.toString().toUpperCase().endsWith(id.toUpperCase()));
        }

        if (student) {
            let shiftInfo = null;
            if (student.seat && student.seat.assignments) {
                const assignment = student.seat.assignments.find(a =>
                    a.status === 'active' && a.student.toString() === student._id.toString()
                );

                if (assignment) {
                    if (assignment.shift && assignment.shift.name) {
                        shiftInfo = assignment.shift.name;
                    } else if (assignment.legacyShift) {
                        shiftInfo = assignment.legacyShift;
                    } else if (assignment.type === 'full_day') {
                        shiftInfo = 'Full Day';
                    }
                    student.price = assignment.price; // Store price from assignment

                    // Fallback for older assignments without price
                    if (!student.price && student.seat) {
                        try {
                            const seat = student.seat;
                            if (assignment.shift && seat.shiftPrices) {
                                // Handle Map or Object structure of shiftPrices
                                const shiftId = assignment.shift._id || assignment.shift;
                                student.price = seat.shiftPrices[shiftId] || seat.shiftPrices[shiftId.toString()];
                            }

                            if (!student.price && assignment.legacyShift && seat.basePrices) {
                                student.price = seat.basePrices[assignment.legacyShift];
                            }

                            if (!student.price && assignment.type === 'full_day' && seat.basePrices) {
                                student.price = seat.basePrices.full;
                            }

                            // Ultimate Fallback for custom shifts with no price set: use Day price default
                            if (!student.price) {
                                console.log('Price calculation failed, applying safety fallback.');
                                if (seat.basePrices) {
                                    student.price = seat.basePrices.day || 800;
                                } else {
                                    student.price = 800; // Hard fallback
                                }
                            }
                            console.log('Final Calculated Price:', student.price);
                        } catch (err) {
                            console.log('Error calculating fallback price:', err);
                        }
                    }
                }
            }
            student.shift = shiftInfo;
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get seat info (already populated but let's ensure we have the calculated one)
        // If we want to rely on the populated seat from lines 315/324:
        let seatData = null;
        if (student.seat) {
            // Check if this student is actually assigned (active) to this seat
            // OR if we are just showing the seat linked in student profile
            const seatObj = student.seat;

            // Find specific assignment details if needed, but for verification just showing "Assigned Seat" is enough?
            // Let's stick to what we have in the student object which we modified above with 'shift'

            seatData = {
                number: seatObj.number,
                floor: seatObj.floor?.name,
                room: seatObj.room?.name,
                shift: student.shift || 'N/A', // Calculated above
                price: student.price || seatObj.currentPrice || seatObj.price
            };
        } else {
            // Fallback: try finding a seat where this student is assigned (legacy check)
            const foundSeat = await Seat.findOne({
                'assignments': {
                    $elemMatch: { student: student._id, status: 'active' }
                }
            }).populate('floor room');

            if (foundSeat) {
                seatData = {
                    number: foundSeat.number,
                    floor: foundSeat.floor?.name,
                    room: foundSeat.room?.name,
                    shift: student.shift || 'Associated',
                    price: foundSeat.currentPrice
                };
            }
        }

        // Check if student has an active temporary seat assignment
        const tempAssignments = await TempSeatAssignment.find({
            borrowerStudent: student._id,
            status: 'active'
        }).populate({ path: 'seat', populate: { path: 'room floor' } }).populate('shift').lean();

        let isTemporary = false;
        if (!seatData && tempAssignments.length > 0) {
            const firstTemp = tempAssignments[0];
            seatData = {
                number: firstTemp.seat?.number,
                floor: firstTemp.seat?.floor?.name,
                room: firstTemp.seat?.room?.name,
                roomId: firstTemp.seat?.room?.roomId,
                shift: firstTemp.shift?.name || 'Temporary Shift',
                price: 0,
                isTemporary: true
            };
            student.shift = firstTemp.shift?.name || 'Temporary Shift';
            isTemporary = true;
        } else if (tempAssignments.length > 0) {
            isTemporary = true;
        }

        const io = req.app.get('io');
        const userRoom = io ? io.sockets.adapter.rooms.get(`user:${student._id}`) : null;
        const isOnline = userRoom ? userRoom.size > 0 : false;

        res.status(200).json({
            success: true,
            student: {
                ...student, // It is already lean object
                seat: seatData,
                isTemporary,
                isTemporarySeat: isTemporary,
                tempAssignments,
                isOnline,
                isLoggedIn: student.isLoggedIn || false,
                lastLogin: student.lastLogin || null,
                lastActive: student.lastActive || null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create student
exports.createStudent = async (req, res) => {
    try {
        const {
            name, email, mobile, address, systemMode = 'custom', studentId, joinedAt, gender = 'male', referralCode,
            fatherName, guardianName, guardianPhone, dob, aadharNo, lockerNo, registrationFee
        } = req.body;

        // Default avatar is handled deterministically by User.js pre-save hook based on _id
        let profileImage = undefined;

        // Use provided password or default to mobile number
        let password = req.body.password;
        if (!password) {
            password = mobile; // Default to mobile for first-time login
        }

        const studentData = {
            name,
            email: email || undefined, // Use undefined for missing email to respect sparse unique index
            mobile,
            address,
            fatherName: fatherName || '',
            guardianName: guardianName || '',
            guardianPhone: guardianPhone || '',
            dob: dob ? new Date(dob) : null,
            aadharNo: aadharNo || '',
            lockerNo: lockerNo || '',
            registrationFee: registrationFee ? Number(registrationFee) : 0,
            gender,
            profileImage,
            password,
            systemMode,
            role: 'student',
            isActive: true, // Admin created students are active by default
            registrationSource: 'admin',
            studentId: studentId || undefined, // Allow empty/null
            createdBy: req.user.id
        };

        const initialAdmissionDate = joinedAt ? new Date(joinedAt) : new Date();
        studentData.admissionDate = initialAdmissionDate;
        studentData.statusHistory = [{
            status: 'active',
            date: new Date(),
            admissionDate: initialAdmissionDate
        }];

        const student = new User(studentData);
        await student.save();

        // ── Process referral if a code was provided ───────────────────────
        if (referralCode && referralCode.trim()) {
            try {
                const { processReferralOnAdmission } = require('./referralController');
                const Settings = require('../models/Settings');
                const settings = await Settings.findOne().lean();
                await processReferralOnAdmission({
                    refereeId: student._id,
                    referralCode: referralCode.trim(),
                    settings
                });
                // Mark student's referredBy
                const referrerUser = require('../models/User');
                const referrer = await referrerUser.findOne({ referralCode: referralCode.toUpperCase().trim() });
                if (referrer) {
                    student.referredBy = referrer._id;
                    await student.save({ validateBeforeSave: false });
                }
            } catch (refErr) {
                console.error('Referral processing error (non-blocking):', refErr.message);
                // Non-blocking – student still created
            }
        }

        // Send credentials email
        try {
            await emailService.sendCredentialsEmail(name, email, password);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Continue even if email fails
        }

        // Log action
        await logAction(req, 'student_created', 'User', student._id, student.name, `Created student: ${student.email}`);

        res.status(201).json({
            success: true,
            message: email ? 'Student created and credentials sent via email' : 'Student created (Login with Mobile)',
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                tempPassword: password // Still return for admin reference
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update student
// Bulk update student fees via a flat amount offset

exports.bulkUpdateStudentFees = async (req, res) => {
    try {
        const { studentIds, amount, operation, sendEmail = false, excludedFromFeeManagementIds = [] } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one student.' });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
        }

        if (!['increase', 'decrease', 'set'].includes(operation)) {
            return res.status(400).json({ success: false, message: 'Invalid operation. Use increase, decrease, or set.' });
        }

        let updateCount = 0;
        const updatedDetails = [];

        for (const studentId of studentIds) {
            const student = await User.findById(studentId);
            if (!student) continue;

            // Update showInFeeManagement preference if specified in bulk
            const shouldShowInFee = !excludedFromFeeManagementIds.includes(student._id.toString());
            if (student.showInFeeManagement !== shouldShowInFee) {
                student.showInFeeManagement = shouldShowInFee;
                await student.save();
            }

            // Find their assigned seat
            let seat = null;
            if (student.seat) {
                seat = await Seat.findById(student.seat);
            }
            if (!seat) {
                seat = await Seat.findOne({
                    'assignments.student': student._id,
                    'assignments.status': 'active'
                });
            }
            if (!seat) {
                seat = await Seat.findOne({
                    $or: [
                        { assignedTo: student._id },
                        { 'assignments.student': student._id }
                    ]
                });
            }

            // Determine active assignment & current price
            let assignmentIndex = -1;
            let currentPrice = null;

            if (seat && Array.isArray(seat.assignments)) {
                assignmentIndex = seat.assignments.findIndex(
                    a => a.student && a.student.toString() === student._id.toString() && a.status === 'active'
                );
                if (assignmentIndex === -1) {
                    assignmentIndex = seat.assignments.findIndex(
                        a => a.student && a.student.toString() === student._id.toString()
                    );
                }
                if (assignmentIndex !== -1) {
                    currentPrice = seat.assignments[assignmentIndex].price;
                }
            }

            if (currentPrice == null || currentPrice === 0) {
                if (seat) {
                    currentPrice = seat.basePrices?.full || 1200;
                } else if (student.currentFee) {
                    currentPrice = student.currentFee;
                } else {
                    const latestFee = await Fee.findOne({ student: student._id }).sort({ year: -1, month: -1 });
                    currentPrice = latestFee ? latestFee.amount : 1000;
                }
            }

            let newPrice = currentPrice;
            if (operation === 'increase') {
                newPrice = currentPrice + amount;
            } else if (operation === 'decrease') {
                newPrice = Math.max(0, currentPrice - amount);
            } else if (operation === 'set') {
                newPrice = Math.max(0, amount);
            }

            if (newPrice !== currentPrice) {
                if (seat && assignmentIndex !== -1) {
                    seat.assignments[assignmentIndex].price = newPrice;
                    await seat.save();
                }

                student.currentFee = newPrice;
                await student.save();
                updateCount++;

                const now = new Date();
                const feeMonth = now.getMonth() + 1;
                const feeYear = now.getFullYear();
                const diff = newPrice - currentPrice;

                // 1. Update any existing pending and overdue fees for this student
                await Fee.updateMany(
                    { student: student._id, status: { $in: ['pending', 'overdue'] } },
                    { $set: { amount: newPrice, outstanding: newPrice } }
                );

                // 2. Update existing partial fee records: recalculate outstanding
                const partialFees = await Fee.find({ student: student._id, status: 'partial' });
                for (const pFee of partialFees) {
                    pFee.amount = newPrice;
                    const remaining = Math.max(0, newPrice - (pFee.partialPaid || 0));
                    pFee.outstanding = remaining;
                    if (remaining === 0 && (pFee.partialPaid || 0) >= newPrice) {
                        pFee.status = 'paid';
                    }
                    await pFee.save();
                }

                // 3. Current month fee handling
                const currentFeeRecord = await Fee.findOne({
                    student: student._id,
                    month: feeMonth,
                    year: feeYear
                });

                if (!currentFeeRecord) {
                    // No fee record exists for current month: create a new pending fee
                    const joinedDate = new Date(student.admissionDate || student.createdAt || now);
                    const billingDay = joinedDate.getDate() || 10;
                    const dueDate = new Date(feeYear, feeMonth - 1, billingDay);
                    await Fee.create({
                        student: student._id,
                        month: feeMonth,
                        year: feeYear,
                        amount: newPrice,
                        outstanding: newPrice,
                        dueDate,
                        status: 'pending'
                    });
                } else if (currentFeeRecord.status === 'paid') {
                    // IF student already paid for this month and fee is INCREASED:
                    // Only the increased difference (diff) will be shown in pending status!
                    if (diff > 0) {
                        currentFeeRecord.amount = newPrice;
                        currentFeeRecord.partialPaid = currentPrice;
                        currentFeeRecord.outstanding = diff; // ONLY increased fee is due
                        currentFeeRecord.status = 'partial'; // Shows in Pending Dues!
                        await currentFeeRecord.save();
                    } else {
                        currentFeeRecord.amount = newPrice;
                        await currentFeeRecord.save();
                    }
                } else if (currentFeeRecord.status === 'partial') {
                    const remaining = Math.max(0, newPrice - (currentFeeRecord.partialPaid || 0));
                    currentFeeRecord.amount = newPrice;
                    currentFeeRecord.outstanding = remaining;
                    if (remaining === 0 && (currentFeeRecord.partialPaid || 0) >= newPrice) {
                        currentFeeRecord.status = 'paid';
                    }
                    await currentFeeRecord.save();
                } else if (currentFeeRecord.status === 'pending' || currentFeeRecord.status === 'overdue') {
                    currentFeeRecord.amount = newPrice;
                    currentFeeRecord.outstanding = newPrice;
                    await currentFeeRecord.save();
                }

                // 4. Send email notification if explicitly requested (default: false / not sent)
                let emailSent = false;
                if (sendEmail && student.email && emailService?.sendFeeUpdateEmail) {
                    try {
                        await emailService.sendFeeUpdateEmail(student, currentPrice, newPrice);
                        emailSent = true;
                    } catch (emailErr) {
                        console.error(`Failed to send fee update email to ${student.email}:`, emailErr);
                    }
                }

                updatedDetails.push({
                    studentId: student._id,
                    name: student.name,
                    email: student.email || '',
                    seatNumber: seat?.number || 'Desk',
                    beforeFee: currentPrice,
                    newFee: newPrice,
                    diff,
                    emailSent,
                    showInFeeManagement: shouldShowInFee
                });

                    // Log action dynamically
                    await logAction(
                        req,
                        'update_student',
                        'User',
                        student._id,
                        `Fee Bulk Override (${operation})`,
                        `Fee for ${student.name} changed from ₹${currentPrice} to ₹${newPrice}${sendEmail ? (emailSent ? ' (Email sent)' : ' (Email failed)') : ' (No email sent)'}`
                    );
                }
            }

            res.status(200).json({
            success: true,
            message: `Successfully updated fees for ${updateCount} students.`,
            updateCount,
            sendEmail: !!sendEmail,
            students: updatedDetails
        });
    } catch (error) {
        console.error('Bulk fee update error:', error);
        res.status(500).json({ success: false, message: 'Server error during bulk fee update.', error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const {
            name, email, mobile, address, isActive, studentId, joinedAt, password, gender,
            fatherName, guardianName, guardianPhone, dob, aadharNo, lockerNo, registrationFee,
            showInFeeManagement
        } = req.body;

        const updateData = { 
            name, 
            email: email ? email.toLowerCase() : undefined, 
            mobile, 
            address, 
            isActive, 
            studentId,
            gender
        };

        if (showInFeeManagement !== undefined) updateData.showInFeeManagement = !!showInFeeManagement;
        if (fatherName !== undefined) updateData.fatherName = fatherName;
        if (guardianName !== undefined) updateData.guardianName = guardianName;
        if (guardianPhone !== undefined) updateData.guardianPhone = guardianPhone;
        if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
        if (aadharNo !== undefined) updateData.aadharNo = aadharNo;
        if (lockerNo !== undefined) updateData.lockerNo = lockerNo;
        if (registrationFee !== undefined) updateData.registrationFee = Number(registrationFee) || 0;

        // Handle password update if provided
        if (password && password.trim() !== '') {
            updateData.password = password;
        }

        if (joinedAt) {
            // Update admissionDate (effective date for calculations), NOT createdAt
            updateData.admissionDate = new Date(joinedAt);
        }

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const student = await User.findById(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        let targetAdmissionDate = joinedAt ? new Date(joinedAt) : null;
        let statusChanged = false;

        // If reactivating (explicitly setting isActive to true), reset seat/shift
        // We verify current state first to ensure we don't wipe active students' seats on profile edits
        if (isActive !== undefined && isActive !== student.isActive) {
            statusChanged = true;
            if (isActive === true) {
                // Was inactive, now activating -> RESET SEAT logic
                updateData.seat = null;
                updateData.seatAssignedAt = null;
                updateData.inactivationStatus = 'none';

                // Note: We don't have a direct 'shift' field on User (it's in seat assignments), 
                // but clearing the seat link effectively removes the shift association for the student.

                console.log(`Resetting seat for reactivated student: ${student.name}`);

                // Heal fees: any fee with a paidDate but still 'pending'/'overdue' should be 'paid'
                const healed = await Fee.updateMany(
                    { student: student._id, paidDate: { $ne: null }, status: { $in: ['pending', 'overdue'] } },
                    { $set: { status: 'paid' } }
                );
                if (healed.modifiedCount > 0) {
                    console.log(`Healed ${healed.modifiedCount} fee record(s) for reactivated student: ${student.name}`);
                }

                // Cancel ALL remaining pending/overdue fees — the student is starting fresh
                // with a new admission date, so old unpaid dues should not carry forward.
                const cancelled = await Fee.updateMany(
                    {
                        student: student._id,
                        status: { $in: ['pending', 'overdue'] }
                    },
                    { $set: { status: 'cancelled', cancelledReason: 'inactive_period' } }
                );
                if (cancelled.modifiedCount > 0) {
                    console.log(`Auto-cancelled ${cancelled.modifiedCount} outstanding fee(s) on reactivation for: ${student.name}`);
                }

                // Inactive -> active transition: set admissionDate from request or default to now
                if (!joinedAt) {
                    targetAdmissionDate = new Date();
                    updateData.admissionDate = targetAdmissionDate;
                }
            }
        }

        // Record status history transition
        // admissionDate field = effective admission for calculations (never touches createdAt)
        const effectiveAdmissionDate = targetAdmissionDate || student.admissionDate || student.createdAt || new Date();
        if (statusChanged) {
            if (!student.statusHistory) student.statusHistory = [];
            student.statusHistory.push({
                status: isActive ? 'active' : 'inactive',
                date: new Date(),
                admissionDate: effectiveAdmissionDate
            });
        } else if (joinedAt) {
            // Log manually updated admission date
            if (!student.statusHistory) student.statusHistory = [];
            student.statusHistory.push({
                status: student.isActive ? 'active' : 'inactive',
                date: new Date(),
                admissionDate: new Date(joinedAt)
            });
        }

        // Apply updates
        Object.assign(student, updateData);
        if (password && password.trim() !== '') {
            student.password = password;
        }

        await student.save();

        // Update admissionDate via raw MongoDB to ensure it's always set
        // (createdAt is NEVER modified — it stays as the original document creation timestamp)
        const admissionDateToWrite = updateData.admissionDate || targetAdmissionDate;
        if (admissionDateToWrite) {
            await User.collection.updateOne(
                { _id: student._id },
                { $set: { admissionDate: admissionDateToWrite } }
            );
        }
        const { negotiatedPrice, shift: newShift } = req.body;
        let newPrice; // declared here so it's accessible in the log section below

        // ─── Update negotiated price on active seat assignment ───────────
        if (negotiatedPrice !== undefined && negotiatedPrice !== '' && !isNaN(Number(negotiatedPrice))) {
            newPrice = Number(negotiatedPrice);

            // Use direct MongoDB update to safely patch nested array subdocuments
            // (avoids Mongoose markModified issues with deeply nested paths)
            const seatUpdateResult = await Seat.updateOne(
                {
                    'assignments.student': student._id,
                    'assignments.status': 'active'
                },
                {
                    $set: {
                        'assignments.$[elem].price': newPrice
                    }
                },
                {
                    arrayFilters: [
                        { 'elem.student': student._id, 'elem.status': 'active' }
                    ],
                    multi: true
                }
            );

            // Patch ALL unpaid fee records for this student (pending, overdue, partial)
            await Fee.updateMany(
                {
                    student: student._id,
                    status: { $in: ['pending', 'overdue', 'partial'] }
                },
                { $set: { amount: newPrice } }
            );

            console.log(`Negotiated price updated to ₹${newPrice} for student ${student.name}. Seat updated: ${seatUpdateResult.modifiedCount > 0}`);
        }

        // ─── Update shift on active seat assignment (if shift field sent) ─
        if (newShift !== undefined && newShift !== '' && mongoose.Types.ObjectId.isValid(newShift)) {
            // Find the student's own seat directly (faster + more reliable than searching all seats)
            const studentSeatId = student.seat;
            let shiftUpdateResult;
            if (studentSeatId) {
                shiftUpdateResult = await Seat.updateOne(
                    { _id: studentSeatId, 'assignments.student': student._id, 'assignments.status': 'active' },
                    {
                        $set: { 'assignments.$[elem].shift': new mongoose.Types.ObjectId(newShift) },
                        $unset: { 'assignments.$[elem].legacyShift': '' }
                    },
                    { arrayFilters: [{ 'elem.student': student._id, 'elem.status': 'active' }] }
                );
            } else {
                // Fallback: search all seats
                shiftUpdateResult = await Seat.updateOne(
                    { 'assignments.student': student._id, 'assignments.status': 'active' },
                    {
                        $set: { 'assignments.$[elem].shift': new mongoose.Types.ObjectId(newShift) },
                        $unset: { 'assignments.$[elem].legacyShift': '' }
                    },
                    { arrayFilters: [{ 'elem.student': student._id, 'elem.status': 'active' }] }
                );
            }
            console.log(`Shift updated to '${newShift}' for student ${student.name}. Seat modified: ${shiftUpdateResult?.modifiedCount > 0}. SeatId: ${studentSeatId}`);
        }

        // Log action
        if (statusChanged) {
            await logAction(
                req,
                isActive ? 'student_activated' : 'student_deactivated',
                'User',
                student._id,
                student.name,
                `Scholar status changed to ${isActive ? 'Active (Reactivated)' : 'Inactive (Deactivated)'}`
            );
        } else {
            await logAction(req, 'student_updated', 'User', student._id, student.name, `Updated scholar profile: ${student.name}`);
        }

        if (req.body.showInFeeManagement !== undefined) {
            await logAction(
                req,
                'visibility_changed',
                'User',
                student._id,
                student.name,
                `Fee Management visibility set to ${req.body.showInFeeManagement ? 'Visible in Ledger' : 'Hidden from Ledger'}`
            );
        }

        if (negotiatedPrice !== undefined && negotiatedPrice !== '' && newPrice !== undefined) {
            await logAction(
                req,
                'fee_updated',
                'User',
                student._id,
                student.name,
                `Monthly fee rate set to ₹${newPrice}`
            );
        }


        // Send Profile Update Email if requested
        if (req.body.sendMail) {
            try {
                await emailService.sendProfileUpdateEmail(student);
            } catch (emailErr) {
                console.error("Failed to send profile update email:", emailErr);
                // Continue execution even if email fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete student (with password verification)
// Soft delete for active students, permanent delete for inactive students
exports.deleteStudent = async (req, res) => {
    try {
        const { password } = req.body;

        // Verify admin password
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Admin password is required'
            });
        }

        const admin = await User.findById(req.user.id).select('+password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const isPasswordValid = await admin.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password'
            });
        }

        // Find student
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Free up student's seat if assigned
        const assignedSeats = await Seat.find({ 'assignments.student': student._id });

        for (const seat of assignedSeats) {
            // Remove the student's assignment
            seat.assignments = seat.assignments.filter(a => a.student.toString() !== student._id.toString());

            // Check if occupied
            const activeAssignments = seat.assignments.filter(a => a.status === 'active');
            seat.isOccupied = activeAssignments.length > 0;

            await seat.save();
        }

        const { forceDelete } = req.body;

        if (student.isActive && !forceDelete) {
            // Soft delete - Mark student as inactive
            student.isActive = false;
            if (!student.statusHistory) student.statusHistory = [];
            student.statusHistory.push({
                status: 'inactive',
                date: new Date()
            });
            await student.save();

            // Log action
            await logAction(req, 'student_deactivated', 'User', student._id, student.name, 'Marked inactive (deactivated) and desk seat freed');

            res.status(200).json({
                success: true,
                message: 'Student marked as inactive and seat freed'
            });
        } else {
            // Hard delete - Archive then permanently remove

            // 1. Gather all data for archive
            const attendanceRecords = await Attendance.find({ student: req.params.id });
            const feeRecords = await Fee.find({ student: req.params.id });
            const requestRecords = await Request.find({ student: req.params.id });

            // 2. Create Archive Record
            await ArchivedStudent.create({
                originalId: student._id,
                name: student.name,
                email: student.email,
                phoneNumber: student.phoneNumber,
                guardianName: student.guardianName,
                guardianPhone: student.guardianPhone,
                address: student.address,
                profileImage: student.profileImage,
                joinedAt: student.createdAt,
                deletedBy: req.user.id,

                // Snapshots
                fees: feeRecords.map(f => ({
                    amount: f.amount,
                    month: f.month,
                    year: f.year,
                    status: f.status,
                    paidDate: f.paidDate,
                    dueDate: f.dueDate
                })),

                attendance: attendanceRecords.map(a => ({
                    date: a.date,
                    status: a.status
                })),

                requests: requestRecords.map(r => ({
                    type: r.type,
                    status: r.status,
                    createdAt: r.createdAt,
                    adminResponse: r.adminResponse
                }))
            });

            // 3. Permanently remove from active tables
            await User.findByIdAndDelete(req.params.id);

            // Deleting related data
            await Attendance.deleteMany({ student: req.params.id });
            await Fee.deleteMany({ student: req.params.id });
            await Notification.deleteMany({ recipient: req.params.id });
            await Request.deleteMany({ student: req.params.id });
            await PasswordLog.deleteMany({ user: req.params.id });

            // Log action
            await logAction(req, 'student_deleted_hard', 'User', req.params.id, student.name, 'Permanently deleted and archived student data');

            res.status(200).json({
                success: true,
                message: 'Student archived and permanently deleted from active records'
            });
        }
    } catch (error) {
        console.error('❌ Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Sub-admin request student inactivation (vacates seat immediately & awaits super admin approval)
// @route   POST /api/admin/students/:id/inactivate-request
exports.requestStudentInactivation = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Free up student's seat immediately, capturing all desk details first
        let assignedSeats = await Seat.find({ 'assignments.student': student._id }).populate('room floor');
        if (assignedSeats.length === 0 && student.seat) {
            const fallbackSeat = await Seat.findById(student.seat).populate('room floor');
            if (fallbackSeat) assignedSeats = [fallbackSeat];
        }

        let vacatedSeatDesc = null;
        let originalSeatData = null;

        for (const seat of assignedSeats) {
            const userAssign = seat.assignments.find(a => a.student.toString() === student._id.toString());
            if (userAssign) {
                originalSeatData = {
                    seatId: seat._id,
                    seatNumber: seat.number,
                    shift: userAssign.shift || student.shift,
                    shifts: userAssign.shifts || student.shifts || [],
                    legacyShift: userAssign.legacyShift || null,
                    type: userAssign.type || 'specific',
                    price: userAssign.price || seat.price || 800,
                    assignedAt: userAssign.assignedAt || student.seatAssignedAt,
                    room: seat.room ? (seat.room.name || seat.room.roomId || seat.room) : null,
                    floor: seat.floor ? (seat.floor.name || seat.floor) : null
                };
                vacatedSeatDesc = `Seat ${seat.number}${seat.room ? ` (${seat.room.name || seat.room.roomId || ''})` : ''}`;
            } else if (!originalSeatData) {
                originalSeatData = {
                    seatId: seat._id,
                    seatNumber: seat.number,
                    shift: student.shift,
                    shifts: student.shifts || [],
                    legacyShift: null,
                    type: 'specific',
                    price: seat.price || 800,
                    room: seat.room ? (seat.room.name || seat.room.roomId || seat.room) : null,
                    floor: seat.floor ? (seat.floor.name || seat.floor) : null
                };
                vacatedSeatDesc = `Seat ${seat.number}`;
            }
            seat.assignments = seat.assignments.filter(a => a.student.toString() !== student._id.toString());
            const activeAssignments = seat.assignments.filter(a => a.status === 'active');
            seat.isOccupied = activeAssignments.length > 0;
            await seat.save();
        }

        // Mark student as inactive with awaited status
        student.isActive = false;
        student.inactivationStatus = 'awaited';
        student.seat = null;
        student.seatAssignedAt = null;
        if (!student.statusHistory) student.statusHistory = [];
        student.statusHistory.push({
            status: 'inactive',
            date: new Date(),
            reason: `Sub-admin ${req.user.name || 'Staff'} requested inactivation (awaited)`
        });
        await student.save();

        // Create Inactivation Approval Request
        const ticketId = `REQ-INACT-${Date.now().toString().slice(-6)}`;
        const inactRequest = await Request.create({
            ticketId,
            student: student._id,
            type: 'inactivation',
            currentData: {
                vacatedSeat: vacatedSeatDesc || 'No physical desk assigned',
                originalSeat: originalSeatData,
                studentName: student.name,
                mobile: student.mobile || student.phoneNumber || '',
                email: student.email,
                shift: student.shift,
                shifts: student.shifts || []
            },
            requestedData: {
                action: 'inactivate',
                subAdminName: req.user.name || 'Staff Sub-Admin',
                subAdminEmail: req.user.email,
                subAdminId: req.user.id,
                reason: req.body.reason || 'Sub-admin requested scholar inactivation'
            },
            status: 'pending'
        });

        // Notify all Super Admins
        const superAdmins = await User.find({ role: 'admin' });
        for (const admin of superAdmins) {
            await Notification.create({
                recipient: admin._id,
                title: 'Student Inactivation Request',
                message: `Sub-admin ${req.user.name || 'Staff'} marked ${student.name} as inactive. Assigned seat was vacated immediately. Awaiting Super Admin approval.`,
                type: 'request',
                createdBy: req.user.id
            });
        }

        // Log action in audit history
        await logAction(
            req,
            'student_inactivation_requested',
            'User',
            student._id,
            student.name,
            `Sub-admin ${req.user.name || 'Staff'} marked scholar inactive (seat vacated; approval request sent to Super Admin)`
        );

        res.status(200).json({
            success: true,
            message: `Scholar ${student.name} marked inactive (awaited). Desk vacated and approval request routed to Super Admin.`,
            student,
            request: inactRequest
        });
    } catch (error) {
        console.error('Request student inactivation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while requesting student inactivation',
            error: error.message
        });
    }
};

// Get floors
// @desc    Get all floors with rooms and seats (Dynamic Availability)
// @route   GET /api/admin/floors
// Create new floor
exports.createFloor = async (req, res) => {
    try {
        console.log('Creating floor, User:', req.user ? req.user.id : 'UNDEFINED');
        const { name, level } = req.body;

        const floor = await Floor.create({
            name,
            level,
            rooms: []
        });
        console.log('Floor created:', floor._id);

        if (req.user) {
            await logAction(req, 'create_floor', 'Floor', floor._id, floor.name, `Created floor ${floor.name}`);
        } else {
            console.log('Skipping logAction because req.user is missing');
        }

        res.status(201).json({
            success: true,
            floor
        });
    } catch (error) {
        console.error('Create Floor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create new room
exports.createRoom = async (req, res) => {
    try {
        const { name, floorId, width, height, roomId } = req.body;

        const room = await Room.create({
            name,
            roomId,
            floor: floorId,
            grid: { width, height },
            seats: []
        });

        // Add room to floor
        await Floor.findByIdAndUpdate(floorId, {
            $push: { rooms: room._id }
        });

        await logAction(req, 'create_room', 'Room', room._id, room.name, `Created room ${room.name}`);

        res.status(201).json({
            success: true,
            room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update room
exports.updateRoom = async (req, res) => {
    try {
        const { name, hasAc, acPosition, roomId } = req.body;

        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { name, hasAc, acPosition, roomId },
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        await logAction(req, 'update_room', 'Room', room._id, room.name, `Updated room config for ${room.name}`);

        res.status(200).json({
            success: true,
            room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getFloors = async (req, res) => {
    try {
        const { shiftId } = req.query; // Optional specific shift to view availability for

        // Check if we are in "Custom Shift Mode" (any custom shifts exist)
        const customShiftsCount = await Shift.countDocuments({ isActive: true });
        const isCustomMode = customShiftsCount > 0;

        const floors = await Floor.find()
            .populate({
                path: 'rooms',
                populate: {
                    path: 'seats',
                    model: 'Seat',
                    populate: [
                        {
                            path: 'assignments.student',
                            select: 'name email profileImage isActive' // Reduced fields for performance
                        },
                        {
                            path: 'assignments.shift',
                            select: 'name startTime endTime'
                        }
                    ]
                }
            })
            .sort({ level: 1 })
            .lean(); // Use lean() for read-only data (10-50x faster)

        // Self-Healing: Check for and remove orphaned assignments (deleted students)
        for (const floor of floors) {
            for (const room of floor.rooms) {
                for (const seat of room.seats) {
                    let changed = false;
                    // assignments is populated, so a.student will be null if user doesn't exist
                    const originalLength = seat.assignments.length;
                    const validAssignments = seat.assignments.filter(a => a.student !== null);

                    if (validAssignments.length !== originalLength) {
                        seat.assignments = validAssignments;
                        // Recalculate isOccupied flag for DB consistency
                        const active = seat.assignments.filter(a => a.status === 'active');
                        seat.isOccupied = active.length > 0;
                        await seat.save();
                        console.log(`Fixed zombie seat ${seat.number}`);
                    }
                }
            }
        }

        const processedFloors = floors.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => ({
                ...room,
                seats: room.seats.map(seat => {
                    const seatObj = seat; // Already a plain object from lean()
                    let isOccupied = false;
                    let displayAssignment = null;
                    let displayShift = null;
                    let shiftDetails = null;

                    // Get active assignments
                    const assignments = seat.assignments ? seat.assignments.filter(a => a.status === 'active') : [];

                    // 1. Check for Full Day Blockers (Always blocks everything)
                    const fullDayBlocker = assignments.find(a => a.type === 'full_day' || a.legacyShift === 'full');

                    if (fullDayBlocker) {
                        isOccupied = true;
                        displayAssignment = fullDayBlocker.student; // Show who booked full day
                        displayShift = 'full';
                        shiftDetails = { startTime: '00:00', endTime: '23:59' }; // Full day
                    }
                    // 2. Specific Shift Logic
                    else if (shiftId) {
                        // Admin wants to see availability for SPECIFIC shift ID
                        if (shiftId === 'full') {
                            isOccupied = assignments.length > 0;
                            if (isOccupied) {
                                displayAssignment = assignments[0].student;
                                displayShift = assignments[0].shift?.name || assignments[0].shift;
                                if (assignments[0].shift && assignments[0].shift.startTime) {
                                    shiftDetails = {
                                        startTime: assignments[0].shift.startTime,
                                        endTime: assignments[0].shift.endTime
                                    };
                                }
                            }
                        } else if (shiftId === 'day' || shiftId === 'night') {
                            // Legacy View specific
                            const occupied = assignments.find(a => a.legacyShift === shiftId);
                            if (occupied) {
                                isOccupied = true;
                                displayAssignment = occupied.student;
                                displayShift = occupied.legacyShift;
                            }
                        } else {
                            // Custom Shift ID View
                            const shiftAssignment = assignments.find(a => a.shift && a.shift._id.toString() === shiftId);
                            if (shiftAssignment) {
                                isOccupied = true;
                                displayAssignment = shiftAssignment.student;
                                displayShift = shiftAssignment.shift?.name || shiftAssignment.shift;
                                if (shiftAssignment.shift && shiftAssignment.shift.startTime) {
                                    shiftDetails = {
                                        startTime: shiftAssignment.shift.startTime,
                                        endTime: shiftAssignment.shift.endTime
                                    };
                                }
                            }
                        }
                    }
                    // 3. General Overview (No shift selected)
                    else {
                        isOccupied = assignments.length > 0;
                        if (isOccupied) {
                            displayAssignment = assignments[0].student;
                            displayShift = assignments[0].shift?.name || assignments[0].shift;
                            if (assignments[0].shift && assignments[0].shift.startTime) {
                                shiftDetails = {
                                    startTime: assignments[0].shift.startTime,
                                    endTime: assignments[0].shift.endTime
                                };
                            }
                        }
                    }

                    return {
                        ...seatObj,
                        room: { roomId: room.roomId || null, name: room.name, hasAc: room.hasAc },
                        isOccupied, // Computed dynamic status
                        assignedTo: displayAssignment ? {
                            ...displayAssignment,
                            shift: displayShift,
                            shiftId: displayShift === 'full' ? 'full' : (shiftDetails ? displayShift : null),
                            shiftDetails
                        } : null, // Computed 'primary' user for this view
                        shift: displayShift, // Computed active shift
                        shiftDetails, // Computed shift times
                        assignments: assignments // Pass full list for detailed tooltip
                    };
                })
            }))
        }));

        res.status(200).json({
            success: true,
            floors: processedFloors,
            isCustomMode
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update prices
exports.updatePrices = async (req, res) => {
    try {
        const { dayPrice, nightPrice, fullPrice } = req.body;

        await Seat.updateMany({}, {
            $set: {
                'basePrices.day': dayPrice,
                'basePrices.night': nightPrice,
                'basePrices.full': fullPrice
            }
        });

        res.status(200).json({
            success: true,
            message: 'Prices updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete floor
exports.deleteFloor = async (req, res) => {
    try {
        const floor = await Floor.findById(req.params.id).populate({
            path: 'rooms',
            populate: { path: 'seats' }
        });

        if (!floor) {
            return res.status(404).json({ success: false, message: 'Floor not found' });
        }

        // Check for occupied seats
        let isOccupied = false;
        floor.rooms.forEach(room => {
            room.seats.forEach(seat => {
                const active = seat.assignments.filter(a => a.status === 'active');
                if (active.length > 0) isOccupied = true;
            });
        });

        if (isOccupied) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete floor: Contains active students'
            });
        }

        // Delete all seats and rooms
        for (const room of floor.rooms) {
            await Seat.deleteMany({ _id: { $in: room.seats.map(s => s._id) } });
            await Room.findByIdAndDelete(room._id);
        }

        await Floor.findByIdAndDelete(req.params.id);

        await logAction(req, 'delete_floor', 'Floor', floor._id, floor.name, `Deleted floor ${floor.name}`);

        res.status(200).json({
            success: true,
            message: 'Floor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete room
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('seats');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Check for occupied seats
        let isOccupied = false;
        room.seats.forEach(seat => {
            const active = seat.assignments.filter(a => a.status === 'active');
            if (active.length > 0) isOccupied = true;
        });

        if (isOccupied) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete room: Contains active students'
            });
        }

        // Delete seats
        await Seat.deleteMany({ _id: { $in: room.seats.map(s => s._id) } });

        // Remove room from floor
        await Floor.findByIdAndUpdate(room.floor, {
            $pull: { rooms: room._id }
        });

        await Room.findByIdAndDelete(req.params.id);

        await logAction(req, 'delete_room', 'Room', room._id, room.name, `Deleted room ${room.name}`);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Assign seat
exports.assignSeat = async (req, res) => {
    try {
        // Accept shifts[] array OR single shift (backward compat)
        const { seatId, studentId, shift, shifts: shiftsInput, negotiatedPrice } = req.body;
        const shiftIds = (shiftsInput && shiftsInput.length > 0) ? shiftsInput : (shift ? [shift] : []);

        // Validate inputs
        if (!seatId && shiftIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide at least seat or shift to update' });
        }
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        let seat = null;
        if (seatId) {
            seat = await Seat.findById(seatId).populate('floor room');
            if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
        }

        // Check shift availability against OTHER students only
        if (seatId && shiftIds.length > 0) {
            const { doTimeRangesOverlap } = require('../utils/timeUtils');
            const otherActive = seat.assignments.filter(
                a => a.status === 'active' && a.student.toString() !== studentId.toString()
            );

            if (otherActive.some(a => a.type === 'full_day')) {
                return res.status(400).json({ success: false, message: 'Seat is fully occupied (Full Day)' });
            }

            const requestedShifts = await Shift.find({ _id: { $in: shiftIds } });
            if (requestedShifts.length !== shiftIds.length) {
                return res.status(404).json({ success: false, message: 'One or more shifts not found' });
            }

            for (const reqShift of requestedShifts) {
                for (const asgn of otherActive) {
                    if (asgn.shift) {
                        const asgnShift = await Shift.findById(asgn.shift);
                        if (asgnShift && doTimeRangesOverlap(reqShift.startTime, reqShift.endTime, asgnShift.startTime, asgnShift.endTime)) {
                            return res.status(400).json({
                                success: false,
                                message: `Seat occupied during ${reqShift.name}. Conflict with ${asgnShift.name} (${asgnShift.startTime}-${asgnShift.endTime})`,
                                conflictingShift: { name: asgnShift.name, startTime: asgnShift.startTime, endTime: asgnShift.endTime }
                            });
                        }
                    }
                }
            }
        }

        // 3. Remove student from any previous active seat assignments (Move student)
        // First find old seats to update their isOccupied status later
        const previousSeats = await Seat.find({
            'assignments': { $elemMatch: { student: studentId, status: 'active' } }
        });

        // Cancel previous assignments
        await Seat.updateMany(
            { 'assignments': { $elemMatch: { student: studentId, status: 'active' } } },
            {
                $set: {
                    'assignments.$[elem].status': 'cancelled',
                    'assignments.$[elem].endDate': new Date()
                }
            },
            { arrayFilters: [{ 'elem.student': new mongoose.Types.ObjectId(studentId), 'elem.status': 'active' }] }
        );

        // Update isOccupied flag for previous seats
        for (const prevSeat of previousSeats) {
            // Re-fetch to check remaining active assignments
            const updatedSeat = await Seat.findById(prevSeat._id);
            const hasActive = updatedSeat.assignments.some(a => a.status === 'active');
            if (!hasActive) {
                updatedSeat.isOccupied = false;
                updatedSeat.assignedTo = null; // Clear legacy field
                updatedSeat.shift = null;      // Clear legacy field
                await updatedSeat.save();
            }
        }

        // 4. Create one assignment per requested shift
        if (seatId && shiftIds.length > 0) {
            // Calculate total price: negotiatedPrice OR sum of each shift's price
            let totalPrice = 0;
            if (negotiatedPrice) {
                totalPrice = Number(negotiatedPrice);
            } else {
                for (const shiftId of shiftIds) {
                    totalPrice += seat.shiftPrices?.get(shiftId) || seat.basePrices?.day || 0;
                }
            }

            // Create one assignment per shift; only the first carries the total fee price
            shiftIds.forEach((shiftId, index) => {
                seat.assignments.push({
                    student: student._id,
                    shift: shiftId,
                    type: 'specific',
                    status: 'active',
                    assignedAt: new Date(),
                    price: index === 0 ? totalPrice : 0  // total on first, 0 on rest
                });
            });

            const newAssignment = { price: totalPrice }; // for fee creation below
            seat.isOccupied = true;
            await seat.save();

            // expose newAssignment for fee logic below
            var _newAssignmentPrice = totalPrice;

            // Update student reference (Only set seatAssignedAt if not already set)
            const userUpdateUpdates = { seat: seatId };
            if (!student.seatAssignedAt) {
                userUpdateUpdates.seatAssignedAt = new Date();
            }
            await User.findByIdAndUpdate(studentId, userUpdateUpdates);

            const now = new Date();

            // Calculate billing cycle based on student's ADMISSION date (not account creation date).
            // For reactivated students, admissionDate is set to the new activation date.
            // Fallback chain: admissionDate → seatAssignedAt → createdAt → today
            const joinedDate = student.admissionDate
                ? new Date(student.admissionDate)
                : student.seatAssignedAt
                    ? new Date(student.seatAssignedAt)
                    : student.createdAt
                        ? new Date(student.createdAt)
                        : new Date();
            const joinedDay  = joinedDate.getDate();

            // Determine which month/year the fee belongs to
            // Rule: the billing cycle starts on joinedDay each month.
            // If today is past joinedDay in the current month → current month's cycle
            // If today is before joinedDay in the current month → previous month's cycle
            // But if joinedDate itself is in a past month → use joinedDate's month/year for first fee
            let feeMonth, feeYear;
            const joinedMonth = joinedDate.getMonth() + 1; // 1-indexed
            const joinedYear  = joinedDate.getFullYear();
            const todayMonth  = now.getMonth() + 1;
            const todayYear   = now.getFullYear();

            if (joinedYear < todayYear || (joinedYear === todayYear && joinedMonth < todayMonth)) {
                // Joined in a previous month — first fee is for that joined month
                feeMonth = joinedMonth;
                feeYear  = joinedYear;
            } else {
                // Joined this month
                feeMonth = todayMonth;
                feeYear  = todayYear;
            }

            // dueDate = the joinedDay of feeMonth/feeYear
            const dueDate = new Date(feeYear, feeMonth - 1, joinedDay);

            // Create or update fee record
            // NEVER overwrite a fee that's already paid.
            // If fee was cancelled (e.g. from reactivation cleanup), restore it to pending.
            const existingFee = await Fee.findOne({
                student: studentId,
                month: feeMonth,
                year: feeYear
            });

            if (!existingFee) {
                await Fee.create({
                    student: studentId,
                    month: feeMonth,
                    year: feeYear,
                    amount: _newAssignmentPrice || 0,
                    dueDate,
                    status: 'pending'
                });
            } else if (existingFee.status === 'paid') {
                // Already paid — only update amount if it changed, leave status alone
                if (existingFee.amount !== _newAssignmentPrice) {
                    await Fee.findByIdAndUpdate(existingFee._id, { amount: _newAssignmentPrice || 0 });
                }
            } else {
                // pending / overdue / cancelled / partial → restore to pending with new amount
                await Fee.findByIdAndUpdate(existingFee._id, {
                    amount: _newAssignmentPrice || 0,
                    dueDate,
                    status: 'pending',
                    $unset: { cancelledReason: '' }
                });
            }



            await Notification.create({
                recipient: studentId,
                title: 'Seat Assigned',
                message: `Your seat ${seat.number} has been assigned.`,
                type: 'seat',
                createdBy: req.user.id
            });

            // Send seat assignment email
            try {
                // Resolve shift name(s) from shiftIds array
                let shiftName = 'N/A';
                try {
                    const resolvedShifts = await Shift.find({ _id: { $in: shiftIds } });
                    if (resolvedShifts.length > 0) {
                        shiftName = resolvedShifts.map(s => s.name).join(' + ');
                    } else if (shift) {
                        // Fallback: single shift passed directly
                        const shiftObj = await Shift.findById(shift);
                        if (shiftObj) shiftName = shiftObj.name;
                    }
                } catch (ignore) {
                    console.log('Could not resolve shift name');
                }

                await emailService.sendSeatAssignmentEmail(
                    student,
                    {
                        ...seat.toObject(),
                        currentPrice: newAssignment.price
                    },
                    shiftName
                );
            } catch (emailError) {
                console.error('Seat assignment email failed:', emailError.message);
            }

            // Log action
            await logAction(req, 'seat_assigned', 'Seat', seat._id, seat.number, `Assigned to ${student.name}`);

            try {
                const redis = getClient();
                await redis.del('seats:vacant');
                await redis.del('seats:public');
            } catch (err) {}

            res.status(200).json({
                success: true,
                message: 'Seat assigned successfully'
            });
        } else {
            // This shouldn't happen as we validate at the start, but handle gracefully
            return res.status(400).json({
                success: false,
                message: 'Both seat and shift are required for seat assignment'
            });
        }
    } catch (error) {
        console.error('Assign seat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { date, attendanceData } = req.body;

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const promises = attendanceData.map(async ({ studentId, status, entryTime, exitTime, notes }) => {
            const updateData = {
                status,
                markedBy: req.user.id
            };

            if (status === 'absent' || status === 'on_leave') {
                updateData.entryTime = null;
                updateData.exitTime = null;
                updateData.duration = 0;
            }

            // Add optional fields if provided — treat empty string as null
            if (entryTime !== undefined) updateData.entryTime = entryTime || null;
            if (exitTime !== undefined) updateData.exitTime = exitTime || null;
            if (notes !== undefined) updateData.notes = notes;

            // Explicitly calculate duration if both times provided
            if (updateData.entryTime && updateData.exitTime) {
                const [entryHour, entryMin] = updateData.entryTime.split(':').map(Number);
                const [exitHour, exitMin] = updateData.exitTime.split(':').map(Number);
                const entryMinutes = entryHour * 60 + entryMin;
                let exitMinutes = exitHour * 60 + exitMin;
                if (exitMinutes < entryMinutes) exitMinutes += 24 * 60; // Overnight
                updateData.duration = exitMinutes - entryMinutes;
                updateData.isActive = false;
            }

            // Fetch student to check registration date (admission date)
            const student = await User.findById(studentId).select('createdAt');
            if (!student) return null; // Skip if student not found

            const admissionDate = new Date(student.createdAt);
            admissionDate.setHours(0, 0, 0, 0);

            // Do not allow marking attendance BEFORE admission date
            if (attendanceDate < admissionDate) {
                return null; // Skip marking attendance
            }

            // Use date RANGE to find existing record (fixes IST/UTC timezone mismatch
            // where student-stored dates may differ from admin midnight by server timezone)
            const nextDay = new Date(attendanceDate);
            nextDay.setDate(attendanceDate.getDate() + 1);

            const existingAttendance = await Attendance.findOne({
                student: studentId,
                date: { $gte: attendanceDate, $lt: nextDay }
            }).sort({ _id: -1 }); // latest record first — matches what getSeatViewAttendance displays

            // Sub-Admins cannot override student self-marked attendance
            // Also block if markedBy === studentId (fallback for records without selfMarked flag)
            const isEffectivelySelfMarked = existingAttendance &&
                (existingAttendance.selfMarked ||
                 (existingAttendance.markedBy && existingAttendance.markedBy.toString() === studentId.toString()));

            if (isEffectivelySelfMarked && req.user.role === 'subadmin') {
                return null;
            }

            // Super-admin overriding self-marked: clear the flag
            if (isEffectivelySelfMarked && req.user.role !== 'subadmin') {
                updateData.selfMarked = false;
            }

            if (existingAttendance) {
                // Update the EXACT document by _id (avoids any date mismatch on upsert)
                return await Attendance.findOneAndUpdate(
                    { _id: existingAttendance._id },
                    { $set: updateData },
                    { new: true }
                );
            } else {
                // No existing record — create new with consistent UTC midnight date
                return await Attendance.findOneAndUpdate(
                    { student: studentId, date: attendanceDate },
                    { $set: updateData },
                    { upsert: true, new: true }
                );
            }
        });

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ─── GET /admin/attendance/seat-view/:date ────────────────────────────────────
// Returns all active students sorted by seat number, merged with that day's
// attendance status. Used by the new toggle-based Mark Attendance UI.
exports.getSeatViewAttendance = async (req, res) => {
    try {
        const dateStr = req.params.date; // YYYY-MM-DD
        const attendanceDate = new Date(dateStr);
        attendanceDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(attendanceDate);
        nextDay.setDate(attendanceDate.getDate() + 1);

        // 1. All active students with seat + shift info
        const students = await User.find({ role: 'student', isActive: true })
            .populate({
                path: 'seat',
                select: 'number assignments',
                populate: { path: 'assignments.shift', select: 'name startTime endTime' }
            })
            .select('name email mobile seat createdAt')
            .lean();

        // 2. Attendance records for this date — sort ascending so latest record wins in the map
        const records = await Attendance.find({
            date: { $gte: attendanceDate, $lt: nextDay }
        }).sort({ _id: 1 }).select('student status markedBy selfMarked entryTime exitTime distanceMeters').lean();

        const recordMap = {};
        records.forEach(r => { recordMap[r.student.toString()] = r; });

        // 3. Merge and extract shift name per student
        const result = students
            .filter(s => {
                // Skip students admitted after selected date
                const admitted = new Date(s.createdAt);
                admitted.setHours(0, 0, 0, 0);
                return attendanceDate >= admitted;
            })
            .map(s => {
                // Get shift name from active assignment
                let shiftName = 'N/A';
                if (s.seat && s.seat.assignments) {
                    const active = s.seat.assignments.find(
                        a => a.status === 'active' && a.student?.toString() === s._id.toString()
                    );
                    if (active && active.shift && active.shift.name) {
                        shiftName = active.shift.name;
                    }
                }

                const rec = recordMap[s._id.toString()];
                const status = rec ? rec.status : 'absent';
                const markedBy = rec ? (rec.markedBy ? rec.markedBy.toString() : null) : null;

                // selfMarked is true if explicit flag is set OR if the student marked themselves
                // (markedBy === student._id). This fallback handles old records before the flag.
                const selfMarked = rec
                    ? (!!rec.selfMarked || markedBy === s._id.toString())
                    : false;

                return {
                    _id: s._id,
                    name: s.name,
                    email: s.email,
                    seatNumber: s.seat ? s.seat.number : null,
                    seatId: s.seat ? s.seat._id : null,
                    shiftName,
                    status,          // 'present' | 'absent' | 'holiday'
                    selfMarked,      // true = student marked themselves
                    markedBy,        // who marked (string id or null)
                    entryTime: rec ? (rec.entryTime || '') : '',
                    exitTime: rec ? (rec.exitTime || '') : '',
                    distanceMeters: rec ? rec.distanceMeters : null,
                    hasSeat: !!s.seat,
                };
            })
            // Sort by seat number numerically (seats without number go to end)
            .sort((a, b) => {
                const na = parseInt(a.seatNumber) || 9999;
                const nb = parseInt(b.seatNumber) || 9999;
                return na - nb;
            });

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.status(200).json({ success: true, students: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get attendance
exports.getAttendance = async (req, res) => {
    try {
        const date = new Date(req.params.date);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        // Use range query for robustness
        const attendance = await Attendance.find({
            date: { $gte: date, $lt: nextDay }
        })
            .populate('student', 'name email createdAt') // Add createdAt to check admission date
            .populate('markedBy', 'name');

        // Filter out orphaned records AND records before the student's admission date
        const filteredAttendance = attendance.filter(record => {
            if (!record.student) return false;

            const admissionDate = new Date(record.student.createdAt);
            admissionDate.setHours(0, 0, 0, 0);

            return record.date >= admissionDate;
        });

        res.status(200).json({
            success: true,
            attendance: filteredAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get monthly attendance report
 exports.getMonthlyAttendance = async (req, res) => {
    try {
        // Accept both path params (:year/:month) and query params (?year=&month=)
        const year  = parseInt(req.params.year  || req.query.year);
        const month = parseInt(req.params.month || req.query.month); // 1-12

        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: 'Valid year and month (1-12) are required' });
        }

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth   = new Date(year, month, 1);

        const attendance = await Attendance.find({
            date: { $gte: startOfMonth, $lt: endOfMonth }
        }).populate('student', 'name email mobile isActive');

        // Fetch seat + shift data for every student in the records
        const studentIds = [...new Set(attendance.map(r => r.student?._id?.toString()).filter(Boolean))];
        const seatMap = {};
        if (studentIds.length > 0) {
            const seats = await Seat.find({
                'assignments.student': { $in: studentIds },
                'assignments.status': 'active'
            }).populate('assignments.shift', 'name');

            seats.forEach(seat => {
                seat.assignments.filter(a => a.status === 'active').forEach(a => {
                    const sid = a.student?.toString();
                    if (sid) {
                        if (!seatMap[sid]) seatMap[sid] = { seatNumber: seat.number, shifts: [] };
                        if (a.shift?.name) seatMap[sid].shifts.push(a.shift.name);
                    }
                });
            });
        }

        res.status(200).json({
            success    : true,
            attendance,          // flat records array — frontend iterates these
            seatMap,             // { studentId: { seatNumber, shifts[] } }
            year,
            month
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};


// Get yearly attendance report
exports.getYearlyAttendance = async (req, res) => {
    try {
        // Accept both path params (:year) and query params (?year=)
        const year = parseInt(req.params.year || req.query.year);

        if (!year) {
            return res.status(400).json({ success: false, message: 'Valid year is required' });
        }

        const startOfYear = new Date(year, 0, 1);
        const endOfYear   = new Date(year + 1, 0, 1);

        const attendance = await Attendance.find({
            date: { $gte: startOfYear, $lt: endOfYear }
        }).populate('student', 'name email mobile isActive');

        // Fetch seat + shift data for every student in the records
        const studentIds = [...new Set(attendance.map(r => r.student?._id?.toString()).filter(Boolean))];
        const seatMap = {};
        if (studentIds.length > 0) {
            const seats = await Seat.find({
                'assignments.student': { $in: studentIds },
                'assignments.status': 'active'
            }).populate('assignments.shift', 'name');

            seats.forEach(seat => {
                seat.assignments.filter(a => a.status === 'active').forEach(a => {
                    const sid = a.student?.toString();
                    if (sid) {
                        if (!seatMap[sid]) seatMap[sid] = { seatNumber: seat.number, shifts: [] };
                        if (a.shift?.name) seatMap[sid].shifts.push(a.shift.name);
                    }
                });
            });
        }

        res.status(200).json({
            success    : true,
            attendance,          // flat records array
            seatMap,             // { studentId: { seatNumber, shifts[] } }
            year
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};


// Quick check-in (mark entry with current time)
exports.quickCheckIn = async (req, res) => {
    try {
        const { studentId } = req.body;

        const now = getISTDate();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        console.log(`[AdminCheckIn] IST Time: ${currentTime}`);

        const attendanceDate = getISTDate();
        attendanceDate.setHours(0, 0, 0, 0);

        let cleanId = studentId;
        if (cleanId && typeof cleanId === 'string' && (cleanId.toUpperCase().startsWith('AL-') || cleanId.toUpperCase().startsWith('HL-'))) {
            cleanId = cleanId.substring(3);
        }

        let student = null;
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
            student = await User.findById(cleanId);
        }
        if (!student && cleanId) {
            student = await User.findOne({
                $or: [
                    { rollNumber: cleanId },
                    { studentId: cleanId },
                    { email: String(cleanId).toLowerCase() },
                    { phone: cleanId }
                ]
            });
        }

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (!student.isActive) {
            return res.status(403).json({ success: false, message: 'Access Denied: Inactive Membership' });
        }

        if (!student.seat) {
            return res.status(403).json({ success: false, message: 'Access Denied: Pending seat allocation' });
        }

        // Sub-Admins cannot override student self-marked attendance
        const existingAttendance = await Attendance.findOne({ student: student._id, date: attendanceDate });
        if (existingAttendance && existingAttendance.selfMarked && req.user.role === 'subadmin') {
            return res.status(403).json({ success: false, message: 'Cannot override student self-marked attendance' });
        }

        const attendance = await Attendance.findOneAndUpdate(
            { student: student._id, date: attendanceDate },
            {
                status: 'present',
                entryTime: currentTime,
                markedBy: req.user.id,
                isActive: true
            },
            { upsert: true, new: true }
        ).populate('student', 'name email');

        res.status(200).json({
            success: true,
            message: `${attendance.student.name} checked in at ${currentTime}`,
            attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message
        });
    }
};

// Quick check-out (mark exit with current time)
exports.quickCheckOut = async (req, res) => {
    try {
        const { studentId } = req.body;

        const now = getISTDate();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        console.log(`[AdminCheckOut] IST Time: ${currentTime}`);

        let cleanId = studentId;
        if (cleanId && typeof cleanId === 'string' && (cleanId.toUpperCase().startsWith('AL-') || cleanId.toUpperCase().startsWith('HL-'))) {
            cleanId = cleanId.substring(3);
        }

        let student = null;
        if (mongoose.Types.ObjectId.isValid(cleanId)) {
            student = await User.findById(cleanId);
        }
        if (!student && cleanId) {
            student = await User.findOne({
                $or: [
                    { rollNumber: cleanId },
                    { studentId: cleanId },
                    { email: String(cleanId).toLowerCase() },
                    { phone: cleanId }
                ]
            });
        }

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Find the latest active session (handles overnight or today)
        const attendance = await Attendance.findOne({
            student: student._id,
            isActive: true
        }).sort({ createdAt: -1 }).populate('student', 'name email');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No active session found for this student'
            });
        }

        // Sub-Admins cannot override student self-marked attendance
        if (attendance.selfMarked && req.user.role === 'subadmin') {
            return res.status(403).json({ success: false, message: 'Cannot override student self-marked attendance' });
        }

        // Update exit time
        attendance.exitTime = currentTime;
        await attendance.save(); // Triggers duration calculation

        res.status(200).json({
            success: true,
            message: `${attendance.student.name} checked out at ${currentTime}`,
            attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Check-out failed',
            error: error.message
        });
    }
};

// Get currently active students (checked in but not checked out)
exports.getActiveStudents = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeAttendance = await Attendance.find({
            date: today,
            isActive: true
        })
            .populate('student', 'name email seat')
            .populate({
                path: 'student',
                populate: {
                    path: 'seat',
                    select: 'number'
                }
            })
            .sort({ entryTime: 1 });

        res.status(200).json({
            success: true,
            count: activeAttendance.length,
            activeStudents: activeAttendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Bulk check-in
exports.bulkCheckIn = async (req, res) => {
    try {
        const { studentIds } = req.body;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const attendanceDate = new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const promises = studentIds.map(async studentId => {
            const existingAttendance = await Attendance.findOne({ student: studentId, date: attendanceDate });
            if (existingAttendance && existingAttendance.selfMarked && req.user.role === 'subadmin') {
                return null; // Sub-admin cannot override self-marked attendance
            }
            return Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                {
                    status: 'present',
                    entryTime: currentTime,
                    markedBy: req.user.id,
                    isActive: true
                },
                { upsert: true, new: true }
            );
        });

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            message: `${studentIds.length} students checked in at ${currentTime}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Bulk check-in failed',
            error: error.message
        });
    }
};

// Bulk check-out
exports.bulkCheckOut = async (req, res) => {
    try {
        const { studentIds } = req.body;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const attendanceDate = new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const promises = studentIds.map(async studentId => {
            const existingAttendance = await Attendance.findOne({ student: studentId, date: attendanceDate });
            // Sub-admin cannot override self-marked attendance
            if (existingAttendance && existingAttendance.selfMarked && req.user.role === 'subadmin') {
                return null;
            }
            return Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                {
                    exitTime: currentTime,
                    isActive: false
                },
                { new: true }
            );
        });

        await Promise.all(promises);

        res.status(200).json({
            success: true,
            message: `${studentIds.length} students checked out at ${currentTime}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Bulk check-out failed',
            error: error.message
        });
    }
};

// ─── GET /api/admin/vacant-seats ─────────────────────────────────────────────
exports.getVacantSeats = async (req, res) => {
    try {
        const cacheKey = 'seats:vacant';
        const redis = getClient();

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return res.json({ ...JSON.parse(cached), fromCache: true });
            }
        } catch (cacheErr) {
            console.error('Redis get vacant seats failed:', cacheErr.message);
        }

        const Shift = require('../models/Shift');

        // ── 1. Load all active shifts from DB (times come from here — nothing hardcoded)
        const shifts = await Shift.find({ isActive: true }).lean();

        // ── 2. Convert "HH:MM" → minutes since midnight for easy overlap math
        const toMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        // Build shift time-window map: shiftId → { start, end, name, time }
        const shiftWindowMap = {};
        for (const s of shifts) {
            shiftWindowMap[s._id.toString()] = {
                id:    s._id.toString(),
                name:  s.name,
                time:  `${s.startTime} – ${s.endTime}`,
                start: toMinutes(s.startTime),
                end:   toMinutes(s.endTime),
            };
        }

        // ── 3. Time-overlap check: do [s1,e1) and [s2,e2) share any time?
        const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

        // ── 4. Load all seats
        const seats = await Seat.find()
            .populate('room', 'name hasAc')
            .populate('floor', 'name level')
            .lean();

        const vacantSlots = [];

        for (const seat of seats) {
            const activeAssignments = (seat.assignments || []).filter(a => a.status === 'active');

            // ── Collect the OCCUPIED time windows for this seat from DB shift times
            const occupiedWindows = [];
            for (const a of activeAssignments) {
                // Legacy: full_day type or 'full' legacyShift → mark as blocking entire day
                if (a.type === 'full_day' || a.legacyShift === 'full') {
                    occupiedWindows.push({ start: 0, end: 1440 }); // 00:00–24:00
                    continue;
                }
                if (a.shift) {
                    const win = shiftWindowMap[a.shift.toString()];
                    if (win) occupiedWindows.push(win);
                }
            }

            // If seat's occupied windows cover the entire day (any 0–1440 window), skip
            const isFullyBlocked = occupiedWindows.some(w => w.start === 0 && w.end >= 1440);
            if (isFullyBlocked) continue;

            const hasPartialAssignment = occupiedWindows.length > 0;

            // ── Check each shift: is its time window free on this seat?
            for (const shift of shifts) {
                const win = shiftWindowMap[shift._id.toString()];
                if (!win) continue;

                // Does this candidate shift overlap any occupied window?
                const hasOverlap = occupiedWindows.some(ow =>
                    overlaps(ow.start, ow.end, win.start, win.end)
                );

                if (!hasOverlap) {
                    const price = (seat.shiftPrices instanceof Map
                        ? seat.shiftPrices.get(shift._id.toString())
                        : seat.shiftPrices?.[shift._id.toString()])
                        || seat.basePrices?.day || 0;

                    vacantSlots.push({
                        seatId:     seat._id.toString(),
                        seatNumber: seat.number,
                        roomName:   seat.room?.name  || 'Unknown Room',
                        hasAc:      seat.room?.hasAc || false,
                        floorId:    seat.floor?._id?.toString() || '',
                        floorName:  seat.floor?.name || 'Unknown Floor',
                        shiftId:    shift._id.toString(),
                        shiftName:  shift.name,
                        shiftTime:  `${shift.startTime} – ${shift.endTime}`,
                        price,
                        isPartial:  hasPartialAssignment,
                    });
                }
            }
        }

        // ── 5. Per-shift summary (vacant slots in each shift)
        const shiftMap = {};
        for (const shift of shifts) {
            shiftMap[shift._id.toString()] = {
                shiftId:   shift._id.toString(),
                shiftName: shift.name,
                shiftTime: `${shift.startTime} – ${shift.endTime}`,
                total:     seats.length,
                vacant:    0,
            };
        }
        vacantSlots.forEach(s => { if (shiftMap[s.shiftId]) shiftMap[s.shiftId].vacant++; });

        // ── 6. Overall stats
        const totalSeats   = seats.length;
        // Occupied: any seat with at least one active assignment
        const occupiedSeats = seats.filter(s => {
            const activeAssignments = (s.assignments || []).filter(a => a.status === 'active');
            return activeAssignments.length > 0;
        }).length;
        // Vacancy rate = available slots / total possible slots (seats × shifts)
        const totalPossible = totalSeats * shifts.length;
        const vacancyRate   = totalPossible > 0 ? Math.round((vacantSlots.length / totalPossible) * 100) : 0;

        const responseData = {
            success: true,
            stats: { totalSeats, occupiedSeats, vacantSlots: vacantSlots.length, vacancyRate },
            shiftSummary: Object.values(shiftMap),
            vacantSlots,
        };

        try {
            await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 30);
        } catch (cacheErr) {
            console.error('Redis set vacant seats failed:', cacheErr.message);
        }

        res.json(responseData);
    } catch (err) {
        console.error('getVacantSeats error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get fees
exports.getFees = async (req, res) => {

    try {
        // Self-heal: sync all pending/overdue fee amounts to current seat assignment price
        try {
            const activeSeatsForSync = await Seat.find({ 'assignments.status': 'active' }).lean();
            for (const seat of activeSeatsForSync) {
                const activeAssignments = (seat.assignments || []).filter(a => a.status === 'active');
                for (const assignment of activeAssignments) {
                    if (assignment.price && assignment.student) {
                        await Fee.updateMany(
                            { student: assignment.student, status: { $in: ['pending', 'overdue'] } },
                            { $set: { amount: assignment.price } }
                        );
                    }
                }
            }
        } catch (syncErr) {
            console.warn('Fee sync warning:', syncErr.message);
        }

        // Fetch active seat assignments map for instant receipt & ledger lookup
        const seatMap = {};
        try {
            const activeSeats = await Seat.find({
                $or: [
                    { 'assignments.status': 'active' },
                    { 'assignments.student': { $exists: true, $ne: null } },
                    { isOccupied: true },
                    { assignedTo: { $exists: true, $ne: null } }
                ]
            })
                .populate('room floor assignments.shift')
                .lean();

            activeSeats.forEach(st => {
                (st.assignments || []).forEach(a => {
                    if ((a.status === 'active' || !a.status) && a.student) {
                        const sid = (typeof a.student === 'object' && a.student._id) ? a.student._id.toString() : a.student.toString();
                        if (!seatMap[sid]) {
                            seatMap[sid] = {
                                seatNumber: st.number,
                                seatId: st._id,
                                roomName: st.room?.name || '',
                                shiftName: a.shift?.name || a.legacyShift || (a.type === 'full_day' ? 'Full Day' : 'Full Shift'),
                                shift: a.shift
                            };
                        }
                    }
                });
                if (st.assignedTo) {
                    const sid = (typeof st.assignedTo === 'object' && st.assignedTo._id) ? st.assignedTo._id.toString() : st.assignedTo.toString();
                    if (!seatMap[sid]) {
                        seatMap[sid] = {
                            seatNumber: st.number,
                            seatId: st._id,
                            roomName: st.room?.name || '',
                            shiftName: st.shift?.name || 'Standard Shift',
                            shift: st.shift
                        };
                    }
                }
            });
        } catch (seatErr) {
            console.warn('Seat map lookup warning:', seatErr.message);
        }

        const STUDENT_POPULATE = {
            path: 'student',
            select: 'name email mobile address seat studentId fatherName guardianName guardianPhone dob aadharNo lockerNo registrationFee createdAt admissionDate isActive showInFeeManagement',
            populate: {
                path: 'seat',
                select: 'number'
            }
        };

        let fees = await Fee.find()
            .populate(STUDENT_POPULATE)
            .sort({ year: -1, month: -1 });

        // Filter out fees where student has been deleted (null) or is inactive
        let filteredFees = fees.filter(fee => fee.student && fee.student.isActive !== false);

        // Auto-generate missing next-month fees on the due date
        // NOTE: Only chain from non-cancelled fees — after reactivation, cancelled fees from
        // the inactive period must NOT trigger new pending fee generation.
        let generatedNew = false;
        const latestFees = {};
        for (const fee of filteredFees) {
            const studentId = fee.student._id.toString();
            // Since fees are sorted descending, pick the latest NON-cancelled fee per student
            if (!latestFees[studentId] && fee.status !== 'cancelled') {
                latestFees[studentId] = fee;
            }
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const studentId in latestFees) {
            let currentFee = latestFees[studentId];
            if (!currentFee.student.createdAt && !currentFee.student.admissionDate) continue;

            const joinedDate = new Date(currentFee.student.admissionDate || currentFee.student.createdAt);
            const billingDay = joinedDate.getDate();

            let iter = 0;
            // Catch up missing months up to 6 months
            while (iter < 6) {
                const cycleEnd = new Date(currentFee.year, currentFee.month, billingDay - 1);
                cycleEnd.setHours(0, 0, 0, 0);

                // Generate next fee 5 days before cycleStart (= cycleEnd - 4 days)
                const triggerDate = new Date(cycleEnd);
                triggerDate.setDate(triggerDate.getDate() - 4);

                if (now < triggerDate) break; // Not yet within 5-day window

                let nextMonth = currentFee.month + 1;
                let nextYear = currentFee.year;
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear++;
                }

                const exists = await Fee.findOne({ student: studentId, month: nextMonth, year: nextYear });
                if (!exists) {
                    const nextCycleEnd = new Date(nextYear, nextMonth, billingDay - 1);
                    currentFee = await Fee.create({
                        student: studentId,
                        month: nextMonth,
                        year: nextYear,
                        amount: currentFee.amount,
                        dueDate: nextCycleEnd,
                        status: 'pending'
                    });
                    generatedNew = true;
                } else if (exists.status === 'cancelled') {
                    // Skip cancelled records (inactive-period fees) — stop chaining
                    break;
                } else {
                    currentFee = exists;
                }
                iter++;
            }
        }

        if (generatedNew) {
            fees = await Fee.find()
                .populate(STUDENT_POPULATE)
                .sort({ year: -1, month: -1 });
            filteredFees = fees.filter(fee => fee.student && fee.student.isActive !== false);
        }

        // Calculate Billing Cycles and Enrich Student Profile details
        const processedFees = filteredFees.map(fee => {
            const student = fee.student;
            const feeObj = fee.toObject();

            if (student) {
                const sid = student._id ? student._id.toString() : '';
                const seatInfo = seatMap[sid];
                const directSeatNumber = (typeof student.seat === 'object' && student.seat) ? (student.seat.number || student.seat.seatNumber) : '';
                const resolvedSeat = seatInfo?.seatNumber || directSeatNumber || '';
                const resolvedShift = seatInfo?.shiftName || (typeof student.shift === 'object' && student.shift?.name ? student.shift.name : student.shiftName) || 'Full Shift';
                const resolvedRoom = seatInfo?.roomName || (typeof student.seat === 'object' && student.seat?.room?.name ? student.seat.room.name : '') || '';

                feeObj.student = {
                    ...feeObj.student,
                    seatNumber: resolvedSeat,
                    shiftName: resolvedShift,
                    roomName: resolvedRoom,
                    fatherName: student.fatherName || student.guardianName || '',
                    dob: student.dob || null,
                    mobile: student.mobile || '',
                    aadharNo: student.aadharNo || '',
                    address: student.address || '',
                    lockerNo: fee.lockerNo || student.lockerNo || '',
                    registrationFee: fee.registrationFee || student.registrationFee || 0,
                    due: fee.due || (fee.status === 'partial' ? fee.outstanding : 0)
                };
            }

            if (!student || (!student.createdAt && !student.admissionDate)) return feeObj;

            const joinedDate = new Date(student.admissionDate || student.createdAt);
            const billingDay = joinedDate.getDate();

            // Month is 1-indexed in DB, 0-indexed in JS Date
            // Cycle Start: The 'billingDay' of the fee month
            const cycleStart = new Date(fee.year, fee.month - 1, billingDay);

            // Cycle End: One day before the 'billingDay' of the NEXT month
            const cycleEnd = new Date(fee.year, fee.month, billingDay - 1);

            // Due Date: Same as Cycle End
            const dueDate = new Date(cycleEnd);

            return {
                ...feeObj,
                cycleStart,
                cycleEnd,
                dueDate
            };
        });

        res.status(200).json({
            success: true,
            fees: processedFees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Mark fee as paid
exports.markFeePaid = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id).populate('student', 'name email');

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Fee record not found'
            });
        }

        const settledAmount = (fee.status === 'partial' && fee.outstanding > 0) ? fee.outstanding : fee.amount;
        fee.status = 'paid';
        fee.partialPaid = fee.amount;
        fee.outstanding = 0;
        fee.paidDate = new Date();
        fee.markedBy = req.user.id;
        await fee.save();

        await Notification.create({
            recipient: fee.student._id,
            title: 'Fee Payment Confirmed',
            message: `Your fee payment of ₹${settledAmount} has been confirmed.`,
            type: 'fee',
            createdBy: req.user.id
        });

        // Send fee confirmation email
        try {
            await emailService.sendFeeConfirmationEmail(fee.student, settledAmount, fee.month, fee.year, fee._id, fee.paidDate);
        } catch (emailError) {
            console.error('Fee email failed:', emailError.message);
        }

        // Log action
        await logAction(req, 'fee_marked_paid', 'Fee', fee._id, `Fee: ₹${settledAmount}`, `Marked as paid for student ${fee.student.name}`);

        res.status(200).json({
            success: true,
            message: 'Fee marked as paid'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark fee as partially paid
// @route   PUT /api/admin/fees/:id/partial
exports.markFeePartialPaid = async (req, res) => {
    try {
        const { partialAmount } = req.body;
        const fee = await Fee.findById(req.params.id).populate('student', 'name email');

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        if (!partialAmount || isNaN(partialAmount) || Number(partialAmount) <= 0) {
            return res.status(400).json({ success: false, message: 'Please enter a valid partial amount.' });
        }

        const parsed = Number(partialAmount);

        // Use current outstanding balance (supports multiple installments)
        const currentOutstanding = (fee.status === 'partial' && fee.outstanding > 0)
            ? fee.outstanding
            : fee.amount;

        if (parsed >= currentOutstanding) {
            return res.status(400).json({
                success: false,
                message: `Amount must be less than outstanding balance (₹${currentOutstanding}). Use Full Paid for the remaining balance.`
            });
        }

        // Accumulate total paid across all installments
        const newTotalPaid = (fee.partialPaid || 0) + parsed;
        const newOutstanding = currentOutstanding - parsed;

        fee.status = 'partial';
        fee.partialPaid = newTotalPaid;
        fee.outstanding = newOutstanding;
        // fee.amount is intentionally NOT changed — keeps original monthly price for future fee generation
        fee.paidDate = new Date();
        fee.markedBy = req.user.id;
        await fee.save();

        // In-app notification
        await Notification.create({
            recipient: fee.student._id,
            title: 'Partial Fee Payment Recorded',
            message: `₹${parsed} received. Outstanding balance: ₹${newOutstanding}.`,
            type: 'fee',
            createdBy: req.user.id
        });

        // Email
        try {
            await emailService.sendPartialFeeEmail(fee.student, parsed, newOutstanding, fee.amount, fee.month, fee.year);
        } catch (emailError) {
            console.error('Partial fee email failed:', emailError.message);
        }

        await logAction(req, 'fee_partial_paid', 'Fee', fee._id, `Partial: ₹${parsed}`, `Partial payment of ₹${parsed} recorded for ${fee.student.name}. Outstanding: ₹${newOutstanding}`);

        res.status(200).json({
            success: true,
            message: `Partial payment of ₹${parsed} recorded. Outstanding: ₹${newOutstanding}.`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Cancel fee due to inactive period
exports.cancelFee = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id).populate('student');
        if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });

        fee.status = 'cancelled';
        fee.paidDate = null;
        await fee.save();

        await logAction(req, 'fee_cancelled', 'Fee', fee._id, fee.student?.name || 'Unknown', `Cancelled fee for month ${fee.month}/${fee.year}`);

        res.status(200).json({ success: true, message: 'Fee has been cancelled successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};



// Send notification
exports.sendNotification = async (req, res) => {
    try {
        const { recipientId, title, message, sendToAll } = req.body;

        if (sendToAll) {
            const students = await User.find({ role: 'student', isActive: true });

            const promises = students.map(async (student) => {
                return await Notification.create({
                    recipient: student._id,
                    title,
                    message,
                    type: 'announcement',
                    createdBy: req.user.id
                });
            });

            await Promise.all(promises);

            // Log action
            await logAction(req, 'notification_sent', 'Notification', null, 'Bulk Announcement', `Sent to ${students.length} students: ${title}`);

            // Send announcement email
            try {
                // Send in background to avoid blocking
                emailService.sendAnnouncementEmail(students, title, message).catch(err => console.error('Announcement email failed:', err));
            } catch (err) {
                console.error('Failed to trigger announcement emails', err);
            }

            res.status(200).json({
                success: true,
                message: `Announcement sent to ${students.length} students`
            });
        } else {
            const student = await User.findById(recipientId);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            await Notification.create({
                recipient: recipientId,
                title,
                message,
                type: 'general',
                createdBy: req.user.id
            });

            res.status(200).json({
                success: true,
                message: 'Notification sent successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get notification history for admin
exports.getNotificationHistory = async (req, res) => {
    try {
        const rawNotifications = await Notification.find()
            .populate('recipient', 'name email rollNumber studentId')
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(200);

        // Group broadcasts by title, message, and created time minute
        const grouped = [];
        const seenBroadcasts = new Map();

        for (const notif of rawNotifications) {
            if (notif.type === 'announcement') {
                const minuteKey = `${notif.title}_${notif.message}_${Math.floor(new Date(notif.createdAt).getTime() / (60 * 1000))}`;
                if (seenBroadcasts.has(minuteKey)) {
                    const existing = seenBroadcasts.get(minuteKey);
                    existing.recipientCount = (existing.recipientCount || 1) + 1;
                    existing.ids.push(notif._id);
                } else {
                    const entry = {
                        _id: notif._id,
                        ids: [notif._id],
                        title: notif.title,
                        message: notif.message,
                        type: notif.type,
                        isRead: notif.isRead,
                        createdAt: notif.createdAt,
                        createdBy: notif.createdBy,
                        recipientCount: 1,
                        isBroadcast: true
                    };
                    seenBroadcasts.set(minuteKey, entry);
                    grouped.push(entry);
                }
            } else {
                grouped.push({
                    _id: notif._id,
                    ids: [notif._id],
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    isRead: notif.isRead,
                    createdAt: notif.createdAt,
                    createdBy: notif.createdBy,
                    recipient: notif.recipient,
                    isBroadcast: false
                });
            }
        }

        res.status(200).json({
            success: true,
            notifications: grouped
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification history',
            error: error.message
        });
    }
};

// Delete notification or broadcast batch
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { ids } = req.body || {};

        if (Array.isArray(ids) && ids.length > 0) {
            await Notification.deleteMany({ _id: { $in: ids } });
        } else {
            await Notification.findByIdAndDelete(id);
        }

        res.status(200).json({
            success: true,
            message: 'Notification removed from history'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

// Get requests
exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find()
            .populate('student', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        // Filter out orphaned requests
        const filteredRequests = requests.filter(req => req.student);

        res.status(200).json({
            success: true,
            requests: filteredRequests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Handle request
exports.handleRequest = async (req, res) => {

    try {
        const { status, adminResponse } = req.body;

        const request = await Request.findById(req.params.id).populate('student', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }



        request.status = status;
        request.adminResponse = adminResponse;
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        await request.save();

        await Notification.create({
            recipient: request.student._id,
            title: `Request ${status}`,
            message: adminResponse || `Your ${request.type} change request has been ${status}.`,
            type: 'request',
            createdBy: req.user.id
        });

        // AUTOMATION: Handle Seat/Combined Changes
        if (status === 'approved' && (request.type === 'seat' || request.type === 'seat_change')) {
            logAutomation(`🔄 Processing request ${request._id} for student ${request.student?.email}`);
            logAutomation(`Requested Data: ${JSON.stringify(request.requestedData)}`);
            try {
                const targetSeatId = request.requestedData?.requestedSeatId;
                const targetShiftId = request.requestedData?.shift || request.requestedData?.requestedShift;

                if (!targetSeatId) {
                    throw new Error('Target Seat ID missing in request data');
                }

                // Handle populate vs ID safety
                const studentId = (request.student && request.student._id) ? request.student._id : request.student;
                if (!studentId) {
                    throw new Error('Student ID missing on request object');
                }

                // 1. Find and de-allocate current seat
                logAutomation(`Searching for current active seat for student ${studentId}...`);
                const currentSeat = await Seat.findOne({
                    'assignments.student': studentId,
                    'assignments.status': 'active'
                });

                if (currentSeat) {
                    logAutomation(`📍 Found current seat ${currentSeat.number}, deactivating assignment...`);
                    const assignmentIndex = currentSeat.assignments.findIndex(
                        a => a.student.toString() === studentId.toString() && a.status === 'active'
                    );

                    if (assignmentIndex !== -1) {
                        currentSeat.assignments[assignmentIndex].status = 'expired';
                        const remainingActive = currentSeat.assignments.filter(a => a.status === 'active');
                        if (remainingActive.length === 0) {
                            currentSeat.isOccupied = false;
                        }
                        await currentSeat.save();
                        logAutomation(`✅ Deactivated current seat ${currentSeat.number}`);
                    }
                } else {
                    logAutomation('⚠️ No current active seat found for student (New Allocation?)');
                }

                // 2. Allocate new seat
                logAutomation(`Finding target seat ${targetSeatId}...`);
                const targetSeat = await Seat.findById(targetSeatId);
                if (!targetSeat) {
                    throw new Error(`Target seat ${targetSeatId} not found`);
                }

                logAutomation(`📍 Allocating new seat ${targetSeat.number} with shift ${targetShiftId}...`);

                targetSeat.assignments.push({
                    student: studentId,
                    shift: targetShiftId,
                    status: 'active',
                    assignedAt: new Date(),
                    type: 'specific'
                });

                targetSeat.isOccupied = true;

                await targetSeat.save();
                logAutomation(`✅ Successfully allocated seat ${targetSeat.number} to student`);

                // 3. Update User's seat reference
                logAutomation(`Updating User ${studentId} seat reference...`);
                await User.findByIdAndUpdate(studentId, {
                    seat: targetSeat._id,
                    seatAssignedAt: new Date()
                });
                logAutomation(`✅ Updated User ${studentId} to point to seat ${targetSeatId}`);


            } catch (err) {
                const errMsg = `❌ Error processing seat change automation: ${err.message}`;
                logAutomation(errMsg);
                console.error(errMsg, err);
            }
        }

        // If shift change request is approved, update the actual seat shift
        if (status === 'approved' && request.type === 'shift') {
            console.log('🔄 Shift change request approved, attempting to update seat...');
            console.log('Request data:', JSON.stringify(request.requestedData, null, 2));

            try {
                if (!request.requestedData?.shift) {
                    console.error('❌ No shift found in requestedData');
                } else {
                    const seat = await Seat.findOne({ assignedTo: request.student._id });
                    if (!seat) {
                        console.error(`❌ No seat found for student ${request.student.name}`);
                    } else {
                        console.log(`📍 Found seat ${seat.number}, current shift: ${seat.shift}, new shift: ${request.requestedData.shift}`);
                        seat.shift = request.requestedData.shift;
                        await seat.save();
                        console.log(`✅ Successfully updated seat ${seat.number} shift from ${seat.shift} to ${request.requestedData.shift} for student ${request.student.name}`);
                    }
                }
            } catch (shiftError) {
                console.error('❌ Error updating shift:', shiftError);
            }
        }

        // Send response email
        try {
            await emailService.sendRequestResponseEmail(request.student, request, status, adminResponse);
        } catch (emailError) {
            console.error('Request email failed:', emailError.message);
        }

        // Log action
        await logAction(req, status === 'approved' ? 'request_approved' : 'request_rejected', 'Request', request._id, request.type, `Status: ${status}`);

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get Action History
exports.getActionHistory = async (req, res) => {
    try {
        const { startDate, endDate, action, search } = req.query;

        let query = {};

        // Date filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Action type filter
        if (action) {
            query.action = action;
        }

        // Search filter (admin name or target name)
        if (search) {
            query.$or = [
                { adminName: { $regex: search, $options: 'i' } },
                { targetName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await ActionLog.find(query)
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 actions for performance

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get Password Activity
exports.getPasswordActivity = async (req, res) => {
    try {
        const PasswordLog = require('../models/PasswordLog');
        const logs = await PasswordLog.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(50); // Last 50 changes

        // Filter out logs where user has been deleted (null after populate)
        const filteredLogs = logs.filter(log => log.user);

        res.status(200).json({
            success: true,
            logs: filteredLogs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get detailed activity & status history for a specific student
// @route   GET /api/admin/students/:id/activity-history
exports.getStudentActivityHistory = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 1. Fetch action logs related to this student
        const actionLogs = await ActionLog.find({
            $or: [
                { targetId: student._id },
                { targetName: student.name },
                { details: { $regex: student.name, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).limit(100);

        // 2. Fetch fee records
        const fees = await Fee.find({ student: student._id }).sort({ year: -1, month: -1 });

        const formatItem = (action, details) => {
            switch (action) {
                case 'student_created':
                    return { category: 'Lifecycle', title: 'Scholar Account Created', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
                case 'student_activated':
                    return { category: 'Status', title: 'Scholar Activated / Reactivated', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                case 'student_deactivated':
                case 'student_deleted_soft':
                    return { category: 'Status', title: 'Scholar Deactivated (Marked Inactive)', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
                case 'student_updated':
                    return { category: 'Profile', title: 'Profile Updated', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                case 'fee_updated':
                    return { category: 'Fee', title: 'Fee Rate Adjusted', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
                case 'visibility_changed':
                    return { category: 'Fee', title: 'Fee Management Visibility Changed', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
                case 'seat_assigned':
                    return { category: 'Desk', title: 'Desk Seat Assigned', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
                case 'seat_freed':
                    return { category: 'Desk', title: 'Desk Seat Freed', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
                case 'fee_marked_paid':
                    return { category: 'Payment', title: 'Fee Payment Received (Paid)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                case 'fee_partial_paid':
                    return { category: 'Payment', title: 'Partial Fee Installment Paid', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
                case 'password_reset':
                    return { category: 'Security', title: 'Password Reset', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
                default:
                    return { category: 'Activity', title: (action || 'activity').replace(/_/g, ' ').toUpperCase(), badge: 'bg-slate-100 text-slate-700 border-slate-200' };
            }
        };

        const timeline = [];

        // Add action logs
        actionLogs.forEach(log => {
            const info = formatItem(log.action, log.details);
            timeline.push({
                id: log._id.toString(),
                type: 'log',
                action: log.action,
                category: info.category,
                title: info.title,
                details: log.details || '',
                adminName: log.adminName || 'Admin',
                timestamp: log.createdAt,
                badge: info.badge
            });
        });

        // Add statusHistory records
        (student.statusHistory || []).forEach((sh, idx) => {
            const isFirst = idx === 0;
            timeline.push({
                id: `sh_${idx}_${new Date(sh.date).getTime()}`,
                type: 'statusHistory',
                action: sh.status === 'active' ? 'student_activated' : 'student_deactivated',
                category: 'Status',
                title: isFirst ? 'Initial Admission (Joined)' : (sh.status === 'active' ? 'Status: Active (Reactivated)' : 'Status: Inactive (Deactivated)'),
                details: sh.admissionDate ? `Effective Admission Date: ${new Date(sh.admissionDate).toLocaleDateString('en-IN')}` : `Status transitioned to ${sh.status}`,
                adminName: 'Admin / System',
                timestamp: sh.date,
                badge: sh.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
            });
        });

        // Add fee payments
        fees.forEach(f => {
            if (f.paidDate) {
                timeline.push({
                    id: `fee_${f._id.toString()}`,
                    type: 'fee',
                    action: f.status === 'paid' ? 'fee_marked_paid' : 'fee_partial_paid',
                    category: 'Payment',
                    title: `Fee Payment Settled: Month ${f.month}/${f.year}`,
                    details: `Amount: ₹${f.status === 'partial' ? f.partialPaid : f.amount} ${f.status === 'partial' ? `(Remaining due: ₹${f.outstanding})` : 'Full Settlement'}`,
                    adminName: 'Admin',
                    timestamp: f.paidDate,
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                });
            }
        });

        // Initial enrollment event
        const enrollDate = student.admissionDate || student.createdAt;
        timeline.push({
            id: 'enrollment_init',
            type: 'enrollment',
            action: 'student_created',
            category: 'Lifecycle',
            title: 'Scholar Account Created',
            details: `Registered in LMS on ${new Date(student.createdAt).toLocaleDateString('en-IN')}. Initial Admission Date: ${new Date(enrollDate).toLocaleDateString('en-IN')}`,
            adminName: 'System',
            timestamp: student.createdAt,
            badge: 'bg-blue-50 text-blue-700 border-blue-200'
        });

        // Sort descending
        timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Deduplicate events that share very close timestamp and identical title/details
        const uniqueTimeline = [];
        const seenKeys = new Set();
        for (const item of timeline) {
            const timeKey = `${new Date(item.timestamp).toDateString()}_${item.category}_${item.action}`;
            if (!seenKeys.has(timeKey)) {
                seenKeys.add(timeKey);
                uniqueTimeline.push(item);
            }
        }

        res.status(200).json({
            success: true,
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                mobile: student.mobile,
                isActive: student.isActive,
                joinedAt: student.createdAt,
                admissionDate: student.admissionDate || student.createdAt,
                showInFeeManagement: student.showInFeeManagement !== false,
                statusHistory: student.statusHistory || []
            },
            timeline: uniqueTimeline
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reset Student Password (Admin)
// @route   POST /api/admin/students/:id/reset-password
exports.resetStudentPassword = async (req, res) => {
    try {
        const student = await User.findById(req.params.id);

        if (!student || student.role !== 'student') {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Generate new random password
        const newPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);

        // Update student password
        student.password = newPassword;
        await student.save();

        // Log password change
        const PasswordLog = require('../models/PasswordLog');
        await PasswordLog.create({
            user: student._id,
            email: student.email,
            newPassword: newPassword,
            source: 'admin_reset'
        });

        // Send email with new credentials
        try {
            await emailService.sendCredentialsEmail(student.name, student.email, newPassword);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        // Send notification to student
        await Notification.create({
            recipient: student._id,
            title: 'Password Reset by Admin',
            message: `Your password has been reset. Check your email (${student.email}) for new credentials.`,
            type: 'general',
            createdBy: req.user.id
        });

        // Log action
        await logAction(req, 'password_reset', 'User', student._id, student.name, 'Admin reset student password');

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. New credentials sent to student via email.',
            newPassword: newPassword // Return for admin reference
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Bulk reset all student passwords to their mobile numbers
exports.bulkResetPasswordsToMobile = async (req, res) => {
    try {
        const PasswordLog = require('../models/PasswordLog');
        const bcrypt = require('bcryptjs');

        // Fetch only lightweight data — only need _id, name, email, mobile
        const students = await User.find({
            role: 'student',
            mobile: { $exists: true, $nin: [null, '', undefined] }
        }).select('name email mobile');

        if (!students || students.length === 0) {
            return res.status(404).json({ success: false, message: 'No students with mobile numbers found.' });
        }

        console.log(`[BulkReset] Processing ${students.length} students...`);

        let successCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const student of students) {
            try {
                if (!student.mobile) { skippedCount++; continue; }

                const newPassword = String(student.mobile).trim();
                if (newPassword.length < 6) { skippedCount++; continue; }

                // Hash manually and use updateOne — avoids all Mongoose pre-save hook issues
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await User.updateOne({ _id: student._id }, { $set: { password: hashedPassword } });

                // Count success immediately after the DB update succeeds
                successCount++;

                // Log separately — don't let log failure break the count
                try {
                    await PasswordLog.create({
                        user: student._id,
                        email: student.email || '',
                        newPassword: newPassword,
                        source: 'admin_bulk_reset'
                    });
                } catch (logErr) {
                    console.warn(`[BulkReset] PasswordLog failed for ${student.name}:`, logErr.message);
                }

            } catch (err) {
                console.error(`[BulkReset] ERROR for ${student.name}:`, err.message);
                errors.push({ name: student.name, error: err.message });
            }
        }

        await logAction(req, 'bulk_password_reset', 'User', null, 'All Students',
            `Bulk reset: ${successCount} passwords set to mobile. Skipped: ${skippedCount}.`);

        res.status(200).json({
            success: true,
            message: `Done! ${successCount} student passwords reset to their mobile numbers. Skipped: ${skippedCount}.`,
            successCount, skippedCount,
            ...(errors.length > 0 && { errors })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during bulk password reset.', error: error.message });
    }
};

// @desc    Get all requests
// @route   GET /api/admin/requests
exports.getRequests = async (req, res) => {
    try {
        const allRequests = await Request.find()
            .populate('student', 'name email mobile phoneNumber studentId shift shifts seat isActive inactivationStatus')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Filter out orphaned requests (deleted student)
        const filteredRequests = allRequests.filter(r => r.student);

        // Enrich with current seat price — wrapped so a slow/failed seat lookup never 500s the whole endpoint
        let requestsWithPrice = filteredRequests;
        try {
            const studentIds = filteredRequests.map(r => r.student._id);
            if (studentIds.length > 0) {
                const activeSeats = await Seat.find({
                    'assignments.student': { $in: studentIds },
                    'assignments.status': 'active'
                }).lean();

                requestsWithPrice = filteredRequests.map(r => {
                    const studentSeat = activeSeats.find(s =>
                        s.assignments.some(a => a.student.toString() === r.student._id.toString() && a.status === 'active')
                    );
                    const activeAssignment = studentSeat
                        ? studentSeat.assignments.find(a => a.student.toString() === r.student._id.toString() && a.status === 'active')
                        : null;
                    return { ...r, studentPrice: activeAssignment ? activeAssignment.price : 0 };
                });
            }
        } catch (seatErr) {
            console.error('getRequests seat enrichment error (non-fatal):', seatErr.message);
            // Continue without price enrichment
        }

        res.status(200).json({
            success: true,
            requests: requestsWithPrice
        });
    } catch (error) {
        console.error('getRequests error:', error.message, '\n', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Handle request (approve/reject)
// @route   PUT /api/admin/requests/:id
exports.handleRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;

        // Validation
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected"'
            });
        }

        const request = await Request.findById(id).populate('student', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            if (request.status === status) {
                return res.status(200).json({
                    success: true,
                    message: `Request has already been ${status}.`,
                    request
                });
            }
            return res.status(400).json({
                success: false,
                message: `This request has already been ${request.status}.`
            });
        }

        // Handle scholar inactivation requests (initiated by sub-admin)
        if (request.type === 'inactivation') {
            const student = await User.findById(request.student._id || request.student);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student associated with this request was not found'
                });
            }

            if (status === 'approved') {
                student.isActive = false;
                student.inactivationStatus = 'approved';
                // Clean up any seat references
                const assignedSeats = await Seat.find({ 'assignments.student': student._id });
                for (const s of assignedSeats) {
                    s.assignments = s.assignments.filter(a => a.student.toString() !== student._id.toString());
                    s.isOccupied = s.assignments.some(a => a.status === 'active');
                    await s.save();
                }
                student.seat = null;
                student.seatAssignedAt = null;

                // Revoke any active temporary seat assignments for this student
                await TempSeatAssignment.updateMany(
                    { borrowerStudent: student._id, status: 'active' },
                    { status: 'revoked', note: 'Inactivation confirmed by Super Admin' }
                );

                if (!student.statusHistory) student.statusHistory = [];
                student.statusHistory.push({
                    status: 'inactive',
                    date: new Date(),
                    reason: `Super Admin approved scholar inactivation. ${adminResponse ? `Note: ${adminResponse}` : ''}`
                });
                await student.save();

                request.status = 'approved';
                request.adminResponse = adminResponse || 'Approved scholar inactivation';
                request.reviewedBy = req.user.id;
                request.reviewedAt = new Date();
                await request.save();

                // Notify student
                await Notification.create({
                    recipient: student._id,
                    title: 'Account Inactivated',
                    message: adminResponse || 'Your library membership has been inactivated following Super Admin confirmation.',
                    type: 'profile',
                    createdBy: req.user.id
                });

                // Notify requesting sub-admin if present
                if (request.requestedData?.subAdminId) {
                    await Notification.create({
                        recipient: request.requestedData.subAdminId,
                        title: 'Inactivation Request Approved',
                        message: `Super Admin approved your inactivation request for scholar ${student.name}.`,
                        type: 'request',
                        createdBy: req.user.id
                    });
                }

                await logAction(
                    req,
                    'student_inactivation_approved',
                    'User',
                    student._id,
                    student.name,
                    `Super Admin approved scholar inactivation requested by sub-admin (${request.requestedData?.subAdminName || 'Staff'})`
                );

                return res.status(200).json({
                    success: true,
                    message: `Scholar ${student.name} inactivation approved successfully.`,
                    request
                });
            } else {
                // status === 'rejected' -> Super Admin DISAPPROVED the inactivation request!
                // 1. Reactivate student
                student.isActive = true;
                student.inactivationStatus = 'none';
                if (!student.statusHistory) student.statusHistory = [];
                student.statusHistory.push({
                    status: 'active',
                    date: new Date(),
                    reason: `Super Admin disapproved inactivation request: ${adminResponse || 'Reinstated by Super Admin'}`
                });

                // 2. Identify previous desk
                const origSeat = request.currentData?.originalSeat;
                let targetSeat = null;

                if (origSeat?.seatId) {
                    targetSeat = await Seat.findById(origSeat.seatId).populate('room floor');
                }
                if (!targetSeat && origSeat?.seatNumber) {
                    targetSeat = await Seat.findOne({ number: origSeat.seatNumber }).populate('room floor');
                }

                const targetShiftId = origSeat?.shift || student.shift || null;
                const targetLegacyShift = origSeat?.legacyShift || null;
                const targetShiftType = origSeat?.type || 'specific';
                const targetPrice = origSeat?.price || 800;

                let relocatedStudentName = null;
                let temporaryAssignedStudentName = null;
                let assignedDeskNumber = null;

                if (targetSeat) {
                    assignedDeskNumber = targetSeat.number;

                    const { doTimeRangesOverlap } = require('../utils/timeUtils');
                    const allShiftsList = await Shift.find({}).lean();
                    const shiftMap = new Map(allShiftsList.map(s => [s._id.toString(), s]));

                    const shiftsOverlap = (asgn1, asgn2) => {
                        if (!asgn1 || !asgn2) return false;
                        if (asgn1.type === 'full_day' || asgn2.type === 'full_day') return true;
                        if (asgn1.legacyShift === 'full' || asgn2.legacyShift === 'full') return true;
                        if (asgn1.shift && asgn2.shift && asgn1.shift.toString() === asgn2.shift.toString()) return true;
                        if (asgn1.legacyShift && asgn2.legacyShift && asgn1.legacyShift === asgn2.legacyShift) return true;

                        if (asgn1.shift && asgn2.shift) {
                            const s1 = shiftMap.get(asgn1.shift.toString());
                            const s2 = shiftMap.get(asgn2.shift.toString());
                            if (s1 && s2) {
                                const isS1Full = s1.name?.toLowerCase().includes('full') || (s1.startTime === '06:00' && s1.endTime === '21:00');
                                const isS2Full = s2.name?.toLowerCase().includes('full') || (s2.startTime === '06:00' && s2.endTime === '21:00');
                                if (isS1Full || isS2Full) return true;
                                return doTimeRangesOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime);
                            }
                        }
                        return false;
                    };

                    const targetAsgn = { shift: targetShiftId, type: targetShiftType, legacyShift: targetLegacyShift };

                    // Check for conflicting active assignments on targetSeat that overlap with this shift
                    const conflictingAssignments = targetSeat.assignments.filter(a =>
                        a.status === 'active' &&
                        a.student.toString() !== student._id.toString() &&
                        shiftsOverlap(targetAsgn, a)
                    );

                    for (const conflictAssign of conflictingAssignments) {
                        const conflictStudentId = conflictAssign.student;
                        const conflictStudent = await User.findById(conflictStudentId);

                        // Find a vacant candidate desk for this conflict student shift-wise
                        const allSeats = await Seat.find({}).populate('room floor');
                        let vacantSeat = null;

                        for (const candSeat of allSeats) {
                            if (candSeat._id.toString() === targetSeat._id.toString()) continue;
                            const hasOverlap = candSeat.assignments.some(a =>
                                a.status === 'active' &&
                                shiftsOverlap(conflictAssign, a)
                            );
                            if (!hasOverlap) {
                                vacantSeat = candSeat;
                                break;
                            }
                        }

                        if (vacantSeat && conflictStudent) {
                            // Move conflicting student to the vacant desk shift-wise
                            conflictAssign.status = 'expired';
                            vacantSeat.assignments.push({
                                student: conflictStudent._id,
                                shift: conflictAssign.shift,
                                legacyShift: conflictAssign.legacyShift,
                                type: conflictAssign.type,
                                price: conflictAssign.price,
                                status: 'active',
                                assignedAt: new Date()
                            });
                            vacantSeat.isOccupied = true;
                            vacantSeat.markModified('assignments');
                            await vacantSeat.save();

                            conflictStudent.seat = vacantSeat._id;
                            await conflictStudent.save();

                            relocatedStudentName = conflictStudent.name;

                            // In-app notification to relocated student
                            await Notification.create({
                                recipient: conflictStudent._id,
                                title: 'Desk Relocated',
                                message: `Your assigned desk was updated to Desk ${vacantSeat.number} (${vacantSeat.room?.name || 'Main Room'}) as Desk ${targetSeat.number} was restored to its original scholar.`,
                                type: 'seat',
                                createdBy: req.user.id
                            });
                        } else if (conflictStudent) {
                            // No vacant desk available -> keep on same desk with TEMPORARY status
                            conflictAssign.status = 'expired';

                            await TempSeatAssignment.create({
                                borrowerStudent: conflictStudent._id,
                                seat: targetSeat._id,
                                shift: conflictAssign.shift || targetShiftId,
                                originalOwner: student._id,
                                note: `Temporary desk allocation on Desk ${targetSeat.number} after original scholar ${student.name} was reinstated.`,
                                startDate: new Date(),
                                status: 'active',
                                createdBy: req.user.id
                            });

                            temporaryAssignedStudentName = conflictStudent.name;

                            // In-app notification to temporary student
                            await Notification.create({
                                recipient: conflictStudent._id,
                                title: 'Temporary Desk Allocation',
                                message: `You have been allocated temporary status on Desk ${targetSeat.number} following restoration of original scholar ${student.name} by Super Admin.`,
                                type: 'seat',
                                createdBy: req.user.id
                            });
                        }
                    }

                    // Forcefully reassign original student back to targetSeat
                    targetSeat.assignments = targetSeat.assignments.filter(a => a.student.toString() !== student._id.toString());
                    targetSeat.assignments.push({
                        student: student._id,
                        shift: targetShiftId,
                        legacyShift: targetLegacyShift,
                        type: targetShiftType,
                        price: targetPrice,
                        status: 'active',
                        assignedAt: new Date()
                    });
                    targetSeat.isOccupied = true;
                    targetSeat.markModified('assignments');
                    await targetSeat.save();

                    student.seat = targetSeat._id;
                    student.seatAssignedAt = new Date();
                } else {
                    // Fallback: original seat was not found, find any vacant seat shift-wise
                    const { doTimeRangesOverlap } = require('../utils/timeUtils');
                    const allShiftsList = await Shift.find({}).lean();
                    const shiftMap = new Map(allShiftsList.map(s => [s._id.toString(), s]));

                    const shiftsOverlap = (asgn1, asgn2) => {
                        if (!asgn1 || !asgn2) return false;
                        if (asgn1.type === 'full_day' || asgn2.type === 'full_day') return true;
                        if (asgn1.legacyShift === 'full' || asgn2.legacyShift === 'full') return true;
                        if (asgn1.shift && asgn2.shift && asgn1.shift.toString() === asgn2.shift.toString()) return true;
                        if (asgn1.legacyShift && asgn2.legacyShift && asgn1.legacyShift === asgn2.legacyShift) return true;

                        if (asgn1.shift && asgn2.shift) {
                            const s1 = shiftMap.get(asgn1.shift.toString());
                            const s2 = shiftMap.get(asgn2.shift.toString());
                            if (s1 && s2) {
                                const isS1Full = s1.name?.toLowerCase().includes('full') || (s1.startTime === '06:00' && s1.endTime === '21:00');
                                const isS2Full = s2.name?.toLowerCase().includes('full') || (s2.startTime === '06:00' && s2.endTime === '21:00');
                                if (isS1Full || isS2Full) return true;
                                return doTimeRangesOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime);
                            }
                        }
                        return false;
                    };

                    const targetAsgn = { shift: targetShiftId, type: targetShiftType, legacyShift: targetLegacyShift };
                    const allSeats = await Seat.find({}).populate('room floor');
                    let fallbackVacant = null;
                    for (const cand of allSeats) {
                        const hasOverlap = cand.assignments.some(a =>
                            a.status === 'active' &&
                            shiftsOverlap(targetAsgn, a)
                        );
                        if (!hasOverlap) {
                            fallbackVacant = cand;
                            break;
                        }
                    }
                    if (fallbackVacant) {
                        fallbackVacant.assignments.push({
                            student: student._id,
                            shift: targetShiftId,
                            legacyShift: targetLegacyShift,
                            type: targetShiftType,
                            price: targetPrice,
                            status: 'active',
                            assignedAt: new Date()
                        });
                        fallbackVacant.isOccupied = true;
                        await fallbackVacant.save();
                        student.seat = fallbackVacant._id;
                        student.seatAssignedAt = new Date();
                        assignedDeskNumber = fallbackVacant.number;
                    }
                }

                await student.save();

                request.status = 'rejected';
                request.adminResponse = adminResponse || 'Disapproved by Super Admin';
                request.reviewedBy = req.user.id;
                request.reviewedAt = new Date();
                await request.save();

                // In-app notification to reinstated student
                await Notification.create({
                    recipient: student._id,
                    title: 'Account & Desk Restored',
                    message: `Super Admin disapproved the inactivation request. You are active and forcefully restored to Desk ${assignedDeskNumber || 'your allocated desk'}.`,
                    type: 'profile',
                    createdBy: req.user.id
                });

                // In-app notification to requesting sub-admin
                if (request.requestedData?.subAdminId) {
                    await Notification.create({
                        recipient: request.requestedData.subAdminId,
                        title: 'Inactivation Request Disapproved',
                        message: `Super Admin disapproved your inactivation request for ${student.name}. The scholar was reactivated and restored to Desk ${assignedDeskNumber || 'original desk'}.${relocatedStudentName ? ` Conflicting occupant (${relocatedStudentName}) was relocated to a vacant desk.` : ''}${temporaryAssignedStudentName ? ` Conflicting occupant (${temporaryAssignedStudentName}) was placed on temporary desk status.` : ''}`,
                        type: 'request',
                        createdBy: req.user.id
                    });
                }

                await logAction(
                    req,
                    'student_inactivation_disapproved',
                    'User',
                    student._id,
                    student.name,
                    `Super Admin disapproved inactivation request. Scholar reactivated & restored to Desk ${assignedDeskNumber || 'N/A'}. Reason: ${adminResponse || 'Disapproved by Super Admin'}`
                );

                return res.status(200).json({
                    success: true,
                    message: `Inactivation request disapproved. Scholar ${student.name} reactivated and restored to Desk ${assignedDeskNumber || 'N/A'}.${relocatedStudentName ? ` Later occupant ${relocatedStudentName} relocated to a vacant desk.` : ''}${temporaryAssignedStudentName ? ` Later occupant ${temporaryAssignedStudentName} assigned as temporary borrower.` : ''}`,
                    request
                });
            }
        }

        // Handle seat change requests
        if (request.type === 'seat_change') {
            if (status === 'approved') {
                // Get the seats
                const currentSeat = await Seat.findById(request.currentData.seatId).populate('floor room');
                const requestedSeat = await Seat.findById(request.requestedData.seatId).populate('floor room');

                if (!currentSeat || !requestedSeat) {
                    return res.status(404).json({
                        success: false,
                        message: 'One or more seats not found'
                    });
                }

                // Check if requested seat is still vacant
                if (requestedSeat.assignedTo) {
                    // Automatically reject if seat became occupied
                    request.status = 'rejected';
                    request.adminResponse = 'The requested seat is no longer available';
                    request.reviewedBy = req.user.id;
                    request.reviewedAt = new Date();
                    await request.save();

                    // Notify student
                    await Notification.create({
                        recipient: request.student._id,
                        title: 'Seat Change Request Rejected',
                        message: `Your seat change request was rejected. The requested seat is no longer available.`,
                        type: 'request',
                        createdBy: req.user.id
                    });

                    // Send email
                    const { sendSeatChangeRejectedEmail } = require('../services/emailService');
                    try {
                        await sendSeatChangeRejectedEmail(request.student, requestedSeat, 'The requested seat is no longer available');
                    } catch (emailError) {
                        console.error('Email error:', emailError);
                    }

                    return res.status(400).json({
                        success: false,
                        message: 'Seat no longer available. Request automatically rejected.'
                    });
                }

                // 1. Deactivate old assignment
                const oldAssignment = currentSeat.assignments.find(a =>
                    a.student.toString() === request.student._id.toString() && a.status === 'active'
                );

                let shiftToMove = null;
                let legacyShiftToMove = null;
                let typeToMove = 'specific';
                let priceToMove = 0;

                // Find ALL active assignments for this student on the seat (handle duplicates)
                const studentAssignments = currentSeat.assignments.filter(
                    a => a.student.toString() === request.student._id.toString() && a.status === 'active'
                );

                if (studentAssignments.length > 0) {
                    studentAssignments.forEach(a => {
                        a.status = 'expired';
                        a.endDate = new Date();
                    });

                    // Capture old details from the first one usually
                    const oldAssignment = studentAssignments[0];
                    shiftToMove = oldAssignment.shift;
                    legacyShiftToMove = oldAssignment.legacyShift;
                    typeToMove = oldAssignment.type;
                    
                    if (req.body.useBaseFee) {
                        const sId = shiftToMove?._id || shiftToMove;
                        if (sId) {
                            priceToMove = requestedSeat.shiftPrices?.get(sId.toString()) || requestedSeat.basePrices?.day || 800;
                        } else if (legacyShiftToMove && requestedSeat.basePrices) {
                            priceToMove = requestedSeat.basePrices[legacyShiftToMove] || 800;
                        } else if (typeToMove === 'full_day' && requestedSeat.basePrices) {
                            priceToMove = requestedSeat.basePrices.full || 1200;
                        } else {
                            priceToMove = requestedSeat.price || 800;
                        }
                    } else if (req.body.updatedFee !== undefined && req.body.updatedFee !== null && req.body.updatedFee !== '') {
                        priceToMove = Number(req.body.updatedFee);
                    } else {
                        priceToMove = oldAssignment.price;
                    }

                    console.log('SEAT CHANGE DEBUG:', { useBaseFee: req.body.useBaseFee, updatedFee: req.body.updatedFee, priceToMove, oldAssignmentPrice: oldAssignment.price });

                    // Recalculate occupancy
                    // Note: assignments are modified in memory
                    // Filter again because we just modified status in memory!
                    const hasActive = currentSeat.assignments.some(a => a.status === 'active');
                    currentSeat.isOccupied = hasActive;

                    await currentSeat.save();
                } else if (oldAssignment) {
                    // Fallback if find() found one but filter didn't? Should be impossible, but keep safe
                    oldAssignment.status = 'expired';
                    
                    if (req.body.useBaseFee) {
                        const sId = oldAssignment.shift?._id || oldAssignment.shift;
                        if (sId) {
                            priceToMove = requestedSeat.shiftPrices?.get(sId.toString()) || requestedSeat.basePrices?.day || 800;
                        } else if (oldAssignment.legacyShift && requestedSeat.basePrices) {
                            priceToMove = requestedSeat.basePrices[oldAssignment.legacyShift] || 800;
                        } else if (oldAssignment.type === 'full_day' && requestedSeat.basePrices) {
                            priceToMove = requestedSeat.basePrices.full || 1200;
                        } else {
                            priceToMove = requestedSeat.price || 800;
                        }
                    } else if (req.body.updatedFee !== undefined && req.body.updatedFee !== null && req.body.updatedFee !== '') {
                        priceToMove = Number(req.body.updatedFee);
                    } else {
                        priceToMove = oldAssignment.price;
                    }
                    
                    await currentSeat.save();
                }

                // 2. Create new assignment
                requestedSeat.assignments.push({
                    student: request.student._id,
                    shift: shiftToMove,
                    legacyShift: legacyShiftToMove,
                    type: typeToMove,
                    price: priceToMove,
                    status: 'active',
                    assignedAt: new Date()
                });
                await requestedSeat.save();

                // Update existing pending/overdue fee records if price changed
                if (priceToMove) {
                    await Fee.updateMany(
                        { student: request.student._id, status: { $in: ['pending', 'overdue'] } },
                        { $set: { amount: priceToMove } }
                    );
                }

                // 3. Update User reference
                await User.findByIdAndUpdate(request.student._id, {
                    seat: requestedSeat._id
                });

                // Send approval email
                const { sendSeatChangeApprovedEmail } = require('../services/emailService');
                try {
                    await sendSeatChangeApprovedEmail(request.student, currentSeat, requestedSeat);
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }

                // Create in-app notification
                await Notification.create({
                    recipient: request.student._id,
                    title: 'Seat Change Approved!',
                    message: `Your seat change request has been approved! You have been moved from seat ${currentSeat.number} to seat ${requestedSeat.number}.`,
                    type: 'seat',
                    createdBy: req.user.id
                });

                // Log action
                await logAction(
                    req,
                    'seat_change_approved',
                    'Request',
                    request._id,
                    `${request.student.name} - Seat Change`,
                    `Approved seat change from ${currentSeat.number} to ${requestedSeat.number}`
                );

            } else {
                // Rejection
                const requestedSeat = await Seat.findById(request.requestedData.seatId);

                // Send rejection email
                const { sendSeatChangeRejectedEmail } = require('../services/emailService');
                try {
                    await sendSeatChangeRejectedEmail(request.student, requestedSeat, adminResponse || 'No reason provided');
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }

                // Create in-app notification
                await Notification.create({
                    recipient: request.student._id,
                    title: 'Seat Change Request Rejected',
                    message: `Your seat change request was rejected. ${adminResponse ? `Reason: ${adminResponse}` : ''}`,
                    type: 'request',
                    createdBy: req.user.id
                });

                // Log action
                await logAction(
                    req,
                    'seat_change_rejected',
                    'Request',
                    request._id,
                    `${request.student.name} - Seat Change`,
                    `Rejected seat change request. Reason: ${adminResponse || 'No reason provided'}`
                );
            }
        } else {
            // Handle other request types (existing logic for shift, profile, etc.)

            // Update shift in database if approved
            if (status === 'approved' && request.type === 'shift') {
                const seat = await Seat.findOne({
                    'assignments.student': request.student._id,
                    'assignments.status': 'active'
                }).populate('assignments.shift');

                if (seat) {
                    const assignment = seat.assignments.find(a =>
                        a.student.toString() === request.student._id.toString() && a.status === 'active'
                    );

                    if (assignment) {
                        // Store old shift info before updating
                        let oldShiftName = 'N/A';
                        if (assignment.shift && assignment.shift.name) {
                            oldShiftName = assignment.shift.name;
                        } else if (assignment.legacyShift) {
                            const legacyMap = { 'day': 'Morning', 'night': 'Evening', 'full': 'Full Day' };
                            oldShiftName = legacyMap[assignment.legacyShift] || assignment.legacyShift;
                        } else if (assignment.type === 'full_day') {
                            oldShiftName = 'Full Day';
                        }

                        // Update shift
                        const newShiftId = request.requestedData.shift;
                        let newShiftName = 'N/A';

                        if (newShiftId === 'full') {
                            assignment.type = 'full_day';
                            assignment.shift = null;
                            assignment.legacyShift = 'full';
                            newShiftName = 'Full Day';
                        } else if (['day', 'night'].includes(newShiftId)) {
                            assignment.type = 'specific';
                            assignment.shift = null;
                            assignment.legacyShift = newShiftId;
                            const legacyMap = { 'day': 'Morning', 'night': 'Evening' };
                            newShiftName = legacyMap[newShiftId] || newShiftId;
                        } else {
                            // Dynamic shift - fetch shift name
                            const shiftDoc = await Shift.findById(newShiftId);
                            if (shiftDoc) {
                                newShiftName = shiftDoc.name;
                                assignment.shift = newShiftId;
                                assignment.legacyShift = null;
                                assignment.type = 'specific';
                            }
                        }

                        // Calculate monthly fee (use assignment.price or seat pricing)
                        if (req.body.useBaseFee) {
                            if (assignment.shift) {
                                const shiftId = assignment.shift._id || assignment.shift;
                                assignment.price = seat.shiftPrices?.get(shiftId.toString()) || seat.basePrices?.day || 800;
                            } else if (assignment.legacyShift && seat.basePrices) {
                                assignment.price = seat.basePrices[assignment.legacyShift] || 800;
                            } else if (assignment.type === 'full_day' && seat.basePrices) {
                                assignment.price = seat.basePrices.full || 1200;
                            }
                        } else if (req.body.updatedFee !== undefined && req.body.updatedFee !== null && req.body.updatedFee !== '') {
                            assignment.price = Number(req.body.updatedFee);
                        }
                        
                        let monthlyFee = assignment.price || 0;
                        if (!monthlyFee) {
                            // Fallback to seat pricing
                            if (assignment.shift) {
                                const shiftId = assignment.shift._id || assignment.shift;
                                monthlyFee = seat.shiftPrices?.get(shiftId.toString()) || seat.basePrices?.day || 800;
                            } else if (assignment.legacyShift && seat.basePrices) {
                                monthlyFee = seat.basePrices[assignment.legacyShift] || 800;
                            } else if (assignment.type === 'full_day' && seat.basePrices) {
                                monthlyFee = seat.basePrices.full || 1200;
                            }
                        }

                        await seat.save();

                        // Update existing pending/overdue fee records if price changed
                        if (assignment.price) {
                            await Fee.updateMany(
                                { student: request.student._id, status: { $in: ['pending', 'overdue'] } },
                                { $set: { amount: assignment.price } }
                            );
                        }

                        // Send shift change approved email
                        try {
                            await emailService.sendShiftChangeApprovedEmail(
                                request.student,
                                oldShiftName,
                                newShiftName,
                                monthlyFee
                            );
                        } catch (emailError) {
                            console.error('Shift change email error:', emailError);
                        }
                    }
                }
            } else if (request.type === 'shift' && status === 'rejected') {
                // Send shift change rejected email
                const newShiftId = request.requestedData.shift;
                let requestedShiftName = 'N/A';

                if (newShiftId === 'full') {
                    requestedShiftName = 'Full Day';
                } else if (['day', 'night'].includes(newShiftId)) {
                    const legacyMap = { 'day': 'Morning', 'night': 'Evening' };
                    requestedShiftName = legacyMap[newShiftId] || newShiftId;
                } else {
                    const shiftDoc = await Shift.findById(newShiftId);
                    if (shiftDoc) {
                        requestedShiftName = shiftDoc.name;
                    }
                }

                try {
                    await emailService.sendShiftChangeRejectedEmail(
                        request.student,
                        requestedShiftName,
                        adminResponse
                    );
                } catch (emailError) {
                    console.error('Shift change rejection email error:', emailError);
                }
            } else {
                // Send generic request response email for non-shift requests
                try {
                    await emailService.sendRequestResponseEmail(request.student, request, status, adminResponse);
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }
            }

            // Create notification
            await Notification.create({
                recipient: request.student._id,
                title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your ${request.type} change request has been ${status}. ${adminResponse ? `Admin response: ${adminResponse}` : ''}`,
                type: 'request',
                createdBy: req.user.id
            });

            // Log action
            await logAction(
                req,
                `request_${status}`,
                'Request',
                request._id,
                `${request.student.name} - ${request.type}`,
                `${status.charAt(0).toUpperCase() + status.slice(1)} ${request.type} request`
            );
        }

        // Update request
        request.status = status;
        request.adminResponse = adminResponse || '';
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        await request.save();

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            request
        });

    } catch (error) {
        console.error('Handle request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete an action log
// @route   DELETE /api/admin/action-history/:id
exports.deleteActionLog = async (req, res) => {
    try {
        const log = await ActionLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log entry not found'
            });
        }

        await ActionLog.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Log deleted successfully',
            id: req.params.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


// @desc    Get all archived students
// @route   GET /api/admin/archives
exports.getArchivedStudents = async (req, res) => {
    try {
        const archives = await ArchivedStudent.find()
            .select('name email deletedAt joinedAt profileImage')
            .sort({ deletedAt: -1 });

        res.status(200).json({
            success: true,
            archives
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single archived student details
// @route   GET /api/admin/archives/:id
exports.getArchivedStudent = async (req, res) => {
    try {
        const archive = await ArchivedStudent.findById(req.params.id)
            .populate('deletedBy', 'name');

        if (!archive) {
            return res.status(404).json({
                success: false,
                message: 'Archived record not found'
            });
        }

        res.status(200).json({
            success: true,
            archive
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Permanently delete archived student
// @route   DELETE /api/admin/archives/:id
exports.deleteArchivedStudent = async (req, res) => {
    try {
        const archive = await ArchivedStudent.findById(req.params.id);

        if (!archive) {
            return res.status(404).json({
                success: false,
                message: 'Archived record not found'
            });
        }

        await ArchivedStudent.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Archived record deleted permanently',
            id: req.params.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Clear all action history
// @route   DELETE /api/admin/action-history/clear
exports.clearActionHistory = async (req, res) => {
    try {
        await ActionLog.deleteMany({});

        await logAction(req, 'clear_history', 'System', null, 'Action Logs', 'Cleared all action history logs');

        res.status(200).json({
            success: true,
            message: 'All action history cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Clear all archived students
// @route   DELETE /api/admin/archives/clear
exports.clearArchives = async (req, res) => {
    try {
        await ArchivedStudent.deleteMany({});

        await logAction(req, 'clear_archives', 'System', null, 'Archives', 'Cleared all archived student records');

        res.status(200).json({
            success: true,
            message: 'All archived records cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({
                libraryName: 'Library Management System',
                address: 'Main St',
                contactNumber: '1234567890',
                email: 'admin@library.com',
                termsAndConditions: 'Default terms',
                systemStatus: 'active'
            });
        }

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
    try {
        const { libraryName, address, contactNumber, email, termsAndConditions, systemStatus, activeModes } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({});
        }

        if (activeModes) settings.activeModes = activeModes; // Update activeModes
        settings.libraryName = libraryName || settings.libraryName;
        settings.address = address || settings.address;
        settings.contactNumber = contactNumber || settings.contactNumber;
        settings.email = email || settings.email;
        settings.termsAndConditions = termsAndConditions || settings.termsAndConditions;
        if (systemStatus) settings.systemStatus = systemStatus;

        settings.updatedBy = req.user.id;
        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Fix seat occupancy consistency
// @route   POST /api/admin/fix-seats
exports.fixSeatOccupancy = async (req, res) => {
    try {
        const seats = await Seat.find({});
        let updatedCount = 0;

        for (const seat of seats) {
            let changed = false;
            const newAssignments = [];

            for (const assignment of seat.assignments) {
                // Check if student exists
                if (assignment.student) {
                    const student = await User.findById(assignment.student);
                    if (student) {
                        newAssignments.push(assignment);
                    } else {
                        changed = true; // Student not found
                    }
                } else {
                    changed = true; // No student ID
                }
            }

            if (changed) {
                seat.assignments = newAssignments;
                const activeAssignments = seat.assignments.filter(a => a.status === 'active');
                seat.isOccupied = activeAssignments.length > 0;
                await seat.save();
                updatedCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Fixed ${updatedCount} seats`,
            updatedCount
        });
    } catch (error) {
        console.error('Fix Seats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ==========================================
// QR KIOSK MANAGEMENT
// ==========================================

// @desc    Generate/Reset QR Token
// @route   POST /api/admin/qr/generate
exports.generateQrToken = async (req, res) => {
    try {
        const token = randomUUID();

        await SystemSetting.findOneAndUpdate(
            { key: 'attendance_qr_token' },
            { value: token },
            { upsert: true, new: true }
        );

        await logAction(req, 'generate_qr', 'System', null, 'QR Token', 'Regenerated Kiosk QR Token');

        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get Current QR Token
// @route   GET /api/admin/qr/token
exports.getQrToken = async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ key: 'attendance_qr_token' });

        // If no token exists, generate one automatically
        if (!setting) {
            const token = randomUUID();
            await SystemSetting.create({ key: 'attendance_qr_token', value: token });
            return res.status(200).json({ success: true, token });
        }

        res.status(200).json({ success: true, token: setting.value });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Reset All Student QR Tokens (Invalidate old ID Cards)
// @route   POST /api/admin/reset-student-qrs
exports.resetAllQrTokens = async (req, res) => {
    try {
        const User = require('../models/User');
        const crypto = require('crypto');

        const users = await User.find({ role: 'student' });
        let count = 0;

        // Parallelize updates
        for (const user of users) {
            user.qrToken = crypto.randomBytes(16).toString('hex');
            await user.save({ validateBeforeSave: false });
            count++;
        }

        res.status(200).json({
            success: true,
            message: `Successfully reset QR Tokens for ${count} students. Old QRs are now invalid.`
        });
    } catch (error) {
        console.error('Reset QR Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error resetting tokens',
            error: error.message
        });
    }
};

// @desc    Mark attendance via QR Kiosk (Admin/Device)
// @route   POST /api/admin/attendance/mark
exports.markAttendanceByQrAdmin = async (req, res) => {
    try {
        const { qrCode, kioskToken } = req.body; // qrCode is the Student ID (or encrypted string)

        // 1. Validate Kiosk Token
        const setting = await SystemSetting.findOne({ key: 'attendance_qr_token' });
        if (!setting || setting.value !== kioskToken) {
            return res.status(401).json({ success: false, message: 'Invalid Kiosk Token' });
        }

        // 2. Find Student
        // Handle "AL-" or "HL-" prefix or raw ID
        let studentId = qrCode;
        if (studentId && (studentId.toUpperCase().startsWith('AL-') || studentId.toUpperCase().startsWith('HL-'))) {
            studentId = studentId.substring(3);
        }

        const student = await User.findById(studentId)
            .populate('seat')
            .populate({
                path: 'seat',
                populate: { path: 'room floor assignments.shift' }
            });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Prepare student details for UI (Avatar, Name, Seat, etc.)
        let seatInfo = 'No Seat';
        let shiftInfo = 'N/A';

        if (student.seat && student.seat.assignments) {
            const assignment = student.seat.assignments.find(a =>
                a.student.toString() === student._id.toString() &&
                a.status === 'active'
            );

            if (assignment) {
                seatInfo = `${student.seat.number} (${student.seat.room?.name || 'Room'})`;
                if (assignment.shift?.name) shiftInfo = assignment.shift.name;
                else if (assignment.legacyShift) shiftInfo = assignment.legacyShift;
                else if (assignment.type === 'full_day') shiftInfo = 'Full Day';
            }
        }

        const studentData = {
            _id: student._id,
            name: student.name,
            studentId: student.studentId || 'N/A',
            profileImage: student.profileImage,
            seat: seatInfo,
            shift: shiftInfo,
            isActive: student.isActive
        };

        // 3. Check Membership Status (Red Card)
        if (!student.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Membership Expired',
                student: studentData // Return data for Red Card
            });
        }

        // 4. Mark Attendance (Toggle)
        const now = getISTDate();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        console.log(`[KioskScan] IST Time: ${currentTime}`);
        const today = getISTDate();
        today.setHours(0, 0, 0, 0);

        // Find existing active session for today
        const existingSession = await Attendance.findOne({
            student: student._id,
            date: today,
            isActive: true
        });

        let type = 'check-in';
        let attendanceRecord;

        if (existingSession) {
            // Check Out
            existingSession.exitTime = currentTime;
            existingSession.isActive = false;
            // Calculate duration (simple diff in minutes)
            const [h1, m1] = existingSession.entryTime.split(':').map(Number);
            const [h2, m2] = currentTime.split(':').map(Number);
            const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
            existingSession.duration = minutes > 0 ? minutes : 0;

            await existingSession.save();
            type = 'check-out';
            attendanceRecord = existingSession;
        } else {
            // Check In
            // Check if already checked out today? Allow multiple entries? 
            // For Kiosk mode, usually we allow re-entry.
            attendanceRecord = await Attendance.create({
                student: student._id,
                date: today,
                entryTime: currentTime,
                status: 'present',
                isActive: true,
                markedBy: req.user ? req.user.id : undefined // Might be null if pure kiosk auth
            });
            type = 'check-in';
        }

        // 5. Success Response (Green Card)
        res.status(200).json({
            success: true,
            type, // 'check-in' or 'check-out'
            message: type === 'check-in' ? `Welcome, ${student.name}` : `Goodbye, ${student.name}`,
            time: currentTime,
            student: studentData
        });

    } catch (error) {
        console.error('Kiosk Scan Error:', error);
        res.status(500).json({ success: false, message: 'Scan failed', error: error.message });
    }
};

// ==========================================
// HELPER FUNCTIONS (HOISTED)
// ==========================================

// Helper: Generate random password
function generatePassword() {
    return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
}

// Helper: Log Action
async function logAction(req, action, targetModel, targetId, targetName, details) {
    try {
        await ActionLog.create({
            admin: req.user.id,
            adminName: req.user.name,
            action,
            targetModel,
            targetId,
            targetName,
            details,
            ipAddress: req.ip || (req.connection ? req.connection.remoteAddress : undefined)
        });
    } catch (error) {
        console.error('Action Log Failed:', error.message);
    }
}

// @desc    Get mock tests history for a specific student (Admin Panel Credit Info)
// @route   GET /api/admin/students/:id/mock-tests
exports.getStudentMockTests = async (req, res) => {
    try {
        const studentId = req.params.id;
        const attempts = await MockTestAttempt.find({ user: studentId })
            .sort({ startedAt: -1 })
            .select('-testData'); // Exclude heavy question data, only need metadata

        res.json({ success: true, attempts });
    } catch (error) {
        console.error('Fetch Student Mock Tests Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch mock test history' });
    }
};

// @desc    Swap seats of two students (only seat changes, nothing else)
// @route   POST /api/admin/seats/swap
exports.swapSeats = async (req, res) => {
    try {
        const { studentId1, studentId2 } = req.body;

        if (!studentId1 || !studentId2) {
            return res.status(400).json({ success: false, message: 'Both student IDs are required' });
        }

        if (studentId1 === studentId2) {
            return res.status(400).json({ success: false, message: 'Cannot swap a student with themselves' });
        }

        // Fetch both students
        const [student1, student2] = await Promise.all([
            User.findById(studentId1).select('name email'),
            User.findById(studentId2).select('name email')
        ]);

        if (!student1) return res.status(404).json({ success: false, message: 'First student not found' });
        if (!student2) return res.status(404).json({ success: false, message: 'Second student not found' });

        // Find active seat assignments for both students
        const [seat1, seat2] = await Promise.all([
            Seat.findOne({ 'assignments': { $elemMatch: { student: studentId1, status: 'active' } } }),
            Seat.findOne({ 'assignments': { $elemMatch: { student: studentId2, status: 'active' } } })
        ]);

        if (!seat1) return res.status(400).json({ success: false, message: `${student1.name} does not have an active seat assignment` });
        if (!seat2) return res.status(400).json({ success: false, message: `${student2.name} does not have an active seat assignment` });

        // Prevent swapping if both are on the same seat (edge case)
        if (seat1._id.toString() === seat2._id.toString()) {
            return res.status(400).json({ success: false, message: 'Both students are already on the same seat' });
        }

        // ─── Perform the swap ─────────────────────────────────────────────────
        // Find the specific assignment objects to swap their metadata
        const asgn1 = seat1.assignments.find(a => a.student.toString() === studentId1 && a.status === 'active');
        const asgn2 = seat2.assignments.find(a => a.student.toString() === studentId2 && a.status === 'active');

        // Update seat1: replace student1's assignment with student2's assignment data
        await Seat.updateOne(
            { _id: seat1._id, 'assignments': { $elemMatch: { student: new mongoose.Types.ObjectId(studentId1), status: 'active' } } },
            { $set: { 
                'assignments.$.student': new mongoose.Types.ObjectId(studentId2),
                'assignments.$.price': asgn2.price,
                'assignments.$.shift': asgn2.shift,
                'assignments.$.legacyShift': asgn2.legacyShift,
                'assignments.$.type': asgn2.type,
                'assignments.$.assignedAt': asgn2.assignedAt
            } }
        );

        // Update seat2: replace student2's assignment with student1's assignment data
        await Seat.updateOne(
            { _id: seat2._id, 'assignments': { $elemMatch: { student: new mongoose.Types.ObjectId(studentId2), status: 'active' } } },
            { $set: { 
                'assignments.$.student': new mongoose.Types.ObjectId(studentId1),
                'assignments.$.price': asgn1.price,
                'assignments.$.shift': asgn1.shift,
                'assignments.$.legacyShift': asgn1.legacyShift,
                'assignments.$.type': asgn1.type,
                'assignments.$.assignedAt': asgn1.assignedAt
            } }
        );

        // Update the User.seat reference for both students
        await Promise.all([
            User.findByIdAndUpdate(studentId1, { seat: seat2._id }),
            User.findByIdAndUpdate(studentId2, { seat: seat1._id })
        ]);

        // Send in-app notifications to both students
        await Promise.all([
            Notification.create({
                recipient: studentId1,
                title: 'Seat Swapped',
                message: `Your seat has been changed to Seat ${seat2.number} by the admin.`,
                type: 'seat',
                createdBy: req.user.id
            }),
            Notification.create({
                recipient: studentId2,
                title: 'Seat Swapped',
                message: `Your seat has been changed to Seat ${seat1.number} by the admin.`,
                type: 'seat',
                createdBy: req.user.id
            })
        ]);

        // Log the action
        await logAction(
            req,
            'swap_seats',
            'Seat',
            seat1._id,
            `${seat1.number} ↔ ${seat2.number}`,
            `Swapped seats of ${student1.name} (→ Seat ${seat2.number}) and ${student2.name} (→ Seat ${seat1.number})`
        );

        try {
            const redis = getClient();
            await redis.del('seats:vacant');
            await redis.del('seats:public');
        } catch (err) {}

        res.status(200).json({
            success: true,
            message: `Seats swapped successfully! ${student1.name} → Seat ${seat2.number}, ${student2.name} → Seat ${seat1.number}`
        });
    } catch (error) {
        console.error('Swap Seats Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get engagement activities of all students
// @route   GET /api/admin/engagement/activities
exports.getStudentEngagementActivities = async (req, res) => {
    try {
        const StudyStreak = require('../models/StudyStreak');
        const DailyQuizAttempt = require('../models/DailyQuizAttempt');
        const User = require('../models/User');

        const { search = '', page = 1, limit = 20, sortBy = 'xp' } = req.query;

        // Build query for students
        const userQuery = { role: 'student', isActive: true, isDisabled: { $ne: true } };
        if (search) {
            userQuery.name = { $regex: search, $options: 'i' };
        }

        // Fetch matching students
        const students = await User.find(userQuery).select('name studentId email mobile profileImage examTarget');
        const studentIds = students.map(s => s._id);

        // Fetch streaks
        const streaks = await StudyStreak.find({ user: { $in: studentIds } });
        const streakMap = {};
        streaks.forEach(s => {
            streakMap[s.user.toString()] = s;
        });

        // Fetch quiz attempt counts for these students
        const quizAttempts = await DailyQuizAttempt.aggregate([
            { $match: { user: { $in: studentIds } } },
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        const quizCountMap = {};
        quizAttempts.forEach(q => {
            quizCountMap[q._id.toString()] = q.count;
        });

        // Combine into rich activity records
        let records = students.map(student => {
            const streakInfo = streakMap[student._id.toString()] || {
                currentStreak: 0,
                longestStreak: 0,
                totalXP: 0,
                level: 1,
                totalFocusTime: 0,
                achievements: []
            };

            return {
                _id: student._id,
                name: student.name,
                studentId: student.studentId,
                email: student.email,
                mobile: student.mobile,
                profileImage: student.profileImage,
                examTarget: student.examTarget,
                currentStreak: streakInfo.currentStreak,
                longestStreak: streakInfo.longestStreak,
                totalXP: streakInfo.totalXP,
                level: streakInfo.level,
                totalFocusTime: streakInfo.totalFocusTime,
                achievementsCount: streakInfo.achievements ? streakInfo.achievements.length : 0,
                quizAttemptsCount: quizCountMap[student._id.toString()] || 0
            };
        });

        // Sort records
        if (sortBy === 'xp') {
            records.sort((a, b) => b.totalXP - a.totalXP);
        } else if (sortBy === 'streak') {
            records.sort((a, b) => b.currentStreak - a.currentStreak);
        } else if (sortBy === 'focus') {
            records.sort((a, b) => b.totalFocusTime - a.totalFocusTime);
        } else if (sortBy === 'quiz') {
            records.sort((a, b) => b.quizAttemptsCount - a.quizAttemptsCount);
        }

        // Pagination
        const total = records.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedRecords = records.slice(startIndex, endIndex);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            activities: paginatedRecords
        });
    } catch (error) {
        console.error('Get student engagement activities error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get complete engagement and test details of a specific student
// @route   GET /api/admin/students/:id/engagement-details
exports.getStudentEngagementDetails = async (req, res) => {
    try {
        const studentId = req.params.id;
        const User = require('../models/User');
        const StudyStreak = require('../models/StudyStreak');
        const DailyQuizAttempt = require('../models/DailyQuizAttempt');
        const MockTestAttempt = require('../models/MockTestAttempt');

        const student = await User.findById(studentId).select('name studentId email mobile profileImage examTarget isActive isDisabled');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        if (!student.isActive || student.isDisabled) {
            return res.status(403).json({ success: false, message: 'This student account is inactive or disabled.' });
        }

        // Fetch StudyStreak/Activity logs
        let streak = await StudyStreak.findOne({ user: studentId });
        if (!streak) {
            streak = {
                currentStreak: 0,
                longestStreak: 0,
                totalXP: 0,
                level: 1,
                totalFocusTime: 0,
                achievements: [],
                activityLog: []
            };
        }

        // Fetch Daily Quiz Attempts (populated with DailyQuiz questions to see options/subject/date)
        const quizAttempts = await DailyQuizAttempt.find({ user: studentId })
            .populate('quiz')
            .sort({ completedAt: -1 });

        // Fetch Mock Test Attempts (metadata)
        const mockTestAttempts = await MockTestAttempt.find({ user: studentId })
            .sort({ startedAt: -1 });

        // Fetch AI Activity Logs
        const AIActivityLog = require('../models/AIActivityLog');
        const aiActivities = await AIActivityLog.find({ student: studentId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            student,
            streak,
            quizAttempts,
            mockTestAttempts,
            aiActivities
        });
    } catch (error) {
        console.error('Get student engagement details error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get latest AI activity logs of all students
// @route   GET /api/admin/ai-activity
exports.getAIActivityLogs = async (req, res) => {
    try {
        const AIActivityLog = require('../models/AIActivityLog');
        const { search, tool } = req.query;

        let query = {};
        if (tool) {
            query.toolName = tool;
        }
        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } }
            ];
        }

        const logs = await AIActivityLog.find(query)
            .populate({
                path: 'student',
                select: 'name studentId seat profileImage',
                populate: { path: 'seat', select: 'number room' }
            })
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.status(200).json({
            success: true,
            logs
        });
    } catch (error) {
        console.error('Get AI activity logs error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};