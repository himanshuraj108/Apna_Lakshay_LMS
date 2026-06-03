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
                locationAttendance: true,
                onlinePaymentEnabled: true,
                showWhatsAppGroup: true,
                showAITools: true
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
        const {
            shiftMode, systemStatus, activeModes, locationAttendance,
            onlinePaymentEnabled, pinAttendanceEnabled, attendancePin,
            timeRestrictionEnabled, loginAttendanceEnabled,
            showWhatsAppGroup, showAITools, referral
        } = req.body;

        let settings = await Settings.findOne();

        // Build update object dynamically
        const updateFields = {};
        if (shiftMode !== undefined) updateFields.shiftMode = shiftMode;
        if (activeModes !== undefined) updateFields.activeModes = activeModes;
        if (systemStatus !== undefined) updateFields.systemStatus = systemStatus;
        if (onlinePaymentEnabled !== undefined) updateFields.onlinePaymentEnabled = !!onlinePaymentEnabled;
        if (pinAttendanceEnabled !== undefined) updateFields.pinAttendanceEnabled = !!pinAttendanceEnabled;
        if (attendancePin !== undefined) updateFields.attendancePin = String(attendancePin).trim();
        if (timeRestrictionEnabled !== undefined) updateFields.timeRestrictionEnabled = !!timeRestrictionEnabled;
        if (loginAttendanceEnabled !== undefined) updateFields.loginAttendanceEnabled = !!loginAttendanceEnabled;
        if (showWhatsAppGroup !== undefined) updateFields.showWhatsAppGroup = !!showWhatsAppGroup;
        if (showAITools !== undefined) updateFields.showAITools = !!showAITools;

        // Referral sub-document — use dot notation to avoid overwriting other sub-fields
        if (referral !== undefined && typeof referral === 'object') {
            Object.entries(referral).forEach(([k, v]) => {
                updateFields[`referral.${k}`] = v;
            });
        }

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
                onlinePaymentEnabled: onlinePaymentEnabled !== undefined ? !!onlinePaymentEnabled : true,
                showWhatsAppGroup: showWhatsAppGroup !== undefined ? !!showWhatsAppGroup : true,
                showAITools: showAITools !== undefined ? !!showAITools : true,
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
        let settings = await Settings.findOne().select('shiftMode systemStatus locationAttendance onlinePaymentEnabled pinAttendanceEnabled loginAttendanceEnabled showWhatsAppGroup showAITools referral rewards');


        if (!settings) {
            settings = {
                shiftMode: 'default',
                systemStatus: 'active',
                locationAttendance: true,
                onlinePaymentEnabled: true,
                showWhatsAppGroup: true,
                showAITools: true,
                referral: { enabled: false },
                rewards: { enabled: true }
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
