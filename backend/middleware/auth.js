const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
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

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user is active (paid/valid member)
exports.authorizeActive = (req, res, next) => {
    // Admin is always active/authorized
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    if (req.user && !req.user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Your membership is inactive.'
        });
    }

    // Check for Pending Allocation (Active but No Seat)
    // We strictly enforce seat assignment for these routes, EXCEPT for support requests
    if (req.user && req.user.isActive && !req.user.seat) {
        // Allow access to specific endpoints (like Help & Support)
        const allowedPaths = ['/request', '/profile'];
        const isAllowed = allowedPaths.some(path => req.originalUrl.includes(path));

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Pending seat allocation.'
            });
        }
    }
    next();
};

// Admin only middleware (Legacy support if needed)
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};
// Simulate Server Crash for Students if Custom Mode is ON
// Maintenance Mode Middleware
exports.checkMaintenanceMode = async (req, res, next) => {
    // Admin bypass
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    try {
        const Settings = require('../models/Settings');
        const setting = await Settings.findOne();

        // If status is specifically set to 'maintenance'
        if (setting && setting.systemStatus === 'maintenance') {
            return res.status(503).json({
                success: false,
                message: 'System under maintenance',
                maintenanceMode: true
            });
        }
        next();
    } catch (error) {
        // If DB fails, assume we should try to let them in or fail gracefully. 
        // Failing open is safer for maintenance middleware to avoid accidental lockouts.
        next();
    }
};
