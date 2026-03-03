import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoSave,
    IoTimeOutline, IoDocumentTextOutline, IoFlashOutline,
    IoBarChartOutline, IoRefresh, IoArrowForward, IoBedOutline,
    IoCalendarOutline, IoPeopleOutline
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const PAGE_BG = { background: '#050508' };

const AttendanceManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const getLocalDate = () => {
        const d = new Date(); const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchStudents(); }, []);
    useEffect(() => { if (students.length > 0) loadAttendance(); }, [selectedDate, students]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            const active = res.data.students.filter(s => s.isActive);
            setStudents(active);
            const init = {};
            active.forEach(s => { init[s._id] = { status: 'present', entryTime: '', exitTime: '', notes: '' }; });
            setAttendance(init);
        } catch (e) { setError('Failed to load students'); }
        finally { setLoading(false); }
    };

    const loadAttendance = async () => {
        try {
            const res = await api.get(`/admin/attendance/${selectedDate}`);
            if (res.data.attendance.length > 0) {
                const map = {};
                students.forEach(s => { map[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' }; });
                res.data.attendance.forEach(r => {
                    if (map[r.student._id]) map[r.student._id] = { status: r.status, entryTime: r.entryTime || '', exitTime: r.exitTime || '', notes: r.notes || '' };
                });
                setAttendance(map);
            } else {
                const init = {};
                students.forEach(s => { init[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' }; });
                setAttendance(init);
            }
        } catch (e) { console.log('No attendance for this date'); }
    };

    const toggleStatus = (id) => {
        const s = students.find(s => s._id === id);
        if (!s?.seat) return;
        setAttendance(prev => {
            const cur = prev[id] || { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            const next = cur.status === 'present' ? 'absent' : 'present';
            return { ...prev, [id]: { ...cur, status: next, entryTime: next === 'absent' ? '' : cur.entryTime, exitTime: next === 'absent' ? '' : cur.exitTime } };
        });
    };

    const updateField = (id, field, value) => setAttendance(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));

    const setNow = (id, field) => {
        const now = new Date();
        const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (field === 'entryTime') setAttendance(prev => ({ ...prev, [id]: { ...prev[id], status: 'present', entryTime: t } }));
        else updateField(id, field, t);
    };

    const markAllPresent = () => setAttendance(prev => {
        const u = { ...prev };
        Object.keys(u).forEach(id => { if (students.find(s => s._id === id)?.seat) u[id] = { ...u[id], status: 'present' }; });
        return u;
    });
    const markAllAbsent = () => setAttendance(prev => {
        const u = { ...prev };
        Object.keys(u).forEach(id => { u[id] = { ...u[id], status: 'absent', entryTime: '', exitTime: '' }; });
        return u;
    });

    const saveAttendance = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            const data = Object.entries(attendance).map(([studentId, d]) => ({ studentId, ...d }));
            await api.post('/admin/attendance', { date: selectedDate, attendanceData: data });
            setSuccess('Attendance saved!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const filteredStudents = students.filter(s => {
        if (!s.createdAt) return true;
        const admission = new Date(s.createdAt); admission.setHours(0, 0, 0, 0);
        const sel = new Date(selectedDate); sel.setHours(0, 0, 0, 0);
        return sel >= admission;
    });
    const presentCount = Object.keys(attendance).filter(id => filteredStudents.find(s => s._id === id) && attendance[id]?.status === 'present').length;
    const absentCount = filteredStudents.length - presentCount;

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
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                                    <IoCalendarOutline size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Attendance Management</h1>
                        </div>
                    </div>
                    <Link to="/admin/analytics">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">
                            <IoBarChartOutline size={16} /> View Analytics
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Controls */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 mb-6 sticky top-4 z-30">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Select Date</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all" />
                        </div>
                        <button onClick={loadAttendance} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all mt-5"><IoRefresh size={15} /> Refresh</button>
                        <button onClick={markAllPresent} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium transition-all mt-5"><IoCheckmarkCircle size={15} /> All Present</button>
                        <button onClick={markAllAbsent} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all mt-5"><IoCloseCircle size={15} /> All Absent</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
                                <span className="text-xs text-gray-500 uppercase tracking-widest">Present</span>
                                <span className="text-2xl font-black text-green-400">{presentCount}</span>
                            </div>
                            <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
                                <span className="text-xs text-gray-500 uppercase tracking-widest">Absent</span>
                                <span className="text-2xl font-black text-red-400">{absentCount}</span>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveAttendance} disabled={saving}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all">
                            <IoSave size={16} /> {saving ? 'Saving…' : 'Save'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Student Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 rounded-2xl h-32 animate-pulse" />)}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-10 text-center">
                        <IoPeopleOutline size={40} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No active students found for this date</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredStudents.map(student => {
                            const data = attendance[student._id] || { status: 'absent' };
                            const isPresent = data.status === 'present';
                            const hasSeat = !!student.seat;
                            return (
                                <motion.div key={student._id}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${!hasSeat ? 'border-yellow-500/25 bg-yellow-500/5' : isPresent ? 'border-green-500/30 bg-green-500/5' : 'border-white/8 bg-white/3'}`}
                                >
                                    <div
                                        className={`p-4 flex items-start justify-between cursor-pointer ${!hasSeat ? 'hover:bg-yellow-500/8' : isPresent ? 'hover:bg-green-500/8' : 'hover:bg-white/5'}`}
                                        onClick={() => !hasSeat ? navigate('/admin/students?tab=pending') : toggleStatus(student._id)}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{student.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {student.seat ? (
                                                    <span className="text-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-400 px-2 py-0.5 rounded-full font-semibold">Seat: {student.seat.number}</span>
                                                ) : (
                                                    <span className="text-[10px] bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">Pending Allocation</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl ${!hasSeat ? 'bg-yellow-500/15 text-yellow-400' : isPresent ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {!hasSeat ? <IoBedOutline size={20} /> : isPresent ? <IoCheckmarkCircle size={20} /> : <IoCloseCircle size={20} />}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {isPresent && hasSeat && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/8 bg-black/20">
                                                <div className="p-4 space-y-3">
                                                    {['entryTime', 'exitTime'].map(field => (
                                                        <div key={field}>
                                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider flex justify-between mb-1">
                                                                <span>{field === 'entryTime' ? 'Entry Time' : 'Exit Time'}</span>
                                                                <button onClick={() => setNow(student._id, field)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><IoFlashOutline size={10} /> Now</button>
                                                            </label>
                                                            <div className="relative">
                                                                <IoTimeOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                                <input type="time" value={data[field]} onChange={e => updateField(student._id, field, e.target.value)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
                                                        <div className="relative">
                                                            <IoDocumentTextOutline className="absolute left-3 top-2.5 text-gray-500" size={14} />
                                                            <textarea value={data.notes} onChange={e => updateField(student._id, 'notes', e.target.value)} placeholder="Optional…" rows={2}
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-white focus:border-blue-500/50 outline-none resize-none transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {!isPresent && hasSeat && (
                                        <div className="px-4 py-2 bg-red-500/5 border-t border-red-500/10 text-center">
                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Marked Absent</span>
                                        </div>
                                    )}
                                    {!hasSeat && (
                                        <div className="px-4 py-2 bg-yellow-500/8 border-t border-yellow-500/10 flex justify-center items-center gap-2">
                                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Click to Assign Seat</span>
                                            <IoArrowForward size={10} className="text-yellow-400" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement;
