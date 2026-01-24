const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixRahulShiftRequest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define schemas inline to avoid import issues
        const Seat = mongoose.model('Seat');
        const User = mongoose.model('User');
        const Request = mongoose.model('Request');

        // Find Rahul
        const rahul = await User.findOne({ email: 'himanshurajstm40@gmail.com' });
        if (!rahul) {
            console.log('❌ Rahul not found');
            return;
        }
        console.log(`✅ Found Rahul: ${rahul.name}`);

        // Find his shift change request
        const request = await Request.findOne({
            student: rahul._id,
            type: 'shift',
            status: 'pending'
        });

        if (!request) {
            console.log('❌ No pending shift request found');
            return;
        }
        console.log('✅ Found pending shift request');

        // Find his current seat
        const seat = await Seat.findOne({
            'assignments.student': rahul._id,
            'assignments.status': 'active'
        }).populate('assignments.shift');

        if (!seat) {
            console.log('❌ No active seat found');
            return;
        }
        console.log(`✅ Found active seat: ${seat.number}`);

        // Find his assignment
        const assignment = seat.assignments.find(a =>
            a.student.toString() === rahul._id.toString() && a.status === 'active'
        );

        let shiftId = null;
        if (assignment) {
            if (assignment.shift) {
                shiftId = assignment.shift._id || assignment.shift;
            } else if (assignment.legacyShift) {
                shiftId = assignment.legacyShift;
            } else if (assignment.type === 'full_day') {
                shiftId = 'full';
            }
        }

        // Update request
        request.currentData = {
            seatNumber: seat.number,
            shift: shiftId
        };

        await request.save();
        console.log(`✅ Updated request with seat: ${seat.number}, shift: ${shiftId || 'N/A'}`);
        console.log('\n🎉 SUCCESS! Request has been fixed\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB\n');
    }
}

// Load models first
require('../models/Seat');
require('../models/User');
require('../models/Request');
require('../models/Shift');
require('../models/Floor');
require('../models/Room');

fixRahulShiftRequest();
