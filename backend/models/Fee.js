const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'pending', 'overdue', 'partial'],
        default: 'pending'
    },
    partialPaid: {
        type: Number,
        default: 0
    },
    outstanding: {
        type: Number,
        default: 0
    },
    paidDate: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        required: true
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Compound index for unique fees per student per month
feeSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

// Index on student for student dashboard queries
feeSchema.index({ student: 1 });

// Index on status for filtering pending/overdue fees
feeSchema.index({ status: 1 });

// Index on dueDate for overdue fee detection
feeSchema.index({ dueDate: 1 });

// Compound index for admin dashboard fee queries (filter by status and due date)
feeSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Fee', feeSchema);
