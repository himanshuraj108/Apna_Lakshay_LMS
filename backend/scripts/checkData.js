require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const floors = await Floor.find().populate({
            path: 'rooms',
            populate: {
                path: 'seats'
            }
        });

        console.log(`Floors found: ${floors.length}`);
        floors.forEach(f => {
            console.log(`Floor: ${f.name} (Level ${f.level})`);
            console.log(`  Rooms: ${f.rooms.length}`);
            f.rooms.forEach(r => {
                console.log(`    Room: ${r.name}`);
                console.log(`      Seats: ${r.seats.length}`);
                if (r.seats.length > 0) {
                    console.log(`      First Seat: ${r.seats[0].number}`);
                }
            });
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
