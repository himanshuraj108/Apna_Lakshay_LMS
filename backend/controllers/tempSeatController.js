const mongoose = require('mongoose');
const User = require('../models/User');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const TempSeatAssignment = require('../models/TempSeatAssignment');

// ─── Helper: Populate temp assignments for a student ─────────────────────────
const getStudentTempAssignments = async (studentId) => {
    return TempSeatAssignment.find({ borrowerStudent: studentId, status: 'active' })
        .populate('seat', 'number room floor')
        .populate({ path: 'seat', populate: { path: 'room', select: 'name hasAc' } })
        .populate('shift', 'name startTime endTime')
        .populate('originalOwner', 'name studentId')
        .lean();
};

// ─── GET /api/admin/temp-seats ───────────────────────────────────────────────
exports.getTempAssignments = async (req, res) => {
    try {
        const { studentId, status } = req.query;
        const filter = {};
        if (studentId) filter.borrowerStudent = studentId;
        if (status) filter.status = status;
        else filter.status = 'active';

        const assignments = await TempSeatAssignment.find(filter)
            .populate('borrowerStudent', 'name studentId mobile')
            .populate({
                path: 'seat',
                select: 'number room floor',
                populate: [
                    { path: 'room', select: 'name hasAc' },
                    { path: 'floor', select: 'name' }
                ]
            })
            .populate('shift', 'name startTime endTime')
            .populate('originalOwner', 'name studentId mobile')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, assignments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/admin/temp-seats ──────────────────────────────────────────────
exports.createTempAssignment = async (req, res) => {
    try {
        const { borrowerStudentId, seatId, shiftId, originalOwnerId, note, startDate, endDate } = req.body;

        if (!borrowerStudentId || !seatId || !shiftId) {
            return res.status(400).json({
                success: false,
                message: 'Borrower student, seat, and shift are required'
            });
        }

        // Validate entities exist
        const [borrower, seat, shift] = await Promise.all([
            User.findById(borrowerStudentId),
            Seat.findById(seatId).populate('room floor'),
            Shift.findById(shiftId)
        ]);

        if (!borrower) return res.status(404).json({ success: false, message: 'Borrower student not found' });
        if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
        if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });

        // Check if a conflicting active temp assignment already exists for same seat+shift
        const conflict = await TempSeatAssignment.findOne({
            seat: seatId,
            shift: shiftId,
            status: 'active'
        });

        if (conflict) {
            return res.status(400).json({
                success: false,
                message: 'This seat-shift combination already has an active temporary assignment'
            });
        }

        const assignment = await TempSeatAssignment.create({
            borrowerStudent: borrowerStudentId,
            seat: seatId,
            shift: shiftId,
            originalOwner: originalOwnerId || null,
            note: note || '',
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            createdBy: req.user._id
        });

        // Populate for response
        const populated = await TempSeatAssignment.findById(assignment._id)
            .populate('borrowerStudent', 'name studentId')
            .populate({
                path: 'seat',
                select: 'number room floor',
                populate: [
                    { path: 'room', select: 'name hasAc' },
                    { path: 'floor', select: 'name' }
                ]
            })
            .populate('shift', 'name startTime endTime')
            .populate('originalOwner', 'name studentId')
            .lean();

        res.status(201).json({ success: true, assignment: populated, message: 'Temporary seat assignment created successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT /api/admin/temp-seats/:id ──────────────────────────────────────────
exports.updateTempAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { seatId, shiftId, originalOwnerId, note, startDate, endDate, status } = req.body;

        const assignment = await TempSeatAssignment.findById(id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Temporary assignment not found' });

        if (seatId) assignment.seat = seatId;
        if (shiftId) assignment.shift = shiftId;
        if (originalOwnerId !== undefined) assignment.originalOwner = originalOwnerId;
        if (note !== undefined) assignment.note = note;
        if (startDate) assignment.startDate = new Date(startDate);
        if (endDate !== undefined) assignment.endDate = endDate ? new Date(endDate) : null;
        if (status) assignment.status = status;

        await assignment.save();

        const populated = await TempSeatAssignment.findById(assignment._id)
            .populate('borrowerStudent', 'name studentId')
            .populate({
                path: 'seat',
                select: 'number room floor',
                populate: [
                    { path: 'room', select: 'name hasAc' },
                    { path: 'floor', select: 'name' }
                ]
            })
            .populate('shift', 'name startTime endTime')
            .populate('originalOwner', 'name studentId')
            .lean();

        res.json({ success: true, assignment: populated, message: 'Temporary assignment updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── DELETE /api/admin/temp-seats/:id (Revoke / De-assign) ───────────────────
exports.revokeTempAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await TempSeatAssignment.findById(id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Temporary assignment not found' });

        assignment.status = 'revoked';
        await assignment.save();

        res.json({ success: true, message: 'Temporary seat assignment revoked successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/admin/temp-seats/student/:studentId ────────────────────────────
exports.getStudentTempAssignments = async (req, res) => {
    try {
        const { studentId } = req.params;
        const assignments = await getStudentTempAssignments(studentId);
        res.json({ success: true, assignments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── POST /api/admin/seats/split-assign ──────────────────────────────────────
// Assigns DIFFERENT seats to a student for DIFFERENT shifts
// Body: { studentId, assignments: [{ seatId, shiftId, price? }, ...] }
exports.splitSeatAssign = async (req, res) => {
    try {
        const { studentId, assignments: splitAssignments } = req.body;

        if (!studentId) return res.status(400).json({ success: false, message: 'Student ID is required' });
        if (!splitAssignments || !Array.isArray(splitAssignments) || splitAssignments.length < 2) {
            return res.status(400).json({ success: false, message: 'At least 2 seat-shift pairs are required for split assignment' });
        }

        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const { doTimeRangesOverlap } = require('../utils/timeUtils');

        // Validate all seat+shift combos and check for conflicts
        const validatedPairs = [];
        for (const pair of splitAssignments) {
            const { seatId, shiftId, price } = pair;
            if (!seatId || !shiftId) {
                return res.status(400).json({ success: false, message: 'Each pair must have seatId and shiftId' });
            }

            const [seat, shift] = await Promise.all([
                Seat.findById(seatId).populate('floor room'),
                Shift.findById(shiftId)
            ]);

            if (!seat) return res.status(404).json({ success: false, message: `Seat ${seatId} not found` });
            if (!shift) return res.status(404).json({ success: false, message: `Shift ${shiftId} not found` });

            // Check if any OTHER student occupies this seat-shift
            const otherActive = seat.assignments.filter(
                a => a.status === 'active' && a.student.toString() !== studentId.toString()
            );

            if (otherActive.some(a => a.type === 'full_day')) {
                return res.status(400).json({
                    success: false,
                    message: `Seat ${seat.number} is fully occupied by another student`
                });
            }

            for (const asgn of otherActive) {
                if (asgn.shift) {
                    const asgnShift = await Shift.findById(asgn.shift);
                    if (asgnShift && doTimeRangesOverlap(shift.startTime, shift.endTime, asgnShift.startTime, asgnShift.endTime)) {
                        return res.status(400).json({
                            success: false,
                            message: `Seat ${seat.number} has a conflict during ${shift.name}`
                        });
                    }
                }
            }

            validatedPairs.push({ seat, shift, price: price || 0 });
        }

        // Remove student from ALL previous active seat assignments
        const previousSeats = await Seat.find({
            'assignments': { $elemMatch: { student: studentId, status: 'active' } }
        });

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

        // Update isOccupied for previously occupied seats
        for (const prevSeat of previousSeats) {
            const updatedSeat = await Seat.findById(prevSeat._id);
            const hasActive = updatedSeat.assignments.some(a => a.status === 'active');
            if (!hasActive) {
                updatedSeat.isOccupied = false;
                await updatedSeat.save();
            }
        }

        // Create new assignments — one per seat-shift pair
        const assignedSeats = [];
        for (const { seat, shift, price } of validatedPairs) {
            seat.assignments.push({
                student: student._id,
                shift: shift._id,
                type: 'specific',
                status: 'active',
                assignedAt: new Date(),
                price: price
            });
            seat.isOccupied = true;
            await seat.save();
            assignedSeats.push({ seatNumber: seat.number, shiftName: shift.name });
        }

        // Update student's primary seat reference to first seat
        await User.findByIdAndUpdate(studentId, {
            seat: validatedPairs[0].seat._id,
            seatAssignedAt: student.seatAssignedAt || new Date()
        });

        res.json({
            success: true,
            message: `Split assignment created: ${assignedSeats.map(s => `${s.seatNumber}(${s.shiftName})`).join(' + ')}`,
            assignedSeats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports.getStudentTempAssignmentsHelper = getStudentTempAssignments;
