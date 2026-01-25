const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        minlength: [10, 'Mobile number must be 10 digits'],
        minlength: [10, 'Mobile number must be 10 digits'],
        maxlength: [10, 'Mobile number must be 10 digits']
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    seatAssignedAt: {
        type: Date
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        default: 'student'
    },
    guardianPhone: {
        type: String,
        trim: true
    },
    registrationSource: {
        type: String,
        enum: ['admin', 'self'],
        default: 'admin'
    },
    profileImage: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    systemMode: {
        type: String,
        enum: ['custom', 'default'],
        default: 'custom' // Always use custom mode
    },
    seat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        default: null
    },
    // For Forgot Password
    resetPasswordOTP: {
        type: String,
        select: false
    },
    resetPasswordOTPExpire: {
        type: Date,
        select: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

module.exports = mongoose.model('User', userSchema);
