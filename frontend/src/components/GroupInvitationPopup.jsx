import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCheckmarkCircle } from 'react-icons/io5';
import Button from './ui/Button';

const GroupInvitationPopup = ({ invitation, onAccept, onReject, onClose }) => {
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        await onAccept(invitation._id);
        setLoading(false);
    };

    const handleReject = async () => {
        setLoading(true);
        await onReject(invitation._id);
        setLoading(false);
    };

    if (!invitation) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-orange-500/30 p-6 max-w-md w-full shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {invitation.group?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Group Invitation</h3>
                                    <p className="text-sm text-gray-400">
                                        from {invitation.invitedBy?.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <h4 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                            {invitation.group?.type === 'private' ? 'Private Chat Request' : invitation.group?.name}
                        </h4>
                        {invitation.message && (
                            <div className="bg-white/5 p-3 rounded-lg border-l-2 border-orange-500 mb-4">
                                <p className="text-gray-300 italic">"{invitation.message}"</p>
                            </div>
                        )}
                        {invitation.group?.description && invitation.group.type !== 'private' && (
                            <p className="text-gray-300 text-sm mb-4">
                                {invitation.group.description}
                            </p>
                        )}
                        <p className="text-gray-400 text-sm">
                            {invitation.group?.type === 'private'
                                ? `${invitation.invitedBy?.name} wants to chat with you.`
                                : "You've been invited to join this study group."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleReject}
                            disabled={loading}
                            className="flex-1 border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300"
                        >
                            <IoClose size={18} className="inline mr-2" />
                            Decline
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAccept}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                        >
                            <IoCheckmarkCircle size={18} className="inline mr-2" />
                            {loading ? 'Joining...' : 'Join Group'}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GroupInvitationPopup;
