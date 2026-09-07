import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    IoCalendarOutline, IoCashOutline, IoBedOutline,
    IoNotificationsOutline, IoLogOut, IoScanOutline, IoTimeOutline, IoKey,
    IoPersonOutline, IoBarChartOutline, IoChatbubblesOutline,
    IoShieldCheckmarkOutline, IoDocumentTextOutline, IoArrowForward, IoPower, IoLocationOutline,
    IoGridOutline, IoSearchOutline, IoKeypadOutline, IoSettingsOutline, IoQrCodeOutline, IoRefreshOutline,
    IoTrophy, IoCheckmarkCircleOutline, IoWalletOutline, IoClose, IoChevronDown, IoChevronForward,
    IoSend, IoMic, IoMicOff, IoCopyOutline, IoCheckmark, IoMegaphoneOutline, IoWarningOutline,
    IoTrendingUp, IoTrendingDown, IoBusinessOutline, IoMenuOutline,
    IoTerminalOutline, IoStatsChartOutline, IoRibbonOutline, IoHardwareChipOutline, IoPulseOutline,
    IoAnalyticsOutline
} from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';
import QRScannerModal from '../../components/admin/QRScannerModal';
import StructuredAIResponse from '../../components/admin/StructuredAIResponse';

/* ── Enterprise Styling & Animation ─────────────────────── */
const DASHBOARD_STYLES = `
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 999px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
.glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px); border: 1px solid rgba(226, 232, 240, 0.8); }
.glass-card { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04); }
.glass-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08); }
.metric-card-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.metric-card-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 20px -4px rgba(0,0,0,0.08); }
`;

/* ── Toggle Switch Component ───────────────────────────── */
const SettingsToggle = ({ checked, onClick, activeColor = 'bg-orange-500', shadow = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${checked ? activeColor : 'bg-gray-200'}`}
        style={{
            width: 42,
            height: 22,
            minWidth: 42,
            maxWidth: 42,
            border: 'none',
            padding: 0,
            outline: 'none',
            boxShadow: checked && shadow ? shadow : 'none'
        }}
    >
        <span
            style={{
                position: 'absolute',
                top: 2,
                left: 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transform: checked ? 'translateX(20px)' : 'translateX(0px)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'block'
            }}
        />
    </button>
);

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 100% REAL Database Data States
    const [liveData, setLiveData] = useState({
        metrics: {
            totalStudents: 0,
            activeStudents: 0,
            totalSeats: 0,
            occupiedSeats: 0,
            vacantSeats: 0,
            occupancyRate: 0,
            todayAttendance: 0,
            currentlyCheckedIn: 0,
            feesCollected: 0,
            todayFeesCollected: 0,
            pendingFeesCount: 0,
            pendingFeesAmount: 0,
            pendingRequests: 0,
            shifts: []
        },
        attendanceTrends: [],
        shiftDistribution: [],
        floorOccupancy: [],
        recentTransactions: [],
        pendingFeesList: [],
        announcements: [],
        monthlyGrowth: []
    });

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ activeModes: { default: true, custom: false } });

    // UI States
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState('Main Campus (Sitamarhi)');

    // Settings PIN states
    const [pinInput, setPinInput] = useState('');
    const [pinSaving, setPinSaving] = useState(false);
    const [pinMsg, setPinMsg] = useState('');
    const settingsRef = useRef(null);

    // AI Assistant States
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAnswer, setAiAnswer] = useState(null);
    const [aiCopied, setAiCopied] = useState(false);
    const [aiHistory, setAiHistory] = useState([]);
    const [modalAiQuestion, setModalAiQuestion] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchRealDashboardData();
        fetchSettings();

        // Keyboard Shortcut: Ctrl + K for Command Palette
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchRealDashboardData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/dashboard/live');
            if (res.data?.success) {
                setLiveData({
                    metrics: res.data.metrics || {},
                    attendanceTrends: res.data.attendanceTrends || [],
                    shiftDistribution: res.data.shiftDistribution || [],
                    floorOccupancy: res.data.floorOccupancy || [],
                    recentTransactions: res.data.recentTransactions || [],
                    pendingFeesList: res.data.pendingFeesList || [],
                    announcements: res.data.announcements || [],
                    monthlyGrowth: res.data.monthlyGrowth || []
                });
            }
        } catch (e) {
            console.error('Error fetching real dashboard data:', e);
            // Fallback to standard dashboard if /live is unreachable
            try {
                const stdRes = await api.get('/admin/dashboard');
                if (stdRes.data?.data) {
                    setLiveData(prev => ({
                        ...prev,
                        metrics: { ...prev.metrics, ...stdRes.data.data }
                    }));
                }
            } catch (err) {
                console.error('Fallback failed:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.settings) setSettings(res.data.settings);
        } catch (e) {
            console.error('Error fetching settings:', e);
        }
    };

    /* ── Settings Handlers (Fully Functional) ─────────────── */
    const handleToggleSystemStatus = async () => {
        try {
            const isCurrentlyActive = settings?.systemStatus !== 'maintenance';
            const newStatus = isCurrentlyActive ? 'maintenance' : 'active';
            const res = await api.put('/admin/settings', { systemStatus: newStatus });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleToggleLocation = async () => {
        try {
            const current = settings?.locationAttendance !== undefined ? settings.locationAttendance : true;
            const res = await api.put('/admin/settings', { locationAttendance: !current });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleTogglePinAttendance = async () => {
        try {
            const newVal = !settings?.pinAttendanceEnabled;
            const res = await api.put('/admin/settings', { pinAttendanceEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleSavePin = async () => {
        const trimmed = pinInput.trim();
        if (!trimmed || trimmed.length < 4) { setPinMsg('PIN must be at least 4 digits'); return; }
        if (!/^\d+$/.test(trimmed)) { setPinMsg('Digits only'); return; }
        setPinSaving(true);
        try {
            const res = await api.put('/admin/settings', { attendancePin: trimmed });
            if (res.data.settings) setSettings(res.data.settings);
            setPinMsg(`Saved PIN ${trimmed}`);
            setTimeout(() => { setPinMsg(''); setPinInput(''); }, 2000);
        } catch (e) {
            setPinMsg('Failed to save PIN');
        } finally {
            setPinSaving(false);
        }
    };

    const handleToggleTimeRestriction = async () => {
        try {
            const newVal = !(settings?.timeRestrictionEnabled !== false);
            const res = await api.put('/admin/settings', { timeRestrictionEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleToggleLoginAttendance = async () => {
        try {
            const newVal = !settings?.loginAttendanceEnabled;
            const res = await api.put('/admin/settings', { loginAttendanceEnabled: newVal });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleToggleReferral = async () => {
        try {
            const current = settings?.referral?.enabled ?? false;
            const res = await api.put('/admin/settings', { referral: { enabled: !current } });
            if (res.data.settings) setSettings(res.data.settings);
            else await fetchSettings();
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleToggleForceDoubtBoard = async () => {
        const newVal = !settings?.forceDoubtBoard;
        setSettings(prev => ({ ...prev, forceDoubtBoard: newVal }));
        try {
            const res = await api.put('/admin/settings', { forceDoubtBoard: newVal });
            if (res.data.settings) setSettings(res.data.settings);
        } catch (e) {
            console.error(e);
            await fetchSettings();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    /* ── AI Assistant Query Handlers ───────────────────────── */
    const handleAskAI = async (queryText) => {
        const prompt = queryText || aiQuestion;
        if (!prompt || !prompt.trim() || aiLoading) return;

        setAiLoading(true);
        setAiQuestion(prompt);
        try {
            const res = await api.post('/admin/ai/ask', {
                question: prompt.trim(),
                history: aiHistory
            });

            if (res.data.success && res.data.answer) {
                setAiAnswer(res.data.answer);
                setAiHistory(prev => [
                    ...prev.slice(-6),
                    { role: 'user', content: prompt.trim() },
                    { role: 'assistant', content: res.data.answer }
                ]);
            } else {
                setAiAnswer("Unable to generate response at this time. Please try again.");
            }
        } catch (err) {
            console.error('AI Query failed:', err);
            setAiAnswer("### Operational Snapshot (Database Live)\n- **Registered Students**: " + (liveData.metrics.totalStudents || 0) + "\n- **Occupied Seats**: " + (liveData.metrics.occupiedSeats || 0) + " / " + (liveData.metrics.totalSeats || 0) + "\n- **Today's Attendance**: " + (liveData.metrics.todayAttendance || 0) + " check-ins\n- **Total Collections**: ₹" + ((liveData.metrics.feesCollected || 0).toLocaleString('en-IN')));
        } finally {
            setAiLoading(false);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) return;

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-IN';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                setAiQuestion(transcript);
                handleAskAI(transcript);
            };

            recognition.start();
        } catch (e) {
            setIsListening(false);
        }
    };

    const copyAIText = () => {
        if (!aiAnswer) return;
        navigator.clipboard.writeText(aiAnswer);
        setAiCopied(true);
        setTimeout(() => setAiCopied(false), 2000);
    };

    /* ── Real Metrics from Database ────────────────────────── */
    const { metrics, attendanceTrends, shiftDistribution, floorOccupancy, recentTransactions, announcements, monthlyGrowth } = liveData;

    const METRIC_CARDS = [
        {
            title: 'Total Seats',
            value: (metrics.totalSeats || 0).toLocaleString(),
            sub: `${metrics.occupiedSeats || 0} Occupied · ${metrics.vacantSeats || 0} Vacant`,
            icon: IoBedOutline,
            accentBg: '#eff6ff',
            accentColor: '#2563eb',
            borderColor: '#bfdbfe'
        },
        {
            title: 'Active Students',
            value: (metrics.activeStudents || 0).toLocaleString(),
            sub: `Out of ${metrics.totalStudents || 0} registered`,
            icon: IoPersonOutline,
            accentBg: '#f0fdf4',
            accentColor: '#16a34a',
            borderColor: '#bbf7d0'
        },
        {
            title: 'Today Check-ins',
            value: (metrics.todayAttendance || 0).toLocaleString(),
            sub: `${metrics.currentlyCheckedIn || 0} currently present`,
            icon: IoRefreshOutline,
            accentBg: '#ecfeff',
            accentColor: '#0891b2',
            borderColor: '#a5f3fc'
        },
        {
            title: 'Available Desks',
            value: (metrics.vacantSeats || 0).toLocaleString(),
            sub: `${metrics.occupancyRate || 0}% overall capacity`,
            icon: IoGridOutline,
            accentBg: '#f0fdfa',
            accentColor: '#0d9488',
            borderColor: '#99f6e4'
        },
        {
            title: 'Pending Requests',
            value: (metrics.pendingRequests || 0).toLocaleString(),
            sub: `${metrics.pendingFeesCount || 0} fee dues pending`,
            icon: IoTimeOutline,
            accentBg: '#fef2f2',
            accentColor: '#dc2626',
            borderColor: '#fecaca'
        },
        {
            title: 'Total Collected',
            value: `₹${(metrics.feesCollected || 0).toLocaleString('en-IN')}`,
            sub: `₹${(metrics.todayFeesCollected || 0).toLocaleString('en-IN')} collected today`,
            icon: IoCashOutline,
            accentBg: '#faf5ff',
            accentColor: '#9333ea',
            borderColor: '#e9d5ff'
        },
    ];

    /* ── Quick Action Buttons (Real routes) ─────────────────── */
    const QUICK_ACTIONS = [
        { label: 'Student Directory', sub: 'Roster & Profile', path: '/admin/students', icon: IoPersonOutline, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Floor Matrix', sub: 'Seat Allocations', path: '/admin/floors', icon: IoBedOutline, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Mark Attendance', sub: 'Daily Log Entry', path: '/admin/attendance', icon: IoCalendarOutline, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Collect Fees', sub: 'Ledger & Dues', path: '/admin/fees', icon: IoCashOutline, color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Shift Timings', sub: 'Manage Shifts', action: () => setShowShiftModal(true), icon: IoTimeOutline, color: '#06b6d4', bg: '#ecfeff' },
        { label: 'Launch QR Kiosk', sub: 'Entry Gate Kiosk', path: '/admin/kiosk', icon: IoScanOutline, color: '#ec4899', bg: '#fdf2f8' },
        { label: 'Broadcast Alert', sub: 'Send Notice', path: '/admin/notifications', icon: IoMegaphoneOutline, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Vacant Seats', sub: 'Available Desks', path: '/admin/vacant-seats', icon: IoSearchOutline, color: '#14b8a6', bg: '#f0fdfa' },
    ];

    /* ── Real Attendance Trend Points Calculation ──────────── */
    const maxAttendanceCount = Math.max(1, ...attendanceTrends.map(t => t.count || 0));
    const trendPoints = attendanceTrends.map((t, idx) => {
        const x = attendanceTrends.length > 1 ? (idx / (attendanceTrends.length - 1)) * 360 + 20 : 200;
        const y = 140 - ((t.count || 0) / maxAttendanceCount) * 100;
        return { x, y, count: t.count, day: t.day, date: t.date };
    });

    const trendPath = trendPoints.length > 0
        ? `M ${trendPoints[0].x} ${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : 'M 20 140 L 380 140';

    /* ── Real Donut Calculation ────────────────────────────── */
    const totalDesksReal = metrics.totalSeats || 0;
    const occupiedDesksReal = metrics.occupiedSeats || 0;
    const vacantDesksReal = metrics.vacantSeats || 0;
    const occupiedCirc = totalDesksReal > 0 ? (occupiedDesksReal / totalDesksReal) * 239 : 0;
    const vacantCirc = totalDesksReal > 0 ? (vacantDesksReal / totalDesksReal) * 239 : 0;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9] text-[#0f172a] font-sans antialiased">
            <style>{DASHBOARD_STYLES}</style>

            {/* Modals */}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
            {showShiftModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button onClick={() => setShowShiftModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-lg">
                            <IoClose size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Shift Timings & Management</h2>
                        <ShiftManager allowDelete={false} />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                MOBILE NAVIGATION DRAWER (< lg screens)
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-[#0b1329] text-slate-300 flex flex-col z-50 lg:hidden border-r border-slate-800 shadow-2xl"
                        >
                            {/* Brand Header with Close */}
                            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#080e1f] shrink-0">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/app-icon-192.png"
                                        alt="Apna Lakshay"
                                        className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0"
                                    />
                                    <div>
                                        <h1 className="font-bold text-white text-[15px] leading-tight tracking-tight">Apna Lakshay</h1>
                                        <p className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">Enterprise Suite</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {/* Mobile Nav Links */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
                                <div className="space-y-1">
                                    <Link
                                        to="/admin"
                                        onClick={() => setMobileSidebarOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/25"
                                    >
                                        <IoGridOutline size={18} className="shrink-0" />
                                        <span>Dashboard</span>
                                    </Link>
                                </div>

                                <div className="space-y-1">
                                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        LIBRARY OPERATIONS
                                    </p>
                                    {[
                                        { title: 'Student Directory', path: '/admin/students', icon: IoPersonOutline },
                                        { title: 'Floor & Seat Matrix', path: '/admin/floors', icon: IoBedOutline },
                                        { title: 'Shift Operations', path: '/admin/shifts', icon: IoTimeOutline },
                                        { title: 'Attendance Tracking', path: '/admin/attendance', icon: IoCalendarOutline },
                                        { title: 'Fee Management', path: '/admin/fees', icon: IoCashOutline },
                                        { title: 'Discussion Rooms', path: '/admin/chat', icon: IoChatbubblesOutline },
                                        { title: 'QR Entry Kiosk', path: '/admin/kiosk', icon: IoScanOutline },
                                        { title: 'Vacant Seats', path: '/admin/vacant-seats', icon: IoSearchOutline },
                                    ].map((item, i) => (
                                        <Link
                                            key={i}
                                            to={item.path}
                                            onClick={() => setMobileSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-xs font-medium group"
                                        >
                                            <item.icon size={17} className="shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                            <span>{item.title}</span>
                                        </Link>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        GOVERNANCE & SECURITY
                                    </p>
                                    {[
                                        { title: 'Sub-Admins & Roles', path: '/admin/subadmins', icon: IoShieldCheckmarkOutline },
                                        { title: 'Student ID Cards', path: '/admin/cards', icon: IoKey },
                                        { title: 'System Activity Logs', path: '/admin/logs', icon: IoDocumentTextOutline },
                                        { title: 'Analytics Dashboard', path: '/admin/analytics', icon: IoBarChartOutline },
                                        { title: 'Notice & Alerts', path: '/admin/notifications', icon: IoNotificationsOutline },
                                        { title: 'Student Requests', path: '/admin/requests', icon: IoDocumentTextOutline },
                                        { title: 'Referrals & Rewards', path: '/admin/referrals', icon: IoWalletOutline },
                                        { title: 'System Settings', path: '/admin/settings', icon: IoSettingsOutline },
                                    ].map((item, i) => (
                                        <Link
                                            key={i}
                                            to={item.path}
                                            onClick={() => setMobileSidebarOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-xs font-medium group"
                                        >
                                            <item.icon size={17} className="shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                            <span>{item.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Drawer Bottom: Logout & AI */}
                            <div className="p-3 border-t border-slate-800 bg-[#080e1f] space-y-2 shrink-0">
                                <button
                                    onClick={() => {
                                        setMobileSidebarOpen(false);
                                        setShowAIModal(true);
                                    }}
                                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <IoTerminalOutline size={14} />
                                    <span>Executive Operations Console</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setMobileSidebarOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                                >
                                    <IoLogOut size={17} />
                                    <span>Sign Out of Dashboard</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════
                ENTERPRISE DESKTOP SIDEBAR (hidden on mobile < lg)
            ══════════════════════════════════════════════════════════ */}
            <aside
                className={`hidden lg:flex bg-[#0b1329] text-slate-300 flex-col transition-all duration-300 z-30 shrink-0 select-none border-r border-slate-800 ${
                    sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
                }`}
            >
                {/* Brand Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-[#080e1f]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img
                            src="/app-icon-192.png"
                            alt="Apna Lakshay"
                            className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0"
                        />
                        {!sidebarCollapsed && (
                            <div className="truncate">
                                <h1 className="font-bold text-white text-[15px] leading-tight tracking-tight">Apna Lakshay</h1>
                                <p className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">Enterprise Suite</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarCollapsed(p => !p)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        <IoChevronForward className={`transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} size={16} />
                    </button>
                </div>

                {/* Navigation Items (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
                    {/* Primary Dashboard Link */}
                    <div className="space-y-1">
                        <Link
                            to="/admin"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/25"
                        >
                            <IoGridOutline size={18} className="shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">Dashboard</span>}
                        </Link>
                    </div>

                    {/* LIBRARY OPERATIONS */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                LIBRARY OPERATIONS
                            </p>
                        )}
                        {[
                            { title: 'Student Directory', path: '/admin/students', icon: IoPersonOutline },
                            { title: 'Floor & Seat Matrix', path: '/admin/floors', icon: IoBedOutline },
                            { title: 'Shift Operations', path: '/admin/shifts', icon: IoTimeOutline },
                            { title: 'Attendance Tracking', path: '/admin/attendance', icon: IoCalendarOutline },
                            { title: 'Fee Management', path: '/admin/fees', icon: IoCashOutline },
                            { title: 'Discussion Rooms', path: '/admin/chat', icon: IoChatbubblesOutline },
                            { title: 'QR Entry Kiosk', path: '/admin/kiosk', icon: IoScanOutline },
                            { title: 'Vacant Seats', path: '/admin/vacant-seats', icon: IoSearchOutline },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-xs font-medium group"
                                title={sidebarCollapsed ? item.title : ''}
                            >
                                <item.icon size={17} className="shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                            </Link>
                        ))}
                    </div>

                    {/* ANALYTICS & INSIGHTS */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                ANALYTICS & INSIGHTS
                            </p>
                        )}
                        {[
                            { title: 'Reports & Analytics', path: '/admin/analytics', icon: IoBarChartOutline },
                            { title: 'Student Activities & XP', path: '/admin/activities', icon: IoRibbonOutline },
                            { title: 'AI Study Logs', path: '/admin/ai-activity', icon: IoTrophy },
                            { title: 'Referral & Wallet', path: '/admin/referral-wallet', icon: IoWalletOutline },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-xs font-medium group"
                                title={sidebarCollapsed ? item.title : ''}
                            >
                                <item.icon size={17} className="shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                            </Link>
                        ))}
                    </div>

                    {/* ADMINISTRATION */}
                    <div className="space-y-1">
                        {!sidebarCollapsed && (
                            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                ADMINISTRATION
                            </p>
                        )}
                        {[
                            { title: 'Sub-Admin Roles', path: '/admin/sub-admins', icon: IoShieldCheckmarkOutline },
                            { title: 'Student Requests', path: '/admin/requests', icon: IoDocumentTextOutline },
                            { title: 'Action History Logs', path: '/admin/history', icon: IoTimeOutline },
                            { title: 'Password Activity', path: '/admin/password-activity', icon: IoKey },
                            { title: 'Manage Cards & Layout', path: '/admin/manage-cards', icon: IoGridOutline },
                        ].map((item, i) => (
                            <Link
                                key={i}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-xs font-medium group"
                                title={sidebarCollapsed ? item.title : ''}
                            >
                                <item.icon size={17} className="shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors" />
                                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Bottom Executive Intelligence Card */}
                {!sidebarCollapsed ? (
                    <div className="p-3 border-t border-slate-800 bg-[#080e1f]">
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#080e1f] border border-slate-800 shadow-inner">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded-lg bg-orange-500/10 text-orange-400">
                                    <IoTerminalOutline size={14} />
                                </div>
                                <span className="text-xs font-bold text-white tracking-wide">Campus Intelligence</span>
                                <span className="text-[9px] bg-slate-800 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-slate-700">LIVE</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug mb-3">Live database queries & telemetry</p>
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="w-full py-1.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoAnalyticsOutline size={13} />
                                Open Command Console
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 border-t border-slate-800 flex flex-col items-center bg-[#080e1f]">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 transition-colors cursor-pointer"
                            title="Open Command Console"
                        >
                            <IoTerminalOutline size={18} />
                        </button>
                    </div>
                )}
            </aside>

            {/* ══════════════════════════════════════════════════════════
                MAIN CONTENT AREA
            ══════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

                {/* ── Top Bar (Global Header) ────────────────────────── */}
                <header className="h-16 px-3 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-4 z-20 shrink-0 shadow-sm">
                    {/* Left: Mobile Menu Trigger & Global Search */}
                    <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
                            title="Open Navigation Menu"
                        >
                            <IoMenuOutline size={20} />
                        </button>

                        <div
                            onClick={() => setShowCommandPalette(true)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 cursor-pointer transition-all shadow-inner min-w-0"
                        >
                            <div className="flex items-center gap-2 min-w-0 truncate">
                                <IoSearchOutline size={16} className="text-slate-400 shrink-0" />
                                <span className="truncate">Search students, seats, transactions, settings...</span>
                            </div>
                            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded border border-slate-200 shadow-sm shrink-0 ml-1">
                                Ctrl + K
                            </kbd>
                        </div>
                    </div>

                    {/* Right: Quick Controls, Settings, Campus & Profile */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* Campus Selector */}
                        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                            <IoBusinessOutline size={15} className="text-amber-500" />
                            <span>{selectedCampus}</span>
                        </div>

                        {/* System Online Status Pill */}
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>System Online</span>
                        </div>

                        {/* ── Settings Dropdown Button (Fully Preserved) ── */}
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => { setShowSettingsDropdown(p => !p); setPinMsg(''); }}
                                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors relative"
                                title="System Settings & Attendance Controls"
                            >
                                <IoSettingsOutline size={19} className={showSettingsDropdown ? 'rotate-90 transition-transform duration-300' : 'transition-transform duration-300'} />
                                {(settings?.pinAttendanceEnabled || settings?.activeModes?.custom || settings?.locationAttendance === false) && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showSettingsDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowSettingsDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 z-40 w-96 max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden bg-white border border-slate-200"
                                        >
                                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Enterprise System Controls</p>
                                                <button onClick={() => setShowSettingsDropdown(false)} className="text-slate-400 hover:text-slate-600">
                                                    <IoClose size={18} />
                                                </button>
                                            </div>

                                            <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                                {/* System Status */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.systemStatus !== 'maintenance' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                            <IoPower size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">System Status</p>
                                                            <p className="text-xs text-slate-500">{settings?.systemStatus !== 'maintenance' ? 'System is active' : 'Maintenance Mode'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={settings?.systemStatus !== 'maintenance'} onClick={handleToggleSystemStatus} activeColor="bg-emerald-500" />
                                                </div>

                                                {/* Location Attendance */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.locationAttendance !== false ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IoLocationOutline size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">Location Verification</p>
                                                            <p className="text-xs text-slate-500">{settings?.locationAttendance !== false ? 'Enforce campus geofence' : 'Disabled geofence'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={settings?.locationAttendance !== false} onClick={handleToggleLocation} activeColor="bg-orange-500" />
                                                </div>

                                                {/* PIN Attendance */}
                                                <div className="px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${settings?.pinAttendanceEnabled ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                <IoKeypadOutline size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">PIN Attendance</p>
                                                                <p className="text-xs text-slate-500">{settings?.pinAttendanceEnabled ? `Active · PIN: ${settings?.attendancePin || 'not set'}` : 'Off (Camera required)'}</p>
                                                            </div>
                                                        </div>
                                                        <SettingsToggle checked={!!settings?.pinAttendanceEnabled} onClick={handleTogglePinAttendance} activeColor="bg-amber-500" />
                                                    </div>
                                                    {settings?.pinAttendanceEnabled && (
                                                        <div className="mt-2.5 flex gap-2">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={pinInput}
                                                                onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                                onKeyDown={e => e.key === 'Enter' && handleSavePin()}
                                                                placeholder="New PIN (4–8 digits)"
                                                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-amber-500"
                                                            />
                                                            <button
                                                                onClick={handleSavePin}
                                                                disabled={pinSaving}
                                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                {pinSaving ? '…' : 'Set'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {pinMsg && <p className={`text-xs mt-1.5 ${pinMsg.startsWith('Saved') ? 'text-emerald-600' : 'text-rose-600'}`}>{pinMsg}</p>}
                                                </div>

                                                {/* Time Restriction */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.timeRestrictionEnabled !== false ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IoTimeOutline size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">Shift Time Lock</p>
                                                            <p className="text-xs text-slate-500">{settings?.timeRestrictionEnabled !== false ? 'Strict shift hours only' : 'Flexible entry'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={settings?.timeRestrictionEnabled !== false} onClick={handleToggleTimeRestriction} activeColor="bg-purple-500" />
                                                </div>

                                                {/* Login Attendance */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.loginAttendanceEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IoQrCodeOutline size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">Login Attendance</p>
                                                            <p className="text-xs text-slate-500">{settings?.loginAttendanceEnabled ? 'Quick button on login screen' : 'Hidden on login'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={!!settings?.loginAttendanceEnabled} onClick={handleToggleLoginAttendance} activeColor="bg-emerald-500" />
                                                </div>

                                                {/* Referral System */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.referral?.enabled ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IoWalletOutline size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">Referral Program</p>
                                                            <p className="text-xs text-slate-500">{settings?.referral?.enabled ? 'Student rewards active' : 'Disabled'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={!!settings?.referral?.enabled} onClick={handleToggleReferral} activeColor="bg-violet-500" />
                                                </div>

                                                {/* Force AI Doubt Board */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-orange-50/60">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${settings?.forceDoubtBoard ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <IoHardwareChipOutline size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">Auto-Doubt Board</p>
                                                            <p className="text-xs text-slate-500">{settings?.forceDoubtBoard ? 'Auto launch after attendance' : 'Manual launch'}</p>
                                                        </div>
                                                    </div>
                                                    <SettingsToggle checked={!!settings?.forceDoubtBoard} onClick={handleToggleForceDoubtBoard} activeColor="bg-orange-500" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications Bell */}
                        <Link
                            to="/admin/notifications"
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors relative"
                            title="Announcements & Notifications"
                        >
                            <IoNotificationsOutline size={19} />
                            {announcements.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                    {announcements.length}
                                </span>
                            )}
                        </Link>

                        {/* Scan ID button */}
                        <button
                            onClick={() => setShowScanner(true)}
                            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shrink-0"
                            title="Scan Student QR ID"
                        >
                            <IoScanOutline size={16} />
                            <span>Scan ID</span>
                        </button>

                        {/* Admin Profile & ALWAYS-VISIBLE Logout Button */}
                        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow shrink-0">
                                {user?.name ? user.name[0].toUpperCase() : 'A'}
                            </div>
                            <div className="hidden xl:block text-left">
                                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[100px]">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-slate-500 leading-tight">Super Admin</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200/90 rounded-xl transition-all font-bold text-xs shadow-2xs shrink-0 cursor-pointer"
                                title="Sign Out"
                            >
                                <IoLogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable Dashboard Workspace ─────────────────── */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6">

                    {/* ══════════════════════════════════════════════════════
                        HERO GREETING BANNER
                    ══════════════════════════════════════════════════════ */}
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/30 text-white p-7 shadow-lg border border-slate-800">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold mb-3 border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    <span>Live Campus Monitoring</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                    Good morning, {user?.name ? user.name.split(' ')[0] : 'Administrator'}!
                                </h2>
                                <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
                                    Real-time status across your campus, study shifts, and library network today.
                                </p>
                            </div>
                            <div className="hidden xl:block max-w-sm text-right bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                <p className="text-xs italic text-slate-300 leading-relaxed">
                                    "Libraries are the foundation of a more educated, enlightened and empowered world."
                                </p>
                                <p className="text-[11px] font-bold text-amber-400 mt-1">— Bill Gates</p>
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 1: REAL EXECUTIVE KPI METRICS (6 Cards)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {METRIC_CARDS.map((card, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="glass-card metric-card-hover rounded-2xl p-4 flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                        style={{ background: card.accentBg, color: card.accentColor, border: `1px solid ${card.borderColor}` }}
                                    >
                                        <card.icon size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                        Live
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.title}</p>
                                    <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{card.value}</p>
                                    <p className="text-[11px] text-slate-400 mt-1 truncate">{card.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 2: VISUAL ANALYTICS & DISTRIBUTION (3 Columns)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Column 1: Attendance Trends (Real 7-Day Line Chart from MongoDB) */}
                        <div className="lg:col-span-5 glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Attendance Trends</h3>
                                    <p className="text-xs text-slate-500">Real check-ins over the last 7 calendar days</p>
                                </div>
                                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                                    {metrics.todayAttendance || 0} check-ins today
                                </span>
                            </div>

                            {/* SVG Multi-Line Chart Canvas */}
                            <div className="h-52 w-full relative pt-2">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                                    <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="70" x2="400" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="110" x2="400" y2="110" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="150" x2="400" y2="150" stroke="#e2e8f0" strokeWidth="1" />

                                    {/* Real Data Polyline */}
                                    <path
                                        d={trendPath}
                                        fill="none"
                                        stroke="#f97316"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Data Points */}
                                    {trendPoints.map((pt, pIdx) => (
                                        <g key={pIdx}>
                                            <circle cx={pt.x} cy={pt.y} r="4" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                                            {pt.count > 0 && (
                                                <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e293b">
                                                    {pt.count}
                                                </text>
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-2">
                                {trendPoints.map((pt, pIdx) => (
                                    <span key={pIdx}>{pt.day}</span>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Seat & Shift Allocation (Donut Chart) */}
                        <div className="lg:col-span-4 glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Seat Allocation</h3>
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Live Desks</span>
                            </div>

                            <div className="flex items-center justify-center my-3 relative">
                                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                                    {/* Occupied Segment */}
                                    <circle
                                        cx="50" cy="50" r="38" fill="transparent" stroke="#f97316" strokeWidth="12"
                                        strokeDasharray={`${occupiedCirc} 239`} strokeDashoffset="0"
                                    />
                                    {/* Vacant Segment */}
                                    <circle
                                        cx="50" cy="50" r="38" fill="transparent" stroke="#cbd5e1" strokeWidth="12"
                                        strokeDasharray={`${vacantCirc} 239`} strokeDashoffset={-occupiedCirc}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-xl font-black text-slate-900">{totalDesksReal}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Desks</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-orange-500" /> Occupied
                                    </span>
                                    <span className="font-bold text-slate-900">{occupiedDesksReal}</span>
                                </div>
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" /> Vacant
                                    </span>
                                    <span className="font-bold text-slate-900">{vacantDesksReal}</span>
                                </div>
                                {shiftDistribution.slice(0, 2).map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                                        <span className="flex items-center gap-1.5 text-slate-600 font-medium truncate max-w-[90px]">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {s._id}
                                        </span>
                                        <span className="font-bold text-slate-900">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Real Floor Occupancy Matrix from MongoDB */}
                        <div className="lg:col-span-3 glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900 text-sm">Floor Occupancy</h3>
                                <Link to="/admin/floors" className="text-xs font-bold text-orange-600 hover:underline">Manage</Link>
                            </div>

                            <div className="space-y-3.5 my-auto">
                                {floorOccupancy.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        <p>No floors configured yet.</p>
                                        <Link to="/admin/floors" className="text-orange-600 font-bold hover:underline mt-1 block">
                                            + Configure Floors
                                        </Link>
                                    </div>
                                ) : (
                                    floorOccupancy.map((fl, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-slate-800">{fl.name}</span>
                                                <span className="text-slate-900">{fl.occupiedSeats}/{fl.totalSeats} ({fl.percentage}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${fl.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>Configured Floors</span>
                                <span className="font-bold text-slate-900">{floorOccupancy.length} Floors Active</span>
                            </div>
                        </div>

                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 3: OPERATIONAL QUICK ACTIONS
                    ══════════════════════════════════════════════════════ */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Quick Actions</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {QUICK_ACTIONS.map((act, i) => {
                                const content = (
                                    <div className="glass-card p-3 rounded-2xl flex flex-col items-center text-center group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-sm transition-transform group-hover:scale-110"
                                            style={{ background: act.bg, color: act.color }}
                                        >
                                            <act.icon size={20} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{act.label}</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[90px]">{act.sub}</span>
                                    </div>
                                );

                                return act.action ? (
                                    <div key={i} onClick={act.action}>{content}</div>
                                ) : (
                                    <Link key={i} to={act.path}>{content}</Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 4: REAL TABLES & AUDIT STREAM (2 Columns)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Recent Transactions Table (Real from Fee Collection) */}
                        <div className="lg:col-span-7 glass-card rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Recent Transactions & Collections</h3>
                                    <p className="text-xs text-slate-500">Live payment ledger from student accounts</p>
                                </div>
                                <Link to="/admin/fees" className="text-xs font-bold text-orange-600 hover:underline">View All</Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                            <th className="pb-2.5">Date</th>
                                            <th className="pb-2.5">Student</th>
                                            <th className="pb-2.5">Period / Shift</th>
                                            <th className="pb-2.5">Amount</th>
                                            <th className="pb-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {recentTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-400">
                                                    No completed transactions recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentTransactions.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-2.5 text-slate-400 font-medium">
                                                        {new Date(t.paidDate || t.updatedAt || t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="py-2.5 font-semibold text-slate-900">
                                                        {t.student?.name || 'Student'}
                                                    </td>
                                                    <td className="py-2.5 text-slate-500">
                                                        {t.month && t.year ? `${t.month}/${t.year}` : (t.type || 'Standard Fee')}
                                                    </td>
                                                    <td className="py-2.5 font-bold text-slate-900">
                                                        ₹{(t.amount || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600">
                                                            {t.status || 'Paid'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Real System Announcements & Notices from MongoDB */}
                        <div className="lg:col-span-5 glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">System Alerts & Notices</h3>
                                    <p className="text-xs text-slate-500">Real announcements broadcasted to students</p>
                                </div>
                                <Link to="/admin/notifications" className="text-xs font-bold text-orange-600 hover:underline">Broadcast</Link>
                            </div>

                            <div className="space-y-3 my-auto">
                                {announcements.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        <p>No active announcements broadcasted.</p>
                                        <Link to="/admin/notifications" className="text-orange-600 font-bold hover:underline mt-1 block">
                                            + Send Announcement
                                        </Link>
                                    </div>
                                ) : (
                                    announcements.map((alert, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{alert.title}</p>
                                                    <span className="text-[10px] text-slate-400 shrink-0">
                                                        {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{alert.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-400">Broadcaster Node: Main Server</span>
                                <span className="font-bold text-emerald-600">Operational</span>
                            </div>
                        </div>

                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 5: REAL GROWTH & APNA LAKSHAY AI ASSISTANT (BETA)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">

                        {/* Student Registration Growth (Real 6 Months from User createdAt) */}
                        <div className="lg:col-span-5 glass-card rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Student Registration Growth</h3>
                                    <p className="text-xs text-slate-500">Real student enrolments over the last 6 months</p>
                                </div>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Last 6 Months</span>
                            </div>

                            {/* Bar Chart Representation */}
                            <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                                {monthlyGrowth.length === 0 ? (
                                    <div className="w-full text-center text-slate-400 text-xs my-auto">
                                        Calculating monthly registration trends...
                                    </div>
                                ) : (
                                    monthlyGrowth.map((bar, i) => {
                                        const maxGrowth = Math.max(1, ...monthlyGrowth.map(b => b.count || 0));
                                        const heightPct = bar.count > 0 ? Math.max(12, Math.round((bar.count / maxGrowth) * 100)) : 4;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {bar.count}
                                                </span>
                                                <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: '80%' }}>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-lg transition-all duration-500 group-hover:from-orange-400 group-hover:to-amber-400"
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-semibold text-slate-600">{bar.month}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span>Total Enrolled Roster</span>
                                <span className="font-bold text-slate-900">{metrics.totalStudents || 0} Students Registered</span>
                            </div>
                        </div>

                        {/* CAMPUS EXECUTIVE INTELLIGENCE - Direct Real Data Telemetry */}
                        <div className="lg:col-span-7 glass-card rounded-2xl p-5 border-orange-200 shadow-md bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-400/15 via-amber-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

                            <div>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-slate-900 text-orange-400 shadow-md border border-slate-800">
                                            <IoTerminalOutline size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 text-sm">Executive Intelligence Console</h3>
                                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-700 shadow-sm">LIVE</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Query live campus records, attendance telemetry, and financial health</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAIModal(true)}
                                        className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        Fullscreen Console <IoArrowForward size={12} />
                                    </button>
                                </div>

                                {/* Quick Prompt Suggestions Chips */}
                                <div className="flex flex-wrap gap-1.5 my-3">
                                    {[
                                        'What is happening across campus today?',
                                        'Show pending fee defaulters & total due',
                                        'How many vacant seats right now?',
                                        'Summarize today attendance & check-ins'
                                    ].map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setAiQuestion(q); handleAskAI(q); }}
                                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-[11px] font-medium text-slate-700 transition-all shadow-2xs text-left cursor-pointer"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                {/* Inline AI Structured Answer Box */}
                                {aiLoading ? (
                                    <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/60 flex items-center gap-3 my-2">
                                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-semibold text-orange-950">Querying real database metrics and generating executive briefing...</p>
                                    </div>
                                ) : aiAnswer ? (
                                    <div className="p-4 rounded-2xl bg-white border border-orange-200 shadow-sm my-2 max-h-96 overflow-y-auto custom-scrollbar relative group">
                                        <button
                                            onClick={copyAIText}
                                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs flex items-center gap-1 transition-colors z-10 cursor-pointer"
                                            title="Copy Executive Briefing"
                                        >
                                            {aiCopied ? <IoCheckmark size={14} className="text-emerald-600" /> : <IoCopyOutline size={14} />}
                                            <span className="text-[10px]">{aiCopied ? 'Copied' : 'Copy'}</span>
                                        </button>
                                        <StructuredAIResponse content={aiAnswer} />
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic my-2">
                                        Ask anything directly: attendance count, fee collection, shift status, or request a complete summary.
                                    </p>
                                )}
                            </div>

                            {/* Direct Prompt Input Bar */}
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleAskAI(); }}
                                className="relative mt-2 flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={aiQuestion}
                                    onChange={(e) => setAiQuestion(e.target.value)}
                                    placeholder="Ask anything about your library / campus data..."
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-inner transition-all pr-16"
                                />
                                <div className="absolute right-2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                            isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-600'
                                        }`}
                                        title={isListening ? 'Listening...' : 'Voice Input'}
                                    >
                                        {isListening ? <IoMicOff size={16} /> : <IoMic size={16} />}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!aiQuestion.trim() || aiLoading}
                                        className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white shadow-sm transition-all"
                                    >
                                        <IoSend size={13} />
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>

                </main>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODAL 1: FULLSCREEN AI INTELLIGENCE CONSOLE
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showAIModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-[#0b1329] text-white flex items-center justify-between border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-orange-400 flex items-center justify-center shadow-md">
                                        <IoTerminalOutline size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold text-base text-white">Executive Operations & Intelligence Console</h2>
                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE DB</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Direct conversational access to live database metrics</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {/* Chat Conversation History */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-50">
                                {aiHistory.length === 0 && !aiAnswer ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                                        <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                                            <IoStatsChartOutline size={32} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-base">How can I assist your operations today?</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Ask any question in English, Hindi, or Hinglish. I can analyze real seat availability, attendance logs, and financial records in real time.
                                        </p>
                                        <div className="flex flex-col gap-2 w-full pt-2">
                                            {[
                                                'Give me a complete executive summary of today',
                                                'List all students with pending fees and their contact details',
                                                'Which floor has the highest occupancy right now?'
                                            ].map((suggest, sIdx) => (
                                                <button
                                                    key={sIdx}
                                                    onClick={() => {
                                                        setModalAiQuestion(suggest);
                                                        handleAskAI(suggest);
                                                    }}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-orange-400 text-xs font-medium text-slate-700 hover:text-orange-700 text-left shadow-2xs transition-all flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>{suggest}</span>
                                                    <IoArrowForward size={13} className="text-slate-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {aiHistory.map((item, hIdx) => (
                                            <div
                                                key={hIdx}
                                                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                                                        item.role === 'user'
                                                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-tr-none shadow-md font-medium'
                                                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm w-full'
                                                    }`}
                                                >
                                                    {item.role === 'user' ? (
                                                        item.content
                                                    ) : (
                                                        <StructuredAIResponse content={item.content} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {aiLoading && (
                                            <div className="flex justify-start">
                                                <div className="p-4 rounded-2xl bg-white border border-orange-200 rounded-tl-none shadow-sm flex items-center gap-2.5">
                                                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs text-orange-950 font-semibold">Analyzing real-time campus data...</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Modal Prompt Input Footer */}
                            <div className="p-4 bg-white border-t border-slate-200">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (modalAiQuestion.trim()) {
                                            handleAskAI(modalAiQuestion);
                                            setModalAiQuestion('');
                                        }
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={modalAiQuestion}
                                        onChange={(e) => setModalAiQuestion(e.target.value)}
                                        placeholder="Ask anything about students, seats, attendance, revenue..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!modalAiQuestion.trim() || aiLoading}
                                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-40 transition-all flex items-center gap-2"
                                    >
                                        <IoSend size={14} />
                                        <span>Send</span>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════
                MODAL 2: COMMAND PALETTE (Ctrl + K)
            ══════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showCommandPalette && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                                <IoSearchOutline size={19} className="text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Type a command, page, or question..."
                                    className="w-full text-sm outline-none text-slate-900 placeholder-slate-400"
                                />
                                <kbd className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ESC</kbd>
                            </div>
                            <div className="p-3 max-h-80 overflow-y-auto space-y-1 text-xs">
                                <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Quick Jump Pages</p>
                                {[
                                    { name: 'Student Management', path: '/admin/students', icon: IoPersonOutline },
                                    { name: 'Floor & Seat Matrix', path: '/admin/floors', icon: IoBedOutline },
                                    { name: 'Attendance Records', path: '/admin/attendance', icon: IoCalendarOutline },
                                    { name: 'Fee Ledger', path: '/admin/fees', icon: IoCashOutline },
                                    { name: 'Reports & Analytics', path: '/admin/analytics', icon: IoBarChartOutline },
                                    { name: 'QR Entry Kiosk', path: '/admin/kiosk', icon: IoScanOutline },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { navigate(item.path); setShowCommandPalette(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <item.icon size={16} className="text-slate-400" />
                                            <span className="font-semibold">{item.name}</span>
                                        </div>
                                        <IoChevronForward size={13} className="text-slate-400" />
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                                <span>Press ESC or click outside to close</span>
                                <button onClick={() => setShowCommandPalette(false)} className="text-orange-600 font-semibold">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminDashboard;
