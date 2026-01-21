const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    floor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        required: true
    },
    seats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
