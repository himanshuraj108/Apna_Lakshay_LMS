import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTrash, IoPersonRemove, IoCreate, IoExit } from 'react-icons/io5';
import Button from './ui/Button';

const GroupSettingsModal = ({ isOpen, onClose, group, currentUserId, onRemoveMember, onInviteMember, onRenameGroup, onDeleteGroup, onLeaveGroup, onGetAvailableStudents, allStudents, currentUser, sentInvitations }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newGroupName, setNewGroupName] = useState(group?.name || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedInviteId, setSelectedInviteId] = useState('');

    const isAdmin = group?.creator?._id === currentUserId;

    const handleRename = async () => {
        if (newGroupName.trim().length < 3) {
            alert('Group name must be at least 3 characters');
            return;
        }
        await onRenameGroup(newGroupName.trim());
        setIsRenaming(false);
    };

    const handleDelete = async () => {
        await onDeleteGroup();
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!isOpen || !group) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1">
                            {isRenaming ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        autoFocus
                                        onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                                    />
                                    <Button variant="primary" onClick={handleRename} className="text-sm">
                                        Save
                                    </Button>
                                    <Button variant="secondary" onClick={() => setIsRenaming(false)} className="text-sm">
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                        {group.name}
                                    </h2>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setIsRenaming(true)}
                                            className="text-gray-400 hover:text-orange-400 transition-colors"
                                            title="Rename group"
                                        >
                                            <IoCreate size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                            {group.description && (
                                <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors ml-4"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    {/* Members List */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">
                            Members ({group.participants?.length || 0})
                        </h3>
                        <div className="space-y-2">
                            {group.participants?.map(member => (
                                <div
                                    key={member._id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-white/10 bg-gray-700">
                                            {member.profileImage ? (
                                                <img
                                                    src={member.profileImage.startsWith('http') ? member.profileImage : `http://localhost:5000${member.profileImage}`}
                                                    alt={member.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {member.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            {(() => {
                                                const studentInfo = allStudents?.find(s => s._id === member._id);
                                                if (studentInfo?.seatInfo) {
                                                    return (
                                                        <p className="text-xs text-gray-400">
                                                            {studentInfo.seatInfo.number} | {studentInfo.seatInfo.shift}
                                                        </p>
                                                    );
                                                }
                                                return studentInfo?.studentId ?
                                                    <p className="text-xs text-gray-400">ID: {studentInfo.studentId}</p> : null;
                                            })()}
                                        </div>
                                        {member._id === group.creator?._id && (
                                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded ml-2">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    {isAdmin && member._id !== group.creator._id && (
                                        <button
                                            onClick={() => onRemoveMember(member._id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Remove member"
                                        >
                                            <IoPersonRemove size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Members Section (Admin Only) */}
                    {isAdmin && (
                        <div className="mb-6 pb-6 border-b border-white/10">
                            <h3 className="text-lg font-semibold mb-3">Add Members</h3>
                            <div className="flex gap-2">
                                <select
                                    value={selectedInviteId}
                                    onChange={(e) => setSelectedInviteId(e.target.value)}
                                    className="flex-1 bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-gray-900 text-white">Select a student to invite...</option>
                                    {onGetAvailableStudents?.().map(student => (
                                        <option key={student._id} value={student._id} className="bg-gray-900 text-white py-2">
                                            {student.name} {student.seatInfo ? `(Seat: ${student.seatInfo.number}, Shift: ${student.seatInfo.shift})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    variant="primary"
                                    disabled={!selectedInviteId || (sentInvitations || []).includes(selectedInviteId)}
                                    onClick={async () => {
                                        if (selectedInviteId) {
                                            await onInviteMember(selectedInviteId);
                                            setSelectedInviteId('');
                                        }
                                    }}
                                    className="px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {(sentInvitations || []).includes(selectedInviteId) ? 'Invited' : 'Invite'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Admin Actions */}
                    {isAdmin ? (
                        <div className="border-t border-white/10 pt-4">
                            {showDeleteConfirm ? (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-red-400 font-semibold mb-3">
                                        Are you sure you want to delete this group? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="primary"
                                            onClick={handleDelete}
                                            className="flex-1 bg-red-600 hover:bg-red-700"
                                        >
                                            <IoTrash size={16} className="inline mr-1" />
                                            Yes, Delete Group
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
                                >
                                    <IoTrash size={16} className="inline mr-2" />
                                    Delete Group
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="border-t border-white/10 pt-4">
                            <Button
                                variant="secondary"
                                onClick={onLeaveGroup}
                                className="w-full text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50"
                            >
                                <IoExit size={16} className="inline mr-2" />
                                Leave Group
                            </Button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GroupSettingsModal;
