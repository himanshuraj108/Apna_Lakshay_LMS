const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { createLogger } = require('./logger');

const log = createLogger('cron');

// Schedule job at 10:00 PM IST every day
const startCronJobs = () => {
    cron.schedule('0 22 * * *', async () => {
        log.info('Auto-attendance job triggered', { schedule: '0 22 * * * (IST)' });
        try {
            const now   = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const activeStudents = await User.find({ role: 'student', isActive: true });
            let markedCount = 0;

            for (const student of activeStudents) {
                const admissionDate = new Date(student.createdAt);
                admissionDate.setHours(0, 0, 0, 0);
                if (today < admissionDate) continue;

                const existingRecord = await Attendance.findOne({
                    student : student._id,
                    date    : today
                });

                if (!existingRecord) {
                    await Attendance.create({
                        student  : student._id,
                        date     : today,
                        status   : 'absent',
                        markedBy : null
                    });
                    markedCount++;
                }
            }

            log.ok('Auto-attendance job completed', {
                totalActive  : activeStudents.length,
                markedAbsent : markedCount
            });
        } catch (error) {
            log.error('Auto-attendance job failed', { error: error.message });
        }
    }, {
        scheduled : true,
        timezone  : 'Asia/Kolkata'
    });
};

module.exports = startCronJobs;
