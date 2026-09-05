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
    IoLanguageOutline, IoWallet,
    IoTrophyOutline, IoDesktopOutline
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
    'bpsc_pre': 'BPSC CCE Prelims',
    'bpse_pre': 'BPSC CCE Prelims',
    'class_6': 'Class 6',
    'class_7': 'Class 7',
    'class_8': 'Class 8',
    'class_9': 'Class 9',
    'class_10': 'Class 10',
    'class_11': 'Class 11',
    'class_12': 'Class 12',
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
@keyframes orb3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(25px,40px) scale(1.05);}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes pulse-ring{0%{transform:scale(.9);opacity:1;}80%,100%{transform:scale(1.35);opacity:0;}}
@keyframes shimmer-name{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes shimmer-ltr{0%{background-position:0% center;}100%{background-position:-200% center;}}
@keyframes blink-new{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(250,204,21,0.5);}50%{opacity:0.7;box-shadow:0 0 8px 3px rgba(250,204,21,0.35);}}
@keyframes blink-green{0%,100%{opacity:1;text-shadow:0 0 8px rgba(34,197,94,0.9);}50%{opacity:0.7;text-shadow:0 0 16px rgba(34,197,94,0.5);}}
@keyframes blink-red{0%,100%{opacity:1;text-shadow:0 0 8px rgba(239,68,68,0.9);}50%{opacity:0.7;text-shadow:0 0 16px rgba(239,68,68,0.5);}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-name 4s linear infinite;}
.new-badge-blink{animation:blink-new 1.4s ease-in-out infinite;}
.label-blink-green{animation:blink-green 1.1s ease-in-out infinite;color:#22c55e;font-weight:800;}
.label-blink-red{animation:blink-red 1.1s ease-in-out infinite;color:#ef4444;font-weight:800;}
@keyframes fab-blink{0%,100%{box-shadow:0 8px 32px rgba(249,115,22,0.45),0 0 0 1px rgba(255,255,255,0.1);}50%{box-shadow:0 8px 52px rgba(249,115,22,0.85),0 0 0 5px rgba(249,115,22,0.2);}}
.fab-blink{animation:fab-blink 1.6s ease-in-out infinite;}
/* Ambient background blobs */
.dash-blob{position:fixed;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0;}
.dash-blob-1{width:550px;height:550px;top:-120px;left:-150px;background:radial-gradient(circle,rgba(249,115,22,0.11) 0%,transparent 70%);animation:orb1 20s ease-in-out infinite;}
.dash-blob-2{width:400px;height:400px;top:20%;right:-100px;background:radial-gradient(circle,rgba(251,146,60,0.07) 0%,transparent 70%);animation:orb2 26s ease-in-out infinite;}
.dash-blob-3{width:350px;height:350px;bottom:20%;left:5%;background:radial-gradient(circle,rgba(253,186,116,0.08) 0%,transparent 70%);animation:orb3 30s ease-in-out infinite;}
.dash-blob-4{width:280px;height:280px;top:60%;right:15%;background:radial-gradient(circle,rgba(249,115,22,0.06) 0%,transparent 70%);animation:orb2 24s ease-in-out infinite reverse;}

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
                        className="fixed inset-0 z-[855] flex flex-col items-end justify-end pb-24 pr-5 gap-3.5"
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

            {/* ── Main FAB — premium pill ── */}
            <div className="fixed bottom-6 right-4 z-[850]">
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.35 }}
                    whileHover={!loading && !open ? { scale: 1.04, y: -2 } : {}}
                    whileTap={!loading ? { scale: 0.95 } : {}}
                    onClick={toggle}
                    disabled={loading}
                    className={`relative flex items-center overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed${!loading && !open ? ' fab-blink' : ''}`}
                    style={{
                        borderRadius: open ? '50%' : '100px',
                        padding: open ? '14px' : '12px 22px 12px 14px',
                        gap: '10px',
                        background: loading
                            ? 'linear-gradient(135deg,#78716c,#57534e)'
                            : open
                            ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                            : 'linear-gradient(135deg,#f97316 0%,#ea580c 50%,#c2410c 100%)',
                        boxShadow: open
                            ? '0 8px 24px rgba(220,38,38,0.5)'
                            : loading
                            ? 'none'
                            : '0 8px 28px rgba(249,115,22,0.5), 0 2px 8px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        border: 'none',
                        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                        color: '#fff',
                        fontWeight: 700,
                    }}
                >
                    {/* Shimmer sweep on button */}
                    {!open && !loading && (
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)', backgroundSize: '200% 100%', animation: 'shimmer-name 2.5s linear infinite' }} />
                    )}

                    {open ? (
                        <motion.div key="close-icon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <IoCloseOutline size={22} />
                        </motion.div>
                    ) : (
                        <>
                            {/* Icon box */}
                            <div className="relative w-8 h-8 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                                {loading
                                    ? <IoTimeOutline size={17} className="animate-spin" />
                                    : <IoScan size={17} />
                                }
                            </div>
                            {/* Label */}
                            <span className="text-[14px] font-extrabold tracking-wide relative" style={{ letterSpacing: '0.01em' }}>
                                {loading ? 'Checking…' : 'Mark Attendance'}
                            </span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Backdrop — clean subtle dismiss overlay without blur */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="fab-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[840]"
                        style={{ background: 'rgba(0, 0, 0, 0.15)' }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

/* ─── Location Prompt Modal ─────────────────────────────────────────── */
const LocationPromptModal = ({ onClose, onEnable, enabling }) => (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
const AttendanceResultCard = ({ result, onClose, forceDoubtBoard }) => {
    const isEntry = result.type === 'entry';
    const isAlreadyMarked = result.type === 'already_marked';
    const att = result.attendance || {};
    const theme = isEntry
        ? { bg: '#ffffff', border: '#a7f3d0', bar: 'from-emerald-400 to-teal-400', iconBg: 'linear-gradient(135deg,#10b981,#14b8a6)', text: '#059669', glow: '#d1fae5' }
        : isAlreadyMarked
            ? { bg: '#ffffff', border: '#fde68a', bar: 'from-amber-400 to-orange-400', iconBg: 'linear-gradient(135deg,#f59e0b,#ea580c)', text: '#d97706', glow: '#fef3c7' }
            : { bg: '#ffffff', border: '#c7d2fe', bar: 'from-indigo-400 to-blue-400', iconBg: 'linear-gradient(135deg,#6366f1,#3b82f6)', text: '#4f46e5', glow: '#e0e7ff' };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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

                    {forceDoubtBoard && (
                        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-4 animate-pulse">
                            <IoSparklesOutline size={14} className="text-orange-500" />
                            <span>Opening AI Doubt Board...</span>
                        </div>
                    )}

                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all" style={{ background: theme.iconBg }}>
                        {forceDoubtBoard ? 'Continue to Doubt Board →' : 'Dismiss'}
                    </button>

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
const getScoreColor = (score) => {
    const s = parseFloat(score);
    if (isNaN(s)) return { text: 'text-white', bg: 'bg-white/10', border: 'border-white/10', badgeBg: 'rgba(255,255,255,0.1)', badgeText: 'text-white', badgeBorder: 'border-white/20' };
    if (s >= 75) {
        return {
            text: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            badgeBg: 'rgba(16,185,129,0.2)',
            badgeText: 'text-emerald-300',
            badgeBorder: 'border-emerald-500/35'
        };
    } else if (s >= 50) {
        return {
            text: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            badgeBg: 'rgba(245,158,11,0.2)',
            badgeText: 'text-amber-300',
            badgeBorder: 'border-amber-500/35'
        };
    } else {
        return {
            text: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            badgeBg: 'rgba(239,68,68,0.2)',
            badgeText: 'text-rose-300',
            badgeBorder: 'border-rose-500/35'
        };
    }
};

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
    const [attendanceMarkedToday, setAttendanceMarkedToday] = useState(false);
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
    const [referralEnabled, setReferralEnabled]       = useState(true);
    const [showPinModal, setShowPinModal]             = useState(false);
    const [pinValue, setPinValue]                     = useState('');
    const [pinLoading, setPinLoading]                 = useState(false);
    const [pinError, setPinError]                     = useState('');
    const [directMarkLoading, setDirectMarkLoading]   = useState(false);
    const { logout, user, forceDoubtBoard }           = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const isActive = user?.isActive;
    const hasSeat = dashboardData?.seat || (dashboardData?.tempAssignments?.length > 0);
    const navigate = useNavigate();

    // Engagement & Gamification States
    const [activeLeftTab, setActiveLeftTab]           = useState('actions');
    const [streakStats, setStreakStats]               = useState(null);
    const [coinBalance, setCoinBalance]               = useState(null);
    const [isCardFlipped, setIsCardFlipped]           = useState(false);
    const [leaderboard, setLeaderboard]               = useState([]);
    const [leaderboardSortBy, setLeaderboardSortBy]   = useState('xp');
    const [dailyQuiz, setDailyQuiz]                   = useState(null);
    const [dailyQuizAttempted, setDailyQuizAttempted] = useState(false);
    const [dailyQuizAttempt, setDailyQuizAttempt]     = useState(null);
    const quizCompletedRef                            = useRef(null);
    const [showQuizModal, setShowQuizModal]           = useState(false);
    const [showReferralModal, setShowReferralModal]   = useState(false);
    const [activeUpdate, setActiveUpdate]             = useState(null);
    const [showUpdateModal, setShowUpdateModal]       = useState(false);
    const [modalLang, setModalLang]                   = useState('en');
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

        // Fetch wallet balance for the coin chip (non-critical)
        try {
            const walletRes = await api.get('/student/wallet');
            if (walletRes.data.success) setCoinBalance(walletRes.data.wallet.coinBalance);
        } catch (_) { /* silent */ }

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

    const fetchActiveUpdate = async () => {
        try {
            const res = await api.get('/student/updates/latest');
            if (res.data.success) {
                setActiveUpdate(res.data.update);
            }
        } catch (e) {
            console.error('Error fetching latest active update:', e);
        }
    };

    useEffect(() => {
        // Always bust dashboard cache on mount so fee reminder is always fresh
        bustCache('dashboard');
        setLoading(true);
        fetchDashboardData();
        loadSettingsCache();
        fetchCardConfig();
        fetchPinStatus();
        fetchPendingFeedback();
        fetchEngagementData();
        fetchActiveUpdate();
    }, []);
    
    useEffect(() => {
        if (dashboardData?.feeReminder?.show) {
            setShowFeeReminder(true);
        }
    }, [dashboardData?.feeReminder?.show, dashboardData?.feeReminder?.amount]);

    const fetchPinStatus = async () => {
        if (isFresh('settings')) {
            const s = _cache.settings.data;
            setPinEnabled(!!s.pinAttendanceEnabled);
            setManualMarkEnabled(true);
            setShowWhatsAppGroup(s.showWhatsAppGroup !== false);
            setShowAITools(s.showAITools !== false);
            setReferralEnabled(!!s.referral?.enabled);
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
                setReferralEnabled(!!s.referral?.enabled);
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
            const isMarked = !!res.data.data?.attendance?.markedToday;
            setAttendanceMarkedToday(isMarked);
            if (isMarked) {
                localStorage.setItem('attendance_marked_date', new Date().toDateString());
            } else {
                localStorage.removeItem('attendance_marked_date');
            }
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

    const handleDismissAttendanceResult = () => {
        setAttendanceResult(null);
        if (forceDoubtBoard) {
            navigate('/student/doubt');
        }
    };

    const markAttendanceSuccess = (data) => {
        const isNew = data.type !== 'already_marked';
        if (isNew) playSuccessBeep();
        localStorage.setItem('attendance_marked_date', new Date().toDateString());
        setAttendanceMarkedToday(true);
        setAttendanceResult({
            type: data.type,
            attendance: data.attendance,
            message: data.message
        });
        if (isNew) {
            bustCache('dashboard');
            fetchDashboardData();
        }

        // When admin ON that (forceDoubtBoard), automatically open Doubt board after marking attendance
        if (forceDoubtBoard) {
            setTimeout(() => {
                setAttendanceResult(null);
                navigate('/student/doubt');
            }, 1600);
        }
    };

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            const isLocationRequired = getLocationRequired();
            let coords = {};
            if (isLocationRequired) { try { coords = await getLocation(); } catch (e) { setScanMessage({ type: 'error', text: e.message }); setTimeout(() => setScanMessage(null), 6000); return; } }
            const res = await api.post('/student/attendance/qr-scan', { qrToken: token, ...coords });
            if (res.data.success) {
                markAttendanceSuccess(res.data);
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
                markAttendanceSuccess(res.data);
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
                setShowPinModal(false);
                setPinValue('');
                markAttendanceSuccess(res.data);
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
                setShowPinModal(false);
                markAttendanceSuccess(res.data);
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
        <div className="relative min-h-screen" style={{ background: 'linear-gradient(135deg,#fffaf7 0%,#fafafa 40%,#fffbf8 70%,#fafafa 100%)' }}>
            <style>{DASH_STYLE}</style>
            {/* Ambient floating color blobs */}
            <div className="dash-blob dash-blob-1" />
            <div className="dash-blob dash-blob-2" />
            <div className="dash-blob dash-blob-3" />
            <div className="dash-blob dash-blob-4" />
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
    // ── Dynamic section visibility ──────────────────────────────────────────────
    const visibleAiCards = (() => {
        if (!showAITools) return [];
        // IDs must match backend DEFAULT_AI_STUDY_SUITE exactly
        const BASE_AI = [
            { id: 'ai-study-plan', label: 'Study Plan',       desc: 'AI weekly schedule',  accentColor: '#6366f1', icon: IoBookOutline,         link: '/student/ai/study-planner'        },
            { id: 'ai-test',       label: 'Test Analyzer',    desc: 'Weak area insights',  accentColor: '#ea580c', icon: IoSparklesOutline,     link: '/student/ai/test-analyzer'        },
            { id: 'ai-notes',      label: 'Note Summarizer',  desc: 'Paste and summarize', accentColor: '#7c3aed', icon: IoDocumentTextOutline, link: '/student/ai/note-summarizer'      },
            { id: 'ai-ca-quiz',    label: 'News Quiz',        desc: 'Quiz from articles',  accentColor: '#0ea5e9', icon: IoGridOutline,         link: '/student/ai/current-affairs-quiz' },
            { id: 'ai-tasks',      label: 'Task Suggestions', desc: 'Smart daily tasks',   accentColor: '#f97316', icon: IoFlashOutline,        link: '/student/ai/task-suggestions'     },
            { id: 'ai-readiness',  label: 'Readiness Score',  desc: 'Your exam readiness', accentColor: '#16a34a', icon: IoTrophyOutline,       link: '/student/ai/readiness-score'      },
        ];
        const cfg = cardConfig?.aiStudySuite;
        if (!cfg || cfg.length === 0) return BASE_AI;
        const result = BASE_AI
            .map(card => { const cf = cfg.find(x => x.id === card.id); return cf ? { ...card, _order: cf.order ?? 99, _visible: cf.visible !== false, _isNew: !!cf.isNew } : { ...card, _order: 99, _visible: true, _isNew: false }; })
            .filter(card => card._visible)
            .sort((a, b) => (a._order ?? 99) - (b._order ?? 99));
        return result;
    })();

    const visibleQaCards = (() => {
        // IDs must match backend DEFAULT_QUICK_ACTIONS exactly
        const BASE_QA = [
            { id: 'id-card',        icon: IoIdCardOutline,      label: 'ID Card',        accentColor: '#6366f1', action: () => setShowIDCard(true) },
            { id: 'planner',        icon: IoBookOutline,        label: 'Planner',        accentColor: '#ec4899', link: '/student/planner' },
            { id: 'discussion',     icon: IoChatbubblesOutline, label: 'Discussion',     accentColor: '#f97316', link: '/student/chat' },
            { id: 'newspaper',      icon: IoNewspaper,          label: 'Newspaper',      accentColor: '#8b5cf6', action: () => setShowNewspaper(true) },
            { id: 'current-affairs',icon: IoGridOutline,        label: 'Current Affairs',accentColor: '#38bdf8', link: '/student/current-affairs', live: true },
            { id: 'exam-alerts',    icon: IoAlertCircleOutline, label: 'Exam Alerts',    accentColor: '#f97316', link: '/student/exam-alerts', live: true },
            { id: 'my-report',      icon: IoDocumentTextOutline,label: 'My Report',      accentColor: '#14b8a6', link: '/student/report' },
            { id: 'ask-ai',         icon: IoSparklesOutline,    label: 'Ask AI',         accentColor: '#FACC15', link: '/student/doubt', desc: dashboardData?.doubtCredits != null ? `${dashboardData.doubtCredits}/${dashboardData.maxDoubtCredits || dashboardData.doubtCredits} credits` : 'AI powered' },
            { id: 'support',        icon: IoHelpCircleOutline,  label: 'Support',        accentColor: '#eab308', action: () => setShowSupportModal(true), badge: dashboardData?.requestsCount || 0 },
        ];
        const cfg = cardConfig?.quickActions;
        if (!cfg || cfg.length === 0) return BASE_QA;
        return BASE_QA
            .map(card => { const cf = cfg.find(x => x.id === card.id); return cf ? { ...card, _order: cf.order ?? 99, _visible: cf.visible !== false, _isNew: !!cf.isNew } : { ...card, _order: 99, _visible: true, _isNew: false }; })
            .filter(card => card._visible)
            .sort((a, b) => (a._order ?? 99) - (b._order ?? 99));
    })();

    const visibleLearningCards = (() => {
        // IDs must match backend DEFAULT_LEARNING exactly
        const BASE_L = [
            { id: 'books',     icon: IoBookOutline,         label: t('Books'),        desc: t('Curated study books'), accentColor: '#3b82f6', to: '/student/books',     locked: false },
            { id: 'notes',     icon: IoDocumentTextOutline, label: t('Notes'),        desc: t('Browse & download'),   accentColor: '#8b5cf6', to: '/student/notes',     locked: false },
            { id: 'mock-test', icon: IoSparklesOutline,     label: t('AI Mock Test'), desc: t('Practice tests'),      accentColor: '#f59e0b', to: '/student/mock-test', locked: false },
        ];
        const cfg = cardConfig?.learning;
        if (!cfg || cfg.length === 0) return BASE_L;
        return BASE_L
            .map(card => { const cf = cfg.find(x => x.id === card.id); return cf ? { ...card, _order: cf.order ?? 99, _visible: cf.visible !== false, _isNew: !!cf.isNew } : { ...card, _order: 99, _visible: true, _isNew: false }; })
            .filter(card => card._visible)
            .sort((a, b) => (a._order ?? 99) - (b._order ?? 99));
    })();

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(135deg,#fffaf7 0%,#fafafa 40%,#fffbf8 70%,#fafafa 100%)', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style>{DASH_STYLE}</style>

            {/* Ambient floating color blobs */}
            <div className="dash-blob dash-blob-1" />
            <div className="dash-blob dash-blob-2" />
            <div className="dash-blob dash-blob-3" />
            <div className="dash-blob dash-blob-4" />

            {/* Subtle dot grid texture */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(249,115,22,0.05) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
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
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
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
                {attendanceResult && (
                    <AttendanceResultCard
                        result={attendanceResult}
                        onClose={handleDismissAttendanceResult}
                        forceDoubtBoard={forceDoubtBoard}
                    />
                )}
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
            <header className="sticky top-0 z-40" style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(249,115,22,0.15)', boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
                {/* Shimmering bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(249,115,22,0.4) 30%,rgba(251,146,60,0.7) 50%,rgba(249,115,22,0.4) 70%,transparent 100%)', animation: 'shimmer-name 4s linear infinite', backgroundSize: '200% 100%' }} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    {/* Brand — full shining title L→R */}
                    <div className="flex items-center gap-2 select-none">
                        <span className="font-black text-base tracking-tight" style={{
                            background: 'linear-gradient(90deg, #ea580c 0%, #f97316 15%, #fdba74 35%, #fff7ed 50%, #fdba74 65%, #f97316 85%, #ea580c 100%)',
                            backgroundSize: '300% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'shimmer-ltr 2.2s linear infinite',
                        }}>Apna Lakshay</span>
                    </div>

                    {/* Nav right */}
                    <div className="flex items-center gap-2">
                        {/* Notification bell */}
                        <Link to="/student/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                            style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.12)' }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(249,115,22,0.14)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(249,115,22,0.07)'; }}>
                            <IoNotificationsOutline size={18} style={{ color: '#f97316' }} />
                            {dashboardData?.unreadNotifications > 1 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
                            )}
                        </Link>

                        {/* Profile pill */}
                        <Link to="/student/profile" className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl transition-all duration-200"
                            style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.12)' }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(249,115,22,0.14)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='rgba(249,115,22,0.07)'; }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)' }}>
                                <IoPersonOutline size={14} className="text-white" />
                            </div>
                            <span className="text-[12px] font-bold hidden sm:block" style={{ color: '#f9fafb' }}>{user?.name?.split(' ')[0]}</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ─────────────────────────────────────────────────────────────
                  PAGE BODY
               ───────────────────────────────────────────────────────────── */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">

                {/* -- DYNAMIC DASHBOARD UPDATE TICKER -- */}
                {activeUpdate && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="mb-5 overflow-hidden rounded-2xl border flex items-center justify-between p-2 sm:p-2.5 bg-gradient-to-r from-orange-50/70 via-white to-pink-50/50 border-orange-200 shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Compact Badge */}
                            <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-black px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white uppercase tracking-wider shadow-sm">
                                <IoGiftOutline size={11} className="animate-bounce" />
                                {language === 'hi' ? 'अपडेट' : 'Update'}
                            </span>
                            
                            {/* Compact Ticker (Marquee) */}
                            <div className="relative flex-1 overflow-hidden h-5 flex items-center min-w-0 bg-orange-500/5 rounded-lg px-2 border border-orange-100/50">
                                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-orange-50/0 to-transparent z-10 pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-orange-50/0 to-transparent z-10 pointer-events-none" />
                                
                                <style>{`
                                    @keyframes refMiniTicker {
                                        0% { transform: translate3d(0, 0, 0); }
                                        100% { transform: translate3d(-50%, 0, 0); }
                                    }
                                    .animate-ref-mini-ticker {
                                        display: inline-flex;
                                        white-space: nowrap;
                                        animation: refMiniTicker 24s linear infinite;
                                    }
                                    .animate-ref-mini-ticker:hover {
                                        animation-play-state: paused;
                                    }
                                    @keyframes buttonPulse {
                                        0% {
                                            transform: scale(1);
                                            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.5);
                                        }
                                        70% {
                                            transform: scale(1.05);
                                            box-shadow: 0 0 0 7px rgba(236, 72, 153, 0);
                                        }
                                        100% {
                                            transform: scale(1);
                                            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
                                        }
                                    }
                                    .animate-view-pulse {
                                        animation: buttonPulse 1.8s infinite ease-in-out;
                                    }
                                `}</style>
                                <div className="animate-ref-mini-ticker text-[11px] sm:text-xs font-black text-orange-600 select-none cursor-pointer flex gap-12 whitespace-nowrap">
                                    <span>
                                        {language === 'hi' ? activeUpdate.tickerHi : activeUpdate.tickerEn}
                                    </span>
                                    <span>
                                        {language === 'hi' ? activeUpdate.tickerHi : activeUpdate.tickerEn}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Button */}
                        <button
                            onClick={() => {
                                setModalLang(language);
                                setShowUpdateModal(true);
                            }}
                            className="ml-3 px-3 py-1 text-[10px] sm:text-xs font-black rounded-xl text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shrink-0 bg-gradient-to-r from-orange-500 to-pink-500 animate-view-pulse"
                        >
                            {language === 'hi' ? 'देखें' : 'View'}
                            <IoArrowForward size={11} />
                        </button>
                    </motion.div>
                )}

                {/* -- HERO GREETING BAR ------------------------------------------ */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 180 }}
                    className="mb-5 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl overflow-hidden relative"
                    style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(249,115,22,0.2)', boxShadow: '0 4px 20px rgba(249,115,22,0.08), 0 1px 0 rgba(255,255,255,0.8) inset' }}
                >
                    {/* Subtle orange glow left */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(90deg,rgba(249,115,22,0.08),transparent)' }} />
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.6) 40%,rgba(251,146,60,0.8) 60%,transparent)' }} />

                    <div className="flex items-center gap-3 relative">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg" style={{ border: '2px solid rgba(249,115,22,0.4)' }}>
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
                            {isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1c1917]" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm" style={{ color: '#111827' }}>Hi, {user?.name?.split(" ")[0]} 👋</span>
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>{today}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                        {isActive
                            ? <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />{t("Active")}</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>{t("Inactive")}</span>}
                        {referralEnabled && (
                            <Link to="/student/wallet">
                                <motion.span whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
                                    <IoWallet size={11} />
                                    Wallet
                                </motion.span>
                            </Link>
                        )}
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

                {/* -- DAILY CHALLENGE -- shown here when NOT yet done -- */}
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
                        <div className="rounded-2xl overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#ea580c 70%,#f97316 100%)', boxShadow: '0 8px 32px rgba(249,115,22,0.35)', border: '1.5px solid rgba(249,115,22,0.4)' }}>
                            {/* Shimmer sweep */}
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.08) 50%,transparent 65%)', backgroundSize: '200% 100%', animation: 'shimmer-name 3s linear infinite' }} />
                            {/* Top badge strip */}
                            <div className="px-5 pt-4 pb-0 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />{t("Today's Task")}
                                </span>
                                <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{t("Complete before midnight")}</span>
                            </div>
                            {/* Main row */}
                            <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                                        <IoSparklesOutline size={18} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-black text-sm text-white truncate">{t("Daily Challenge")}</h2>
                                        <p className="text-[10px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>5 {t("questions")} • Up to +70 {t("XP")}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full shrink-0"
                                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
                                    {user?.examTarget && user.examTarget !== 'generic' ? (EXAM_TARGET_NAMES[user.examTarget] || t(user.examTarget)) : t('Select Target')}
                                </span>
                            </div>
                            {/* Rewards + CTA */}
                            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {[{val: `+50 ${t('XP')}`, sub: t('base reward')}, {val: `+20 ${t('Bonus')}`, sub: t('if 5/5')}, {val: t('Streak'), sub: t('kept alive')}].map((r, i) => (
                                        <div key={i} className="flex flex-col items-center text-center">
                                            <span className="text-sm font-black text-white whitespace-nowrap">{r.val}</span>
                                            <span className="text-[9px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.sub}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (!user?.examTarget || user.examTarget === 'generic') { navigate('/student/profile?focus=examTarget'); return; }
                                        setQuizAnswers([null, null, null, null, null]);
                                        setCurrentQuizQuestionIndex(0);
                                        setShowQuizModal(true);
                                        setQuizError('');
                                    }}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all hover:opacity-95 active:scale-95 shrink-0 self-stretch sm:self-auto"
                                    style={{ background: 'rgba(255,255,255,0.95)', color: '#c2410c', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
                                >
                                    <IoFlashOutline size={15} className="animate-bounce" />
                                    {t("Start Challenge")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* -- STATS ROW ---------------------------------------------------- */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.45 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
                >
                    {/* MY SEAT */}
                    <Link to="/student/seat">
                        <div className="group relative overflow-hidden rounded-2xl p-4 cursor-pointer h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            style={{ background: 'linear-gradient(135deg,#fff7ed 0%,#ffedd5 60%,#fed7aa 100%)', border: '1.5px solid #fb923c', boxShadow: '0 4px 16px rgba(249,115,22,0.12)' }}>
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(249,115,22,0.2) 0%,transparent 70%)' }} />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                                    <IoDesktopOutline size={15} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-orange-700">My Seat</span>
                            </div>
                            <div className="relative z-10">
                            {(() => {
                                const displaySeats = [];
                                if (dashboardData?.seat) {
                                    displaySeats.push({
                                        isTemp: false,
                                        number: dashboardData.seat.roomId ? `${dashboardData.seat.roomId} - ${dashboardData.seat.number}` : dashboardData.seat.number,
                                        shifts: dashboardData.seat.shifts || (dashboardData.seat.shift ? [{ name: dashboardData.seat.shift }] : []),
                                    });
                                }
                                if (dashboardData?.tempAssignments?.length > 0) {
                                    dashboardData.tempAssignments.forEach(s => {
                                        displaySeats.push({ isTemp: true, number: s.room ? `${s.room} - ${s.seatNumber}` : s.seatNumber || '?', shifts: [{ name: s.shiftName, startTime: s.startTime, endTime: s.endTime }] });
                                    });
                                }
                                if (displaySeats.length === 0) return (
                                    <div className="mt-2">
                                        <p className="text-2xl sm:text-3xl font-black mb-0.5 leading-none text-orange-900">--</p>
                                        <p className="text-[11px] font-semibold text-orange-400">Not Assigned</p>
                                    </div>
                                );
                                return (
                                    <div className="flex flex-col gap-2 mt-1">
                                        {displaySeats.map((s, r) => (
                                            <div key={r}>
                                                <p className="text-2xl sm:text-3xl font-black mb-0.5 truncate leading-none" style={{ color: s.isTemp ? '#dc2626' : '#9a3412' }} title={s.number}>{s.number}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {s.shifts.map((m, g) => (
                                                        <span key={g} className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-full"
                                                            style={{ background: s.isTemp ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)', border: `1px solid ${s.isTemp ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`, color: s.isTemp ? '#dc2626' : '#ea580c' }}>
                                                            {m.name}{m.startTime ? ` ${m.startTime}-${m.endTime}` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                            </div>
                        </div>
                    </Link>

                    {/* ATTENDANCE */}
                    <Link to="/student/attendance">
                        <div className="group relative rounded-2xl p-4 cursor-pointer h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            style={{
                                background: attPct >= 75 ? 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)' : attPct >= 50 ? 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 60%,#fde68a 100%)' : 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 60%,#fecdd3 100%)',
                                border: `1.5px solid ${attPct >= 75 ? '#86efac' : attPct >= 50 ? '#fcd34d' : '#fca5a5'}`,
                                boxShadow: `0 4px 16px ${attPct >= 75 ? 'rgba(34,197,94,0.12)' : attPct >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'}`,
                            }}>
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
                                style={{ background: `radial-gradient(circle,${attPct >= 75 ? 'rgba(34,197,94,0.2)' : attPct >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'} 0%,transparent 70%)` }} />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                                    style={{ background: attPct >= 75 ? 'linear-gradient(135deg,#10b981,#34d399)' : attPct >= 50 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'linear-gradient(135deg,#ef4444,#f87171)' }}>
                                    <IoCalendarOutline size={15} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: attPct >= 75 ? '#15803d' : attPct >= 50 ? '#b45309' : '#b91c1c' }}>Attendance</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black mb-0.5 leading-none" style={{ color: attPct >= 75 ? '#166534' : attPct >= 50 ? '#92400e' : '#991b1b' }}>{attPct}%</p>
                            <p className="text-[11px] font-semibold" style={{ color: attPct >= 75 ? '#16a34a' : attPct >= 50 ? '#d97706' : '#dc2626' }}>
                                {dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days
                            </p>
                            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                                <div className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(attPct, 100)}%`, background: attPct >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : attPct >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }} />
                            </div>
                        </div>
                    </Link>

                    {/* FEE STATUS */}
                    <div onClick={() => navigate('/student/fees')}
                        className="group rounded-2xl p-4 cursor-pointer h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        style={{
                            background: dashboardData?.fee?.status === 'paid' ? 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)' : dashboardData?.fee?.status === 'overdue' ? 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 60%,#fecdd3 100%)' : 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 60%,#fde68a 100%)',
                            border: `1.5px solid ${dashboardData?.fee?.status === 'paid' ? '#86efac' : dashboardData?.fee?.status === 'overdue' ? '#fca5a5' : '#fcd34d'}`,
                            boxShadow: `0 4px 16px ${dashboardData?.fee?.status === 'paid' ? 'rgba(34,197,94,0.12)' : dashboardData?.fee?.status === 'overdue' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'}`,
                        }}>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                                    style={{ background: dashboardData?.fee?.status === 'paid' ? 'linear-gradient(135deg,#10b981,#34d399)' : dashboardData?.fee?.status === 'overdue' ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'linear-gradient(135deg,#f59e0b,#fbbf24)' }}>
                                    <IoCashOutline size={15} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: dashboardData?.fee?.status === 'paid' ? '#15803d' : dashboardData?.fee?.status === 'overdue' ? '#b91c1c' : '#b45309' }}>Fee Status</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black mb-2 leading-none" style={{ color: dashboardData?.fee?.status === 'paid' ? '#166534' : dashboardData?.fee?.status === 'overdue' ? '#991b1b' : '#92400e' }}>
                                {dashboardData?.fee ? `₹${dashboardData.fee.status === 'partial' ? dashboardData.fee.outstanding ?? dashboardData.fee.amount : dashboardData.fee.amount}` : '--'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                            {dashboardData?.fee?.status ? (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${dashboardData.fee.status === 'paid' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : dashboardData.fee.status === 'overdue' ? 'bg-red-50 border-red-300 text-red-600' : dashboardData.fee.status === 'partial' ? 'bg-orange-50 border-orange-300 text-orange-600' : 'bg-amber-50 border-amber-300 text-amber-600'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dashboardData.fee.status === 'paid' ? '#34d399' : dashboardData.fee.status === 'overdue' ? '#f87171' : dashboardData.fee.status === 'partial' ? '#fb923c' : '#fbbf24' }}></span>
                                    {dashboardData.fee.status.charAt(0).toUpperCase() + dashboardData.fee.status.slice(1)}
                                </span>
                            ) : (
                                <p className="text-[11px] font-semibold text-amber-600">No record</p>
                            )}
                            {dashboardData?.fee?.status && dashboardData.fee.status !== 'paid' && dashboardData.onlinePaymentEnabled && (
                                <button onClick={e => { e.stopPropagation(); navigate('/student/fees?pay=now'); }}
                                    className="px-3 py-1 text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                                    style={{ background: '#F97316' }}>Pay Online</button>
                            )}
                        </div>
                    </div>

                    {/* ALERTS */}
                    <Link to="/student/notifications">
                        <div className="group relative overflow-hidden rounded-2xl p-4 cursor-pointer h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            style={{ background: 'linear-gradient(135deg,#fdf4ff 0%,#fae8ff 60%,#f5d0fe 100%)', border: '1.5px solid #e879f9', boxShadow: '0 4px 16px rgba(217,70,239,0.12)' }}>
                            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(217,70,239,0.2) 0%,transparent 70%)' }} />
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg,#d946ef,#a855f7)' }}>
                                    <IoNotificationsOutline size={16} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-fuchsia-700">Alerts</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-2xl sm:text-3xl font-black mb-0.5 leading-none text-fuchsia-900">{dashboardData?.unreadNotifications || 0}</p>
                                <p className="text-[11px] font-semibold text-fuchsia-500">{dashboardData?.unreadNotifications > 0 ? 'Unread messages' : 'All caught up!'}</p>
                            </div>
                            {dashboardData?.unreadNotifications > 1 && (
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse"
                                    style={{ background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.9)' }} />
                            )}
                        </div>
                    </Link>
                </motion.div>

                {/* -- AI INSIGHT OF THE DAY ---------------------------------------------------------- */}
                {showAITools && visibleAiCards.length > 0 && aiInsight && (() => {
                    const scoreColors = getScoreColor(aiInsight.score);
                    return (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} className="mb-4">
                            <Link to="/student/ai/readiness-score">
                                <div
                                    className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 cursor-pointer group hover:shadow-md transition-all duration-200"
                                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)', border: '1.5px solid rgba(99,102,241,0.35)', boxShadow: '0 4px 20px rgba(99,102,241,0.15)' }}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={`w-12 h-12 rounded-2xl ${scoreColors.bg} flex flex-col items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform border ${scoreColors.border}`}>
                                            <span className={`text-lg font-black ${scoreColors.text} leading-none`}>{aiInsight.score}</span>
                                            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wide">/ 100</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-white font-black text-sm">AI Insight of the Day</span>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${scoreColors.badgeBg} ${scoreColors.badgeText} border ${scoreColors.badgeBorder}`}>{aiInsight.level}</span>
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
                    );
                })()}

                {/* -- AI STUDY SUITE -------------------------------------------------- */}
                {showAITools && visibleAiCards.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.45 }} className="mb-5">
                        <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.12)', border: '1.5px solid #c4b5fd' }}>
                            {/* Header */}
                            <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#312e81 0%,#4338ca 50%,#6366f1 100%)' }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        <IoSparklesOutline size={14} className="text-white" />
                                    </div>
                                    <span className="text-sm font-black text-white tracking-wide">AI Study Suite</span>
                                </div>
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest uppercase" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#e0e7ff' }}>
                                    ✦ AI POWERED
                                </span>
                            </div>
                            {/* Cards grid */}
                            <div className="p-4 grid grid-cols-3 gap-3" style={{ background: '#fafafa' }}>
                                {visibleAiCards.map((item, i) => (
                                    <Link key={item.id} to={item.link} className="block">
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.18 + i * 0.06, type: 'spring', stiffness: 120 }}
                                            whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                            className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group bg-white"
                                            style={{
                                                border: `1.5px solid ${item.accentColor}25`,
                                                padding: '14px 12px 14px',
                                                minHeight: '108px',
                                                boxShadow: `0 2px 8px ${item.accentColor}10`,
                                                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.accentColor}55`; e.currentTarget.style.boxShadow = `0 8px 28px -4px ${item.accentColor}30`; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.accentColor}25`; e.currentTarget.style.boxShadow = `0 2px 8px ${item.accentColor}10`; }}
                                        >
                                            {/* Top accent bar */}
                                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                                style={{ background: `linear-gradient(90deg, ${item.accentColor}, ${item.accentColor}60, transparent)` }} />
                                            {/* Ghost watermark */}
                                            <item.icon size={52} className="absolute -bottom-1 -right-1 opacity-[0.05] transition-opacity group-hover:opacity-[0.09] pointer-events-none" style={{ color: item.accentColor }} />
                                            {/* NEW badge */}
                                            {item._isNew && (
                                                <span className="absolute top-2.5 right-2.5 text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wider"
                                                    style={{ background: `${item.accentColor}20`, border: `1px solid ${item.accentColor}40`, color: item.accentColor }}>NEW</span>
                                            )}
                                            {/* Icon pill */}
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 shadow-md transition-transform duration-200 group-hover:scale-110"
                                                style={{ background: `linear-gradient(135deg, ${item.accentColor}, ${item.accentColor}bb)` }}>
                                                <item.icon size={17} className="text-white" />
                                            </div>
                                            {/* Text */}
                                            <div className="mt-auto">
                                                <p className="text-[12.5px] font-bold leading-snug text-gray-900">{item.label}</p>
                                                <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${item.accentColor}bb` }}>{item.desc}</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* -- TWO-COLUMN LAYOUT (actions + learning) ----------------------- */}
                <div className={`grid grid-cols-1 ${visibleLearningCards.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-1'} gap-5`}>

                    {/* LEFT: Quick Actions + Leaderboard panel */}
                    <div className={`${visibleLearningCards.length > 0 ? 'lg:col-span-3' : 'lg:col-span-1'} flex flex-col gap-4`}>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18, duration: 0.45 }}
                            className="w-full rounded-2xl overflow-hidden"
                            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1.5px solid #e5e7eb' }}
                        >
                            {/* Panel Header with tab switcher */}
                            <div className="px-4 py-3 flex items-center justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#ea580c 0%,#f97316 40%,#fb7185 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                {/* Subtle shimmer sweep on header */}
                                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.1) 50%,transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer-name 3s linear infinite' }} />
                                <div className="flex gap-1 p-1 rounded-xl relative" style={{ background: 'rgba(0,0,0,0.15)' }}>
                                    {visibleQaCards.length > 0 && (
                                        <button
                                            onClick={() => setActiveLeftTab('actions')}
                                            className="px-4 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200"
                                            style={activeLeftTab === 'actions'
                                                ? { background: 'rgba(255,255,255,0.25)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                                : { color: 'rgba(255,255,255,0.65)' }}
                                        >Quick Actions</button>
                                    )}
                                    <button
                                        onClick={() => { setActiveLeftTab('leaderboard'); fetchLeaderboard(leaderboardSortBy); }}
                                        className="px-4 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200 flex items-center gap-1.5"
                                        style={activeLeftTab === 'leaderboard'
                                            ? { background: 'rgba(255,255,255,0.25)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                            : { color: 'rgba(255,255,255,0.65)' }}
                                    >
                                        <IoTrophyOutline size={11} />
                                        Leaderboard
                                    </button>
                                </div>
                                {activeLeftTab === 'leaderboard' && (
                                    <select
                                        value={leaderboardSortBy}
                                        onChange={(e) => { const val = e.target.value; setLeaderboardSortBy(val); fetchLeaderboard(val); }}
                                        className="text-[11px] font-bold rounded-xl px-2.5 py-1 focus:outline-none relative"
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                                    >
                                        <option value="xp" style={{ background: '#ea580c', color: '#fff' }}>By XP</option>
                                        <option value="streak" style={{ background: '#ea580c', color: '#fff' }}>By Streak</option>
                                        <option value="focus" style={{ background: '#ea580c', color: '#fff' }}>By Focus</option>
                                    </select>
                                )}
                            </div>

                            {/* Panel body */}
                            {activeLeftTab === 'actions' ? (
                                <div className="p-4 grid grid-cols-3 gap-3" style={{ background: '#fafafa' }}>
                                    {visibleQaCards.map((item, i) => {
                                        const Card = (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.18 + i * 0.05, type: 'spring', stiffness: 130 }}
                                                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                                onClick={item.action}
                                                className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group bg-white"
                                                style={{
                                                    border: `1.5px solid ${item.accentColor}22`,
                                                    padding: '13px 12px 14px',
                                                    minHeight: '106px',
                                                    boxShadow: `0 2px 8px ${item.accentColor}08`,
                                                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.accentColor}55`; e.currentTarget.style.boxShadow = `0 8px 28px -4px ${item.accentColor}28`; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.accentColor}22`; e.currentTarget.style.boxShadow = `0 2px 8px ${item.accentColor}08`; }}
                                            >
                                                {/* Top accent bar */}
                                                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                                    style={{ background: `linear-gradient(90deg, ${item.accentColor}, ${item.accentColor}50, transparent)` }} />
                                                {/* Ghost icon watermark */}
                                                <item.icon size={50} className="absolute -bottom-1 -right-1 opacity-[0.05] group-hover:opacity-[0.09] transition-opacity pointer-events-none" style={{ color: item.accentColor }} />
                                                {/* LIVE badge */}
                                                {item.live && !item._isNew && (
                                                    <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full"
                                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                                        <span className="w-1 h-1 rounded-full animate-pulse bg-red-500" />LIVE
                                                    </span>
                                                )}
                                                {/* NEW badge */}
                                                {item._isNew && (
                                                    <span className="absolute top-2.5 right-2.5 text-[7px] font-black px-1.5 py-0.5 rounded-full"
                                                        style={{ background: `${item.accentColor}20`, border: `1px solid ${item.accentColor}40`, color: item.accentColor }}>NEW</span>
                                                )}
                                                {/* Notification dot badge */}
                                                {item.badge > 1 && (
                                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full animate-pulse"
                                                        style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
                                                )}
                                                {/* Icon pill */}
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 shadow-md transition-transform duration-200 group-hover:scale-110"
                                                    style={{ background: `linear-gradient(135deg, ${item.accentColor}, ${item.accentColor}bb)` }}>
                                                    <item.icon size={17} className="text-white" />
                                                </div>
                                                {/* Label */}
                                                <div className="mt-auto">
                                                    <p className="text-[12.5px] font-bold leading-snug text-gray-900">{item.label}</p>
                                                    {item.desc && (
                                                        <p className="text-[10px] mt-0.5 font-medium" style={{ color: `${item.accentColor}bb` }}>{item.desc}</p>
                                                    )}
                                                    {item.id === 'support' && item.badge > 0 && (
                                                        <button onClick={e => { e.stopPropagation(); setShowHistoryModal(true); }}
                                                            className="text-[9px] font-bold mt-0.5 underline" style={{ color: item.accentColor }}>
                                                            View Status →
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
                                /* Leaderboard */
                                <div className="p-4" style={{ background: '#fafafa' }}>
                                    {leaderboardLoading ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                            <p className="text-xs font-semibold text-gray-400">Loading leaderboard...</p>
                                        </div>
                                    ) : leaderboard.length === 0 ? (
                                        <div className="text-center py-10">
                                            <IoTrophyOutline size={28} className="text-gray-200 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-gray-400">No students on the board yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                            {leaderboard.map((item) => {
                                                const isCurrentUser = item.userId === user?.id;
                                                const rankTheme = item.rank === 1
                                                    ? { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#92400e', badge: '🥇' }
                                                    : item.rank === 2
                                                    ? { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#475569', badge: '🥈' }
                                                    : item.rank === 3
                                                    ? { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: '#9a3412', badge: '🥉' }
                                                    : { bg: 'transparent', border: '#f3f4f6', text: '#6b7280', badge: `#${item.rank}` };
                                                return (
                                                    <div key={item.userId}
                                                        className="flex items-center justify-between p-3 rounded-xl transition-all duration-150"
                                                        style={{ background: isCurrentUser ? 'rgba(99,102,241,0.06)' : rankTheme.bg, border: `1px solid ${isCurrentUser ? '#c4b5fd' : rankTheme.border}` }}>
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                                                                style={{ background: rankTheme.bg, border: `1px solid ${rankTheme.border}`, color: rankTheme.text }}>{rankTheme.badge}</div>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-indigo-700 shrink-0 uppercase"
                                                                style={{ background: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', border: '1px solid #c4b5fd' }}>
                                                                {item.name ? item.name.split(' ').map(w => w[0]).join('').slice(0, 2) : '?'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className={`text-xs font-bold truncate ${isCurrentUser ? 'text-indigo-900' : 'text-gray-900'}`}>{item.name}</span>
                                                                    {isCurrentUser && <span className="text-[7px] font-black px-1 py-0.5 rounded" style={{ background: '#6366f1', color: '#fff' }}>YOU</span>}
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-medium">{item.studentId || 'No ID'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-xs font-black text-gray-800 block">
                                                                {leaderboardSortBy === 'xp' ? `${item.value || 0} XP` : leaderboardSortBy === 'streak' ? `${item.value || 0}d` : `${((item.value || 0) / 60).toFixed(1)}h`}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Lv {item.level || 1}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Completed Daily Challenge (inside left col) */}
                        <AnimatePresence mode="wait">
                            {dailyQuizAttempted && dailyQuiz && (
                                <motion.div
                                    ref={quizCompletedRef}
                                    key="challenge-completed"
                                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 16, scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                    className="rounded-2xl overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#d1fae5 60%,#a7f3d0 100%)', border: '1.5px solid #6ee7b7', boxShadow: '0 4px 20px rgba(16,185,129,0.1)' }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />
                                    <div className="px-4 py-3.5 border-b flex items-center justify-between gap-3" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(255,255,255,0.5)' }}>
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)' }}>
                                                <IoCheckmarkCircleOutline size={16} className="text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-black text-xs sm:text-sm text-emerald-900 truncate">Daily Challenge</h2>
                                                <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold truncate">Completed! Keep it up!</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-emerald-700 shrink-0">
                                            {user?.examTarget && user.examTarget !== 'generic' ? EXAM_TARGET_NAMES[user.examTarget] : 'Select Target'}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-2 rounded-xl flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                <span className="text-xs font-black text-emerald-800">{dailyQuizAttempt?.score || 0}/5</span>
                                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide">Score</span>
                                            </div>
                                            <div className="px-3 py-2 rounded-xl flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                <span className="text-xs font-black text-amber-700">+{dailyQuizAttempt?.xpAwarded || 0}</span>
                                                <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wide">XP</span>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-emerald-900">Excellent Work!</h4>
                                                <p className="text-[10px] text-emerald-600 font-medium">Streak maintained</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setQuizAnswers(dailyQuizAttempt?.answers || [null, null, null, null, null]); setCurrentQuizQuestionIndex(0); setShowQuizModal(true); }}
                                            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-extrabold text-xs text-white transition-all active:scale-95 shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                                        >
                                            <IoDocumentTextOutline size={13} />
                                            Review Solutions
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* RIGHT: Learning section */}
                    {visibleLearningCards.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.24, duration: 0.45 }}
                            className="lg:col-span-2 flex flex-col gap-3"
                        >
                            {/* Learning header */}
                            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(16,185,129,0.1)', border: '1.5px solid #6ee7b7' }}>
                                <div className="px-5 py-3.5 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)' }}>
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        <IoLibraryOutline size={14} className="text-white" />
                                    </div>
                                    <h2 className="font-black text-sm text-white tracking-wide">{t('Learning')}</h2>
                                </div>
                                {/* Learning cards */}
                                <div className="p-3 flex flex-col gap-2.5" style={{ background: '#fafafa' }}>
                                    {visibleLearningCards.map((item, i) => {
                                        const targetRoute = item.locked ? '/pending-allocation' : item.to;
                                        const Card = (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.28 + i * 0.08, type: 'spring', stiffness: 130 }}
                                                whileHover={!item.locked ? { x: 3, transition: { duration: 0.15 } } : {}}
                                                className={`relative flex items-center gap-3 overflow-hidden rounded-xl p-3.5 bg-white group ${item.locked ? 'opacity-55' : 'cursor-pointer'}`}
                                                style={{
                                                    border: `1.5px solid ${item.accentColor}22`,
                                                    boxShadow: `0 2px 8px ${item.accentColor}08`,
                                                    transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                                                }}
                                                onMouseEnter={e => { if (!item.locked) { e.currentTarget.style.borderColor = `${item.accentColor}50`; e.currentTarget.style.boxShadow = `0 6px 20px -4px ${item.accentColor}25`; } }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.accentColor}22`; e.currentTarget.style.boxShadow = `0 2px 8px ${item.accentColor}08`; }}
                                            >
                                                {/* Left accent bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                                                    style={{ background: `linear-gradient(180deg, ${item.accentColor}, ${item.accentColor}60)` }} />
                                                {/* Icon */}
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ml-1 transition-transform duration-200 group-hover:scale-110"
                                                    style={{ background: `linear-gradient(135deg, ${item.accentColor}, ${item.accentColor}bb)` }}>
                                                    <item.icon size={18} className="text-white" />
                                                </div>
                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-900">{item.label}</p>
                                                    <p className="text-[11px] font-medium mt-0.5" style={{ color: `${item.accentColor}aa` }}>{item.desc}</p>
                                                </div>
                                                {/* Arrow */}
                                                {!item.locked && (
                                                    <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                                                        style={{ background: `${item.accentColor}12`, border: `1px solid ${item.accentColor}25` }}>
                                                        <IoChevronForward size={13} style={{ color: item.accentColor }} />
                                                    </div>
                                                )}
                                                {item.locked && <IoLockClosedOutline size={14} className="text-gray-400 shrink-0" />}
                                                {/* Ghost watermark */}
                                                <item.icon size={44} className="absolute -bottom-2 right-8 opacity-[0.04] pointer-events-none" style={{ color: item.accentColor }} />
                                            </motion.div>
                                        );
                                        return <Link key={i} to={targetRoute}>{Card}</Link>;
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
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

            {/* Referral System Info Modal */}
            <AnimatePresence>
                {showReferralModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Glowing Accent Line top */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-500" />

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-orange-50/40 to-transparent">
                                <style>{`
                                    @keyframes modalGradientShift {
                                        0% { background-position: 0% 50%; }
                                        50% { background-position: 100% 50%; }
                                        100% { background-position: 0% 50%; }
                                    }
                                    .animated-coming-soon {
                                        background: linear-gradient(135deg, #F97316, #EC4899, #8B5CF6, #3B82F6);
                                        background-size: 300% 300%;
                                        -webkit-background-clip: text;
                                        -webkit-text-fill-color: transparent;
                                        animation: modalGradientShift 4s ease infinite;
                                        text-shadow: 0 0 10px rgba(236, 72, 153, 0.1);
                                    }
                                `}</style>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white shrink-0">
                                        <IoGiftOutline size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-black text-base sm:text-lg flex flex-wrap items-center gap-1.5">
                                            <span>{modalLang === 'hi' ? 'रेफरल सिस्टम' : 'Referral System'}</span>
                                            <span className="animated-coming-soon text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg border border-orange-500/20 bg-orange-500/5 tracking-wider uppercase shrink-0">
                                                {modalLang === 'hi' ? 'जल्द आ रहा है' : 'Coming Soon'}
                                            </span>
                                        </h3>
                                        <p className="text-[10px] text-pink-600 font-extrabold uppercase tracking-widest mt-0.5">
                                            {modalLang === 'hi' ? 'विशेष छात्र पुरस्कार' : 'Exclusive Student Rewards'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {/* Language Selector Dropdown inside Modal */}
                                    <div className="relative">
                                        <select
                                            value={modalLang}
                                            onChange={(e) => setModalLang(e.target.value)}
                                            className="bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-black text-gray-700 focus:outline-none focus:border-orange-400 cursor-pointer shadow-sm appearance-none"
                                            style={{ minWidth: '95px' }}
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">हिंदी</option>
                                        </select>
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500 flex items-center">
                                            <IoLanguageOutline size={13} />
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => setShowReferralModal(false)}
                                        className="p-1 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <IoCloseOutline size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                                    {modalLang === 'hi'
                                        ? 'अपना लक्ष्य में जल्द ही एक नया रेफरल और रिवार्ड्स सिस्टम लाया जा रहा है। अपने सहपाठियों को आमंत्रित करके आप दोनों विशेष लाभ पा सकेंगे। यहाँ कुछ मुख्य विशेषताएं दी गई हैं:'
                                        : 'We are bringing a comprehensive Referral & Rewards System to Apna Lakshay soon. Share the platform with your peers and unlock benefits for both of you. Here is a sneak peek:'}
                                </p>

                                {/* Benefit 1: Fee Discount */}
                                <div className="p-4 rounded-2xl border border-orange-100 bg-orange-50/30 flex gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                                        <IoCashOutline size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-gray-900">
                                            {modalLang === 'hi' ? 'मासिक फीस में भारी छूट' : 'Monthly Fee Discounts'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1 leading-normal">
                                            {modalLang === 'hi'
                                                ? 'जब आपके रेफरल से कोई छात्र प्रवेश लेगा, तो आपको और उसे एडमिन द्वारा निर्धारित प्रतिशत और महीनों के लिए फीस में छूट मिलेगी।'
                                                : 'When someone joins using your referral, you get a discount on your monthly subscription fee for the duration set by the administrator.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 2: Coin Economy */}
                                <div className="p-4 rounded-2xl border border-pink-100 bg-pink-50/20 flex gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 shrink-0">
                                        <IoSparklesOutline size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-gray-900">
                                            {modalLang === 'hi' ? 'लक्ष्य कॉइन्स (Lakshay Coins)' : 'Lakshay Study Coins'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1 leading-normal">
                                            {modalLang === 'hi'
                                                ? 'हर सफल रेफरल, दैनिक क्विज़, निरंतर उपस्थिति और अच्छे स्कोर पर लक्ष्य कॉइन्स कमाएं। इन कॉइन्स का उपयोग अपनी फीस छूट या मॉक टेस्ट के लिए करें!'
                                                : 'Earn Lakshay Coins for successful referrals, daily quiz streaks, regular attendance, and mock tests. Redeem them for fee discounts and features.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Benefit 3: AI Credits */}
                                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 flex gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                        <IoFlashOutline size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-gray-900">
                                            {modalLang === 'hi' ? 'फ्री AI क्रेडिट्स' : 'Free AI Credits'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1 leading-normal">
                                            {modalLang === 'hi'
                                                ? 'अपने कॉइन्स का उपयोग करके AI स्टडी प्लानर, नोट समराइज़र और डाउट सोल्विंग टूल्स के लिए अतिरिक्त क्रेडिट्स प्राप्त करें।'
                                                : 'Unlock extra credits for our AI Study Suite. Use AI features like personalized study planners, summarizers, and doubt-solving engines.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Coin Transactions Tracker */}
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-600/10 flex items-center justify-center text-slate-700 shrink-0">
                                        <IoTimerOutline size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-sm text-gray-900">
                                            {modalLang === 'hi' ? 'रियल-टाइम एक्टिविटी लेजर' : 'Real-time Wallet Ledger'}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1 leading-normal">
                                            {modalLang === 'hi'
                                                ? 'अपने रेफरल इतिहास और कॉइन ट्रांजेक्शन को एक पारदर्शी बैंक पासबुक शैली के लेजर में आसानी से ट्रैक करें।'
                                                : 'Track every coin earned or spent in a transparent, passbook-style ledger directly from your dashboard.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setShowReferralModal(false)}
                                    className="px-5 py-2.5 rounded-xl font-extrabold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                >
                                    {modalLang === 'hi' ? 'ठीक है, समझ गया' : 'Got it!'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dynamic System Update Details Modal */}
            <AnimatePresence>
                {showUpdateModal && activeUpdate && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Glowing Accent Line top */}
                            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-orange-50/40 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white shrink-0">
                                        <IoGiftOutline size={20} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-black text-base sm:text-lg">
                                            {modalLang === 'hi' ? activeUpdate.titleHi : activeUpdate.titleEn}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Language selector inside modal */}
                                    <div className="relative shrink-0 select-none">
                                        <select
                                            value={modalLang}
                                            onChange={(e) => setModalLang(e.target.value)}
                                            className="appearance-none pl-6 pr-3 py-1 rounded-xl text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-200 outline-none cursor-pointer focus:ring-1 focus:ring-orange-500/35"
                                        >
                                            <option value="en">ENG</option>
                                            <option value="hi">हिंदी</option>
                                        </select>
                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500 flex items-center">
                                            <IoLanguageOutline size={12} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUpdateModal(false)}
                                        className="p-1 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <IoCloseOutline size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 bg-white">
                                <div className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                                    {modalLang === 'hi' ? activeUpdate.contentHi : activeUpdate.contentEn}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="px-5 py-2.5 rounded-xl font-extrabold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                                >
                                    {modalLang === 'hi' ? 'ठीक है, समझ गया' : 'Got it!'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Speed Dial FAB: Mark Attendance (camera + no-camera) — Always visible on /student ── */}
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
