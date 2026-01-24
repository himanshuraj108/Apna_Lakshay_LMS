const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    shiftMode: {
        type: String,
        enum: ['default', 'custom'],
        default: 'default'
    },
    activeModes: {
        default: { type: Boolean, default: true },
        custom: { type: Boolean, default: false }
    },
    systemStatus: {
        type: String,
        enum: ['active', 'maintenance'],
        default: 'active'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
