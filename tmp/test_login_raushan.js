const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function testLogin() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const identifier = '7739974235';
        const password = '7739974235';
        
        console.log(`Searching for user with identifier: ${identifier}`);
        let user = await User.findOne({ 
            $or: [
                { email: identifier.toLowerCase() }, 
                { mobile: identifier }
            ] 
        }).select('+password');
        
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }
        
        console.log('✅ User found. Comparing password...');
        const isMatch = await user.comparePassword(password);
        console.log('Password matches?', isMatch);
        
        if (!isMatch) {
            console.log('❌ Incorrect password');
            process.exit(1);
        }
        
        console.log('Generating token...');
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        console.log('✅ Token generated successfully');
        
        console.log('Updating user status...');
        user.lastLogin = Date.now();
        user.isLoggedIn = true;
        // Check if saving the user causes a crash (e.g. index duplication)
        try {
            await user.save();
            console.log('✅ User saved successfully');
        } catch (saveError) {
            console.error('❌ ERROR DURING USER.SAVE():', saveError.message);
            if (saveError.code === 11000) {
               console.log('Index conflict detected:', JSON.stringify(saveError.keyPattern));
            }
        }
        
        console.log('--- DIAGNOSTIC COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ CRITICAL ERROR IN AUTH FLOW:', err);
        process.exit(1);
    }
}

testLogin();
