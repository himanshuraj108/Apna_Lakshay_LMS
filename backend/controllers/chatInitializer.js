const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

// Initialize public chat room
exports.initializePublicRoom = async () => {
    try {
        // Check if public room exists
        let publicRoom = await ChatRoom.findOne({ type: 'public', name: 'Public Study Chat' });

        if (!publicRoom) {
            // Find an admin user to be the creator
            const admin = await User.findOne({ role: 'admin' });

            if (admin) {
                publicRoom = await ChatRoom.create({
                    type: 'public',
                    name: 'Public Study Chat',
                    participants: [], // Empty for public
                    createdBy: admin._id,
                    isActive: true
                });

                console.log('✅ Public chat room created');
            }
        } else {
            console.log('✅ Public chat room already exists');
        }

        return publicRoom;
    } catch (error) {
        console.error('Error initializing public room:', error);
    }
};
