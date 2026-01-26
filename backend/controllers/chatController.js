const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get user's accessible chat rooms
// @route   GET /api/chat/rooms
exports.getRooms = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all rooms where user is participant or it's public
        const rooms = await ChatRoom.find({
            $or: [
                { type: 'public', isActive: true },
                {
                    participants: userId,
                    hiddenFor: { $ne: userId },
                    $or: [
                        { isActive: true },
                        { type: 'private', isActive: false }
                    ]
                }
            ]
        })
            .populate('participants', 'name profileImage')
            .populate('createdBy', 'name')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Get Rooms Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create private 1-on-1 room
// @route   POST /api/chat/rooms/private
exports.createPrivateRoom = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const userId = req.user.id;

        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID required' });
        }

        // Check if room already exists
        const existingRoom = await ChatRoom.findOne({
            type: 'private',
            participants: { $all: [userId, recipientId], $size: 2 }
        });

        if (existingRoom) {
            // Unhide logic: if user tries to "create" an existing chat, unhide it for them
            if (existingRoom.hiddenFor && existingRoom.hiddenFor.includes(userId)) {
                existingRoom.hiddenFor = existingRoom.hiddenFor.filter(id => id.toString() !== userId.toString());
                await existingRoom.save();
            }
            return res.status(200).json({ success: true, room: existingRoom });
        }

        // Create new room
        const room = await ChatRoom.create({
            type: 'private',
            participants: [userId, recipientId],
            createdBy: userId,
            isActive: true
        });

        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('participants', 'name profileImage');

        res.status(201).json({
            success: true,
            room: populatedRoom
        });
    } catch (error) {
        console.error('Create Private Room Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create group room
// @route   POST /api/chat/rooms/group
exports.createGroupRoom = async (req, res) => {
    try {
        const { name, participantIds } = req.body;
        const userId = req.user.id;

        if (!name || !participantIds || participantIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Name and participants required' });
        }

        // Include creator in participants
        const allParticipants = [...new Set([userId, ...participantIds])];

        const room = await ChatRoom.create({
            type: 'group',
            name,
            participants: allParticipants,
            createdBy: userId,
            isActive: true
        });

        const populatedRoom = await ChatRoom.findById(room._id)
            .populate('participants', 'name profileImage')
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            room: populatedRoom
        });
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get messages for a room (paginated)
// @route   GET /api/chat/rooms/:id/messages
exports.getMessages = async (req, res) => {
    try {
        const { id: roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Check if user has access
        if (room.type !== 'public' && !room.participants.includes(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const messages = await Message.find({
            room: roomId,
            isDeleted: false
        })
            .populate('sender', 'name studentId profileImage role')
            .populate('mentions', 'name')
            .populate('replyTo')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Message.countDocuments({ room: roomId, isDeleted: false });

        res.status(200).json({
            success: true,
            messages: messages.reverse(), // Oldest first
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Get active students for mentions
// @route   GET /api/chat/students
exports.getActiveStudents = async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            isActive: true,
            isChatBlocked: false
        })
            .select('name profileImage')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Get Students Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Upload file (image/PDF)
// @route   POST /api/chat/upload
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/chat/${req.file.filename}`;
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';

        res.status(200).json({
            success: true,
            fileUrl,
            fileName: req.file.originalname,
            fileType
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload file' });
    }
};

// @desc    Hide chat for user (Delete for Me)
// @route   POST /api/chat/rooms/:roomId/hide
exports.hideRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await ChatRoom.findById(roomId);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        if (!room.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        // Add to hiddenFor if not present
        if (!room.hiddenFor.includes(userId)) {
            room.hiddenFor.push(userId);
            await room.save();
        }

        res.json({ success: true, message: 'Chat hidden' });
    } catch (error) {
        console.error('Hide Room Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete chat permanently (Delete for Everyone)
// @route   DELETE /api/chat/rooms/:roomId
exports.deleteChat = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = await ChatRoom.findById(roomId);
        if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

        // Allow deletion if:
        // 1. User is creator (for groups)
        // 2. User is a participant (for private chats)
        const isPrivate = room.type === 'private';
        const isCreator = room.creator && room.creator.toString() === userId;
        const isParticipant = room.participants.includes(userId);

        if (room.type === 'group' && !isCreator) {
            return res.status(403).json({ success: false, message: 'Only admin can delete group' });
        }

        if (isPrivate && !isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        // Hard Delete
        await Message.deleteMany({ room: roomId });
        await ChatRoom.findByIdAndDelete(roomId);

        res.json({ success: true, message: 'Chat deleted permanently' });
    } catch (error) {
        console.error('Delete Chat Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
