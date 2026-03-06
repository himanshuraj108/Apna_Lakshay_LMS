const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
    // Middleware for socket authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('name profileImage role isChatBlocked isActive');

            if (!user || !user.isActive || user.isChatBlocked) {
                return next(new Error('User not authorized'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {


        // Join user's personal room for notifications
        socket.join(`user:${socket.user._id}`);

        // Join a chat room
        socket.on('join-room', async (roomId) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    return socket.emit('error', { message: 'Room not found' });
                }

                // Check if user has access
                if (room.type !== 'public' && !room.participants.includes(socket.user._id)) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                socket.join(`room:${roomId}`);


                // Notify room that user joined (optional)
                socket.to(`room:${roomId}`).emit('user-joined', {
                    userId: socket.user._id,
                    userName: socket.user.name
                });
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Leave a room
        socket.on('leave-room', (roomId) => {
            socket.leave(`room:${roomId}`);
            socket.to(`room:${roomId}`).emit('user-left', {
                userId: socket.user._id,
                userName: socket.user.name
            });
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, type = 'text', fileUrl, fileName, mentions = [], replyTo } = data;

                // Validate
                if (!content || !roomId) {
                    return socket.emit('error', { message: 'Invalid message data' });
                }

                // Check Global Chat Setting
                const SystemSetting = require('../models/SystemSetting');
                const chatSetting = await SystemSetting.findOne({ key: 'chat_enabled' });
                const isChatEnabled = chatSetting ? chatSetting.value : true;

                if (!isChatEnabled && socket.user.role !== 'admin') {
                    return socket.emit('error', { message: 'Chat is currently disabled by admin.' });
                }

                // Check room access
                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    return socket.emit('error', { message: 'Room not found' });
                }

                if (room.type !== 'public' && !room.participants.includes(socket.user._id)) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                // Check if room is disabled
                if (room.isDisabled && socket.user.role !== 'admin') {
                    return socket.emit('error', { message: 'This room has been disabled by administrator' });
                }

                // Create message in database
                const message = await Message.create({
                    room: roomId,
                    sender: socket.user._id,
                    content,
                    type,
                    fileUrl,
                    fileName,
                    mentions,
                    replyTo
                });

                // Populate sender info
                await message.populate('sender', 'name profileImage role');
                if (mentions.length > 0) {
                    await message.populate('mentions', 'name');
                }
                if (replyTo) {
                    await message.populate({
                        path: 'replyTo',
                        populate: { path: 'sender', select: 'name profileImage' }
                    });
                }

                // Update room's last message
                room.lastMessage = message._id;
                room.lastMessageAt = new Date();
                await room.save();

                // Broadcast to room (including sender)
                io.to(`room:${roomId}`).emit('new-message', message);

                // Send notifications to mentioned users
                if (mentions.length > 0) {
                    mentions.forEach(userId => {
                        io.to(`user:${userId}`).emit('mention-notification', {
                            messageId: message._id,
                            roomId,
                            sender: socket.user.name
                        });
                    });
                }

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing-start', ({ roomId }) => {
            socket.to(`room:${roomId}`).emit('user-typing', {
                userId: socket.user._id,
                userName: socket.user.name
            });
        });

        socket.on('typing-stop', ({ roomId }) => {
            socket.to(`room:${roomId}`).emit('user-stopped-typing', {
                userId: socket.user._id
            });
        });

        // Disconnect
        socket.on('disconnect', async () => {
            try {
                // Check if user has other active connections
                const userSockets = await io.in(`user:${socket.user._id}`).fetchSockets();
                if (userSockets.length === 0) {
                    // All connections closed, explicitly set offline timestamp
                    await User.findByIdAndUpdate(socket.user._id, {
                        lastActive: new Date()
                    });
                }
            } catch (error) {
                console.error('Socket disconnect error:', error);
            }
        });
    });
};
