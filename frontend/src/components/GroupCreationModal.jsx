import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoChatbubblesOutline, IoPersonOutline } from 'react-icons/io5';

const GroupCreationModal = ({ isOpen, onClose, onCreateGroup, students, mode = 'group' }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'group' && groupName.trim().length < 3) { alert('Group name must be at least 3 characters'); return; }
        if (mode === 'private' && selectedMembers.length === 0) { alert('Please select a student'); return; }
        if (mode === 'group') {
            onCreateGroup({ name: groupName, description: groupDescription, members: [] });
        } else {
            onCreateGroup(selectedMembers[0]);
        }
        setGroupName(''); setGroupDescription(''); setSelectedMembers([]);
    };

    if (!isOpen) return null;

    const accentColor = mode === 'private' ? 'from-cyan-500 to-blue-500' : 'from-orange-500 to-rose-500';
    const glowColor = mode === 'private' ? 'bg-cyan-500/8' : 'bg-orange-500/8';
    const btnGradient = mode === 'private'
        ? 'from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-blue-500/20'
        : 'from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 shadow-orange-500/20';

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
                    className="relative w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    style={{ background: 'linear-gradient(160deg, rgba(12,12,20,0.99) 0%, rgba(17,17,28,0.99) 100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accentColor}`} />
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-14 ${glowColor} blur-2xl pointer-events-none`} />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${accentColor} rounded-xl flex items-center justify-center shadow-lg`}>
                                {mode === 'private' ? <IoPersonOutline size={18} className="text-white" /> : <IoChatbubblesOutline size={18} className="text-white" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">{mode === 'private' ? 'New Private Chat' : 'Create Study Group'}</h2>
                                <p className="text-xs text-gray-500">{mode === 'private' ? 'Start a one-on-one conversation' : 'Create a group for collaboration'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all">
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-white/6 mb-5" />

                    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                        {mode === 'group' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Group Name <span className="text-red-400 normal-case font-normal">*</span></label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        placeholder="e.g., Math Study Group"
                                        className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                                        required minLength={3} maxLength={50}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description <span className="text-gray-600 font-normal normal-case">(optional)</span></label>
                                    <textarea
                                        value={groupDescription}
                                        onChange={e => setGroupDescription(e.target.value)}
                                        placeholder="What's this group about?"
                                        className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {mode === 'private' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Student</label>
                                <select
                                    onChange={e => { if (e.target.value) { setSelectedMembers([e.target.value]); e.target.value = ''; } }}
                                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all appearance-none"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-gray-900">Select a student…</option>
                                    {students.map(s => (
                                        <option key={s._id} value={s._id} className="bg-gray-900">
                                            {s.name}{s.seatInfo ? ` (Seat ${s.seatInfo.number}, ${s.seatInfo.shift})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedMembers.length > 0 && (() => {
                                    const s = students.find(st => st._id === selectedMembers[0]);
                                    return s ? (
                                        <div className="mt-2 flex items-center gap-2 bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-3 py-2">
                                            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">{s.name[0]}</div>
                                            <div>
                                                <p className="text-sm text-white font-medium">{s.name}</p>
                                                {s.seatInfo && <p className="text-xs text-gray-500">Seat {s.seatInfo.number} · {s.seatInfo.shift}</p>}
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-gray-400 text-sm font-medium transition-all">
                                Cancel
                            </button>
                            <button type="submit" className={`flex-1 py-2.5 bg-gradient-to-r ${btnGradient} rounded-xl text-sm font-semibold text-white shadow-lg transition-all`}>
                                {mode === 'private' ? 'Start Chat' : 'Create Group'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GroupCreationModal;
