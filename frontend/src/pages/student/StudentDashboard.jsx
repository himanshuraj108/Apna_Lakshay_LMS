import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader, { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import IDCard from '../../components/dashboard/IDCard';
import api from '../../utils/api';
import {
    IoBedOutline, IoCalendarOutline, IoCashOutline,
    IoBookOutline, IoNotificationsOutline, IoPersonOutline,
    IoIdCardOutline, IoScan, IoCheckmarkCircle, IoCloseCircle,
    IoChatbubblesOutline, IoHelpCircleOutline,
    IoNewspaper, IoArrowForwardCircle,
    IoFlashOutline, IoStatsChartOutline, IoShieldCheckmarkOutline,
    IoDocumentTextOutline, IoSparklesOutline, IoLockClosedOutline,
    IoLibraryOutline, IoAlertCircleOutline, IoTimeOutline, IoQrCode
} from 'react-icons/io5';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import HelpSupportModal from '../../components/student/HelpSupportModal';
import RequestHistoryModal from '../../components/student/RequestHistoryModal';
import LmsGuideSection from '../../components/student/LmsGuideSection';
import NewspaperModal from '../../components/student/NewspaperModal';
import ExamAlertsModal from '../../components/student/ExamAlertsModal';
import Footer from '../../components/layout/Footer';

// ─── Animated background orbs ─────────────────────────────────────────
const BG_STYLE = `
@keyframes orb1 {0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
@keyframes orb2 {0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-50px,40px) scale(1.15);}66%{transform:translate(25px,-35px) scale(0.85);}}
@keyframes orb3 {0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(30px,30px) scale(1.2);}}
@keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes pulse-ring{0%{transform:scale(.9);opacity:1;}80%,100%{transform:scale(1.3);opacity:0;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
.card-glass{background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.07);}
.card-glass:hover{background:linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02));border-color:rgba(255,255,255,0.12);}
`;

const BackgroundOrbs = () => (
    <>
        <style>{BG_STYLE}</style>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div style={{ animation: 'orb1 14s ease-in-out infinite' }} className="absolute top-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full bg-purple-600/8 blur-3xl" />
            <div style={{ animation: 'orb2 18s ease-in-out infinite' }} className="absolute top-[35%] right-[-12%] w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-3xl" />
            <div style={{ animation: 'orb3 11s ease-in-out infinite' }} className="absolute bottom-[-8%] left-[25%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
            <div style={{ animation: 'orb1 20s ease-in-out infinite reverse' }} className="absolute top-[60%] left-[10%] w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-3xl" />
            {/* Subtle grid */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
    </>
);

// ─── Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, glow, delay, to }) => {
    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="card-glass relative h-full rounded-2xl p-6 cursor-pointer transition-all duration-300 group overflow-hidden"
            style={{ boxShadow: `0 0 0 0 ${glow}` }}
            whileHover_extra={{ boxShadow: `0 20px 60px -10px ${glow}` }}
        >
            {/* Top gradient line */}
            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            {/* Glow blob on hover */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500`} />

            <div className="flex items-start justify-between mb-5">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`} style={{ boxShadow: `0 8px 24px -4px ${glow}` }}>
                    <Icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 group-hover:text-gray-400 transition-colors">VIEW →</span>
            </div>

            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent leading-none`}>{value}</p>
            {sub && <p className="text-xs text-gray-600 mt-2">{sub}</p>}
        </motion.div>
    );
    return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
};

// ─── Action Card ──────────────────────────────────────────────────────
const ActionCard = ({ icon: Icon, label, desc, color, glow, delay, onClick, to, badge, live }) => {
    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 90 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="card-glass relative h-full rounded-2xl p-5 flex items-center gap-4 cursor-pointer group overflow-hidden transition-all duration-300"
        >
            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500`} />

            {/* LIVE badge */}
            {live && (
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-red-500/15 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    LIVE
                </span>
            )}

            <div className={`relative shrink-0 p-3.5 rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform group-hover:scale-110 duration-300`} style={{ boxShadow: `0 8px 20px -4px ${glow}` }}>
                <Icon size={22} className="text-white" />
                {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-gray-950 animate-pulse">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm group-hover:text-white transition-colors leading-snug">{label}</p>
                <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5">{desc}</p>
            </div>

            <IoArrowForwardCircle className={`shrink-0 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all duration-300`} size={22} />
        </motion.div>
    );
    return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
};

// ─── Learning Region Card ───────────────────────────────────────────────
const LearningCard = ({ icon: Icon, label, desc, color, glow, delay, to, comingSoon, newBeta }) => {
    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 90 }}
            whileHover={!comingSoon ? { y: -6, scale: 1.03 } : {}}
            className={`card-glass relative rounded-2xl p-6 flex flex-col items-start gap-4 overflow-hidden transition-all duration-300 group ${comingSoon ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                }`}
        >
            {/* top accent line */}
            <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${color} ${comingSoon ? 'opacity-30' : 'opacity-50 group-hover:opacity-100'
                } transition-opacity`} />

            {/* NEW badge */}
            {newBeta && (
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    NEW
                </span>
            )}

            {/* glow blob */}
            {!comingSoon && (
                <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-15 blur-2xl transition-all duration-500`} />
            )}

            {/* icon + badges */}
            <div className="relative">
                <div
                    className={`p-3.5 rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 ${comingSoon ? '' : 'group-hover:scale-110'}`}
                    style={{ boxShadow: comingSoon ? 'none' : `0 8px 24px -4px ${glow}` }}
                >
                    <Icon size={24} className="text-white" />
                </div>
                {comingSoon && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 border border-white/10 rounded-full flex items-center justify-center">
                        <IoLockClosedOutline size={10} className="text-gray-300" />
                    </span>
                )}
                {newBeta && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[11px] font-black border-2 border-gray-950">
                        β
                    </span>
                )}
            </div>

            {/* text */}
            <div className="flex-1">
                <p className="font-bold text-white text-base leading-snug">{label}</p>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors mt-1">{desc}</p>
            </div>

            {/* footer */}
            {comingSoon ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    Coming Soon
                </span>
            ) : (
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 group-hover:text-gray-300 transition-colors flex items-center gap-1`}>
                    Open <IoArrowForwardCircle size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                </span>
            )}
        </motion.div>
    );
    return !comingSoon && to ? <Link to={to} className="block">{inner}</Link> : inner;
};

// ─── Main Dashboard ───────────────────────────────────────────────────
const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showIDCard, setShowIDCard] = useState(false);
    const [showFeeReminder, setShowFeeReminder] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showNewspaper, setShowNewspaper] = useState(false);
    const [showExamAlerts, setShowExamAlerts] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);
    const [showQuickAttendance, setShowQuickAttendance] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();


    useEffect(() => {
        if (!loading) return; // Don't start timer if already loaded (or finished loading)

        const timer = setTimeout(() => {
            setShowQuickAttendance(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [loading]);

    useEffect(() => { fetchDashboardData(); }, []);

    useEffect(() => {
        if (dashboardData?.feeReminder?.show) setShowFeeReminder(true);
    }, [dashboardData]);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/student/dashboard');
            setDashboardData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

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

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            // Check if location is required by admin
            let isLocationRequired = true;
            try {
                const settingsRes = await api.get('/public/settings');
                if (settingsRes.data.success && settingsRes.data.settings.locationAttendance === false) {
                    isLocationRequired = false;
                }
            } catch (err) {
                console.warn('Failed to fetch public settings for location requirements');
            }

            let coords = {};
            if (isLocationRequired) {
                try {
                    coords = await getLocation();
                } catch (geoErr) {
                    setScanMessage({ type: 'error', text: geoErr.message });
                    setTimeout(() => setScanMessage(null), 6000);
                    return;
                }
            }

            const res = await api.post('/student/attendance/qr-scan', { qrToken: token, ...coords });
            if (res.data.success) {
                setScanMessage({ type: 'success', text: res.data.message });
                fetchDashboardData();
                setTimeout(() => setScanMessage(null), 5000);
            }
        } catch (e) {
            setScanMessage({ type: 'error', text: e.response?.data?.message || 'Scan failed' });
            setTimeout(() => setScanMessage(null), 6000);
        }
    };

    const handleQuickAttendance = async () => {
        try {
            // Check if location is required by admin
            let isLocationRequired = true;
            try {
                const settingsRes = await api.get('/public/settings');
                if (settingsRes.data.success && settingsRes.data.settings.locationAttendance === false) {
                    isLocationRequired = false;
                }
            } catch (err) {
                console.warn('Failed to fetch public settings for location requirements');
            }

            let coords = {};
            if (isLocationRequired) {
                try {
                    coords = await getLocation();
                } catch (geoErr) {
                    setScanMessage({ type: 'error', text: geoErr.message });
                    setTimeout(() => setScanMessage(null), 6000);
                    return;
                }
            }

            const res = await api.post('/student/attendance/mark-self', coords);
            if (res.data.success) {
                setScanMessage({ type: 'success', text: res.data.message });
                fetchDashboardData();
                setTimeout(() => setScanMessage(null), 5000);
            }
        } catch (e) {
            setScanMessage({ type: 'error', text: e.response?.data?.message || 'Attendance failed' });
            setTimeout(() => setScanMessage(null), 6000);
        }
    };

    const attPct = dashboardData?.attendance?.percentage || 0;
    const attColor = attPct >= 75 ? 'from-green-400 to-emerald-500' : attPct >= 50 ? 'from-yellow-400 to-amber-500' : 'from-red-400 to-rose-500';
    const isActive = dashboardData ? dashboardData.isActive : user?.isActive;

    const initials = (user?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (loading) {
        return (
            <div className="relative min-h-screen" style={{ background: '#050508' }}>
                <BackgroundOrbs />
                <div className="relative z-10">
                    <DashboardSkeleton />
                </div>

                {/* Network slow popup — shown during skeleton loading */}
                <AnimatePresence>
                    {showQuickAttendance && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-center"
                        >
                            <div className="p-8 rounded-2xl border border-white/10 bg-gray-900 shadow-2xl max-w-sm w-full mx-auto relative overflow-hidden">
                                <button
                                    onClick={() => setShowQuickAttendance(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    <IoCloseCircle size={24} />
                                </button>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl" />
                                <IoTimeOutline size={40} className="text-yellow-400 mx-auto mb-4 animate-pulse" />
                                <h3 className="text-xl font-bold text-white mb-2">Network is slow?</h3>
                                <p className="text-sm text-gray-400 mb-6">Open the scanner directly so you don't have to wait.</p>
                                <button
                                    onClick={() => {
                                        setShowQuickAttendance(false);
                                        setShowScanner(true);
                                    }}
                                    className="w-full py-3.5 mb-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <IoQrCode size={22} /> Open QR Scanner
                                </button>
                                <button
                                    onClick={() => setShowQuickAttendance(false)}
                                    className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    Continue to Dashboard
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Scan toast can still show during loading */}
                <AnimatePresence>
                    {scanMessage && (
                        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${scanMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                        >
                            {scanMessage.type === 'success' ? <IoCheckmarkCircle size={22} /> : <IoCloseCircle size={22} />}
                            <p className="font-semibold text-sm">{scanMessage.text}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}
            </div>
        );
    }


    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050508' }}>
            <BackgroundOrbs />

            {/* ── Modals ── */}
            <AnimatePresence>
                {showQuickAttendance && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-center"
                    >
                        <div className="p-8 rounded-2xl border border-white/10 bg-gray-900 shadow-2xl max-w-sm w-full mx-auto relative overflow-hidden">
                            <button
                                onClick={() => setShowQuickAttendance(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <IoCloseCircle size={24} />
                            </button>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-t-2xl" />
                            <IoTimeOutline size={40} className="text-yellow-400 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl font-bold text-white mb-2">Network is slow?</h3>
                            <p className="text-sm text-gray-400 mb-6">Open the scanner directly so you don't have to wait.</p>
                            <button
                                onClick={() => {
                                    setShowQuickAttendance(false);
                                    setShowScanner(true);
                                }}
                                className="w-full py-3.5 mb-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <IoQrCode size={22} /> Open QR Scanner
                            </button>
                            <button
                                onClick={() => setShowQuickAttendance(false)}
                                className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}

                {showIDCard && (
                    <IDCard
                        student={{ ...user, isActive, registrationSource: dashboardData?.registrationSource, seat: dashboardData?.seat, shift: dashboardData?.seat?.shift, seatNumber: dashboardData?.seat?.number, shiftDetails: dashboardData?.seat?.shiftDetails }}
                        onClose={() => setShowIDCard(false)}
                    />
                )}
                {showNewspaper && <NewspaperModal onClose={() => setShowNewspaper(false)} />}
                {showFeeReminder && dashboardData?.feeReminder && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-t-2xl" />
                            <div className="text-center mb-5 mt-2">
                                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                                    <IoNotificationsOutline className="text-red-400 text-2xl" />
                                </div>
                                <h3 className="text-white font-bold text-lg">Fee Reminder</h3>
                                <p className="text-gray-400 text-sm mt-1">{dashboardData.feeReminder.message}</p>
                            </div>
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl mb-5 border border-white/10">
                                <span className="text-gray-500 text-xs uppercase tracking-wider">Amount Due</span>
                                <span className="text-2xl font-black text-white">₹{dashboardData.feeReminder.amount}</span>
                            </div>
                            <button onClick={() => setShowFeeReminder(false)} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                                I Understand
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <HelpSupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
            <RequestHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />
            <ExamAlertsModal isOpen={showExamAlerts} onClose={() => setShowExamAlerts(false)} />

            {/* Scan toast */}
            <AnimatePresence>
                {scanMessage && (
                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                        className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${scanMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                    >
                        {scanMessage.type === 'success' ? <IoCheckmarkCircle size={22} /> : <IoCloseCircle size={22} />}
                        <p className="font-semibold text-sm">{scanMessage.text}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {showScanner && <AttendanceScanner onScanSuccess={handleQrScan} onClose={() => setShowScanner(false)} />}

            {/* ── Page ── */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28">

                {/* ── Hero Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-10 gap-4 flex-wrap"
                >
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0" style={{ animation: 'float 4s ease-in-out infinite' }}>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-md opacity-60 scale-110" />
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-xl border-2 border-white/20">
                                {initials}
                            </div>
                            {isActive && <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-950 shadow" />}
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-0.5">Welcome back 👋</p>
                            <h1 className="shimmer-text text-3xl sm:text-4xl font-black leading-tight">
                                {user?.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                {isActive
                                    ? <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-semibold"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Active Member</span>
                                    : <span className="inline-flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-semibold">Inactive</span>
                                }
                                <span className="text-gray-700 text-xs">•</span>
                                <span className="text-gray-500 text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-2">
                        <Link to="/student/profile">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
                            >
                                <IoPersonOutline size={16} /> Profile
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>


                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard
                        icon={IoBedOutline} label="My Seat" delay={0.1}
                        value={dashboardData?.seat?.number || 'N/A'}
                        sub={dashboardData?.seat?.shift ? `${dashboardData.seat.shift.toUpperCase()} Shift` : 'Not Assigned'}
                        color="from-blue-500 to-cyan-500" glow="rgba(59,130,246,0.4)"
                        to="/student/seat"
                    />
                    <StatCard
                        icon={IoCalendarOutline} label="Attendance" delay={0.15}
                        value={`${attPct}%`}
                        sub={`${dashboardData?.attendance?.present || 0} / ${dashboardData?.attendance?.total || 0} days`}
                        color={attColor} glow="rgba(52,211,153,0.4)"
                        to="/student/attendance"
                    />
                    <StatCard
                        icon={IoCashOutline} label="Fee Status" delay={0.2}
                        value={dashboardData?.fee ? `₹${dashboardData.fee.amount}` : '—'}
                        sub={dashboardData?.fee?.status ? dashboardData.fee.status.charAt(0).toUpperCase() + dashboardData.fee.status.slice(1) : 'No Record'}
                        color="from-amber-400 to-orange-500" glow="rgba(245,158,11,0.4)"
                        to="/student/fees"
                    />
                    <StatCard
                        icon={IoNotificationsOutline} label="Notifications" delay={0.25}
                        value={dashboardData?.unreadNotifications || 0}
                        sub="Unread messages"
                        color="from-pink-500 to-rose-500" glow="rgba(236,72,153,0.4)"
                        to="/student/notifications"
                    />
                </div>

                {/* ── Quick Actions ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="card-glass rounded-2xl p-6 mb-8"
                >
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/30">
                            <IoFlashOutline size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-none">Quick Actions</h2>
                            <p className="text-gray-600 text-xs mt-0.5">Everything you need, one tap away</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <ActionCard icon={IoScan} label="Mark Attendance" desc="Scan QR to mark entry/exit" color="from-green-500 to-teal-500" glow="rgba(16,185,129,0.4)" delay={0.05} onClick={() => setShowScanner(true)} />
                        <ActionCard icon={IoIdCardOutline} label="Virtual ID Card" desc="View & download your card" color="from-indigo-500 to-purple-500" glow="rgba(99,102,241,0.4)" delay={0.1} onClick={() => setShowIDCard(true)} />
                        <ActionCard icon={IoChatbubblesOutline} label="Discussion Room" desc="Chat with fellow students" color="from-orange-500 to-red-500" glow="rgba(249,115,22,0.4)" delay={0.15} to="/student/chat" />
                        <ActionCard icon={IoNewspaper} label="Daily Newspaper" desc="Hindi & English papers" color="from-purple-500 to-violet-600" glow="rgba(168,85,247,0.4)" delay={0.2} onClick={() => setShowNewspaper(true)} />
                        <ActionCard icon={IoBookOutline} label="Study Planner" desc="Plan your day effectively" color="from-pink-500 to-rose-500" glow="rgba(236,72,153,0.4)" delay={0.25} to="/student/planner" />
                        <ActionCard icon={IoBedOutline} label="View Seat on Map" desc="See exactly where you sit" color="from-cyan-500 to-blue-500" glow="rgba(6,182,212,0.4)" delay={0.3} to="/student/seat" />
                        <ActionCard icon={IoHelpCircleOutline} label="Help & Support" desc="Report issues or get help" color="from-yellow-500 to-amber-500" glow="rgba(234,179,8,0.4)" delay={0.35} onClick={() => setShowSupportModal(true)}
                            badge={dashboardData?.requestsCount || 0}
                        />
                        <ActionCard icon={IoAlertCircleOutline} label="Exam Alerts" desc="UPSC · SSC · IBPS · NTA live" color="from-orange-500 to-amber-400" glow="rgba(249,115,22,0.4)" delay={0.4} onClick={() => setShowExamAlerts(true)} live />
                    </div>
                </motion.div>

                {/* ── Learning Region ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                    className="card-glass rounded-2xl p-6 mb-8"
                >
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                            <IoLibraryOutline size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-none">Learning Region</h2>
                            <p className="text-gray-600 text-xs mt-0.5">Study smarter with powerful tools</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <LearningCard
                            icon={IoBookOutline}
                            label="Books"
                            desc="Access curated study books"
                            color="from-blue-500 to-cyan-500"
                            glow="rgba(59,130,246,0.45)"
                            delay={0.1}
                            to="/student/books"
                        />
                        <LearningCard
                            icon={IoDocumentTextOutline}
                            label="Notes"
                            desc="Browse & download notes"
                            color="from-violet-500 to-purple-600"
                            glow="rgba(139,92,246,0.45)"
                            delay={0.16}
                            to="/student/notes"
                        />
                        <LearningCard
                            icon={IoSparklesOutline}
                            label="AI Mock Test"
                            desc="AI-powered practice tests"
                            color="from-amber-400 to-orange-500"
                            glow="rgba(245,158,11,0.45)"
                            delay={0.22}
                            to="/student/mock-test"
                            newBeta
                        />
                    </div>
                </motion.div>

                {/* ── LMS Guide ── */}
                <LmsGuideSection />

                <Footer />
            </div>

            {/* ── Floating scan button ── */}
            <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setShowScanner(true)}
                className="fixed bottom-8 right-8 z-50 w-16 h-16 flex items-center justify-center rounded-full text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' }}
            >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-green-500 opacity-40" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                <IoScan size={28} />
            </motion.button>
        </div>
    );
};

export default StudentDashboard;
