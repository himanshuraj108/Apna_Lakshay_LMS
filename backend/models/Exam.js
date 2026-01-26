const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    subject: {
        type: String,
        default: 'General'
    },
    color: {
        type: String,
        default: '#3B82F6' // Default Blue
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', examSchema);
