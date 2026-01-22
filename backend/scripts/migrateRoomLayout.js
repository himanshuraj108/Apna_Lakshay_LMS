require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');

const migrateRoomsAndSeats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Migrate Rooms - Add default layout config and door positions
        const rooms = await Room.find().populate('floor');

        for (const room of rooms) {
            const floorLevel = room.floor?.level;
            const roomName = room.name;

            // Set door position based on floor and room
            let doorPosition = 'south'; // default

            if (floorLevel === 0) {
                // Ground Floor - door south
                doorPosition = 'south';
            } else if (floorLevel === 1) {
                // 1st Floor
                if (roomName.includes('1')) {
                    doorPosition = 'west'; // Room 1 - left
                } else {
                    doorPosition = 'south'; // Room 2 - below
                }
            } else if (floorLevel === 2) {
                // 2nd Floor - door west
                doorPosition = 'west';
            }

            room.layout = 'grid';
            room.dimensions = { width: 4, height: 4 };
            room.doorPosition = doorPosition;

            await room.save();
            console.log(`✅ Updated room: ${room.name} (Floor ${floorLevel}) - Door: ${doorPosition}`);
        }

        // Migrate Seats - Assign default positions based on current seat numbers
        const seats = await Seat.find();

        for (const seat of seats) {
            // Extract number to determine default wall
            const seatNum = seat.number;
            let wall = 'north';
            let index = 0;

            // Simple heuristic: distribute seats evenly across walls
            // First quarter -> north, second -> east, third -> south, fourth -> west
            const match = seatNum.match(/(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                const position = num % 4;

                if (position === 1) wall = 'north';
                else if (position === 2) wall = 'east';
                else if (position === 3) wall = 'south';
                else wall = 'west';

                index = Math.floor((num - 1) / 4);
            }

            seat.position = { wall, index };
            await seat.save();
            console.log(`✅ Updated seat: ${seat.number} - Position: ${wall}[${index}]`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log(`   - Updated ${rooms.length} rooms`);
        console.log(`   - Updated ${seats.length} seats`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrateRoomsAndSeats();
