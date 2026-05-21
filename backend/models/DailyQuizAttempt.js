const mongoose = require('mongoose');

const dailyQuizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyQuiz',
        required: true
    },
    date: {
        type: String, // format YYYY-MM-DD in IST timezone
        required: true
    },
    answers: {
        type: [Number], // selected option indices (0-3 or null if skipped)
        required: true
    },
    score: {
        type: Number, // correct count
        required: true
    },
    xpAwarded: {
        type: Number,
        required: true
    },
    completed: {
        type: Boolean,
        default: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure a user can only attempt one daily quiz per date
dailyQuizAttemptSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyQuizAttempt', dailyQuizAttemptSchema);
