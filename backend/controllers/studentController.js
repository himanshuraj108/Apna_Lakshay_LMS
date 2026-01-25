const User = require('../models/User');
const Seat = require('../models/Seat');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Notification = require('../models/Notification');
const Request = require('../models/Request');
const multer = require('multer');
const { storage } = require('../config/cloudinary'); // Import Cloudinary storage

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

        const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
        const totalDays = attendanceRecords.length;
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
                unreadNotifications: unreadCount
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

        const presentCount = myAttendance.filter(a => a.status === 'present').length;
        const totalDays = myAttendance.length;
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
            myAttendance,
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
        }

        const request = await Request.create({
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
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
        const request = await Request.create({
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

