const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    startTime: {
        type: String, // Format: "HH:MM", e.g., "09:00"
        required: true
    },
    endTime: {
        type: String, // Format: "HH:MM", e.g., "15:00"
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Shift', shiftSchema);
