const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function diagnose() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const mobile = '7739974235';
        console.log(`Checking user with mobile: ${mobile}`);
        
        const user = await User.findOne({ mobile }).select('+password');
        
        if (!user) {
            console.log('❌ User NOT found in database.');
            process.exit(1);
        }
        
        console.log('✅ User found:');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Is Active:', user.isActive);
        console.log('Role:', user.role);
        
        // Check if password matches mobile
        const isMatch = await bcrypt.compare(mobile, user.password);
        console.log('Password is mobile number?', isMatch ? '✅ YES' : '❌ NO');
        
        if (!isMatch) {
            console.log('The student likely has a different password. Resetting to mobile number...');
            user.password = mobile;
            await user.save();
            console.log('✅ Password reset to mobile number successful.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

diagnose();
