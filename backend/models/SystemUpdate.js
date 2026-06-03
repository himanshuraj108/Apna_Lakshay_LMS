const mongoose = require('mongoose');

const systemUpdateSchema = new mongoose.Schema({
    tickerEn: {
        type: String,
        required: true,
        trim: true
    },
    tickerHi: {
        type: String,
        required: true,
        trim: true
    },
    titleEn: {
        type: String,
        required: true,
        trim: true
    },
    titleHi: {
        type: String,
        required: true,
        trim: true
    },
    contentEn: {
        type: String,
        required: true
    },
    contentHi: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemUpdate', systemUpdateSchema);
