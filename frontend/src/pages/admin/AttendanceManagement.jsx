import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoSave } from 'react-icons/io5';

const AttendanceManagement = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (students.length > 0) {
            loadAttendance();
        }
    }, [selectedDate, students]);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/admin/students');
            const activeStudents = response.data.students.filter(s => s.isActive);
            setStudents(activeStudents);

            // Initialize all as present
            const initialAttendance = {};
            activeStudents.forEach(student => {
                initialAttendance[student._id] = 'present';
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching students:', error);
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        try {
            const response = await api.get(`/admin/attendance/${selectedDate}`);
            if (response.data.attendance.length > 0) {
                const attendanceMap = {};
                response.data.attendance.forEach(record => {
                    attendanceMap[record.student._id] = record.status;
                });
                setAttendance(attendanceMap);
            }
        } catch (error) {
            console.log('No existing attendance for this date');
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
        }));
    };

    const markAllPresent = () => {
        const allPresent = {};
        students.forEach(student => {
            allPresent[student._id] = 'present';
        });
        setAttendance(allPresent);
    };

    const markAllAbsent = () => {
        const allAbsent = {};
        students.forEach(student => {
            allAbsent[student._id] = 'absent';
        });
        setAttendance(allAbsent);
    };

    const saveAttendance = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            }));

            await api.post('/admin/attendance', {
                date: selectedDate,
                attendanceData
            });

            setSuccess('Attendance saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = students.length - presentCount;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Attendance Management
                </h1>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6"
                    >
                        {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Controls */}
                <Card className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="input"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="secondary" onClick={markAllPresent} className="w-full">
                                <IoCheckmarkCircle className="inline mr-2" /> Mark All Present
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button variant="danger" onClick={markAllAbsent} className="w-full">
                                <IoCloseCircle className="inline mr-2" /> Mark All Absent
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="primary"
                                onClick={saveAttendance}
                                disabled={saving}
                                className="w-full"
                            >
                                <IoSave className="inline mr-2" /> {saving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                            <p className="text-sm text-gray-400">Present</p>
                            <p className="text-3xl font-bold text-green-400">{presentCount}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                            <p className="text-sm text-gray-400">Absent</p>
                            <p className="text-3xl font-bold text-red-400">{absentCount}</p>
                        </div>
                    </div>
                </Card>

                {/* Student List */}
                {loading ? (
                    <SkeletonLoader type="table" count={1} />
                ) : (
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Students</h2>
                        {students.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No active students found</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {students.map((student) => (
                                    <motion.div
                                        key={student._id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => toggleAttendance(student._id)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${attendance[student._id] === 'present'
                                                ? 'bg-green-500/10 border-green-500/50'
                                                : 'bg-red-500/10 border-red-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{student.name}</p>
                                                <p className="text-sm text-gray-400">{student.email}</p>
                                            </div>
                                            {attendance[student._id] === 'present' ? (
                                                <IoCheckmarkCircle size={32} className="text-green-400" />
                                            ) : (
                                                <IoCloseCircle size={32} className="text-red-400" />
                                            )}
                                        </div>
                                        <Badge
                                            variant={attendance[student._id] === 'present' ? 'green' : 'red'}
                                            className="mt-2"
                                        >
                                            {attendance[student._id] === 'present' ? 'Present' : 'Absent'}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;
