const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');

// @desc    Get all seats with availability (public view)
// @route   GET /api/public/seats
exports.getSeats = async (req, res) => {
    try {
        const floors = await Floor.find()
            .populate({
                path: 'rooms',
                populate: {
                    path: 'seats',
                    populate: {
                        path: 'assignedTo',
                        select: 'name email'
                    }
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
                seats: room.seats.map(seat => ({
                    _id: seat._id,
                    number: seat.number,
                    isOccupied: seat.isOccupied,
                    shift: seat.shift,
                    position: seat.position,
                    basePrices: seat.basePrices // Show original prices for all seats
                    // assignedTo and negotiatedPrice hidden for privacy
                }))
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
