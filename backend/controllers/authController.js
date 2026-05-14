const User = require('../models/User');
const Seat = require('../models/Seat');
const Settings = require('../models/Settings');
const { sendOTPEmail } = require('../services/emailService');

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email: rawIdentifier, password } = req.body;
        const identifier = (rawIdentifier || '').trim();

        // Validation
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email/mobile and password'
            });
        }

        // Check for ENV Admin Credentials (God Mode)
        const envAdminEmail = process.env.ADMIN_EMAIL;
        const envAdminPassword = process.env.ADMIN_PASSWORD;

        if (envAdminEmail && envAdminPassword && identifier === envAdminEmail && password === envAdminPassword) {
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

        // Check if user exists by email OR mobile (handling both string and number for mobile)
        const mobileAsNumber = !isNaN(identifier) ? Number(identifier) : null;
        
        let user = await User.findOne({ 
            $or: [
                { email: typeof identifier === 'string' ? identifier.toLowerCase() : identifier }, 
                { mobile: identifier },
                ...(mobileAsNumber !== null ? [{ mobile: mobileAsNumber }] : [])
            ] 
        }).select('+password');

        // SPECIAL CASE: If credential matches ENV, but user doesn't exist in DB, likely DB was cleared.
        // We could auto-create the admin here?
        if (!user &&
            process.env.ADMIN_EMAIL &&
            process.env.ADMIN_PASSWORD &&
            identifier === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            user = await User.create({
                name: 'System Admin',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD, // This will be hashed by pre-save hook
                role: 'admin',
                isActive: true,
                mobile: '0000000000' // Dummy 10-digit number for validation
            });
            // Re-fetch to be sure we have what we need, though create returns it.
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        let isMatch = false;
        if (process.env.ADMIN_EMAIL &&
            identifier === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD) {
            isMatch = true;
        } else {
            isMatch = await user.comparePassword(password);
            
            // EMERGENCY FALLBACK: Check if password was stored as plain text (manually edited in DB)
            if (!isMatch && password === user.password) {
                isMatch = true;
                // Auto-hash it now so it's secure for next time
                user.password = password;
                await user.save({ validateBeforeSave: false });
            }
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Normal login flow continues...

        // Update login status (non-blocking)
        user.isLoggedIn = true;
        user.lastLogin = new Date();
        user.save({ validateBeforeSave: false }).catch(err => console.error('Login tracking update failed:', err.message));

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
                isActive: user.isActive,
                registrationSource: user.registrationSource,
                profileImage: user.profileImage,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);

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
        const user = await User.findById(req.user.id).select('+qrToken');

        // Check and Reset Daily Mock Test Credits (00:00 IST) (non-blocking update)
        const currentDateIST = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
        if (user.mockTestCreditsResetDate !== currentDateIST) {
            user.mockTestCredits = 2;
            user.mockTestCreditsResetDate = currentDateIST;
            user.save({ validateBeforeSave: false }).catch(err => console.error('Credit reset update failed:', err.message));
        }

        let userData = {
            id: user._id,
            qrToken: user.qrToken, // Expose token
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            studentId: user.studentId,
            role: user.role,
            isActive: user.isActive,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            registrationSource: user.registrationSource, // Required for status logic
            address: user.address,
            seat: user.seat,
            seatAssignedAt: user.seatAssignedAt, // Use persistent date from User model
            mockTestCredits: user.mockTestCredits
        };

        try {
            // Find active seat assignment to get updated details
            const seat = await Seat.findOne({
                assignments: { $elemMatch: { student: user._id, status: 'active' } }
            }).populate('assignments.shift').populate('room');

            if (seat) {
                const assignment = seat.assignments.find(a => a.student.toString() === user._id.toString() && a.status === 'active');
                if (assignment) {

                    // Self-healing: If user.seatAssignedAt is missing, update it from assignment
                    if (!user.seatAssignedAt) {
                        userData.seatAssignedAt = assignment.assignedAt;
                        try {
                            await User.findByIdAndUpdate(user._id, { seatAssignedAt: assignment.assignedAt });
                        } catch (err) { console.error('Failed to update seatAssignedAt:', err); }
                    }

                    userData.currentShift = assignment.shift ? assignment.shift._id.toString() : (assignment.legacyShift || 'full');

                    // Add populated shift details for ID Card
                    userData.shift = assignment.shift ? assignment.shift.name : (assignment.legacyShift || 'full');
                    userData.shiftDetails = assignment.shift ? {
                        startTime: assignment.shift.startTime,
                        endTime: assignment.shift.endTime
                    } : null;
                    userData.seatNumber = seat.number; // Explicitly add seat number
                    userData.roomId = seat.room ? seat.room.roomId : null; // Explicitly add room ID

                    // Self-healing: If user.seat is missing/null but we found an active seat, update it
                    if (!user.seat) {
                        userData.seat = seat._id; // Update response immediately
                        try {
                            await User.findByIdAndUpdate(user._id, { seat: seat._id });
                            console.log(`Self-healed missing seat reference for user ${user._id}`);
                        } catch (err) { console.error('Failed to self-heal seat reference:', err); }
                    }
                }
            }
        } catch (seatError) {
            console.error('Error fetching seat for profile:', seatError);
            // Continue without seat date if error
        }

        res.status(200).json({
            success: true,
            user: userData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }

};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    try {
        if (req.user) {
            const SessionUser = require('../models/User');
            await SessionUser.findByIdAndUpdate(req.user.id, {
                isLoggedIn: false,
                lastActive: new Date()
            });
        }
    } catch (error) {
        console.error('Logout tracking error:', error);
    }

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

        // Send OTP via email
        try {
            await sendOTPEmail(user.name, email, otp);
            console.log(`✅ OTP sent to ${email}: ${otp}`);

            res.status(200).json({
                success: true,
                message: 'OTP sent to your email address. Please check your inbox.',
                // Include debug_otp only in development
                ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp })
            });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            // Return OTP in response if email fails (for development/testing)
            res.status(200).json({
                success: true,
                message: 'Email service unavailable. OTP displayed for testing.',
                debug_otp: otp
            });
        }
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
        await user.save({ validateBeforeSave: false });

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
        console.error('❌ Reset Password Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc  Check if phone number belongs to a student (gates QR scanner)
// @route POST /api/auth/check-phone  (public)
exports.checkPhone = async (req, res) => {
    try {
        const { mobile } = req.body;
        const user = await User.findOne({ mobile: mobile?.trim(), role: 'student' });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No student found with this phone number' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Membership expired. Please contact admin.' });
        }

        // Check for seat as well for the fallback login
        const studentWithSeat = await User.findOne({ _id: user._id }).populate('seat');
        const seatNumber = studentWithSeat.seat?.number || null;

        res.status(200).json({ 
            success: true, 
            message: 'Phone verified',
            hasEmail: !!user.email,
            maskedEmail: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null,
            needsSeat: !user.email,
            hasSeat: !!seatNumber
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify Seat Number and auto-login student
// @route   POST /api/auth/verify-seat-login
exports.verifySeatLogin = async (req, res) => {
    try {
        const { mobile, seatNumber } = req.body;
        if (!mobile || !seatNumber) {
            return res.status(400).json({ success: false, message: 'Phone and seat number are required' });
        }

        const user = await User.findOne({ mobile: mobile.trim(), role: 'student' })
            .populate('seat')
            .select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'No student found' });
        }

        if (!user.seat || user.seat.number.toString() !== seatNumber.toString()) {
            return res.status(401).json({ success: false, message: 'Incorrect seat number for this student' });
        }

        // Correct! Log them in
        const PasswordLog = require('../models/PasswordLog');
        const lastLog = await PasswordLog.findOne({ user: user._id }).sort({ createdAt: -1 });
        const plainPassword = lastLog ? lastLog.newPassword : null;

        user.isLoggedIn = true;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = user.generateToken();

        res.status(200).json({
            success: true,
            token,
            password: plainPassword,
            user: {
                _id: user._id, 
                name: user.name, 
                role: user.role, 
                email: user.email, 
                mobile: user.mobile,
                seat: user.seat ? user.seat.number : 'No Seat'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc  Mark attendance via phone number + kiosk QR token (public — no auth needed)
// @route POST /api/auth/kiosk-attendance
exports.markKioskAttendancePublic = async (req, res) => {
    try {
        const { mobile, kioskToken, latitude, longitude } = req.body;
        if (!mobile || !kioskToken) {
            return res.status(400).json({ success: false, message: 'Phone number and kiosk token are required' });
        }

        // --- Geo-Fence Validation ---
        const Settings = require('../models/Settings');
        let settings;
        try {
            settings = await Settings.findOne().select('locationAttendance');
        } catch (err) {
            console.error('[GEO-FENCE KIOSK] Error fetching settings:', err);
        }

        let geoDistance = null;

        if (settings && settings.locationAttendance === false) {
            console.log('[GEO-FENCE KIOSK] Skipped: locationAttendance is disabled in admin settings');
        } else {
            const libLat = parseFloat(process.env.LIBRARY_LAT);
            const libLng = parseFloat(process.env.LIBRARY_LNG);
            const radiusM = parseFloat(process.env.LIBRARY_RADIUS_M) || 100;

            console.log(`[GEO-FENCE KIOSK] Config: LAT=${libLat}, LNG=${libLng}, RADIUS=${radiusM}`);
            console.log(`[GEO-FENCE KIOSK] Received: LAT=${latitude}, LNG=${longitude}`);

            // If coordinates are configured in .env, enforce the check
            if (!isNaN(libLat) && !isNaN(libLng)) {
                if (latitude == null || longitude == null) {
                    console.log('[GEO-FENCE KIOSK] Blocked: No latitude/longitude provided');
                    return res.status(400).json({ success: false, message: 'Location access is required to mark attendance. Please enable location and try again.' });
                }

                // Haversine formula
                const toRad = x => (x * Math.PI) / 180;
                const R = 6371e3; // Earth radius in meters
                const dLat = toRad(libLat - parseFloat(latitude));
                const dLon = toRad(libLng - parseFloat(longitude));
                const lat1Rad = toRad(parseFloat(latitude));
                const lat2Rad = toRad(libLat);

                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                geoDistance = Math.round(R * c);

                if (geoDistance > radiusM) {
                    return res.status(403).json({ success: false, message: `You are too far from the library (${geoDistance}m away). You must be within ${radiusM}m to mark attendance.` });
                }
            }
        }
        // ----------------------------

        // 1. Validate kiosk QR token
        const SystemSetting = require('../models/SystemSetting');
        const setting = await SystemSetting.findOne({ key: 'attendance_qr_token' });
        if (!setting || setting.value !== kioskToken) {
            return res.status(401).json({ success: false, message: 'Invalid QR code. Please scan the correct kiosk QR.' });
        }

        // 2. Find student by mobile
        const student = await User.findOne({ mobile: mobile.trim(), role: 'student' })
            .populate({ path: 'seat', populate: { path: 'room floor assignments.shift' } });

        if (!student) {
            return res.status(404).json({ success: false, message: 'No student found with this phone number' });
        }
        if (!student.isActive) {
            return res.status(403).json({ success: false, message: 'Membership expired. Please contact admin.' });
        }

        // 3. Build seat/shift info
        let seatInfo = 'No Seat', shiftInfo = 'N/A';
        if (student.seat && student.seat.assignments) {
            const asgn = student.seat.assignments.find(a =>
                a.student.toString() === student._id.toString() && a.status === 'active'
            );
            if (asgn) {
                seatInfo = `${student.seat.number}`;
                shiftInfo = asgn.shift?.name || asgn.legacyShift || (asgn.type === 'full_day' ? 'Full Day' : 'N/A');
            }
        }

        // 4. Mark attendance (toggle check-in / check-out)
        const Attendance = require('../models/Attendance');
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = new Date(now); today.setHours(0, 0, 0, 0);

        const existingActive = await Attendance.findOne({ student: student._id, date: today, isActive: true });
        const existingAny = await Attendance.findOne({ student: student._id, date: today });

        let type = 'check-in', record;

        if (existingActive) {
            // Student is currently checked in -> mark checkout
            const [h1, m1] = existingActive.entryTime.split(':').map(Number);
            const [h2, m2] = currentTime.split(':').map(Number);
            existingActive.exitTime = currentTime;
            existingActive.isActive = false;
            existingActive.duration = Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
            await existingActive.save();
            type = 'check-out'; record = existingActive;
        } else if (existingAny && existingAny.status === 'absent') {
            // Student was marked absent by admin, override with present check-in
            existingAny.status = 'present';
            existingAny.entryTime = currentTime;
            existingAny.isActive = true;
            existingAny.markedBy = student._id;
            if (geoDistance !== null) existingAny.distanceMeters = geoDistance;
            await existingAny.save();
        } else if (existingAny) {
            // Student checked in and out already today
            return res.status(400).json({ success: false, message: 'You have already marked your attendance for today.' });
        } else {
            // Initial check-in for the day
            record = await Attendance.create({
                student: student._id, date: today,
                entryTime: currentTime, status: 'present',
                isActive: true, markedBy: student._id,  // student self-marks via kiosk
                distanceMeters: geoDistance !== null ? geoDistance : undefined
            });
        }

        res.status(200).json({
            success: true, type,
            message: type === 'check-in' ? `Welcome, ${student.name}! ✅` : `Goodbye, ${student.name}! 👋`,
            time: currentTime,
            student: {
                _id: student._id, name: student.name,
                email: student.email, mobile: student.mobile,
                profileImage: student.profileImage,
                seat: seatInfo, shift: shiftInfo
            }
        });
    } catch (error) {
        console.error('Public Kiosk Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Send OTP to student's email by phone number (for quick attendance login)
// @route   POST /api/auth/send-otp-phone
exports.sendOtpByPhone = async (req, res) => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const user = await User.findOne({ mobile: mobile.trim(), role: 'student' });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No student found with this phone number' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your membership is inactive. Please contact admin.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        try {
            const { sendOTPEmail } = require('../services/emailService');
            await sendOTPEmail(user.name, user.email, otp);
        } catch (emailErr) {
            console.error('OTP email failed:', emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: `OTP sent to your registered email`,
            email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Masked email for display
            ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Verify OTP and auto-login student (for quick attendance flow)
// @route   POST /api/auth/verify-otp-login
exports.verifyOtpAndAutoLogin = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        const user = await User.findOne({
            mobile: mobile.trim(),
            role: 'student',
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        await user.save({ validateBeforeSave: false });

        // Fetch last known password from PasswordLog
        const PasswordLog = require('../models/PasswordLog');
        const lastLog = await PasswordLog.findOne({ user: user._id }).sort({ createdAt: -1 });
        const plainPassword = lastLog ? lastLog.newPassword : null;

        // Send credentials email
        try {
            const { sendCredentialsEmail } = require('../services/emailService');
            await sendCredentialsEmail(user.name, user.email, plainPassword || '(check with admin)');
        } catch (emailErr) {
            console.error('Credentials email failed:', emailErr.message);
        }

        // Update login tracking
        user.isLoggedIn = true;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Generate JWT token for immediate login
        const token = user.generateToken();

        res.status(200).json({
            success: true,
            token,
            password: plainPassword, // Sent once for the popup display
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                profileImage: user.profileImage,
                registrationSource: user.registrationSource,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

