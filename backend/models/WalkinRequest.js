const mongoose = require('mongoose');

const walkinRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
    },
    walkinSlot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalkinSlot',
        default: null
    },
    date: {
        type: String, // 'YYYY-MM-DD'
        required: true
    },
    startTime: {
        type: String, // 'HH:MM'
        required: true
    },
    endTime: {
        type: String, // 'HH:MM'
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    feeCharged: {
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
    checkedInAt: {
        type: Date,
        default: null
    },
    checkedOutAt: {
        type: Date,
        default: null
    },
    note: {
        type: String,
        default: ''
    },
    rejectionReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

walkinRequestSchema.index({ student: 1, date: 1 });
walkinRequestSchema.index({ seat: 1, date: 1, status: 1 });
walkinRequestSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('WalkinRequest', walkinRequestSchema);
