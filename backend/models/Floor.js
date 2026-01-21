const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: Number,
        required: true,
        unique: true
    },
    rooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Floor', floorSchema);
