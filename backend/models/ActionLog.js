const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'student_created',
            'student_updated',
            'student_deleted_soft',
            'student_deleted_hard',
            'seat_assigned',
            'seat_freed',
            'fee_marked_paid',
            'request_approved',
            'request_rejected',
            'notification_sent',
            'attendance_marked',
            'seat_change_approved',
            'seat_change_rejected',
            'create_shift',
            'update_shift',
            'delete_shift',
            'password_reset',
            'generate_qr'
        ]
    },
    targetModel: {
        type: String,
        enum: ['User', 'Seat', 'Fee', 'Request', 'Notification', 'Attendance'],
        default: null
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    targetName: {
        type: String,
        default: null
    },
    details: {
        type: String,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
actionLogSchema.index({ admin: 1, createdAt: -1 });
actionLogSchema.index({ action: 1, createdAt: -1 });
actionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActionLog', actionLogSchema);
