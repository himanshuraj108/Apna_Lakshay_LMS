const mongoose = require('mongoose');
const User = require('../models/User');
const Seat = require('../models/Seat'); // Ensure models are registered
const Shift = require('../models/Shift');
const Room = require('../models/Room');
const Floor = require('../models/Floor');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugPopulate = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('No Mongo URI');
        await mongoose.connect(uri);
        console.log('✅ Connected DB');

        const studentEmail = 'himanshuraj48512@gmail.com';
        const student = await User.findOne({ email: studentEmail });

        if (!student) {
            console.log('User not found');
            return;
        }
        console.log(`User: ${student.name} (${student._id})`);

        // Perform the populate as done in adminController
        const populatedUser = await User.findById(student._id)
            .populate({
                path: 'seat',
                populate: {
                    path: 'room floor assignments.shift'
                }
            })
            .lean();

        if (populatedUser.seat) {
            console.log(`Seat: ${populatedUser.seat.number}`);
            console.log('Assignments:', JSON.stringify(populatedUser.seat.assignments, null, 2));

            const active = populatedUser.seat.assignments.find(a => a.status === 'active' && a.student.toString() === student._id.toString());
            if (active) {
                console.log('Active Assignment Shift:', active.shift);
                if (typeof active.shift === 'object') {
                    console.log('Shift Name:', active.shift.name);
                } else {
                    console.log('Shift is not populated properly (Is it ID?):', active.shift);
                }
            } else {
                console.log('No active assignment found for this student on this seat.');
            }
        } else {
            console.log('No seat populated.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

debugPopulate();
