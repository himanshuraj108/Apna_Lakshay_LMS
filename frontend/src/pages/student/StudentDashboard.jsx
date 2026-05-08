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
    IoMenuOutline, IoCloseOutline, IoKeypadOutline,
    IoCameraOutline, IoCameraReverseOutline, IoAddOutline
} from 'react-icons/io5';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import HelpSupportModal from '../../components/student/HelpSupportModal';
import RequestHistoryModal from '../../components/student/RequestHistoryModal';
import LmsGuideSection from '../../components/student/LmsGuideSection';
import NewspaperModal from '../../components/student/NewspaperModal';
import InactiveScreen from '../../components/student/InactiveScreen';
import Footer from '../../components/layout/Footer';

/* ─── Beep + Vibrate (same pattern as QR scanner) ───────────────── */
let _beepBuffer = null;
const _audioCtx = typeof window !== 'undefined'
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;
if (_audioCtx) {
    fetch('/beep.mp3')
        .then(r => r.arrayBuffer())
        .then(d => _audioCtx.decodeAudioData(d))
        .then(b => { _beepBuffer = b; })
        .catch(() => { _beepBuffer = null; });
}
const playSuccessBeep = () => {
    if (!_audioCtx) return;
    try {
        if (_beepBuffer) {
            const src = _audioCtx.createBufferSource();
            const gain = _audioCtx.createGain();
            src.buffer = _beepBuffer;
            gain.gain.value = 3.0;
            src.connect(gain); gain.connect(_audioCtx.destination);
            src.start(0);
        } else {
            const osc = _audioCtx.createOscillator();
            const gain = _audioCtx.createGain();
            osc.connect(gain); gain.connect(_audioCtx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(3800, _audioCtx.currentTime);
            gain.gain.setValueAtTime(3.0, _audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.12);
            osc.start(_audioCtx.currentTime); osc.stop(_audioCtx.currentTime + 0.12);
        }
    } catch (_) {}
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
};

/* ─── CSS injected once ─────────────────────────────────────────────── */
const DASH_STYLE = `
@keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
@keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-40px,30px) scale(1.08);}66%{transform:translate(20px,-30px) scale(0.92);}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes pulse-ring{0%{transform:scale(.9);opacity:1;}80%,100%{transform:scale(1.35);opacity:0;}}
@keyframes shimmer-name{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes blink-new{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(250,204,21,0.5);}50%{opacity:0.7;box-shadow:0 0 8px 3px rgba(250,204,21,0.35);}}
@keyframes blink-green{0%,100%{opacity:1;text-shadow:0 0 8px rgba(34,197,94,0.9);}50%{opacity:0.7;text-shadow:0 0 16px rgba(34,197,94,0.5);}}
@keyframes blink-red{0%,100%{opacity:1;text-shadow:0 0 8px rgba(239,68,68,0.9);}50%{opacity:0.7;text-shadow:0 0 16px rgba(239,68,68,0.5);}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-name 4s linear infinite;}
.new-badge-blink{animation:blink-new 1.4s ease-in-out infinite;}
.label-blink-green{animation:blink-green 1.1s ease-in-out infinite;color:#22c55e;font-weight:800;}
.label-blink-red{animation:blink-red 1.1s ease-in-out infinite;color:#ef4444;font-weight:800;}
@keyframes fab-blink{0%,100%{box-shadow:0 8px 32px rgba(16,185,129,0.5),0 0 0 1px rgba(255,255,255,0.12);}50%{box-shadow:0 8px 48px rgba(16,185,129,0.9),0 0 0 4px rgba(16,185,129,0.25);}}
.fab-blink{animation:fab-blink 1.6s ease-in-out infinite;}
`;

/* ─── No-Camera SVG icon: black camera + red diagonal slash ─── */
const NoCameraIcon = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="12" cy="13" r="4" stroke="#111" strokeWidth="2" fill="none"/>
        {/* Bold red slash top-left → bottom-right */}
        <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
);

/* ─── Speed Dial FAB — expands to Camera / No-Camera sub-buttons ─── */
const SpeedDialFAB = ({ loading, onCamera, onManual, manualEnabled }) => {
    const [open, setOpen] = useState(false);

    const toggle = () => { if (!loading) setOpen(o => !o); };
    const doCamera = () => { setOpen(false); onCamera(); };
    const doManual = () => { setOpen(false); onManual(); };

    const subBtns = [
        manualEnabled && {
            key: 'manual',
            icon: <NoCameraIcon size={32} />,
            label: 'Without Camera',
            labelClass: 'label-blink-red',
            bgBtn: '#ffffff',
            shadow: 'rgba(239,68,68,0.35)',
            onClick: doManual,
        },
        {
            key: 'camera',
            icon: <IoCameraOutline size={32} color="#111" />,
            label: 'With Camera',
            labelClass: 'label-blink-green',
            bgBtn: '#ffffff',
            shadow: 'rgba(34,197,94,0.35)',
            onClick: doCamera,
        },
    ].filter(Boolean);

    return (
        <>
            {/* ── Centered sub-button overlay ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="fab-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-[61] flex flex-col items-center justify-center gap-8"
                        style={{ pointerEvents: 'none' }}
                    >
                        {subBtns.map((btn, i) => (
                            <motion.div
                                key={btn.key}
                                initial={{ opacity: 0, scale: 0.6, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.6, y: 30 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 24, delay: i * 0.1 }}
                                className="flex flex-col items-center gap-3 cursor-pointer"
                                style={{ pointerEvents: 'auto' }}
                                onClick={btn.onClick}
                            >
                                {/* Icon square */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.88 }}
                                    className="w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 relative overflow-hidden"
                                    style={{
                                        background: btn.bgBtn,
                                        boxShadow: `0 10px 40px ${btn.shadow}, 0 0 0 2px rgba(0,0,0,0.08)`,
                                    }}
                                >
                                    {btn.key === 'camera'
                                        ? <IoCameraOutline size={48} color="#111" />
                                        : <NoCameraIcon size={48} />
                                    }
                                    {/* Red slash for Without Camera */}
                                    {btn.key === 'manual' && (
                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 96 96" fill="none" style={{ pointerEvents: 'none', borderRadius: 'inherit' }}>
                                            <line x1="8" y1="8" x2="88" y2="88" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </motion.button>

                                {/* Label below icon */}
                                <motion.span
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ delay: i * 0.1 + 0.08 }}
                                    className="text-lg font-extrabold rounded-2xl shadow-2xl select-none text-center"
                                    style={{
                                        padding: '10px 22px',
                                        background: '#0e1015',
                                        border: '1px solid rgba(255,255,255,0.13)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span className={btn.labelClass}>{btn.label}</span>
                                </motion.span>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main FAB — bottom right ── */}
            <div className="fixed bottom-6 right-5 z-[60]">
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.35 }}
                    whileHover={!loading ? { scale: 1.07 } : {}}
                    whileTap={!loading ? { scale: 0.93 } : {}}
                    onClick={toggle}
                    disabled={loading}
                    className={`relative flex items-center justify-center rounded-2xl font-bold text-white shadow-2xl overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed${!loading && !open ? ' fab-blink' : ''}`}
                    style={{
                        padding: open ? '18px' : '14px 24px',
                        gap: open ? 0 : '10px',
                        background: loading ? 'rgba(60,65,80,0.9)' : open ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#10b981,#14b8a6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        transition: 'background 0.25s, padding 0.2s',
                    }}
                >
                    {open ? (
                        <motion.div
                            key="close-icon"
                            initial={{ rotate: -45, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 45, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                        >
                            <IoCloseOutline size={20} />
                        </motion.div>
                    ) : (
                        <>
                            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/20">
                                {loading
                                    ? <IoTimeOutline size={20} className="animate-spin" />
                                    : <IoScan size={20} />
                                }
                            </div>
                            <span className="text-base font-bold relative">
                                {loading ? 'Checking…' : 'Mark Attendance'}
                            </span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Backdrop — full blur overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="fab-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[59]"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

/* â”€â”€â”€ Location Prompt Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
                {enabling ? <><IoTimeOutline size={16} className="animate-spin" />Requestingâ€¦</> : <><IoLocation size={16} />Enable Location</>}
            </button>
            <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-all font-medium">Dismiss</button>
        </motion.div>
    </div>
);

/* â”€â”€â”€ Attendance Result Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
                        {isAlreadyMarked && (
                            <p className="text-sm text-gray-300 leading-relaxed mb-3">
                                You have already completed your attendance for today.
                            </p>
                        )}
                        {/* Entry Time — always shown if present */}
                        {att.entryTime && (
                            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Entry</span>
                                <span className="text-sm font-bold text-emerald-400">{att.entryTime}</span>
                            </div>
                        )}
                        {/* Exit Time — show for exit and already_marked */}
                        {(isAlreadyMarked || result.type === 'exit') && att.exitTime && (
                            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Exit</span>
                                <span className="text-sm font-bold text-red-400">{att.exitTime}</span>
                            </div>
                        )}
                        {/* Duration — show for exit and already_marked */}
                        {(isAlreadyMarked || result.type === 'exit') && att.duration > 0 && (
                            <div className="flex items-center justify-between rounded-xl px-4 py-2.5 border"
                                style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
                                <span className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: '#818cf8' }}>
                                    <IoTimerOutline size={13} />Duration
                                </span>
                                <span className="text-sm font-black" style={{ color: '#a5b4fc' }}>
                                    {Math.floor(att.duration / 60)}h {att.duration % 60}m
                                </span>
                            </div>
                        )}
                        {/* Notes — show for already_marked if present */}
                        {isAlreadyMarked && att.notes && (
                            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Note</span>
                                <span className="text-xs text-amber-400 font-medium text-right max-w-[60%]">{att.notes}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: theme.iconBg }}>Dismiss</button>

                </div>
            </motion.div>
        </div>
    );
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN DASHBOARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StudentDashboard = () => {
    const [dashboardData, setDashboardData]           = useState(null);
    const [loading, setLoading]                       = useState(true);
    const [showIDCard, setShowIDCard]                 = useState(false);
    const [showFeeReminder, setShowFeeReminder]       = useState(false);
    const [showScanner, setShowScanner]               = useState(false);
    const [showSupportModal, setShowSupportModal]     = useState(false);
    const [showHistoryModal, setShowHistoryModal]     = useState(false);
    const [showNewspaper, setShowNewspaper]           = useState(false);
    const [scanMessage, setScanMessage]               = useState(null);
    const [attendanceResult, setAttendanceResult]     = useState(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [loadingScanner, setLoadingScanner]         = useState(false);
    const [enablingLocation, setEnablingLocation]     = useState(false);
    const [cardConfig, setCardConfig]                 = useState(null);
    const [pinEnabled, setPinEnabled]                 = useState(false);
    const [manualMarkEnabled, setManualMarkEnabled]   = useState(false); // true when admin allows manual (with or without PIN)
    const [showPinModal, setShowPinModal]             = useState(false);
    const [pinValue, setPinValue]                     = useState('');
    const [pinLoading, setPinLoading]                 = useState(false);
    const [pinError, setPinError]                     = useState('');
    const [directMarkLoading, setDirectMarkLoading]   = useState(false);
    const { logout, user } = useAuth();
    const isActive = user?.isActive;
    const navigate = useNavigate();

    const SETTINGS_KEY = 'lms_location_required';
    const getLocationRequired = () => { try { const c = localStorage.getItem(SETTINGS_KEY); if (c !== null) return c === 'true'; } catch (_) { } return true; };
    const loadSettingsCache = async () => { try { const res = await api.get('/public/settings'); if (res.data.success) localStorage.setItem(SETTINGS_KEY, String(res.data.settings.locationAttendance !== false)); } catch (_) { } };

    const fetchCardConfig = async () => {
        try {
            const res = await api.get('/student/card-config');
            setCardConfig(res.data);
        } catch { /* use defaults if fails */ }
    };

    useEffect(() => { fetchDashboardData(); loadSettingsCache(); fetchCardConfig(); fetchPinStatus(); }, []);
    useEffect(() => { if (dashboardData?.feeReminder?.show) setShowFeeReminder(true); }, [dashboardData]);

    const fetchPinStatus = async () => {
        try {
            const res = await api.get('/public/settings');
            const s = res.data?.settings;
            if (s) {
                // pinEnabled = PIN required; manualMarkEnabled = button visible (PIN on OR off but system allows manual)
                setPinEnabled(!!s.pinAttendanceEnabled);
                // Show the button if PIN is ON (requires pin) OR if system is active and admin wants direct mark
                // We use pinAttendanceEnabled as the ON/OFF for the whole manual feature
                // When PIN=true → modal; When PIN=false but system active → direct mark
                setManualMarkEnabled(true); // always show when system is reachable; backend enforces
            }
        } catch (_) {}
    };

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
            if (res.data.success) {
                const isNew = res.data.type !== 'already_marked';
                if (isNew) playSuccessBeep();
                setAttendanceResult({ type: res.data.type, attendance: res.data.attendance });
                fetchDashboardData();
            }
        } catch (e) { setScanMessage({ type: 'error', text: e.response?.data?.message || 'Scan failed' }); setTimeout(() => setScanMessage(null), 6000); }
    };
    const handleQuickAttendance = async () => {
        try {
            const isLocationRequired = getLocationRequired();
            let coords = {};
            if (isLocationRequired) { try { coords = await getLocation(); } catch (e) { setScanMessage({ type: 'error', text: e.message }); setTimeout(() => setScanMessage(null), 6000); return; } }
            const res = await api.post('/student/attendance/mark-self', coords);
            if (res.data.success) {
                const isNew = res.data.type !== 'already_marked';
                if (isNew) playSuccessBeep();
                setAttendanceResult({ type: res.data.type, attendance: res.data.attendance });
                fetchDashboardData();
            }
        } catch (e) { setScanMessage({ type: 'error', text: e.response?.data?.message || 'Attendance failed' }); setTimeout(() => setScanMessage(null), 6000); }
    };

    const handlePinAttendance = async () => {
        const trimmed = pinValue.trim();
        if (!trimmed) { setPinError('Please enter your PIN.'); return; }
        setPinLoading(true); setPinError('');
        try {
            const res = await api.post('/student/attendance/mark-pin', { pin: trimmed });
            if (res.data.success) {
                const isNew = res.data.type !== 'already_marked';
                if (isNew) playSuccessBeep();          // beep only for fresh marks
                setShowPinModal(false);
                setPinValue('');
                setAttendanceResult({
                    type: res.data.type,
                    attendance: res.data.attendance,
                    message: res.data.message
                });
                if (isNew) fetchDashboardData();       // refresh only if something changed
            }
        } catch (e) {
            setPinError(e.response?.data?.message || 'PIN incorrect or attendance failed.');
        } finally { setPinLoading(false); }
    };

    const handleDirectMark = async () => {
        setDirectMarkLoading(true);
        try {
            const res = await api.post('/student/attendance/mark-direct');
            if (res.data.success) {
                const isNew = res.data.type !== 'already_marked';
                if (isNew) playSuccessBeep();
                // Success → close modal, show result card
                setShowPinModal(false);
                setAttendanceResult({ type: res.data.type, attendance: res.data.attendance, message: res.data.message });
                if (isNew) fetchDashboardData();
            }
        } catch (e) {
            // Show error INSIDE the modal (not as a toast behind the backdrop)
            setPinError(e.response?.data?.message || 'Could not mark attendance. Please try again.');
            // Modal stays open so student can read the wait message clearly
        } finally { setDirectMarkLoading(false); }
    };

    const handleWithoutCamera = () => {
        // Always open the modal — PIN input shown conditionally inside
        setShowPinModal(true); setPinError(''); setPinValue('');
    };

    const attPct    = dashboardData?.attendance?.percentage || 0;
    const attColor  = attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444';
    const initials  = (user?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const today     = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    /* â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (loading) return (
        <div className="relative min-h-screen" style={{ background: '#070a10' }}>
            <style>{DASH_STYLE}</style>
            <div className="relative z-10"><DashboardSkeleton /></div>
            {!showScanner && <SpeedDialFAB loading={loadingScanner} onCamera={handleOpenScanner} onManual={handleWithoutCamera} manualEnabled={manualMarkEnabled} />}
            {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}
        </div>
    );


    /* -- Inactive guard -- blocks all dashboard access -- */
    if (!isActive) {
        return <InactiveScreen user={user} onLogout={handleLogout} />;
    }

    /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#F8FAFC', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style>{DASH_STYLE}</style>

            {/* === Light dot grid background === */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  MODALS
               â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <AnimatePresence>
                {showLocationPrompt && <LocationPromptModal onClose={() => setShowLocationPrompt(false)} onEnable={handleEnableLocation} enabling={enablingLocation} />}
                {showIDCard && <IDCard student={{ ...user, isActive, registrationSource: dashboardData?.registrationSource, seat: dashboardData?.seat, shift: dashboardData?.seat?.shift, shifts: dashboardData?.seat?.shifts, seatNumber: dashboardData?.seat?.number, shiftDetails: dashboardData?.seat?.shiftDetails }} onClose={() => setShowIDCard(false)} />}
                {showNewspaper && <NewspaperModal onClose={() => setShowNewspaper(false)} />}

                {/* ── Manual Attendance Modal (PIN or Direct) ── */}
                {showPinModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
                            style={{ background: 'linear-gradient(135deg,#0f1117,#12141c)', border: '1px solid rgba(251,191,36,0.2)' }}
                        >
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-500/10 rounded-xl"><IoKeypadOutline size={18} className="text-amber-400" /></div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">Manual Attendance</h3>
                                        <p className="text-gray-500 text-xs">
                                            {pinEnabled ? 'Enter the daily PIN from your admin' : 'Click below to mark your attendance'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowPinModal(false); setPinValue(''); setPinError(''); }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                                    <IoCloseCircle size={20} />
                                </button>
                            </div>

                            {/* PIN input — only shown when PIN mode is ON */}
                            {pinEnabled && (
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={pinValue}
                                        onChange={e => { setPinValue(e.target.value.slice(0, 8)); setPinError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && handlePinAttendance()}
                                        placeholder="Enter PIN"
                                        autoFocus
                                        className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/50 text-white text-lg font-bold tracking-widest rounded-xl px-4 py-3 outline-none placeholder-gray-700 text-center"
                                    />
                                </div>
                            )}

                            {/* Direct mode info — shown when PIN is OFF */}
                            {!pinEnabled && (
                                <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 mb-4">
                                    <IoFlashOutline size={18} className="text-amber-400 shrink-0" />
                                    <p className="text-amber-200/80 text-sm">Your attendance will be marked instantly without a PIN.</p>
                                </div>
                            )}

                            {pinError && <p className="text-red-400 text-xs text-center mb-3">{pinError}</p>}

                            <button
                                onClick={pinEnabled ? handlePinAttendance : handleDirectMark}
                                disabled={pinEnabled ? (pinLoading || !pinValue) : directMarkLoading}
                                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#000' }}
                            >
                                {(pinEnabled ? pinLoading : directMarkLoading)
                                    ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Marking…</span>
                                    : '✓ Mark Attendance'
                                }
                            </button>
                        </motion.div>
                    </div>
                )}
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
                            {dashboardData.onlinePaymentEnabled ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setShowFeeReminder(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">Later</button>
                                    <Link to="/student/fees?pay=now" onClick={() => setShowFeeReminder(false)} className="flex-1 block text-center py-3 bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/20 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Pay</Link>
                                </div>
                            ) : (
                                <button onClick={() => setShowFeeReminder(false)} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">I Understand</button>
                            )}
                        </motion.div>
                    </div>
                )}
                {attendanceResult && <AttendanceResultCard result={attendanceResult} onClose={() => setAttendanceResult(null)} />}
            </AnimatePresence>

            <HelpSupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
            <RequestHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
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

            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  TOP NAVBAR
               â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F97316' }}>
                            <IoLibraryOutline size={14} style={{ color: '#fff' }} />
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#111827' }}>Apna <span style={{ color: '#F97316' }}>Lakshay</span></span>
                    </div>

                    {/* Nav right */}
                    <div className="flex items-center gap-2">
                        <Link to="/student/notifications" className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all" style={{ color: '#6B7280' }}>
                            <IoNotificationsOutline size={20} />
                            {dashboardData?.unreadNotifications > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </Link>
                        <Link to="/student/profile" className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center" style={{ color: '#6B7280' }}>
                                <IoPersonOutline size={16} />
                            </div>
                            <span className="text-sm font-medium hidden sm:block" style={{ color: '#374151' }}>{user?.name?.split(' ')[0]}</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                  PAGE BODY
               â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">

                {/* -- HERO GREETING BAR ------------------------------------------ */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                                {initials}
                            </div>
                            {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#FFF7ED]" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm" style={{ color: '#111827' }}>{user?.name?.split(" ")[0]}</span>
                            <span className="text-sm">{String.fromCodePoint(0x1F44B)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] hidden sm:block" style={{ color: '#9CA3AF' }}>{today}</span>
                        {isActive
                            ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-semibold"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Active</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 border border-red-200 text-red-500 px-2 py-0.5 rounded-full font-semibold">Inactive</span>}
                    </div>
                </motion.div>


                {/* â”€â”€ STATS ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
                >
                    <Link to="/student/seat">
                        <div className="group rounded-xl p-4 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                    <IoBedOutline size={14} className="text-blue-500" />
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>My Seat</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: '#111827' }}>{dashboardData?.seat?.number || '—'}</p>
                            {dashboardData?.seat?.shifts && dashboardData.seat.shifts.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {dashboardData.seat.shifts.map((s, i) => (
                                        <span key={i} className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                                            {s.name}{s.startTime ? ` ${s.startTime}–${s.endTime}` : ''} 
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{dashboardData?.seat?.shift ? `${dashboardData.seat.shift.toUpperCase()} Shift` : 'Not Assigned'}</p>
                            )}
                        </div>
                    </Link>

                    {/* Attendance */}
                    <Link to="/student/attendance">
                        <div className="group relative rounded-xl p-4 bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                                    <IoCalendarOutline size={14} className="text-emerald-500" />
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Attendance</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: attColor }}>{attPct}%</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days</p>
                            {dashboardData?.attendance?.rank && (
                                <span className="absolute bottom-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C3AED' }}>
                                    Rank #{dashboardData.attendance.rank}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Fee */}
                    <div onClick={() => navigate('/student/fees')} className="group rounded-xl p-4 bg-white border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full flex flex-col justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                                <IoCashOutline size={14} className="text-amber-500" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Fee Status</span>
                        </div>

                        <p className="text-xl sm:text-2xl font-black mb-2" style={{ color: '#111827' }}>
                            {dashboardData?.fee ? `₹${dashboardData.fee.status === 'partial' ? (dashboardData.fee.outstanding ?? dashboardData.fee.amount) : dashboardData.fee.amount}` : '—'}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                            {dashboardData?.fee?.status ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${
                                    dashboardData.fee.status === 'paid'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                        : dashboardData.fee.status === 'overdue'
                                        ? 'bg-red-50 border-red-200 text-red-500'
                                        : dashboardData.fee.status === 'partial'
                                        ? 'bg-orange-50 border-orange-200 text-orange-500'
                                        : 'bg-amber-50 border-amber-200 text-amber-600'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dashboardData.fee.status === 'paid' ? '#34d399' : dashboardData.fee.status === 'overdue' ? '#f87171' : dashboardData.fee.status === 'partial' ? '#fb923c' : '#fbbf24' }} />
                                    {dashboardData.fee.status.charAt(0).toUpperCase() + dashboardData.fee.status.slice(1)}
                                </span>
                            ) : (
                                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>No record</p>
                            )}

                            {dashboardData?.fee?.status && dashboardData.fee.status !== 'paid' && dashboardData.onlinePaymentEnabled && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/student/fees?pay=now');
                                    }}
                                    className="px-3 py-1 text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity"
                                    style={{ background: '#F97316' }}
                                >
                                    Pay Online
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications */}
                    <Link to="/student/notifications">
                        <div className="group rounded-xl p-4 bg-white border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.1)' }}>
                                    <IoNotificationsOutline size={14} className="text-pink-500" />
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Alerts</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: '#111827' }}>{dashboardData?.unreadNotifications || 0}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Unread notifications</p>
                        </div>
                    </Link>
                </motion.div>

                {/* â”€â”€ TWO-COLUMN LAYOUT (actions + learning) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* LEFT: Quick Actions list */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.45 }}
                        className="lg:col-span-3 rounded-2xl border border-gray-200 overflow-hidden bg-white"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <IoFlashOutline size={14} className="text-orange-500" />
                                </div>
                                <h2 className="font-bold text-sm" style={{ color: '#111827' }}>Quick Actions</h2>
                            </div>
                        </div>

                        {/* Action grid â€” 3 per row, premium cards */}
                        <div className="p-4 grid grid-cols-3 gap-3">
                            {(() => {
                                const BASE_QA = [
                                    { id: 'id-card',        icon: IoIdCardOutline,      label: 'ID Card',        accentColor: '#6366f1', accentBg: 'rgba(99,102,241,0.1)',   action: () => setShowIDCard(true) },
                                    { id: 'planner',        icon: IoBookOutline,        label: 'Planner',        accentColor: '#ec4899', accentBg: 'rgba(236,72,153,0.1)',   link: '/student/planner' },
                                    { id: 'discussion',     icon: IoChatbubblesOutline, label: 'Discussion',     accentColor: '#f97316', accentBg: 'rgba(249,115,22,0.1)',   link: '/student/chat' },
                                    { id: 'newspaper',      icon: IoNewspaper,          label: 'Newspaper',      accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.1)',   action: () => setShowNewspaper(true) },
                                    { id: 'current-affairs',icon: IoGridOutline,        label: 'Current Affairs',accentColor: '#38bdf8', accentBg: 'rgba(56,189,248,0.1)',   link: '/student/current-affairs', live: true },
                                    { id: 'exam-alerts',    icon: IoAlertCircleOutline, label: 'Exam Alerts',    accentColor: '#f97316', accentBg: 'rgba(249,115,22,0.1)',   link: '/student/exam-alerts', live: true },
                                    { id: 'my-report',      icon: IoDocumentTextOutline,label: 'My Report',      accentColor: '#14b8a6', accentBg: 'rgba(20,184,166,0.1)',   link: '/student/report' },
                                    { id: 'ask-ai',         icon: IoSparklesOutline,    label: 'Ask AI',         accentColor: '#FACC15', accentBg: 'rgba(250,204,21,0.1)',   link: '/student/doubt', desc: dashboardData?.doubtCredits != null ? `${dashboardData.doubtCredits} credits left` : 'AI powered' },
                                    { id: 'support',        icon: IoHelpCircleOutline,  label: 'Support',        accentColor: '#eab308', accentBg: 'rgba(234,179,8,0.1)',    action: () => setShowSupportModal(true), badge: dashboardData?.requestsCount || 0 },
                                ];
                                const cfg = cardConfig?.quickActions;
                                if (!cfg) return BASE_QA;
                                return BASE_QA
                                    .map(c => { const cf = cfg.find(x => x.id === c.id); return cf ? { ...c, _order: cf.order ?? 99, _visible: cf.visible !== false, _isNew: !!cf.isNew } : { ...c, _order: 99, _visible: true, _isNew: false }; })
                                    .filter(c => c._visible)
                                    .sort((a,b) => (a._order ?? 99) - (b._order ?? 99));
                            })().map((item, i) => {
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
                                            border: '1px solid #F3F4F6',
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

                                        {/* Ghost icon â€” large faded background accent */}
                                        <item.icon
                                            size={56}
                                            className="absolute -bottom-2 -right-2 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                                            style={{ color: item.accentColor }}
                                        />

                                        {/* LIVE badge */}
                                        {item.live && !item._isNew && (
                                            <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                                                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ef4444' }} />LIVE
                                            </span>
                                        )}

                                        {/* NEW badge */}
                                        {item._isNew && (
                                            <span className="new-badge-blink absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                                                style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.35)', color: '#FACC15' }}>
                                                NEW
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

                                        {/* Label + optional desc */}
                                        <p className="relative text-[13px] font-bold leading-snug" style={{ color: '#111827' }}>{item.label}</p>
                                        {item.desc && <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${item.accentColor}99` }}>{item.desc}</p>}
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
                        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
                                    <IoLibraryOutline size={14} className="text-cyan-500" />
                                </div>
                                <h2 className="font-bold text-sm" style={{ color: '#111827' }}>Learning</h2>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {(() => {
                                    const BASE_L = [
                                        { id: 'books',     icon: IoBookOutline,        label: 'Books',        desc: 'Curated study books',  accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.08)',  to: '/student/books',     locked: false },
                                        { id: 'notes',     icon: IoDocumentTextOutline, label: 'Notes',       desc: 'Browse & download',    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.08)',  to: '/student/notes',     locked: false },
                                        { id: 'mock-test', icon: IoSparklesOutline,    label: 'AI Mock Test', desc: 'Practice tests',        accentColor: '#f59e0b', accentBg: 'rgba(245,158,11,0.08)', to: '/student/mock-test', locked: false },
                                    ];
                                    const cfg = cardConfig?.learning;
                                    if (!cfg) return BASE_L;
                                    return BASE_L
                                        .map(c => { const cf = cfg.find(x => x.id === c.id); return cf ? { ...c, _order: cf.order ?? 99, _visible: cf.visible !== false, _isNew: !!cf.isNew } : { ...c, _order: 99, _visible: true, _isNew: false }; })
                                        .filter(c => c._visible)
                                        .sort((a,b) => (a._order ?? 99) - (b._order ?? 99));
                                })().map((item, i) => {
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
                                                border: '1px solid #F3F4F6',
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
                                                e.currentTarget.style.borderColor = '#F3F4F6';
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
                                                {item.locked && <IoLockClosedOutline size={12} className="text-gray-600" />}
                                            </div>

                                            {/* Icon */}
                                            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                                                style={{ background: `${item.accentColor}18` }}>
                                                <item.icon size={17} style={{ color: item.accentColor }} />
                                            </div>

                                            {/* Label + desc */}
                                            <div className="relative">
                                                <p className="text-[13px] font-bold leading-snug" style={{ color: '#111827' }}>{item.label}</p>
                                                <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    );
                                    return <Link key={i} to={targetRoute}>{Card}</Link>;
                                })}
                            </div>
                        </div>

                    </motion.div>
                </div>

                {/* â”€â”€ LMS GUIDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="mt-5">
                    <LmsGuideSection />
                </div>

                <div className="mt-5">
                    <Footer />
                </div>
            </main>

            {/* ── Speed Dial FAB: Mark Attendance (camera + no-camera) ── */}
            {!showScanner && (
                <SpeedDialFAB
                    loading={loadingScanner}
                    onCamera={handleOpenScanner}
                    onManual={handleWithoutCamera}
                    manualEnabled={manualMarkEnabled}
                />
            )}
        </div>
    );
};

export default StudentDashboard;
