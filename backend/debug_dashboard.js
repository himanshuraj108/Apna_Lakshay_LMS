const mongoose = require('mongoose');
const User = require('./models/User');
const Seat = require('./models/Seat');
const Fee = require('./models/Fee');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const debugDashboard = async () => {
    await connectDB();

    console.log('\n--- Occupied Seats Analysis ---');
    const seats = await Seat.find({ 'assignments.status': 'active' }).populate('assignments.student');
    console.log(`Found ${seats.length} seats with active assignments.`);

    seats.forEach(seat => {
        const activeAssignments = seat.assignments.filter(a => a.status === 'active');
        activeAssignments.forEach(a => {
            console.log(`Seat ${seat.number}: Assigned to Student ID ${a.student?._id} (${a.student?.name || 'UNKNOWN/DELETED'})`);
            // Check if student is null (meaning deleted but not cleaned up)
            if (!a.student) {
                console.log(`  CRITICAL: Active assignment to non-existent student!`);
            }
        });
    });

    console.log('\n--- Student Analysis ---');
    const students = await User.find({ role: 'student' });
    console.log(`Total Students in DB: ${students.length}`);
    students.forEach(s => {
        console.log(`Student: ${s.name} (${s._id}), Active: ${s.isActive}, Seat: ${s.seat}`);
    });

    console.log('\n--- Fees Analysis ---');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    console.log(`Current Time (Server): ${new Date().toISOString()}`);
    console.log(`Filtering for Month: ${currentMonth}, Year: ${currentYear}`);

    const allFees = await Fee.find({});
    console.log(`Total Fee Records: ${allFees.length}`);

    allFees.forEach(f => {
        console.log(`Fee ID: ${f._id}, Student: ${f.student}, Amount: ${f.amount}, Status: ${f.status}, Month: ${f.month}, Year: ${f.year}`);
    });

    // Aggregation Test
    console.log('\n--- Aggregation Test (Simulating AdminController) ---');

    // Check both modes
    for (const mode of ['default', 'custom']) {
        console.log(`\nTesting Mode: ${mode}`);

        // Count Students
        const studentCount = await User.countDocuments({
            role: 'student',
            isActive: true,
            $or: [
                { systemMode: mode },
                ...(mode === 'default' ? [{ systemMode: { $exists: false } }] : [])
            ]
        });
        console.log(`Student Count (${mode}): ${studentCount}`);

        // Count Occupied Seats
        const occupiedSeatsAgg = await Seat.aggregate([
            { $unwind: '$assignments' },
            { $match: { 'assignments.status': 'active' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignments.student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    $or: [
                        { 'studentInfo.systemMode': mode },
                        ...(mode === 'default' ? [{ 'studentInfo.systemMode': { $exists: false } }] : [])
                    ]
                }
            },
            { $count: 'count' }
        ]);
        console.log(`Occupied Seats Agg Count (${mode}): ${occupiedSeatsAgg[0]?.count || 0}`);
    }

    // Dump active assignments again concisely
    console.log('\n--- Detailed Active Assignments Dump ---');
    const seatsDump = await Seat.find({ 'assignments.status': 'active' });
    seatsDump.forEach(s => {
        console.log(`Seat ${s.number} (_id: ${s._id}) Assignments:`);
        console.log(JSON.stringify(s.assignments, null, 2));
    });

    // Raw Aggregation (No Mode Filter)
    console.log('\n--- Raw Aggregation (No Filter) ---');
    const rawAgg = await Seat.aggregate([
        { $unwind: '$assignments' },
        { $match: { 'assignments.status': 'active' } },
        {
            $lookup: {
                from: 'users',
                localField: 'assignments.student',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        { $unwind: '$studentInfo' },
        { $count: 'count' }
    ]);
    console.log(`Raw Occupied Count: ${rawAgg[0]?.count || 0}`);

    process.exit();
};

debugDashboard();
