const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Seat = require('../backend/models/Seat');

const fixSeatOccupancy = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to DB');

        const seats = await Seat.find({});
        console.log(`Checking ${seats.length} seats...`);

        let updatedCount = 0;

        for (const seat of seats) {
            let changed = false;

            // Filter out assignments where student ID doesn't exist in Users collection
            // We need to check each student ID
            const newAssignments = [];
            for (const assignment of seat.assignments) {
                if (!assignment.student) {
                    console.log(`Skipping invalid assignment (no student ID) in Seat ${seat.number}`);
                    changed = true;
                    continue;
                }

                try {
                    const student = await User.findById(assignment.student);
                    if (student) {
                        newAssignments.push(assignment);
                    } else {
                        console.log(`Found orphaned assignment in Seat ${seat.number} (Room: ${seat.room}) for Student ID ${assignment.student}`);
                        changed = true;
                    }
                } catch (err) {
                    console.error(`Error checking student ${assignment.student}: ${err.message}`);
                    // If ID is invalid, we probably should remove it? Or keep it safe?
                    // Assuming remove if CastError
                    if (err.name === 'CastError') {
                        console.log(`Invalid ID format, removing assignment.`);
                        changed = true;
                    } else {
                        // Keep it if checking failed? Or crash?
                        newAssignments.push(assignment);
                    }
                }
            }

            if (changed) {
                seat.assignments = newAssignments;

                // Recalculate isOccupied
                const activeAssignments = seat.assignments.filter(a => a.status === 'active');
                seat.isOccupied = activeAssignments.length > 0;

                await seat.save();
                updatedCount++;
            }
        }

        console.log(`Fixed ${updatedCount} seats.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixSeatOccupancy();
