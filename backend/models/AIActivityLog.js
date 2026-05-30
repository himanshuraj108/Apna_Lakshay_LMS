const mongoose = require('mongoose');

const aiActivityLogSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    toolName: {
        type: String,
        required: true,
        enum: ['Study Planner', 'Test Analyzer', 'Notes Summarizer', 'News Quiz', 'Task Suggestions', 'Readiness Score']
    },
    details: {
        type: String,
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

aiActivityLogSchema.index({ student: 1, createdAt: -1 });
aiActivityLogSchema.index({ toolName: 1, createdAt: -1 });
aiActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIActivityLog', aiActivityLogSchema);
