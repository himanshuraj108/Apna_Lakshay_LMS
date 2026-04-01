const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function fixIndexes() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');
        
        const collection = mongoose.connection.collection('users');
        
        console.log('Checking current indexes...');
        const indexes = await collection.indexes();
        const emailIndex = indexes.find(idx => idx.name === 'email_1');
        
        if (emailIndex) {
            console.log('Found existing email_1 index:', emailIndex);
            if (!emailIndex.sparse) {
                console.log('Index is NOT sparse. Dropping and recreating...');
                await collection.dropIndex('email_1');
                console.log('Index dropped successfully.');
                
                // Mongoose will automatically recreate the index based on the schema on the next operation
                // or we can force it:
                await User.createIndexes();
                console.log('Indexes recreated with sparse property.');
            } else {
                console.log('Index is already sparse. No action needed.');
            }
        } else {
            console.log('No email_1 index found. Mongoose will create it.');
            await User.createIndexes();
        }
        
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to fix indexes:', err);
        process.exit(1);
    }
}

fixIndexes();
