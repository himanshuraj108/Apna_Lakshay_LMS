// Quick script to update the recently registered student to have registrationSource: 'self'
// Run with: node scripts/updateSelfRegisteredStudent.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const updateStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the most recently created student (likely the one just registered)
        const recentStudent = await User.findOne({ role: 'student' }).sort({ createdAt: -1 });

        if (!recentStudent) {
            console.log('No student found');
            return;
        }

        console.log('Found student:', recentStudent.name, recentStudent.email);
        console.log('Current registrationSource:', recentStudent.registrationSource);

        // Update to self if it's undefined or admin
        const result = await User.updateOne(
            { _id: recentStudent._id },
            { $set: { registrationSource: 'self' } }
        );

        console.log('Updated student registrationSource to "self"');
        console.log('Modified count:', result.modifiedCount);

        const updated = await User.findById(recentStudent._id);
        console.log('Verified registrationSource:', updated.registrationSource);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateStudent();
