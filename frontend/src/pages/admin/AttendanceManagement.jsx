import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoSave,
    IoTimeOutline,
    IoDocumentTextOutline,
    IoFlashOutline,
    IoBarChartOutline,
    IoRefresh,
    IoArrowForward
} from 'react-icons/io5';

import { useNavigate } from 'react-router-dom';

const AttendanceManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});

    // Use Local Date for Default
    const getLocalDate = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDate());
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

            // Initialize empty attendance state
            const initialAttendance = {};
            activeStudents.forEach(student => {
                initialAttendance[student._id] = {
                    status: 'present',
                    entryTime: '',
                    exitTime: '',
                    notes: ''
                };
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
                // Initialize defaults first for all students
                students.forEach(student => {
                    attendanceMap[student._id] = {
                        status: 'absent',
                        entryTime: '',
                        exitTime: '',
                        notes: ''
                    };
                });

                // Overlay fetched data
                response.data.attendance.forEach(record => {
                    if (attendanceMap[record.student._id]) {
                        attendanceMap[record.student._id] = {
                            status: record.status,
                            entryTime: record.entryTime || '',
                            exitTime: record.exitTime || '',
                            notes: record.notes || ''
                        };
                    }
                });
                setAttendance(attendanceMap);
            } else {
                // If no record, set default (all absent or keep previous state?)
                // Let's reset to default state for safety
                const initial = {};
                students.forEach(student => {
                    initial[student._id] = {
                        status: 'absent',
                        entryTime: '',
                        exitTime: '',
                        notes: ''
                    };
                });
                setAttendance(initial);
            }
        } catch (error) {
            console.log('No existing attendance for this date');
        }
    };

    const toggleStatus = (studentId) => {
        // Prevent toggling if student has no seat (should rely on redirect, but good safety)
        const student = students.find(s => s._id === studentId);
        if (!student?.seat) return;

        setAttendance(prev => {
            const current = prev[studentId] || { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            const newStatus = current.status === 'present' ? 'absent' : 'present';

            return {
                ...prev,
                [studentId]: {
                    ...current,
                    status: newStatus,
                    entryTime: newStatus === 'absent' ? '' : current.entryTime,
                    exitTime: newStatus === 'absent' ? '' : current.exitTime,
                }
            };
        });
    };

    const updateField = (studentId, field, value) => {
        setAttendance(prev => {
            const current = prev[studentId] || { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            return {
                ...prev,
                [studentId]: {
                    ...current,
                    [field]: value
                }
            };
        });
    };

    const setNow = (studentId, field) => {
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        updateField(studentId, field, timeString);

        // Auto-set status to present if setting entry time
        if (field === 'entryTime') {
            setAttendance(prev => ({
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    status: 'present',
                    entryTime: timeString
                }
            }));
        }
    };

    const markAllPresent = () => {
        setAttendance(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(id => {
                // Only mark students with seats
                const student = students.find(s => s._id === id);
                if (student?.seat) {
                    updated[id] = { ...updated[id], status: 'present' };
                }
            });
            return updated;
        });
    };

    const markAllAbsent = () => {
        setAttendance(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(id => {
                // Only mark students with seats (though absent is default/fine for no-seat too)
                updated[id] = { ...updated[id], status: 'absent', entryTime: '', exitTime: '' };
            });
            return updated;
        });
    };

    const saveAttendance = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const attendanceData = Object.entries(attendance).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                entryTime: data.entryTime,
                exitTime: data.exitTime,
                notes: data.notes
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

    // Filter students so we don't show students who joined AFTER the selected date
    const filteredStudents = students.filter(student => {
        if (!student.createdAt) return true; // Legacy fallback
        const admissionDate = new Date(student.createdAt);
        admissionDate.setHours(0, 0, 0, 0);

        const currentSelectedDate = new Date(selectedDate);
        currentSelectedDate.setHours(0, 0, 0, 0);

        return currentSelectedDate >= admissionDate;
    });

    const presentCount = Object.keys(attendance).filter(id => {
        const studentInFiltered = filteredStudents.find(s => s._id === id);
        return studentInFiltered && attendance[id]?.status === 'present';
    }).length;

    const absentCount = filteredStudents.length - presentCount;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/admin">
                        <Button variant="secondary">
                            <IoArrowBack className="inline mr-2" /> Back
                        </Button>
                    </Link>
                    <Link to="/admin/analytics">
                        <Button variant="primary" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <IoBarChartOutline className="inline mr-2" /> View Analytics
                        </Button>
                    </Link>
                </div>

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
                <Card className="mb-6 sticky top-4 z-30 shadow-xl border-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-400">Select Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="input w-full bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="secondary" onClick={loadAttendance} className="w-full">
                                <IoRefresh className="inline mr-2" /> Refresh Data
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button variant="secondary" onClick={markAllPresent} className="w-full">
                                <IoCheckmarkCircle className="inline mr-2 text-green-400" /> Mark All Present
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button variant="danger" onClick={markAllAbsent} className="w-full bg-red-500/20 hover:bg-red-500/30 border-red-500/50">
                                <IoCloseCircle className="inline mr-2" /> Mark All Absent
                            </Button>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="primary"
                                onClick={saveAttendance}
                                disabled={saving}
                                className="w-full shadow-lg shadow-blue-500/20"
                            >
                                <IoSave className="inline mr-2" /> {saving ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30 flex justify-between items-center px-6">
                            <p className="text-gray-400 font-medium">Present</p>
                            <p className="text-3xl font-bold text-green-400">{presentCount}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30 flex justify-between items-center px-6">
                            <p className="text-gray-400 font-medium">Absent</p>
                            <p className="text-3xl font-bold text-red-400">{absentCount}</p>
                        </div>
                    </div>
                </Card>

                {/* Student List */}
                {loading ? (
                    <SkeletonLoader type="table" count={1} />
                ) : (
                    <Card className="bg-transparent border-0 p-0 shadow-none">
                        {filteredStudents.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-8 text-center border border-white/10">
                                <p className="text-gray-400">No active students found for this date</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredStudents.map((student) => {
                                    const data = attendance[student._id] || { status: 'absent' };
                                    const isPresent = data.status === 'present';
                                    const hasSeat = !!student.seat;

                                    return (
                                        <motion.div
                                            key={student._id}
                                            className={`relative overflow-hidden rounded-xl border transition-all duration-200 ${!hasSeat
                                                ? 'bg-yellow-500/5 border-yellow-500/20 opacity-90'
                                                : isPresent
                                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/50 shadow-lg shadow-green-900/20'
                                                    : 'bg-gray-900 border-white/10 opacity-75 hover:opacity-100'
                                                }`}
                                        >
                                            {/* Header Section */}
                                            <div
                                                className={`p-4 flex items-start justify-between cursor-pointer border-b border-white/5 ${!hasSeat ? 'hover:bg-yellow-500/10'
                                                    : isPresent ? 'bg-green-500/5' : ''
                                                    }`}
                                                onClick={() => {
                                                    if (!hasSeat) {
                                                        navigate('/admin/students?tab=pending');
                                                    } else {
                                                        toggleStatus(student._id);
                                                    }
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-white">{student.name}</h3>
                                                    <p className="text-sm text-gray-400">{student.email}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        {student.seat ? (
                                                            <Badge variant="blue" className="text-xs">
                                                                Seat: {student.seat.number}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="yellow" className="text-xs animate-pulse">
                                                                Pending Allocation ⚠️
                                                            </Badge>
                                                        )}
                                                        {student.shift && (
                                                            <Badge variant="purple" className="text-xs">
                                                                {student.shift}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`rounded-full p-2 ${!hasSeat ? 'bg-yellow-500/20 text-yellow-400'
                                                    : isPresent ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {!hasSeat ? <IoBedOutline size={24} />
                                                        : isPresent ? <IoCheckmarkCircle size={24} />
                                                            : <IoCloseCircle size={24} />}
                                                </div>
                                            </div>

                                            {/* Detailed Controls (Only visible if Present AND has seat) */}
                                            <AnimatePresence>
                                                {isPresent && hasSeat && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="bg-black/20"
                                                    >
                                                        <div className="p-4 space-y-4">
                                                            {/* Entry Time */}
                                                            <div>
                                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 block flex justify-between">
                                                                    <span>Entry Time</span>
                                                                    <button
                                                                        onClick={() => setNow(student._id, 'entryTime')}
                                                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                                    >
                                                                        <IoFlashOutline size={10} /> Now
                                                                    </button>
                                                                </label>
                                                                <div className="relative">
                                                                    <IoTimeOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    <input
                                                                        type="time"
                                                                        value={data.entryTime}
                                                                        onChange={(e) => updateField(student._id, 'entryTime', e.target.value)}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Exit Time */}
                                                            <div>
                                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 block flex justify-between">
                                                                    <span>Exit Time</span>
                                                                    <button
                                                                        onClick={() => setNow(student._id, 'exitTime')}
                                                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                                    >
                                                                        <IoFlashOutline size={10} /> Now
                                                                    </button>
                                                                </label>
                                                                <div className="relative">
                                                                    <IoTimeOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    <input
                                                                        type="time"
                                                                        value={data.exitTime}
                                                                        onChange={(e) => updateField(student._id, 'exitTime', e.target.value)}
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Notes */}
                                                            <div>
                                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 block">
                                                                    Notes / Remarks
                                                                </label>
                                                                <div className="relative">
                                                                    <IoDocumentTextOutline className="absolute left-3 top-3 text-gray-400" />
                                                                    <textarea
                                                                        value={data.notes}
                                                                        onChange={(e) => updateField(student._id, 'notes', e.target.value)}
                                                                        placeholder="Optional notes..."
                                                                        rows="2"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Status Badge Footer */}
                                            {(!isPresent && hasSeat) && (
                                                <div className="p-3 bg-red-500/5 border-t border-red-500/10 flex justify-center">
                                                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Marked Absent</span>
                                                </div>
                                            )}

                                            {/* Pending Action Footer */}
                                            {!hasSeat && (
                                                <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/10 flex justify-center">
                                                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                                                        Click to Assign Seat <IoArrowForward />
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;
