const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role:    { type: String, enum: ['user', 'ai', 'error'], required: true },
    text:    { type: String, required: true },
    subject: { type: String, default: 'general' },
}, { _id: false, timestamps: false });

const DoubtSessionSchema = new mongoose.Schema({
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },          // client-generated uid
    title:     { type: String, default: 'Untitled' },
    lang:      { type: String, default: 'en' },
    pinned:    { type: Boolean, default: false },
    messages:  [MessageSchema],
    lastActive:{ type: Date, default: Date.now },
}, { timestamps: true });

// One session per sessionId per student
DoubtSessionSchema.index({ student: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('DoubtSession', DoubtSessionSchema);
