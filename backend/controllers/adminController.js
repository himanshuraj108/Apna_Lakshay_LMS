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
exports.getDashboard = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        const totalSeats = await Seat.countDocuments();
        const occupiedSeats = await Seat.countDocuments({ isOccupied: true });
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const feesCollected = await Fee.aggregate([
            { $match: { status: 'paid', month: currentMonth, year: currentYear } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingRequests = await Request.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalSeats,
                occupiedSeats,
                availableSeats: totalSeats - occupiedSeats,
                feesCollected: feesCollected[0]?.total || 0,
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
        const students = await User.find({ role: 'student' })
            .populate('createdBy', 'name')
            .populate({
                path: 'seat',
                populate: { path: 'room floor' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            students
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
            student = await User.findById(id).populate('createdBy', 'name');
        } else {
            // Try searching by last 8 characters
            // Since we can't do a direct regex on ObjectId in simple find without aggregation or converting to string,
            // efficiently we might need to fetch all and filter, OR use aggregation.
            // For small scale, fetching all students then filtering is easiest but inefficient.
            // Better: use aggregation to project _id to string and match.
            const allStudents = await User.find({ role: 'student' }).populate('createdBy', 'name');
            student = allStudents.find(s => s._id.toString().toUpperCase().endsWith(id.toUpperCase()));
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get seat info
        const seat = await Seat.findOne({ assignedTo: student._id }).populate('floor room');

        res.status(200).json({
            success: true,
            student: {
                ...student.toObject(),
                seat: seat ? {
                    number: seat.number,
                    floor: seat.floor?.name,
                    room: seat.room?.name,
                    number: seat.number,
                    floor: seat.floor?.name,
                    room: seat.room?.name,
                    shift: seat.shift,
                    price: seat.currentPrice
                } : null
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
        const { name, email, mobile } = req.body;
        const password = generatePassword();

        const student = await User.create({
            name,
            email,
            mobile,
            password,
            role: 'student',
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
        const { name, email, mobile, isActive } = req.body;
        const student = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, mobile, isActive },
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
        await Seat.updateOne(
            { assignedTo: student._id },
            { $set: { isOccupied: false, assignedTo: null, shift: null, negotiatedPrice: null } }
        );

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
exports.getFloors = async (req, res) => {
    try {
        const floors = await Floor.find()
            .populate({
                path: 'rooms',
                populate: {
                    path: 'seats',
                    populate: {
                        path: 'assignedTo',
                        select: 'name email profileImage createdAt'
                    }
                }
            })
            .sort({ level: 1 });



        res.status(200).json({
            success: true,
            floors
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

        if (seat.isOccupied) {
            return res.status(400).json({
                success: false,
                message: 'Seat is already occupied'
            });
        }

        // Check if student already has a seat and vacate it
        const currentSeat = await Seat.findOne({ assignedTo: studentId });
        if (currentSeat) {
            currentSeat.isOccupied = false;
            currentSeat.assignedTo = null;
            currentSeat.negotiatedPrice = null;
            currentSeat.shift = null;
            await currentSeat.save();
        }

        // Check if student already has a seat assigned and free it
        const existingSeat = await Seat.findOne({
            assignedTo: studentId,
            isOccupied: true
        });

        if (existingSeat) {
            console.log(`Freeing previous seat ${existingSeat.number} for student ${student.name}`);
            existingSeat.isOccupied = false;
            existingSeat.assignedTo = null;
            existingSeat.shift = null;
            existingSeat.negotiatedPrice = null;
            await existingSeat.save();
        }

        // Assign new seat
        seat.isOccupied = true;
        seat.assignedTo = studentId;
        seat.shift = shift;
        seat.negotiatedPrice = negotiatedPrice || seat.basePrices[shift];
        await seat.save();

        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Create or update fee record
        await Fee.findOneAndUpdate(
            {
                student: studentId,
                month: now.getMonth() + 1,
                year: now.getFullYear()
            },
            {
                amount: seat.negotiatedPrice,
                dueDate,
                status: 'pending'
            },
            { upsert: true, new: true }
        );

        await Notification.create({
            recipient: studentId,
            title: 'Seat Assigned',
            message: `Your seat ${seat.number} has been assigned for ${shift} shift.`,
            type: 'seat',
            createdBy: req.user.id
        });

        // Send seat assignment email
        try {
            const floorName = seat.floor?.name || 'N/A';
            const roomName = seat.room?.name || 'N/A';
            await emailService.sendSeatAssignmentEmail(
                student,
                {
                    ...seat.toObject(),
                    currentPrice: seat.negotiatedPrice
                },
                shift
            );
        } catch (emailError) {
            console.error('Seat assignment email failed:', emailError.message);
            // Continue even if email fails
        }

        // Log action
        await logAction(req, 'seat_assigned', 'Seat', seat._id, seat.number, `Assigned to ${student.name} (${shift} shift)`);

        res.status(200).json({
            success: true,
            message: 'Seat assigned successfully and email notification sent'
        });
    } catch (error) {
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

        const promises = attendanceData.map(async ({ studentId, status }) => {
            return await Attendance.findOneAndUpdate(
                { student: studentId, date: attendanceDate },
                { status, markedBy: req.user.id },
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

        const attendance = await Attendance.find({ date })
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

// Get fees
exports.getFees = async (req, res) => {
    try {
        const fees = await Fee.find()
            .populate('student', 'name email')
            .sort({ year: -1, month: -1 });

        // Filter out fees where student has been deleted (null after populate)
        const filteredFees = fees.filter(fee => fee.student);

        res.status(200).json({
            success: true,
            fees: filteredFees
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

                // Store shift before clearing
                const previousShift = currentSeat.shift || 'full';

                // Release old seat
                currentSeat.assignedTo = null;
                currentSeat.shift = null;
                currentSeat.isOccupied = false;
                await currentSeat.save();

                // Assign new seat
                requestedSeat.assignedTo = request.student._id;
                requestedSeat.shift = previousShift; // Keep same shift
                requestedSeat.isOccupied = true;
                await requestedSeat.save();

                // Update student record
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
                const seat = await Seat.findOne({ assignedTo: request.student._id });
                if (seat) {
                    seat.shift = request.requestedData.shift;
                    await seat.save();
                }
            }

            // Send generic request response email
            try {
                await emailService.sendRequestResponseEmail(request.student, request, status, adminResponse);
            } catch (emailError) {
                console.error('Email error:', emailError);
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
