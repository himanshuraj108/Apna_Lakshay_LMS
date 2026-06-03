const SystemUpdate = require('../models/SystemUpdate');

// @desc    Get all updates (Admin)
// @route   GET /api/admin/updates
exports.getUpdates = async (req, res) => {
    try {
        const updates = await SystemUpdate.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            updates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create a new update (Admin)
// @route   POST /api/admin/updates
exports.createUpdate = async (req, res) => {
    try {
        const { tickerEn, tickerHi, titleEn, titleHi, contentEn, contentHi, isActive } = req.body;

        if (!tickerEn || !tickerHi || !titleEn || !titleHi || !contentEn || !contentHi) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        const update = await SystemUpdate.create({
            tickerEn,
            tickerHi,
            titleEn,
            titleHi,
            contentEn,
            contentHi,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'System update created successfully',
            update
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update an existing update (Admin)
// @route   PUT /api/admin/updates/:id
exports.updateUpdate = async (req, res) => {
    try {
        const { tickerEn, tickerHi, titleEn, titleHi, contentEn, contentHi, isActive } = req.body;
        const update = await SystemUpdate.findById(req.params.id);

        if (!update) {
            return res.status(404).json({
                success: false,
                message: 'Update not found.'
            });
        }

        if (tickerEn !== undefined) update.tickerEn = tickerEn;
        if (tickerHi !== undefined) update.tickerHi = tickerHi;
        if (titleEn !== undefined) update.titleEn = titleEn;
        if (titleHi !== undefined) update.titleHi = titleHi;
        if (contentEn !== undefined) update.contentEn = contentEn;
        if (contentHi !== undefined) update.contentHi = contentHi;
        if (isActive !== undefined) update.isActive = isActive;

        await update.save();

        res.status(200).json({
            success: true,
            message: 'System update updated successfully',
            update
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete an update (Admin)
// @route   DELETE /api/admin/updates/:id
exports.deleteUpdate = async (req, res) => {
    try {
        const update = await SystemUpdate.findById(req.params.id);

        if (!update) {
            return res.status(404).json({
                success: false,
                message: 'Update not found.'
            });
        }

        await update.deleteOne();

        res.status(200).json({
            success: true,
            message: 'System update deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Toggle active status of an update (Admin)
// @route   PUT /api/admin/updates/:id/toggle
exports.toggleUpdateActive = async (req, res) => {
    try {
        const update = await SystemUpdate.findById(req.params.id);

        if (!update) {
            return res.status(404).json({
                success: false,
                message: 'Update not found.'
            });
        }

        update.isActive = !update.isActive;
        await update.save();

        res.status(200).json({
            success: true,
            message: `Update status set to ${update.isActive ? 'Active' : 'Inactive'}`,
            update
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get the latest active update (Student/Public Dashboard)
// @route   GET /api/student/updates/latest
exports.getLatestActiveUpdate = async (req, res) => {
    try {
        const update = await SystemUpdate.findOne({ isActive: true })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            update: update || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
