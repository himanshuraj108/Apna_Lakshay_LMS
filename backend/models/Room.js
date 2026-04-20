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
    layout: {
        type: String,
        enum: ['grid'],
        default: 'grid'
    },
    dimensions: {
        width: { type: Number, default: 4 },
        height: { type: Number, default: 4 }
    },
    doorPosition: {
        type: String,
        enum: ['north', 'south', 'east', 'west'],
        default: 'south'
    },
    hasAc: {
        type: Boolean,
        default: false
    },
    acPosition: {
        type: String,
        enum: ['north', 'south', 'east', 'west'],
        default: 'north'
    },
    hasFan: {
        type: Boolean,
        default: false
    },
    seats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
