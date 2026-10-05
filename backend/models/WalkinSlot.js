const mongoose = require('mongoose');

const walkinSlotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
        // e.g. 'Morning Slot', 'Afternoon Slot'
    },
    startTime: {
        type: String,
        required: true
        // 'HH:MM' — 24hr format e.g. '11:00'
    },
    endTime: {
        type: String,
        required: true
        // 'HH:MM' — 24hr format e.g. '14:00'
    },
    feePerSession: {
        type: Number,
        default: 0
    },
    // Seats admin has made available for walkin during this slot
    eligibleSeats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('WalkinSlot', walkinSlotSchema);
