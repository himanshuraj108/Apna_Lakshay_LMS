const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['public', 'private', 'group'],
        required: true
    },
    name: {
        type: String,
        required: function () {
            return this.type === 'group' || this.type === 'public';
        }
    },
    description: {
        type: String,
        default: ''
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () {
            return this.type === 'group';
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date
    },
    hiddenFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for faster queries
chatRoomSchema.index({ type: 1, isActive: 1 });
chatRoomSchema.index({ participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
