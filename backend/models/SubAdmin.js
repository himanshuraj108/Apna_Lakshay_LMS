const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SubAdminSchema = new mongoose.Schema({
    name:        { type: String, required: true, trim: true },
    username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true },
    pin:         { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    permissions: {
        type: [String],
        default: [],
        // Available permissions:
        // 'attendance'        - can mark/view attendance
        // 'students'          - can view student list
        // 'id_cards'          - can view/print student ID cards
        // 'fees'              - can view/collect fee records
        // 'notifications'     - can send notifications
        // 'requests'          - can view/handle seat requests
        // 'vacant_seats'      - can view vacant seats
        // 'floors'            - can view floor & seat matrix
        // 'shifts'            - can view/manage shift timings
        // 'kiosk'             - can access QR entry kiosk
        // 'chat'              - can moderate discussion rooms
        // 'chat_history'      - can audit student chat/AI logs
        // 'analytics'         - can view reports & analytics
        // 'activities'        - can view student activities & XP
        // 'ai_activity'       - can view AI study logs
        // 'referral_wallet'   - can view referral & wallet ledger
        // 'sub_admins'        - can manage sub-admin roles & permissions
        // 'history'           - can view action history / audit logs
        // 'password_activity' - can view password security logs
        // 'manage_cards'      - can manage student app cards & AI credits
        // 'settings'          - can access system settings
    },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Hash password before save
SubAdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password helper
SubAdminSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('SubAdmin', SubAdminSchema);
