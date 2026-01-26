const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Attendance = require('../models/Attendance');

const fixDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find duplicates based on Student + Day
        // We use $dateToString to normalize the date part
        const duplicates = await Attendance.aggregate([
            {
                $group: {
                    _id: {
                        student: "$student",
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } }
                    },
                    ids: { $push: "$_id" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} sets of duplicates.`);

        let deletedCount = 0;

        for (const group of duplicates) {
            const records = await Attendance.find({ _id: { $in: group.ids } });

            // Sort records to find the "best" one to keep
            // prioritizing records with entryTime, then max duration, then updated recently
            records.sort((a, b) => {
                const aHasTime = a.entryTime ? 1 : 0;
                const bHasTime = b.entryTime ? 1 : 0;
                if (aHasTime !== bHasTime) return bHasTime - aHasTime;

                return (b.duration || 0) - (a.duration || 0);
            });

            const keep = records[0];
            const remove = records.slice(1);

            console.log(`Fixing ${group._id.day} for student ${group._id.student}: Keeping ${keep._id} (Dur: ${keep.duration})`);

            for (const rec of remove) {
                console.log(`   Deleting duplicate ${rec._id} (Dur: ${rec.duration}, Entry: ${rec.entryTime})`);
                await Attendance.findByIdAndDelete(rec._id);
                deletedCount++;
            }
        }

        console.log(`Migration completed. Deleted ${deletedCount} duplicate records.`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixDuplicates();
