const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const Fee = require('../models/Fee');

// ─── Default card definitions ───────────────────────────────────────────────
const DEFAULT_QUICK_ACTIONS = [
    { id: 'id-card',        label: 'ID Card',        visible: true, isNew: false, order: 0 },
    { id: 'planner',        label: 'Planner',        visible: true, isNew: false, order: 1 },
    { id: 'discussion',     label: 'Discussion',     visible: true, isNew: false, order: 2 },
    { id: 'newspaper',      label: 'Newspaper',      visible: true, isNew: false, order: 3 },
    { id: 'current-affairs',label: 'Current Affairs',visible: true, isNew: false, order: 4 },
    { id: 'exam-alerts',    label: 'Exam Alerts',    visible: true, isNew: false, order: 5 },
    { id: 'my-report',      label: 'My Report',      visible: true, isNew: false, order: 6 },
    { id: 'ask-ai',         label: 'Ask AI',         visible: true, isNew: false, order: 7 },
    { id: 'support',        label: 'Support',        visible: true, isNew: false, order: 8 },
];

const DEFAULT_LEARNING = [
    { id: 'books',          label: 'Books',          visible: true, isNew: false, order: 0 },
    { id: 'notes',          label: 'Notes',          visible: true, isNew: false, order: 1 },
    { id: 'mock-test',      label: 'AI Mock Test',   visible: true, isNew: true,  order: 2 },
];

const DEFAULT_AI_CREDIT_CONFIG = { divisor: 10, defaultCredits: 10 };

// ─── GET card config ─────────────────────────────────────────────────────────
const getCardConfig = async (req, res) => {
    try {
        const [qaSetting, learnSetting] = await Promise.all([
            SystemSetting.findOne({ key: 'cardConfig_quickActions' }),
            SystemSetting.findOne({ key: 'cardConfig_learning' }),
        ]);
        res.json({
            success: true,
            quickActions: qaSetting?.value || DEFAULT_QUICK_ACTIONS,
            learning:     learnSetting?.value || DEFAULT_LEARNING,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT card config ─────────────────────────────────────────────────────────
const updateCardConfig = async (req, res) => {
    try {
        const { section, cards } = req.body; // section: 'quickActions' | 'learning'
        if (!section || !Array.isArray(cards)) return res.status(400).json({ success: false, message: 'Invalid payload' });
        const key = section === 'quickActions' ? 'cardConfig_quickActions' : 'cardConfig_learning';
        await SystemSetting.findOneAndUpdate({ key }, { key, value: cards }, { upsert: true, new: true });
        res.json({ success: true, message: 'Card config updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET AI credit config (global divisor) ───────────────────────────────────
const getAiCreditConfig = async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ key: 'aiCreditConfig' });
        res.json({ success: true, config: setting?.value || DEFAULT_AI_CREDIT_CONFIG });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PUT AI credit config (update divisor) ────────────────────────────────────
const updateAiCreditConfig = async (req, res) => {
    try {
        const { divisor, defaultCredits } = req.body;
        const value = {
            divisor: divisor != null ? Number(divisor) : DEFAULT_AI_CREDIT_CONFIG.divisor,
            defaultCredits: defaultCredits != null ? Number(defaultCredits) : DEFAULT_AI_CREDIT_CONFIG.defaultCredits
        };
        await SystemSetting.findOneAndUpdate({ key: 'aiCreditConfig' }, { key: 'aiCreditConfig', value }, { upsert: true, new: true });
        res.json({ success: true, config: value });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET students with AI credits ────────────────────────────────────────────
const getStudentsWithAiCredits = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('name studentId email doubtCredits seat')
            .populate('seat', 'seatNumber negotiatedPrice')
            .lean();

        const setting = await SystemSetting.findOne({ key: 'aiCreditConfig' });
        const { divisor = 10 } = setting?.value || {};

        const data = students.map(s => ({
            _id: s._id,
            name: s.name,
            studentId: s.studentId,
            email: s.email,
            doubtCredits: s.doubtCredits ?? 10,
            creditMode: s.creditMode || 'auto',
            negotiatedFee: s.seat?.negotiatedPrice || 0,
            suggestedCredits: s.seat?.negotiatedPrice ? Math.round(s.seat.negotiatedPrice / divisor) : 10,
        }));
        res.json({ success: true, students: data, divisor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PATCH student AI credits ────────────────────────────────────────────────
const updateStudentAiCredits = async (req, res) => {
    try {
        const { id } = req.params;
        const { doubtCredits, creditMode } = req.body;
        const update = {};
        if (doubtCredits != null && !isNaN(doubtCredits)) update.doubtCredits = Number(doubtCredits);
        if (creditMode === 'auto' || creditMode === 'manual') update.creditMode = creditMode;
        if (Object.keys(update).length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
        const student = await User.findByIdAndUpdate(id, update, { new: true }).select('name doubtCredits creditMode');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        res.json({ success: true, student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── PATCH bulk apply fee/divisor formula to all students ────────────────────
const applyFormulaToAll = async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ key: 'aiCreditConfig' });
        const { divisor = 10, defaultCredits = 10 } = setting?.value || {};

        const students = await User.find({ role: 'student' }).populate('seat', 'negotiatedPrice');
        let updated = 0;
        for (const s of students) {
            // Skip manual-mode students — admin set their credits explicitly
            if (s.creditMode === 'manual') continue;
            const credits = s.seat?.negotiatedPrice ? Math.round(s.seat.negotiatedPrice / divisor) : defaultCredits;
            s.doubtCredits = credits;
            await s.save({ validateBeforeSave: false });
            updated++;
        }
        res.json({ success: true, message: `Updated ${updated} students` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getCardConfig, updateCardConfig,
    getAiCreditConfig, updateAiCreditConfig,
    getStudentsWithAiCredits, updateStudentAiCredits, applyFormulaToAll,
};
