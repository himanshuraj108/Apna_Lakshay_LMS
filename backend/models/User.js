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
    studentId: {
        type: String,
        unique: true,
        trim: true,
        sparse: true // Allows null/undefined values to exist without uniqueness errors
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
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
    isChatBlocked: {
        type: Boolean,
        default: false
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
    mockTestCredits: {
        type: Number,
        default: 3
    },
    mockTestCreditsResetDate: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    systemMode: {
        type: String,
        enum: ['custom', 'default'],
        default: 'custom' // Always use custom mode
    },
    registrationSource: {
        type: String,
        enum: ['self', 'admin'],
        default: 'admin'
    },
    seat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        default: null
    },
    qrToken: {
        type: String,
        default: () => require('crypto').randomBytes(16).toString('hex'),
        select: false // Keep secret by default
    },
    isChatBlocked: {
        type: Boolean,
        default: false
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

// ==========================================
// PERFORMANCE INDEXES
// ==========================================
// Note: email, studentId, and mobile already have indexes from 'unique: true'

// Index on seat reference for reverse lookups (find user by seat)
userSchema.index({ seat: 1 });

// Compound index for dashboard queries filtering by role and active status
userSchema.index({ role: 1, isActive: 1 });

// Index on qrToken for QR scan lookups (sparse because select: false)
userSchema.index({ qrToken: 1 }, { sparse: true });

// Index on createdAt for sorting (already created by timestamps: true)
// Index on updatedAt for sorting (already created by timestamps: true)

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
