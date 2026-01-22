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
        required: true
    },
    phoneNumber: String,
    guardianName: String,
    guardianPhone: String,
    address: String,
    profileImage: String, // Path to image (might be deleted from fs, so maybe just keep path or placeholder)

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
