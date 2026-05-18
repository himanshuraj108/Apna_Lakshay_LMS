const mongoose = require('mongoose');

const tempSeatAssignmentSchema = new mongoose.Schema({
    // The student who is BORROWING the seat temporarily
    borrowerStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The seat being temporarily borrowed
    seat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
    },
    // The shift window for which this seat is borrowed
    shift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: true
    },
    // The original owner of this seat (the absent student)
    originalOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Admin note describing why this is temporary
    note: {
        type: String,
        trim: true,
        default: ''
    },
    // When this temp assignment starts being valid
    startDate: {
        type: Date,
        default: Date.now
    },
    // When this temp assignment expires (null = indefinite)
    endDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'revoked', 'expired'],
        default: 'active'
    },
    // Who created this assignment
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Index for fast lookups
tempSeatAssignmentSchema.index({ borrowerStudent: 1, status: 1 });
tempSeatAssignmentSchema.index({ seat: 1, shift: 1, status: 1 });

module.exports = mongoose.model('TempSeatAssignment', tempSeatAssignmentSchema);
