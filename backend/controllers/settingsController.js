const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({
                shiftMode: 'default',
                systemStatus: 'active'
            });
        }

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
    try {
        const { shiftMode, systemStatus, activeModes } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings({
                shiftMode: shiftMode || 'default',
                activeModes: activeModes || { default: true, custom: false },
                systemStatus: systemStatus || 'active'
            });
        } else {
            if (shiftMode) settings.shiftMode = shiftMode;
            if (activeModes) settings.activeModes = activeModes;
            if (systemStatus) settings.systemStatus = systemStatus;
        }

        settings.updatedBy = req.user._id;
        await settings.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get public settings (for student/public view)
// @route   GET /api/public/settings
exports.getPublicSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne().select('shiftMode systemStatus');

        if (!settings) {
            settings = {
                shiftMode: 'default',
                systemStatus: 'active'
            };
        }

        res.status(200).json({
            success: true,
            settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
