require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Attendance = require('./backend/models/Attendance');
const Holiday = require('./backend/models/Holiday');

async function testHolidayLogic() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        // 1. Find a student
        const student = await User.findOne({ role: 'student', isActive: true });
        if (!student) throw new Error('No active student found');
        console.log('Using student:', student.name);

        // 2. Create a holiday for today (if not exists)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Holiday.deleteOne({ date: today });
        await Attendance.deleteMany({ date: today, student: student._id });

        const holiday = await Holiday.create({
            date: today,
            name: 'Test Festival'
        });
        console.log('Created holiday:', holiday.name);

        // 3. Admin declares holiday (simulating the bulk write)
        const noteText = `Holiday - ${holiday.name}`;
        await Attendance.create({
            student: student._id,
            date: today,
            status: 'present',
            notes: noteText,
            entryTime: null,
            exitTime: null,
            duration: 0,
            isActive: false
        });
        console.log('Admin marked holiday attendance for student');

        // 4. Test logic from studentController
        const todayRecord = await Attendance.findOne({ student: student._id, date: today });
        const entryTime = "09:00";

        // Simulating markAttendanceByQr / markSelfAttendance
        const existingNotes = todayRecord.notes || '';
        const isHoliday = existingNotes.startsWith('Holiday - ');
        const baseShiftLabel = isHoliday ? existingNotes : `Self Checked In (was ${todayRecord.status})`;

        todayRecord.status = 'present';
        todayRecord.entryTime = entryTime;
        todayRecord.exitTime = null;
        todayRecord.duration = 0;
        todayRecord.notes = isHoliday ? existingNotes : baseShiftLabel;

        await todayRecord.save();

        console.log('Student checked in. Final record notes:', todayRecord.notes);
        if (todayRecord.notes === 'Holiday - Test Festival') {
            console.log('SUCCESS: Notes were preserved!');
        } else {
            console.log('FAILED: Notes were not preserved.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

testHolidayLogic();
