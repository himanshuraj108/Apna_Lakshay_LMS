const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'rewarded'],
        default: 'pending'
    },
    coinsAwarded: {
        type: Number,
        default: 0
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    triggerEvent: {
        type: String,
        enum: ['admission', 'first_payment'],
        default: 'admission'
    },
    rejectionReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

referralSchema.index({ referrer: 1 });
referralSchema.index({ referee: 1 }, { unique: true }); // one referral per new student
referralSchema.index({ status: 1 });
referralSchema.index({ code: 1 });

module.exports = mongoose.model('Referral', referralSchema);
