const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyTask'
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    type: {
        type: String,
        enum: ['focus', 'short_break', 'long_break'],
        default: 'focus'
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

pomodoroSessionSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);
