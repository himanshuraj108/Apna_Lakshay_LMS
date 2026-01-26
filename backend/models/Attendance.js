const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        required: true
    },
    entryTime: {
        type: String,
        default: null
    },
    exitTime: {
        type: String,
        default: null
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    notes: {
        type: String,
        default: null
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lateEntry: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure one record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Calculate duration before saving
attendanceSchema.pre('save', function (next) {
    if (this.entryTime && this.exitTime) {
        const [entryHour, entryMin] = this.entryTime.split(':').map(Number);
        const [exitHour, exitMin] = this.exitTime.split(':').map(Number);

        const entryMinutes = entryHour * 60 + entryMin;
        let exitMinutes = exitHour * 60 + exitMin;

        // Handle overnight (e.g. 23:00 to 01:00)
        if (exitMinutes < entryMinutes) {
            exitMinutes += 24 * 60;
        }

        this.duration = exitMinutes - entryMinutes;
        this.isActive = false;
    } else if (this.entryTime && !this.exitTime) {
        this.isActive = true;
    }

    // Check if late entry (after 9:30 AM)
    if (this.entryTime) {
        const [hour, min] = this.entryTime.split(':').map(Number);
        const entryMinutes = hour * 60 + min;
        const lateThreshold = 9 * 60 + 30; // 9:30 AM
        this.lateEntry = entryMinutes > lateThreshold;
    }

    next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
