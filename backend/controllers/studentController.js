const User = require('../models/User');
const Seat = require('../models/Seat');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const SystemSetting = require('../models/SystemSetting');
const Holiday = require('../models/Holiday');
const Settings = require('../models/Settings');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// ─── Geo-Fence Helpers ────────────────────────────────────────────────────
// Haversine formula: returns distance in metres between two lat/lng points
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth radius in metres
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Returns an object { error: string|null, distance: number|null }
const checkGeoFence = async (latitude, longitude) => {
    // First check if location attendance is required by the admin
    const SystemSetting = require('../models/SystemSetting');
    const Settings = require('../models/Settings');

    try {
        const settings = await Settings.findOne().select('locationAttendance');
        if (settings && settings.locationAttendance === false) {
            console.log('[GEO-FENCE] Skipped: locationAttendance is disabled in admin settings');
            return { error: null, distance: null };
        }
    } catch (err) {
        console.error('[GEO-FENCE] Error fetching settings:', err);
    }

    const libLat = parseFloat(process.env.LIBRARY_LAT);
    const libLng = parseFloat(process.env.LIBRARY_LNG);
    const radiusM = parseFloat(process.env.LIBRARY_RADIUS_M) || 100;

    console.log(`[GEO-FENCE] Config: LAT=${libLat}, LNG=${libLng}, RADIUS=${radiusM}`);
    console.log(`[GEO-FENCE] Received: LAT=${latitude}, LNG=${longitude}`);

    // If coordinates not configured in .env, skip the check (dev mode)
    if (isNaN(libLat) || isNaN(libLng)) {
        console.log('[GEO-FENCE] Skipped: .env coordinates not set or invalid');
        return { error: null, distance: null };
    }

    if (latitude == null || longitude == null) {
        console.log('[GEO-FENCE] Failed: No location provided by frontend');
        return { error: 'Location access is required to mark attendance. Please enable location and try again.', distance: null };
    }

    const dist = haversineDistance(parseFloat(latitude), parseFloat(longitude), libLat, libLng);
    console.log(`[GEO-FENCE] Calculated Distance: ${dist} metres`);

    if (dist > radiusM) {
        return { error: `You are too far from the library (${Math.round(dist)}m away). You must be within ${radiusM}m to mark attendance.`, distance: Math.round(dist) };
    }
    return { error: null, distance: Math.round(dist) };
};

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // ==========================================
        // PERFORMANCE OPTIMIZATION: Run independent queries in parallel
        // ==========================================
        const [seat, student, unreadCount, activeRequestsCount, settings] = await Promise.all([
            // Query 1: Get seat info
            Seat.findOne({
                'assignments.student': studentId,
                'assignments.status': 'active'
            })
                .populate('floor room')
                .populate('assignments.shift')
                .lean(), // Use lean() for faster read-only query

            // Query 2: Get student details
            User.findById(studentId)
                .select('registrationSource createdAt name isActive doubtCredits doubtCreditsResetDate')
                .lean(),

            // Query 3: Get unread notifications count
            Notification.countDocuments({
                recipient: studentId,
                isRead: false
            }),

            // Query 4: Get active requests count
            Request.countDocuments({
                student: studentId,
                status: { $in: ['pending', 'approved', 'rejected'] }
            }),

            // Query 5: System Settings
            Settings.findOne().lean()
        ]);

        let assignedSeatData = null;
        if (seat) {
            // Find ALL active assignments for this student
            const myAssignments = seat.assignments.filter(
                a => a.student.toString() === studentId.toString() && a.status === 'active'
            );

            const shiftsArr = myAssignments.map(a => {
                if (a.shift && a.shift.name) {
                    return { _id: a.shift._id, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime };
                } else if (a.legacyShift) {
                    return { name: a.legacyShift };
                } else if (a.type === 'full_day') {
                    return { name: 'Full Day' };
                }
                return null;
            }).filter(Boolean);

            const shiftName = shiftsArr.map(s => s.name).join(' + ') || 'N/A';

            assignedSeatData = {
                number: seat.number,
                floor: seat.floor?.name,
                room: seat.room?.name,
                roomId: seat.room?.roomId || null,
                roomHasAc: seat.room?.hasAc || false,
                roomHasFan: seat.room?.hasFan || false,
                shift: shiftName,          // backward compat
                shifts: shiftsArr,         // NEW: all shifts
                shiftDetails: shiftsArr[0] ? { startTime: shiftsArr[0].startTime, endTime: shiftsArr[0].endTime } : null,
                price: myAssignments[0]?.price || 0,
                assignedAt: myAssignments[0]?.assignedAt
            };
        }

        // Get current month attendance
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const studentJoinedDate = student.createdAt ? new Date(student.createdAt) : startOfMonth;
        studentJoinedDate.setHours(0, 0, 0, 0);

        const attendanceRecords = await Attendance.find({
            student: studentId,
            date: { $gte: studentJoinedDate, $lte: now }
        }).lean(); // Use lean() for faster query

        // Deduplicate attendance records (fix for multiple entries per day)
        const uniqueAttendanceMap = new Map();

        attendanceRecords.forEach(record => {
            const dateKey = new Date(record.date).toDateString(); // Group by Calendar Day

            // Do not count records before the student's admission date
            const admissionDate = new Date(student.createdAt);
            admissionDate.setHours(0, 0, 0, 0);
            if (new Date(record.date) < admissionDate) return;

            if (!uniqueAttendanceMap.has(dateKey)) {
                uniqueAttendanceMap.set(dateKey, record);
            } else {
                const existing = uniqueAttendanceMap.get(dateKey);

                // Conflict resolution: prefer the most recently updated record
                // (admin changes always update updatedAt, so admin overrides win)
                const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                const recordTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
                if (recordTime > existingTime) {
                    uniqueAttendanceMap.set(dateKey, record);
                }
            }
        });

        const cleanAttendance = Array.from(uniqueAttendanceMap.values());

        const presentCount = cleanAttendance.filter(a => a.status === 'present' || a.status === 'holiday').length;

        // Calculate true total working days possible for this student (Lifetime)
        const calcStartDate = new Date(studentJoinedDate);
        calcStartDate.setHours(0, 0, 0, 0);

        // Upper bound is today
        const calcEndDate = new Date(now.getTime());
        calcEndDate.setHours(23, 59, 59, 999);

        let totalDays = 0;
        if (calcEndDate >= calcStartDate) {
            // Difference in days (inclusive)
            const diffTime = calcEndDate.getTime() - calcStartDate.getTime();
            totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        // ── Compute attendance rank across all active students ──
        let attendanceRank = null;
        try {
            const allActiveStudents = await User.find({ role: 'student', isActive: true }).select('_id createdAt').lean();
            const allAttendance = await Attendance.aggregate([
                { $match: { student: { $in: allActiveStudents.map(s => s._id) }, status: { $in: ['present', 'holiday'] } } },
                { $group: { _id: { student: '$student', dateString: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } } },
                { $group: { _id: '$_id.student', uniqueDays: { $sum: 1 } } }
            ]);
            
            const uniqueMap = {};
            allAttendance.forEach(a => { uniqueMap[a._id.toString()] = a.uniqueDays; });
            
            const nowTime = now.getTime();
            const rankings = allActiveStudents.map(s => {
                const admDate = new Date(s.createdAt || now);
                admDate.setHours(0, 0, 0, 0);
                let stuTotal = 0;
                if (nowTime >= admDate.getTime()) {
                    stuTotal = Math.floor((nowTime - admDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                }
                const present = uniqueMap[s._id.toString()] || 0;
                const percentage = stuTotal > 0 ? Math.round((present / stuTotal) * 100) : 0;
                return { id: s._id.toString(), percentage };
            });
            
            rankings.sort((a, b) => b.percentage - a.percentage);
            
            let currentRank = 1;
            let previousPercentage = null;
            for (let i = 0; i < rankings.length; i++) {
                if (previousPercentage !== null && rankings[i].percentage < previousPercentage) {
                    currentRank = i + 1;
                }
                previousPercentage = rankings[i].percentage;
                if (rankings[i].id === studentId.toString()) {
                    attendanceRank = currentRank;
                    break;
                }
            }
        } catch (err) {
            console.error('Attendance Rank Error:', err);
            attendanceRank = null;
        }

        // Fetch Most Relevant Fee for Dashboard
        let currentFee = null;
        let feeReminder = null;
        const today = new Date();

        if (student) {
            // Sync fee amount from seat assignment price before reading fee
            if (seat) {
                const myActiveAssignment = seat.assignments.find(a =>
                    a.student.toString() === studentId.toString() && a.status === 'active'
                );
                if (myActiveAssignment && myActiveAssignment.price) {
                    await Fee.updateMany(
                        { student: studentId, status: { $in: ['pending', 'overdue'] } },
                        { $set: { amount: myActiveAssignment.price } }
                    );
                }
            }

            // 1. Fetch earliest unpaid fee (pending, partial, or overdue)
            currentFee = await Fee.findOne({
                student: studentId,
                status: { $in: ['pending', 'overdue', 'partial'] }
            }).sort({ dueDate: 1 }).lean();

            // 2. If all paid, fetch the most recent paid fee
            if (!currentFee) {
                currentFee = await Fee.findOne({
                    student: studentId,
                    status: 'paid'
                }).sort({ dueDate: -1 }).lean();
            }

            // Calculate Reminder
            if (currentFee && currentFee.status !== 'paid' && currentFee.dueDate) {
                const dueDate = new Date(currentFee.dueDate);
                
                // Reminder starts 5 days before due date
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - 5);

                if (today >= reminderDate) {
                    feeReminder = {
                        show: true,
                        amount: currentFee.status === 'partial' ? (currentFee.outstanding ?? currentFee.amount) : currentFee.amount,
                        dueDate: dueDate,
                        status: currentFee.status,
                        message: currentFee.status === 'partial'
                            ? `Partial payment recorded. Outstanding fee of Rs.${currentFee.outstanding ?? currentFee.amount} is due on ${dueDate.toLocaleDateString('en-GB')}.`
                            : `Your fee of Rs.${currentFee.amount} is due on ${dueDate.toLocaleDateString('en-GB')}. Please pay to avoid late fees.`
                    };
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                registrationSource: student?.registrationSource || 'admin',
                studentName: student?.name,
                isActive: student?.isActive, // Fresh status from DB
                seat: assignedSeatData,
                attendance: {
                    present: presentCount,
                    total: totalDays,
                    percentage: attendancePercentage,
                    rank: attendanceRank
                },
                fee: currentFee ? {
                    month: currentFee.month,
                    year: currentFee.year,
                    amount: currentFee.amount,
                    status: currentFee.status,
                    dueDate: currentFee.dueDate,
                    paidDate: currentFee.paidDate,
                    partialPaid: currentFee.partialPaid ?? 0,
                    outstanding: currentFee.outstanding ?? currentFee.amount,
                } : null,

                feeReminder, // Add reminder data
                unreadNotifications: unreadCount,
                requestsCount: activeRequestsCount,
                doubtCredits: (() => {
                    // Reset if it's a new day
                    const todayIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
                    if (student.doubtCreditsResetDate !== todayIST) return 10;
                    return student.doubtCredits ?? 10;
                })(),
                onlinePaymentEnabled: settings ? settings.onlinePaymentEnabled !== false : true
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

// @desc    Get my seat details
// @route   GET /api/student/seat
exports.getMySeat = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Updated query for new assignments structure
        const seat = await Seat.findOne({
            'assignments.student': studentId,
            'assignments.status': 'active'
        })
            .populate('floor')
            .populate('assignments.shift')
            .populate({
                path: 'room',
                populate: {
                    path: 'seats',
                    model: 'Seat'
                }
            });

        if (!seat) {
            return res.status(404).json({
                success: false,
                message: 'No seat assigned'
            });
        }

        // Find ALL active assignments for this student
        const myAssignments = seat.assignments.filter(
            a => a.student.toString() === studentId.toString() && a.status === 'active'
        );

        // Build shifts[] array from all assignments
        const shiftsArr = myAssignments.map(a => {
            if (a.shift && a.shift.name) {
                return { _id: a.shift._id, name: a.shift.name, startTime: a.shift.startTime, endTime: a.shift.endTime };
            } else if (a.legacyShift) {
                return { name: a.legacyShift };
            } else if (a.type === 'full_day') {
                return { name: 'Full Day' };
            }
            return null;
        }).filter(Boolean);

        // Backward compat: first shift as single string
        const shiftName = shiftsArr.map(s => s.name).join(' + ') || 'N/A';
        const shiftId = myAssignments[0]?.shift?._id || myAssignments[0]?.legacyShift || null;

        res.status(200).json({
            success: true,
            seat: {
                _id: seat._id,
                number: seat.number,
                floor: seat.floor,
                room: seat.room,
                shift: shiftName,        // backward compat
                shiftId: shiftId,        // backward compat
                shifts: shiftsArr,       // NEW: all assigned shifts
                price: myAssignments[0]?.price || 0,
                basePrices: seat.basePrices,
                shiftPrices: seat.shiftPrices
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

// @desc    Get attendance with ranking
// @route   GET /api/student/attendance
exports.getAttendance = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Get student to check admission date
        const student = await User.findById(req.user.id).select('createdAt');
        const admissionDate = new Date(student.createdAt);
        admissionDate.setHours(0, 0, 0, 0);

        // IST records stored as midnight UTC of the IST date can be UP TO 5h30m AHEAD of
        // the server's UTC clock (e.g. midnight-to-5:30am IST = 6:30pm-midnight UTC prev day).
        // Add a 24h buffer so tonight's IST attendance is never excluded.
        const queryEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get my ALL-TIME attendance
        const myAttendance = await Attendance.find({
            student: req.user.id,
            date: { $gte: admissionDate, $lte: queryEnd }
        }).sort({ date: 1 });

        // Deduplicate attendance records (fix for multiple entries per day)
        const uniqueAttendanceMap = new Map();

        myAttendance.forEach(record => {
            const dateKey = new Date(record.date).toDateString(); // Group by Calendar Day

            // Do not count records before the student's admission date
            if (new Date(record.date) < admissionDate) return;

            if (!uniqueAttendanceMap.has(dateKey)) {
                uniqueAttendanceMap.set(dateKey, record);
            } else {
                const existing = uniqueAttendanceMap.get(dateKey);
                // Prefer the most recently updated record (admin overrides always win)
                const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                const recordTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
                if (recordTime > existingTime) {
                    uniqueAttendanceMap.set(dateKey, record);
                }
            }
        });

        // Use deduplicated list for response and stats
        const cleanAttendance = Array.from(uniqueAttendanceMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

        const presentCount = cleanAttendance.filter(a => a.status === 'present' || a.status === 'holiday').length;

        // Calculate true total working days possible for this student (Lifetime)
        const calcStartDate = new Date(admissionDate);
        calcStartDate.setHours(0, 0, 0, 0);

        // Upper bound is today
        const calcEndDate = new Date(now.getTime());
        calcEndDate.setHours(23, 59, 59, 999);

        let totalDays = 0;
        if (calcEndDate >= calcStartDate) {
            // Difference in days (inclusive)
            const diffTime = calcEndDate.getTime() - calcStartDate.getTime();
            totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const myPercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        // Get all students' attendance for ranking
        const allStudents = await User.find({ role: 'student', isActive: true });

        const rankings = await Promise.all(allStudents.map(async (student) => {
            const admDate = new Date(student.createdAt);
            admDate.setHours(0, 0, 0, 0);

            let studentAttendance = await Attendance.find({
                student: student._id,
                date: { $gte: admDate, $lte: now }
            });

            // Deduplicate for ranking to prevent > 100% bug
            const distinctDates = new Set();
            studentAttendance.forEach(a => {
                if (a.status === 'present' || a.status === 'holiday') {
                    distinctDates.add(new Date(a.date).toDateString());
                }
            });
            const studentPresent = distinctDates.size;

            // Calculate true total working days possible for this student this month
            const calcStart = new Date(admDate);
            calcStart.setHours(0, 0, 0, 0);

            // Upper bound is today
            const calcEnd = new Date(now.getTime());
            calcEnd.setHours(23, 59, 59, 999);

            let studentTotal = 0;
            if (calcEnd >= calcStart) {
                const diffTime = calcEnd.getTime() - calcStart.getTime();
                studentTotal = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            const percentage = studentTotal > 0 ? Math.round((studentPresent / studentTotal) * 100) : 0;

            return {
                studentId: student._id,
                name: student.name,
                percentage
            };
        }));

        // Sort by percentage
        rankings.sort((a, b) => b.percentage - a.percentage);

        // Assign ranks (same percentage = same rank)
        let currentRank = 1;
        let previousPercentage = null;

        const rankedStudents = rankings.map((student, index) => {
            if (previousPercentage !== null && student.percentage < previousPercentage) {
                currentRank = index + 1;
            }
            previousPercentage = student.percentage;

            return {
                ...student,
                rank: currentRank,
                isMe: student.studentId.toString() === req.user.id.toString()
            };
        });

        // Fetch all holidays to include in response (so frontend can cross-reference)
        const holidays = await Holiday.find().select('name date').lean();

        res.status(200).json({
            success: true,
            myAttendance: cleanAttendance,
            summary: {
                present: presentCount,
                total: totalDays,
                percentage: myPercentage
            },
            rankings: rankedStudents,
            holidays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get monthly performance report data
// @route   GET /api/student/report
exports.getMonthlyReport = async (req, res) => {
    try {
        const studentId = req.user.id;
        const now = new Date();
        const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-12
        const year  = parseInt(req.query.year)  || now.getFullYear();

        const student = await User.findById(studentId).select('name email mobile createdAt').lean();
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        // Date range for the selected month
        const startDate = new Date(year, month - 1, 1);
        const endDate   = new Date(year, month, 0, 23, 59, 59);
        const isCurrentMonth = (month === now.getMonth() + 1 && year === now.getFullYear());
        const effectiveEnd = isCurrentMonth ? now : endDate;

        // All attendance records for this student in the month
        const records = await Attendance.find({
            student: studentId,
            date: { $gte: startDate, $lte: effectiveEnd }
        }).sort({ date: 1 }).lean();

        // Deduplicate by date — prefer most recently updated (admin overrides win)
        const dedupMap = new Map();
        records.forEach(r => {
            const key = new Date(r.date).toDateString();
            if (!dedupMap.has(key)) {
                dedupMap.set(key, r);
            } else {
                const ex = dedupMap.get(key);
                const exTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;
                const rTime = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
                if (rTime > exTime) dedupMap.set(key, r);
            }
        });

        const clean = Array.from(dedupMap.values());

        const presentDays = clean.filter(r => r.status === 'present' || r.status === 'holiday').length;
        const totalMinutes = clean.filter(r => r.status === 'present').reduce((sum, r) => sum + (r.duration || 0), 0);

        // Total calendar days from month start (or student join date if later) up to effectiveEnd
        const admissionDate = student.createdAt ? new Date(student.createdAt) : startDate;
        const calcStart = admissionDate > startDate ? admissionDate : startDate;
        calcStart.setHours(0, 0, 0, 0);
        const totalDays = Math.max(1, Math.floor((effectiveEnd - calcStart) / (1000 * 60 * 60 * 24)) + 1);

        const percentage = Math.round((presentDays / totalDays) * 100);

        // Build daily breakdown for the month (for display)
        const dailyBreakdown = clean.map(r => ({
            date: r.date,
            status: r.status,
            durationMins: r.duration || 0,
            entryTime: r.entryTime,
            exitTime: r.exitTime,
        }));

        // Fee for this month
        const fee = await Fee.findOne({ student: studentId, month, year }).lean();

        // Rank (by total present days lifetime, same as dashboard)
        let rank = null;
        try {
            const allActiveStudents = await User.find({ role: 'student', isActive: true }).select('_id createdAt').lean();
            const allAttendance = await Attendance.aggregate([
                { $match: { student: { $in: allActiveStudents.map(s => s._id) }, status: { $in: ['present', 'holiday'] } } },
                { $group: { _id: { student: '$student', dateString: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } } },
                { $group: { _id: '$_id.student', uniqueDays: { $sum: 1 } } }
            ]);
            
            const uniqueMap = {};
            allAttendance.forEach(a => { uniqueMap[a._id.toString()] = a.uniqueDays; });
            
            const nowTime = now.getTime();
            const rankings = allActiveStudents.map(s => {
                const admDate = new Date(s.createdAt || now);
                admDate.setHours(0, 0, 0, 0);
                let stuTotal = 0;
                if (nowTime >= admDate.getTime()) {
                    stuTotal = Math.floor((nowTime - admDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                }
                const present = uniqueMap[s._id.toString()] || 0;
                const percentage = stuTotal > 0 ? Math.round((present / stuTotal) * 100) : 0;
                return { id: s._id.toString(), percentage };
            });
            
            rankings.sort((a, b) => b.percentage - a.percentage);
            
            let currentRank = 1;
            let previousPercentage = null;
            for (let i = 0; i < rankings.length; i++) {
                if (previousPercentage !== null && rankings[i].percentage < previousPercentage) {
                    currentRank = i + 1;
                }
                previousPercentage = rankings[i].percentage;
                if (rankings[i].id === studentId.toString()) {
                    rank = currentRank;
                    break;
                }
            }
        } catch (err) {
            console.error('Report Rank Error:', err);
        }

        const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        res.json({
            success: true,
            report: {
                student: { name: student.name, email: student.email, mobile: student.mobile },
                month,
                year,
                monthName: MONTH_NAMES[month - 1],
                presentDays,
                totalDays,
                percentage,
                totalStudyHours: Math.floor(totalMinutes / 60),
                totalStudyMins: totalMinutes % 60,
                totalMinutes,
                rank,
                fee: fee ? { status: fee.status, amount: fee.amount, paidDate: fee.paidDate } : null,
                dailyBreakdown,
                generatedAt: new Date().toISOString(),
            }
        });
    } catch (err) {
        console.error('Monthly report error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

// @desc    Get fee status
// @route   GET /api/student/fees
exports.getFees = async (req, res) => {
    try {
        // Self-heal 1: fix any fees that have a paidDate but are still showing as pending/overdue
        await Fee.updateMany(
            { student: req.user.id, paidDate: { $ne: null }, status: { $in: ['pending', 'overdue'] } },
            { $set: { status: 'paid' } }
        );

        // Self-heal 2: sync pending/overdue fee amounts to current seat assignment price
        const activeSeat = await Seat.findOne({
            'assignments.student': req.user.id,
            'assignments.status': 'active'
        });
        if (activeSeat) {
            const activeAssignment = activeSeat.assignments.find(a =>
                a.student.toString() === req.user.id.toString() && a.status === 'active'
            );
            if (activeAssignment && activeAssignment.price) {
                await Fee.updateMany(
                    { student: req.user.id, status: { $in: ['pending', 'overdue'] } },
                    { $set: { amount: activeAssignment.price } }
                );
            }
        }

        let fees = await Fee.find({ student: req.user.id })
            .sort({ year: -1, month: -1 });

        // Auto-generate missing next-month fee on the due date limit
        const student = await User.findById(req.user.id);
        if (student && student.createdAt && fees.length > 0) {
            let currentFee = fees[0]; // Latest fee
            const joinedDate = new Date(student.createdAt);
            const billingDay = joinedDate.getDate();

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            let iter = 0;
            let generatedNew = false;
            
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

                const exists = await Fee.findOne({ student: student.id, month: nextMonth, year: nextYear });
                if (!exists) {
                    const nextCycleEnd = new Date(nextYear, nextMonth, billingDay - 1);
                    currentFee = await Fee.create({
                        student: student.id,
                        month: nextMonth,
                        year: nextYear,
                        amount: currentFee.amount,
                        dueDate: nextCycleEnd,
                        status: 'pending'
                    });
                    generatedNew = true;
                } else {
                    currentFee = exists;
                }
                iter++;
            }

            if (generatedNew) {
                fees = await Fee.find({ student: req.user.id })
                    .sort({ year: -1, month: -1 });
            }
        }

        const settings = await Settings.findOne() || { onlinePaymentEnabled: true };

        res.status(200).json({
            success: true,
            fees,
            onlinePaymentEnabled: settings.onlinePaymentEnabled !== false 
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Initialize a Razorpay order before frontend checkout
// @route   POST /api/student/fees/:id/create-order
exports.createFeePaymentOrder = async (req, res) => {
    try {
        const fee = await Fee.findOne({ _id: req.params.id, student: req.user.id });
        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
        if (fee.status === 'paid') return res.status(400).json({ success: false, message: 'Fee is already paid' });

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ success: false, message: 'Payment gateway not configured' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: fee.amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_fee_${fee._id}`,
        };

        const order = await razorpay.orders.create(options);
        
        // Save order ID to the fee for verification mapping later
        fee.razorpayOrderId = order.id;
        await fee.save();

        res.status(200).json({
            success: true,
            orderId: order.id,
            amount: options.amount,
            currency: options.currency
        });
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
    }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/student/fees/:id/verify-payment
exports.verifyFeePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const fee = await Fee.findOne({ _id: req.params.id, student: req.user.id });

        if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Signature is valid. Mark as paid.
            fee.status = 'paid';
            fee.paidDate = new Date();
            fee.razorpayPaymentId = razorpay_payment_id;
            await fee.save();

            return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment signature. Verification failed.' });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
    }
};

// @desc    Download receipt data for a paid fee
// @route   GET /api/student/fees/:id/receipt
exports.getReceipt = async (req, res) => {
    try {
        const fee = await Fee.findOne({ _id: req.params.id, student: req.user.id })
            .populate('student', 'name email mobile');

        if (!fee) {
            return res.status(404).json({ success: false, message: 'Fee record not found' });
        }

        if (fee.status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Receipt only available for paid fees' });
        }

        // Get seat info for the receipt
        const seat = await Seat.findOne({
            'assignments.student': req.user.id,
            'assignments.status': 'active'
        }).populate('floor room').populate('assignments.shift').lean();

        let seatInfo = null;
        if (seat) {
            const assignment = seat.assignments.find(a =>
                a.student.toString() === req.user.id.toString() && a.status === 'active'
            );
            seatInfo = {
                number: seat.number,
                floor: seat.floor?.name || 'N/A',
                room: seat.room?.name || 'N/A',
                shift: assignment?.shift?.name || assignment?.legacyShift || 'Full Day'
            };
        }

        const receiptNumber = `REC-${fee._id.toString().slice(-8).toUpperCase()}`;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        res.status(200).json({
            success: true,
            receipt: {
                receiptNumber,
                studentName: fee.student.name,
                studentEmail: fee.student.email,
                studentMobile: fee.student.mobile || 'N/A',
                amount: fee.amount,
                month: fee.month,
                year: fee.year,
                monthName: monthNames[fee.month - 1],
                paidDate: fee.paidDate,
                dueDate: fee.dueDate,
                seat: seatInfo
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get notifications
// @route   GET /api/student/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/student/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Submit change request
// @route   POST /api/student/request
exports.submitRequest = async (req, res) => {
    try {
        const { type, requestedData } = req.body;

        // Restriction: Only Active Members
        if (!req.user.isActive) {
            return res.status(403).json({ success: false, message: 'Inactive members cannot submit requests' });
        }

        // Restriction: Only Allocated Members (Not Pending)
        const hasSeat = await Seat.exists({
            'assignments.student': req.user.id,
            'assignments.status': 'active'
        });

        if (req.user.registrationSource === 'self' && !hasSeat) {
            return res.status(403).json({ success: false, message: 'Pending allocation members cannot submit requests' });
        }

        let currentData = {};

        if (type === 'seat' || type === 'shift') {
            const seat = await Seat.findOne({
                'assignments.student': req.user.id,
                'assignments.status': 'active'
            }).populate('assignments.shift');

            if (seat) {
                const assignment = seat.assignments.find(a => a.student.toString() === req.user.id && a.status === 'active');
                let shiftId = null;

                if (assignment) {
                    if (assignment.shift) {
                        shiftId = assignment.shift._id || assignment.shift;
                    } else if (assignment.legacyShift) {
                        shiftId = assignment.legacyShift;
                    } else if (assignment.type === 'full_day') {
                        shiftId = 'full';
                    }
                }

                currentData = {
                    seatNumber: seat.number,
                    shift: shiftId
                };
            }
        } else if (type === 'profile') {
            const user = await User.findById(req.user.id);
            currentData = {
                name: user.name,
                email: user.email
            };
        } else if (type === 'support') {
            // Support Ticket Logic
            currentData = {}; // No current data needed
            // requestedData contains { category, message } passed from frontend
        }

        // Special handling for legacy/combined Seat/Shift requests: Populate with readable details
        if (req.body.requestedData && req.body.requestedData.requestedSeatId) {
            try {
                const targetSeat = await Seat.findById(req.body.requestedData.requestedSeatId);
                if (targetSeat) {
                    const Room = require('../models/Room');
                    const Floor = require('../models/Floor');

                    const room = await Room.findOne({ seats: targetSeat._id });
                    const floor = room ? await Floor.findOne({ rooms: room._id }) : null;

                    // Mutate requestedData to add readable details
                    Object.assign(requestedData, {
                        seatNumber: targetSeat.number,
                        room: room ? room.name : 'Unknown Room',
                        floor: floor ? floor.name : 'Unknown Floor'
                    });
                }
            } catch (err) {
                console.error('Error populating seat details for request:', err);
            }
        }

        if (req.body.requestedData && req.body.requestedData.requestedShift) {
            requestedData.shift = req.body.requestedData.requestedShift;
        }

        // Generate 6-digit Ticket ID
        const ticketId = Math.floor(100000 + Math.random() * 900000).toString();

        const request = await Request.create({
            ticketId,
            student: req.user.id,
            type,
            currentData,
            requestedData,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get my requests
// @route   GET /api/student/request
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await Request.find({ student: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Withdraw/Close a request
// @route   PUT /api/student/request/:id/withdraw
exports.withdrawRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await Request.findOne({
            _id: id,
            student: req.user.id
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot withdraw a request that is already processed'
            });
        }

        request.status = 'withdrawn';
        await request.save();

        res.status(200).json({
            success: true,
            message: 'Request withdrawn successfully',
            request
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update profile
// @route   PUT /api/student/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name },
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Configure multer for file upload with Cloudinary
const upload = multer({
    storage: storage, // Use Cloudinary storage from config
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB (Vercel limit is 4.5MB)
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png)'));
        }
    }
}).single('profileImage');

// @desc    Upload profile image
// @route   POST /api/student/profile/image
exports.uploadProfileImage = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        console.log('Upload Request Body:', req.body);
        console.log('Upload Request File:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        try {
            // Cloudinary automatically handles file storage
            // File URL is available in req.file.path
            const imageUrl = req.file.path; // Cloudinary URL

            // Update user with new image URL
            const user = await User.findById(req.user.id);
            user.profileImage = imageUrl;
            await user.save();

            res.status(200).json({
                success: true,
                message: 'Profile image uploaded successfully',
                imagePath: imageUrl
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    });
};

// @desc    Delete profile image
// @route   DELETE /api/student/profile/image
exports.deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Cloudinary images persist even after removing from DB
        // If you want to delete from Cloudinary too, you'll need the publicId
        // For now, just remove the reference from the database
        user.profileImage = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile image deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available shifts for student's current seat
// @route   GET /api/student/available-shifts
exports.getAvailableShifts = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);

        // Get seat with all assignments and shift details
        const seat = await Seat.findOne({
            'assignments.student': req.user.id,
            'assignments.status': 'active'
        }).populate({
            path: 'assignments.shift',
            select: 'name startTime endTime'
        });

        if (!seat) {
            return res.status(400).json({
                success: false,
                message: 'No seat assigned'
            });
        }

        // Get active assignments on this seat (excluding current student)
        const otherAssignments = seat.assignments.filter(a =>
            a.status === 'active' && a.student.toString() !== student._id.toString()
        );

        // Get current student's assignment to exclude their current shift
        const myAssignment = seat.assignments.find(a =>
            a.status === 'active' && a.student.toString() === student._id.toString()
        );

        let myCurrentShift = null;
        if (myAssignment && myAssignment.shift) {
            myCurrentShift = myAssignment.shift;
        }

        // Get all possible shifts
        const Shift = require('../models/Shift');
        const allShifts = await Shift.find({ isActive: true });

        // Import overlap detection
        const { doTimeRangesOverlap } = require('../utils/timeUtils');

        // Filter to available shifts
        const availableShifts = allShifts.filter(candidateShift => {
            // Exclude current shift
            if (myCurrentShift && candidateShift._id.toString() === myCurrentShift._id.toString()) {
                return false;
            }

            // Check if this shift overlaps with any existing assignment
            for (const assignment of otherAssignments) {
                if (!assignment.shift || typeof assignment.shift !== 'object') continue;

                const hasOverlap = doTimeRangesOverlap(
                    candidateShift.startTime,
                    candidateShift.endTime,
                    assignment.shift.startTime,
                    assignment.shift.endTime
                );

                if (hasOverlap) return false; // Not available
            }
            return true; // Available
        });

        // Map occupied shifts for display
        const occupiedShifts = otherAssignments
            .filter(a => a.shift && typeof a.shift === 'object')
            .map(a => ({
                _id: a.shift._id,
                name: a.shift.name,
                startTime: a.shift.startTime,
                endTime: a.shift.endTime,
                occupiedBy: 'Another student' // Privacy - don't expose student names
            }));

        res.status(200).json({
            success: true,
            availableShifts,
            occupiedShifts,
            currentShift: myCurrentShift ? {
                _id: myCurrentShift._id,
                name: myCurrentShift.name,
                startTime: myCurrentShift.startTime,
                endTime: myCurrentShift.endTime
            } : null,
            currentSeat: {
                number: seat.number,
                totalOccupants: otherAssignments.length + 1 // Including the requesting student
            }
        });
    } catch (error) {
        console.error('Get available shifts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Change Password
// @route   PUT /api/student/password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect current password'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log to PasswordLog for Admin
        const PasswordLog = require('../models/PasswordLog');
        await PasswordLog.create({
            user: user._id,
            email: user.email,
            newPassword: newPassword, // Visible for admin per request
            source: 'profile_change'
        });

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Request seat change
// @route   POST /api/student/request-seat-change
exports.requestSeatChange = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { requestedSeatId, reason } = req.body;

        // Validation
        if (!requestedSeatId) {
            return res.status(400).json({
                success: false,
                message: 'Please select a seat'
            });
        }

        // Get student's current seat
        const currentSeat = await Seat.findOne({
            'assignments.student': studentId,
            'assignments.status': 'active'
        }).populate('floor room');

        if (!currentSeat) {
            return res.status(400).json({
                success: false,
                message: 'You do not have an assigned seat. Please contact admin.'
            });
        }

        // Get requested seat
        const requestedSeat = await Seat.findById(requestedSeatId).populate('floor room');

        if (!requestedSeat) {
            return res.status(404).json({
                success: false,
                message: 'Requested seat not found'
            });
        }

        // Check if requested seat is occupied (any active assignment)
        const isOccupied = requestedSeat.assignments && requestedSeat.assignments.some(a => a.status === 'active');
        if (isOccupied) {
            return res.status(400).json({
                success: false,
                message: 'This seat is already occupied. Please select a vacant seat.'
            });
        }

        // Check if requesting same seat
        if (currentSeat._id.toString() === requestedSeatId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot request your current seat'
            });
        }

        // Check for existing pending seat change request
        const existingRequest = await Request.findOne({
            student: studentId,
            type: 'seat_change',
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending seat change request. Please wait for admin review.'
            });
        }

        // Create seat change request
        const ticketId = Math.floor(100000 + Math.random() * 900000).toString();

        const request = await Request.create({
            ticketId,
            student: studentId,
            type: 'seat_change',
            currentData: {
                seatId: currentSeat._id,
                seatNumber: currentSeat.number,
                floor: currentSeat.floor.name,
                room: currentSeat.room.name
            },
            requestedData: {
                seatId: requestedSeat._id,
                seatNumber: requestedSeat.number,
                floor: requestedSeat.floor.name,
                room: requestedSeat.room.name,
                reason: reason || 'No reason provided'
            },
            status: 'pending'
        });

        // Get student details
        const student = await User.findById(studentId);

        // Send email notification
        const { sendSeatChangeRequestEmail } = require('../services/emailService');
        try {
            await sendSeatChangeRequestEmail(student, currentSeat, requestedSeat);
        } catch (emailError) {
            console.error('Email error:', emailError);
            // Continue even if email fails
        }

        // Create in-app notification
        await Notification.create({
            recipient: studentId,
            title: 'Seat Change Request Submitted',
            message: `Your request to change from seat ${currentSeat.number} to seat ${requestedSeat.number} has been submitted and is awaiting admin approval.`,
            type: 'request',
            createdBy: studentId
        });

        res.status(201).json({
            success: true,
            message: 'Seat change request submitted successfully',
            data: request
        });

    } catch (error) {
        console.error('Request seat change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark Attendance via Kiosk QR Scan
// @route   POST /api/student/attendance/qr-scan
exports.markAttendanceByQr = async (req, res) => {
    try {
        const { qrToken, latitude, longitude } = req.body;

        // Helper to get India Standard Time (UTC+5:30)
        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };

        if (!qrToken) {
            return res.status(400).json({ success: false, message: 'Invalid QR Code' });
        }

        // ── Geo-Fence Check ──────────────────────────────────────────────
        const { error: geoError, distance: geoDistance } = await checkGeoFence(latitude, longitude);
        if (geoError) {
            return res.status(403).json({ success: false, message: geoError });
        }

        // Verify Token
        const setting = await SystemSetting.findOne({ key: 'attendance_qr_token' });
        if (!setting || setting.value !== qrToken) {
            return res.status(400).json({ success: false, message: 'Invalid or Expired QR Code' });
        }

        const studentId = req.user.id;
        const user = await User.findById(studentId);

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is inactive.' });
        }

        // 1. Check for an OPEN/ACTIVE session first (Check-out priority)
        // Find any present record that has no exit time but HAS an entry time
        const activeSession = await Attendance.findOne({
            student: studentId,
            status: 'present',
            exitTime: null,
            entryTime: { $ne: null }
        }).sort({ date: -1 }); // Get the most recent one

        let attendance;
        let message = '';
        let type = '';

        if (activeSession) {
            // MARK EXIT
            attendance = activeSession;
            const now = getISTDate();

            // Calculate duration
            // Use the attendance date for the entry time base to handle overnight shifts correctly
            const entryParts = attendance.entryTime.split(':');
            const entryDate = new Date(attendance.date);
            entryDate.setHours(parseInt(entryParts[0]), parseInt(entryParts[1]), 0);

            // If entryDate > now (impossible unless clock screw), or very old?
            // Since we sorted by date desc, this should be the relevant one.

            const diffMs = now - entryDate;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) {
                return res.status(400).json({ success: false, message: 'Already checked in just now! Wait 1 min.' });
            }

            attendance.exitTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            attendance.duration = diffMins; // Controller calc provided for UI feedback, hook will also run
            await attendance.save();

            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            message = `Goodbye, ${user.name}! Exit marked. Duration: ${hours}h ${mins}m`;
            type = 'exit';

        } else {
            // MARK ENTRY
            const today = getISTDate();
            today.setHours(0, 0, 0, 0);

            // Check if we already have a completed record for TODAY
            const todayRecord = await Attendance.findOne({
                student: studentId,
                date: today
            });

            // If it's a holiday, we ALLOW them to mark entry.
            // If it's present and already exited, we show already marked popup.
            if (todayRecord && todayRecord.status === 'present' && todayRecord.exitTime) {
                return res.status(200).json({
                    success: true,
                    type: 'already_marked',
                    message: 'Attendance already completed for today.',
                    attendance: todayRecord
                });
            }

            // Create new Entry or Update Absent/Holiday Record
            const now = getISTDate();
            const entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            let shiftLabel = 'N/A';

            // Check Shift Logic
            const seat = await Seat.findOne({
                'assignments.student': studentId,
                'assignments.status': 'active'
            }).populate('assignments.shift');

            if (seat) {
                const assignment = seat.assignments.find(a => a.student.toString() === studentId.toString() && a.status === 'active');
                if (assignment) {
                    shiftLabel = assignment.shift ? assignment.shift.name : (assignment.legacyShift || 'Assigned');

                    // Check Shift Timing
                    if (assignment.shift && assignment.shift.startTime && assignment.shift.endTime) {
                        const [sH, sM] = assignment.shift.startTime.split(':').map(Number);
                        const [eH, eM] = assignment.shift.endTime.split(':').map(Number);

                        const allowedStart = getISTDate();
                        allowedStart.setHours(sH, sM - 180, 0, 0); // 3 hours before
                        const allowedEnd = getISTDate();
                        allowedEnd.setHours(eH, eM, 0, 0);

                        if (allowedEnd < allowedStart) {
                            if (now.getHours() < 12) allowedStart.setDate(allowedStart.getDate() - 1);
                            else allowedEnd.setDate(allowedEnd.getDate() + 1);
                        }

                        if (now < allowedStart || now > allowedEnd) {
                            return res.status(403).json({
                                success: false,
                                message: `Entry allowed only 3:00 hr before shift (${assignment.shift.startTime} - ${assignment.shift.endTime})`
                            });
                        }
                    }
                }
            }

            if (todayRecord) {
                // Preserve holiday notes if present
                const existingNotes = todayRecord.notes || '';
                const isHoliday = existingNotes.startsWith('Holiday - ');
                const baseShiftLabel = isHoliday ? existingNotes : `Marked via Kiosk QR (was ${todayRecord.status})`;

                attendance = todayRecord;
                attendance.status = 'present';
                attendance.entryTime = entryTime;
                attendance.exitTime = null;
                attendance.duration = 0;
                attendance.notes = isHoliday ? existingNotes : baseShiftLabel;
                if (geoDistance !== null) attendance.distanceMeters = geoDistance;
                await attendance.save();
                message = `Welcome back, ${user.name}! Entry marked at ${attendance.entryTime}`;
            } else {
                attendance = await Attendance.create({
                    student: studentId,
                    date: today,
                    status: 'present',
                    entryTime: entryTime,
                    notes: `Marked via Kiosk QR (${shiftLabel})`,
                    markedBy: studentId,
                    duration: 0,
                    distanceMeters: geoDistance !== null ? geoDistance : undefined
                });
                message = `Welcome, ${user.name}! Entry marked at ${attendance.entryTime}`;
            }
            type = 'entry';
        }

        res.status(200).json({
            success: true,
            message,
            type,
            attendance
        });

    } catch (error) {
        console.error('QR Scan Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Mark Attendance Self (No QR)
// @route   POST /api/student/attendance/mark-self
exports.markSelfAttendance = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };

        // ── Geo-Fence Check ──────────────────────────────────────────────
        const { error: geoError, distance: geoDistance } = await checkGeoFence(latitude, longitude);
        if (geoError) {
            return res.status(403).json({ success: false, message: geoError });
        }

        const studentId = req.user.id;
        const user = await User.findById(studentId);

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is inactive.' });
        }

        const activeSession = await Attendance.findOne({
            student: studentId,
            status: 'present',
            exitTime: null,
            entryTime: { $ne: null }
        }).sort({ date: -1 });

        let attendance;
        let message = '';
        let type = '';
        const now = getISTDate();

        if (activeSession) {
            attendance = activeSession;
            const entryParts = attendance.entryTime.split(':');
            const entryDate = new Date(attendance.date);
            entryDate.setHours(parseInt(entryParts[0]), parseInt(entryParts[1]), 0);

            const diffMs = now - entryDate;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) {
                return res.status(400).json({ success: false, message: 'Wait 1 min before checking out.' });
            }

            attendance.exitTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            attendance.duration = diffMins;
            await attendance.save();

            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            message = `Goodbye, ${user.name}! Exit marked. Duration: ${hours}h ${mins}m`;
            type = 'exit';
        } else {
            const today = getISTDate();
            today.setHours(0, 0, 0, 0);

            const todayRecord = await Attendance.findOne({ student: studentId, date: today });
            // If it's a holiday, we ALLOW them to mark entry.
            // If it's present and already exited, we show already marked popup.
            if (todayRecord && todayRecord.status === 'present' && todayRecord.exitTime) {
                return res.status(200).json({
                    success: true,
                    type: 'already_marked',
                    message: 'Attendance already completed for today.',
                    attendance: todayRecord
                });
            }

            const entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            let shiftLabel = 'Self Marked';

            // Check Shift Timing
            const seat = await Seat.findOne({
                'assignments.student': studentId,
                'assignments.status': 'active'
            }).populate('assignments.shift');

            if (seat) {
                const assignment = seat.assignments.find(a => a.student.toString() === studentId.toString() && a.status === 'active');
                if (assignment) {
                    shiftLabel = assignment.shift ? assignment.shift.name : (assignment.legacyShift || 'Assigned');

                    if (assignment.shift && assignment.shift.startTime && assignment.shift.endTime) {
                        const [sH, sM] = assignment.shift.startTime.split(':').map(Number);
                        const [eH, eM] = assignment.shift.endTime.split(':').map(Number);
                        const allowedStart = getISTDate(); allowedStart.setHours(sH, sM - 180, 0, 0); // 3 hours before
                        const allowedEnd = getISTDate(); allowedEnd.setHours(eH, eM, 0, 0);

                        if (allowedEnd < allowedStart) {
                            if (now.getHours() < 12) allowedStart.setDate(allowedStart.getDate() - 1);
                            else allowedEnd.setDate(allowedEnd.getDate() + 1);
                        }
                        if (now < allowedStart || now > allowedEnd) {
                            return res.status(403).json({ success: false, message: `Entry allowed only 3:00 hr before shift (${assignment.shift.startTime} - ${assignment.shift.endTime})` });
                        }
                    }
                }
            }

            if (todayRecord) {
                // Preserve holiday notes if present
                const existingNotes = todayRecord.notes || '';
                const isHoliday = existingNotes.startsWith('Holiday - ');
                const baseShiftLabel = isHoliday ? existingNotes : `Self Checked In (was ${todayRecord.status})`;

                attendance = todayRecord;
                attendance.status = 'present';
                attendance.entryTime = entryTime;
                attendance.exitTime = null;
                attendance.duration = 0;
                attendance.notes = isHoliday ? existingNotes : baseShiftLabel;
                if (geoDistance !== null) attendance.distanceMeters = geoDistance;
                await attendance.save();
                message = `Welcome back, ${user.name}! Entry marked at ${attendance.entryTime}`;
            } else {
                attendance = await Attendance.create({
                    student: studentId,
                    date: today,
                    status: 'present',
                    entryTime: entryTime,
                    notes: `Self Checked In (${shiftLabel})`,
                    markedBy: studentId,
                    duration: 0,
                    distanceMeters: geoDistance !== null ? geoDistance : undefined
                });
                message = `Welcome, ${user.name}! Entry marked at ${attendance.entryTime}`;
            }
            type = 'entry';
        }

        res.status(200).json({ success: true, message, type, attendance });
    } catch (error) {
        console.error('Self Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ── PIN-based manual attendance (for students whose camera doesn't work) ──────
exports.markAttendanceByPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const studentId = req.user.id;

        const settings = await Settings.findOne();
        if (!settings || !settings.pinAttendanceEnabled) {
            return res.status(403).json({ success: false, message: 'PIN attendance is currently disabled by the admin.' });
        }
        if (!settings.attendancePin || settings.attendancePin.trim() === '') {
            return res.status(400).json({ success: false, message: 'No attendance PIN has been set by admin yet.' });
        }
        if (!pin || String(pin).trim() !== String(settings.attendancePin).trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect PIN. Please check with your admin.' });
        }

        const user = await User.findById(studentId);
        if (!user || !user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is inactive.' });
        }

        // ── IST helpers (same as QR attendance) ──────────────────────────
        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };

        const now = getISTDate();

        // ── Time Restriction (only if enabled by admin) ───────────────────
        if (settings.timeRestrictionEnabled !== false) {
            const seat = await Seat.findOne({
                'assignments.student': studentId,
                'assignments.status': 'active'
            }).populate('assignments.shift');

            if (seat) {
                const assignment = seat.assignments.find(
                    a => a.student.toString() === studentId.toString() && a.status === 'active'
                );
                if (assignment?.shift?.startTime && assignment?.shift?.endTime) {
                    const [sH, sM] = assignment.shift.startTime.split(':').map(Number);
                    const [eH, eM] = assignment.shift.endTime.split(':').map(Number);

                    const allowedStart = getISTDate();
                    allowedStart.setHours(sH, sM - 180, 0, 0); // 3 hours before shift
                    const allowedEnd = getISTDate();
                    allowedEnd.setHours(eH, eM, 0, 0);

                    if (allowedEnd < allowedStart) {
                        if (now.getHours() < 12) allowedStart.setDate(allowedStart.getDate() - 1);
                        else allowedEnd.setDate(allowedEnd.getDate() + 1);
                    }

                    if (now < allowedStart || now > allowedEnd) {
                        return res.status(403).json({
                            success: false,
                            message: `Entry allowed only 3 hrs before shift (${assignment.shift.startTime} – ${assignment.shift.endTime})`
                        });
                    }
                }
            }
        }

        // ── Date for today: IST date string → UTC midnight ───────────────
        // Admin panel queries: new Date("YYYY-MM-DD") = UTC midnight
        // We must store the same way: get IST date string, parse as UTC midnight
        const istYear = now.getFullYear();
        const istMonth = String(now.getMonth() + 1).padStart(2, '0');
        const istDay = String(now.getDate()).padStart(2, '0');
        const today = new Date(`${istYear}-${istMonth}-${istDay}`); // UTC midnight of IST date

        const entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let attendance, message, type;

        // Check for open session → mark exit
        const activeSession = await Attendance.findOne({
            student: studentId, status: 'present', exitTime: null, entryTime: { $ne: null }
        }).sort({ date: -1 });

        if (activeSession) {
            const entryParts = activeSession.entryTime.split(':');
            const entryDate = new Date(activeSession.date);
            entryDate.setHours(parseInt(entryParts[0]), parseInt(entryParts[1]), 0);
            const durationMins = Math.max(0, Math.round((now - entryDate) / 60000));

            // ── 10-minute minimum between entry and exit ──────────────────
            const MIN_STAY = 10;
            if (durationMins < MIN_STAY) {
                const waitLeft = MIN_STAY - durationMins;
                return res.status(400).json({
                    success: false,
                    message: `Please wait ${waitLeft} more minute${waitLeft > 1 ? 's' : ''} before marking exit. (Min stay: ${MIN_STAY} min)`
                });
            }

            activeSession.exitTime = entryTime;
            activeSession.duration = durationMins;
            activeSession.notes = `Manual Check-Out (PIN) — ${durationMins} min`;
            await activeSession.save();
            attendance = activeSession;
            message = `Goodbye, ${user.name}! Exit marked at ${entryTime} (${durationMins} min).`;
            type = 'exit';

        } else {
            // Check already completed today (real exit = non-null, non-empty exitTime)
            const todayComplete = await Attendance.findOne({
                student: studentId,
                date: today,
                status: 'present',
                exitTime: { $nin: [null, '', undefined] }
            });
            if (todayComplete) {
                return res.status(200).json({ success: true, message: 'Attendance already completed for today.', type: 'already_marked', attendance: todayComplete });
            }
            // Update existing absent record or create new
            const existing = await Attendance.findOne({ student: studentId, date: today });
            if (existing) {
                existing.entryTime = entryTime;
                existing.status = 'present';
                existing.notes = 'Manual Check-In (PIN)';
                existing.markedBy = studentId;
                await existing.save();
                attendance = existing;
            } else {
                attendance = await Attendance.create({
                    student: studentId, date: today, status: 'present',
                    entryTime, notes: 'Manual Check-In (PIN)', markedBy: studentId, duration: 0
                });
            }
            message = `Welcome, ${user.name}! Entry marked at ${entryTime} via PIN.`;
            type = 'entry';
        }

        res.status(200).json({ success: true, message, type, attendance });
    } catch (error) {
        console.error('PIN Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ── Direct attendance (no PIN) — only allowed when PIN mode is OFF ─────────
exports.markAttendanceDirectly = async (req, res) => {
    try {
        const studentId = req.user.id;

        const settings = await Settings.findOne();
        if (!settings) return res.status(403).json({ success: false, message: 'System not configured.' });

        // This endpoint ONLY works when PIN mode is OFF (direct mark mode)
        if (settings.pinAttendanceEnabled) {
            return res.status(403).json({ success: false, message: 'PIN is required. Please use the PIN entry.' });
        }

        const user = await User.findById(studentId);
        if (!user || !user.isActive) return res.status(403).json({ success: false, message: 'Your account is inactive.' });

        // ── IST helpers ───────────────────────────────────────────────────
        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };
        const now = getISTDate();

        // ── Time Restriction ──────────────────────────────────────────────
        if (settings.timeRestrictionEnabled !== false) {
            const seat = await Seat.findOne({ 'assignments.student': studentId, 'assignments.status': 'active' }).populate('assignments.shift');
            if (seat) {
                const assignment = seat.assignments.find(a => a.student.toString() === studentId.toString() && a.status === 'active');
                if (assignment?.shift?.startTime && assignment?.shift?.endTime) {
                    const [sH, sM] = assignment.shift.startTime.split(':').map(Number);
                    const [eH, eM] = assignment.shift.endTime.split(':').map(Number);
                    const allowedStart = getISTDate(); allowedStart.setHours(sH, sM - 180, 0, 0);
                    const allowedEnd = getISTDate(); allowedEnd.setHours(eH, eM, 0, 0);
                    if (allowedEnd < allowedStart) {
                        if (now.getHours() < 12) allowedStart.setDate(allowedStart.getDate() - 1);
                        else allowedEnd.setDate(allowedEnd.getDate() + 1);
                    }
                    if (now < allowedStart || now > allowedEnd) {
                        return res.status(403).json({ success: false, message: `Entry allowed only 3 hrs before shift (${assignment.shift.startTime} – ${assignment.shift.endTime})` });
                    }
                }
            }
        }

        // ── Today (UTC midnight of IST date — matches admin query) ─────────
        const istYear = now.getFullYear();
        const istMonth = String(now.getMonth() + 1).padStart(2, '0');
        const istDay = String(now.getDate()).padStart(2, '0');
        const today = new Date(`${istYear}-${istMonth}-${istDay}`);

        const entryTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        let attendance, message, type;

        // Check open session → mark exit
        const activeSession = await Attendance.findOne({
            student: studentId, status: 'present', exitTime: null, entryTime: { $ne: null }
        }).sort({ date: -1 });

        if (activeSession) {
            const entryParts = activeSession.entryTime.split(':');
            const entryDate = new Date(activeSession.date);
            entryDate.setHours(parseInt(entryParts[0]), parseInt(entryParts[1]), 0);
            const durationMins = Math.max(0, Math.round((now - entryDate) / 60000));

            const MIN_STAY = 10;
            if (durationMins < MIN_STAY) {
                const waitLeft = MIN_STAY - durationMins;
                return res.status(400).json({ success: false, message: `Please wait ${waitLeft} more minute${waitLeft > 1 ? 's' : ''} before marking exit. (Min stay: ${MIN_STAY} min)` });
            }
            activeSession.exitTime = entryTime;
            activeSession.duration = durationMins;
            activeSession.notes = `Manual Check-Out (Direct) — ${durationMins} min`;
            await activeSession.save();
            attendance = activeSession;
            message = `Goodbye, ${user.name}! Exit marked at ${entryTime} (${durationMins} min).`;
            type = 'exit';
        } else {
            const todayComplete = await Attendance.findOne({ student: studentId, date: today, status: 'present', exitTime: { $nin: [null, '', undefined] } });
            if (todayComplete) {
                return res.status(200).json({ success: true, message: 'Attendance already completed for today.', type: 'already_marked', attendance: todayComplete });
            }
            const existing = await Attendance.findOne({ student: studentId, date: today });
            if (existing) {
                existing.entryTime = entryTime; existing.status = 'present';
                existing.notes = 'Manual Check-In (Direct)'; existing.markedBy = studentId;
                await existing.save(); attendance = existing;
            } else {
                attendance = await Attendance.create({
                    student: studentId, date: today, status: 'present',
                    entryTime, notes: 'Manual Check-In (Direct)', markedBy: studentId, duration: 0
                });
            }
            message = `Welcome, ${user.name}! Entry marked at ${entryTime}.`;
            type = 'entry';
        }

        res.status(200).json({ success: true, message, type, attendance });
    } catch (error) {
        console.error('Direct Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==========================================
// 24. GET PENDING FEEDBACK
// ==========================================
exports.getPendingFeedback = async (req, res) => {
    try {
        const Request = require('../models/Request');
        const pendingRequest = await Request.findOne({
            student: req.user._id,
            status: { $in: ['approved', 'rejected'] },
            rating: { $eq: null },
            isRatingDismissed: { $ne: true }
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            request: pendingRequest || null
        });
    } catch (error) {
        console.error('Get Pending Feedback Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending feedback'
        });
    }
};

// ==========================================
// 25. SUBMIT REQUEST FEEDBACK
// ==========================================
exports.submitFeedback = async (req, res) => {
    try {
        console.log('Received feedback submission for:', req.params.id, 'with body:', req.body);
        const Request = require('../models/Request');
        const { rating, feedback, dismissed } = req.body;
        const request = await Request.findOne({
            _id: req.params.id,
            student: req.user._id
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        if (dismissed) {
            request.isRatingDismissed = true;
        } else {
            request.rating = rating;
            request.ratingFeedback = feedback;
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('Submit Feedback Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting feedback'
        });
    }
};
