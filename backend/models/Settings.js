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
    locationAttendance: {
        type: Boolean,
        default: true
    },
    onlinePaymentEnabled: {
        type: Boolean,
        default: true
    },
    pinAttendanceEnabled: {
        type: Boolean,
        default: false
    },
    attendancePin: {
        type: String,
        default: ''
    },
    timeRestrictionEnabled: {
        type: Boolean,
        default: true
    },
    loginAttendanceEnabled: {
        type: Boolean,
        default: false
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
