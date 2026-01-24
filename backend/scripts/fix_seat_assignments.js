const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Seat = require('../models/Seat');

const fixAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const seats = await Seat.find({
            assignedTo: { $ne: null },
            $or: [
                { assignments: { $size: 0 } },
                { assignments: null }
            ]
        });

        console.log(`Found ${seats.length} seats with legacy assignments to fix.`);

        for (const seat of seats) {
            if (!seat.assignedTo) continue;

            console.log(`Fixing seat ${seat.number}...`);

            // Check if already has active assignment for this user (double check)
            const hasActive = seat.assignments && seat.assignments.some(a =>
                a.status === 'active' &&
                a.student.toString() === seat.assignedTo.toString()
            );

            if (!hasActive) {
                const newAssignment = {
                    student: seat.assignedTo,
                    shift: seat.shift || null, // Use legacy shift ID if present
                    legacyShift: null,
                    type: 'specific',
                    status: 'active',
                    assignedAt: seat.updatedAt || new Date(),
                    price: seat.negotiatedPrice || seat.basePrices?.day || 800
                };

                seat.assignments = seat.assignments || [];
                seat.assignments.push(newAssignment);
                seat.isOccupied = true;

                await seat.save();
                console.log(`✅ Fixed seat ${seat.number}`);
            }
        }

        console.log('Migration completed.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixAssignments();
