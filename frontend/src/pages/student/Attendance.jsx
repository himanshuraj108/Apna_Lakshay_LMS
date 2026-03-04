import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader, { AttendanceSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack, IoCalendar, IoCheckmarkCircle, IoCloseCircle,
    IoTimeOutline, IoHourglassOutline, IoDocumentTextOutline,
    IoAnalytics, IoScan, IoTrophyOutline, IoFlameOutline, IoAlertCircleOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceScanner from '../../components/student/AttendanceScanner';

// ── Shared BG ────────────────────────────────────────────────────────────
const PageBg = () => (
    <>
        <div className="fixed inset-0 bg-[#050508] -z-10" />
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-700/10 blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-indigo-700/8 blur-[80px] -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
    </>
);

// ── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, glow, icon: Icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 100 }}
        className="relative group rounded-2xl p-5 border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden"
        style={{ boxShadow: `0 0 0 0 ${glow}` }}
        whileHover={{ scale: 1.03, boxShadow: `0 20px 50px -10px ${glow}` }}
    >
        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
        <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500`} />
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} w-fit shadow-lg mb-3`}>
            <Icon size={18} className="text-white" />
        </div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
    </motion.div>
);

const Attendance = () => {
    const { user } = useAuth();
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [loadingScanner, setLoadingScanner] = useState(false);

    useEffect(() => { fetchAttendance(); }, []);

    // ── Get current GPS location ─────────────────────────────────────────
    const getLocation = () =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser.'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => reject(new Error('Location access denied. Please allow location to mark attendance.')),
                { timeout: 10000, maximumAge: 0 }
            );
        });

    const handleOpenScanner = async () => {
        setLoadingScanner(true);
        try {
            let isLocationRequired = true;
            try {
                const settingsRes = await api.get('/public/settings');
                if (settingsRes.data.success && settingsRes.data.settings.locationAttendance === false) {
                    isLocationRequired = false;
                }
            } catch (err) {
                console.warn('Failed to fetch public settings for location requirements');
            }

            if (isLocationRequired) {
                // Pre-check location permission and fetch location before showing scanner
                try {
                    await getLocation();
                    setShowScanner(true);
                } catch (geoErr) {
                    // Location denied or unavailable
                    setShowLocationPrompt(true);
                }
            } else {
                setShowScanner(true);
            }
        } finally {
            setLoadingScanner(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await api.get('/student/attendance');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            const response = await api.post('/student/attendance/qr-scan', { qrToken: token });
            if (response.data.success) {
                setScanMessage({ type: response.data.type || 'success', text: response.data.message });
                fetchAttendance();
                setTimeout(() => setScanMessage(null), 5000);
            }
        } catch (error) {
            setScanMessage({ type: 'error', text: error.response?.data?.message || 'Scan failed' });
            setTimeout(() => setScanMessage(null), 5000);
        }
    };

    if (loading) return <AttendanceSkeleton />;


    const { myAttendance = [], summary = {}, rankings = [] } = attendanceData || {};
    const totalMinutes = myAttendance.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalHrs = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const pct = summary.percentage || 0;
    const pctColor = pct >= 76 ? 'from-green-500 to-emerald-400' : pct >= 61 ? 'from-blue-500 to-cyan-400' : pct >= 41 ? 'from-orange-500 to-amber-400' : 'from-red-500 to-rose-400';

    return (
        <div className="min-h-screen text-white">
            <PageBg />
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/student">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-white">Attendance</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Your study presence tracker</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {user?.seat && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleOpenScanner} disabled={loadingScanner}
                                className={`relative flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r ${loadingScanner ? 'from-gray-500 to-gray-600 cursor-not-allowed' : 'from-purple-600 to-indigo-600 hover:shadow-purple-500/50'} text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 transition-all`}>
                                {!loadingScanner && <span className="absolute inset-0 rounded-xl animate-pulse bg-white/5 pointer-events-none" />}
                                {loadingScanner ? <IoTimeOutline size={18} className="animate-spin" /> : <IoScan size={18} />} Mark Attendance
                            </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAnalytics(!showAnalytics)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${showAnalytics ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                            <IoAnalytics size={16} /> {showAnalytics ? 'Show Logs' : 'Analytics'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Scan toast */}
                <AnimatePresence>
                    {scanMessage && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border backdrop-blur-md ${scanMessage.type === 'exit' || scanMessage.type === 'error'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                            {scanMessage.type === 'error' ? <IoCloseCircle size={22} /> : <IoCheckmarkCircle size={22} />}
                            <p className="font-bold">{scanMessage.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}

                {showLocationPrompt && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                            <button onClick={() => setShowLocationPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><IoCloseCircle size={24} /></button>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl" />
                            <div className="text-center mb-5 mt-2">
                                <IoAlertCircleOutline className="text-amber-500 text-6xl mx-auto mb-3 animate-pulse" />
                                <h3 className="text-white font-bold text-xl">Location Access Needed</h3>
                                <p className="text-gray-400 text-sm mt-3">Admin has enabled location restrictions. Please allow location access in your browser settings to mark attendance via QR scan.</p>
                            </div>
                            <button onClick={() => setShowLocationPrompt(false)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                                I Understand
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Days Logged" value={summary.total || 0} color="from-slate-400 to-gray-300" glow="rgba(148,163,184,0.3)" icon={IoCalendar} delay={0} />
                    <StatCard label="Present" value={summary.present || 0} color="from-green-500 to-emerald-400" glow="rgba(34,197,94,0.4)" icon={IoCheckmarkCircle} delay={0.1} />
                    <StatCard label="Attendance %" value={`${pct}%`} color="from-blue-500 to-cyan-400" glow="rgba(59,130,246,0.4)" icon={IoAnalytics} delay={0.2} />
                    <StatCard label="Study Hours" value={`${totalHrs}h ${totalMins}m`} color="from-purple-500 to-violet-400" glow="rgba(168,85,247,0.4)" icon={IoHourglassOutline} delay={0.3} />
                </div>

                {/* Progress Bar */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="mb-8 p-5 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl">
                    <div className="flex justify-between mb-3">
                        <span className="text-gray-400 text-sm font-medium">Attendance Progress</span>
                        <span className={`text-sm font-black bg-gradient-to-r ${pctColor} bg-clip-text text-transparent`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                            className={`h-full rounded-full bg-gradient-to-r ${pctColor} shadow-lg`} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>0%</span><span>Target: 76%</span><span>100%</span>
                    </div>
                </motion.div>

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    {showAnalytics ? (
                        <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <IoAnalytics className="text-purple-400" /> Monthly Trends
                            </h2>
                            <div className="h-64 flex items-stretch gap-1.5 overflow-x-auto pb-2">
                                {(() => {
                                    const now = new Date();
                                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                                    const durations = myAttendance.map(r => (r.duration || 0) / 60);
                                    const maxVal = Math.max(5, ...durations);
                                    const data = [];
                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const d = new Date(now.getFullYear(), now.getMonth(), i);
                                        if (d > now && d.getDate() !== now.getDate()) break;
                                        const dayRecords = myAttendance.filter(r => new Date(r.date).toDateString() === d.toDateString());
                                        const totalDuration = dayRecords.reduce((acc, curr) => acc + (curr.duration || 0), 0);
                                        data.push({ label: d.getDate(), value: totalDuration / 60 });
                                    }
                                    return data.map((item, idx) => (
                                        <div key={idx} className="flex-1 min-w-[18px] h-full flex flex-col justify-end items-center gap-1 group relative">
                                            <div className="absolute -top-10 bg-gray-900 text-xs p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-white/10">
                                                Day {item.label}: {item.value.toFixed(1)}h
                                            </div>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(item.value / maxVal) * 100}%` }}
                                                transition={{ delay: idx * 0.02, duration: 0.6 }}
                                                className={`w-full rounded-t-md ${item.value > 8 ? 'bg-gradient-to-t from-green-600 to-green-400' : item.value > 4 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : item.value > 0 ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 'bg-white/5'}`}
                                            />
                                            <span className="text-[9px] text-gray-600">{item.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {/* Daily Log */}
                            <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6">
                                <h2 className="text-xl font-bold mb-6">Daily Log</h2>
                                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                                    {myAttendance.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">No attendance records yet</div>
                                    )}
                                    {myAttendance.slice().reverse().map((record, idx) => {
                                        const isHoliday = record.status === 'holiday' || (record.status === 'present' && record.notes?.startsWith('Holiday - '));
                                        const holidayFestivalName = isHoliday && record.notes ? record.notes.replace('Holiday - ', '') : 'Holiday';
                                        const attendedOnHoliday = isHoliday && record.entryTime != null;

                                        // Determine styling based on attendance and holiday status
                                        let cardStyle = '';
                                        let iconStyle = '';
                                        let badgeStyle = '';
                                        let badgeText = '';

                                        if (isHoliday && !attendedOnHoliday) {
                                            cardStyle = 'bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30';
                                            iconStyle = 'bg-amber-500/20 text-amber-400';
                                            badgeStyle = 'bg-amber-500/20 text-amber-400';
                                            badgeText = 'HOLIDAY';
                                        } else if (record.status === 'present' || attendedOnHoliday) {
                                            cardStyle = 'bg-white/3 border-white/8 hover:border-green-500/30 hover:bg-green-500/5';
                                            iconStyle = 'bg-green-500/20 text-green-400';
                                            badgeStyle = 'bg-green-500/20 text-green-400';
                                            badgeText = 'PRESENT';
                                        } else {
                                            cardStyle = 'bg-red-500/5 border-red-500/15 hover:border-red-500/30';
                                            iconStyle = 'bg-red-500/20 text-red-400';
                                            badgeStyle = 'bg-red-500/20 text-red-400';
                                            badgeText = 'ABSENT';
                                        }


                                        return (
                                            <motion.div key={record._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                                className={`p-4 rounded-xl border transition-all ${cardStyle}`}>
                                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                    <div className="flex items-center gap-3 min-w-[180px]">
                                                        <div className={`p-2.5 rounded-xl ${iconStyle}`}>
                                                            {isHoliday && !attendedOnHoliday ? <IoCalendar size={22} /> : (record.status === 'present' || attendedOnHoliday) ? <IoCheckmarkCircle size={22} /> : <IoCloseCircle size={22} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {badgeText && (
                                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${badgeStyle}`}>
                                                                        {badgeText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Detail Section */}
                                                    <div className="flex flex-wrap items-center gap-3 text-sm flex-1">
                                                        {(record.status === 'present' || attendedOnHoliday) && (
                                                            <>
                                                                {[
                                                                    { icon: <IoTimeOutline className="text-green-400" />, label: 'Entry', value: record.entryTime || '--:--' },
                                                                    { icon: <IoTimeOutline className="text-red-400" />, label: 'Exit', value: record.exitTime || '--:--' },
                                                                    { icon: <IoHourglassOutline className="text-yellow-400" />, label: 'Duration', value: record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '--' }
                                                                ].map(({ icon, label, value }) => (
                                                                    <div key={label} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 text-gray-300">
                                                                        {icon}
                                                                        <span className="text-gray-500 text-xs uppercase">{label}</span>
                                                                        <span className="font-mono font-bold text-white">{value}</span>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
                                                        {isHoliday && (
                                                            <div className={`flex items-center gap-2 text-sm bg-amber-500/8 border border-amber-500/15 px-3 py-1.5 rounded-lg text-amber-300 ${isHoliday && !attendedOnHoliday ? 'flex-1' : ''}`}>
                                                                <span className="font-semibold">{holidayFestivalName}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!isHoliday && record.notes && (
                                                        <div className="hidden md:flex items-start gap-2 text-sm text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg ml-auto">
                                                            <IoDocumentTextOutline className="mt-0.5 shrink-0" />
                                                            <p className="italic max-w-[140px] truncate">"{record.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rankings */}
                            <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <IoTrophyOutline className="text-yellow-400" /> Attendance Rankings
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/8">
                                                {['Rank', 'Student', '%'].map(h => (
                                                    <th key={h} className={`p-4 text-xs uppercase tracking-widest text-gray-500 ${h === '%' ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rankings.map((student, index) => (
                                                <tr key={student.studentId}
                                                    className={`border-b border-white/5 transition-all ${student.isMe ? 'bg-purple-500/10 border-purple-500/20' : 'hover:bg-white/3'}`}>
                                                    <td className="p-4">
                                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                                            ${student.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/20' :
                                                                student.rank === 2 ? 'bg-gray-500/20 text-gray-400' :
                                                                    student.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                                        'bg-white/5 text-gray-500'}`}>
                                                            {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : student.rank}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-medium text-gray-200">
                                                        {student.name}
                                                        {student.isMe && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">You</span>}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`text-lg font-black ${student.percentage >= 90 ? 'text-green-400' : student.percentage >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                            {student.percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div >
                    )}
                </AnimatePresence >
            </div >
        </div >
    );
};

export default Attendance;
