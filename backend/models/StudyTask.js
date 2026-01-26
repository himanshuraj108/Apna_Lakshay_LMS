const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    category: {
        type: String,
        default: 'General'
    },
    tags: [{
        type: String
    }],
    dueDate: {
        type: Date
    },
    estimatedTime: {
        type: Number, // in minutes
        default: 30
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    },
    attachments: [{
        type: String
    }],
    pomodoroSessions: {
        type: Number,
        default: 0
    },
    totalFocusTime: {
        type: Number, // in minutes
        default: 0
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrencePattern: {
        type: String, // 'daily', 'weekly', 'monthly'
        enum: ['daily', 'weekly', 'monthly', null],
        default: null
    },
    xpAwarded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
studyTaskSchema.index({ user: 1, completed: 1 });
studyTaskSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);
