const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['earn', 'spend', 'admin_credit', 'admin_debit', 'expired'],
        required: true
    },
    activity: {
        type: String,
        enum: [
            'referral', 'daily_quiz', 'streak', 'attendance', 'mock_test',
            'ai_tool', 'fee_discount', 'mock_test_credit', 'doubt_credit',
            'study_planner', 'note_summarizer', 'manual', 'expiry'
        ],
        required: true
    },
    coins: {
        type: Number,
        required: true  // positive = earned, negative = spent/deducted
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    relatedId: {
        type: mongoose.Schema.Types.Mixed, // ObjectId for fee, referral, etc.
        default: null
    },
    adminNote: {
        type: String,
        default: ''  // only for manual admin credits/debits
    }
}, {
    timestamps: true
});

coinTransactionSchema.index({ student: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1 });
coinTransactionSchema.index({ activity: 1 });
coinTransactionSchema.index({ student: 1, type: 1 });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
