const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function createTestStudent() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const mobile = '1234567890';
        await User.deleteOne({ mobile });
        
        const user = await User.create({
            name: 'Test Student Login',
            mobile: mobile,
            email: undefined,
            password: mobile, // Should be hashed by pre-save hook
            role: 'student',
            isActive: true
        });
        
        console.log('Test student created successfully.');
        console.log('Mobile/ID:', mobile);
        console.log('Password:', mobile);
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to create test student:', err);
        process.exit(1);
    }
}

createTestStudent();
