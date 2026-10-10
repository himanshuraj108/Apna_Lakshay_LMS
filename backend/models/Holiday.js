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
    declaredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

holidaySchema.index({ batchId: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);

