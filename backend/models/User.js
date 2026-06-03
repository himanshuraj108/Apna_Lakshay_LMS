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
        unique: true,
        sparse: true,
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
        default: '/uploads/avatars/avatar1.svg'
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    mockTestCredits: {
        type: Number,
        default: 2
    },
    bonusMockTestCredits: {
        type: Number,
        default: 0
    },
    examTarget: {
        type: String,
        enum: [
            'ssc_cgl', 'ssc_chsl', 'ssc_gd', 'ssc_mts', 'ssc_cpo', 
            'upsc_cse', 'upsc_cds', 
            'ibps_po', 'ibps_clerk', 'sbi_po', 'sbi_clerk', 
            'rrb_ntpc', 'jee_main', 'neet_ug', 'generic',
            'class_6', 'class_7', 'class_8', 'class_9', 'class_10', 'class_11', 'class_12'
        ],
        default: 'generic'
    },
    mockTestCreditsResetDate: {
        type: String,
        default: null
    },
    doubtCredits: {
        type: Number,
        default: 10
    },
    doubtCreditsResetDate: {
        type: String,
        default: null
    },
    creditMode: {
        type: String,
        enum: ['auto', 'manual'],
        default: 'auto'
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
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    lastActive: {
        type: Date,
        default: null
    },
    // ── Referral & Coin Wallet ──────────────────────────────────────────
    referralCode: {
        type: String,
        unique: true,
        sparse: true   // auto-generated on first use
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    coinBalance: {
        type: Number,
        default: 0
    },
    coinExpiresAt: {
        type: Date,
        default: null
    },
    totalCoinsEarned: {
        type: Number,
        default: 0
    },
    totalCoinsSpent: {
        type: Number,
        default: 0
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

// Assign deterministic stable default avatar out of 10 for students matching their gender preference
userSchema.pre('save', function (next) {
    if (this.role === 'student' && (!this.profileImage || this.profileImage.startsWith('/uploads/avatars/'))) {
        const str = String(this._id || '');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i);
        }
        const index = (hash % 10) + 1;
        const gender = this.gender || 'male';
        if (gender === 'female') {
            this.profileImage = `/uploads/avatars/avatar_female${index}.svg`;
        } else if (gender === 'other') {
            if (hash % 2 === 0) {
                this.profileImage = `/uploads/avatars/avatar_female${index}.svg`;
            } else {
                this.profileImage = `/uploads/avatars/avatar_male${index}.svg`;
            }
        } else {
            this.profileImage = `/uploads/avatars/avatar_male${index}.svg`;
        }
    }
    next();
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
