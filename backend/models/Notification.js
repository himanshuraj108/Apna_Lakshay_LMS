const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['announcement', 'fee', 'seat', 'request', 'general'],
        default: 'general'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Index on recipient for student notification queries
notificationSchema.index({ recipient: 1 });

// Compound index for unread notification count (most common query)
notificationSchema.index({ recipient: 1, isRead: 1 });

// Index on createdAt for sorting notifications by date (descending)
notificationSchema.index({ createdAt: -1 });

// Compound index for fetching recent unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
