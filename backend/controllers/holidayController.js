const Holiday = require('../models/Holiday');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const { callGroq } = require('../services/aiService');

let emailService = null;
try {
    emailService = require('../services/emailService');
} catch (err) {
    console.error('HolidayController: emailService unavailable:', err.message);
}

const formatTime12h = (time24) => {
    if (!time24 || !time24.includes(':')) return time24 || '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
};

const formatDatePretty = (d) => {
    try {
        return new Date(d).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (_) {
        return new Date(d).toDateString();
    }
};

/**
 * Generates a professional, bilingual (English + Hindi) structured institutional notice
 * for students using Groq AI with a clean deterministic fallback if AI is unavailable.
 */
const buildStructuredHolidayNotice = async ({
    name = 'Scheduled Holiday',
    dates = [],
    isPartial = false,
    startTime = null,
    endTime = null,
    rawNotes = ''
}) => {
    const cleanName = (name || 'Library Closure').trim();
    const formattedDates = Array.isArray(dates) && dates.length > 0
        ? dates.map(d => formatDatePretty(d)).join(', ')
        : formatDatePretty(new Date());

    const start12 = isPartial && startTime ? formatTime12h(startTime) : '';
    const end12 = isPartial && endTime ? formatTime12h(endTime) : '';

    const timingInfo = isPartial && start12 && end12
        ? `Partial Timing Closure from ${start12} to ${end12} (Library remains operational outside these hours)`
        : 'Full Day Library Closure (Library reading halls will remain closed for the entire day)';

    const fallbackStructured = [
        `• Reason & Occasion: The library is observing "${cleanName}"${rawNotes ? ` (${rawNotes.trim()})` : ''}.`,
        `• Operational Schedule: ${ isPartial && start12 && end12
            ? `Library services will remain non-functional from ${start12} to ${end12} on ${formattedDates}; normal study sessions will operate outside this window.`
            : `All library reading halls will observe a Full Day Closure on ${formattedDates}.` }`,
        `• Attendance Protection: Your current attendance percentage remains 100% protected (neither reduced nor increased) if absent during this closure, while self/admin check-ins still count as Present.`,
        `• Scholar Advisory: Please plan your study schedule and reading materials in advance for ${formattedDates}.`,
        `---`,
        `• कारण एवं अवसर: पुस्तकालय में "${cleanName}"${rawNotes ? ` (${rawNotes.trim()})` : ''} के अवसर पर विशेष सूचना जारी की गई है।`,
        `• संचालन समय-सारणी: दिनांक ${formattedDates} को ${ isPartial && start12 && end12
            ? `पुस्तकालय सेवाएं ${start12} से ${end12} तक आंशिक रूप से बंद (Non-Functional) रहेंगी; शेष समय में अध्ययन कक्ष सामान्य रूप से खुले रहेंगे।`
            : `पुस्तकालय के सभी अध्ययन कक्ष पूर्ण दिवस (Full Day Closure) के लिए बंद रहेंगे।` }`,
        `• उपस्थिति सुरक्षा: इस अवकाश के दौरान अनुपस्थित रहने पर आपकी वर्तमान उपस्थिति प्रतिशत (Attendance %) 100% सुरक्षित एवं अपरिवर्तित रहेगी (न घटेगी, न बढ़ेगी); उपस्थित होने पर सामान्य उपस्थिति दर्ज होगी।`,
        `• विद्यार्थी परामर्श: सभी विद्यार्थियों से अनुरोध है कि दिनांक ${formattedDates} की समय-सारणी के अनुसार अपनी अध्ययन योजना एवं पुस्तकें पूर्व में ही व्यवस्थित कर लें।`
    ].join('\n');

    try {
        const systemPrompt = `You are an official Academic & Library Administration Officer writing a formal, bilingual (English + Hindi) structured "Student Holiday / Operational Notice" for a study library dashboard and official email.
Write a concise, highly professional structured notice containing EXACTLY 4 English bullet lines, followed by "---", followed by EXACTLY 4 Hindi bullet lines:

• Reason & Occasion: [Formal 1-sentence statement in English explicitly mentioning the exact occasion/festival name "${cleanName}" and why the holiday or partial closure is declared]
• Operational Schedule: [Clear English statement explicitly mentioning the exact date(s) "${formattedDates}" and exact timing (${isPartial && start12 && end12 ? `from ${start12} to ${end12}, noting regular operations outside these hours` : `Full Day Closure`})]
• Attendance Protection: [Reassure students in English that their attendance percentage will remain 100% unchanged/neutral if absent on this holiday, while self/admin check-ins still count as Present]
• Scholar Advisory: [Brief polite advice in English to plan their study materials/schedule accordingly]
---
• कारण एवं अवसर: [Formal 1-sentence statement in pure, natural Hindi explicitly mentioning the occasion/festival name (include "${cleanName}" in Hindi/English) and why the holiday or partial closure is declared]
• संचालन समय-सारणी: [Clear Hindi statement explicitly mentioning the exact date(s) "${formattedDates}" and exact timing (${isPartial && start12 && end12 ? `${start12} से ${end12} तक आंशिक रूप से बंद, शेष समय में सामान्य संचालन` : `पूर्ण दिवस अवकाश (Full Day Closure)`})]
• उपस्थिति सुरक्षा: [Reassure students in Hindi that their attendance percentage (Attendance %) will remain 100% unchanged/neutral (न घटेगी, न बढ़ेगी) if absent, while self/admin check-ins still count as Present]
• विद्यार्थी परामर्श: [Brief polite advice in Hindi to plan their study materials/schedule accordingly]

Rules:
- Always include the exact English and Hindi prefixes shown above.
- Always include the exact occasion/festival name "${cleanName}" in the Reason & Occasion / कारण एवं अवसर lines.
- Always include the exact date string "${formattedDates}"${isPartial && start12 && end12 ? ` and exact times "${start12}" and "${end12}"` : ''} in the Operational Schedule / संचालन समय-सारणी lines so they can be highlighted.
- Do NOT use markdown bold (**), headers (#), or emojis.
- Output ONLY the 4 English bullets, "---", and the 4 Hindi bullets.`;

        const userPrompt = `Occasion / Title: ${cleanName}
Scheduled Date(s): ${formattedDates}
Closure Type: ${timingInfo}
Admin Rough Notes / Reason: ${rawNotes ? rawNotes.trim() : 'Standard institutional declaration'}`;

        const aiText = await callGroq(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            { temperature: 0.3, max_tokens: 1400 }
        );

        const cleaned = (aiText || '')
            .replace(/\*\*/g, '')
            .replace(/^#+\s*/gm, '')
            .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, '-')
            .trim();

        const bulletLines = cleaned.split('\n').map(l => l.trim()).filter(l => l.startsWith('•') || l === '---');
        const justBullets = bulletLines.filter(l => l.startsWith('•'));
        if (justBullets.length < 8 || !cleaned.includes('विद्यार्थी परामर्श:') || cleaned.includes('\uFFFD')) {
            return fallbackStructured;
        }

        // Normalize into 4 English bullets + --- + 4 Hindi bullets
        return [
            ...justBullets.slice(0, 4),
            '---',
            ...justBullets.slice(4, 8)
        ].join('\n');
    } catch (err) {
        console.warn('Holiday AI notice generation fallback used:', err.message);
        return fallbackStructured;
    }
};

// @desc    AI-generate a professional, structured student holiday notice
// @route   POST /api/admin/holidays/generate-notice
exports.generateHolidayNotice = async (req, res) => {
    try {
        const {
            name = '',
            dates = [],
            isPartial = false,
            startTime = null,
            endTime = null,
            rawNotes = ''
        } = req.body || {};

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please enter the Holiday / Occasion Title first to generate a structured notice'
            });
        }

        const structuredNotice = await buildStructuredHolidayNotice({
            name,
            dates,
            isPartial,
            startTime,
            endTime,
            rawNotes
        });

        return res.status(200).json({
            success: true,
            notice: structuredNotice
        });
    } catch (error) {
        console.error('generateHolidayNotice error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate notice',
            error: error.message
        });
    }
};

// @desc    Declare one or multiple holidays (full day or partial timing)
//          Preserves existing 'present' attendance records; marks others as neutral 'holiday'
// @route   POST /api/admin/holidays
exports.declareHoliday = async (req, res) => {
    try {
        const {
            date,
            dates,
            startDate,
            endDate,
            selectedWeekdays,
            name,
            description = '',
            isPartial = false,
            startTime = null,
            endTime = null,
            sendEmail = false,
            selectedStudentIds = null,
            sendAdminCopy = false,
            isTentative = false
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Holiday or occasion title is required' });
        }

        if (!isTentative && isPartial && (!startTime || !endTime)) {
            return res.status(400).json({
                success: false,
                message: 'Start time and end time are required for a partial timing holiday'
            });
        }

        // Resolve target dates from single date, dates[], or startDate..endDate + selectedWeekdays
        const uniqueTimeMap = new Map();
        const addNormalizedDate = (raw) => {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return;
            d.setHours(0, 0, 0, 0);
            uniqueTimeMap.set(d.getTime(), d);
        };

        if (Array.isArray(dates) && dates.length > 0) {
            dates.forEach(addNormalizedDate);
        } else if (startDate && endDate) {
            const s = new Date(startDate);
            const e = new Date(endDate);
            s.setHours(0, 0, 0, 0);
            e.setHours(0, 0, 0, 0);
            if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
                return res.status(400).json({ success: false, message: 'Invalid date range selected' });
            }
            const diffDays = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (diffDays > 90) {
                return res.status(400).json({ success: false, message: 'Date range cannot exceed 90 days at once' });
            }
            const weekdayFilter = Array.isArray(selectedWeekdays) && selectedWeekdays.length > 0
                ? new Set(selectedWeekdays.map(Number))
                : null;

            const cur = new Date(s);
            while (cur <= e) {
                if (!weekdayFilter || weekdayFilter.has(cur.getDay())) {
                    addNormalizedDate(cur);
                }
                cur.setDate(cur.getDate() + 1);
            }
        } else if (date) {
            addNormalizedDate(date);
        }

        const targetDates = Array.from(uniqueTimeMap.values()).sort((a, b) => a.getTime() - b.getTime());
        if (targetDates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No matching dates found for the selected criteria'
            });
        }

        const batchId = targetDates.length > 1 ? `HB-${Date.now()}` : null;
        const cleanName = name.trim();
        const rawDesc = (description || '').trim();
        const daysLabel = targetDates.length === 1 ? '1 day' : `${targetDates.length} days`;

        const getISTDateStr = (d) => {
            try {
                return new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            } catch (_) {
                const istShifted = new Date(new Date(d).getTime() + 330 * 60 * 1000);
                return istShifted.toISOString().slice(0, 10);
            }
        };
        const getISTYear = (d) => {
            const iso = getISTDateStr(d);
            const y = parseInt(iso.slice(0, 4), 10);
            return !isNaN(y) ? y : new Date(d).getFullYear();
        };

        // If Admin is storing a Tentative Upcoming Holiday List entry (subject to change, official closure announced separately)
        if (isTentative) {
            const savedTentative = [];
            for (const hDate of targetDates) {
                const hYear = getISTYear(hDate);
                const holidayDoc = await Holiday.findOneAndUpdate(
                    { date: hDate },
                    {
                        $set: {
                            date: hDate,
                            year: hYear,
                            name: cleanName,
                            description: rawDesc,
                            isPartial: false,
                            startTime: null,
                            endTime: null,
                            batchId,
                            emailSent: false,
                            isTentative: true,
                            declaredBy: req.user?.id || null
                        }
                    },
                    { upsert: true, new: true }
                );
                savedTentative.push(holidayDoc);
            }

            return res.status(201).json({
                success: true,
                message: `"${cleanName}" (${daysLabel}) stored in ${getISTYear(targetDates[0])} Holiday List (Subject to change — official declaration will be announced separately).`,
                holiday: savedTentative[0],
                holidays: savedTentative
            });
        }

        const cleanDesc = rawDesc.includes('•')
            ? rawDesc
            : await buildStructuredHolidayNotice({
                name: cleanName,
                dates: targetDates,
                isPartial: !!isPartial,
                startTime: isPartial ? startTime : null,
                endTime: isPartial ? endTime : null,
                rawNotes: rawDesc
            });
        const timingLabel = isPartial
            ? `${formatTime12h(startTime)} to ${formatTime12h(endTime)}`
            : 'Full Day Closure';
        const noteText = isPartial
            ? `Holiday (${timingLabel}) - ${cleanName}`
            : `Holiday - ${cleanName}`;

        // Fetch all active students
        const students = await User.find({ role: 'student', isActive: true }).select('_id name email');

        const savedHolidays = [];
        let totalNeutralMarked = 0;
        let totalPreservedPresent = 0;

        for (const hDate of targetDates) {
            const hYear = getISTYear(hDate);
            const holidayDoc = await Holiday.findOneAndUpdate(
                { date: hDate },
                {
                    $set: {
                        date: hDate,
                        year: hYear,
                        name: cleanName,
                        description: cleanDesc,
                        isPartial: !!isPartial,
                        startTime: isPartial ? startTime : null,
                        endTime: isPartial ? endTime : null,
                        batchId,
                        emailSent: !!sendEmail,
                        isTentative: false,
                        declaredBy: req.user?.id || null
                    }
                },
                { upsert: true, new: true }
            );
            savedHolidays.push(holidayDoc);

            if (students.length > 0) {
                // Find students who ALREADY attended and marked present on this date
                const existingPresent = await Attendance.find({
                    date: hDate,
                    $or: [
                        { status: 'present' },
                        { entryTime: { $nin: [null, ''] } }
                    ]
                }).select('student').lean();

                const presentIds = new Set(existingPresent.map(r => r.student.toString()));
                totalPreservedPresent += presentIds.size;

                const studentsForHoliday = students.filter(s => !presentIds.has(s._id.toString()));
                totalNeutralMarked += studentsForHoliday.length;

                if (studentsForHoliday.length > 0) {
                    const ops = studentsForHoliday.map(s => ({
                        updateOne: {
                            filter: { student: s._id, date: hDate },
                            update: {
                                $set: {
                                    student: s._id,
                                    date: hDate,
                                    status: 'holiday',
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
            }
        }

        const dateSummary = targetDates.length === 1
            ? formatDatePretty(targetDates[0])
            : `${ targetDates.map(d => formatDatePretty(d)).join(' | ') }`;

        const operationalMsg = isPartial
            ? `Library will remain non-functional from ${formatTime12h(startTime)} to ${formatTime12h(endTime)}.`
            : `Library will remain closed for the full day.`;

        const fullMessage = [
            `Occasion: ${cleanName}`,
            `Date(s): ${dateSummary}`,
            `Schedule: ${operationalMsg}`,
            cleanDesc ? `Details: ${cleanDesc}` : null,
            `Note: Your attendance percentage will remain unchanged at its current level if you do not attend during this holiday.`
        ].filter(Boolean).join('\n');

        // Create in-app notification for all active students
        if (students.length > 0) {
            const notifDocs = students.map(s => ({
                recipient: s._id,
                title: isPartial ? `Partial Library Closure: ${cleanName}` : `Holiday Declared: ${cleanName}`,
                message: fullMessage,
                type: 'announcement',
                createdBy: req.user?.id || null
            }));

            try {
                await Notification.insertMany(notifDocs);
            } catch (notifErr) {
                console.error('Holiday notification insert error:', notifErr.message);
            }
        }

        // Optional Email Broadcast (sent if sendEmail is truthy; default is false)
        const shouldSendEmail = sendEmail === true || sendEmail === 'true' || sendEmail === 1 || sendEmail === '1';
        let emailResult = { sent: false, count: 0, total: 0 };

        if (shouldSendEmail && emailService) {
            // Determine target student list: if admin explicitly selected students, use those; otherwise all active students with email
            let targetList = [];
            if (Array.isArray(selectedStudentIds) && selectedStudentIds.length > 0) {
                const selSet = new Set(selectedStudentIds.map(String));
                targetList = students.filter(s => selSet.has(s._id.toString()));
                if (targetList.length < selectedStudentIds.length) {
                    const missingIds = selectedStudentIds.filter(id => !targetList.some(t => t._id.toString() === String(id)));
                    if (missingIds.length > 0) {
                        const extraUsers = await User.find({ _id: { $in: missingIds } }).select('_id name email role').lean();
                        targetList = [...targetList, ...extraUsers];
                    }
                }
            } else {
                targetList = [...students];
            }

            // If admin requested a copy, append the requesting admin's email
            const adminEmail = req.user?.email || process.env.EMAIL_USER;
            if (sendAdminCopy && adminEmail) {
                const alreadyIncluded = targetList.some(r => r.email && r.email.toLowerCase() === adminEmail.toLowerCase());
                if (!alreadyIncluded) {
                    targetList.push({
                        _id: req.user?._id || 'admin-copy',
                        name: `${req.user?.name || 'Administrator'} (Admin Copy)`,
                        email: adminEmail
                    });
                }
            }

            const emailRecipients = targetList.filter(s => s.email && s.email.includes('@') && s.email.trim());
            console.log(`[Holiday Email] Found ${emailRecipients.length} target recipients for "${cleanName}". Dispatching...`);

            if (emailRecipients.length > 0) {
                try {
                    if (typeof emailService.sendHolidayNoticeEmail === 'function') {
                        const sendOutcome = await emailService.sendHolidayNoticeEmail(emailRecipients, {
                            name: cleanName,
                            dateSummary,
                            daysCount: targetDates.length,
                            isPartial: !!isPartial,
                            startTime12h: isPartial ? formatTime12h(startTime) : '',
                            endTime12h: isPartial ? formatTime12h(endTime) : '',
                            structuredNotice: cleanDesc
                        });
                        emailResult = {
                            sent: !!sendOutcome?.success,
                            count: sendOutcome?.sentCount || 0,
                            failedCount: sendOutcome?.failedCount || 0,
                            total: emailRecipients.length
                        };
                    } else if (typeof emailService.sendAnnouncementEmail === 'function') {
                        const emailSubject = isPartial
                            ? `Notice: Partial Library Closure — ${cleanName}`
                            : `Holiday Notice: ${cleanName}`;
                        const ok = await emailService.sendAnnouncementEmail(emailRecipients, emailSubject, fullMessage);
                        emailResult = {
                            sent: !!ok,
                            count: ok ? emailRecipients.length : 0,
                            total: emailRecipients.length
                        };
                    }
                } catch (broadcastErr) {
                    console.error('[Holiday Email Broadcast Error]:', broadcastErr.message);
                }
            }
        }

        const emailMsg = (sendEmail === true || sendEmail === 'true')
            ? (emailResult.sent
                ? ` Email notice successfully dispatched to ${emailResult.count} recipient(s).`
                : ` (Email notice attempted for ${emailResult.total} student(s) — see server logs).`)
            : '';

        res.status(201).json({
            success: true,
            message: `Holiday "${cleanName}" declared for ${daysLabel} (${timingLabel}). Attendance percentage remains neutral for absent students${totalPreservedPresent > 0 ? ` (${totalPreservedPresent} present record(s) preserved)` : ''}.${emailMsg}`,
            holiday: savedHolidays[0],
            holidays: savedHolidays,
            emailResult
        });
    } catch (error) {
        console.error('declareHoliday error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get all holidays (enriched with IST year for 1 Jan - 31 Dec year-wise lists)
// @route   GET /api/admin/holidays
exports.getHolidays = async (req, res) => {
    try {
        const [rawHolidays, settings] = await Promise.all([
            Holiday.find().sort({ date: -1, createdAt: -1 }).populate('declaredBy', 'name').lean(),
            Settings.findOne().select('showHolidayListOnDashboard').lean()
        ]);

        const toISTStr = (d) => {
            try {
                return new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            } catch (_) {
                const istShifted = new Date(new Date(d).getTime() + 330 * 60 * 1000);
                return istShifted.toISOString().slice(0, 10);
            }
        };

        const currentISTYear = parseInt(toISTStr(new Date()).slice(0, 4), 10) || new Date().getFullYear();
        const yearSet = new Set([currentISTYear - 1, currentISTYear, currentISTYear + 1, currentISTYear + 2]);

        const holidays = rawHolidays.map(h => {
            const dateIST = toISTStr(h.date);
            const computedYear = parseInt(dateIST.slice(0, 4), 10) || h.year || currentISTYear;
            yearSet.add(computedYear);
            return {
                ...h,
                dateIST,
                year: computedYear
            };
        });

        const availableYears = Array.from(yearSet).sort((a, b) => a - b);

        res.status(200).json({
            success: true,
            holidays,
            availableYears,
            showHolidayListOnDashboard: settings ? settings.showHolidayListOnDashboard === true : false
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Delete a holiday — removes holiday record and reverts neutral holiday attendance records
//          (Preserves any student record where the student actually attended and marked present)
// @route   DELETE /api/admin/holidays/:id
exports.deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).json({ success: false, message: 'Holiday not found' });
        }

        const deleteBatch = req.query.deleteBatch === 'true' && holiday.batchId;
        let holidaysToRemove = [holiday];

        if (deleteBatch) {
            holidaysToRemove = await Holiday.find({ batchId: holiday.batchId });
        }

        let revertedCount = 0;
        for (const h of holidaysToRemove) {
            const deleteResult = await Attendance.deleteMany({
                date: h.date,
                status: 'holiday',
                entryTime: null
            });
            revertedCount += deleteResult.deletedCount || 0;
            await h.deleteOne();
        }

        res.status(200).json({
            success: true,
            message: deleteBatch
                ? `Holiday batch "${holiday.name}" (${holidaysToRemove.length} days) removed. ${revertedCount} holiday records cleared.`
                : `Holiday "${holiday.name}" removed. ${revertedCount} holiday records cleared.`
        });
    } catch (error) {
        console.error('deleteHoliday error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

