// Simplified adminController - just basic exports
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
const { randomUUID } = require('crypto');

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

        const shift = await Shift.create({ name, startTime, endTime });

        await logAction(req, 'create_shift', 'Shift', shift._id, shift.name, `Created shift ${shift.name} (${startTime}-${endTime})`);

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
        sendSeatChangeRejectedEmail: async () => console.log('Email service not available')
    };
}

// Helper: Log Action
const logAction = async (req, action, targetModel, targetId, targetName, details) => {
    try {
        await ActionLog.create({
            admin: req.user.id,
            adminName: req.user.name,
            action,
            targetModel,
            targetId,
            targetName,
            details,
            ipAddress: req.ip || req.connection.remoteAddress
        });
    } catch (error) {
        console.error('Failed to log action:', error.message);
    }
};

// Generate random password
const generatePassword = () => {
    return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
};

// Dashboard
// Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const mode = req.query.mode || 'default';
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // 1. Total Students (Filtered by System Mode)
        const totalStudents = await User.countDocuments({
            role: 'student',
            isActive: true,
            $or: [
                { systemMode: mode },
                ...(mode === 'default' ? [{ systemMode: { $exists: false } }] : [])
            ]
        });

        // 2. Total Seats 
        const totalSeats = await Seat.countDocuments();

        // 3. Occupied Seats
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
            { $count: 'count' }
        ]);
        const occupiedSeats = occupiedSeatsAgg[0]?.count || 0;

        // 4. Fees Collected
        const feesCollectedAgg = await Fee.aggregate([
            { $match: { status: 'paid', month: currentMonth, year: currentYear } },
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
                        ...(mode === 'default' ? [{ 'studentInfo.systemMode': { $exists: false } }] : [])
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
                totalSeats,
                occupiedSeats,
                availableSeats: totalSeats - occupiedSeats, // Dynamic availability based on this mode's occupancy
                feesCollected,
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
        // Simplified query - no mode filtering, just get all students
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

        // Transform students to include resolved shift info and ensure registrationSource
        const studentsWithShift = students.map(student => {
            let shiftInfo = null;
            let shiftDetails = null;
            if (student.seat && student.seat.assignments) {
                // Find active assignment for this student
                const assignment = student.seat.assignments.find(a =>
                    a.status === 'active' && a.student.toString() === student._id.toString()
                );

                if (assignment) {
                    if (assignment.shift && assignment.shift.name) {
                        shiftInfo = assignment.shift.name;
                        shiftDetails = {
                            startTime: assignment.shift.startTime,
                            endTime: assignment.shift.endTime
                        };
                    } else if (assignment.legacyShift) {
                        shiftInfo = assignment.legacyShift;
                    } else if (assignment.type === 'full_day') {
                        shiftInfo = 'Full Day';
                    }
                }
            }
            return {
                ...student,
                shift: shiftInfo,
                shiftDetails, // New field containing time info
                registrationSource: student.registrationSource || 'admin' // Default for existing students
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

        // Handle "HL-" prefix from ID card text
        if (id && id.toUpperCase().startsWith('HL-')) {
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
            // Try searching by last 8 characters
            const allStudents = await User.find({ role: 'student' })
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

        res.status(200).json({
            success: true,
            student: {
                ...student, // It is already lean object
                seat: seatData
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
        const { name, email, mobile, address, systemMode = 'custom', studentId } = req.body;
        const password = generatePassword();

        const student = await User.create({
            name,
            email,
            mobile,
            address,
            password,
            systemMode,
            role: 'student',
            isActive: true, // Admin created students are active by default
            registrationSource: 'admin',
            studentId: studentId || undefined, // Allow empty/null
            createdBy: req.user.id
        });

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
            message: 'Student created and credentials sent via email',
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
exports.updateStudent = async (req, res) => {
    try {
        const { name, email, mobile, address, isActive, studentId } = req.body;

        const updateData = { name, email, mobile, address, isActive, studentId };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // If reactivating (explicitly setting isActive to true), reset seat/shift
        // We verify current state first to ensure we don't wipe active students' seats on profile edits
        if (isActive === true) {
            const currentStudent = await User.findById(req.params.id);
            if (currentStudent && !currentStudent.isActive) {
                // Was inactive, now activating -> RESET SEAT logic
                updateData.seat = null;
                updateData.seatAssignedAt = null;

                // Note: We don't have a direct 'shift' field on User (it's in seat assignments), 
                // but clearing the seat link effectively removes the shift association for the student.

                // Optionally: Log this reset
                console.log(`Resetting seat for reactivated student: ${currentStudent.name}`);
            }
        }

        const student = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Log action
        await logAction(req, 'student_updated', 'User', student._id, student.name, `Updated student details. Active: ${isActive}`);

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
            await student.save();

            // Log action
            await logAction(req, 'student_deleted_soft', 'User', student._id, student.name, 'Soft deleted (marked inactive)');

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
        const { name, floorId, width, height } = req.body;

        const room = await Room.create({
            name,
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
                            select: 'name email profileImage createdAt isActive registrationSource seatAssignedAt address'
                        },
                        {
                            path: 'assignments.shift',
                            select: 'name startTime endTime'
                        }
                    ]
                }
            })
            .sort({ level: 1 });

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
            ...floor.toObject(),
            rooms: floor.rooms.map(room => ({
                ...room.toObject(),
                seats: room.seats.map(seat => {
                    const seatObj = seat.toObject();
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
                        isOccupied, // Computed dynamic status
                        assignedTo: displayAssignment ? {
                            ...displayAssignment.toObject(),
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
        const { seatId, studentId, shift, negotiatedPrice } = req.body;

        const seat = await Seat.findById(seatId).populate('floor room');
        const student = await User.findById(studentId);

        if (!seat || !student) {
            return res.status(404).json({
                success: false,
                message: 'Seat or student not found'
            });
        }

        // Check availability logic for DYNAMIC SHIFTS
        // 1. Is the seat blocked by a full-day assignment?
        const activeAssignments = seat.assignments.filter(a => a.status === 'active');
        const isFullyBlocked = activeAssignments.some(a => a.type === 'full_day');

        if (isFullyBlocked) {
            return res.status(400).json({
                success: false,
                message: 'Seat is fully occupied (Full Day)'
            });
        }

        // 2. Is the specific shift already taken?
        // Note: 'shift' body param should be the Shift ID
        const isShiftTaken = activeAssignments.some(a => a.shift && a.shift.toString() === shift);

        if (isShiftTaken) {
            return res.status(400).json({
                success: false,
                message: 'Seat is already occupied for this shift'
            });
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
            { arrayFilters: [{ 'elem.student': studentId, 'elem.status': 'active' }] }
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

        // 4. Create new assignment object
        const newAssignment = {
            student: student._id, // Explicitly use ObjectId from fetched student
            shift: shift, // Shift ID
            type: 'specific', // Assuming specific shift for now
            status: 'active',
            assignedAt: new Date(),
            price: negotiatedPrice || seat.shiftPrices.get(shift) || seat.basePrices.day // Fallback
        };

        // 5. Add to seat
        seat.assignments.push(newAssignment);
        seat.isOccupied = true; // General flag
        await seat.save();

        // Update student reference (Only set seatAssignedAt if not already set)
        const userUpdateUpdates = { seat: seatId };
        if (!student.seatAssignedAt) {
            userUpdateUpdates.seatAssignedAt = new Date();
        }
        await User.findByIdAndUpdate(studentId, userUpdateUpdates);

        const now = new Date();

        // Calculate due date based on student's joined date (Billing Cycle)
        // reusing 'student' variable fetched at start of function
        const joinedDate = student.createdAt ? new Date(student.createdAt) : new Date();
        const joinedDay = joinedDate.getDate();

        // Due date is the start of the current billing cycle (Prepaid model)
        // e.g. Joined 15th Jan -> Due 15th Jan
        const dueDate = new Date(now.getFullYear(), now.getMonth(), joinedDay);

        // Create or update fee record
        await Fee.findOneAndUpdate(
            {
                student: studentId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            },
            {
                amount: newAssignment.price,
                dueDate,
                status: 'pending'
            },
            { upsert: true, new: true }
        );

        await Notification.create({
            recipient: studentId,
            title: 'Seat Assigned',
            message: `Your seat ${seat.number} has been assigned.`,
            type: 'seat',
            createdBy: req.user.id
        });

        // Send seat assignment email
        try {
            // Resolve shift name
            let shiftName = shift;
            try {
                const shiftObj = await Shift.findById(shift);
                if (shiftObj) shiftName = shiftObj.name;
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

        res.status(200).json({
            success: true,
            message: 'Seat assigned successfully'
        });
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

            // Add optional fields if provided
            if (entryTime !== undefined) updateData.entryTime = entryTime;
            if (exitTime !== undefined) updateData.exitTime = exitTime;
            if (notes !== undefined) updateData.notes = notes;

            return await Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                updateData,
                { upsert: true, new: true }
            );
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
            .populate('student', 'name email')
            .populate('markedBy', 'name');

        // Filter out orphaned records
        const filteredAttendance = attendance.filter(record => record.student);

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

// Quick check-in (mark entry with current time)
exports.quickCheckIn = async (req, res) => {
    try {
        const { studentId } = req.body;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const attendanceDate = new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (!student.isActive) {
            return res.status(403).json({ success: false, message: 'Access Denied: Inactive Membership' });
        }

        if (!student.seat) {
            return res.status(403).json({ success: false, message: 'Access Denied: Pending seat allocation' });
        }

        const attendance = await Attendance.findOneAndUpdate(
            { student: studentId, date: attendanceDate },
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
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Find the latest active session (handles overnight or today)
        const attendance = await Attendance.findOne({
            student: studentId,
            isActive: true
        }).sort({ createdAt: -1 }).populate('student', 'name email');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No active session found for this student'
            });
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

        const promises = studentIds.map(studentId =>
            Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                {
                    status: 'present',
                    entryTime: currentTime,
                    markedBy: req.user.id,
                    isActive: true
                },
                { upsert: true, new: true }
            )
        );

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

        const promises = studentIds.map(studentId =>
            Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                {
                    exitTime: currentTime,
                    isActive: false
                },
                { new: true }
            )
        );

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

// Get fees
exports.getFees = async (req, res) => {
    try {
        const fees = await Fee.find()
            .populate('student', 'name email createdAt')
            .sort({ year: -1, month: -1 });

        // Filter out fees where student has been deleted (null after populate)
        // Filter out fees where student has been deleted (null after populate)
        const filteredFees = fees.filter(fee => fee.student);

        // Calculate Billing Cycles
        const processedFees = filteredFees.map(fee => {
            const student = fee.student;
            const feeObj = fee.toObject();

            if (!student.createdAt) return feeObj;

            const joinedDate = new Date(student.createdAt);
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

        fee.status = 'paid';
        fee.paidDate = new Date();
        fee.markedBy = req.user.id;
        await fee.save();

        await Notification.create({
            recipient: fee.student._id,
            title: 'Fee Payment Confirmed',
            message: `Your fee of ₹${fee.amount} has been confirmed.`,
            type: 'fee',
            createdBy: req.user.id
        });

        // Send fee confirmation email
        try {
            const date = new Date();
            await emailService.sendFeeConfirmationEmail(fee.student, fee.amount, date.getMonth() + 1, date.getFullYear());
        } catch (emailError) {
            console.error('Fee email failed:', emailError.message);
        }

        // Log action
        await logAction(req, 'fee_marked_paid', 'Fee', fee._id, `Fee: ₹${fee.amount}`, `Marked as paid for student ${fee.student.name}`);

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

// @desc    Get all requests
// @route   GET /api/admin/requests
exports.getRequests = async (req, res) => {
    try {
        const requests = await Request.find()
            .populate('student', 'name email')
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
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed'
            });
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

                    // Recalculate occupancy
                    // Note: assignments are modified in memory
                    // Filter again because we just modified status in memory!
                    const hasActive = currentSeat.assignments.some(a => a.status === 'active');
                    currentSeat.isOccupied = hasActive;

                    await currentSeat.save();
                } else if (oldAssignment) {
                    // Fallback if find() found one but filter didn't? Should be impossible, but keep safe
                    oldAssignment.status = 'expired';
                    await currentSeat.save();
                }

                // 2. Create new assignment
                requestedSeat.assignments.push({
                    student: request.student._id,
                    shift: shiftToMove,
                    legacyShift: legacyShiftToMove,
                    type: typeToMove,
                    status: 'active',
                    assignedAt: new Date()
                });
                await requestedSeat.save();

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
        // Handle "HL-" prefix or raw ID
        let studentId = qrCode;
        if (studentId.toUpperCase().startsWith('HL-')) {
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
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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