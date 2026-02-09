const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        trim: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    floor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        required: true
    },
    isOccupied: {
        type: Boolean,
        default: false
    },
    // New structure for dynamic assignments
    assignments: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        shift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shift',
            default: null // null implies legacy 'day'/'night' or special handling
        },
        legacyShift: { // For backward compatibility or 'full' override
            type: String,
            enum: ['day', 'night', 'full', null],
            default: null
        },
        type: {
            type: String,
            enum: ['specific', 'full_day'],
            default: 'specific'
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
            default: 'active'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        price: {
            type: Number,
            default: 0
        }
    }],
    // Position on room wall
    position: {
        wall: {
            type: String,
            enum: ['north', 'south', 'east', 'west'],
            default: null
        },
        index: {
            type: Number,
            default: null
        }
    },
    // Base prices for each shift
    basePrices: {
        day: { type: Number, default: 800 },
        night: { type: Number, default: 800 },
        full: { type: Number, default: 1200 }
    },
    // Dynamic pricing override for new shifts (Map of ShiftID -> Price)
    shiftPrices: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Index on floor for getFloors queries
seatSchema.index({ floor: 1 });

// Index on room for room-level queries
seatSchema.index({ room: 1 });

// Index on isOccupied for filtering available seats
seatSchema.index({ isOccupied: 1 });

// Compound index for getFloors optimization (filter by floor, room, occupancy)
seatSchema.index({ floor: 1, room: 1, isOccupied: 1 });

// Index on assignments.student for reverse lookup (find seat by student)
seatSchema.index({ 'assignments.student': 1 });

// Virtual to populate assignments
seatSchema.virtual('activeAssignments').get(function () {
    return this.assignments ? this.assignments.filter(a => a.status === 'active') : [];
});

// Virtual to check if fully occupied (blocked for everyone)
seatSchema.virtual('isFullyBlocked').get(function () {
    const active = this.assignments ? this.assignments.filter(a => a.status === 'active') : [];
    return active.some(a => a.type === 'full_day' || a.legacyShift === 'full');
});

seatSchema.set('toJSON', { virtuals: true });
seatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Seat', seatSchema);
