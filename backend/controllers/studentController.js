const User = require('../models/User');
const Seat = require('../models/Seat');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const SystemSetting = require('../models/SystemSetting');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get seat info (checking new assignments array structure)
        const seat = await Seat.findOne({
            'assignments.student': studentId,
            'assignments.status': 'active'
        })
            .populate('floor room')
            .populate('assignments.shift');

        let assignedSeatData = null;
        if (seat) {
            // Find specific assignment
            const assignment = seat.assignments.find(a => a.student.toString() === studentId.toString() && a.status === 'active');

            let shiftName = 'N/A';
            let shiftDetails = null;

            if (assignment) {
                if (assignment.shift && assignment.shift.name) {
                    shiftName = assignment.shift.name;
                    shiftDetails = {
                        startTime: assignment.shift.startTime,
                        endTime: assignment.shift.endTime
                    };
                } else if (assignment.legacyShift) {
                    shiftName = assignment.legacyShift;
                } else if (assignment.type === 'full_day') {
                    shiftName = 'Full Day';
                } else {
                    shiftName = 'Assigned';
                }
            }

            assignedSeatData = {
                number: seat.number,
                floor: seat.floor?.name,
                room: seat.room?.name,
                shift: shiftName,
                shiftDetails, // Added details
                price: assignment?.price || 0,
                assignedAt: assignment?.assignedAt // Add assignment date
            };
        }

        // Get current month attendance
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const attendanceRecords = await Attendance.find({
            student: studentId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Deduplicate attendance records (fix for multiple entries per day)
        const uniqueAttendanceMap = new Map();

        attendanceRecords.forEach(record => {
            const dateKey = new Date(record.date).toDateString(); // Group by Calendar Day

            if (!uniqueAttendanceMap.has(dateKey)) {
                uniqueAttendanceMap.set(dateKey, record);
            } else {
                const existing = uniqueAttendanceMap.get(dateKey);

                // Conflict resolution strategy (Same as getAttendance):
                // 1. Prefer 'present' over 'absent'
                if (existing.status !== 'present' && record.status === 'present') {
                    uniqueAttendanceMap.set(dateKey, record);
                }
                // 2. If both present, prefer the one with longer duration
                else if (existing.status === 'present' && record.status === 'present') {
                    if ((record.duration || 0) > (existing.duration || 0)) {
                        uniqueAttendanceMap.set(dateKey, record);
                    }
                }
            }
        });

        const cleanAttendance = Array.from(uniqueAttendanceMap.values());

        const presentCount = cleanAttendance.filter(a => a.status === 'present').length;
        const totalDays = cleanAttendance.length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        // Get student details first (needed for rolling cycle calculation)
        const student = await User.findById(studentId).select('registrationSource createdAt name isActive');

        // Calculate Target Fee Month based on Rolling Cycle
        let currentFee = null;
        let feeReminder = null;

        if (student && student.createdAt) {
            const joinedDate = new Date(student.createdAt);
            const cycleDay = joinedDate.getDate();
            const today = new Date();

            let targetMonth = today.getMonth() + 1; // 1-12
            let targetYear = today.getFullYear();

            // If today is 'before' the cycle start day, we are in the cycle started last month
            if (today.getDate() < cycleDay) {
                targetMonth -= 1;
                if (targetMonth === 0) {
                    targetMonth = 12;
                    targetYear -= 1;
                }
            }

            // Fetch fee for the calculated cycle start month
            currentFee = await Fee.findOne({
                student: studentId,
                month: targetMonth,
                year: targetYear
            });

            // Calculate Dates and Reminder
            if (currentFee && currentFee.status !== 'paid') {
                // Cycle Start: targetMonth/targetYear/cycleDay
                // Cycle End/Due Date: One day before same day next month
                const cycleStartDate = new Date(targetYear, targetMonth - 1, cycleDay);
                const dueDate = new Date(targetYear, targetMonth, cycleDay - 1);

                // Reminder starts 5 days before due date
                const reminderDate = new Date(dueDate);
                reminderDate.setDate(reminderDate.getDate() - 5);

                // Show reminder if today >= reminderDate (and not paid)
                // Also show if overdue (today > dueDate)
                if (today >= reminderDate) {
                    feeReminder = {
                        show: true,
                        amount: currentFee.amount,
                        dueDate: dueDate,
                        status: currentFee.status,
                        message: `Your fee of ₹${currentFee.amount} is due on ${dueDate.toLocaleDateString()}. Please pay to avoid late fees.`
                    };
                }

                // Inject calculated dueDate into currentFee object for display
                currentFee.dueDate = dueDate;
            }
        } else {
            // Fallback for missing createdAt (legacy)
            currentFee = await Fee.findOne({
                student: studentId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            });
        }

        // Get unread notifications count
        const unreadCount = await Notification.countDocuments({
            recipient: studentId,
            isRead: false
        });

        // Get active requests count
        const activeRequestsCount = await Request.countDocuments({
            student: studentId,
            status: { $in: ['pending', 'approved', 'rejected'] } // Show status for all non-archived? Or just active? User said "case count > 0", usually implies pending + recently closed?
            // Actually, "View Status" implies seeing history. If count > 0 (even past), they might want to see history.
            // But user said "when case count > 0". Usually means "active" cases. 
            // Let's assume "pending" requests are the vital ones. 
            // The user said "view status always show ... when case count > 0".
            // If I have 0 pending but 10 approved, should I see "View Status"? Probably yes, to see history.
            // Let's count *all* requests for now, or maybe just "pending"?
            // "Retrieve own ticket" implies pending ones.
            // Let's count ALL requests so they can access history if they have ever made a request.
        });

        // Re-reading: "view status always show ... when case count > 0"
        // If I withdraw a ticket, case count might go down?
        // Let's stick to ALL requests for "history" access.

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
                    percentage: attendancePercentage
                },
                fee: currentFee ? {
                    amount: currentFee.amount,
                    status: currentFee.status,
                    dueDate: currentFee.dueDate, // Now dynamic
                    paidDate: currentFee.paidDate
                } : null,
                feeReminder, // Add reminder data
                unreadNotifications: unreadCount,
                requestsCount: activeRequestsCount
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

        // Find specific assignment
        const assignment = seat.assignments.find(a => a.student.toString() === studentId.toString() && a.status === 'active');

        let shiftName = 'N/A';
        let shiftId = null;

        if (assignment) {
            if (assignment.shift) {
                shiftId = assignment.shift._id || assignment.shift;
                if (assignment.shift.name) {
                    shiftName = assignment.shift.name;
                } else {
                    shiftName = assignment.legacyShift || 'Assigned';
                }
            } else if (assignment.legacyShift) {
                shiftName = assignment.legacyShift;
                shiftId = assignment.legacyShift;
            } else if (assignment.type === 'full_day') {
                shiftName = 'Full Day';
                shiftId = 'full';
            }
        }

        res.status(200).json({
            success: true,
            seat: {
                _id: seat._id,
                number: seat.number,
                floor: seat.floor,
                room: seat.room,
                shift: shiftName,
                shiftId: shiftId,
                price: assignment?.price || 0,
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

        // Get my attendance
        const myAttendance = await Attendance.find({
            student: req.user.id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ date: 1 });

        // Deduplicate attendance records (fix for multiple entries per day)
        const uniqueAttendanceMap = new Map();

        myAttendance.forEach(record => {
            const dateKey = new Date(record.date).toDateString(); // Group by Calendar Day

            if (!uniqueAttendanceMap.has(dateKey)) {
                uniqueAttendanceMap.set(dateKey, record);
            } else {
                const existing = uniqueAttendanceMap.get(dateKey);

                // Conflict resolution strategy:
                // 1. Prefer 'present' over 'absent'
                if (existing.status !== 'present' && record.status === 'present') {
                    uniqueAttendanceMap.set(dateKey, record);
                }
                // 2. If both present, prefer the one with longer duration or valid entry/exit
                else if (existing.status === 'present' && record.status === 'present') {
                    if ((record.duration || 0) > (existing.duration || 0)) {
                        uniqueAttendanceMap.set(dateKey, record);
                    }
                }
            }
        });

        // Use deduplicated list for response and stats
        const cleanAttendance = Array.from(uniqueAttendanceMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

        const presentCount = cleanAttendance.filter(a => a.status === 'present').length;
        const totalDays = cleanAttendance.length;
        const myPercentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        // Get all students' attendance for ranking
        const allStudents = await User.find({ role: 'student', isActive: true });

        const rankings = await Promise.all(allStudents.map(async (student) => {
            const studentAttendance = await Attendance.find({
                student: student._id,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const studentPresent = studentAttendance.filter(a => a.status === 'present').length;
            const studentTotal = studentAttendance.length;
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

        res.status(200).json({
            success: true,
            success: true,
            myAttendance: cleanAttendance,
            summary: {
                present: presentCount,
                total: totalDays,
                percentage: myPercentage
            },
            rankings: rankedStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get fee status
// @route   GET /api/student/fees
exports.getFees = async (req, res) => {
    try {
        const fees = await Fee.find({ student: req.user.id })
            .sort({ year: -1, month: -1 });

        res.status(200).json({
            success: true,
            fees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
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
        // requestedData contains { category, message } passed from frontend

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
        const { qrToken } = req.body;

        // Helper to get India Standard Time (UTC+5:30)
        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };

        if (!qrToken) {
            return res.status(400).json({ success: false, message: 'Invalid QR Code' });
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
        // Find any present record that has no exit time
        const activeSession = await Attendance.findOne({
            student: studentId,
            status: 'present',
            exitTime: null
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

            if (todayRecord && todayRecord.status === 'present' && todayRecord.exitTime) {
                return res.status(400).json({ success: false, message: 'Attendance already completed for today.' });
            }

            // Create new Entry or Update Absent Record
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
                        allowedStart.setHours(sH, sM - 30, 0, 0);
                        const allowedEnd = getISTDate();
                        allowedEnd.setHours(eH, eM, 0, 0);

                        if (allowedEnd < allowedStart) {
                            if (now.getHours() < 12) allowedStart.setDate(allowedStart.getDate() - 1);
                            else allowedEnd.setDate(allowedEnd.getDate() + 1);
                        }

                        if (now < allowedStart || now > allowedEnd) {
                            return res.status(403).json({
                                success: false,
                                message: `Entry allowed only 30 mins before shift (${assignment.shift.startTime} - ${assignment.shift.endTime})`
                            });
                        }
                    }
                }
            }

            if (todayRecord) {
                // Convert absent to present or reset? 
                // If status was absent, we overwrite. If it was half-filled? The logic above (activeSession) prevents getting here if it was open.
                // So here it's either absent or we are forcing an overwrite (clean slate).
                attendance = todayRecord;
                attendance.status = 'present';
                attendance.entryTime = entryTime;
                attendance.exitTime = null;
                attendance.duration = 0;
                attendance.notes = `Marked via Kiosk QR (was ${attendance.status})`;
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
                    duration: 0
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

