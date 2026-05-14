
import { useState, useEffect } from 'react';
import { IoSearch, IoBan, IoCheckmarkCircle } from 'react-icons/io5';
import api from '../../utils/api';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import StudentIdCard from './StudentIdCard';

const StudentChatList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showIdCard, setShowIdCard] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

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
            const response = await api.get('/chat/admin/users');
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
            {/* ... Search Input ... */}
            <div className="mb-6 relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map(student => (
                    <Card key={student._id} className="flex justify-between items-center p-4">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => {
                                setSelectedStudent(student);
                                setShowIdCard(true);
                            }}
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                {student.profileImage ? (
                                    <img
                                        src={student.profileImage.startsWith('http')
                                            ? student.profileImage
                                            : `http://localhost:5000${student.profileImage}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    student.name[0]
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-blue-400 transition-colors">{student.name}</h3>
                                <p className="text-xs text-gray-600">{student.studentId || 'No ID'}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBlock(student._id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${student.isChatBlocked
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                }`}
                            title={student.isChatBlocked ? "Unblock Chat" : "Block Chat"}
                        >
                            {student.isChatBlocked ? <IoBan size={20} /> : <IoCheckmarkCircle size={20} />}
                        </button>
                    </Card>
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
