const mongoose = require('mongoose');
const User = require('../models/User');
const Seat = require('../models/Seat');
const Request = require('../models/Request');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const fs = require('fs');

const checkStudentState = async () => {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MongoDB URI not found in environment variables.');
        }
        await mongoose.connect(uri);
        log('✅ Connected to MongoDB');

        const email = 'himanshuraj48512@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            log('❌ User not found');
            fs.writeFileSync('debug_output.txt', output);
            return;
        }
        log(`👤 User found: ${user.name} (${user._id})`);

        // 1. Check Requests
        const requests = await Request.find({ student: user._id }).sort({ createdAt: -1 }).limit(3);
        log(`\n📜 Recent Requests (${requests.length} found):`);
        requests.forEach(r => {
            log(`- Type: ${r.type}, Status: ${r.status}, ID: ${r._id}, Created: ${r.createdAt}`);
            log(`  Requested Data: ${JSON.stringify(r.requestedData)}`);
        });

        // 2. Check Assignments
        const seats = await Seat.find({ 'assignments.student': user._id });
        log(`\n💺 Seat Assignments (All time):`);
        if (seats.length === 0) log('No seats found with assignments for this user.');

        seats.forEach(s => {
            log(`Seat ${s.number} (${s._id}):`);
            const userAssignments = s.assignments.filter(a => a.student.toString() === user._id.toString());
            userAssignments.forEach(a => {
                log(`  - Status: ${a.status}, Shift: ${a.shift}, Type: ${a.type}, Assigned: ${a.assignedAt}`);
            });
        });

        fs.writeFileSync('debug_output.txt', output);

    } catch (error) {
        log('Error: ' + error.message);
        fs.writeFileSync('debug_output.txt', output);
    } finally {
        await mongoose.disconnect();
    }
};

checkStudentState();
