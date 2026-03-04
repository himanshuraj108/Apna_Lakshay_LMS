const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({
                shiftMode: 'default',
                systemStatus: 'active',
                locationAttendance: true
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
        const { shiftMode, systemStatus, activeModes, locationAttendance } = req.body;

        let settings = await Settings.findOne();

        // Build update object dynamically
        const updateFields = {};
        if (shiftMode !== undefined) updateFields.shiftMode = shiftMode;
        if (activeModes !== undefined) updateFields.activeModes = activeModes;
        if (systemStatus !== undefined) updateFields.systemStatus = systemStatus;

        // Strict boolean coercion for locationAttendance
        if (locationAttendance !== undefined) {
            const coerced = locationAttendance === 'true' ? true : (locationAttendance === 'false' ? false : !!locationAttendance);
            updateFields.locationAttendance = coerced;
        }

        updateFields.updatedBy = req.user._id;

        if (!settings) {
            settings = await Settings.create({
                shiftMode: shiftMode || 'default',
                activeModes: activeModes || { default: true, custom: false },
                systemStatus: systemStatus || 'active',
                locationAttendance: locationAttendance !== undefined ? locationAttendance : true,
                updatedBy: req.user._id
            });
        } else {
            settings = await Settings.findOneAndUpdate(
                {},
                { $set: updateFields },
                { new: true, runValidators: true }
            );
        }

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
        let settings = await Settings.findOne().select('shiftMode systemStatus locationAttendance');

        if (!settings) {
            settings = {
                shiftMode: 'default',
                systemStatus: 'active',
                locationAttendance: true
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
