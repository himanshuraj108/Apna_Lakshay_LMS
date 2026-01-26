const mongoose = require('mongoose');

const groupInvitationSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
groupInvitationSchema.index({ invitedUser: 1, status: 1 });
groupInvitationSchema.index({ group: 1, invitedUser: 1 });

module.exports = mongoose.model('GroupInvitation', groupInvitationSchema);
