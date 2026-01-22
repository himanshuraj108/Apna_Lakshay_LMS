const mongoose = require('mongoose');

const passwordLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: { // For tracking forgot password attempts even if user ID lookup fails initially, or for easy display
        type: String,
        required: true
    },
    newPassword: {
        type: String, // Storing visible as requested for admin support
        required: true,
        select: false // Only select explicitly for admin view
    },
    source: {
        type: String,
        enum: ['profile_change', 'forgot_reset'],
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
