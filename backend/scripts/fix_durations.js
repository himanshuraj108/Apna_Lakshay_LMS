const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const dotenv = require('dotenv');
const path = require('path');

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

const fixDurations = async () => {
    await connectDB();
    console.log('\n--- Starting Duration Fix ---');

    const records = await Attendance.find({
        status: 'present',
        entryTime: { $exists: true, $ne: null },
        exitTime: { $exists: true, $ne: null },
        duration: { $in: [0, null] } // Only fix if 0 or missing
    });

    console.log(`Found ${records.length} records to fix.`);

    let updatedCount = 0;

    for (const record of records) {
        try {
            const [entryHour, entryMin] = record.entryTime.split(':').map(Number);
            const [exitHour, exitMin] = record.exitTime.split(':').map(Number);

            // Validation
            if (isNaN(entryHour) || isNaN(exitHour)) continue;

            const entryMinutes = entryHour * 60 + entryMin;
            let exitMinutes = exitHour * 60 + exitMin;

            if (exitMinutes < entryMinutes) {
                exitMinutes += 24 * 60; // Overnight
            }

            const duration = exitMinutes - entryMinutes;

            if (duration > 0) {
                record.duration = duration;
                record.isActive = false; // Ensure it's marked inactive if duration exists
                await record.save(); // This might trigger hook but we are setting explicit values
                updatedCount++;
                console.log(`Updated ID ${record._id}: ${record.entryTime}-${record.exitTime} = ${duration}m`);
            }
        } catch (err) {
            console.error(`Failed to update ${record._id}:`, err.message);
        }
    }

    console.log(`\nSuccessfully fixed ${updatedCount} records.`);
    process.exit();
};

fixDurations();
