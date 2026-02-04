const mongoose = require('mongoose');
const User = require('./models/User'); // Register User model first
const Attendance = require('./models/Attendance');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const debugAttendance = async () => {
    await connectDB();
    console.log('\n--- Checking Recent Attendance Records ---');

    // Fetch last 5 attendance records where status is present
    const records = await Attendance.find({ status: 'present' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name');

    records.forEach(r => {
        console.log(`\nID: ${r._id}`);
        console.log(`Student: ${r.student?.name} (${r.student?._id})`);
        console.log(`Date: ${r.date}`);
        console.log(`Entry: ${r.entryTime}`);
        console.log(`Exit: ${r.exitTime}`);
        console.log(`Duration: ${r.duration}`);
        console.log(`Is Active: ${r.isActive}`);

        // Manual Calc Check
        if (r.entryTime && r.exitTime) {
            const [h1, m1] = r.entryTime.split(':').map(Number);
            const [h2, m2] = r.exitTime.split(':').map(Number);
            const minutes = (h2 * 60 + m2) - (h1 * 60 + m1);
            console.log(`Calculated Duration (Manual): ${minutes} mins`);
        }
    });

    process.exit();
};

debugAttendance();
