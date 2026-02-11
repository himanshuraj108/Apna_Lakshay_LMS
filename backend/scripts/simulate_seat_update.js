const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const updateSeat = async () => {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('MongoDB URI not found');

        await mongoose.connect(uri);
        log('✅ Connected DB');

        const studentId = '698982670bc2aae7b81e5186';
        const currentSeatId = '6982badde00f5f22d34eacd7';
        const targetSeatId = '697eaae18dd3a14b5db275a0';
        const targetShiftId = '697913514853bb9fe17151dd';

        // 1. De-allocate current
        log(`Finding current seat ${currentSeatId}...`);
        const currentSeat = await Seat.findById(currentSeatId);
        if (!currentSeat) throw new Error('Current seat not found');

        const assignmentIndex = currentSeat.assignments.findIndex(
            a => a.student.toString() === studentId && a.status === 'active'
        );

        if (assignmentIndex !== -1) {
            log('Found active assignment. Expiring it...');
            currentSeat.assignments[assignmentIndex].status = 'expired';
            // Validation logic from controller
            const remainingActive = currentSeat.assignments.filter(a => a.status === 'active');
            if (remainingActive.length === 0) {
                currentSeat.isOccupied = false;
            }
            await currentSeat.save();
            log('✅ Current seat saved.');
        } else {
            log('⚠️ No active assignment on current seat (Already expired?)');
        }

        // 2. Allocate new
        log(`Finding target seat ${targetSeatId}...`);
        const targetSeat = await Seat.findById(targetSeatId);
        if (!targetSeat) throw new Error('Target seat not found');

        log('Pushing new assignment...');
        targetSeat.assignments.push({
            student: studentId,
            shift: targetShiftId,
            status: 'active',
            assignedAt: new Date(),
            type: 'specific'
        });
        targetSeat.isOccupied = true;

        await targetSeat.save();
        log('✅ Target seat saved. Update complete.');

        fs.writeFileSync('simulation_output.txt', output);

    } catch (err) {
        log('❌ Error: ' + err.message);
        if (err.errors) log('Validation Errors: ' + JSON.stringify(err.errors));
        fs.writeFileSync('simulation_output.txt', output);
    } finally {
        await mongoose.disconnect();
    }
};

updateSeat();
