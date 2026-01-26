import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoCheckmark } from 'react-icons/io5';
import Button from './ui/Button';

const GroupCreationModal = ({ isOpen, onClose, onCreateGroup, students, mode = 'group' }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'group' && groupName.trim().length < 3) {
            alert('Group name must be at least 3 characters');
            return;
        }
        if (mode === 'private' && selectedMembers.length === 0) {
            alert('Please select a student');
            return;
        }

        if (mode === 'group') {
            onCreateGroup({ name: groupName, description: groupDescription, members: [] }); // Empty initial members
        } else {
            // Private mode: pass single user ID directly
            onCreateGroup(selectedMembers[0]);
        }

        // Reset form
        setGroupName('');
        setGroupDescription('');
        setSelectedMembers([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            {mode === 'private' ? 'New Private Chat' : 'Create Study Group'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Group Inputs (Only for Group Mode) */}
                        {mode === 'group' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Group Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="e.g., Math Study Group"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        required
                                        minLength={3}
                                        maxLength={50}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        placeholder="What's this group about?"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}

                        {/* Member Selection - Only for Private Chat */}
                        {mode === 'private' && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">
                                    Select Student to Chat
                                </label>

                                {/* Dropdown */}
                                <select
                                    onChange={(e) => {
                                        const studentId = e.target.value;
                                        if (studentId) {
                                            setSelectedMembers([studentId]);
                                        }
                                        e.target.value = '';
                                    }}
                                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-3 cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-gray-900 text-white">Select a student...</option>
                                    {students
                                        .map(student => (
                                            <option key={student._id} value={student._id} className="bg-gray-900 text-white py-2">
                                                {student.name} {student.seatInfo ? `(Seat: ${student.seatInfo.number}, Shift: ${student.seatInfo.shift})` : ''}
                                            </option>
                                        ))
                                    }
                                </select>

                                {/* Selected Member Chip */}
                                {selectedMembers.length > 0 && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMembers.map(memberId => {
                                                const student = students.find(s => s._id === memberId);
                                                if (!student) return null;

                                                return (
                                                    <div
                                                        key={memberId}
                                                        className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-2 rounded-full text-sm"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{student.name}</span>
                                                            {student.seatInfo && (
                                                                <span className="text-xs text-orange-300">
                                                                    {student.seatInfo.number} | {student.seatInfo.shift}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                            >
                                {mode === 'private' ? 'Send Invitation' : 'Create Group'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GroupCreationModal;
