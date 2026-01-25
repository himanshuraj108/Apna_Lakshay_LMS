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
    libraryName: { type: String, default: 'Library Management System' },
    address: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
