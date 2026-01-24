const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Seat = require('../models/Seat');
const User = require('../models/User');

const fixRahulSeat = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find Rahul by email
        const rahul = await User.findOne({ email: 'himanshurajstm40@gmail.com' });
        if (!rahul) {
            console.log('❌ Rahul not found');
            return;
        }
        console.log(`✅ Found Rahul: ${rahul.name} (${rahul._id})`);

        // Find G-2 seat (old seat)
        const oldSeat = await Seat.findOne({ number: 'G-2' });
        if (!oldSeat) {
            console.log('❌ G-2 seat not found');
            return;
        }
        console.log(`✅ Found old seat: ${oldSeat.number}`);

        // Find G-18 seat (new seat)
        const newSeat = await Seat.findOne({ number: 'G-18' });
        if (!newSeat) {
            console.log('❌ G-18 seat not found');
            return;
        }
        console.log(`✅ Found new seat: ${newSeat.number}`);

        // Find Rahul's active assignment on old seat
        const oldAssignment = oldSeat.assignments.find(a =>
            a.student.toString() === rahul._id.toString() && a.status === 'active'
        );

        if (oldAssignment) {
            console.log('✅ Found Rahul\'s assignment on G-2, marking as expired...');

            // Save shift info
            const shiftToMove = oldAssignment.shift;
            const legacyShiftToMove = oldAssignment.legacyShift;
            const typeToMove = oldAssignment.type;
            const priceToMove = oldAssignment.price;

            // Mark old assignment as expired
            oldAssignment.status = 'expired';
            await oldSeat.save();
            console.log('✅ Marked G-2 assignment as expired');

            // Create new assignment on G-18
            newSeat.assignments.push({
                student: rahul._id,
                shift: shiftToMove,
                legacyShift: legacyShiftToMove,
                type: typeToMove,
                status: 'active',
                price: priceToMove || 0,
                assignedAt: new Date()
            });
            await newSeat.save();
            console.log('✅ Created new assignment on G-18');

            // Update User reference
            rahul.seat = newSeat._id;
            await rahul.save();
            console.log('✅ Updated Rahul\'s seat reference to G-18');

            console.log('\n🎉 SUCCESS! Rahul has been moved from G-2 to G-18');
        } else {
            console.log('⚠️  No active assignment found on G-2, checking if already on G-18...');

            const newAssignment = newSeat.assignments.find(a =>
                a.student.toString() === rahul._id.toString() && a.status === 'active'
            );

            if (newAssignment) {
                console.log('✅ Rahul is already assigned to G-18, just updating user reference...');
                rahul.seat = newSeat._id;
                await rahul.save();
                console.log('✅ Updated user reference');
            } else {
                console.log('❌ No assignment found on either seat');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
};

fixRahulSeat();
