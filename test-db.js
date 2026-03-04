const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Object = require('mongoose');

dotenv.config({ path: './backend/.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Settings = require('./backend/models/Settings');

        let doc = await Settings.findOne();
        console.log('Current DB doc:', doc);

        if (doc) {
            console.log('Setting locationAttendance to false...');
            doc = await Settings.findOneAndUpdate(
                {},
                { $set: { locationAttendance: false } },
                { new: true, runValidators: true }
            );
            console.log('After update:', doc);
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

test();
