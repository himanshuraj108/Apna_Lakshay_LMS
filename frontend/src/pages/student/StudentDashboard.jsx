import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import IDCard from '../../components/dashboard/IDCard';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';
import {
    IoBedOutline, IoCalendarOutline, IoCashOutline,
    IoBookOutline, IoNotificationsOutline, IoPersonOutline,
    IoIdCardOutline, IoScan, IoCloseCircle,
    IoChatbubblesOutline, IoHelpCircleOutline,
    IoNewspaper, IoArrowForward,
    IoFlashOutline, IoSparklesOutline, IoLockClosedOutline, IoGiftOutline,
    IoLibraryOutline, IoAlertCircleOutline, IoTimeOutline, IoDocumentTextOutline,
    IoLocation, IoLogInOutline, IoLogOutOutline, IoTimerOutline, IoInformationCircleOutline, IoSyncOutline, IoSwapHorizontalOutline,
    IoLogOutOutline as IoLogoutIcon, IoChevronForward, IoGridOutline, IoMapOutline,
    IoMenuOutline, IoCloseOutline, IoKeypadOutline,
    IoCameraOutline, IoCameraReverseOutline, IoAddOutline, IoCheckmarkCircleOutline,
    IoLanguageOutline
} from 'react-icons/io5';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import HelpSupportModal from '../../components/student/HelpSupportModal';
import RequestHistoryModal from '../../components/student/RequestHistoryModal';
import RequestFeedbackModal from '../../components/student/RequestFeedbackModal';
import LmsGuideSection from '../../components/student/LmsGuideSection';
import NewspaperModal from '../../components/student/NewspaperModal';
import InactiveScreen from '../../components/student/InactiveScreen';
import AccessDeniedPending from '../../pages/public/AccessDeniedPending';
import Footer from '../../components/layout/Footer';

const EXAM_TARGET_NAMES = {
    'ssc_cgl': 'SSC CGL',
    'ssc_chsl': 'SSC CHSL',
    'ssc_gd': 'SSC GD Constable',
    'ssc_mts': 'SSC MTS',
    'ssc_cpo': 'SSC CPO',
    'upsc_cse': 'UPSC CSE',
    'upsc_cds': 'UPSC CDS',
    'ibps_po': 'IBPS PO',
    'ibps_clerk': 'IBPS Clerk',
    'sbi_po': 'SBI PO',
    'sbi_clerk': 'SBI Clerk',
    'rrb_ntpc': 'RRB NTPC',
    'jee_main': 'JEE Main',
    'neet_ug': 'NEET UG',
    'generic': 'General Aptitude & Knowledge'
};

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

/* --- Premium Flip Card Styles --- */
.rank-card-container {
  perspective: 1500px;
  width: 100%;
  max-width: 340px;
  cursor: pointer;
}
.rank-card-inner {
  width: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.rank-card-container.flipped .rank-card-inner {
  transform: rotateY(180deg);
}
.rank-card-front {
  position: relative;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 14px;
  overflow: hidden;
  z-index: 2;
}
.rank-card-back {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: rotateY(180deg);
  border-radius: 14px;
  overflow: hidden;
  z-index: 1;
}

.premium-metallic-card {
  background: linear-gradient(135deg, #ff6a00 0%, #ff8c00 25%, #ffa500 50%, #ff6a00 75%, #e85d00 100%);
  background-size: 200% 200%;
  animation: card-shimmer-bg 4s ease-in-out infinite;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-shadow: 
    0 8px 32px -4px rgba(255, 106, 0, 0.55),
    0 0 0 1px rgba(255, 200, 100, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.55),
    inset 0 -1px 2px rgba(180, 60, 0, 0.3);
}
@keyframes card-shimmer-bg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.premium-back-card {
  background: linear-gradient(135deg, #1a0a00 0%, #2d1200 40%, #1a0a00 100%);
  border: 1.5px solid rgba(255, 140, 0, 0.35);
  box-shadow: 
    0 8px 32px -4px rgba(255, 106, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.08);
}
.premium-card-glow {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
  filter: blur(40px);
}
.premium-card-glow-2 {
  position: absolute;
  bottom: -20%;
  left: -20%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(217, 70, 239, 0.1) 60%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
  filter: blur(40px);
}
.premium-card-chip {
  width: 28px;
  height: 20px;
  background: linear-gradient(135deg, #fffbeb 0%, #f59e0b 50%, #b45309 100%);
  border-radius: 4px;
  position: relative;
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.5), 
    0 1px 3px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(180, 83, 9, 0.4);
  overflow: hidden;
}
.premium-card-chip::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(90deg, transparent 50%, rgba(0, 0, 0, 0.15) 50%),
    linear-gradient(transparent 50%, rgba(0, 0, 0, 0.15) 50%);
  background-size: 5px 5px;
}
.premium-card-hologram {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ff007f, #7f00ff, #00f0ff, #ffef00, #ff007f);
  background-size: 300% 300%;
  animation: holo-rotate 6s linear infinite;
  opacity: 0.75;
  mix-blend-mode: color-dodge;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
}
@keyframes holo-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.premium-card-pattern {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(245, 158, 11, 0.03) 0%, transparent 40%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.01) 0px, rgba(255, 255, 255, 0.01) 1px, transparent 1px, transparent 10px);
  pointer-events: none;
}
.premium-card-overlay-line {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.0) 30%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.0) 70%, transparent);
  transform: skewX(-25deg) translateX(-100%);
  transition: transform 1.5s cubic-bezier(0.19, 1, 0.22, 1);
  pointer-events: none;
}
.rank-card-container:hover .premium-card-overlay-line {
  transform: skewX(-25deg) translateX(280%);
}
.premium-card-magnetic-stripe {
  height: 28px;
  background: linear-gradient(to bottom, #1e1e1e, #0a0a0a);
  width: 100%;
  margin-top: 10px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
}
.premium-card-signature-panel {
  height: 24px;
  background: repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 6px, #e2e8f0 6px, #e2e8f0 12px);
  border-radius: 3px;
  flex-grow: 1;
  display: flex;
  align-items: center;
  padding-left: 8px;
  color: #1e293b;
  font-family: 'Dancing Script', 'Caveat', 'Courier New', cursive, serif;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);
}
.premium-card-cvv {
  background: #ffffff;
  color: #0f172a;
  padding: 0 7px;
  height: 24px;
  display: flex;
  align-items: center;
  font-weight: 800;
  font-style: italic;
  font-family: monospace;
  font-size: 10px;
  border-radius: 3px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);
  border: 1px solid #cbd5e1;
}
.rank-card-back-content::-webkit-scrollbar {
  width: 4px;
}
.rank-card-back-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
.rank-card-back-content::-webkit-scrollbar-thumb {
  background: rgba(251, 191, 36, 0.25);
  border-radius: 2px;
}
.rank-card-back-content::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 191, 36, 0.45);
}
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
                        className="fixed inset-0 z-[61] flex flex-col items-end justify-end pb-24 pr-5 gap-3.5"
                        style={{ pointerEvents: 'none' }}
                    >
                        {subBtns.map((btn, i) => (
                            <motion.div
                                key={btn.key}
                                initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.05 }}
                                className="flex items-center gap-4 cursor-pointer bg-white rounded-2xl p-3.5 w-[240px]"
                                style={{
                                    pointerEvents: 'auto',
                                    boxShadow: `0 12px 30px ${btn.shadow}, 0 0 0 1px rgba(0,0,0,0.03)`
                                }}
                                whileHover={{ scale: 1.03, x: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={btn.onClick}
                            >
                                {/* Icon box */}
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                                    style={{ background: btn.bgBtn, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
                                    {btn.key === 'camera'
                                        ? <IoCameraOutline size={28} color="#111" />
                                        : <NoCameraIcon size={28} />
                                    }
                                    {btn.key === 'manual' && (
                                        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ border: '2px solid rgba(239,68,68,0.2)' }} />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex-1 text-left">
                                    <span className={`text-[15px] font-extrabold ${btn.labelClass}`}>{btn.label}</span>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 tracking-wide">
                                        {btn.key === 'camera' ? 'Scan QR Code' : 'Enter manually'}
                                    </p>
                                </div>
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
            className="bg-white border border-amber-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><IoCloseCircle size={22} /></button>
            <div className="text-center mt-2 mb-5">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto mb-3">
                    <IoAlertCircleOutline className="text-amber-400 text-3xl" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg">Location Access Needed</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">Your attendance needs your location. Click <span className="text-amber-600 font-semibold">Enable Location</span> and allow access in the browser prompt.</p>
            </div>
            <button onClick={onEnable} disabled={enabling}
                className={`w-full py-3 mb-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${enabling ? 'bg-gray-600 opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-lg shadow-emerald-500/25'}`}>
                {enabling ? <><IoTimeOutline size={16} className="animate-spin" />Requestingâ€¦</> : <><IoLocation size={16} />Enable Location</>}
            </button>
            <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all font-medium">Dismiss</button>
        </motion.div>
    </div>
);

/* â”€â”€â”€ Attendance Result Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const AttendanceResultCard = ({ result, onClose }) => {
    const isEntry = result.type === 'entry';
    const isAlreadyMarked = result.type === 'already_marked';
    const att = result.attendance || {};
    const theme = isEntry
        ? { bg: '#ffffff', border: '#a7f3d0', bar: 'from-emerald-400 to-teal-400', iconBg: 'linear-gradient(135deg,#10b981,#14b8a6)', text: '#059669', glow: '#d1fae5' }
        : isAlreadyMarked
            ? { bg: '#ffffff', border: '#fde68a', bar: 'from-amber-400 to-orange-400', iconBg: 'linear-gradient(135deg,#f59e0b,#ea580c)', text: '#d97706', glow: '#fef3c7' }
            : { bg: '#ffffff', border: '#c7d2fe', bar: 'from-indigo-400 to-blue-400', iconBg: 'linear-gradient(135deg,#6366f1,#3b82f6)', text: '#4f46e5', glow: '#e0e7ff' };

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
                            <h3 className="text-gray-900 font-black text-xl">{isEntry ? 'Welcome In' : isAlreadyMarked ? 'Attendance Complete' : 'See You Next Time'}</h3>
                        </div>
                    </div>
                    <div className="space-y-2.5 mb-5">
                        {isAlreadyMarked && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                You have already completed your attendance for today.
                            </p>
                        )}
                        {/* Entry Time — always shown if present */}
                        {att.entryTime && (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Entry</span>
                                <span className="text-sm font-bold text-emerald-600">{att.entryTime}</span>
                            </div>
                        )}
                        {/* Exit Time — show for exit and already_marked */}
                        {(isAlreadyMarked || result.type === 'exit') && att.exitTime && (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Exit</span>
                                <span className="text-sm font-bold text-red-600">{att.exitTime}</span>
                            </div>
                        )}
                        {/* Duration — show for exit and already_marked */}
                        {(isAlreadyMarked || result.type === 'exit') && att.duration > 0 && (
                            <div className="flex items-center justify-between rounded-xl px-4 py-2.5 border"
                                style={{ background: '#e0e7ff', borderColor: '#c7d2fe' }}>
                                <span className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: '#818cf8' }}>
                                    <IoTimerOutline size={13} />Duration
                                </span>
                                <span className="text-sm font-black" style={{ color: '#4f46e5' }}>
                                    {Math.floor(att.duration / 60)}h {att.duration % 60}m
                                </span>
                            </div>
                        )}
                        {/* Notes — show for already_marked if present */}
                        {isAlreadyMarked && att.notes && (
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Note</span>
                                <span className="text-xs text-amber-600 font-medium text-right max-w-[60%]">{att.notes}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: theme.iconBg }}>Dismiss</button>

                </div>
            </motion.div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   MODULE-LEVEL CACHE  (survives navigate-away / back, clears on refresh)
   ══════════════════════════════════════════════════════════════════════ */
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes in ms
const _cache = {};
const isFresh = (key) => _cache[key] && (Date.now() - _cache[key].ts < CACHE_TTL);
const setCache = (key, data) => { _cache[key] = { data, ts: Date.now() }; };
const bustCache = (...keys) => { keys.forEach(k => { delete _cache[k]; }); };

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN DASHBOARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const StudentDashboard = () => {
    const [dashboardData, setDashboardData]           = useState(() => isFresh('dashboard') ? _cache.dashboard.data : null);
    const [loading, setLoading]                       = useState(() => !isFresh('dashboard'));
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
    const [pinEntryOpen, setPinEntryOpen]             = useState(false);
    const [hasPin, setHasPin]                         = useState(false);
    const [pendingFeedback, setPendingFeedback]       = useState(null);
    const [enablingLocation, setEnablingLocation]     = useState(false);
    const [cardConfig, setCardConfig]                 = useState(null);
    const [pinEnabled, setPinEnabled]                 = useState(false);
    const [manualMarkEnabled, setManualMarkEnabled]   = useState(false); // true when admin allows manual (with or without PIN)
    const [showWhatsAppGroup, setShowWhatsAppGroup]   = useState(true);
    const [showAITools, setShowAITools]               = useState(true);
    const [showPinModal, setShowPinModal]             = useState(false);
    const [pinValue, setPinValue]                     = useState('');
    const [pinLoading, setPinLoading]                 = useState(false);
    const [pinError, setPinError]                     = useState('');
    const [directMarkLoading, setDirectMarkLoading]   = useState(false);
    const { logout, user } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const isActive = user?.isActive;
    const hasSeat = dashboardData?.seat || (dashboardData?.tempAssignments?.length > 0);
    const navigate = useNavigate();

    // Engagement & Gamification States
    const [activeLeftTab, setActiveLeftTab]           = useState('actions');
    const [streakStats, setStreakStats]               = useState(null);
    const [isCardFlipped, setIsCardFlipped]           = useState(false);
    const [leaderboard, setLeaderboard]               = useState([]);
    const [leaderboardSortBy, setLeaderboardSortBy]   = useState('xp');
    const [dailyQuiz, setDailyQuiz]                   = useState(null);
    const [dailyQuizAttempted, setDailyQuizAttempted] = useState(false);
    const [dailyQuizAttempt, setDailyQuizAttempt]     = useState(null);
    const quizCompletedRef                            = useRef(null);
    const [showQuizModal, setShowQuizModal]           = useState(false);
    const [quizAnswers, setQuizAnswers]               = useState([null, null, null, null, null]);
    const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
    const [quizSubmitting, setQuizSubmitting]         = useState(false);
    const [quizError, setQuizError]                   = useState('');
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [aiInsight, setAiInsight]                   = useState(null); // { score, level, insight }

    const SETTINGS_KEY = 'lms_location_required';
    const getLocationRequired = () => { try { const c = localStorage.getItem(SETTINGS_KEY); if (c !== null) return c === 'true'; } catch (_) { } return true; };
    const loadSettingsCache = async () => {
        if (isFresh('settings')) return; // already cached by fetchPinStatus
        try {
            const res = await api.get('/public/settings');
            if (res.data.success) {
                localStorage.setItem(SETTINGS_KEY, String(res.data.settings.locationAttendance !== false));
                setCache('settings', res.data.settings);
            }
        } catch (_) { }
    };

    const fetchCardConfig = async () => {
        if (isFresh('cardConfig')) {
            setCardConfig(_cache.cardConfig.data);
            return;
        }
        try {
            const res = await api.get('/student/card-config');
            setCardConfig(res.data);
            setCache('cardConfig', res.data);
        } catch { /* use defaults if fails */ }
    };

    const fetchEngagementData = async () => {
        if (isFresh('engagement')) {
            const d = _cache.engagement.data;
            setStreakStats(d.streakStats);
            setDailyQuiz(d.dailyQuiz);
            setDailyQuizAttempted(d.dailyQuizAttempted);
            setDailyQuizAttempt(d.dailyQuizAttempt);
            setAiInsight(d.aiInsight || null);
            return;
        }

        let streakStats = null;
        let dailyQuiz = null, dailyQuizAttempted = false, dailyQuizAttempt = null;
        let aiInsight = null;

        try {
            const statsRes = await api.get('/student/engagement/streak-stats');
            if (statsRes.data.success) {
                streakStats = statsRes.data.stats;
                setStreakStats(streakStats);
            }
        } catch (e) {
            console.error('Error fetching streak stats:', e);
        }

        try {
            const quizRes = await api.get('/student/engagement/daily-quiz');
            if (quizRes.data.success) {
                dailyQuiz = quizRes.data.quiz;
                dailyQuizAttempted = quizRes.data.attempted;
                dailyQuizAttempt = quizRes.data.attempt;
                setDailyQuiz(dailyQuiz);
                setDailyQuizAttempted(dailyQuizAttempted);
                setDailyQuizAttempt(dailyQuizAttempt);
            }
        } catch (e) {
            console.error('Error fetching daily quiz:', e);
        }

        // Fetch AI Insight of the Day (readiness score) — non-critical, silent fail
        try {
            const insightRes = await api.get('/student/ai/readiness-score');
            if (insightRes.data.success) {
                aiInsight = { score: insightRes.data.score, level: insightRes.data.level, insight: insightRes.data.insight };
                setAiInsight(aiInsight);
            }
        } catch (_) { /* non-critical */ }

        setCache('engagement', { streakStats, dailyQuiz, dailyQuizAttempted, dailyQuizAttempt, aiInsight });
    };

    const fetchLeaderboard = async (sortByValue) => {
        setLeaderboardLoading(true);
        try {
            const res = await api.get(`/student/engagement/leaderboard?sortBy=${sortByValue}`);
            if (res.data.success) {
                setLeaderboard(res.data.leaderboard);
            }
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        // Only show loading skeleton if the main dashboard data isn't cached yet
        if (!isFresh('dashboard')) setLoading(true);
        fetchDashboardData();
        loadSettingsCache();
        fetchCardConfig();
        fetchPinStatus();
        fetchPendingFeedback();
        fetchEngagementData();
    }, []);
    
    useEffect(() => { if (dashboardData?.feeReminder?.show) setShowFeeReminder(true); }, [dashboardData]);

    const fetchPinStatus = async () => {
        if (isFresh('settings')) {
            const s = _cache.settings.data;
            setPinEnabled(!!s.pinAttendanceEnabled);
            setManualMarkEnabled(true);
            setShowWhatsAppGroup(s.showWhatsAppGroup !== false);
            setShowAITools(s.showAITools !== false);
            return;
        }
        try {
            const res = await api.get('/public/settings');
            const s = res.data?.settings;
            if (s) {
                setPinEnabled(!!s.pinAttendanceEnabled);
                setManualMarkEnabled(true);
                setShowWhatsAppGroup(s.showWhatsAppGroup !== false);
                setShowAITools(s.showAITools !== false);
                setCache('settings', s);
                // also update the location localStorage key
                localStorage.setItem(SETTINGS_KEY, String(s.locationAttendance !== false));
            }
        } catch (_) {}
    };

    const fetchPendingFeedback = async () => {
        if (isFresh('feedback')) {
            setPendingFeedback(_cache.feedback.data);
            return;
        }
        try {
            const { data } = await api.get('/student/request/pending-feedback');
            if (data?.success && data.request) {
                setPendingFeedback(data.request);
                setCache('feedback', data.request);
            }
        } catch (error) {
            console.error('Error fetching pending feedback:', error);
        }
    };

    const fetchDashboardData = async () => {
        if (isFresh('dashboard')) {
            setDashboardData(_cache.dashboard.data);
            setLoading(false);
            return;
        }
        try { 
            const res = await api.get('/student/dashboard'); 
            setDashboardData(res.data.data);
            setCache('dashboard', res.data.data);
            fetchEngagementData();
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
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
                if (isNew) { bustCache('dashboard'); fetchDashboardData(); }
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
                if (isNew) { bustCache('dashboard'); fetchDashboardData(); }
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
                if (isNew) { bustCache('dashboard'); fetchDashboardData(); } // refresh only if something changed
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
                if (isNew) { bustCache('dashboard'); fetchDashboardData(); }
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
        <div className="relative min-h-screen" style={{ background: '#F8FAFC' }}>
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

    /* -- Pending Allocation guard -- */
    if (!hasSeat) {
        return <AccessDeniedPending user={user} />;
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
                {showIDCard && <IDCard student={{ ...user, isActive, registrationSource: dashboardData?.registrationSource, seat: dashboardData?.seat, shift: dashboardData?.seat?.shift, shifts: dashboardData?.seat?.shifts, seatNumber: dashboardData?.seat?.number, shiftDetails: dashboardData?.seat?.shiftDetails, tempAssignments: dashboardData?.tempAssignments?.map(ta => ({ seat: { number: ta.seatNumber, room: { roomId: ta.room } }, shift: { name: ta.shiftName, startTime: ta.startTime, endTime: ta.endTime }, note: ta.note })) }} onClose={() => setShowIDCard(false)} />}
                {showNewspaper && <NewspaperModal onClose={() => setShowNewspaper(false)} />}

                {/* ── Manual Attendance Modal (PIN or Direct) ── */}
                {showPinModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
                            style={{ background: '#ffffff', border: '1px solid #fde68a' }}
                        >
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-500/10 rounded-xl"><IoKeypadOutline size={18} className="text-amber-400" /></div>
                                    <div>
                                        <h3 className="text-gray-900 font-bold text-base">Manual Attendance</h3>
                                        <p className="text-gray-600 text-xs">
                                            {pinEnabled ? 'Enter the daily PIN from your admin' : 'Click below to mark your attendance'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowPinModal(false); setPinValue(''); setPinError(''); }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors">
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
                                        className="flex-1 bg-gray-50 border border-gray-200 focus:border-amber-400 text-gray-900 text-lg font-bold tracking-widest rounded-xl px-4 py-3 outline-none placeholder-gray-400 text-center"
                                    />
                                </div>
                            )}

                            {/* Direct mode info — shown when PIN is OFF */}
                            {!pinEnabled && (
                                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                                    <IoFlashOutline size={18} className="text-amber-500 shrink-0" />
                                    <p className="text-amber-700 text-sm">Your attendance will be marked instantly without a PIN.</p>
                                </div>
                            )}

                            {pinError && <p className="text-red-600 text-xs text-center mb-3">{pinError}</p>}

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
                        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-red-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-t-2xl" />
                            <div className="text-center mt-2 mb-5">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3"><IoNotificationsOutline className="text-red-400 text-2xl" /></div>
                                <h3 className="text-gray-900 font-bold text-lg">Fee Reminder</h3>
                                <p className="text-gray-600 text-sm mt-1">{dashboardData.feeReminder.message}</p>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-5 border border-gray-100">
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Amount Due</span>
                                <span className="text-2xl font-black text-gray-900">₹{dashboardData.feeReminder.amount}</span>
                            </div>
                            {dashboardData.onlinePaymentEnabled ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setShowFeeReminder(false)} className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">Later</button>
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
                        <span className="font-bold text-sm" style={{ color: '#111827' }}>Apna <span style={{ color: '#F97316' }}>Lakshay</span></span>
                    </div>

                    {/* Nav right */}
                    <div className="flex items-center gap-3">
                        {/* Premium Language Toggler Pill */}
                        <div className="flex items-center gap-1 bg-gray-100/80 p-0.5 rounded-xl border border-gray-200/50 backdrop-blur-sm shadow-sm select-none">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 text-[10px] sm:text-xs font-black rounded-lg transition-all ${language === 'en' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('hi')}
                                className={`px-2 py-0.5 text-[10px] sm:text-xs font-black rounded-lg transition-all ${language === 'hi' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                हिं
                            </button>
                        </div>
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

            {/* ─────────────────────────────────────────────────────────────
                  PAGE BODY
               ───────────────────────────────────────────────────────────── */}
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
                            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-orange-200/50 shadow-md">
                                    <img 
                                        src={(() => {
                                            const img = (!user?.profileImage || user.profileImage === '/uploads/avatars/avatar1.svg')
                                                ? getDeterministicAvatar(user?._id || user?.id, user?.gender)
                                                : user.profileImage;
                                            return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                        })()} 
                                        alt={user.name} 
                                        className="w-full h-full object-cover" 
                                    />
                            </div>
                            {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#FFF7ED]" />}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm" style={{ color: '#111827' }}>{user?.name?.split(" ")[0]} 👋</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] hidden sm:block" style={{ color: '#9CA3AF' }}>{today}</span>
                        {isActive
                            ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-semibold"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />{t("Active")}</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 border border-red-200 text-red-500 px-2 py-0.5 rounded-full font-semibold">{t("Inactive")}</span>}
                    </div>
                </motion.div>

                {/* ── WhatsApp Group Banner ── */}
                {import.meta.env.VITE_WHATSAPP_GROUP_URL && showWhatsAppGroup && (
                    <motion.a
                        href={import.meta.env.VITE_WHATSAPP_GROUP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 140 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative mb-5 flex items-center gap-3 rounded-2xl px-4 py-3 overflow-hidden cursor-pointer"
                        style={{
                            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 60%, #d1fae5 100%)',
                            border: '1.5px solid #86efac',
                            boxShadow: '0 4px 18px rgba(34,197,94,0.18)',
                            textDecoration: 'none',
                        }}
                    >
                        {/* shimmer sweep */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer-name 3s linear infinite',
                        }} />
                        {/* icon */}
                        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        {/* text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-green-900">Join our WhatsApp Group</p>
                            <p className="text-[11px] text-green-700 font-medium mt-0.5">Stay updated with notices &amp; announcements</p>
                        </div>
                        {/* pulse + arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="w-7 h-7 rounded-xl bg-white/60 flex items-center justify-center" style={{ border: '1px solid rgba(34,197,94,0.35)' }}>
                                <IoArrowForward size={13} className="text-green-700" />
                            </div>
                        </div>
                    </motion.a>
                )}

                {/* ── DAILY CHALLENGE — shown here when NOT yet done ── */}
                <AnimatePresence mode="wait">
                {!dailyQuizAttempted && dailyQuiz && (
                    <motion.div
                        key="challenge-top"
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                        className="mb-5"
                    >
                        <div className="rounded-2xl border-2 border-orange-200 overflow-hidden bg-white relative" style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.12)' }}>
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
                            {/* Urgent nudge banner */}
                            <div className="px-4 pt-4 pb-0 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 border border-orange-200 text-orange-600 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />{t("Today's Task")}
                                </span>
                                <span className="text-[9px] font-semibold text-gray-400">{t("Complete before midnight")}</span>
                            </div>
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
                                        <IoSparklesOutline size={15} className="text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-black text-xs sm:text-sm text-gray-900 truncate">{t("Daily Challenge")}</h2>
                                        <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold truncate">{t("questions")} • Up to +70 {t("XP")}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex-shrink-0">
                                    {user?.examTarget && user.examTarget !== 'generic' ? (EXAM_TARGET_NAMES[user.examTarget] || t(user.examTarget)) : t('Select Target')}
                                </span>
                            </div>
                            <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-6">
                                    {[`+50 ${t("XP")}`, `+20 ${t("Bonus")}`, t("Streak")].map((label, i) => (
                                        <div key={i} className="flex flex-col items-center text-center">
                                            <span className="text-xs font-black text-gray-800 whitespace-nowrap">{label}</span>
                                            <span className="text-[9px] text-gray-400 whitespace-nowrap">{i === 0 ? t('base reward') : i === 1 ? t('if 5/5') : t('kept alive')}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (!user?.examTarget || user.examTarget === 'generic') {
                                            navigate('/student/profile?focus=examTarget');
                                            return;
                                        }
                                        setQuizAnswers([null, null, null, null, null]);
                                        setCurrentQuizQuestionIndex(0);
                                        setShowQuizModal(true);
                                        setQuizError('');
                                    }}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-orange-400/25 self-stretch sm:self-auto"
                                    style={{ background: 'linear-gradient(135deg, #F97316, #FBBF24)' }}
                                >
                                    <IoFlashOutline size={15} className="animate-bounce" />
                                    {t("Start Challenge")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* â”€â”€ STATS ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
                >
                    <Link to="/student/seat">
                        <div className="group relative overflow-hidden rounded-xl p-4 bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                                    <span className="text-orange-500 font-bold text-xs">#</span>
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>My Seat</span>
                            </div>
                            {(() => {
                                const displaySeats = [];
                                if (dashboardData?.seat) {
                                    displaySeats.push({
                                        isTemp: false,
                                        number: dashboardData.seat.roomId ? `${dashboardData.seat.roomId} - ${dashboardData.seat.number}` : dashboardData.seat.number,
                                        shifts: dashboardData.seat.shifts || (dashboardData.seat.shift ? [{ name: dashboardData.seat.shift }] : [])
                                    });
                                }
                                if (dashboardData?.tempAssignments?.length > 0) {
                                    dashboardData.tempAssignments.forEach(ta => {
                                        displaySeats.push({
                                            isTemp: true,
                                            number: ta.room ? `${ta.room} - ${ta.seatNumber}` : ta.seatNumber || '?',
                                            shifts: [{ name: ta.shiftName, startTime: ta.startTime, endTime: ta.endTime }]
                                        });
                                    });
                                }

                                if (displaySeats.length === 0) {
                                    return (
                                        <div className="z-10 relative mt-2">
                                            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color: '#111827' }}>—</p>
                                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Not Assigned</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-3 z-10 relative mt-1">
                                        {displaySeats.map((ds, i) => (
                                            <div key={i} className="flex justify-between items-center relative">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xl sm:text-2xl font-black mb-0.5 truncate" style={{ color: ds.isTemp ? '#ef4444' : '#111827' }} title={ds.number}>
                                                        {ds.number}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {ds.shifts.map((s, j) => (
                                                            <span key={j} className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-full" title={`${s.name}${s.startTime ? ` ${s.startTime}–${s.endTime}` : ''}`}
                                                                style={{ 
                                                                    background: ds.isTemp ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                                                                    border: `1px solid ${ds.isTemp ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, 
                                                                    color: ds.isTemp ? '#dc2626' : '#059669' 
                                                                }}>
                                                                {s.name}{s.startTime ? ` ${s.startTime}–${s.endTime}` : ''} 
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={`flex items-center justify-center w-[48px] h-[48px] transform rotate-[-18deg] border-[2px] rounded-full mix-blend-multiply opacity-60 flex-shrink-0 ml-2 ${ds.isTemp ? 'border-red-600 text-red-600' : 'border-emerald-600 text-emerald-600'}`}>
                                                    <div className={`absolute inset-[1.5px] border-[0.5px] rounded-full ${ds.isTemp ? 'border-red-600' : 'border-emerald-600'}`} />
                                                    <div className="flex flex-col items-center justify-center w-full">
                                                        <p className="font-bold text-[3.5px] tracking-[0.1em] uppercase text-center leading-[1.2] mb-[1px]">
                                                            APNA LAKSHAY<br/>LIBRARY
                                                        </p>
                                                        <div className={`w-[85%] h-[0.5px] mb-[1px] ${ds.isTemp ? 'bg-red-600' : 'bg-emerald-600'}`} />
                                                        <p className={`font-black tracking-widest uppercase text-center ${ds.isTemp ? 'text-[4px]' : 'text-[5px]'}`} style={{ transform: 'scaleY(1.2)' }}>
                                                            {ds.isTemp ? 'TEMPORARY' : 'CONFIRMED'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
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


                {/* -- AI INSIGHT OF THE DAY ---------------------------------------------------------- */}
                {showAITools && aiInsight && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} className="mb-4">
                        <Link to="/student/ai/readiness-score">
                            <div
                                className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer group hover:shadow-md transition-all duration-200"
                                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)', border: '1px solid rgba(99,102,241,0.25)' }}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border border-white/10">
                                        <span className="text-lg font-black text-white leading-none">{aiInsight.score}</span>
                                        <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-wide">/ 100</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-white font-black text-sm">AI Insight of the Day</span>
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)' }}>{aiInsight.level}</span>
                                        </div>
                                        <p className="text-indigo-200 text-xs font-medium leading-snug line-clamp-1">{aiInsight.insight}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 px-3.5 py-2 rounded-xl font-extrabold text-xs bg-white/10 text-white border border-white/15 group-hover:bg-white/20 transition-colors whitespace-nowrap">
                                    Full Score →
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}

                {/* -- AI TOOLS SECTION ----------------------------------------------------------------- */}
                {showAITools && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45 }} className="mb-5">
                        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 overflow-hidden">
                                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                                    <IoSparklesOutline size={11} className="text-indigo-500" />
                                </div>
                                <span className="text-xs font-extrabold text-gray-800 tracking-wide">AI Study Suite</span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider text-white animate-pulse" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}>New</span>

                                {/* Continuous marquee ticker */}
                                <div className="ml-auto overflow-hidden relative w-36 sm:w-80 h-5 flex items-center bg-red-50/50 rounded-lg px-2 border border-red-100/50">
                                    <style>{`
                                        @keyframes marqueeTicker {
                                            0% { transform: translate3d(0, 0, 0); }
                                            100% { transform: translate3d(-50%, 0, 0); }
                                        }
                                        .animate-ticker {
                                            display: inline-block;
                                            white-space: nowrap;
                                            animation: marqueeTicker 20s linear infinite;
                                        }
                                    `}</style>
                                    <div className="animate-ticker text-[8px] font-black uppercase tracking-wider text-red-600 flex gap-4">
                                        <span>🔥 NEW study suite is live! Try AI Study Planner • Analyze Mock Tests • Summarize Notes • Task Suggestions • Readiness Score • &nbsp; &nbsp; 🔥 NEW study suite is live! Try AI Study Planner • Analyze Mock Tests • Summarize Notes • Task Suggestions • Readiness Score</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-3 gap-3">
                                {[
                                    { id: 'ai-study-plan', label: 'Study Plan',       desc: 'AI weekly schedule',  accentColor: '#6366f1', accentBg: 'rgba(99,102,241,0.1)',  icon: IoBookOutline,         link: '/student/ai/study-planner'        },
                                    { id: 'ai-test',       label: 'Test Analyzer',    desc: 'Weak area insights',  accentColor: '#ea580c', accentBg: 'rgba(234,88,12,0.1)',   icon: IoSparklesOutline,     link: '/student/ai/test-analyzer'        },
                                    { id: 'ai-notes',      label: 'Note Summarizer',  desc: 'Paste and summarize', accentColor: '#7c3aed', accentBg: 'rgba(124,58,237,0.1)',  icon: IoDocumentTextOutline, link: '/student/ai/note-summarizer'      },
                                    { id: 'ai-ca-quiz',    label: 'News Quiz',        desc: 'Quiz from articles',  accentColor: '#0ea5e9', accentBg: 'rgba(14,165,233,0.1)',  icon: IoGridOutline,         link: '/student/ai/current-affairs-quiz' },
                                    { id: 'ai-tasks',      label: 'Task Suggestions', desc: 'Smart daily tasks',   accentColor: '#f97316', accentBg: 'rgba(249,115,22,0.1)',  icon: IoFlashOutline,        link: '/student/ai/task-suggestions'     },
                                    { id: 'ai-readiness',  label: 'Readiness Score',  desc: 'Your exam readiness', accentColor: '#16a34a', accentBg: 'rgba(22,163,74,0.1)',   icon: IoCalendarOutline,     link: '/student/ai/readiness-score'      },
                                ].map((item, i) => (
                                    <Link key={item.id} to={item.link} className="block">
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.18 + i * 0.06, type: 'spring', stiffness: 120 }}
                                            whileHover={{ y: -3 }}
                                            className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group"
                                            style={{ background: `linear-gradient(145deg, ${item.accentBg}, rgba(255,255,255,0.02))`, border: '1px solid #F3F4F6', padding: '14px 14px 16px', minHeight: '110px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.accentColor}40`; e.currentTarget.style.boxShadow = `0 8px 32px -8px ${item.accentColor}30`; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${item.accentColor}, transparent)` }} />
                                            <item.icon size={56} className="absolute -bottom-2 -right-2 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ color: item.accentColor }} />
                                            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 duration-200" style={{ background: `${item.accentColor}18` }}>
                                                <item.icon size={18} style={{ color: item.accentColor }} />
                                            </div>
                                            <div className="mt-auto pt-2">
                                                <p className="text-[13px] font-bold leading-snug" style={{ color: '#111827' }}>{item.label}</p>
                                                <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${item.accentColor}99` }}>{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* â”€â”€ TWO-COLUMN LAYOUT (actions + learning) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* LEFT: Quick Actions list */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18, duration: 0.45 }}
                            className="w-full rounded-2xl border border-gray-200 overflow-hidden bg-white"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                        >
                        {/* Header with Tab Switcher */}
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex gap-1.5 bg-gray-200/60 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveLeftTab('actions')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                        activeLeftTab === 'actions'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-805'
                                    }`}
                                >
                                    Quick Actions
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveLeftTab('leaderboard');
                                        fetchLeaderboard(leaderboardSortBy);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                                        activeLeftTab === 'leaderboard'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-850'
                                    }`}
                                >
                                    <IoSparklesOutline size={11} className={activeLeftTab === 'leaderboard' ? 'text-indigo-650' : ''} />
                                    Leaderboard
                                </button>
                            </div>
                            
                            {/* Sort Filter — only shown when Leaderboard is active */}
                            {activeLeftTab === 'leaderboard' && (
                                <select
                                    value={leaderboardSortBy}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setLeaderboardSortBy(val);
                                        fetchLeaderboard(val);
                                    }}
                                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-gray-600 focus:outline-none focus:border-indigo-400"
                                >
                                    <option value="xp">Sort by XP</option>
                                    <option value="streak">Sort by Streak</option>
                                    <option value="focus">Sort by Focus Hours</option>
                                </select>
                            )}
                        </div>

                        {activeLeftTab === 'actions' ? (
                            /* Action grid — 3 per row, premium cards */
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

                                            {/* Ghost icon — large faded background accent */}
                                            <item.icon
                                                size={56}
                                                className="absolute -bottom-2 -right-2 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                                                style={{ color: item.accentColor }}
                                            />

                                            {/* LIVE badge */}
                                            {item.live && !item._isNew && (
                                                <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                                                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />LIVE
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

                                            {/* Label + optional desc + custom buttons */}
                                            <div className="mt-auto pt-2">
                                                <p className="text-[13px] font-bold leading-snug" style={{ color: '#111827' }}>{item.label}</p>
                                                
                                                {item.desc && (
                                                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${item.accentColor}99` }}>
                                                        {item.desc}
                                                    </p>
                                                )}

                                                {item.id === 'support' && item.badge > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowHistoryModal(true);
                                                        }}
                                                        className="relative z-20 w-full block text-[10px] mt-0.5 font-bold underline tracking-wide text-right"
                                                        style={{ color: item.accentColor }}
                                                    >
                                                        View Status &rarr;
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                    return item.link
                                        ? <Link key={i} to={item.link} className="block">{Card}</Link>
                                        : <div key={i}>{Card}</div>;
                                })}
                            </div>
                        ) : (
                            /* Leaderboard list */
                            <div className="p-4">
                                {leaderboardLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                        <p className="text-xs font-semibold text-gray-400">Loading leaderboard...</p>
                                    </div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-sm font-bold text-gray-400">No active students on the leaderboard yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                        {leaderboard.map((item) => {
                                            const isCurrentUser = item.userId === user?.id;
                                            const isTop3 = item.rank <= 3;
                                            const rankTheme = item.rank === 1
                                                ? { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600', badge: '🥇' }
                                                : item.rank === 2
                                                ? { bg: 'bg-slate-300/20 border-slate-300/30', text: 'text-slate-500', badge: '🥈' }
                                                : item.rank === 3
                                                ? { bg: 'bg-orange-300/10 border-orange-300/20', text: 'text-orange-600', badge: '🥉' }
                                                : { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-500', badge: `#${item.rank}` };

                                            return (
                                                <div
                                                    key={item.userId}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                                                        isCurrentUser 
                                                            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {/* Rank badge */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${rankTheme.bg} ${rankTheme.text}`}>
                                                            {rankTheme.badge}
                                                        </div>

                                                        {/* User Avatar */}
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50 flex items-center justify-center font-bold text-[11px] text-indigo-700 shrink-0 uppercase">
                                                            {item.name ? item.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '?'}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`text-xs font-bold truncate ${isCurrentUser ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                                    {item.name}
                                                                </span>
                                                                {isCurrentUser && (
                                                                    <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1 rounded">YOU</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-medium">{item.studentId || 'No ID'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <span className="text-xs font-black text-gray-800">
                                                                {leaderboardSortBy === 'xp'
                                                                    ? `${item.value || 0} XP`
                                                                    : leaderboardSortBy === 'streak'
                                                                    ? `${item.value || 0} Days`
                                                                    : `${(item.value || 0).toFixed(1)} hrs`}
                                                            </span>
                                                            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                                                                Level {item.level || 1}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* ── DAILY CHALLENGE — shown here when COMPLETED ── */}
                    <AnimatePresence mode="wait">
                        {dailyQuizAttempted && dailyQuiz && (
                            <motion.div
                                ref={quizCompletedRef}
                                key="challenge-completed"
                                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="rounded-2xl border border-emerald-200 bg-white overflow-hidden relative"
                                style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.08)' }}
                            >
                                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-100 flex-shrink-0">
                                            <IoCheckmarkCircleOutline size={16} className="text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-black text-xs sm:text-sm text-gray-900 truncate">Daily Challenge</h2>
                                            <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold truncate">Completed for today! Keep it up!</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex-shrink-0">
                                        {user?.examTarget && user.examTarget !== 'generic' ? EXAM_TARGET_NAMES[user.examTarget] : 'Select Target'}
                                    </span>
                                </div>
                                
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                                            <span className="text-xs font-black text-emerald-700">{dailyQuizAttempt?.score || 0}/5</span>
                                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wide">Score</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center">
                                            <span className="text-xs font-black text-amber-700">+{dailyQuizAttempt?.xpAwarded || 0}</span>
                                            <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide">XP Earned</span>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-xs font-black text-gray-800">Excellent Work!</h4>
                                            <p className="text-[10px] text-gray-400 font-semibold">Streak maintained successfully</p>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => {
                                            setQuizAnswers(dailyQuizAttempt?.answers || [null, null, null, null, null]);
                                            setCurrentQuizQuestionIndex(0);
                                            setShowQuizModal(true);
                                        }}
                                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-95 flex-shrink-0 self-stretch sm:self-auto"
                                    >
                                        <IoDocumentTextOutline size={14} />
                                        Review Solutions
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
                                <h2 className="font-bold text-sm" style={{ color: '#111827' }}>{t("Learning")}</h2>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {(() => {
                                    const BASE_L = [
                                        { id: 'books',     icon: IoBookOutline,        label: t('Books'),        desc: t('Curated study books'),  accentColor: '#3b82f6', accentBg: 'rgba(59,130,246,0.08)',  to: '/student/books',     locked: false },
                                        { id: 'notes',     icon: IoDocumentTextOutline, label: t('Notes'),       desc: t('Browse & download'),    accentColor: '#8b5cf6', accentBg: 'rgba(139,92,246,0.08)',  to: '/student/notes',     locked: false },
                                        { id: 'mock-test', icon: IoSparklesOutline,    label: t('AI Mock Test'), desc: t('Practice tests'),        accentColor: '#f59e0b', accentBg: 'rgba(245,158,11,0.08)', to: '/student/mock-test', locked: false },
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

            {/* Daily Quiz Modal */}
            <AnimatePresence>
                {showQuizModal && dailyQuiz && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Accent Line top */}
                            <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-amber-500" />

                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h3 className="text-gray-900 font-black text-base flex items-center gap-1.5">
                                        <IoSparklesOutline className="text-orange-500 animate-spin" style={{ animationDuration: '8s' }} />
                                        Daily Challenge: {EXAM_TARGET_NAMES[user?.examTarget] || 'General Aptitude'}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                                        {dailyQuizAttempted ? 'Review Mode' : 'Live Challenge'} • Date: {dailyQuiz.date}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowQuizModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-800 transition-colors"
                                >
                                    <IoCloseCircle size={22} />
                                </button>
                            </div>

                            {/* Progress bar */}
                            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between text-xs text-gray-505 font-semibold bg-white">
                                <span className="text-[11px]">Question {currentQuizQuestionIndex + 1} of 5</span>
                                <div className="w-1/2 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 p-[1px]">
                                    <div 
                                        className="h-full rounded-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${((currentQuizQuestionIndex + 1) / 5) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 overflow-y-auto flex-1 space-y-4">
                                {(() => {
                                    const currentQuestion = dailyQuiz.questions[currentQuizQuestionIndex];
                                    const selectedAnswer = quizAnswers[currentQuizQuestionIndex];
                                    const isAttempted = dailyQuizAttempted;
                                    const correctOptionIndex = isAttempted 
                                        ? dailyQuizAttempt?.questionsWithSolutions?.[currentQuizQuestionIndex]?.correct
                                        : null;

                                    return (
                                        <div className="space-y-4">
                                            {/* Question card */}
                                            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                                {currentQuestion.subject && (
                                                    <span className="text-[9px] font-black uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md mb-2 inline-block">
                                                        {currentQuestion.subject}
                                                    </span>
                                                )}
                                                <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-line">
                                                    {currentQuestion.question}
                                                </p>
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-2.5">
                                                {currentQuestion.options.map((option, idx) => {
                                                    const optionLetter = ['A', 'B', 'C', 'D'][idx];
                                                    const isSelected = selectedAnswer === idx;

                                                    let optionStyle = 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/10';
                                                    
                                                    if (isSelected && !isAttempted) {
                                                        optionStyle = 'border-orange-500 bg-orange-50/20';
                                                    }

                                                    if (isAttempted) {
                                                        const isCorrect = idx === correctOptionIndex;
                                                        const isUserWrong = isSelected && !isCorrect;

                                                        if (isCorrect) {
                                                            optionStyle = 'border-emerald-500 bg-emerald-50/40 text-emerald-900';
                                                        } else if (isUserWrong) {
                                                            optionStyle = 'border-red-500 bg-red-50/40 text-red-900';
                                                        } else {
                                                            optionStyle = 'border-gray-200 opacity-60';
                                                        }
                                                    }

                                                    return (
                                                        <button
                                                            key={idx}
                                                            disabled={isAttempted}
                                                            onClick={() => {
                                                                const newAnswers = [...quizAnswers];
                                                                newAnswers[currentQuizQuestionIndex] = idx;
                                                                setQuizAnswers(newAnswers);
                                                                setQuizError('');
                                                            }}
                                                            className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${optionStyle}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                                isSelected
                                                                    ? 'bg-orange-500 border-orange-500 text-white'
                                                                    : 'border-gray-300 text-gray-500'
                                                            }`}>
                                                                {optionLetter}
                                                            </div>
                                                            <span className="text-xs font-bold leading-normal text-gray-800">{option}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation & Solution section */}
                                            {isAttempted && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-1.5"
                                                >
                                                    <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                                        <IoInformationCircleOutline size={14} className="text-indigo-600" />
                                                        Explanation
                                                    </h5>
                                                    <p className="text-xs text-indigo-900/90 leading-relaxed font-medium">
                                                        {dailyQuizAttempt?.questionsWithSolutions?.[currentQuizQuestionIndex]?.explanation || 'No explanation available.'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentQuizQuestionIndex === 0}
                                        onClick={() => setCurrentQuizQuestionIndex(prev => prev - 1)}
                                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
                                    >
                                        &larr; Previous
                                    </button>
                                    <button
                                        disabled={currentQuizQuestionIndex === 4}
                                        onClick={() => setCurrentQuizQuestionIndex(prev => prev + 1)}
                                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-600 transition-colors"
                                    >
                                        Next &rarr;
                                    </button>
                                </div>

                                {quizError && <p className="text-red-500 text-xs font-semibold mr-4">{quizError}</p>}

                                {!dailyQuizAttempted ? (
                                    currentQuizQuestionIndex === 4 ? (
                                        <button
                                            onClick={async () => {
                                                if (quizAnswers.some(ans => ans === null)) {
                                                    setQuizError('Please answer all 5 questions.');
                                                    return;
                                                }
                                                setQuizSubmitting(true);
                                                setQuizError('');
                                                try {
                                                    const res = await api.post('/student/engagement/daily-quiz/submit', { answers: quizAnswers });
                                                    if (res.data.success) {
                                                        playSuccessBeep();
                                                        setDailyQuizAttempted(true);
                                                        setDailyQuizAttempt(res.data.attempt);
                                                        setQuizAnswers(res.data.attempt?.answers || quizAnswers);
                                                        setCurrentQuizQuestionIndex(0);
                                                        // Refresh dashboard data
                                                        fetchDashboardData();
                                                        fetchEngagementData();
                                                        // Close modal then scroll to the completed quiz card
                                                        setShowQuizModal(false);
                                                        setTimeout(() => {
                                                            quizCompletedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }, 350);
                                                    }
                                                } catch (e) {
                                                    setQuizError(e.response?.data?.message || 'Submission failed. Please try again.');
                                                } finally {
                                                    setQuizSubmitting(false);
                                                }
                                            }}
                                            disabled={quizSubmitting}
                                            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-xl text-xs hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                        >
                                            {quizSubmitting ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                                            ) : (
                                                <>✓ Submit Challenge</>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentQuizQuestionIndex(prev => prev + 1)}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-650 text-white font-extrabold rounded-xl text-xs transition-colors"
                                        >
                                            Continue
                                        </button>
                                    )
                                ) : (
                                    <button
                                        onClick={() => setShowQuizModal(false)}
                                        className="px-5 py-2 bg-gray-900 text-white font-extrabold rounded-xl text-xs hover:bg-gray-800 transition-colors"
                                    >
                                        Close Review
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
