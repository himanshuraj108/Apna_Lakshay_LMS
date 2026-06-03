/**
 * walletController.js
 * Student:  wallet balance, transaction history, redeem
 * Admin:    all wallets, single ledger, credit/debit/expire/reset, CSV export
 */

const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const Settings = require('../models/Settings');
const { adminCredit, adminDebit, getRewardSettings, spendCoins } = require('../services/coinService');

// ────────────────────────────────────────────────────────────
// STUDENT — get own wallet info
// GET /api/student/wallet
// ────────────────────────────────────────────────────────────
exports.getMyWallet = async (req, res) => {
    try {
        const student = await User.findById(req.user.id)
            .select('name coinBalance coinExpiresAt totalCoinsEarned totalCoinsSpent');
        const settings = await getRewardSettings();

        // Check expiry
        let expired = false;
        if (student.coinExpiresAt && student.coinExpiresAt < new Date()) {
            expired = true;
            // Zero out expired balance
            if (student.coinBalance > 0) {
                await CoinTransaction.create({
                    student: req.user.id,
                    type: 'expired',
                    activity: 'expiry',
                    coins: -student.coinBalance,
                    balanceAfter: 0,
                    description: 'Coins expired due to inactivity'
                });
                student.coinBalance = 0;
                student.coinExpiresAt = null;
                await student.save({ validateBeforeSave: false });
            }
        }

        res.json({
            success: true,
            wallet: {
                coinBalance: student.coinBalance,
                coinExpiresAt: student.coinExpiresAt,
                totalCoinsEarned: student.totalCoinsEarned,
                totalCoinsSpent: student.totalCoinsSpent,
                expired,
                redeemRates: settings?.rewards?.redeemRates || {},
                redeemEnabled: settings?.rewards?.redeemEnabled || {},
                maxRedeemPerMonth: settings?.rewards?.maxRedeemPerMonth || 1000
            }
        });
    } catch (err) {
        console.error('getMyWallet error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// STUDENT — paginated transaction history
// GET /api/student/wallet/transactions?page=1&limit=20
// ────────────────────────────────────────────────────────────
exports.getMyTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            CoinTransaction.find({ student: req.user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CoinTransaction.countDocuments({ student: req.user.id })
        ]);

        res.json({ success: true, transactions, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// STUDENT — redeem coins
// POST /api/student/wallet/redeem
// body: { type: 'feeDiscount'|'mockTestCredit'|'doubtCredit', coinsToSpend, feeId? }
// ────────────────────────────────────────────────────────────
exports.redeemCoins = async (req, res) => {
    try {
        const { type, coinsToSpend, feeId } = req.body;
        if (!type || !coinsToSpend || coinsToSpend <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid redeem request' });
        }

        const settings = await getRewardSettings();
        if (!settings?.rewards?.enabled) {
            return res.status(403).json({ success: false, message: 'Rewards program is disabled' });
        }
        if (!settings.rewards.redeemEnabled?.[type]) {
            return res.status(403).json({ success: false, message: `Redeeming for ${type} is not enabled` });
        }

        const student = await User.findById(req.user.id);
        if (student.coinBalance < coinsToSpend) {
            return res.status(400).json({ success: false, message: 'Insufficient coins' });
        }

        // Monthly redeem limit
        const startOfMonth = new Date();
        startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
        const monthlySpent = await CoinTransaction.aggregate([
            { $match: { student: student._id, type: 'spend', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: { $abs: '$coins' } } } }
        ]);
        const alreadySpent = monthlySpent[0]?.total || 0;
        const maxMonthly = settings.rewards.maxRedeemPerMonth ?? 1000;
        if (alreadySpent + coinsToSpend > maxMonthly) {
            return res.status(400).json({
                success: false,
                message: `Monthly redeem limit of ${maxMonthly} coins reached`
            });
        }

        // Activity label mapping
        const activityMap = {
            feeDiscount: 'fee_discount',
            mockTestCredit: 'mock_test_credit',
            doubtCredit: 'doubt_credit',
            studyPlanner: 'study_planner',
            noteSummarizer: 'note_summarizer',
            aiGeneral: 'ai_tool'
        };

        const txn = await spendCoins(req.user.id, {
            activity: activityMap[type] || 'manual',
            coins: coinsToSpend,
            description: `Redeemed for ${type}`,
            relatedId: feeId || null
        });

        // If mock test credit, add to user's mock test credits
        if (type === 'mockTestCredit') {
            const rate = settings.rewards.redeemRates?.mockTestCredit ?? 200;
            const creditsGained = Math.floor(coinsToSpend / rate);
            if (creditsGained > 0) {
                await User.findByIdAndUpdate(req.user.id, {
                    $inc: { bonusMockTestCredits: creditsGained }
                });
            }
        }

        // If doubt credit, add to user's doubt credits
        if (type === 'doubtCredit') {
            const rate = settings.rewards.redeemRates?.doubtCredit ?? 50;
            const creditsGained = Math.floor(coinsToSpend / rate);
            if (creditsGained > 0) {
                await User.findByIdAndUpdate(req.user.id, {
                    $inc: { doubtCredits: creditsGained }
                });
            }
        }

        // Compute rupee discount for feeDiscount
        let discountAmount = 0;
        if (type === 'feeDiscount') {
            const rate = settings.rewards.redeemRates?.feeDiscount ?? 100;
            discountAmount = (coinsToSpend / rate) * 10; // 100 coins = Rs.10
        }

        res.json({
            success: true,
            message: 'Coins redeemed successfully',
            transaction: txn,
            discountAmount,
            newBalance: student.coinBalance - coinsToSpend
        });
    } catch (err) {
        console.error('redeemCoins error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — all students wallet summary
// GET /api/admin/wallet
// ────────────────────────────────────────────────────────────
exports.getAllWallets = async (req, res) => {
    try {
        const { page = 1, limit = 30, search } = req.query;
        const filter = { role: 'student' };
        if (search) {
            const r = new RegExp(search, 'i');
            filter.$or = [{ name: r }, { studentId: r }, { mobile: r }];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [students, total] = await Promise.all([
            User.find(filter)
                .select('name studentId mobile coinBalance coinExpiresAt totalCoinsEarned totalCoinsSpent isActive')
                .sort({ coinBalance: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.json({ success: true, wallets: students, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — single student ledger
// GET /api/admin/wallet/:studentId
// ────────────────────────────────────────────────────────────
exports.getStudentLedger = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [student, transactions, total] = await Promise.all([
            User.findById(req.params.studentId)
                .select('name studentId mobile coinBalance coinExpiresAt totalCoinsEarned totalCoinsSpent')
                .lean(),
            CoinTransaction.find({ student: req.params.studentId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            CoinTransaction.countDocuments({ student: req.params.studentId })
        ]);

        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        res.json({ success: true, student, transactions, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — manually credit coins
// POST /api/admin/wallet/:studentId/credit
// ────────────────────────────────────────────────────────────
exports.adminCreditCoins = async (req, res) => {
    try {
        const { coins, description, adminNote } = req.body;
        if (!coins || coins <= 0) return res.status(400).json({ success: false, message: 'Invalid coins amount' });

        const txn = await adminCredit(req.params.studentId, {
            coins: Number(coins),
            description: description || `Admin credit by ${req.user.name || 'Admin'}`,
            adminNote,
            adminId: req.user.id
        });

        const student = await User.findById(req.params.studentId).select('coinBalance');
        res.json({ success: true, message: `${coins} coins added`, transaction: txn, newBalance: student.coinBalance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — manually deduct coins
// POST /api/admin/wallet/:studentId/debit
// ────────────────────────────────────────────────────────────
exports.adminDebitCoins = async (req, res) => {
    try {
        const { coins, description, adminNote } = req.body;
        if (!coins || coins <= 0) return res.status(400).json({ success: false, message: 'Invalid coins amount' });

        const txn = await adminDebit(req.params.studentId, {
            coins: Number(coins),
            description: description || `Admin debit by ${req.user.name || 'Admin'}`,
            adminNote,
            adminId: req.user.id
        });

        const student = await User.findById(req.params.studentId).select('coinBalance');
        res.json({ success: true, message: `${coins} coins deducted`, transaction: txn, newBalance: student.coinBalance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — expire a student's wallet now
// POST /api/admin/wallet/:studentId/expire
// ────────────────────────────────────────────────────────────
exports.adminExpireWallet = async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        if (student.coinBalance > 0) {
            await CoinTransaction.create({
                student: student._id,
                type: 'expired',
                activity: 'expiry',
                coins: -student.coinBalance,
                balanceAfter: 0,
                description: `Wallet manually expired by admin`,
                adminNote: req.body.reason || ''
            });
        }

        student.coinBalance = 0;
        student.coinExpiresAt = null;
        await student.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'Wallet expired and balance zeroed' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — reset wallet to zero
// POST /api/admin/wallet/:studentId/reset
// ────────────────────────────────────────────────────────────
exports.adminResetWallet = async (req, res) => {
    try {
        const student = await User.findById(req.params.studentId);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        if (student.coinBalance > 0) {
            await CoinTransaction.create({
                student: student._id,
                type: 'admin_debit',
                activity: 'manual',
                coins: -student.coinBalance,
                balanceAfter: 0,
                description: 'Wallet reset to zero by admin',
                adminNote: req.body.reason || ''
            });
        }

        student.coinBalance = 0;
        student.totalCoinsEarned = 0;
        student.totalCoinsSpent = 0;
        student.coinExpiresAt = null;
        await student.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'Wallet reset successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ────────────────────────────────────────────────────────────
// ADMIN — export all coin transactions as CSV
// GET /api/admin/wallet/export
// ────────────────────────────────────────────────────────────
exports.exportWalletCSV = async (req, res) => {
    try {
        const transactions = await CoinTransaction.find()
            .populate('student', 'name studentId mobile')
            .sort({ createdAt: -1 })
            .lean();

        const lines = [
            ['Date', 'Student Name', 'Student ID', 'Mobile', 'Type', 'Activity', 'Coins', 'Balance After', 'Description', 'Admin Note'].join(',')
        ];

        for (const t of transactions) {
            lines.push([
                new Date(t.createdAt).toLocaleDateString('en-IN'),
                `"${t.student?.name || ''}"`,
                t.student?.studentId || '',
                t.student?.mobile || '',
                t.type,
                t.activity,
                t.coins,
                t.balanceAfter,
                `"${(t.description || '').replace(/"/g, "'")}"`,
                `"${(t.adminNote || '').replace(/"/g, "'")}"`
            ].join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=wallet_transactions.csv');
        res.send(lines.join('\n'));
    } catch (err) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};
