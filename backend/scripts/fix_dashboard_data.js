const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const dotenv = require('dotenv');
const path = require('path');

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const fixDashboardData = async () => {
    await connectDB();

    console.log('\n--- Starting Dashboard Data Fix ---');

    // 1. Fix Duplicate Assignments
    console.log('\nScanning for seats with multiple active assignments...');
    const seats = await Seat.find({ 'assignments.status': 'active' });

    let fixedCount = 0;

    for (const seat of seats) {
        const activeAssignments = seat.assignments.filter(a => a.status === 'active');

        if (activeAssignments.length > 1) {
            console.log(`Seat ${seat.number} has ${activeAssignments.length} active assignments.`);

            // Sort by assignedAt (descending) - keep the newest one
            activeAssignments.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

            const toKeep = activeAssignments[0];
            const toCancel = activeAssignments.slice(1);

            console.log(`Keeping assignment for student: ${toKeep.student} (Assigned: ${toKeep.assignedAt})`);

            for (const assignment of toCancel) {
                console.log(`Cancelling duplicate assignment for student: ${assignment.student} (Assigned: ${assignment.assignedAt})`);

                // Find this specific assignment in the full array and update it
                const index = seat.assignments.findIndex(a => a._id.toString() === assignment._id.toString());
                if (index !== -1) {
                    seat.assignments[index].status = 'cancelled';
                    seat.assignments[index].endDate = new Date();
                }
            }

            await seat.save();
            fixedCount++;
            console.log(`Seat ${seat.number} fixed.`);
        }
    }

    console.log(`\nFixed ${fixedCount} seats with duplicate assignments.`);

    process.exit();
};

fixDashboardData();
