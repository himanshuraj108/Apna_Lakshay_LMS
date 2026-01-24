const mongoose = require('mongoose');
const Seat = require('../models/Seat');

const fixStuckSeats = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hamara-lakshay');
        console.log('Connected to MongoDB');

        // Find all seats marked as occupied
        const occupiedSeats = await Seat.find({ isOccupied: true });
        console.log(`Found ${occupiedSeats.length} seats marked as occupied.`);

        let fixedCount = 0;

        for (const seat of occupiedSeats) {
            // Check for valid active assignments
            const activeAssignments = seat.assignments ? seat.assignments.filter(a => a.status === 'active') : [];

            if (activeAssignments.length === 0) {
                // Determine if it should really be free
                console.log(`Fixing stuck seat ${seat.number}: Marked occupied but has 0 active assignments.`);

                seat.isOccupied = false;
                seat.assignedTo = null; // Clear legacy
                seat.shift = null;      // Clear legacy
                await seat.save();
                fixedCount++;
            } else {
                // Optional: Ensure legacy assignedTo matches active assignment if single
                if (activeAssignments.length === 1 && (!seat.assignedTo || seat.assignedTo.toString() !== activeAssignments[0].student.toString())) {
                    console.log(`Syncing legacy assignedTo for seat ${seat.number}`);
                    seat.assignedTo = activeAssignments[0].student;
                    await seat.save();
                }
            }
        }

        console.log(`Fixed ${fixedCount} stuck seats.`);
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixStuckSeats();
