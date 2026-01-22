const User = require('../models/User');

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for ENV Admin Credentials (God Mode)
        const envAdminEmail = process.env.ADMIN_EMAIL;
        const envAdminPassword = process.env.ADMIN_PASSWORD;

        if (envAdminEmail && envAdminPassword && email === envAdminEmail && password === envAdminPassword) {
            // Create a temporary admin user object for the token
            const adminUser = {
                _id: 'env-admin',
                name: 'System Admin',
                email: envAdminEmail,
                role: 'admin',
                profileImage: null,
                createdAt: new Date()
            };

            // Calculate token expiration
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 7); // 7 days

            // We need to construct a token manually since we don't have a mongoose document instance with generateToken method
            // Or better, we can assume a fallback admin user exists or mocking it.
            // However, since generateToken is on the model instance, we can't easily call it without an instance.
            // Let's rely on finding the user in DB *OR* if not found but matches ENV, we upsert/create one?
            // Actually, cleanest way is: if matches ENV, we bypass password check if user exists, OR we ensure user exists.

            // Let's stick to the standard flow but prioritize ENV match for password if the user exists in DB.
        }

        // Check if user exists
        let user = await User.findOne({ email }).select('+password');

        // SPECIAL CASE: If credential matches ENV, but user doesn't exist in DB, likely DB was cleared.
        // We could auto-create the admin here?
        if (!user &&
            process.env.ADMIN_EMAIL &&
            process.env.ADMIN_PASSWORD &&
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            user = await User.create({
                name: 'System Admin',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD, // This will be hashed by pre-save hook
                role: 'admin',
                isActive: true
            });
            // Re-fetch to be sure we have what we need, though create returns it.
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact admin.'
            });
        }

        // Check password
        // If it matches ENV admin, we allow it regardless of DB password (feature: easy reset via env)
        let isMatch = false;
        if (process.env.ADMIN_EMAIL &&
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD) {
            isMatch = true;
        } else {
            isMatch = await user.comparePassword(password);
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = user.generateToken();

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with that email'
            });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Save OTP to user (expires in 10 mins)
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // In a real app, send email here. For demo/mvp, send in response or console.
        console.log(`OTP for ${email}: ${otp}`);

        res.status(200).json({
            success: true,
            message: 'OTP sent to email (Check Console/Network for demo)',
            debug_otp: otp // Included for ease of testing per user flow
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        // Find user and verify OTP again to be safe
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update password
        user.password = password;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        await user.save();

        // Log to PasswordLog for Admin Visibility
        const PasswordLog = require('../models/PasswordLog');
        await PasswordLog.create({
            user: user._id,
            email: user.email,
            newPassword: password, // Storing purely for Admin Reference per request
            source: 'forgot_reset'
        });

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
