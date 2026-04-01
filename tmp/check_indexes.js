const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const indexes = await User.collection.getIndexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));
        
        // Find users with no email to see if there's more than one
        const usersNoEmail = await User.find({ $or: [{ email: null }, { email: { $exists: false } }] });
        console.log(`Number of users without email: ${usersNoEmail.length}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to check indexes:', err);
        process.exit(1);
    }
}

checkIndexes();
