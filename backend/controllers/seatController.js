const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');

// Helper function to generate seat number
const generateSeatNumber = (wall, index) => {
    const wallPrefix = {
        north: 'N',
        south: 'S',
        east: 'E',
        west: 'W'
    };
    return `${wallPrefix[wall] || 'X'}${index + 1}`;
};

// Helper function to renumber all seats on a wall
const renumberSeatsOnWall = async (roomId, wall) => {
    const seats = await Seat.find({
        room: roomId,
        'position.wall': wall
    }).sort({ 'position.index': 1 });

    for (let i = 0; i < seats.length; i++) {
        seats[i].position.index = i;
        seats[i].number = generateSeatNumber(wall, i);
        await seats[i].save();
    }
};

// @desc    Add a new seat to a wall
// @route   POST /api/admin/seats
exports.addSeat = async (req, res) => {
    try {
        const { roomId, wall, basePrices } = req.body;

        if (!roomId || !wall) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and wall are required'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Find existing seats on this wall to determine the index
        const existingSeats = await Seat.find({
            room: roomId,
            'position.wall': wall
        });

        const newIndex = existingSeats.length;
        const seatNumber = generateSeatNumber(wall, newIndex);

        // Create new seat
        const seat = await Seat.create({
            number: seatNumber,
            room: roomId,
            position: {
                wall: wall,
                index: newIndex
            },
            basePrices: basePrices || {
                day: 800,
                night: 800,
                full: 1200
            }
        });

        // Add seat to room
        room.seats.push(seat._id);
        await room.save();

        res.status(201).json({
            success: true,
            message: 'Seat added successfully',
            seat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete a seat
// @route   DELETE /api/admin/seats/:id
exports.deleteSeat = async (req, res) => {
    try {
        const seat = await Seat.findById(req.params.id);

        if (!seat) {
            return res.status(404).json({
                success: false,
                message: 'Seat not found'
            });
        }

        if (seat.isOccupied) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete an occupied seat'
            });
        }

        const roomId = seat.room;
        const wall = seat.position.wall;

        // Remove seat from room
        await Room.findByIdAndUpdate(roomId, {
            $pull: { seats: seat._id }
        });

        // Delete the seat
        await Seat.findByIdAndDelete(req.params.id);

        // Renumber remaining seats on the wall
        await renumberSeatsOnWall(roomId, wall);

        res.status(200).json({
            success: true,
            message: 'Seat deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update individual seat (rename and update prices only)
// @route   PUT /api/admin/seats/:id
exports.updateSeat = async (req, res) => {
    try {
        const { number, basePrices } = req.body;
        const seat = await Seat.findById(req.params.id);

        if (!seat) {
            return res.status(404).json({
                success: false,
                message: 'Seat not found'
            });
        }

        const roomId = seat.room;

        // Update seat number if provided
        if (number && number !== seat.number) {
            // Check for duplicate seat numbers in the same room
            const duplicate = await Seat.findOne({
                room: roomId,
                number: number,
                _id: { $ne: seat._id }
            });

            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: `Seat number "${number}" already exists in this room`
                });
            }

            seat.number = number;
        }

        // Update base prices if provided
        if (basePrices) {
            seat.basePrices = basePrices;
        }

        await seat.save();

        res.status(200).json({
            success: true,
            message: 'Seat updated successfully',
            seat
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update prices for all seats (bulk)
// @route   PUT /api/admin/seats/bulk-price
exports.bulkUpdatePrices = async (req, res) => {
    try {
        const { basePrices } = req.body;

        if (!basePrices) {
            return res.status(400).json({
                success: false,
                message: 'Base prices are required'
            });
        }

        // Update all seats
        const result = await Seat.updateMany(
            {},
            { $set: { basePrices } }
        );

        res.status(200).json({
            success: true,
            message: `Updated prices for ${result.modifiedCount} seats`,
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update prices for all seats in a room
// @route   PUT /api/admin/rooms/:roomId/prices
exports.updateRoomPrices = async (req, res) => {
    try {
        const { basePrices } = req.body;
        const { roomId } = req.params;

        if (!basePrices) {
            return res.status(400).json({
                success: false,
                message: 'Base prices are required'
            });
        }

        // Verify room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Update all seats in this room
        const result = await Seat.updateMany(
            { room: roomId },
            { $set: { basePrices } }
        );

        res.status(200).json({
            success: true,
            message: `Updated prices for ${result.modifiedCount} seats in ${room.name}`,
            updatedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update prices for all seats on a floor
// @route   PUT /api/admin/floors/:floorId/prices
exports.updateFloorPrices = async (req, res) => {
    try {
        const { basePrices } = req.body;
        const { floorId } = req.params;

        if (!basePrices) {
            return res.status(400).json({
                success: false,
                message: 'Base prices are required'
            });
        }

        // Verify floor exists and get all rooms
        const floor = await Floor.findById(floorId).populate('rooms');
        if (!floor) {
            return res.status(404).json({
                success: false,
                message: 'Floor not found'
            });
        }

        // Get all room IDs on this floor
        const roomIds = floor.rooms.map(room => room._id);

        // Update all seats in rooms on this floor
        const result = await Seat.updateMany(
            { room: { $in: roomIds } },
            { $set: { basePrices } }
        );

        res.status(200).json({
            success: true,
            message: `Updated prices for ${result.modifiedCount} seats across ${floor.rooms.length} rooms on ${floor.name}`,
            updatedCount: result.modifiedCount,
            roomCount: floor.rooms.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update room layout (dimensions and door position)
// @route   PUT /api/admin/rooms/:id/layout
exports.updateRoomLayout = async (req, res) => {
    try {
        const { width, height, doorPosition } = req.body;
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        if (width) room.dimensions.width = width;
        if (height) room.dimensions.height = height;
        if (doorPosition) room.doorPosition = doorPosition;

        await room.save();

        res.status(200).json({
            success: true,
            message: 'Room layout updated successfully',
            room
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
