import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCheckmarkCircle, IoCloseCircle,
    IoTimeOutline, IoDocumentTextOutline,
    IoRefresh, IoBedOutline,
    IoPeopleOutline, IoSparkles, IoEyeOutline, IoClose
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import StudentIdCard from '../../components/admin/StudentIdCard';

const PAGE_BG = { background: '#050508' };

const SecurityAttendance = () => {
    const navigate = useNavigate();
    const getLocalDate = () => {
        const d = new Date(); const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [selectedStudentForId, setSelectedStudentForId] = useState(null);

    useEffect(() => { loadAttendance(); }, [selectedDate]);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/public/office/attendance/${selectedDate}`);
            setAttendanceRecords(res.data.attendance || []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load attendance');
            setTimeout(() => setError(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const holidayCount = attendanceRecords.filter(r => r.status === 'holiday').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] right-[-8%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <motion.button onClick={() => navigate('/login')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Login
                        </motion.button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                                    <IoEyeOutline size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Office Security View</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Daily Attendance Monitor</h1>
                        </div>
                    </div>
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Controls */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 mb-6 sticky top-4 z-30 shadow-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Select Date</label>
                            <div className="flex gap-3">
                                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all" />
                                <button onClick={loadAttendance} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                    <IoRefresh size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-2 grid grid-cols-3 gap-3">
                            <div className="bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[10px] sm:text-xs text-green-500/70 font-bold uppercase tracking-widest">Present</span>
                                <span className="text-xl sm:text-2xl font-black text-green-400">{presentCount}</span>
                            </div>
                            <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[10px] sm:text-xs text-red-500/70 font-bold uppercase tracking-widest">Absent</span>
                                <span className="text-xl sm:text-2xl font-black text-red-400">{absentCount}</span>
                            </div>
                            <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[10px] sm:text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">Holiday</span>
                                <span className="text-xl sm:text-2xl font-black text-amber-400">{holidayCount}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Student List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-2xl h-32 animate-pulse" />)}
                    </div>
                ) : attendanceRecords.length === 0 ? (
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
                        <IoPeopleOutline size={48} className="text-gray-600/50 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No attendance records found for this date.</p>
                        <p className="text-gray-500 text-sm mt-2">Records will appear as students are marked by admins or checked in.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {attendanceRecords.map(record => {
                            const student = record.student;
                            if (!student) return null;

                            const isPresent = record.status === 'present';
                            const isNotMarked = record.status === 'not marked';
                            const hasSeat = !!student.seat;

                            return (
                                <motion.div key={record._id}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${!hasSeat ? 'border-yellow-500/25 bg-yellow-500/5' : isNotMarked ? 'border-white/10 bg-white/5' : isPresent ? 'border-green-500/30 bg-green-500/5' : record.status === 'holiday' ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'}`}
                                >
                                    <div className="p-4 flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white text-lg">{student.name}</h3>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedStudentForId(student); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 rounded-lg transition-all shadow-lg shadow-blue-500/30 text-xs font-bold tracking-wider uppercase"
                                                    title="View ID Card"
                                                >
                                                    <IoDocumentTextOutline size={15} /> ID CARD
                                                </button>
                                            </div>

                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                {student.mobile ? `+91 ${student.mobile}` : student.email}
                                            </p>
                                            <div className="flex gap-2 mt-3 flex-wrap items-center">
                                                {hasSeat ? (
                                                    <span className="text-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-400 px-2 py-1 rounded-md font-semibold tracking-wide">Seat: {student.seat.number || 'Assigned'}</span>
                                                ) : (
                                                    <span className="text-[10px] bg-yellow-500/15 border border-yellow-500/25 text-yellow-500 px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                                                        <IoBedOutline size={12} /> Unassigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`p-2.5 rounded-xl flex items-center gap-1.5 justify-center shrink-0 ${!hasSeat ? 'bg-yellow-500/15 text-yellow-500' : isNotMarked ? 'bg-white/5 text-gray-500' : isPresent ? 'bg-green-500/15 text-green-500' : record.status === 'holiday' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                                            {!hasSeat ? <IoBedOutline size={22} /> : isNotMarked ? <IoTimeOutline size={22} /> : isPresent ? <IoCheckmarkCircle size={22} /> : record.status === 'holiday' ? <IoSparkles size={22} /> : <IoCloseCircle size={22} />}
                                        </div>
                                    </div>

                                    {/* Attendance Logs */}
                                    <div className="border-t border-white/5 bg-black/20 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-[10px] text-green-500/70 uppercase tracking-widest mb-1 flex items-center gap-1 font-bold">
                                                    <IoTimeOutline /> Entry
                                                </p>
                                                <p className="text-base font-black text-green-400">
                                                    {record.entryTime || <span className="text-green-900/50 italic font-medium text-sm">No entry set</span>}
                                                </p>
                                            </div>
                                            <div className="w-px h-8 bg-white/10 shrink-0"></div>
                                            <div className="flex-1 text-right">
                                                <p className="text-[10px] text-red-500/70 uppercase tracking-widest mb-1 flex items-center justify-end gap-1 font-bold">
                                                    Exit <IoTimeOutline />
                                                </p>
                                                <p className="text-base font-black text-red-400">
                                                    {record.exitTime || <span className="text-red-900/50 italic font-medium text-sm">No exit set</span>}
                                                </p>
                                            </div>
                                        </div>
                                        {record.notes && (
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                                                <p className="text-xs text-gray-400 italic">"{record.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ID Card Modal */}
            <AnimatePresence>
                {selectedStudentForId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedStudentForId(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="relative"
                        >
                            <button
                                onClick={() => setSelectedStudentForId(null)}
                                className="absolute -top-12 right-0 md:-right-12 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
                            >
                                <IoClose size={24} />
                            </button>
                            <StudentIdCard student={selectedStudentForId} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SecurityAttendance;
