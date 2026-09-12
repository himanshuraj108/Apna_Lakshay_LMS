const User = require('../models/User');
const Seat = require('../models/Seat');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const Request = require('../models/Request');
const Shift = require('../models/Shift');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const ActionLog = require('../models/ActionLog');
const { callGroq } = require('../services/aiService');

/**
 * Gather live operational metrics across the platform (100% REAL from MongoDB)
 */
const getLiveOperationalMetrics = async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
        totalStudents,
        totalSeats,
        occupiedSeatsAgg,
        todayAttendance,
        currentlyCheckedIn,
        feesCollectedAgg,
        todayFeesCollectedAgg,
        pendingFeesAgg,
        pendingRequests,
        shifts,
        recentLogs
    ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Seat.countDocuments(),
        Seat.aggregate([
            { $unwind: '$assignments' },
            { $match: { 'assignments.status': 'active' } },
            {
                $group: {
                    _id: '$_id',
                    studentIds: { $addToSet: '$assignments.student' }
                }
            }
        ]),
        Attendance.countDocuments({ date: { $gte: startOfToday } }),
        Attendance.countDocuments({ date: { $gte: startOfToday }, isActive: true }),
        Fee.aggregate([
            { $match: { status: { $in: ['paid', 'partial'] } } },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'partial'] },
                                { $ifNull: ['$partialPaid', 0] },
                                '$amount'
                            ]
                        }
                    }
                }
            }
        ]),
        Fee.aggregate([
            {
                $match: {
                    status: { $in: ['paid', 'partial'] },
                    $or: [
                        { paidDate: { $gte: startOfToday } },
                        { paidDate: null, updatedAt: { $gte: startOfToday } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'partial'] },
                                { $ifNull: ['$partialPaid', 0] },
                                '$amount'
                            ]
                        }
                    }
                }
            }
        ]),
        Fee.aggregate([
            { $match: { status: { $in: ['pending', 'overdue'] } } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]),
        Request.countDocuments({ status: 'pending' }),
        Shift.find({ isActive: { $ne: false } }).select('name startTime endTime maxCapacity').lean(),
        ActionLog.find().sort({ createdAt: -1 }).limit(5).select('action details createdAt').lean().catch(() => [])
    ]);

    const occupiedSeats = occupiedSeatsAgg.length;
    const activeStudentSet = new Set();
    occupiedSeatsAgg.forEach(s => s.studentIds.forEach(id => id && activeStudentSet.add(id.toString())));
    const activeStudents = activeStudentSet.size;
    const vacantSeats = Math.max(0, totalSeats - occupiedSeats);
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    const feesCollected = feesCollectedAgg[0]?.total || 0;
    const todayFeesCollected = todayFeesCollectedAgg[0]?.total || 0;
    const pendingFeesCount = pendingFeesAgg[0]?.count || 0;
    const pendingFeesAmount = pendingFeesAgg[0]?.totalAmount || 0;

    return {
        totalStudents,
        activeStudents,
        totalSeats,
        occupiedSeats,
        vacantSeats,
        occupancyRate,
        todayAttendance,
        currentlyCheckedIn,
        feesCollected,
        todayFeesCollected,
        pendingFeesCount,
        pendingFeesAmount,
        pendingRequests,
        shifts: shifts || [],
        recentLogs: recentLogs || []
    };
};

/**
 * Synthesize fallback executive summary when AI model is offline
 */
const synthesizeRuleBasedSummary = (question, m) => {
    const qLower = (question || '').toLowerCase();

    if (qLower.includes('seat') || qLower.includes('vacant') || qLower.includes('occupan')) {
        return `### Seat & Capacity Status\n\n` +
            `- **Total Physical Seats**: ${m.totalSeats}\n` +
            `- **Currently Occupied**: ${m.occupiedSeats} seats (${m.occupancyRate}% occupancy rate)\n` +
            `- **Vacant / Available**: ${m.vacantSeats} seats ready for allocation\n` +
            `- **Active Students with Assigned Desks**: ${m.activeStudents}\n\n` +
            `*Recommendation*: ${m.vacantSeats > 10 ? `You have ${m.vacantSeats} open seats available for new student enrollments.` : 'Seat capacity is nearing full occupancy; consider expanding shift limits or prioritizing high-demand rooms.'}`;
    }

    if (qLower.includes('fee') || qLower.includes('money') || qLower.includes('revenue') || qLower.includes('pending') || qLower.includes('paisa')) {
        return `### Financial & Fee Collection Overview\n\n` +
            `- **Total Lifetime Fees Collected**: ₹${m.feesCollected.toLocaleString('en-IN')}\n` +
            `- **Collected Today**: ₹${m.todayFeesCollected.toLocaleString('en-IN')}\n` +
            `- **Pending Fee Accounts**: ${m.pendingFeesCount} students\n` +
            `- **Total Outstanding Due**: ₹${m.pendingFeesAmount.toLocaleString('en-IN')}\n\n` +
            `*Recommendation*: Send automated WhatsApp or SMS payment reminders to the ${m.pendingFeesCount} students with pending dues via the Fee Management panel.`;
    }

    if (qLower.includes('attend') || qLower.includes('present') || qLower.includes('checkin') || qLower.includes('absent')) {
        return `### Today's Attendance Overview\n\n` +
            `- **Total Check-ins Today**: ${m.todayAttendance} attendance marks\n` +
            `- **Currently Present in Campus**: ${m.currentlyCheckedIn} active students\n` +
            `- **Total Enrolled Capacity**: ${m.totalStudents} students\n\n` +
            `*Status*: Attendance operations are active. Students can verify entry via QR Kiosk, PIN or biometric login.`;
    }

    return `### Executive Campus Summary\n\n` +
        `Here is the real-time operational status across **Apna Lakshay Library & Campus**:\n\n` +
        `1. **Seat Occupancy**: **${m.occupiedSeats} / ${m.totalSeats}** seats occupied (**${m.occupancyRate}%** capacity), with **${m.vacantSeats}** vacant slots.\n` +
        `2. **Today's Attendance**: **${m.todayAttendance}** total check-ins today (**${m.currentlyCheckedIn}** currently inside study halls).\n` +
        `3. **Student Roster**: **${m.totalStudents}** registered students (**${m.activeStudents}** active seat holders).\n` +
        `4. **Financial Health**: ₹**${m.feesCollected.toLocaleString('en-IN')}** collected overall (₹**${m.todayFeesCollected.toLocaleString('en-IN')}** today). Outstanding dues: ₹**${m.pendingFeesAmount.toLocaleString('en-IN')}** across ${m.pendingFeesCount} students.\n` +
        `5. **Requests & Alerts**: **${m.pendingRequests}** pending student change requests require review.\n\n` +
        `*Quick Action*: Open **Fee Management** to review defaulters, or visit **Floor Management** to allocate remaining vacant seats.`;
};

/**
 * @desc    Ask Executive AI about platform operations & live metrics
 * @route   POST /api/admin/ai/ask
 */
exports.askAdminAI = async (req, res) => {
    try {
        const { question, history = [] } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ success: false, message: 'Question cannot be empty' });
        }

        const metrics = await getLiveOperationalMetrics();

        const shiftsStr = metrics.shifts.map(s => `${s.name} (${s.startTime || '—'} to ${s.endTime || '—'})`).join(', ') || 'Morning, Evening, Full Day';
        const recentLogsStr = metrics.recentLogs.map(l => `${l.action}: ${l.details || ''}`).join(' | ') || 'No recent action logs';

        const systemPrompt = `You are the Chief AI Intelligence Officer and Executive Assistant for Apna Lakshay LMS (an enterprise Library and Campus Management System).
You have real-time live access to the campus operational database.

LIVE METRICS (100% REAL FROM DATABASE):
- Total Registered Students: ${metrics.totalStudents}
- Active Students with Assigned Seats: ${metrics.activeStudents}
- Total Physical Seats: ${metrics.totalSeats}
- Occupied Seats: ${metrics.occupiedSeats} (${metrics.occupancyRate}% occupancy rate)
- Vacant Available Seats: ${metrics.vacantSeats}
- Total Attendance Check-ins Today: ${metrics.todayAttendance}
- Students Currently Present In Hall: ${metrics.currentlyCheckedIn}
- Total Fees Collected: ₹${metrics.feesCollected.toLocaleString('en-IN')}
- Fees Collected Today: ₹${metrics.todayFeesCollected.toLocaleString('en-IN')}
- Pending Fees Defaulters: ${metrics.pendingFeesCount} students (Total Due: ₹${metrics.pendingFeesAmount.toLocaleString('en-IN')})
- Pending Student Requests: ${metrics.pendingRequests}
- Active Study Shifts: ${shiftsStr}
- Recent System Logs: ${recentLogsStr}

ADMINISTRATOR GUIDELINES:
1. Provide concise, high-value executive intelligence. Use the EXACT figures from the live metrics above.
2. If asked "what is happening", "summary", or "kya chal raha hai", provide a clear briefing highlighting attendance flow, occupancy, collections, and pending actions.
3. If asked about seats, fees, attendance, or shifts, focus directly on those specific metrics.
4. Structure your response with clean Markdown (bold numbers, bullet points, headers). Do not use ANY emojis whatsoever. Maintain a sophisticated enterprise tone.
5. Answer in the same language/script the user asked (English, Hindi, or Hinglish).
6. Provide one actionable next step or recommendation for the administrator.`;

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        if (Array.isArray(history)) {
            const recentHistory = history.slice(-4);
            for (const h of recentHistory) {
                if (h.role && h.content) {
                    messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
                }
            }
        }

        messages.push({ role: 'user', content: question.trim() });

        let answerText = '';
        try {
            answerText = await callGroq(messages, { temperature: 0.4, max_tokens: 1200 });
        } catch (groqError) {
            console.warn('[Admin AI] Groq API call failed, using rule-based synthesis:', groqError.message);
            answerText = synthesizeRuleBasedSummary(question, metrics);
        }

        res.status(200).json({
            success: true,
            answer: answerText,
            metrics: {
                totalStudents: metrics.totalStudents,
                occupiedSeats: metrics.occupiedSeats,
                totalSeats: metrics.totalSeats,
                vacantSeats: metrics.vacantSeats,
                todayAttendance: metrics.todayAttendance,
                currentlyCheckedIn: metrics.currentlyCheckedIn,
                feesCollected: metrics.feesCollected,
                pendingFeesAmount: metrics.pendingFeesAmount,
                pendingRequests: metrics.pendingRequests
            }
        });
    } catch (error) {
        console.error('Ask Admin AI error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing AI query',
            error: error.message
        });
    }
};

/**
 * @desc    Get complete live dashboard state (100% REAL DATA FROM MONGODB)
 * @route   GET /api/admin/dashboard/live
 */
exports.getLiveDashboardData = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // 1. Core Metrics
        const metrics = await getLiveOperationalMetrics();

        // 2. Real 7-Day Attendance Trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const rawTrends = await Attendance.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const attendanceTrends = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const match = rawTrends.find(t => t._id === dateStr);
            attendanceTrends.push({
                date: dateStr,
                day: dayName,
                count: match ? match.count : 0
            });
        }

        // 3. Real Shift Distribution
        const rawShiftDist = await Seat.aggregate([
            { $unwind: '$assignments' },
            { $match: { 'assignments.status': 'active' } },
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'assignments.shift',
                    foreignField: '_id',
                    as: 'shiftInfo'
                }
            },
            { $unwind: { path: '$shiftInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$shiftInfo.name', 'General Shift'] },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. Real Floor Occupancy
        const floors = await Floor.find().sort({ level: 1 }).lean();
        const rooms = await Room.find().lean();
        const allSeats = await Seat.find().select('room assignments').lean();

        const floorOccupancy = floors.map(floor => {
            const floorRooms = rooms.filter(r => r.floor && r.floor.toString() === floor._id.toString());
            const roomIds = floorRooms.map(r => r._id.toString());
            const floorSeats = allSeats.filter(s => s.room && roomIds.includes(s.room.toString()));
            const total = floorSeats.length;
            const occupied = floorSeats.filter(s => s.assignments && s.assignments.some(a => a.status === 'active')).length;
            const vacant = Math.max(0, total - occupied);
            const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
            return {
                _id: floor._id,
                name: floor.name || `Floor ${floor.level || 0}`,
                level: floor.level || 0,
                totalSeats: total,
                occupiedSeats: occupied,
                vacantSeats: vacant,
                percentage,
                roomsCount: floorRooms.length
            };
        });

        // 5. Real Recent Transactions (Fees paid)
        const recentTransactions = await Fee.find({ status: 'paid' })
            .populate('student', 'name email mobile studentId')
            .sort({ paidDate: -1, updatedAt: -1 })
            .limit(6)
            .lean();

        // 6. Real Pending Fees
        const pendingFeesList = await Fee.find({ status: { $in: ['pending', 'overdue'] } })
            .populate('student', 'name email mobile studentId')
            .sort({ dueDate: 1, createdAt: -1 })
            .limit(6)
            .lean();

        // 7. Real Announcements from Notification collection
        const notifications = await Notification.find({ type: 'announcement' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 8. Real 6-Month Student Registration Growth
        const monthlyGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth();
            const monthName = d.toLocaleDateString('en-US', { month: 'short' });
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
            const count = await User.countDocuments({
                role: 'student',
                createdAt: { $gte: start, $lte: end }
            });
            monthlyGrowth.push({
                month: monthName,
                count
            });
        }

        res.status(200).json({
            success: true,
            metrics,
            attendanceTrends,
            shiftDistribution: rawShiftDist,
            floorOccupancy,
            recentTransactions,
            pendingFeesList,
            announcements: notifications,
            monthlyGrowth
        });
    } catch (error) {
        console.error('Get live dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching live dashboard data',
            error: error.message
        });
    }
};

/**
 * @desc    Get quick briefing metrics
 * @route   GET /api/admin/ai/briefing
 */
exports.getAdminAIBriefing = async (req, res) => {
    try {
        const metrics = await getLiveOperationalMetrics();
        res.status(200).json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Get AI briefing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch briefing metrics',
            error: error.message
        });
    }
};
