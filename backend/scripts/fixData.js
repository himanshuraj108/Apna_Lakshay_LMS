const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Seat = require('../models/Seat');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const seats = await Seat.find({});
        console.log(`Found ${seats.length} seats. Processing...`);

        let updatedSeats = 0;
        let updatedUsers = 0;

        for (const seat of seats) {
            // 1. Fix isOccupied status
            const shouldBeOccupied = !!seat.assignedTo;
            if (seat.isOccupied !== shouldBeOccupied) {
                seat.isOccupied = shouldBeOccupied;
                await seat.save();
                updatedSeats++;
            }

            // 2. Sync User.seat field
            if (seat.assignedTo) {
                const user = await User.findById(seat.assignedTo);
                if (user) {
                    if (!user.seat || user.seat.toString() !== seat._id.toString()) {
                        user.seat = seat._id;
                        await user.save();
                        updatedUsers++;
                    }
                }
            }
        }

        console.log(`Fixed ${updatedSeats} seat statuses.`);
        console.log(`Fixed ${updatedUsers} user seat references.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixData();
