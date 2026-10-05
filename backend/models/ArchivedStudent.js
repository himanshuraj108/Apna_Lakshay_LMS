const mongoose = require('mongoose');

const archivedStudentSchema = new mongoose.Schema({
    originalId: {
        type: mongoose.Schema.Types.ObjectId, // Keep reference if needed, though broken
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    guardianName: {
        type: String,
        default: ''
    },
    guardianPhone: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },

    // Snapshots of data
    fees: [{
        amount: Number,
        month: Number,
        year: Number,
        status: String,
        paidDate: Date,
        dueDate: Date
    }],

    attendance: [{
        date: Date,
        status: String
    }],

    requests: [{
        type: { type: String },
        status: String,
        createdAt: Date,
        adminResponse: String
    }],

    // Metadata
    joinedAt: Date,
    deletedAt: {
        type: Date,
        default: Date.now
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ArchivedStudent', archivedStudentSchema);
