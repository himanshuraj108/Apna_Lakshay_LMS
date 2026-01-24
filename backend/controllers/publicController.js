const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');
const Settings = require('../models/Settings');

// @desc    Get all seats with availability (public view)
// @route   GET /api/public/seats
exports.getSeats = async (req, res) => {
    try {
        // Check system status
        const settings = await Settings.findOne();
        // Allow if either 'default' (legacy) or 'custom' (dynamic) mode is active.
        // Only show maintenance if BOTH are disabled (or if settings exist but strictly specific modes are off).
        // Assuming we want to show seats if at least one mode is active.
        if (settings && settings.activeModes) {
            const isActive = settings.activeModes.custom || settings.activeModes.default;
            if (!isActive) {
                return res.status(200).json({
                    success: true,
                    maintenance: true,
                    message: 'System is under maintenance'
                });
            }
        }

        const floors = await Floor.find()
            .populate({
                path: 'rooms',
                populate: {
                    path: 'seats'
                }
            })
            .sort({ level: 1 });

        // Format response with all needed fields for box layout
        const formattedFloors = floors.map(floor => ({
            _id: floor._id,
            name: floor.name,
            level: floor.level,
            rooms: floor.rooms.map(room => ({
                _id: room._id,
                name: room.name,
                dimensions: room.dimensions,
                doorPosition: room.doorPosition,
                seats: room.seats.map(seat => {
                    // Filter active assignments
                    const activeAssignments = seat.assignments?.filter(a => a.status === 'active') || [];

                    // Determine occupancy and active shift
                    // 1. Full Day Check
                    const fullDay = activeAssignments.find(a => a.type === 'full_day' || a.legacyShift === 'full');

                    // Determine occupancy status
                    let occupancyStatus = 'vacant'; // vacant, partial, occupied
                    let displayShift = null;

                    if (fullDay) {
                        occupancyStatus = 'occupied';
                        displayShift = 'Full Day';
                    } else if (activeAssignments.length > 0) {
                        occupancyStatus = 'partial';
                        // Show first active shift as primary display, but frontend should show all
                        const active = activeAssignments[0];
                        if (active.shift) {
                            displayShift = active.shift;
                        } else if (active.legacyShift) {
                            displayShift = active.legacyShift;
                        }
                    }

                    return {
                        _id: seat._id,
                        number: seat.number,
                        // Legacy field for backward compatibility (true if ANY occupancy)
                        isOccupied: occupancyStatus !== 'vacant',
                        status: occupancyStatus, // New field for partial support
                        isFullyBlocked: !!fullDay,
                        activeShifts: activeAssignments.map(a => a.shift || a.legacyShift),
                        shift: displayShift,
                        position: seat.position,
                        basePrices: seat.basePrices,
                        shiftPrices: seat.shiftPrices
                    };
                })
            }))
        }));

        res.status(200).json({
            success: true,
            floors: formattedFloors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all active shifts (public)
// @route   GET /api/public/shifts
exports.getShifts = async (req, res) => {
    try {
        const shifts = await require('../models/Shift').find({ isActive: true });
        res.status(200).json({
            success: true,
            shifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
