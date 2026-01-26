const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['seat', 'shift', 'profile', 'seat_change', 'support'],
        required: true
    },
    currentData: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: {}
    },
    requestedData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    adminResponse: {
        type: String,
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
