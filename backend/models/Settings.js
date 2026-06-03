const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    shiftMode: {
        type: String,
        enum: ['default', 'custom'],
        default: 'default'
    },
    activeModes: {
        default: { type: Boolean, default: true },
        custom: { type: Boolean, default: false }
    },
    systemStatus: {
        type: String,
        enum: ['active', 'maintenance'],
        default: 'active'
    },
    locationAttendance: {
        type: Boolean,
        default: true
    },
    onlinePaymentEnabled: {
        type: Boolean,
        default: true
    },
    showWhatsAppGroup: {
        type: Boolean,
        default: true
    },
    showAITools: {
        type: Boolean,
        default: true
    },
    pinAttendanceEnabled: {
        type: Boolean,
        default: false
    },
    attendancePin: {
        type: String,
        default: ''
    },
    timeRestrictionEnabled: {
        type: Boolean,
        default: true
    },
    loginAttendanceEnabled: {
        type: Boolean,
        default: false
    },
    libraryName: { type: String, default: 'Library Management System' },
    address: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    // ── Referral Program ────────────────────────────────────────────────
    referral: {
        enabled:          { type: Boolean, default: false },
        coinsPerReferral: { type: Number,  default: 500 },
        triggerOn:        { type: String,  enum: ['admission', 'first_payment'], default: 'admission' },
        maxReferrals:     { type: Number,  default: 10 },
        minTenureMonths:  { type: Number,  default: 0 },
        autoApprove:      { type: Boolean, default: true }
    },
    // ── Rewards / Coin Wallet ───────────────────────────────────────────
    rewards: {
        enabled:           { type: Boolean, default: true },
        coinExpiry:        { type: Number,  default: 6 },       // months of inactivity
        maxBalance:        { type: Number,  default: 5000 },
        maxRedeemPerMonth: { type: Number,  default: 1000 },
        // Earn rates (coins per activity)
        earnRates: {
            referral:   { type: Number, default: 500 },
            dailyQuiz:  { type: Number, default: 10 },
            streak7day: { type: Number, default: 50 },
            attendance: { type: Number, default: 5 },
            mockTest:   { type: Number, default: 20 },
            aiTool:     { type: Number, default: 5 }
        },
        // Toggles per earn activity
        earnEnabled: {
            referral:   { type: Boolean, default: true },
            dailyQuiz:  { type: Boolean, default: true },
            streak7day: { type: Boolean, default: true },
            attendance: { type: Boolean, default: false },
            mockTest:   { type: Boolean, default: true },
            aiTool:     { type: Boolean, default: true }
        },
        // Redeem rates (coins required per category)
        redeemRates: {
            feeDiscount:      { type: Number, default: 100 },  // 100 coins = Rs.10 off
            mockTestCredit:   { type: Number, default: 200 },  // 200 coins = 1 extra test
            doubtCredit:      { type: Number, default: 50 },   // 50 coins = 1 session
            studyPlanner:     { type: Number, default: 30 },
            noteSummarizer:   { type: Number, default: 30 },
            aiGeneral:        { type: Number, default: 30 }
        },
        // Toggles per redeem category
        redeemEnabled: {
            feeDiscount:    { type: Boolean, default: true },
            mockTestCredit: { type: Boolean, default: true },
            doubtCredit:    { type: Boolean, default: true },
            studyPlanner:   { type: Boolean, default: false },
            noteSummarizer: { type: Boolean, default: false },
            aiGeneral:      { type: Boolean, default: false }
        }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
