const mongoose = require('mongoose');

const studyStreakSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastActivityDate: {
        type: Date
    },
    totalXP: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    tasksCompleted: {
        type: Number,
        default: 0
    },
    totalFocusTime: {
        type: Number, // in minutes
        default: 0
    },
    achievements: [{
        id: String,
        unlockedAt: Date
    }],
    activityLog: [{
        date: { type: Date, required: true },
        count: { type: Number, default: 1 }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('StudyStreak', studyStreakSchema);
