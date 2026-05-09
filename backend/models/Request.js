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
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    ratingFeedback: {
        type: String,
        default: null
    },
    isRatingDismissed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Index on student for student dashboard queries (my requests)
requestSchema.index({ student: 1 });

// Index on status for filtering pending/approved requests
requestSchema.index({ status: 1 });

// Index on type for filtering by request type
requestSchema.index({ type: 1 });

// Compound index for admin dashboard (filter pending requests)
requestSchema.index({ status: 1, createdAt: -1 });

// Compound index for student request history (filter by student and status)
requestSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
