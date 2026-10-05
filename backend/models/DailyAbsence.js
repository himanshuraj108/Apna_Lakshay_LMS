const mongoose = require('mongoose');

const dailyAbsenceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // 'YYYY-MM-DD' — easy to query for a specific day
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    note: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// One absence record per student per date
dailyAbsenceSchema.index({ student: 1, date: 1 }, { unique: true });
dailyAbsenceSchema.index({ date: 1 });

module.exports = mongoose.model('DailyAbsence', dailyAbsenceSchema);
