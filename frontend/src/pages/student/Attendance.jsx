import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AttendanceSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack, IoCalendar, IoCheckmarkCircle, IoCloseCircle,
    IoTimeOutline, IoHourglassOutline, IoDocumentTextOutline,
    IoAnalytics, IoScan, IoTrophyOutline, IoAlertCircleOutline,
    IoFlashOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceScanner from '../../components/student/AttendanceScanner';

/* ─── Background ────────────────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
    </>
);

/* ─── Stat Chip ─────────────────────────────────────────────────────── */
const StatChip = ({ label, value, accentColor, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, type: 'spring', stiffness: 120 }}
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
        style={{
            padding: '16px',
            minHeight: '100px',
        }}
    >
        {/* Accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        {/* Ghost icon */}
        <Icon size={48} className="absolute -bottom-1 -right-1 opacity-[0.06]"
            style={{ color: accentColor }} />
        {/* Icon box */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${accentColor}18` }}>
            <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-gray-500">{label}</p>
            <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        </div>
    </motion.div>
);

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
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

    const getLocation = () =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('Geolocation not supported.')); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => reject(new Error('Location access denied.')),
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
            } catch (err) { console.warn('Failed to fetch location settings'); }

            if (isLocationRequired) {
                try { await getLocation(); setShowScanner(true); }
                catch (geoErr) { setShowLocationPrompt(true); }
            } else { setShowScanner(true); }
        } finally { setLoadingScanner(false); }
    };

    const fetchAttendance = async () => {
        try {
            const response = await api.get('/student/attendance');
            setAttendanceData(response.data);
        } catch (error) { console.error('Error fetching attendance:', error); }
        finally { setLoading(false); }
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

    const { myAttendance = [], summary = {}, rankings = [], holidays = [] } = attendanceData || {};

    const getHolidayForDate = (dateStr) => {
        const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
        const h = holidays.find(h => { const hd = new Date(h.date); hd.setHours(0, 0, 0, 0); return hd.getTime() === d.getTime(); });
        return h ? h.name : null;
    };

    const totalMinutes = myAttendance.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalHrs = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const pct = summary.percentage || 0;
    const pctColor = pct >= 76 ? '#22c55e' : pct >= 61 ? '#3b82f6' : pct >= 41 ? '#f97316' : '#ef4444';

    return (
        <div className="min-h-screen text-gray-900">
            <PageBg />

            {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}

            {/* Location prompt modal */}
            {showLocationPrompt && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl p-6 max-w-sm w-full relative bg-white border border-amber-200 shadow-xl"
                        style={{}}>
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                            style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
                        <button onClick={() => setShowLocationPrompt(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                            <IoCloseCircle size={22} />
                        </button>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'rgba(245,158,11,0.12)' }}>
                            <IoAlertCircleOutline size={24} className="text-amber-400" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2">Location Access Needed</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-5">
                            Admin has enabled location restrictions. Please allow location access in your browser settings to mark attendance via QR scan.
                        </p>
                        <button onClick={() => setShowLocationPrompt(false)}
                            className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }}>
                            I Understand
                        </button>
                    </motion.div>
                </div>
            )}

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ───────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-7 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <Link to="/student">
                            <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 transition-all shadow-sm">
                                <IoArrowBack size={15} />
                                <span className="hidden sm:inline">Dashboard</span>
                            </motion.button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Attendance</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Your study presence tracker</p>
                        </div>
                    </div>
                    <div className="flex gap-2.5">

                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: showAnalytics ? '#e0e7ff' : '#ffffff',
                                border: showAnalytics ? '1px solid #a5b4fc' : '1px solid #e2e8f0',
                                color: showAnalytics ? '#4f46e5' : '#4b5563',
                            }}>
                            <IoAnalytics size={15} />
                            {showAnalytics ? 'Show Logs' : 'Analytics'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Scan toast ───────────────────────────────────── */}
                <AnimatePresence>
                    {scanMessage && (
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="mb-5 p-4 rounded-2xl flex items-center gap-3"
                            style={{
                                background: scanMessage.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                border: scanMessage.type === 'error' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)',
                            }}>
                            {scanMessage.type === 'error'
                                ? <IoCloseCircle size={20} className="text-red-400 shrink-0" />
                                : <IoCheckmarkCircle size={20} className="text-green-400 shrink-0" />}
                            <p className="font-semibold text-sm text-gray-900">{scanMessage.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Stat chips ───────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <StatChip label="Days Logged" value={summary.total || 0} accentColor="#94a3b8" icon={IoCalendar} delay={0} />
                    <StatChip label="Present" value={summary.present || 0} accentColor="#22c55e" icon={IoCheckmarkCircle} delay={0.07} />
                    <StatChip label="Attendance" value={`${pct}%`} accentColor={pctColor} icon={IoAnalytics} delay={0.13} />
                    <StatChip label="Study Hours" value={`${totalHrs}h ${totalMins}m`} accentColor="#a855f7" icon={IoHourglassOutline} delay={0.19} />
                </div>

                {/* ── Progress bar ─────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="mb-5 rounded-2xl overflow-hidden"
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <IoFlashOutline size={14} style={{ color: pctColor }} />
                            <span className="text-gray-900 text-sm font-semibold">Attendance Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {pct < 76 && <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Below target</span>}
                            <span className="text-sm font-black" style={{ color: pctColor }}>{pct}%</span>
                        </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${pctColor}, ${pctColor}aa)` }} />
                    </div>
                    <div className="flex justify-between mt-2 text-[11px]" style={{ color: 'rgba(107,114,128,0.8)' }}>
                        <span>0%</span><span>Target: 76%</span><span>100%</span>
                    </div>
                </motion.div>

                {/* ── Main content (Log / Analytics) ───────────────── */}
                <AnimatePresence mode="wait">
                    {showAnalytics ? (
                        /* ── ANALYTICS ── */
                        <motion.div key="analytics" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                            className="rounded-2xl overflow-hidden"
                            style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                    <IoAnalytics size={13} className="text-indigo-400" />
                                </div>
                                <p className="text-gray-900 font-bold text-sm">Monthly Trends</p>
                            </div>
                            <div className="p-5">
                                <div className="h-56 flex items-stretch gap-1 overflow-x-auto pb-2">
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
                                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10"
                                                    style={{ background: 'white', border: '1px solid #e2e8f0', color: '#111827' }}>
                                                    Day {item.label}: {item.value.toFixed(1)}h
                                                </div>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(item.value / maxVal) * 100}%` }}
                                                    transition={{ delay: idx * 0.02, duration: 0.5 }}
                                                    className="w-full rounded-t-sm"
                                                    style={{
                                                        background: item.value > 8 ? '#22c55e' : item.value > 4 ? '#6366f1' : item.value > 0 ? '#a855f7' : '#f8fafc',
                                                        opacity: item.value > 0 ? 0.85 : 1,
                                                    }}
                                                />
                                                <span className="text-[9px]" style={{ color: 'rgba(107,114,128,0.7)' }}>{item.label}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* ── LOGS + RANKINGS ── */
                        <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                            {/* Daily Log */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                                        <IoCalendar size={13} className="text-emerald-400" />
                                    </div>
                                    <p className="text-gray-900 font-bold text-sm">Daily Log</p>
                                </div>
                                <div className="p-4 space-y-2 max-h-[520px] overflow-y-auto">
                                    {myAttendance.length === 0 && (
                                        <div className="text-center py-12 text-gray-600 text-sm">No attendance records yet</div>
                                    )}
                                    {myAttendance.slice().reverse().map((record, idx) => {
                                        const holidayName = getHolidayForDate(record.date);
                                        const isHoliday = record.status === 'holiday' || !!holidayName;
                                        const holidayFestivalName = holidayName || (record.notes?.startsWith('Holiday - ') ? record.notes.replace('Holiday - ', '') : 'Holiday');
                                        const attendedOnHoliday = isHoliday && !!record.entryTime;

                                        let cardBg, borderColor, iconColor, badgeStyle, badgeText;
                                        if (isHoliday && !attendedOnHoliday) {
                                            cardBg = 'rgba(245,158,11,0.04)'; borderColor = 'rgba(245,158,11,0.15)';
                                            iconColor = '#f59e0b'; badgeStyle = { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' };
                                            badgeText = holidayFestivalName.toUpperCase();
                                        } else if (record.status === 'present' || attendedOnHoliday) {
                                            cardBg = '#f8fafc'; borderColor = '#e2e8f0';
                                            iconColor = '#22c55e'; badgeStyle = { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' };
                                            badgeText = 'PRESENT';
                                        } else {
                                            cardBg = 'rgba(239,68,68,0.04)'; borderColor = 'rgba(239,68,68,0.12)';
                                            iconColor = '#ef4444'; badgeStyle = { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' };
                                            badgeText = 'ABSENT';
                                        }

                                        return (
                                            <motion.div key={record._id}
                                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.025 }}
                                                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                                                style={{ background: cardBg, border: `1px solid ${borderColor}` }}>
                                                {/* Icon */}
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                                    style={{ background: `${iconColor}18` }}>
                                                    {isHoliday && !attendedOnHoliday
                                                        ? <IoCalendar size={15} style={{ color: iconColor }} />
                                                        : (record.status === 'present' || attendedOnHoliday)
                                                            ? <IoCheckmarkCircle size={15} style={{ color: iconColor }} />
                                                            : <IoCloseCircle size={15} style={{ color: iconColor }} />}
                                                </div>
                                                {/* Date + badge */}
                                                <div className="shrink-0 min-w-[110px]">
                                                    <p className="font-bold text-gray-900 text-sm leading-snug">
                                                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </p>
                                                    {badgeText && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide mt-0.5 inline-block"
                                                            style={badgeStyle}>{badgeText}</span>
                                                    )}
                                                </div>

                                                {/* Time chips */}
                                                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto text-sm">
                                                    {(record.status === 'present' || attendedOnHoliday) && (
                                                        <>
                                                            {[
                                                                { icon: <IoTimeOutline className="text-emerald-400" />, label: 'Entry', value: record.entryTime || '--:--' },
                                                                { icon: <IoTimeOutline className="text-red-400" />, label: 'Exit', value: record.exitTime || '--:--' },
                                                                { icon: <IoHourglassOutline className="text-amber-400" />, label: 'Duration', value: record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '--' },
                                                            ].map(({ icon, label, value }) => (
                                                                <div key={label} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] shrink-0"
                                                                    style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                                                    {icon}
                                                                    <span className="text-gray-600 uppercase">{label}</span>
                                                                    <span className="font-mono font-bold text-gray-900">{value}</span>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                    {isHoliday && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                                                            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                                            <IoCalendar size={13} className="text-amber-400" />
                                                            <span className="text-amber-300 font-semibold">{holidayFestivalName}</span>
                                                        </div>
                                                    )}
                                                    {!isHoliday && record.notes && (
                                                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ml-auto"
                                                            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                                            <IoDocumentTextOutline className="text-gray-600" />
                                                            <p className="italic text-gray-600 max-w-[130px] truncate">"{record.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Rankings */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.12)' }}>
                                            <IoTrophyOutline size={13} className="text-yellow-400" />
                                        </div>
                                        <p className="text-gray-900 font-bold text-sm">Attendance Rankings</p>
                                    </div>
                                    {/* LIVE badge */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Live</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                {['Rank', 'Student', '%'].map(h => (
                                                    <th key={h} className={`px-5 py-3 text-[11px] uppercase tracking-widest font-semibold ${h === '%' ? 'text-right' : 'text-left'}`}
                                                        style={{ color: 'rgba(107,114,128,0.8)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                // Rank value at the 5th position — include all ties at that boundary
                                                const top5Cutoff = rankings.length >= 5
                                                    ? rankings[4].rank
                                                    : (rankings[rankings.length - 1]?.rank ?? 5);

                                                return rankings.map((student) => {
                                                    const isTop5 = student.rank <= top5Cutoff;
                                                    const rankColors = {
                                                        1: { bg: 'rgba(234,179,8,0.15)', color: '#fbbf24', label: '1st' },
                                                        2: { bg: 'rgba(156,163,175,0.12)', color: '#d1d5db', label: '2nd' },
                                                        3: { bg: 'rgba(249,115,22,0.13)', color: '#fb923c', label: '3rd' },
                                                    };
                                                    const rc = rankColors[student.rank] || { bg: '#f8fafc', color: '#6b7280', label: `#${student.rank}` };

                                                    let rowBg = 'transparent';
                                                    if (student.isMe) rowBg = '#f3f4f6';
                                                    else if (isTop5) rowBg = '#f0fdf4';

                                                    return (
                                                        <tr key={student.studentId}
                                                            style={{
                                                                borderBottom: '1px solid #e2e8f0',
                                                                background: rowBg,
                                                                borderLeft: isTop5 && !student.isMe ? '3px solid rgba(34,197,94,0.35)' : student.isMe ? '3px solid rgba(124,58,237,0.4)' : '3px solid transparent',
                                                            }}>
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                                                                        style={{ background: rc.bg, color: rc.color }}>
                                                                        {student.rank}
                                                                    </div>
                                                                    {student.rank <= 3 && (
                                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                                                            style={{ background: rc.bg, color: rc.color }}>
                                                                            {rc.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-sm font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {isTop5 && !student.isMe && (
                                                                        // Dot size & animation speed decreases from rank 1→5
                                                                        (() => {
                                                                            const dotSizes  = { 1: 'h-2.5 w-2.5', 2: 'h-2 w-2', 3: 'h-2 w-2', 4: 'h-1.5 w-1.5', 5: 'h-1.5 w-1.5' };
                                                                            const dotOpacity = { 1: 'opacity-90', 2: 'opacity-75', 3: 'opacity-60', 4: 'opacity-50', 5: 'opacity-40' };
                                                                            const sz  = dotSizes[student.rank]  || 'h-1.5 w-1.5';
                                                                            const op  = dotOpacity[student.rank] || 'opacity-40';
                                                                            // Rank 1 pings fast, rank 5 pings slow via custom durations
                                                                            const pingDuration = { 1: '0.75s', 2: '1s', 3: '1.3s', 4: '1.7s', 5: '2.2s' }[student.rank] || '2.2s';
                                                                            return (
                                                                                <span className={`relative flex shrink-0 ${sz}`}>
                                                                                    <span
                                                                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${op}`}
                                                                                        style={{ animationDuration: pingDuration }}
                                                                                    />
                                                                                    <span className={`relative inline-flex rounded-full h-full w-full bg-emerald-500`} />
                                                                                </span>
                                                                            );
                                                                        })()
                                                                    )}
                                                                    <span className={isTop5 ? 'text-gray-900 font-semibold' : 'text-gray-600'}>{student.name}</span>
                                                                    {student.isMe && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                                            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>You</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right">
                                                                <span className="text-base font-black"
                                                                    style={{ color: student.percentage >= 90 ? '#4ade80' : student.percentage >= 75 ? '#fbbf24' : '#f87171' }}>
                                                                    {student.percentage}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Attendance;
