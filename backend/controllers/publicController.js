const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Seat = require('../models/Seat');
const Settings = require('../models/Settings');

// @desc    Get all seats with availability (public view)
// @route   GET /api/public/seats
exports.getSeats = async (req, res) => {
    try {
        // Check system status
        const settings = await Settings.findOne();
        // Allow if either 'default' (legacy) or 'custom' (dynamic) mode is active.
        // Only show maintenance if BOTH are disabled (or if settings exist but strictly specific modes are off).
        // Assuming we want to show seats if at least one mode is active.
        if (settings && settings.activeModes) {
            const isActive = settings.activeModes.custom || settings.activeModes.default;
            if (!isActive) {
                return res.status(200).json({
                    success: true,
                    maintenance: true,
                    message: 'System is under maintenance'
                });
            }
        }

        const floors = await Floor.find()
            .populate({
                path: 'rooms',
                populate: {
                    path: 'seats',
                    populate: {
                        path: 'assignments.shift',
                        model: 'Shift'
                    }
                }
            })
            .sort({ level: 1 });

        // Format response with all needed fields for box layout
        const formattedFloors = floors.map(floor => ({
            _id: floor._id,
            name: floor.name,
            level: floor.level,
            rooms: floor.rooms.map(room => ({
                _id: room._id,
                name: room.name,
                dimensions: room.dimensions,
                doorPosition: room.doorPosition,
                seats: room.seats.map(seat => {
                    // Filter active assignments
                    const activeAssignments = seat.assignments?.filter(a => a.status === 'active') || [];

                    // Determine occupancy and active shift
                    // 1. Check for legacy 'Full Day' or explicit type
                    let fullDayObj = activeAssignments.find(a => a.type === 'full_day' || a.legacyShift === 'full');

                    // 2. Check for Dynamic 'Full Shift' (Shift Object with name containing 'Full' or 'Full Day')
                    if (!fullDayObj) {
                        const dynamicFullShift = activeAssignments.find(a => {
                            if (a.shift && a.shift.name) {
                                return a.shift.name.toLowerCase().includes('full');
                            }
                            return false;
                        });
                        if (dynamicFullShift) {
                            fullDayObj = dynamicFullShift;
                        }
                    }

                    // Determine occupancy status
                    let occupancyStatus = 'vacant'; // vacant, partial, occupied
                    let displayShift = null;

                    if (fullDayObj) {
                        occupancyStatus = 'occupied';
                        // Display correct shift name
                        if (fullDayObj.shift && fullDayObj.shift.name) {
                            displayShift = fullDayObj.shift.name;
                        } else {
                            displayShift = 'Full Day';
                        }
                    } else if (activeAssignments.length > 0) {
                        occupancyStatus = 'partial';
                        // Show first active shift as primary display, but frontend should show all
                        const active = activeAssignments[0];
                        if (active.shift) {
                            displayShift = active.shift.name || active.shift;
                        } else if (active.legacyShift) {
                            displayShift = active.legacyShift;
                        }
                    }

                    return {
                        _id: seat._id,
                        number: seat.number,
                        // Legacy field for backward compatibility (true if ANY occupancy)
                        isOccupied: occupancyStatus !== 'vacant',
                        status: occupancyStatus, // New field for partial support
                        isFullyBlocked: !!fullDayObj,
                        activeShifts: activeAssignments.map(a => (a.shift && a.shift._id) ? a.shift._id : a.legacyShift),
                        shift: displayShift,
                        position: seat.position,
                        basePrices: seat.basePrices,
                        shiftPrices: seat.shiftPrices
                    };
                })
            }))
        }));

        res.status(200).json({
            success: true,
            floors: formattedFloors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all active shifts (public)
// @route   GET /api/public/shifts
exports.getShifts = async (req, res) => {
    try {
        const shifts = await require('../models/Shift').find({ isActive: true });
        res.status(200).json({
            success: true,
            shifts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Check if email is available
// @route   GET /api/public/check-email
exports.checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const User = require('../models/User');
        const existingUser = await User.findOne({ email });

        res.json({
            success: true,
            available: !existingUser
        });

    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email availability'
        });
    }
};

// @desc    Student self-registration
// @route   POST /api/public/register
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, mobile, address } = req.body;

        // Validation
        if (!name || !email || !mobile || !address) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, mobile, address'
            });
        }

        // Check if user already exists
        const User = require('../models/User');
        const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Mobile number already registered'
            });
        }

        // Generate random password
        const generatePassword = () => {
            const length = 8;
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let password = '';
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return password;
        };

        const plainPassword = generatePassword();

        // Create student user
        const student = await User.create({
            name,
            email,
            mobile,
            address,
            password: plainPassword,
            role: 'student',
            isActive: true, // Auto-activate so they appear in Pending Allocation
            registrationSource: 'self'
        });

        // Send credentials email
        const emailService = require('../services/emailService');
        try {
            await emailService.sendCredentialsEmail(name, email, plainPassword);
            console.log(`✅ Credentials email sent successfully to ${email}`);
        } catch (emailError) {
            console.error('❌ Failed to send credentials email:');
            console.error('Error:', emailError.message);
            console.error('Stack:', emailError.stack);
            console.error('Code:', emailError.code);
            // Continue even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Login credentials have been sent to your email.',
            student: {
                name: student.name,
                email: student.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};
