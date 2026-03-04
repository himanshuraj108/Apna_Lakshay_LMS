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
    declaredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
