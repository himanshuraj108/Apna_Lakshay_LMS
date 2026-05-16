const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SubAdminSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true },
    pin:         { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    permissions: {
        type: [String],
        default: [],
        // Available permissions:
        // 'attendance'   - can mark/view attendance
        // 'students'     - can view student list
        // 'fees'         - can view fee status
        // 'notifications'- can send notifications
        // 'requests'     - can view/handle seat requests
        // 'vacant_seats' - can view vacant seats
    },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Hash password before save
SubAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password helper
SubAdminSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('SubAdmin', SubAdminSchema);
