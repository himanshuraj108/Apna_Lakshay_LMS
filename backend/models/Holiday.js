const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    isPartial: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: String,
        default: null
    },
    endTime: {
        type: String,
        default: null
    },
    batchId: {
        type: String,
        default: null
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    isTentative: {
        type: Boolean,
        default: false
    },
    year: {
        type: Number,
        default: null
    },
    declaredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

holidaySchema.index({ batchId: 1 });
holidaySchema.index({ year: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);

