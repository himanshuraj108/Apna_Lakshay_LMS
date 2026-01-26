const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

systemSettingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
