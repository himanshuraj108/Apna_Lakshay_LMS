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
                        select: 'name'
                    }
                }
            })
            .sort({ level: 1 });

        // Format response - hide prices for occupied seats
        const formattedFloors = floors.map(floor => ({
            _id: floor._id,
            name: floor.name,
            level: floor.level,
            rooms: floor.rooms.map(room => ({
                _id: room._id,
                name: room.name,
                seats: room.seats.map(seat => {
                    const seatData = {
                        _id: seat._id,
                        number: seat.number,
                        isOccupied: seat.isOccupied,
                        shift: seat.shift
                    };

                    // Only show prices for AVAILABLE seats
                    if (!seat.isOccupied && seat.shift) {
                        seatData.dayPrice = seat.basePrices.day;
                        seatData.nightPrice = seat.basePrices.night;
                        seatData.fullPrice = seat.basePrices.full;
                    }

                    return seatData;
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
