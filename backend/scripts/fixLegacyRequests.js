const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Seat = require('../models/Seat');
const User = require('../models/User');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Request = require('../models/Request');

const fixLegacyRequests = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all requests with empty/missing currentData
        const brokenRequests = await Request.find({
            $or: [
                { currentData: { $exists: false } },
                { currentData: {} },
                { 'currentData.seatNumber': { $exists: false } }
            ],
            type: { $in: ['shift', 'seat_change'] },
            status: 'pending'
        }).populate('student');

        console.log(`\n📋 Found ${brokenRequests.length} requests with missing currentData\n`);

        for (const request of brokenRequests) {
            console.log(`\n🔧 Fixing request for ${request.student.name} (${request.type})...`);

            // Find the student's active seat
            const seat = await Seat.findOne({
                'assignments.student': request.student._id,
                'assignments.status': 'active'
            }).populate('assignments.shift');

            if (seat) {
                const assignment = seat.assignments.find(a =>
                    a.student.toString() === request.student._id.toString() && a.status === 'active'
                );

                let shiftId = null;
                if (assignment) {
                    if (assignment.shift) {
                        shiftId = assignment.shift._id || assignment.shift;
                    } else if (assignment.legacyShift) {
                        shiftId = assignment.legacyShift;
                    } else if (assignment.type === 'full_day') {
                        shiftId = 'full';
                    }
                }

                // Update the request
                request.currentData = {
                    seatNumber: seat.number,
                    shift: shiftId
                };

                // If it's a seat_change request, also populate seatId
                if (request.type === 'seat_change') {
                    request.currentData.seatId = seat._id;
                    request.currentData.floor = seat.floor?.name || 'Unknown';
                    request.currentData.room = seat.room?.name || 'Unknown';
                }

                await request.save();
                console.log(`   ✅ Updated: Seat ${seat.number}, Shift ${shiftId || 'N/A'}`);
            } else {
                console.log(`   ⚠️  No active seat found for ${request.student.name}`);
            }
        }

        console.log('\n🎉 All legacy requests have been fixed!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB\n');
    }
};

fixLegacyRequests();
