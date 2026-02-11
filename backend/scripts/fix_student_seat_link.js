const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixLink = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('No Mongo URI');
        await mongoose.connect(uri);
        console.log('✅ Connected DB');

        const studentId = '698982670bc2aae7b81e5186';
        const targetSeatId = '697eaae18dd3a14b5db275a0';

        const user = await User.findById(studentId);
        if (!user) throw new Error('User not found');

        console.log(`Current Seat Link: ${user.seat}`);
        user.seat = targetSeatId;
        await user.save();
        console.log(`✅ Updated User Seat Link to: ${user.seat}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

fixLink();
