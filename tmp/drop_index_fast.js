const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function dropEmailIndex() {
    let client;
    try {
        console.log('Connecting...');
        client = await mongoose.connect(process.env.MONGODB_URI);
        const collection = mongoose.connection.collection('users');
        
        console.log('Dropping email_1 index...');
        await collection.dropIndex('email_1');
        console.log('Successfully dropped email_1 index.');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

dropEmailIndex();
