const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
const { createLogger } = require('../utils/logger');

const log = createLogger('chat-init');

// Initialize public chat room on server boot
exports.initializePublicRoom = async () => {
    try {
        let publicRoom = await ChatRoom.findOne({ type: 'public', name: 'Public Study Chat' });

        if (!publicRoom) {
            const admin = await User.findOne({ role: 'admin' });

            if (admin) {
                publicRoom = await ChatRoom.create({
                    type        : 'public',
                    name        : 'Public Study Chat',
                    participants: [],
                    createdBy   : admin._id,
                    isActive    : true
                });

                log.ok('Public chat room created');
            }
        } else {
            log.info('Public chat room verified');
        }

        return publicRoom;
    } catch (error) {
        log.error('Failed to initialize public chat room', { error: error.message });
    }
};
