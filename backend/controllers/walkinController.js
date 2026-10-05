const mongoose = require('mongoose');
const DailyAbsence = require('../models/DailyAbsence');
const WalkinSlot = require('../models/WalkinSlot');
const WalkinRequest = require('../models/WalkinRequest');
const User = require('../models/User');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');

// ─── Helper ───────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

// Convert 'HH:MM' to minutes since midnight
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Convert minutes to 'HH:MM'
const toTimeStr = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Do two time ranges [s1,e1] and [s2,e2] overlap?
const overlaps = (s1, e1, s2, e2) => toMins(s1) < toMins(e2) && toMins(s1) > toMins(s2) || (toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2));

// Calculate free sub-intervals within [sReq, eReq] given occupied windows [[sOcc, eOcc], ...]
const getFreeSubIntervals = (sReq, eReq, occupiedWindows) => {
    let free = [[toMins(sReq), toMins(eReq)]];

    for (const [oStart, oEnd] of occupiedWindows) {
        const nextFree = [];
        for (const [fStart, fEnd] of free) {
            const overlapStart = Math.max(fStart, oStart);
            const overlapEnd = Math.min(fEnd, oEnd);

            if (overlapStart < overlapEnd) {
                // There is an overlap; keep non-overlapping sub-intervals
                if (fStart < overlapStart) {
                    nextFree.push([fStart, overlapStart]);
                }
                if (overlapEnd < fEnd) {
                    nextFree.push([overlapEnd, fEnd]);
                }
            } else {
                nextFree.push([fStart, fEnd]);
            }
        }
        free = nextFree;
    }

    return free;
};

// ─── ADMIN: Mark student absent today ────────────────────────────────
exports.markAbsent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { date, note } = req.body;
        const absenceDate = date || todayStr();

        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Upsert — if already marked, just update note
        const absence = await DailyAbsence.findOneAndUpdate(
            { student: studentId, date: absenceDate },
            { student: studentId, date: absenceDate, markedBy: req.user.id, note: note || '' },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: `${student.name} marked absent for ${absenceDate}`, absence });
    } catch (err) {
        console.error('markAbsent error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Remove absent mark ────────────────────────────────────────
exports.removeAbsent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const date = req.query.date || todayStr();
        await DailyAbsence.deleteOne({ student: studentId, date });
        res.json({ success: true, message: 'Absence removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Get all absences for a date ───────────────────────────────
exports.getAbsencesByDate = async (req, res) => {
    try {
        const date = req.query.date || todayStr();
        const absences = await DailyAbsence.find({ date })
            .populate('student', 'name mobile profileImage gender studentId')
            .populate('markedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, absences, date });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Check if student is absent today ──────────────────────────
exports.checkAbsent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const date = req.query.date || todayStr();
        const absence = await DailyAbsence.findOne({ student: studentId, date });
        res.json({ success: true, isAbsent: !!absence, absence });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Create walkin slot ────────────────────────────────────────
exports.createWalkinSlot = async (req, res) => {
    try {
        const { name, startTime, endTime, feePerSession, eligibleSeats } = req.body;
        if (!name || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'name, startTime, endTime required' });
        }
        const slot = await WalkinSlot.create({
            name, startTime, endTime,
            feePerSession: feePerSession || 0,
            eligibleSeats: eligibleSeats || [],
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, slot });
    } catch (err) {
        console.error('createWalkinSlot error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Get all walkin slots ──────────────────────────────────────
exports.getWalkinSlots = async (req, res) => {
    try {
        const slots = await WalkinSlot.find().populate('eligibleSeats', 'number room').sort({ startTime: 1 });
        res.json({ success: true, slots });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Update walkin slot ────────────────────────────────────────
exports.updateWalkinSlot = async (req, res) => {
    try {
        const slot = await WalkinSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
        res.json({ success: true, slot });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Delete walkin slot ────────────────────────────────────────
exports.deleteWalkinSlot = async (req, res) => {
    try {
        await WalkinSlot.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Slot deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Get all walkin requests ──────────────────────────────────
exports.getWalkinRequests = async (req, res) => {
    try {
        const { date, status } = req.query;
        const filter = {};
        if (date) filter.date = date;
        if (status) filter.status = status;
        const requests = await WalkinRequest.find(filter)
            .populate('student', 'name mobile profileImage gender studentId')
            .populate('seat', 'number room')
            .populate('walkinSlot', 'name startTime endTime')
            .sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Approve walkin request ───────────────────────────────────
exports.approveWalkinRequest = async (req, res) => {
    try {
        const request = await WalkinRequest.findById(req.params.id)
            .populate('walkinSlot', 'feePerSession');
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        request.status = 'approved';
        request.approvedBy = req.user.id;
        request.approvedAt = new Date();
        // Use negotiated fee if provided, otherwise fall back to slot default
        if (req.body.feeCharged !== undefined && req.body.feeCharged !== null && req.body.feeCharged !== '') {
            request.feeCharged = Number(req.body.feeCharged);
        } else if (request.walkinSlot?.feePerSession) {
            request.feeCharged = request.walkinSlot.feePerSession;
        }
        await request.save();
        res.json({ success: true, message: 'Request approved', request });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: Reject walkin request ────────────────────────────────────
exports.rejectWalkinRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await WalkinRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        request.status = 'rejected';
        request.rejectionReason = reason || '';
        await request.save();
        res.json({ success: true, message: 'Request rejected', request });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── PUBLIC/STUDENT: Get available seats for a slot ──────────────────
// GET /api/walkin/available-seats?slotId=xxx&date=YYYY-MM-DD
// ─── PUBLIC/STUDENT: Get available seats for a slot or custom time window ─────
// GET /api/walkin/available-seats?slotId=xxx&date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
exports.getAvailableSeats = async (req, res) => {
    try {
        const { slotId, date, startTime, endTime } = req.query;
        const targetDate = date || todayStr();

        let sStart = startTime;
        let sEnd = endTime;
        let eligibleSeatIds = null;
        let slotMeta = { name: 'Custom Shift', startTime: sStart, endTime: sEnd, feePerSession: 0 };

        if (slotId && slotId !== 'flex-shift' && mongoose.Types.ObjectId.isValid(slotId)) {
            const slot = await WalkinSlot.findById(slotId).populate('eligibleSeats');
            if (!slot || !slot.isActive) return res.status(404).json({ success: false, message: 'Slot not found or inactive' });
            sStart = slot.startTime;
            sEnd = slot.endTime;
            slotMeta = {
                name: slot.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                feePerSession: slot.feePerSession
            };
            if (slot.eligibleSeats && slot.eligibleSeats.length > 0) {
                eligibleSeatIds = slot.eligibleSeats.map(s => s._id);
            }
        }

        if (!sStart || !sEnd) {
            if (req.user) {
                const student = await User.findById(req.user.id).select('flexShift').lean();
                if (student?.flexShift?.startTime && student?.flexShift?.endTime) {
                    sStart = student.flexShift.startTime;
                    sEnd = student.flexShift.endTime;
                    slotMeta = {
                        name: student.flexShift.label || 'Assigned Shift',
                        startTime: sStart,
                        endTime: sEnd,
                        feePerSession: 0
                    };
                }
            }
            if (!sStart || !sEnd) {
                const firstActiveSlot = await WalkinSlot.findOne({ isActive: true }).sort({ startTime: 1 }).lean();
                if (firstActiveSlot) {
                    sStart = firstActiveSlot.startTime;
                    sEnd = firstActiveSlot.endTime;
                    slotMeta = {
                        name: firstActiveSlot.name,
                        startTime: firstActiveSlot.startTime,
                        endTime: firstActiveSlot.endTime,
                        feePerSession: firstActiveSlot.feePerSession || 0
                    };
                } else {
                    sStart = '08:00';
                    sEnd = '20:00';
                }
            }
        }

        // Get absent students today
        const absences = await DailyAbsence.find({ date: targetDate }).select('student');
        const absentStudentIds = new Set(absences.map(a => String(a.student)));

        // Get already approved/pending walkin requests for this date
        const existingRequests = await WalkinRequest.find({
            date: targetDate,
            status: { $in: ['pending', 'approved'] }
        }).select('seat startTime endTime');

        // Determine which seats to evaluate: if specific eligible seats configured, use them; otherwise ALL seats
        const seatFilter = eligibleSeatIds && eligibleSeatIds.length > 0 ? { _id: { $in: eligibleSeatIds } } : {};
        const seats = await Seat.find(seatFilter)
            .populate({ path: 'assignments.shift', select: 'name startTime endTime' })
            .populate('room', 'name')
            .populate('floor', 'name')
            .sort({ number: 1 });

        const results = [];

        for (const seat of seats) {
            let absentOwner = null;
            const occupiedWindows = [];

            const activeAssignments = (seat.assignments || []).filter(a => a.status === 'active');
            for (const asgn of activeAssignments) {
                const shiftStart = asgn.shift ? asgn.shift.startTime : (asgn.legacyShift === 'full' ? '06:00' : asgn.legacyShift === 'day' ? '06:00' : '18:00');
                const shiftEnd = asgn.shift ? asgn.shift.endTime : (asgn.legacyShift === 'full' ? '22:00' : (asgn.legacyShift === 'day' ? '18:00' : '22:00'));

                if (absentStudentIds.has(String(asgn.student))) {
                    absentOwner = asgn.student;
                } else {
                    occupiedWindows.push([toMins(shiftStart), toMins(shiftEnd)]);
                }
            }

            // Check if other walkins reserved this seat on this date
            const seatWalkinRequests = existingRequests.filter(r => String(r.seat) === String(seat._id));
            for (const r of seatWalkinRequests) {
                occupiedWindows.push([toMins(r.startTime), toMins(r.endTime)]);
            }

            const reqStartMin = toMins(sStart);
            const reqEndMin = toMins(sEnd);
            const totalReqMinutes = Math.max(0, reqEndMin - reqStartMin);

            const freeIntervals = getFreeSubIntervals(sStart, sEnd, occupiedWindows);
            const totalFreeMinutes = freeIntervals.reduce((sum, [s, e]) => sum + (e - s), 0);

            let status = 'available';
            let partialInfo = null;

            if (totalFreeMinutes === 0) {
                status = 'occupied';
            } else if (totalFreeMinutes >= totalReqMinutes) {
                // Entire requested time window is free
                if (absentOwner && activeAssignments.length > 0) {
                    status = 'absent_today';
                } else if (seatWalkinRequests.length > 0) {
                    status = 'requested';
                } else {
                    status = 'available';
                }
            } else {
                // Partially vacant! Find contiguous free intervals of at least 30 minutes
                const validIntervals = freeIntervals.filter(([s, e]) => (e - s) >= 30);
                if (validIntervals.length > 0) {
                    const longest = validIntervals.reduce((max, cur) => (cur[1] - cur[0] > max[1] - max[0] ? cur : max), validIntervals[0]);
                    const pStart = toTimeStr(longest[0]);
                    const pEnd = toTimeStr(longest[1]);

                    const occRanges = occupiedWindows
                        .map(([s, e]) => {
                            const os = Math.max(reqStartMin, s);
                            const oe = Math.min(reqEndMin, e);
                            return os < oe ? `${toTimeStr(os)} – ${toTimeStr(oe)}` : null;
                        })
                        .filter(Boolean);

                    partialInfo = {
                        startTime: pStart,
                        endTime: pEnd,
                        timing: `${pStart} – ${pEnd}`,
                        freeMinutes: longest[1] - longest[0],
                        totalFreeMinutes,
                        occupiedTiming: occRanges.join(', ') || 'Occupied during other hours'
                    };
                    status = 'partial_vacant';
                } else {
                    status = 'occupied';
                }
            }

            const seatObj = {
                _id: seat._id,
                number: seat.number,
                room: typeof seat.room === 'object' ? seat.room?.name : (seat.room || 'General'),
                floor: typeof seat.floor === 'object' ? seat.floor?.name : (seat.floor || '')
            };

            results.push({
                seat: seatObj,
                seatId: seat._id,
                seatNumber: seat.number,
                room: seatObj.room,
                floor: seatObj.floor,
                status,
                isAvailable: status === 'available' || status === 'absent_today' || status === 'partial_vacant',
                isPartial: status === 'partial_vacant',
                partialTiming: partialInfo?.timing || null,
                partialStartTime: partialInfo?.startTime || null,
                partialEndTime: partialInfo?.endTime || null,
                partialInfo,
                freeMinutes: partialInfo?.freeMinutes || (status === 'available' ? totalReqMinutes : 0),
                occupiedTiming: partialInfo?.occupiedTiming || null
            });
        }

        res.json({
            success: true,
            slot: slotMeta,
            seats: results,
            date: targetDate
        });
    } catch (err) {
        console.error('getAvailableSeats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Submit a walkin seat request ────────────────────────────
exports.submitWalkinRequest = async (req, res) => {
    try {
        const { seatId, slotId, date, startTime, endTime } = req.body;
        const targetDate = date || todayStr();

        let reqStart = startTime;
        let reqEnd = endTime;
        let feeCharged = 0;
        let resolvedSlotId = null;

        const student = await User.findById(req.user.id);
        const hasMonthlyFlex = Boolean(student?.flexShift?.monthlyFee && student.flexShift.monthlyFee > 0);

        if (slotId && slotId !== 'flex-shift' && mongoose.Types.ObjectId.isValid(slotId)) {
            const slot = await WalkinSlot.findById(slotId);
            if (!slot || !slot.isActive) return res.status(404).json({ success: false, message: 'Slot not found' });
            resolvedSlotId = slot._id;
            reqStart = startTime || slot.startTime;
            reqEnd = endTime || slot.endTime;
            feeCharged = hasMonthlyFlex ? 0 : (slot.feePerSession || 0);
        } else if (student?.flexShift?.startTime && student?.flexShift?.endTime) {
            reqStart = startTime || student.flexShift.startTime;
            reqEnd = endTime || student.flexShift.endTime;
            feeCharged = 0; // Covered by monthly flex fee
        }

        if (!reqStart || !reqEnd) {
            return res.status(400).json({ success: false, message: 'Start and end time required' });
        }

        // Check if student already has a pending/approved request for this date
        const existing = await WalkinRequest.findOne({
            student: req.user.id,
            date: targetDate,
            status: { $in: ['pending', 'approved'] }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have an active seat claim or request for this date' });
        }

        const request = await WalkinRequest.create({
            student: req.user.id,
            seat: seatId,
            walkinSlot: resolvedSlotId,
            date: targetDate,
            startTime: reqStart,
            endTime: reqEnd,
            feeCharged,
            status: hasMonthlyFlex ? 'approved' : 'pending',
            approvedAt: hasMonthlyFlex ? new Date() : null,
            note: req.body.note || (hasMonthlyFlex ? 'Auto-approved (Monthly Flex Plan)' : '')
        });

        res.status(201).json({
            success: true,
            message: hasMonthlyFlex
                ? 'Seat confirmed for your shift! You can check in when you arrive.'
                : 'Request submitted. Waiting for admin approval.',
            request
        });
    } catch (err) {
        console.error('submitWalkinRequest error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Get my walkin requests ─────────────────────────────────
exports.getMyWalkinRequests = async (req, res) => {
    try {
        const requests = await WalkinRequest.find({ student: req.user.id })
            .populate('seat', 'number room')
            .populate('walkinSlot', 'name startTime endTime')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── ADMIN: List all seats (for eligibleSeats picker) ────────────────
exports.getAllSeatsForWalkin = async (req, res) => {
    try {
        const seats = await Seat.find({}, 'number room floor isAC')
            .populate('room', 'name')
            .populate('floor', 'name')
            .sort({ number: 1 })
            .lean();
        // Flatten to simple objects for the frontend
        const list = seats.map(s => ({
            _id: s._id,
            number: s.number,
            room: typeof s.room === 'object' ? s.room?.name : s.room,
            floor: typeof s.floor === 'object' ? s.floor?.name : s.floor,
            isAC: s.isAC
        }));
        res.json({ success: true, seats: list });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Check in to an approved walkin request ─────────────────
exports.checkInWalkin = async (req, res) => {
    try {
        const request = await WalkinRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        // Only the request owner can check in
        if (String(request.student) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (request.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Request must be approved before check-in' });
        }
        if (request.checkedInAt) {
            return res.status(400).json({ success: false, message: 'Already checked in' });
        }

        request.checkedInAt = new Date();
        await request.save();

        res.json({ success: true, message: 'Checked in successfully', request });
    } catch (err) {
        console.error('checkInWalkin error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Check out of a walkin session ───────────────────────────
exports.checkOutWalkin = async (req, res) => {
    try {
        const request = await WalkinRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        if (String(request.student) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (!request.checkedInAt) {
            return res.status(400).json({ success: false, message: 'Must check in first' });
        }
        if (request.checkedOutAt) {
            return res.status(400).json({ success: false, message: 'Already checked out' });
        }

        request.checkedOutAt = new Date();
        request.status = 'completed';
        await request.save();

        res.json({ success: true, message: 'Checked out. Session complete!', request });
    } catch (err) {
        console.error('checkOutWalkin error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Get today's occupied/claimed seat for flexible scholar ───────────
exports.getTodayOccupiedSeat = async (req, res) => {
    try {
        const targetDate = req.query.date || todayStr();
        const request = await WalkinRequest.findOne({
            student: req.user.id,
            date: targetDate,
            status: { $in: ['approved', 'pending'] }
        })
        .populate({
            path: 'seat',
            select: 'number room floor isAC',
            populate: [
                { path: 'room', select: 'name roomId' },
                { path: 'floor', select: 'name' }
            ]
        })
        .populate('walkinSlot', 'name startTime endTime');

        res.json({
            success: true,
            hasOccupied: Boolean(request && request.seat),
            request: request || null
        });
    } catch (err) {
        console.error('getTodayOccupiedSeat error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Instantly occupy an available desk ───────────────────────────────
exports.occupyWalkinSeat = async (req, res) => {
    try {
        const { seatId, slotId, startTime, endTime, date, note } = req.body;
        const targetDate = date || todayStr();

        const student = await User.findById(req.user.id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        let reqStart = startTime;
        let reqEnd = endTime;

        if (slotId && slotId !== 'flex-shift' && mongoose.Types.ObjectId.isValid(slotId)) {
            const slot = await WalkinSlot.findById(slotId);
            if (slot) {
                reqStart = startTime || slot.startTime;
                reqEnd = endTime || slot.endTime;
            }
        } else if (student.flexShift?.startTime && student.flexShift?.endTime) {
            reqStart = startTime || student.flexShift.startTime;
            reqEnd = endTime || student.flexShift.endTime;
        }

        if (!reqStart || !reqEnd) {
            return res.status(400).json({ success: false, message: 'Shift timing required' });
        }

        const seat = await Seat.findById(seatId).populate('room', 'name roomId').populate('floor', 'name');
        if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });

        // Check if permanent active assignments hold this seat in overlapping time (and holder is not absent)
        const fullSeat = await Seat.findById(seatId).populate({ path: 'assignments.shift', select: 'name startTime endTime' });
        if (fullSeat) {
            const absences = await DailyAbsence.find({ date: targetDate }).select('student');
            const absentIds = new Set(absences.map(a => String(a.student)));
            const activeAsgns = (fullSeat.assignments || []).filter(a => a.status === 'active' && !absentIds.has(String(a.student)));
            for (const a of activeAsgns) {
                const aStart = a.shift ? a.shift.startTime : (a.legacyShift === 'full' ? '06:00' : a.legacyShift === 'day' ? '06:00' : '18:00');
                const aEnd = a.shift ? a.shift.endTime : (a.legacyShift === 'full' ? '22:00' : a.legacyShift === 'day' ? '18:00' : '22:00');
                if (overlaps(reqStart, reqEnd, aStart, aEnd)) {
                    return res.status(400).json({ success: false, message: `This desk is occupied from ${aStart} to ${aEnd}. Please select the vacant partial timing.` });
                }
            }
        }

        // Check if another student already holds this seat in overlapping time
        const existingForSeat = await WalkinRequest.find({
            seat: seatId,
            date: targetDate,
            student: { $ne: req.user.id },
            status: { $in: ['approved', 'pending'] }
        });
        const hasOverlap = existingForSeat.some(r => overlaps(reqStart, reqEnd, r.startTime, r.endTime));
        if (hasOverlap) {
            return res.status(400).json({ success: false, message: 'This seat is already occupied for this time window.' });
        }

        // Upsert or create for this student today
        let request = await WalkinRequest.findOne({
            student: req.user.id,
            date: targetDate,
            status: { $in: ['approved', 'pending'] }
        });

        if (request) {
            request.seat = seatId;
            request.startTime = reqStart;
            request.endTime = reqEnd;
            request.status = 'approved';
            request.checkedInAt = request.checkedInAt || new Date();
            request.note = note || 'Flexible Desk Occupied';
            await request.save();
        } else {
            request = await WalkinRequest.create({
                student: req.user.id,
                seat: seatId,
                walkinSlot: slotId && mongoose.Types.ObjectId.isValid(slotId) ? slotId : null,
                date: targetDate,
                startTime: reqStart,
                endTime: reqEnd,
                status: 'approved',
                approvedAt: new Date(),
                checkedInAt: new Date(),
                feeCharged: 0,
                note: note || 'Flexible Desk Occupied'
            });
        }

        const populated = await WalkinRequest.findById(request._id)
            .populate({
                path: 'seat',
                select: 'number room floor isAC',
                populate: [
                    { path: 'room', select: 'name roomId' },
                    { path: 'floor', select: 'name' }
                ]
            })
            .populate('walkinSlot', 'name startTime endTime');

        res.json({
            success: true,
            message: `Seat ${seat.number} successfully occupied!`,
            request: populated
        });
    } catch (err) {
        console.error('occupyWalkinSeat error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── STUDENT: Release occupied desk ───────────────────────────────────────────
exports.releaseWalkinSeat = async (req, res) => {
    try {
        const targetDate = req.query.date || todayStr();
        const request = await WalkinRequest.findOne({
            student: req.user.id,
            date: targetDate,
            status: { $in: ['approved', 'pending'] }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'No active occupied seat found for today' });
        }

        request.status = 'completed';
        request.checkedOutAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Seat released successfully. You can occupy another free seat anytime.',
            request
        });
    } catch (err) {
        console.error('releaseWalkinSeat error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

