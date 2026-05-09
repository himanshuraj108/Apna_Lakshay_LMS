const mongoose = require('mongoose');

const mockTestAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examCode: {
        type: String,
        required: true
    },
    patternName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['generated', 'completed'],
        default: 'generated'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    // Stored so /generate-more can produce additional questions with same settings
    examConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    completedAt: {
        type: Date
    },
    score: {
        type: Number
    },
    maxScore: {
        type: Number
    },
    percentage: {
        type: Number
    },
    timeTaken: {
        type: Number // in seconds
    },
    isCheating: {
        type: Boolean,
        default: false
    },
    testData: [{
        // Original AI Generated Fields
        id: Number,
        question: String,
        options: [String],
        correct: Number,
        explanation: String,
        sectionId: String,
        sectionName: String,
        
        // Student Response
        selected: Number,
        status: String // 'answered', 'not_visited', 'not_answered', 'marked', 'answered_marked'
    }]
}, { timestamps: true });

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);
