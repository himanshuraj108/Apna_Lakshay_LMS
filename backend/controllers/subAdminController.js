const SubAdmin = require('../models/SubAdmin');
const jwt = require('jsonwebtoken');

const ALLOWED_PERMISSIONS = [
    'attendance', 'students', 'fees', 'notifications', 'requests', 'vacant_seats'
];

// ─── GET /admin/sub-admins ────────────────────────────────────────────────────
exports.getSubAdmins = async (req, res) => {
    try {
        const list = await SubAdmin.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, subAdmins: list });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ─── POST /admin/sub-admins ───────────────────────────────────────────────────
    exports.createSubAdmin = async (req, res) => {
        try {
            const { name, username, password, permissions, pin } = req.body;
    
            if (!name || !username || !password) {
                return res.status(400).json({ success: false, message: 'Name, username, and password are required.' });
            }
    
            const existing = await SubAdmin.findOne({ username: username.toLowerCase() });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Username already taken.' });
            }
    
            const validPerms = (permissions || []).filter(p => ALLOWED_PERMISSIONS.includes(p));
    
            const sub = await SubAdmin.create({
                name,
                username,
                password,
                pin: pin || '',
                permissions: validPerms,
                createdBy: req.user.id
            });
    
            const safe = sub.toObject();
            delete safe.password;
    
            res.status(201).json({ success: true, message: 'Sub-admin created successfully.', subAdmin: safe });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    };
    
    // ─── PUT /admin/sub-admins/:id ────────────────────────────────────────────────
    exports.updateSubAdmin = async (req, res) => {
        try {
            const { name, username, password, permissions, isActive, pin } = req.body;
            const sub = await SubAdmin.findById(req.params.id);
            if (!sub) return res.status(404).json({ success: false, message: 'Sub-admin not found.' });
    
            if (name)        sub.name    = name;
            if (username)    sub.username = username.toLowerCase();
            if (pin !== undefined) sub.pin = pin;
            if (permissions) sub.permissions = permissions.filter(p => ALLOWED_PERMISSIONS.includes(p));
            if (isActive !== undefined) sub.isActive = isActive;
            if (password && password.length >= 6) sub.password = password; // will be hashed by pre-save
    
            await sub.save();

        const safe = sub.toObject();
        delete safe.password;

        res.json({ success: true, message: 'Sub-admin updated.', subAdmin: safe });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ─── DELETE /admin/sub-admins/:id ────────────────────────────────────────────
exports.deleteSubAdmin = async (req, res) => {
    try {
        const sub = await SubAdmin.findByIdAndDelete(req.params.id);
        if (!sub) return res.status(404).json({ success: false, message: 'Sub-admin not found.' });
        res.json({ success: true, message: 'Sub-admin deleted.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ─── POST /auth/sub-admin-login (public) ─────────────────────────────────────
exports.loginSubAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const sub = await SubAdmin.findOne({ username: username?.toLowerCase() });
        if (!sub) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        if (!sub.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });

        const match = await sub.comparePassword(password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        const token = jwt.sign(
            { id: sub._id, role: 'subadmin', permissions: sub.permissions },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            subAdmin: { id: sub._id, name: sub.name, username: sub.username, permissions: sub.permissions, hasPin: !!sub.pin }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ─── POST /admin/verify-subadmin-pin ──────────────────────────────────────────
exports.verifySubAdminPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const sub = await SubAdmin.findById(req.user.id);
        
        if (!sub) return res.status(404).json({ success: false, message: 'SubAdmin not found.' });

        if (!sub.pin) {
            // If no PIN is set, allow them through
            return res.json({ success: true, message: 'No PIN set' });
        }

        if (sub.pin === pin) {
            return res.json({ success: true, message: 'PIN verified' });
        } else {
            return res.status(400).json({ success: false, message: 'Incorrect PIN.' });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
