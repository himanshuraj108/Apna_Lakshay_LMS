
import { useState, useEffect } from 'react';
import { IoSearch, IoBan, IoCheckmarkCircle } from 'react-icons/io5';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import StudentIdCard from './StudentIdCard';

const StudentChatList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showIdCard, setShowIdCard] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, [showInactive]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Reusing existing endpoint or using a new one if structure differs
            // Assuming /api/auth/users?role=student exists or similar
            // Or creating a specific admin endpoint for this:
            // Since we don't have a generic "get all students" endpoint confirmed, 
            // we will assume we can fetch them via the new admin endpoint we might need.

            // Wait, we didn't create a "get all students" endpoint in chatControllerAdmin.
            // But we have `adminController` that might have it?
            // Let's use `api.get('/admin/students')` as placeholder, assuming it exists from previous work.
            // If not, we might need to create it.

            // Checking adminController previously: lines 1-100 didn't show "getAllStudents".
            // Checking chatRoutes: line 39 "router.get('/students', ...)" gets students for group chat.
            // We can use that! It returns all students essentially.

            // Fetch students using the chat endpoint which returns { success: true, students: [...] }
            // Note: Use /chat/students
            // Fetch all students (including blocked) for admin management
            const response = await api.get(`/chat/admin/users?showInactive=${showInactive}`);
            if (response.data.success) {
                // The current /chat/students endpoint does NOT return `isChatBlocked`.
                // We must update the backend logic to include this field.
                // Assuming it will be added, or we have to add it now.
                // Re-mapping to ensure data structure
                setStudents(response.data.students);
            }
        } catch (error) {
            console.error('Fetch students error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (studentId) => {
        try {
            const response = await api.patch(`/chat/admin/users/${studentId}/block`);
            if (response.data.success) {
                setStudents(prev => prev.map(s =>
                    s._id === studentId ? { ...s, isChatBlocked: response.data.isChatBlocked } : s
                ));
            }
        } catch (error) {
            console.error('Block toggle error:', error);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Search and Toggle Row */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search students by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white text-stone-800 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E2DBD2] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none shadow-2xs font-medium placeholder:text-stone-400"
                    />
                </div>
                
                {/* Show Inactive Toggle */}
                <div className="flex items-center gap-2.5 shrink-0 bg-white border border-[#EDE8E0] px-3.5 py-2 rounded-xl shadow-2xs">
                    <span className="text-xs font-bold text-stone-700 select-none">
                        Show Inactive
                    </span>
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                            showInactive ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-stone-300'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                showInactive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                    <div key={student._id} className="flex justify-between items-center p-4 bg-white border border-[#EDE8E0] rounded-2xl shadow-xs hover:border-orange-200 hover:shadow-sm transition-all">
                        <div
                            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                            onClick={() => {
                                setSelectedStudent(student);
                                setShowIdCard(true);
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 font-bold overflow-hidden shrink-0">
                                <img
                                    src={(() => {
                                        const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
                                            ? getDeterministicAvatar(student._id, student.gender)
                                            : student.profileImage;
                                        return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                    })()}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-stone-900 text-sm group-hover:text-orange-600 transition-colors flex items-center gap-1.5 flex-wrap truncate">
                                    {student.name}
                                    {student.isActive === false && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                            Inactive
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-stone-400 font-medium">{student.studentId || 'No ID'}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBlock(student._id);
                            }}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${student.isChatBlocked
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                            title={student.isChatBlocked ? "Unblock Chat" : "Block Chat"}
                        >
                            {student.isChatBlocked ? <IoBan size={18} /> : <IoCheckmarkCircle size={18} />}
                        </button>
                    </div>
                ))}
            </div>

            {/* ID Card Modal */}
            <Modal
                isOpen={showIdCard}
                onClose={() => setShowIdCard(false)}
                title="Student ID Card"
            >
                <div className="flex justify-center p-4">
                    {selectedStudent && (
                        <StudentIdCard
                            student={{
                                ...selectedStudent,
                                seatNumber: selectedStudent.seat?.number // Ensure seat info is passed if available
                            }}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default StudentChatList;
