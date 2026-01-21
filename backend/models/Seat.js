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
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    shift: {
        type: String,
        enum: ['day', 'night', 'full'],
        default: null
    },
    // Base prices for each shift
    basePrices: {
        day: { type: Number, default: 800 },
        night: { type: Number, default: 800 },
        full: { type: Number, default: 1200 }
    },
    // Negotiated price for the assigned student
    negotiatedPrice: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// Virtual to get the current price based on shift
seatSchema.virtual('currentPrice').get(function () {
    if (this.negotiatedPrice !== null && this.negotiatedPrice !== undefined) {
        return this.negotiatedPrice;
    }
    if (this.shift) {
        return this.basePrices[this.shift];
    }
    return null;
});

seatSchema.set('toJSON', { virtuals: true });
seatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Seat', seatSchema);
