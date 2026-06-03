/**
 * referralController.js
 * Student:  GET my code, GET my referrals
 * Admin:    GET all referrals, approve/reject, validate code
 */

const User = require('../models/User');
const Referral = require('../models/Referral');
const Settings = require('../models/Settings');
const { awardCoins, generateReferralCode, getRewardSettings } = require('../services/coinService');

// ────────────────────────────────────────────────────────────
// STUDENT — get own referral code + stats
// GET /api/student/referral/my-code
// ────────────────────────────────────────────────────────────
exports.getMyReferralCode = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        const settings = await getRewardSettings();

        if (!settings?.referral?.enabled) {
            return res.json({
                success: true,
                enabled: false,
                message: 'Referral program is not active'
            });
        }

        // Generate code on first access
        const code = await generateReferralCode(student);

        // Stats
        const referrals = await Referral.find({ referrer: student._id })
            .populate('referee', 'name mobile studentId createdAt')
            .sort({ createdAt: -1 });

        const totalCoinsFromReferrals = referrals
            .filter(r => r.status === 'rewarded')
            .reduce((sum, r) => sum + r.coinsAwarded, 0);

        res.json({
            success: true,
            enabled: true,
            referralCode: code,
            settings: {
                coinsPerReferral: settings.referral.coinsPerReferral,
                triggerOn: settings.referral.triggerOn,
                maxReferrals: settings.referral.maxReferrals,
                minTenureMonths: settings.referral.minTenureMonths
            },
            stats: {
                totalReferrals: referrals.length,
                rewarded: referrals.filter(r => r.status === 'rewarded').length,
                pending: referrals.filter(r => r.status === 'pending').length,
                totalCoinsEarned: totalCoinsFromReferrals
            },
            referrals: referrals.map(r => ({
                _id: r._id,
                referee: r.referee,
                status: r.status,
                coinsAwarded: r.coinsAwarded,
                createdAt: r.createdAt
            }))
        });
    } catch (err) {
        console.error('getMyReferralCode error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// PUBLIC / ADMIN — validate a referral code
// GET /api/student/referral/validate/:code
// ────────────────────────────────────────────────────────────
exports.validateCode = async (req, res) => {
    try {
        const code = req.params.code?.toUpperCase().trim();
        if (!code) return res.status(400).json({ success: false, message: 'No code provided' });

        const referrer = await User.findOne({ referralCode: code, role: 'student' });
        if (!referrer) return res.status(404).json({ success: false, message: 'Invalid referral code' });

        res.json({
            success: true,
            referrer: { name: referrer.name, studentId: referrer.studentId }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — get all referrals with filters
// GET /api/admin/referrals
// ────────────────────────────────────────────────────────────
exports.getAllReferrals = async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const filter = {};
        if (status && status !== 'all') filter.status = status;

        let referrals = await Referral.find(filter)
            .populate('referrer', 'name studentId mobile')
            .populate('referee', 'name studentId mobile createdAt')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Text search
        if (search) {
            const s = search.toLowerCase();
            referrals = referrals.filter(r =>
                r.referrer?.name?.toLowerCase().includes(s) ||
                r.referee?.name?.toLowerCase().includes(s) ||
                r.code?.toLowerCase().includes(s)
            );
        }

        const total = referrals.length;
        const skip = (Number(page) - 1) * Number(limit);
        const paginated = referrals.slice(skip, skip + Number(limit));

        res.json({ success: true, referrals: paginated, total, page: Number(page) });
    } catch (err) {
        console.error('getAllReferrals error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — approve a pending referral and award coins
// PUT /api/admin/referrals/:id/approve
// ────────────────────────────────────────────────────────────
exports.approveReferral = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id)
            .populate('referrer', 'name coinBalance');
        if (!referral) return res.status(404).json({ success: false, message: 'Referral not found' });
        if (referral.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Referral is already ${referral.status}` });
        }

        const settings = await getRewardSettings();
        const coins = settings?.referral?.coinsPerReferral ?? 500;

        // Award coins
        await awardCoins(referral.referrer._id, {
            activity: 'referral',
            coins,
            description: `Referral approved: ${referral.referee}`,
            relatedId: referral._id
        });

        referral.status = 'rewarded';
        referral.coinsAwarded = coins;
        referral.approvedBy = req.user.id;
        referral.approvedAt = new Date();
        await referral.save();

        res.json({ success: true, message: `${coins} coins awarded to referrer`, referral });
    } catch (err) {
        console.error('approveReferral error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — reject a referral
// PUT /api/admin/referrals/:id/reject
// ────────────────────────────────────────────────────────────
exports.rejectReferral = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id);
        if (!referral) return res.status(404).json({ success: false, message: 'Referral not found' });
        if (referral.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Referral is already ${referral.status}` });
        }

        referral.status = 'rejected';
        referral.rejectionReason = req.body.reason || '';
        referral.approvedBy = req.user.id;
        referral.approvedAt = new Date();
        await referral.save();

        res.json({ success: true, message: 'Referral rejected', referral });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// Internal helper — called from adminController.createStudent
// ────────────────────────────────────────────────────────────
exports.processReferralOnAdmission = async ({ refereeId, referralCode, settings }) => {
    if (!referralCode || !settings?.referral?.enabled) return;

    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase().trim(), role: 'student' });
    if (!referrer) return;

    // Prevent self-referral
    if (referrer._id.toString() === refereeId.toString()) return;

    // Max referral cap
    const existingCount = await Referral.countDocuments({ referrer: referrer._id, status: { $ne: 'rejected' } });
    if (existingCount >= (settings.referral.maxReferrals ?? 10)) return;

    // Already referred?
    const alreadyReferred = await Referral.findOne({ referee: refereeId });
    if (alreadyReferred) return;

    // Create referral record
    const referral = await Referral.create({
        referrer: referrer._id,
        referee: refereeId,
        code: referralCode.toUpperCase().trim(),
        status: 'pending',
        triggerEvent: settings.referral.triggerOn
    });

    // If trigger is 'admission' and autoApprove → award immediately
    if (settings.referral.triggerOn === 'admission' && settings.referral.autoApprove) {
        const coins = settings.referral.coinsPerReferral ?? 500;
        await awardCoins(referrer._id, {
            activity: 'referral',
            coins,
            description: `Referral reward: new student joined`,
            relatedId: referral._id
        });
        referral.status = 'rewarded';
        referral.coinsAwarded = coins;
        referral.approvedAt = new Date();
        await referral.save();
    }
};
