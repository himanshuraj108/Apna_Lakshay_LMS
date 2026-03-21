import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import IDCard from '../../components/dashboard/IDCard';
import api from '../../utils/api';
import {
    IoBedOutline, IoCalendarOutline, IoCashOutline,
    IoBookOutline, IoNotificationsOutline, IoPersonOutline,
    IoIdCardOutline, IoScan, IoCloseCircle,
    IoChatbubblesOutline, IoHelpCircleOutline,
    IoNewspaper, IoArrowForward,
    IoFlashOutline, IoSparklesOutline, IoLockClosedOutline,
    IoLibraryOutline, IoAlertCircleOutline, IoTimeOutline, IoDocumentTextOutline,
    IoLocation, IoLogInOutline, IoLogOutOutline, IoTimerOutline, IoInformationCircleOutline,
    IoLogOutOutline as IoLogoutIcon, IoChevronForward, IoGridOutline, IoMapOutline,
    IoMenuOutline, IoCloseOutline
} from 'react-icons/io5';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import HelpSupportModal from '../../components/student/HelpSupportModal';
import RequestHistoryModal from '../../components/student/RequestHistoryModal';
import LmsGuideSection from '../../components/student/LmsGuideSection';
import NewspaperModal from '../../components/student/NewspaperModal';
import ExamAlertsModal from '../../components/student/ExamAlertsModal';
import Footer from '../../components/layout/Footer';

/* ─── CSS injected once ─────────────────────────────────────────────── */
const DASH_STYLE = `
@keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
@keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-40px,30px) scale(1.08);}66%{transform:translate(20px,-30px) scale(0.92);}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes pulse-ring{0%{transform:scale(.9);opacity:1;}80%,100%{transform:scale(1.35);opacity:0;}}
@keyframes shimmer-name{0%{background-position:200% center;}100%{background-position:-200% center;}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-name 4s linear infinite;}
`;

/* ─── Floating Attendance Button ────────────────────────────────────── */
const FloatingAttendanceBtn = ({ loading, onClick }) => (
    <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
        whileHover={!loading ? { scale: 1.06 } : {}}
        whileTap={!loading ? { scale: 0.94 } : {}}
        onClick={onClick}
        disabled={loading}
        className={`fixed bottom-6 right-5 z-50 flex items-center gap-2.5 rounded-2xl font-bold text-white shadow-2xl transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
            padding: '12px 20px',
            background: loading ? 'rgba(60,65,80,0.9)' : 'linear-gradient(135deg,#10b981,#14b8a6)',
            backdropFilter: 'blur(16px)',
            boxShadow: loading ? 'none' : '0 8px 32px rgba(16,185,129,0.5), 0 0 0 1px rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
        }}
    >
        {!loading && (
            <span className="absolute inset-0 rounded-2xl" style={{ background: 'rgba(16,185,129,0.25)', animation: 'pulse-ring 2.4s ease-out infinite', pointerEvents: 'none' }} />
        )}
        <div className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-white/20">
            {loading ? <IoTimeOutline size={16} className="animate-spin" /> : <IoScan size={16} />}
        </div>
        <span className="text-sm font-bold">{loading ? 'Checking…' : 'Mark Attendance'}</span>
    </motion.button>
);

/* ─── Location Prompt Modal ─────────────────────────────────────────── */
const LocationPromptModal = ({ onClose, onEnable, enabling }) => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111827] border border-amber-500/25 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><IoCloseCircle size={22} /></button>
            <div className="text-center mt-2 mb-5">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-3">
                    <IoAlertCircleOutline className="text-amber-400 text-3xl" />
                </div>
                <h3 className="text-white font-bold text-lg">Location Access Needed</h3>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">Your attendance needs your location. Click <span className="text-amber-400 font-semibold">Enable Location</span> and allow access in the browser prompt.</p>
            </div>
            <button onClick={onEnable} disabled={enabling}
                className={`w-full py-3 mb-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${enabling ? 'bg-gray-600 opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-lg shadow-emerald-500/25'}`}>
                {enabling ? <><IoTimeOutline size={16} className="animate-spin" />Requesting…</> : <><IoLocation size={16} />Enable Location</>}
            </button>
            <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-all font-medium">Dismiss</button>
        </motion.div>
    </div>
);

/* ─── Attendance Result Popup ───────────────────────────────────────── */
const AttendanceResultCard = ({ result, onClose }) => {
    const isEntry = result.type === 'entry';
    const isAlreadyMarked = result.type === 'already_marked';
    const att = result.attendance || {};
    const theme = isEntry
        ? { bg: 'linear-gradient(145deg,#0a1f14,#0d2b1c)', border: 'rgba(52,211,153,0.3)', bar: 'from-emerald-400 to-teal-400', iconBg: 'linear-gradient(135deg,#10b981,#14b8a6)', text: '#34d399', chipBg: 'rgba(16,185,129,0.1)', chipBorder: 'rgba(16,185,129,0.25)', glow: '#34d399' }
        : isAlreadyMarked
            ? { bg: 'linear-gradient(145deg,#1a1000,#221600)', border: 'rgba(245,158,11,0.3)', bar: 'from-amber-400 to-orange-400', iconBg: 'linear-gradient(135deg,#f59e0b,#ea580c)', text: '#fbbf24', chipBg: 'rgba(245,158,11,0.1)', chipBorder: 'rgba(245,158,11,0.25)', glow: '#fcd34d' }
            : { bg: 'linear-gradient(145deg,#0a1424,#0d1f38)', border: 'rgba(99,102,241,0.3)', bar: 'from-indigo-400 to-blue-400', iconBg: 'linear-gradient(135deg,#6366f1,#3b82f6)', text: '#818cf8', chipBg: 'rgba(99,102,241,0.1)', chipBorder: 'rgba(99,102,241,0.25)', glow: '#818cf8' };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border" style={{ background: theme.bg, borderColor: theme.border }}>
                <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: theme.glow }} />
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0" style={{ background: theme.iconBg }}>
                            {isEntry ? <IoLogInOutline size={26} className="text-white" /> : isAlreadyMarked ? <IoInformationCircleOutline size={26} className="text-white" /> : <IoLogOutOutline size={26} className="text-white" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: theme.text }}>{isEntry ? 'Entry Marked' : isAlreadyMarked ? 'Already Marked' : 'Exit Marked'}</p>
                            <h3 className="text-white font-black text-xl">{isEntry ? 'Welcome In' : isAlreadyMarked ? 'Attendance Complete' : 'See You Next Time'}</h3>
                        </div>
                    </div>
                    <div className="space-y-2.5 mb-5">
                        {isAlreadyMarked && <p className="text-sm text-gray-300 leading-relaxed mb-3">You have already completed your attendance for today.</p>}
                        {att.entryTime && (<div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5"><span className="text-xs text-gray-400 uppercase tracking-wider">Entry</span><span className="text-sm font-bold text-emerald-400">{att.entryTime}</span></div>)}
                        {!isEntry && att.exitTime && (<div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5"><span className="text-xs text-gray-400 uppercase tracking-wider">Exit</span><span className="text-sm font-bold text-red-400">{att.exitTime}</span></div>)}
                        {!isEntry && att.duration > 0 && (<div className="flex items-center justify-between rounded-xl px-4 py-2.5 border" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}><span className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: '#818cf8' }}><IoTimerOutline size={13} />Duration</span><span className="text-sm font-black" style={{ color: '#a5b4fc' }}>{Math.floor(att.duration / 60)}h {att.duration % 60}m</span></div>)}
                    </div>
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: theme.iconBg }}>Dismiss</button>
                </div>
            </motion.div>
        </div>
    );
};

/* ════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ════════════════════════════════════════════════════════════════════════ */
const StudentDashboard = () => {
    const [dashboardData, setDashboardData]           = useState(null);
    const [loading, setLoading]                       = useState(true);
    const [showIDCard, setShowIDCard]                 = useState(false);
    const [showFeeReminder, setShowFeeReminder]       = useState(false);
    const [showScanner, setShowScanner]               = useState(false);
    const [showSupportModal, setShowSupportModal]     = useState(false);
    const [showHistoryModal, setShowHistoryModal]     = useState(false);
    const [showNewspaper, setShowNewspaper]           = useState(false);
    const [showExamAlerts, setShowExamAlerts]         = useState(false);
    const [scanMessage, setScanMessage]               = useState(null);
    const [attendanceResult, setAttendanceResult]     = useState(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [loadingScanner, setLoadingScanner]         = useState(false);
    const [enablingLocation, setEnablingLocation]     = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const SETTINGS_KEY = 'lms_location_required';
    const getLocationRequired = () => { try { const c = localStorage.getItem(SETTINGS_KEY); if (c !== null) return c === 'true'; } catch (_) { } return true; };
    const loadSettingsCache = async () => { try { const res = await api.get('/public/settings'); if (res.data.success) localStorage.setItem(SETTINGS_KEY, String(res.data.settings.locationAttendance !== false)); } catch (_) { } };

    useEffect(() => { fetchDashboardData(); loadSettingsCache(); }, []);
    useEffect(() => { if (dashboardData?.feeReminder?.show) setShowFeeReminder(true); }, [dashboardData]);

    const fetchDashboardData = async () => {
        try { const res = await api.get('/student/dashboard'); setDashboardData(res.data.data); } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const getLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported.')); return; }
        navigator.geolocation.getCurrentPosition(
            p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
            () => reject(new Error('Location denied. Please allow location to mark attendance.')),
            { timeout: 10000, maximumAge: 0 }
        );
    });

    const handleOpenScanner = async () => {
        const isLocationRequired = getLocationRequired();
        if (isLocationRequired) {
            setLoadingScanner(true);
            try { await getLocation(); setShowScanner(true); } catch { setShowLocationPrompt(true); } finally { setLoadingScanner(false); }
        } else { setShowScanner(true); }
    };

    const handleEnableLocation = async () => {
        setEnablingLocation(true);
        try { await getLocation(); setShowLocationPrompt(false); setShowScanner(true); }
        catch { setScanMessage({ type: 'error', text: 'Location still denied. Check site settings.' }); setTimeout(() => setScanMessage(null), 5000); }
        finally { setEnablingLocation(false); }
    };

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            const isLocationRequired = getLocationRequired();
            let coords = {};
            if (isLocationRequired) { try { coords = await getLocation(); } catch (e) { setScanMessage({ type: 'error', text: e.message }); setTimeout(() => setScanMessage(null), 6000); return; } }
            const res = await api.post('/student/attendance/qr-scan', { qrToken: token, ...coords });
            if (res.data.success) { setAttendanceResult({ type: res.data.type, attendance: res.data.attendance }); fetchDashboardData(); }
        } catch (e) { setScanMessage({ type: 'error', text: e.response?.data?.message || 'Scan failed' }); setTimeout(() => setScanMessage(null), 6000); }
    };

    const handleQuickAttendance = async () => {
        try {
            const isLocationRequired = getLocationRequired();
            let coords = {};
            if (isLocationRequired) { try { coords = await getLocation(); } catch (e) { setScanMessage({ type: 'error', text: e.message }); setTimeout(() => setScanMessage(null), 6000); return; } }
            const res = await api.post('/student/attendance/mark-self', coords);
            if (res.data.success) { setAttendanceResult({ type: res.data.type, attendance: res.data.attendance }); fetchDashboardData(); }
        } catch (e) { setScanMessage({ type: 'error', text: e.response?.data?.message || 'Attendance failed' }); setTimeout(() => setScanMessage(null), 6000); }
    };

    const attPct    = dashboardData?.attendance?.percentage || 0;
    const attColor  = attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444';
    const isActive  = dashboardData ? dashboardData.isActive : user?.isActive;
    const hasSeat   = !!dashboardData?.seat?.number;
    const isRestricted = !isActive || !hasSeat;
    const initials  = (user?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const today     = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    /* ── Loading state ─────────────────────────────────────────────────── */
    if (loading) return (
        <div className="relative min-h-screen" style={{ background: '#070a10' }}>
            <style>{DASH_STYLE}</style>
            <div className="relative z-10"><DashboardSkeleton /></div>
            <FloatingAttendanceBtn loading={loadingScanner} onClick={handleOpenScanner} />
            {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}
        </div>
    );

    /* ── Render ─────────────────────────────────────────────────────────── */
    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#070a10' }}>
            <style>{DASH_STYLE}</style>

            {/* === Subtle background === */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div style={{ animation: 'orb1 16s ease-in-out infinite' }} className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/7 blur-[120px]" />
                <div style={{ animation: 'orb2 20s ease-in-out infinite' }} className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-700/6 blur-[120px]" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
            </div>

            {/* ─────────────────────────────────────────────────────────────
                  MODALS
               ───────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showLocationPrompt && <LocationPromptModal onClose={() => setShowLocationPrompt(false)} onEnable={handleEnableLocation} enabling={enablingLocation} />}
                {showIDCard && <IDCard student={{ ...user, isActive, registrationSource: dashboardData?.registrationSource, seat: dashboardData?.seat, shift: dashboardData?.seat?.shift, seatNumber: dashboardData?.seat?.number, shiftDetails: dashboardData?.seat?.shiftDetails }} onClose={() => setShowIDCard(false)} />}
                {showNewspaper && <NewspaperModal onClose={() => setShowNewspaper(false)} />}
                {showFeeReminder && dashboardData?.feeReminder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111827] border border-red-500/25 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-t-2xl" />
                            <div className="text-center mt-2 mb-5">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3"><IoNotificationsOutline className="text-red-400 text-2xl" /></div>
                                <h3 className="text-white font-bold text-lg">Fee Reminder</h3>
                                <p className="text-gray-400 text-sm mt-1">{dashboardData.feeReminder.message}</p>
                            </div>
                            <div className="flex justify-between items-center bg-white/4 p-4 rounded-xl mb-5 border border-white/8">
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Amount Due</span>
                                <span className="text-2xl font-black text-white">₹{dashboardData.feeReminder.amount}</span>
                            </div>
                            <button onClick={() => setShowFeeReminder(false)} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">I Understand</button>
                        </motion.div>
                    </div>
                )}
                {attendanceResult && <AttendanceResultCard result={attendanceResult} onClose={() => setAttendanceResult(null)} />}
            </AnimatePresence>

            <HelpSupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
            <RequestHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
            <ExamAlertsModal isOpen={showExamAlerts} onClose={() => setShowExamAlerts(false)} />
            {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}

            {/* Error toast */}
            <AnimatePresence>
                {scanMessage && (
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                        className="fixed top-6 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md bg-red-500/10 border-red-500/20 text-red-400 text-sm font-medium">
                        <IoCloseCircle size={20} />{scanMessage.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─────────────────────────────────────────────────────────────
                  TOP NAVBAR
               ───────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(7,10,16,0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center">
                        <span className="font-bold text-white text-sm">Apna <span className="text-orange-400">Lakshay</span></span>
                    </div>

                    {/* Nav right */}
                    <div className="flex items-center gap-2">
                        <Link to="/student/notifications" className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                            <IoNotificationsOutline size={20} />
                            {dashboardData?.unreadNotifications > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </Link>
                        <Link to="/student/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/8 transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                <IoPersonOutline size={16} />
                            </div>
                            <span className="text-gray-300 text-sm font-medium hidden sm:block group-hover:text-white transition-colors">{user?.name?.split(' ')[0]}</span>
                        </Link>

                    </div>
                </div>
            </header>

            {/* ─────────────────────────────────────────────────────────────
                  PAGE BODY
               ───────────────────────────────────────────────────────────── */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">

                {/* ── HERO WELCOME BANNER ─────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 rounded-2xl overflow-hidden relative"
                    style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.12) 50%, rgba(16,185,129,0.08) 100%)',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-purple-600/15 blur-3xl" />
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-blue-600/10 blur-2xl" />
                    </div>
                    <div className="relative p-5 sm:p-7 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0" style={{ animation: 'float 4s ease-in-out infinite' }}>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 blur-md opacity-50 scale-110" />
                                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xl border-2 border-white/15">
                                    {initials}
                                </div>
                                {isActive && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#070a10]" />}
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs mb-1 font-medium">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</p>
                                <h1 className="shimmer-text text-xl sm:text-2xl md:text-3xl font-black leading-tight">{user?.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    {isActive
                                        ? <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Active Member</span>
                                        : <span className="inline-flex items-center gap-1 text-[11px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-semibold">Inactive</span>}
                                    <span className="text-gray-600 text-[11px] hidden sm:inline">{today}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.section>

                {/* ── STATS ROW ────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
                >
                    {/* Seat */}
                    <Link to="/student/seat">
                        <div className="group rounded-xl p-4 border border-white/6 hover:border-blue-500/30 transition-all duration-200 cursor-pointer h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                                    <IoBedOutline size={14} className="text-blue-400" />
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">My Seat</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-white mb-0.5">{dashboardData?.seat?.number || '—'}</p>
                            <p className="text-[11px] text-gray-400">{dashboardData?.seat?.shift ? `${dashboardData.seat.shift.toUpperCase()} Shift` : 'Not Assigned'}</p>
                        </div>
                    </Link>

                    {/* Attendance */}
                    <Link to="/student/attendance">
                        <div className="group rounded-xl p-4 border border-white/6 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                                    <IoCalendarOutline size={14} className="text-emerald-400" />
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Attendance</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: attColor }}>{attPct}%</p>
                            <p className="text-[11px] text-gray-400">{dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days</p>
                        </div>
                    </Link>

                    {/* Fee */}
                    <Link to="/student/fees">
                        <div className="group rounded-xl p-4 border border-white/6 hover:border-amber-500/30 transition-all duration-200 cursor-pointer h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                                    <IoCashOutline size={14} className="text-amber-400" />
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Fee Status</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-white mb-1">{dashboardData?.fee ? `₹${dashboardData.fee.amount}` : '—'}</p>
                            {dashboardData?.fee?.status ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    dashboardData.fee.status === 'paid'
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                        : dashboardData.fee.status === 'overdue'
                                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                                        : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dashboardData.fee.status === 'paid' ? '#34d399' : dashboardData.fee.status === 'overdue' ? '#f87171' : '#fbbf24' }} />
                                    {dashboardData.fee.status === 'paid' ? 'Paid' : dashboardData.fee.status === 'overdue' ? 'Overdue' : 'Pending'}
                                </span>
                            ) : (
                                <p className="text-[11px] text-gray-400">No record</p>
                            )}
                        </div>
                    </Link>

                    {/* Notifications */}
                    <Link to="/student/notifications">
                        <div className="group rounded-xl p-4 border border-white/6 hover:border-pink-500/30 transition-all duration-200 cursor-pointer h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
                                    <IoNotificationsOutline size={14} className="text-pink-400" />
                                </div>
                                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Alerts</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-white mb-0.5">{dashboardData?.unreadNotifications || 0}</p>
                            <p className="text-[11px] text-gray-400">Unread notifications</p>
                        </div>
                    </Link>
                </motion.div>

                {/* ── TWO-COLUMN LAYOUT (actions + learning) ───────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* LEFT: Quick Actions list */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.45 }}
                        className="lg:col-span-3 rounded-2xl border border-white/6 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.025)' }}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <IoFlashOutline size={14} className="text-purple-400" />
                                </div>
                                <h2 className="text-white font-bold text-sm">Quick Actions</h2>
                            </div>
                        </div>

                        {/* Action grid — 3 per row, premium cards */}
                        <div className="p-4 grid grid-cols-3 gap-3">
                            {[
                                { icon: IoIdCardOutline,      label: 'ID Card',        accentColor: '#6366f1', accentBg: 'rgba(99,102,241,0.1)',   action: () => setShowIDCard(true) },
                                { icon: IoBookOutline,        label: 'Planner',        accentColor: '#ec4899', accentBg: 'rgba(236,72,153,0.1)',   link: '/student/planner' },
                                { icon: IoChatbubblesOutline, label: 'Discussion',     accentColor: '#f97316', accentBg: 'rgba(249,115,22,0.1)',   link: '/student/chat' },
                                { icon: IoNewspaper,          label: 'Newspaper',      accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.1)',   action: () => setShowNewspaper(true) },
                                { icon: IoAlertCircleOutline, label: 'Exam Alerts',    accentColor: '#ef4444', accentBg: 'rgba(239,68,68,0.1)',    action: () => setShowExamAlerts(true), live: true },
                                { icon: IoHelpCircleOutline,  label: 'Support',        accentColor: '#eab308', accentBg: 'rgba(234,179,8,0.1)',    action: () => setShowSupportModal(true), badge: dashboardData?.requestsCount || 0 },
                            ].map((item, i) => {
                                const Card = (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.18 + i * 0.06, type: 'spring', stiffness: 120 }}
                                        whileHover={{ y: -3 }}
                                        onClick={item.action}
                                        className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group"
                                        style={{
                                            background: `linear-gradient(145deg, ${item.accentBg}, rgba(255,255,255,0.02))`,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            padding: '14px 14px 16px',
                                            minHeight: '110px',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = `${item.accentColor}40`;
                                            e.currentTarget.style.boxShadow = `0 8px 32px -8px ${item.accentColor}30`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Accent line top */}
                                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-70 group-hover:opacity-100 transition-opacity"
                                            style={{ background: `linear-gradient(90deg, ${item.accentColor}, transparent)` }} />

                                        {/* Ghost icon — large faded background accent */}
                                        <item.icon
                                            size={56}
                                            className="absolute -bottom-2 -right-2 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                                            style={{ color: item.accentColor }}
                                        />

                                        {/* LIVE badge */}
                                        {item.live && (
                                            <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                                                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ef4444' }} />LIVE
                                            </span>
                                        )}

                                        {/* Badge count */}
                                        {item.badge > 0 && (
                                            <span className="absolute top-3 right-3 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}

                                        {/* Icon box */}
                                        <div className="relative w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-200"
                                            style={{ background: `${item.accentColor}18` }}>
                                            <item.icon size={18} style={{ color: item.accentColor }} />
                                        </div>

                                        {/* Label */}
                                        <p className="relative text-[13px] font-bold text-white leading-snug">{item.label}</p>
                                    </motion.div>
                                );
                                return item.link
                                    ? <Link key={i} to={item.link} className="block">{Card}</Link>
                                    : <div key={i}>{Card}</div>;
                            })}
                        </div>
                    </motion.div>

                    {/* RIGHT: Learning + ID card shortcuts */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24, duration: 0.45 }}
                        className="lg:col-span-2 flex flex-col gap-4"
                    >
                        {/* Learning section */}
                        <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                    <IoLibraryOutline size={14} className="text-cyan-400" />
                                </div>
                                <h2 className="text-white font-bold text-sm">Learning</h2>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {[
                                    { icon: IoBookOutline,        label: 'Books',        desc: 'Curated study books',  accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.08)',  to: '/student/books',     locked: isRestricted },
                                    { icon: IoDocumentTextOutline, label: 'Notes',       desc: 'Browse & download',    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.08)',  to: '/student/notes',     locked: isRestricted },
                                    { icon: IoSparklesOutline,    label: 'AI Mock Test', desc: 'Practice tests · β',   accentColor: '#f59e0b', accentBg: 'rgba(245,158,11,0.08)', to: '/student/mock-test', locked: isRestricted, newBeta: true },
                                ].map((item, i) => {
                                    const targetRoute = item.locked ? '/pending-allocation' : item.to;
                                    const Card = (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.28 + i * 0.07, type: 'spring', stiffness: 120 }}
                                            whileHover={!item.locked ? { y: -2 } : {}}
                                            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl ${item.locked ? 'opacity-55' : 'cursor-pointer'}`}
                                            style={{
                                                background: `linear-gradient(145deg, ${item.accentBg}, rgba(255,255,255,0.015))`,
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                padding: '14px 14px 16px',
                                                minHeight: '100px',
                                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                            }}
                                            onMouseEnter={e => {
                                                if (!item.locked) {
                                                    e.currentTarget.style.borderColor = `${item.accentColor}40`;
                                                    e.currentTarget.style.boxShadow = `0 8px 28px -8px ${item.accentColor}28`;
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Accent line top */}
                                            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity"
                                                style={{ background: `linear-gradient(90deg, ${item.accentColor}, transparent)` }} />

                                            {/* Ghost icon */}
                                            <item.icon
                                                size={52}
                                                className="absolute -bottom-1 -right-1 opacity-[0.06] transition-opacity"
                                                style={{ color: item.accentColor }}
                                            />

                                            {/* Badges */}
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                                {item.newBeta && !item.locked && (
                                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                                                        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>NEW</span>
                                                )}
                                                {item.locked && <IoLockClosedOutline size={12} className="text-gray-600" />}
                                            </div>

                                            {/* Icon */}
                                            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                                style={{ background: `${item.accentColor}18` }}>
                                                <item.icon size={17} style={{ color: item.accentColor }} />
                                            </div>

                                            {/* Label + desc */}
                                            <div className="relative">
                                                <p className="text-[13px] font-bold text-white leading-snug">{item.label}</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(156,163,175,0.7)' }}>{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    );
                                    return <Link key={i} to={targetRoute}>{Card}</Link>;
                                })}
                            </div>
                        </div>

                    </motion.div>
                </div>

                {/* ── LMS GUIDE ──────────────────────────────────────── */}
                <div className="mt-5">
                    <LmsGuideSection />
                </div>

                <div className="mt-5">
                    <Footer />
                </div>
            </main>

            {/* Floating attendance button (mobile) */}
            <FloatingAttendanceBtn loading={loadingScanner} onClick={handleOpenScanner} />
        </div>
    );
};

export default StudentDashboard;
