const Holiday = require('../models/Holiday');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Declare a holiday — bulk-marks all active students as present for that date
// @route   POST /api/admin/holidays
exports.declareHoliday = async (req, res) => {
    try {
        const { date, name } = req.body;
        if (!date || !name?.trim()) {
            return res.status(400).json({ success: false, message: 'Date and festival name are required' });
        }

        // Normalize to midnight IST
        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);

        // Check if already declared
        const existing = await Holiday.findOne({ date: holidayDate });
        if (existing) {
            return res.status(409).json({ success: false, message: `A holiday (${existing.name}) is already declared for this date` });
        }

        // Save holiday record
        const holiday = await Holiday.create({
            date: holidayDate,
            name: name.trim(),
            declaredBy: req.user?.id || null
        });

        // Fetch all active students
        const students = await User.find({ role: 'student', isActive: true }).select('_id');

        if (students.length > 0) {
            const noteText = `Holiday - ${name.trim()}`;
            const ops = students.map(s => ({
                updateOne: {
                    filter: { student: s._id, date: holidayDate },
                    update: {
                        $set: {
                            student: s._id,
                            date: holidayDate,
                            status: 'present',
                            notes: noteText,
                            entryTime: null,
                            exitTime: null,
                            duration: 0,
                            isActive: false
                        }
                    },
                    upsert: true
                }
            }));
            await Attendance.bulkWrite(ops);
        }

        res.status(201).json({
            success: true,
            message: `Holiday "${name.trim()}" declared. ${students.length} students marked present.`,
            holiday
        });
    } catch (error) {
        console.error('declareHoliday error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all holidays
// @route   GET /api/admin/holidays
exports.getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: -1 }).populate('declaredBy', 'name');
        res.status(200).json({ success: true, holidays });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete a holiday — removes holiday record and reverts holiday-marked attendance
// @route   DELETE /api/admin/holidays/:id
exports.deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).json({ success: false, message: 'Holiday not found' });
        }

        const noteText = `Holiday - ${holiday.name}`;

        // Delete attendance records that were created for this holiday
        const deleteResult = await Attendance.deleteMany({
            date: holiday.date,
            notes: noteText
        });

        await holiday.deleteOne();

        res.status(200).json({
            success: true,
            message: `Holiday "${holiday.name}" removed. ${deleteResult.deletedCount} attendance records reverted.`
        });
    } catch (error) {
        console.error('deleteHoliday error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
