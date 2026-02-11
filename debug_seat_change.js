const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Seat = require('../backend/models/Seat');
const Request = require('../backend/models/Request');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const checkStudentState = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'himanshuraj48512@gmail.com'; // From user report
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found');
            return;
        }
        console.log(`👤 User found: ${user.name} (${user._id})`);

        // 1. Check Requests
        const requests = await Request.find({ student: user._id }).sort({ createdAt: -1 }).limit(3);
        console.log('\n📜 Recent Requests:');
        requests.forEach(r => {
            console.log(`- Type: ${r.type}, Status: ${r.status}, ID: ${r._id}`);
            console.log(`  Asked for Seat: ${r.requestedData?.seatNumber || r.requestedData?.requestedSeatId}`);
            console.log(`  Asked for Shift: ${r.requestedData?.shift || r.requestedData?.requestedShift}`);
        });

        // 2. Check Assignments
        const seats = await Seat.find({ 'assignments.student': user._id });
        console.log('\n💺 Seat Assignments:');
        if (seats.length === 0) console.log('No seats found with assignments for this user.');

        seats.forEach(s => {
            console.log(`Seat ${s.number} (${s._id}):`);
            const userAssignments = s.assignments.filter(a => a.student.toString() === user._id.toString());
            userAssignments.forEach(a => {
                console.log(`  - Status: ${a.status}, Shift: ${a.shift}, Type: ${a.type}, Assigned: ${a.assignedAt}`);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkStudentState();
