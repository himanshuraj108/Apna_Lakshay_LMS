/**
 * coinService.js
 * Shared utility for awarding and spending Lakshay Coins.
 * All coin operations go through here to ensure ledger integrity.
 */

const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const Settings = require('../models/Settings');

// ─────────────────────────────────────────────────────────
// getSettings  — cached per-request helper
// ─────────────────────────────────────────────────────────
let _settingsCache = null;
let _cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getRewardSettings() {
    const now = Date.now();
    if (_settingsCache && now - _cacheTime < CACHE_TTL) return _settingsCache;
    const s = await Settings.findOne().lean();
    _settingsCache = s;
    _cacheTime = now;
    return s;
}

// ─────────────────────────────────────────────────────────
// awardCoins  — earn coins (referral, quiz, streak, etc.)
// ─────────────────────────────────────────────────────────
async function awardCoins(studentId, { activity, coins, description, relatedId }) {
    const settings = await getRewardSettings();
    if (!settings?.rewards?.enabled) return null;

    const student = await User.findById(studentId);
    if (!student) return null;

    // Cap at maxBalance
    const maxBalance = settings.rewards.maxBalance ?? 5000;
    const room = Math.max(0, maxBalance - student.coinBalance);
    const actualCoins = Math.min(coins, room);
    if (actualCoins <= 0) return null;

    // Update wallet
    student.coinBalance += actualCoins;
    student.totalCoinsEarned += actualCoins;

    // Reset / push expiry forward on activity
    if (settings.rewards.coinExpiry > 0) {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + settings.rewards.coinExpiry);
        student.coinExpiresAt = expiry;
    }

    await student.save({ validateBeforeSave: false });

    // Write ledger
    const txn = await CoinTransaction.create({
        student: studentId,
        type: 'earn',
        activity,
        coins: actualCoins,
        balanceAfter: student.coinBalance,
        description,
        relatedId: relatedId || null
    });

    return txn;
}

// ─────────────────────────────────────────────────────────
// spendCoins  — deduct coins (redeem / fee discount)
// ─────────────────────────────────────────────────────────
async function spendCoins(studentId, { activity, coins, description, relatedId }) {
    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');
    if (student.coinBalance < coins) throw new Error('Insufficient coins');

    student.coinBalance -= coins;
    student.totalCoinsSpent += coins;
    await student.save({ validateBeforeSave: false });

    const txn = await CoinTransaction.create({
        student: studentId,
        type: 'spend',
        activity,
        coins: -coins,
        balanceAfter: student.coinBalance,
        description,
        relatedId: relatedId || null
    });

    return txn;
}

// ─────────────────────────────────────────────────────────
// adminCredit / adminDebit
// ─────────────────────────────────────────────────────────
async function adminCredit(studentId, { coins, description, adminNote, adminId }) {
    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');

    student.coinBalance += coins;
    student.totalCoinsEarned += coins;
    await student.save({ validateBeforeSave: false });

    return CoinTransaction.create({
        student: studentId,
        type: 'admin_credit',
        activity: 'manual',
        coins,
        balanceAfter: student.coinBalance,
        description,
        relatedId: adminId || null,
        adminNote: adminNote || ''
    });
}

async function adminDebit(studentId, { coins, description, adminNote, adminId }) {
    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');
    if (student.coinBalance < coins) throw new Error('Insufficient coins');

    student.coinBalance -= coins;
    student.totalCoinsSpent += coins;
    await student.save({ validateBeforeSave: false });

    return CoinTransaction.create({
        student: studentId,
        type: 'admin_debit',
        activity: 'manual',
        coins: -coins,
        balanceAfter: student.coinBalance,
        description,
        relatedId: adminId || null,
        adminNote: adminNote || ''
    });
}

// ─────────────────────────────────────────────────────────
// generateReferralCode  — unique, human-readable
// ─────────────────────────────────────────────────────────
async function generateReferralCode(student) {
    if (student.referralCode) return student.referralCode;

    const nameSlug = (student.name || 'STU').replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const code = `AL-${nameSlug}${suffix}`;

    // Ensure uniqueness
    const existing = await User.findOne({ referralCode: code });
    if (existing) {
        // retry with different suffix
        return generateReferralCode(student);
    }

    student.referralCode = code;
    await student.save({ validateBeforeSave: false });
    return code;
}

module.exports = {
    awardCoins,
    spendCoins,
    adminCredit,
    adminDebit,
    getRewardSettings,
    generateReferralCode
};
