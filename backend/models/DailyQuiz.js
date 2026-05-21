const mongoose = require('mongoose');

const dailyQuizSchema = new mongoose.Schema({
    date: {
        type: String, // format YYYY-MM-DD in IST timezone
        required: true
    },
    examCode: {
        type: String,
        required: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: [arr => arr.length === 4, 'Must have exactly 4 options']
        },
        correct: {
            type: Number, // 0-3
            required: true,
            min: 0,
            max: 3
        },
        explanation: {
            type: String,
            default: ''
        },
        subject: {
            type: String,
            default: 'General'
        }
    }]
}, {
    timestamps: true
});

// Ensure a single quiz per date and examCode combination
dailyQuizSchema.index({ date: 1, examCode: 1 }, { unique: true });

module.exports = mongoose.model('DailyQuiz', dailyQuizSchema);
