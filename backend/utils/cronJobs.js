const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Schedule job at 10:00 PM every day
const startCronJobs = () => {
    cron.schedule('0 22 * * *', async () => {
        console.log('[Cron Job] Running auto-attendance check at 10 PM...');
        try {
            // Get today's date logic
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Get all active students
            const activeStudents = await User.find({ role: 'student', isActive: true });

            let markedCount = 0;

            for (const student of activeStudents) {
                // Ignore if student joined after today
                const admissionDate = new Date(student.createdAt);
                admissionDate.setHours(0, 0, 0, 0);

                if (today < admissionDate) continue;

                // Check if an attendance record already exists for today
                const existingRecord = await Attendance.findOne({
                    student: student._id,
                    date: today
                });

                if (!existingRecord) {
                    // Mark as absent if no record exists
                    await Attendance.create({
                        student: student._id,
                        date: today,
                        status: 'absent',
                        markedBy: null // System marked
                    });
                    markedCount++;
                } else if (existingRecord.isActive) {
                    // If they never checked out, auto check out first? 
                    // The user just reuqested "if not manually saved attendance will be automatically saved"
                    // We will just do the missing ones.
                }
            }

            console.log(`[Cron Job] Auto-marked ${markedCount} students as absent for today.`);
        } catch (error) {
            console.error('[Cron Job] Error during auto-attendance:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

module.exports = startCronJobs;
