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
        default: null   // optional — null for kiosk/self-scan, set for admin-marked
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lateEntry: {
        type: Boolean,
        default: false
    },
    distanceMeters: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// ==========================================
// PERFORMANCE INDEXES
// ==========================================

// Compound index to ensure one record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Index on student for student dashboard attendance queries
attendanceSchema.index({ student: 1 });

// Index on date for admin analytics queries (attendance by date range)
attendanceSchema.index({ date: 1 });

// Index on status for filtering present/absent records
attendanceSchema.index({ status: 1 });

// Compound index for admin dashboard (filter by date and status)
attendanceSchema.index({ date: 1, status: 1 });

// Index on isActive for finding currently checked-in students
attendanceSchema.index({ isActive: 1 });


// Calculate duration before saving
attendanceSchema.pre('save', function (next) {
    // Only recalculate duration if it's not already set correctly (e.g. by controller for complex dates)
    if (this.entryTime && this.exitTime && (!this.duration || this.isModified('entryTime') || this.isModified('exitTime'))) {
        const [entryHour, entryMin] = this.entryTime.split(':').map(Number);
        const [exitHour, exitMin] = this.exitTime.split(':').map(Number);

        const entryMinutes = entryHour * 60 + entryMin;
        let exitMinutes = exitHour * 60 + exitMin;

        // Handle overnight (e.g. 23:00 to 01:00)
        // Only if simple calc results in negative, we assume it's next day.
        // But Controller logic is preferred for absolute date diffs.
        if (exitMinutes < entryMinutes) {
            exitMinutes += 24 * 60;
        }

        // Only set if we haven't manually set a "real" diff that might be > 24h
        if (!this.duration || this.duration === 0) {
            this.duration = exitMinutes - entryMinutes;
        }
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
