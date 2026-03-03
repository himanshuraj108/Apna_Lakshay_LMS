import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTrash, IoPersonRemove, IoCreate, IoExit, IoPeopleOutline } from 'react-icons/io5';

const GroupSettingsModal = ({ isOpen, onClose, group, currentUserId, onRemoveMember, onInviteMember, onRenameGroup, onDeleteGroup, onLeaveGroup, onGetAvailableStudents, allStudents, currentUser, sentInvitations }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newGroupName, setNewGroupName] = useState(group?.name || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedInviteId, setSelectedInviteId] = useState('');

    const isAdmin = group?.creator?._id === currentUserId;

    const handleRename = async () => {
        if (newGroupName.trim().length < 3) { alert('Group name must be at least 3 characters'); return; }
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
                    style={{ background: 'linear-gradient(160deg, rgba(12,12,20,0.99) 0%, rgba(17,17,28,0.99) 100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-14 bg-orange-500/8 blur-2xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                                <IoPeopleOutline size={18} className="text-white" />
                            </div>
                            {isRenaming ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        className="flex-1 bg-white/4 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
                                        autoFocus
                                        onKeyPress={e => e.key === 'Enter' && handleRename()}
                                    />
                                    <button onClick={handleRename} className="px-3 py-2 bg-gradient-to-r from-orange-500 to-rose-500 rounded-lg text-white text-xs font-semibold">Save</button>
                                    <button onClick={() => setIsRenaming(false)} className="px-3 py-2 bg-white/5 border border-white/8 rounded-lg text-gray-400 text-xs">Cancel</button>
                                </div>
                            ) : (
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-white truncate">{group.name}</h2>
                                        {isAdmin && (
                                            <button onClick={() => setIsRenaming(true)} className="text-gray-600 hover:text-orange-400 transition-colors shrink-0" title="Rename">
                                                <IoCreate size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {group.description && <p className="text-xs text-gray-500 truncate">{group.description}</p>}
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all ml-3 shrink-0">
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-white/6 mb-4" />

                    <div className="px-6 pb-6 space-y-5">
                        {/* Members */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Members ({group.participants?.length || 0})</h3>
                            <div className="space-y-1.5">
                                {group.participants?.map(member => {
                                    const studentInfo = allStudents?.find(s => s._id === member._id);
                                    return (
                                        <div key={member._id} className="flex items-center justify-between px-3 py-2.5 bg-white/3 border border-white/6 rounded-xl hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                                    {member.profileImage ? (
                                                        <img src={member.profileImage.startsWith('http') ? member.profileImage : `http://localhost:5000${member.profileImage}`} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {member.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-white">{member.name}</p>
                                                        {member._id === group.creator?._id && (
                                                            <span className="text-[10px] bg-orange-500/15 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                                                        )}
                                                    </div>
                                                    {studentInfo?.seatInfo && (
                                                        <p className="text-[11px] text-gray-500">{studentInfo.seatInfo.number} · {studentInfo.seatInfo.shift}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {isAdmin && member._id !== group.creator._id && (
                                                <button onClick={() => onRemoveMember(member._id)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/8 transition-all" title="Remove">
                                                    <IoPersonRemove size={15} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add Members (Admin Only) */}
                        {isAdmin && (
                            <div className="border-t border-white/6 pt-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add Members</h3>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedInviteId}
                                        onChange={e => setSelectedInviteId(e.target.value)}
                                        className="flex-1 bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 appearance-none"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="" className="bg-gray-900">Select a student to invite…</option>
                                        {onGetAvailableStudents?.().map(s => (
                                            <option key={s._id} value={s._id} className="bg-gray-900">
                                                {s.name}{s.seatInfo ? ` (Seat ${s.seatInfo.number})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        disabled={!selectedInviteId || (sentInvitations || []).includes(selectedInviteId)}
                                        onClick={async () => { if (selectedInviteId) { await onInviteMember(selectedInviteId); setSelectedInviteId(''); } }}
                                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {(sentInvitations || []).includes(selectedInviteId) ? 'Invited ✓' : 'Invite'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Danger zone */}
                        <div className="border-t border-white/6 pt-4">
                            {isAdmin ? (
                                showDeleteConfirm ? (
                                    <div className="bg-red-500/6 border border-red-500/20 rounded-xl p-4 space-y-3">
                                        <p className="text-sm text-red-300 font-medium">Are you sure? This action cannot be undone.</p>
                                        <div className="flex gap-2">
                                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all">
                                                <IoTrash size={14} /> Delete Group
                                            </button>
                                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-gray-400 transition-all">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2.5 bg-red-500/6 border border-red-500/15 hover:border-red-500/30 rounded-xl text-sm text-red-400 hover:text-red-300 font-medium flex items-center justify-center gap-2 transition-all">
                                        <IoTrash size={14} /> Delete Group
                                    </button>
                                )
                            ) : (
                                <button onClick={onLeaveGroup} className="w-full py-2.5 bg-red-500/6 border border-red-500/15 hover:border-red-500/30 rounded-xl text-sm text-red-400 hover:text-red-300 font-medium flex items-center justify-center gap-2 transition-all">
                                    <IoExit size={14} /> Leave Group
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GroupSettingsModal;
