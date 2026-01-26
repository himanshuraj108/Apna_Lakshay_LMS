const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// ========== ADMIN ENDPOINTS ==========

// @desc    Get all rooms (Admin only)
// @route   GET /api/chat/admin/rooms
exports.getAllRoomsAdmin = async (req, res) => {
    try {
        const rooms = await ChatRoom.find({})
            .populate('participants', 'name email studentId profileImage')
            .populate('createdBy', 'name')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Admin Get Rooms Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get system setting by key
// @route   GET /api/chat/admin/settings/:key
exports.getSystemSetting = async (req, res) => {
    try {
        const SystemSetting = require('../models/SystemSetting');
        const { key } = req.params;

        const setting = await SystemSetting.findOne({ key });

        res.status(200).json({
            success: true,
            value: setting ? setting.value : true // Default to true if not found
        });
    } catch (error) {
        console.error('Get System Setting Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle room disable status
// @route   PATCH /api/chat/admin/rooms/:roomId/disable
exports.toggleDisableRoom = async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        room.isDisabled = !room.isDisabled;
        await room.save();

        res.status(200).json({
            success: true,
            message: `Room ${room.isDisabled ? 'disabled' : 'enabled'} successfully`,
            room
        });
    } catch (error) {
        console.error('Toggle Disable Room Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle block user from chat
// @route   PATCH /api/chat/admin/users/:userId/block
exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Prevent admin from blocking themselves
        if (req.params.userId === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You cannot block yourself'
            });
        }

        user.isChatBlocked = !user.isChatBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${user.isChatBlocked ? 'blocked' : 'unblocked'} from chat`,
            isChatBlocked: user.isChatBlocked
        });
    } catch (error) {
        console.error('Toggle Block User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete message (Admin)
// @route   DELETE /api/chat/admin/messages/:messageId
exports.deleteMessageAdmin = async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.messageId);
        res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete room (Admin)
// @route   DELETE /api/chat/admin/rooms/:roomId
exports.deleteRoomAdmin = async (req, res) => {
    try {
        const room = await ChatRoom.findById(req.params.roomId);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        // Delete all messages in room
        await Message.deleteMany({ room: room._id });
        // Delete room
        await ChatRoom.findByIdAndDelete(req.params.roomId);

        res.status(200).json({ success: true, message: 'Room and history deleted permanently' });
    } catch (error) {
        console.error('Delete Room Admin Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get room messages (Admin view)
// @route   GET /api/chat/admin/rooms/:roomId/messages
exports.getRoomMessagesAdmin = async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.roomId })
            .populate('sender', 'name profileImage isChatBlocked')
            .populate('replyTo')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Get Messages Admin Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// @desc    Get all students with chat status (Admin)
// @route   GET /api/chat/admin/users
// @desc    Send message (Admin)
// @route   POST /api/chat/admin/messages
exports.sendMessageAdmin = async (req, res) => {
    try {
        const { roomId, content } = req.body;
        const userId = req.user.id; // Admin ID

        if (!content || !roomId) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        const room = await ChatRoom.findById(roomId);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        // Admin can send to any room types (public, group, private) if authorized as admin
        // Note: For private chats, admin sending a message might be intrusive if not a participant, 
        // but user requested "in public chats only Admin can also send a message".
        // We will assume this capability applies generally for "Monitoring" purposes or specific public intervention.

        const message = await Message.create({
            room: roomId,
            sender: userId,
            content,
            type: 'text',
        });

        await message.populate('sender', 'name profileImage');

        // Update room
        room.lastMessage = message._id;
        room.lastMessageAt = new Date();
        await room.save();

        // Broadcast via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`room:${roomId}`).emit('new-message', message);
        }

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('Admin Send Message Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all students with chat status (Admin)
// @route   GET /api/chat/admin/users
exports.getAllChatUsersAdmin = async (req, res) => {
    try {
        const { filter } = req.query; // 'active_chat_only'

        let students = await User.find({ role: 'student' })
            .select('name studentId email profileImage isChatBlocked seat isActive address registrationSource shift seatAssignedAt createdAt')
            .populate({
                path: 'seat',
                select: 'number assignments',
                populate: {
                    path: 'assignments.shift',
                    select: 'name startTime endTime'
                }
            })
            .sort({ name: 1 })
            .lean();

        // Manual processing to attach proper shift info from seat assignments
        students = await Promise.all(students.map(async (student) => {
            let shiftName = 'N/A';
            let shiftDetails = null;

            // 1. Check direct shift (if exists)
            if (student.shift) {
                shiftName = student.shift;
            }

            // 2. Check seat assignments
            if (student.seat && student.seat.assignments) {
                // Find active assignment for this student
                const activeAssignment = student.seat.assignments.find(a =>
                    (a.student.toString() === student._id.toString() || a.student._id?.toString() === student._id.toString()) &&
                    a.status === 'active'
                );

                if (activeAssignment) {
                    if (activeAssignment.shift && activeAssignment.shift.name) {
                        shiftName = activeAssignment.shift.name;
                        shiftDetails = activeAssignment.shift;
                    } else if (activeAssignment.legacyShift) {
                        shiftName = activeAssignment.legacyShift.charAt(0).toUpperCase() + activeAssignment.legacyShift.slice(1);
                    }
                }
            }

            // Check if user is in any chat (participants)
            let isInAnyChat = false;
            if (filter === 'active_chat_only') {
                const count = await ChatRoom.countDocuments({ participants: student._id });
                isInAnyChat = count > 0;
            }

            return {
                ...student,
                shift: shiftName,
                shiftDetails,
                isInAnyChat
            };
        }));

        if (filter === 'active_chat_only') {
            students = students.filter(s => s.isInAnyChat);
        }

        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error('Get All Chat Users Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle Global Chat System
// @route   POST /api/chat/admin/global-settings
exports.toggleGlobalChat = async (req, res) => {
    try {
        const { enabled } = req.body;
        const SystemSetting = require('../models/SystemSetting');

        await SystemSetting.findOneAndUpdate(
            { key: 'chat_enabled' },
            { value: enabled },
            { upsert: true, new: true }
        );

        // Notify via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('global-chat-status', { enabled });
        }

        res.json({ success: true, message: `Global chat ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Toggle Global Chat Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Purge All Messages (Universal Delete)
// @route   DELETE /api/chat/admin/all-messages
exports.purgeAllMessages = async (req, res) => {
    try {
        // Delete ALL messages
        await Message.deleteMany({});

        // Reset lastMessage in all rooms
        await ChatRoom.updateMany({}, {
            lastMessage: null,
            lastMessageAt: new Date(0) // Reset to epoch
        });

        res.json({ success: true, message: 'All chat messages permanently deleted' });
    } catch (error) {
        console.error('Purge All Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Factory Reset (Delete All Data)
// @route   DELETE /api/chat/admin/factory-reset
exports.performFactoryReset = async (req, res) => {
    try {
        // 1. Delete ALL Messages
        await Message.deleteMany({});

        // 2. Delete ALL Chat Rooms
        await ChatRoom.deleteMany({});

        // 3. Recreate Default Public Room
        const publicRoom = await ChatRoom.create({
            name: 'Study Group',
            type: 'public',
            participants: [], // Public room doesn't strictly need participants list if logic allows all
            createdBy: req.user.id // Admin user who triggered factory reset
        });

        // 4. Reset Global Settings (Enable Chat)
        const SystemSetting = require('../models/SystemSetting');
        await SystemSetting.findOneAndUpdate(
            { key: 'chat_enabled' },
            { value: true },
            { upsert: true }
        );

        // Notify via socket to reload client state
        const io = req.app.get('io');
        if (io) {
            io.emit('factory-reset', { publicRoomId: publicRoom._id });
        }

        res.json({ success: true, message: 'FACTORY RESET COMPLETED. All chat data wiped.' });
    } catch (error) {
        console.error('Factory Reset Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
