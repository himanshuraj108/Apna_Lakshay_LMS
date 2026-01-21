require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // Clear existing data
        await User.deleteMany();
        await Seat.deleteMany();
        await Room.deleteMany();
        await Floor.deleteMany();
        console.log('🗑️  Cleared existing data');

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin',
            password: 'admin123',
            role: 'admin'
        });
        console.log('👤 Admin created (email: admin, password: admin123)');

        // Create floors
        const groundFloor = await Floor.create({ name: 'Ground Floor', level: 0, rooms: [] });
        const firstFloor = await Floor.create({ name: 'First Floor', level: 1, rooms: [] });
        const secondFloor = await Floor.create({ name: 'Second Floor', level: 2, rooms: [] });
        console.log('🏢 Floors created');

        // Ground Floor: 1 Room with 20 Seats
        const groundRoom = await Room.create({
            name: 'Room 1',
            floor: groundFloor._id,
            seats: []
        });

        const groundSeats = [];
        for (let i = 1; i <= 20; i++) {
            const seat = await Seat.create({
                number: `G-${i}`,
                room: groundRoom._id,
                floor: groundFloor._id,
                isOccupied: false,
                basePrices: {
                    day: 800,
                    night: 800,
                    full: 1200
                }
            });
            groundSeats.push(seat._id);
        }

        groundRoom.seats = groundSeats;
        await groundRoom.save();

        groundFloor.rooms = [groundRoom._id];
        await groundFloor.save();

        console.log('✅ Ground Floor: 1 Room, 20 Seats');

        // First Floor: Room 1 (7 seats), Room 2 (12 seats)
        const firstRoom1 = await Room.create({
            name: 'Room 1',
            floor: firstFloor._id,
            seats: []
        });

        const firstRoom1Seats = [];
        for (let i = 1; i <= 7; i++) {
            const seat = await Seat.create({
                number: `F1-R1-${i}`,
                room: firstRoom1._id,
                floor: firstFloor._id,
                isOccupied: false,
                basePrices: {
                    day: 800,
                    night: 800,
                    full: 1200
                }
            });
            firstRoom1Seats.push(seat._id);
        }

        firstRoom1.seats = firstRoom1Seats;
        await firstRoom1.save();

        const firstRoom2 = await Room.create({
            name: 'Room 2',
            floor: firstFloor._id,
            seats: []
        });

        const firstRoom2Seats = [];
        for (let i = 1; i <= 12; i++) {
            const seat = await Seat.create({
                number: `F1-R2-${i}`,
                room: firstRoom2._id,
                floor: firstFloor._id,
                isOccupied: false,
                basePrices: {
                    day: 800,
                    night: 800,
                    full: 1200
                }
            });
            firstRoom2Seats.push(seat._id);
        }

        firstRoom2.seats = firstRoom2Seats;
        await firstRoom2.save();

        firstFloor.rooms = [firstRoom1._id, firstRoom2._id];
        await firstFloor.save();

        console.log('✅ First Floor: 2 Rooms (7 + 12 seats)');

        // Second Floor: 1 Room with 5 Seats
        const secondRoom = await Room.create({
            name: 'Room 1',
            floor: secondFloor._id,
            seats: []
        });

        const secondSeats = [];
        for (let i = 1; i <= 5; i++) {
            const seat = await Seat.create({
                number: `F2-${i}`,
                room: secondRoom._id,
                floor: secondFloor._id,
                isOccupied: false,
                basePrices: {
                    day: 800,
                    night: 800,
                    full: 1200
                }
            });
            secondSeats.push(seat._id);
        }

        secondRoom.seats = secondSeats;
        await secondRoom.save();

        secondFloor.rooms = [secondRoom._id];
        await secondFloor.save();

        console.log('✅ Second Floor: 1 Room, 5 Seats');

        console.log('\n🎉 Seed data created successfully!');
        console.log('\n📊 Summary:');
        console.log('   - Ground Floor: 1 Room, 20 Seats');
        console.log('   - First Floor: 2 Rooms (7 + 12 = 19 Seats)');
        console.log('   - Second Floor: 1 Room, 5 Seats');
        console.log('   - Total: 44 Seats');
        console.log('\n👤 Admin Login:');
        console.log('   Email: admin');
        console.log('   Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
