const mongoose = require('mongoose');

const passwordLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: false,
        default: ''
    },
    newPassword: {
        type: String, // Storing visible as requested for admin support
        required: true
    },
    source: {
        type: String,
        enum: ['profile_change', 'forgot_reset', 'admin_reset', 'admin_bulk_reset'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordLog', passwordLogSchema);
