const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
        console.log('Connected.');

        const mobile = '9999988888';
        const name = 'Verification Student';

        // 1. Delete existing test user if any
        await User.deleteOne({ mobile });

        // 2. Create student without email
        console.log('Creating student without email...');
        const student = await User.create({
            name,
            mobile,
            email: undefined, // Simulating null/missing email
            password: mobile, // Default password
            isActive: true
        });
        console.log('Student created:', student.name, 'Email:', student.email);

        // 3. Verify Login Logic (Manual simulation)
        console.log('Verifying login logic simulation...');
        const identifier = mobile;
        const foundUser = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { mobile: identifier }
            ]
        }).select('+password');

        if (foundUser) {
            console.log('User found by mobile:', foundUser.name);
            const isMatch = await foundUser.comparePassword(mobile);
            console.log('Password match:', isMatch);
        } else {
            console.log('User NOT found by mobile!');
        }

        // 4. Try creating another student without email (should work due to sparse index)
        const mobile2 = '7777766666';
        await User.deleteOne({ mobile: mobile2 });
        console.log('Creating second student without email...');
        const student2 = await User.create({
            name: 'Verification 2',
            mobile: mobile2,
            email: undefined,
            password: mobile2,
            isActive: true
        });
        console.log('Second student created successfully.');

        // Cleanup
        await User.deleteOne({ mobile });
        await User.deleteOne({ mobile: mobile2 });
        console.log('Test completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
