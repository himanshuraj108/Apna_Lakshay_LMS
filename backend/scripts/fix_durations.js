const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Attendance = require('../models/Attendance');

const fixDurations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const records = await Attendance.find({
            entryTime: { $exists: true, $ne: null },
            exitTime: { $exists: true, $ne: null }
        });

        console.log(`Checking ${records.length} records for duration updates...`);

        let fixedCount = 0;

        for (const record of records) {
            let needsUpdate = false;

            // Calculate correct duration
            const [entryHour, entryMin] = record.entryTime.split(':').map(Number);
            const [exitHour, exitMin] = record.exitTime.split(':').map(Number);

            const entryMinutes = entryHour * 60 + entryMin;
            let exitMinutes = exitHour * 60 + exitMin;

            // Handle overnight
            if (exitMinutes < entryMinutes) {
                exitMinutes += 24 * 60;
            }

            const calculatedDuration = exitMinutes - entryMinutes;

            // If duration is 0, missing, or calculated diff is significant (e.g. logic change)
            if (!record.duration || record.duration === 0 || record.duration !== calculatedDuration) {
                console.log(`Update ${record.student} Date: ${record.date.toISOString().split('T')[0]}`);
                console.log(`   Time: ${record.entryTime}-${record.exitTime}`);
                console.log(`   Old Duration: ${record.duration} -> New: ${calculatedDuration}`);

                record.duration = calculatedDuration;
                record.isActive = false; // ensure closed
                await record.save();
                fixedCount++;
            }
        }

        console.log(`Migration completed. Fixed ${fixedCount} records.`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixDurations();
