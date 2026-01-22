require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Floor = require('../models/Floor');

const fixPositions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const seats = await Seat.find({});
        console.log(`Found ${seats.length} seats. Checking positions...`);

        let updatedCount = 0;

        for (const seat of seats) {
            // If seat has no position or no wall, fix it
            if (!seat.position || !seat.position.wall) {

                // Determine room context (simulated logic based on seed data structure)
                // We use parsing of seat number or just simple distribution

                // Parse number like "G-1", "F1-R1-1"
                const parts = seat.number.split('-');
                const num = parseInt(parts[parts.length - 1]);

                let wall = 'north';
                let index = 0;

                // Logic matching our seedData distribution for consistency
                if (seat.number.startsWith('G-')) {
                    // Ground floor: 20 seats (5 per wall)
                    wall = num <= 5 ? 'north' : num <= 10 ? 'east' : num <= 15 ? 'south' : 'west';
                    index = (num - 1) % 5;
                } else if (seat.number.startsWith('F1-R1-')) {
                    // F1 R1: 7 seats (4 north, 3 east)
                    wall = num <= 4 ? 'north' : 'east';
                    index = (num - 1) % 4;
                } else if (seat.number.startsWith('F1-R2-')) {
                    // F1 R2: 12 seats (4 south, 4 west, 4 north)
                    wall = num <= 4 ? 'south' : num <= 8 ? 'west' : 'north';
                    index = (num - 1) % 4;
                } else if (seat.number.startsWith('F2-')) {
                    // F2 R1: 5 seats (All north)
                    wall = 'north';
                    index = num - 1;
                } else {
                    // Default fallback
                    wall = 'north';
                    index = num || 0;
                }

                seat.position = { wall, index };
                await seat.save();
                updatedCount++;
            }
        }

        console.log(`✅ Fixed positions for ${updatedCount} seats.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing positions:', error);
        process.exit(1);
    }
};

fixPositions();
