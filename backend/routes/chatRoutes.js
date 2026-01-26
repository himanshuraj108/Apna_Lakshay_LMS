const express = require('express');
const router = express.Router();
const { protect, authorize, authorizeActive } = require('../middleware/auth');
const upload = require('../middleware/chatUpload');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const GroupInvitation = require('../models/GroupInvitation');
const Seat = require('../models/Seat');
const Shift = require('../models/Shift');
const {
    getRooms,
    createPrivateRoom,
    createGroupRoom,
    getMessages,
    getActiveStudents,
    uploadFile,
    hideRoom,
    deleteChat,
    // Admin Controllers
} = require('../controllers/chatController');

const {
    getAllRoomsAdmin,
    toggleDisableRoom,
    toggleBlockUser,
    deleteMessageAdmin,
    deleteRoomAdmin,
    getRoomMessagesAdmin,
    getAllChatUsersAdmin,
    toggleGlobalChat,
    purgeAllMessages,
    performFactoryReset,
    getSystemSetting,
    sendMessageAdmin
} = require('../controllers/chatControllerAdmin');

// All routes require authentication
router.use(protect);

// ========== ADMIN ROUTES ==========
// (Authorize admin for these - Bypass authorizeActive since admin is always active)
router.get('/admin/rooms', authorize('admin'), getAllRoomsAdmin);
router.get('/admin/rooms/:roomId/messages', authorize('admin'), getRoomMessagesAdmin);
router.get('/admin/users', authorize('admin'), getAllChatUsersAdmin);
router.get('/admin/settings/:key', authorize('admin'), getSystemSetting); // GET setting
router.post('/admin/global-settings', authorize('admin'), toggleGlobalChat); // Global Toggle
router.post('/admin/messages', authorize('admin'), sendMessageAdmin); // Admin send message
router.delete('/admin/all-messages', authorize('admin'), purgeAllMessages); // Universal Delete
router.delete('/admin/factory-reset', authorize('admin'), performFactoryReset); // Factory Reset
router.patch('/admin/rooms/:roomId/disable', authorize('admin'), toggleDisableRoom);
router.patch('/admin/users/:userId/block', authorize('admin'), toggleBlockUser);
router.delete('/admin/rooms/:roomId', authorize('admin'), deleteRoomAdmin);
router.delete('/admin/messages/:messageId', authorize('admin'), deleteMessageAdmin);

// Require Active Membership for all subsequent student routes
router.use(authorizeActive);

// Student chat routes (public to authenticated users)
router.get('/settings/:key', async (req, res) => {
    try {
        const SystemSetting = require('../models/SystemSetting');
        const setting = await SystemSetting.findOne({ key: req.params.key });
        res.json({ success: true, value: setting ? setting.value : true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.get('/rooms', getRooms);
router.post('/rooms/private', createPrivateRoom);
router.post('/rooms/group', createGroupRoom);
router.post('/rooms/group', createGroupRoom);
router.get('/rooms/:id/messages', getMessages);
router.post('/upload', upload.single('file'), uploadFile);
// Deletion routes
router.post('/rooms/:roomId/hide', hideRoom);
router.delete('/rooms/:roomId', deleteChat);

// ========== GROUP CHAT ENDPOINTS ==========

// Get all students (for mentions and group invites)
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            isActive: true,
            _id: { $ne: req.user._id } // Exclude current user
        })
            .select('name studentId email profileImage seat isChatBlocked')
            .populate({
                path: 'seat',
                populate: {
                    path: 'assignments.shift',
                    model: 'Shift'
                }
            });

        const studentsWithSeat = students.map(student => {
            let seatInfo = null;
            if (student.seat && student.seat.assignments) {
                const assignment = student.seat.assignments.find(a =>
                    a.student.toString() === student._id.toString() &&
                    a.status === 'active'
                );

                if (assignment) {
                    let shiftName = 'N/A';
                    if (assignment.shift && assignment.shift.name) {
                        shiftName = assignment.shift.name;
                    } else if (assignment.legacyShift) {
                        shiftName = assignment.legacyShift;
                    } else if (assignment.type === 'full_day') {
                        shiftName = 'Full Day';
                    }

                    seatInfo = {
                        number: student.seat.number,
                        shift: shiftName
                    };
                }
            }

            return {
                _id: student._id,
                name: student.name,
                studentId: student.studentId,
                email: student.email, // keeping for internal use if needed
                profileImage: student.profileImage,
                profileImage: student.profileImage,
                isChatBlocked: student.isChatBlocked,
                seatInfo // { number: 'A1', shift: 'Morning' }
            };
        });

        res.json({ success: true, students: studentsWithSeat });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========== GROUP CHAT ENDPOINTS ==========

// Create new group
router.post('/groups/create', protect, async (req, res) => {
    try {
        const { name, description, initialMembers = [] } = req.body;

        // Validation
        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Group name must be 3-50 characters'
            });
        }

        // Create group room
        const participants = [req.user._id, ...initialMembers];

        const group = await ChatRoom.create({
            type: 'group',
            name: name.trim(),
            description: description?.trim() || '',
            creator: req.user._id,
            createdBy: req.user._id, // For compatibility
            participants: [...new Set(participants)], // Remove duplicates
            createdAt: new Date()
        });

        await group.populate('creator', 'name profileImage');
        await group.populate('participants', 'name profileImage');

        res.status(201).json({ success: true, group });
    } catch (error) {
        console.error('Create group error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Get user's groups
router.get('/groups/my-groups', protect, async (req, res) => {
    try {
        const groups = await ChatRoom.find({
            type: 'group',
            participants: req.user._id
        })
            .populate('creator', 'name profileImage')
            .populate('participants', 'name profileImage')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Rename group (admin only)
router.patch('/groups/:groupId/rename', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;

        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Group name must be 3-50 characters'
            });
        }

        const group = await ChatRoom.findById(groupId);

        if (!group || group.type !== 'group') {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Only creator can rename
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only group admin can rename the group' });
        }

        group.name = name.trim();
        await group.save();
        await group.populate('creator', 'name profileImage');
        await group.populate('participants', 'name profileImage');

        res.json({ success: true, group });
    } catch (error) {
        console.error('Rename group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Invite member to group (creates pending invitation)
router.post('/groups/:groupId/invite', async (req, res) => {
    try {
        const { userId } = req.body;
        const { groupId } = req.params;

        const group = await ChatRoom.findById(groupId);

        if (!group || group.type !== 'group') {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Only creator can invite
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only group admin can invite members' });
        }

        // Check if already member
        if (group.participants.includes(userId)) {
            return res.status(400).json({ success: false, message: 'User is already a member' });
        }

        // Check if already invited
        const existingInvite = await GroupInvitation.findOne({
            group: groupId,
            invitedUser: userId,
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({ success: false, message: 'User already has a pending invitation' });
        }

        // Create invitation
        const invitation = await GroupInvitation.create({
            group: groupId,
            invitedBy: req.user._id,
            invitedUser: userId,
            status: 'pending'
        });

        await invitation.populate('group', 'name description');
        await invitation.populate('invitedBy', 'name');

        // TODO: Emit socket notification to invited user
        // io.to(`user:${userId}`).emit('group-invitation', invitation);

        res.json({ success: true, message: 'Invitation sent successfully', invitation });
    } catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user's pending invitations
router.get('/invitations/pending', async (req, res) => {
    try {
        const GroupInvitation = require('../models/GroupInvitation');

        const invitations = await GroupInvitation.find({
            invitedUser: req.user._id,
            status: 'pending'
        })
            .populate('group', 'name description')
            .populate('invitedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, invitations });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Invite to private chat (New)
router.post('/private/invite', async (req, res) => {
    try {
        const { recipientId, message } = req.body;
        const userId = req.user._id;

        if (!recipientId) return res.status(400).json({ success: false, message: 'Recipient required' });

        // Check if room already exists
        let room = await ChatRoom.findOne({
            type: 'private',
            participants: { $all: [userId, recipientId], $size: 2 }
        });

        if (room && room.isActive) {
            // Check if hidden for sender
            if (room.hiddenFor && room.hiddenFor.includes(userId)) {
                // Unhide for sender
                room.hiddenFor = room.hiddenFor.filter(id => id.toString() !== userId.toString());
                await room.save();
                return res.json({ success: true, message: 'Chat restored', room });
            }
            return res.status(400).json({ success: false, message: 'Chat already exists' });
        }

        // Check if invitation already pending
        const existingInvite = await GroupInvitation.findOne({
            invitedUser: recipientId,
            invitedBy: userId,
            status: 'pending',
            group: room?._id // If room exists (but inactive)
        });

        if (existingInvite) {
            return res.status(400).json({ success: false, message: 'Invitation already sent' });
        }

        // Create inactive room if not exists
        if (!room) {
            room = await ChatRoom.create({
                type: 'private',
                participants: [userId, recipientId],
                createdBy: userId,
                isActive: false // Request Mode
            });
        }

        // Create Invitation
        const invitation = await GroupInvitation.create({
            group: room._id,
            invitedBy: userId,
            invitedUser: recipientId,
            status: 'pending',
            message: message || 'I would like to chat with you.'
        });

        await invitation.populate('invitedBy', 'name');
        await invitation.populate('group');

        res.json({ success: true, message: 'Invitation sent', invitation });
    } catch (error) {
        console.error('Private invite error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Accept group invitation
router.post('/invitations/:invitationId/accept', async (req, res) => {
    try {
        const GroupInvitation = require('../models/GroupInvitation');
        const invitation = await GroupInvitation.findById(req.params.invitationId).populate('group');

        if (!invitation || invitation.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Invitation already processed' });
        }

        // Add user to group
        const group = await ChatRoom.findById(invitation.group._id);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        if (group.type === 'private') {
            // Activate private room
            group.isActive = true;
            await group.save();
        } else {
            // Group chat logic
            if (!group.participants.includes(req.user._id)) {
                group.participants.push(req.user._id);
                await group.save();
            }
        }

        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();

        await group.populate('participants', 'name studentId profileImage');

        res.json({ success: true, message: 'Invitation accepted', group });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reject group invitation
router.post('/invitations/:invitationId/reject', async (req, res) => {
    try {
        const GroupInvitation = require('../models/GroupInvitation');
        const invitation = await GroupInvitation.findById(req.params.invitationId);

        if (!invitation || invitation.invitedUser.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Invitation already processed' });
        }

        invitation.status = 'rejected';
        await invitation.save();

        res.json({ success: true, message: 'Invitation rejected' });
    } catch (error) {
        console.error('Reject invitation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Remove member from group
router.delete('/groups/:groupId/remove/:userId', protect, async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const group = await ChatRoom.findById(groupId);

        if (!group || group.type !== 'group') {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Only creator can remove members
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only group admin can remove members' });
        }

        // Cannot remove creator
        if (userId === group.creator.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot remove group admin' });
        }

        group.participants = group.participants.filter(p => p.toString() !== userId);
        await group.save();
        await group.populate('participants', 'name profileImage');

        res.json({ success: true, group });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Leave group (for non-admin members)
router.post('/groups/:groupId/leave', protect, async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await ChatRoom.findById(groupId);

        if (!group || group.type !== 'group') {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Cannot leave if you're the creator
        if (group.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Group admin cannot leave. Delete the group instead.' });
        }

        group.participants = group.participants.filter(p => p.toString() !== req.user._id.toString());
        await group.save();

        res.json({ success: true, message: 'Left group successfully' });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete group (admin only)
// Delete Group route replaced by generic deleteChat above
// router.delete('/groups/:groupId', protect, async (req, res) => { ... });

// Get pending invitations for a group
router.get('/groups/:groupId/invitations', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const GroupInvitation = require('../models/GroupInvitation');

        const group = await ChatRoom.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const invitations = await GroupInvitation.find({
            group: groupId,
            status: 'pending'
        }).select('invitedUser');

        res.json({
            success: true,
            invitedUserIds: invitations.map(inv => inv.invitedUser)
        });
    } catch (error) {
        console.error('Get group invitations error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
