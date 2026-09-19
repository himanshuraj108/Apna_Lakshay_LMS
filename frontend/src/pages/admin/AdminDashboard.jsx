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
    IoAnalyticsOutline, IoPersonAddOutline
} from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';
import QRScannerModal from '../../components/admin/QRScannerModal';
import StructuredAIResponse from '../../components/admin/StructuredAIResponse';

/* ── Enterprise Warm Styling & Animation ─────────────────────── */
const DASHBOARD_STYLES = `
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(180, 120, 60, 0.25); border-radius: 999px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(180, 120, 60, 0.45); }
.glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 1px solid #EDE8E0; }
.glass-card { background: #FFFFFF; border: 1px solid #EDE8E0; box-shadow: 0 2px 10px -2px rgba(180, 120, 60, 0.05); border-radius: 18px; }
.glass-card:hover { border-color: #E2B08A; box-shadow: 0 8px 28px -4px rgba(249, 115, 22, 0.12); }
.metric-card-hover { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.metric-card-hover:hover { transform: translateY(-3px); }
`;

/* ── All 20 Enterprise Modules & Categories ──────────────── */
export const ALL_ADMIN_MODULES = [
    // ─── LIBRARY OPERATIONS ───
    {
        id: 'students',
        title: 'Student Directory',
        desc: 'Student rosters, profiles, seat allocations & documents',
        path: '/admin/students',
        category: 'Library Operations',
        icon: IoPersonOutline,
        color: '#2563eb',
        bg: '#eff6ff',
        tag: 'Roster'
    },
    {
        id: 'floors',
        title: 'Floor & Seat Matrix',
        desc: 'Visual desk layout, hall occupancy, rooms & seat pricing',
        path: '/admin/floors',
        category: 'Library Operations',
        icon: IoBedOutline,
        color: '#10b981',
        bg: '#ecfdf5',
        tag: 'Seats'
    },
    {
        id: 'attendance',
        title: 'Attendance Tracking',
        desc: 'Daily check-in logs, biometric punches & absent tracking',
        path: '/admin/attendance',
        category: 'Library Operations',
        icon: IoCalendarOutline,
        color: '#f59e0b',
        bg: '#fffbeb',
        tag: 'Daily Log'
    },
    {
        id: 'fees',
        title: 'Fee Management',
        desc: 'Automated billing, dues settlement & physical receipts',
        path: '/admin/fees',
        category: 'Library Operations',
        icon: IoCashOutline,
        color: '#8b5cf6',
        bg: '#f5f3ff',
        tag: 'Finance'
    },
    {
        id: 'shifts',
        title: 'Shift Operations',
        desc: 'Configure shift timings, hourly quotas & batch schedules',
        path: '/admin/shifts',
        category: 'Library Operations',
        icon: IoTimeOutline,
        color: '#06b6d4',
        bg: '#ecfeff',
        tag: 'Timings'
    },
    {
        id: 'vacant-seats',
        title: 'Vacant Seats',
        desc: 'Real-time vacant desks matrix across shifts and rooms',
        path: '/admin/vacant-seats',
        category: 'Library Operations',
        icon: IoSearchOutline,
        color: '#0d9488',
        bg: '#f0fdfa',
        tag: 'Available'
    },
    {
        id: 'kiosk',
        title: 'QR Entry Kiosk',
        desc: 'Full-screen entrance kiosk for instant QR code attendance',
        path: '/admin/kiosk',
        category: 'Library Operations',
        icon: IoScanOutline,
        color: '#ec4899',
        bg: '#fdf2f8',
        tag: 'Kiosk'
    },
    {
        id: 'notifications',
        title: 'Notice & Announcements',
        desc: 'Broadcast alerts, exam updates & campus announcements',
        path: '/admin/notifications',
        category: 'Library Operations',
        icon: IoMegaphoneOutline,
        color: '#f97316',
        bg: '#fff7ed',
        tag: 'Broadcast'
    },
    {
        id: 'chat',
        title: 'Discussion Rooms',
        desc: 'Real-time subject study rooms & community chat groups',
        path: '/admin/chat',
        category: 'Library Operations',
        icon: IoChatbubblesOutline,
        color: '#6366f1',
        bg: '#eef2ff',
        tag: 'Community'
    },
    {
        id: 'chat-history',
        title: 'Student Chat History',
        desc: 'Audit AI doubt queries, chat transcripts & moderation',
        path: '/admin/chat-history',
        category: 'Library Operations',
        icon: IoDocumentTextOutline,
        color: '#475569',
        bg: '#f8fafc',
        tag: 'Audit'
    },

    // ─── ANALYTICS & INSIGHTS ───
    {
        id: 'analytics',
        title: 'Reports & Analytics',
        desc: 'In-depth charts, revenue forecasting & library growth',
        path: '/admin/analytics',
        category: 'Analytics & Insights',
        icon: IoBarChartOutline,
        color: '#2563eb',
        bg: '#eff6ff',
        tag: 'Executive'
    },
    {
        id: 'activities',
        title: 'Student Activities & XP',
        desc: 'Gamification leaderboard, study streaks & student XP',
        path: '/admin/activities',
        category: 'Analytics & Insights',
        icon: IoRibbonOutline,
        color: '#e11d48',
        bg: '#fff1f2',
        tag: 'Streaks'
    },
    {
        id: 'ai-activity',
        title: 'AI Study Logs',
        desc: 'Telemetry on AI Doubt Solver, quiz tests & study planner',
        path: '/admin/ai-activity',
        category: 'Analytics & Insights',
        icon: IoTrophy,
        color: '#d97706',
        bg: '#fffbeb',
        tag: 'Telemetry'
    },
    {
        id: 'referral-wallet',
        title: 'Referral & Wallet',
        desc: 'Student referral payouts, coin ledger & reward balance',
        path: '/admin/referral-wallet',
        category: 'Analytics & Insights',
        icon: IoWalletOutline,
        color: '#059669',
        bg: '#ecfdf5',
        tag: 'Rewards'
    },

    // ─── ADMINISTRATION & GOVERNANCE ───
    {
        id: 'sub-admins',
        title: 'Sub-Admin Roles',
        desc: 'Manage staff accounts, PIN passcodes & granular permissions',
        path: '/admin/sub-admins',
        category: 'Administration',
        icon: IoShieldCheckmarkOutline,
        color: '#4f46e5',
        bg: '#eef2ff',
        tag: 'Roles'
    },
    {
        id: 'requests',
        title: 'Student Requests',
        desc: 'Process seat shifting, locker requests & complaints',
        path: '/admin/requests',
        category: 'Administration',
        icon: IoDocumentTextOutline,
        color: '#ea580c',
        bg: '#fff7ed',
        tag: 'Approvals'
    },
    {
        id: 'history',
        title: 'Action History Logs',
        desc: 'Immutable audit trail of staff actions, edits & deletes',
        path: '/admin/history',
        category: 'Administration',
        icon: IoTimeOutline,
        color: '#0891b2',
        bg: '#ecfeff',
        tag: 'Logs'
    },
    {
        id: 'password-activity',
        title: 'Password Activity',
        desc: 'Live security log of student password resets & credential updates',
        path: '/admin/password-activity',
        category: 'Administration',
        icon: IoKey,
        color: '#dc2626',
        bg: '#fef2f2',
        tag: 'Security'
    },
    {
        id: 'manage-cards',
        title: 'Manage Cards & Layout',
        desc: 'Customize student app cards order, visibility & AI credits',
        path: '/admin/manage-cards',
        category: 'Administration',
        icon: IoGridOutline,
        color: '#7c3aed',
        bg: '#f5f3ff',
        tag: 'Student App'
    },
    {
        id: 'settings',
        title: 'System Settings',
        desc: 'Campus maintenance mode, geofence & attendance rules',
        path: '/admin/settings',
        category: 'Administration',
        icon: IoSettingsOutline,
        color: '#334155',
        bg: '#f1f5f9',
        tag: 'System'
    }
];

export const NAV_CATEGORIES = [
    {
        name: 'LIBRARY OPERATIONS',
        items: ALL_ADMIN_MODULES.filter(m => m.category === 'Library Operations')
    },
    {
        name: 'ANALYTICS & INSIGHTS',
        items: ALL_ADMIN_MODULES.filter(m => m.category === 'Analytics & Insights')
    },
    {
        name: 'ADMINISTRATION & GOVERNANCE',
        items: ALL_ADMIN_MODULES.filter(m => m.category === 'Administration')
    }
];

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
    const [moduleSearch, setModuleSearch] = useState('');
    const [selectedModuleCategory, setSelectedModuleCategory] = useState('All');
    const [commandSearch, setCommandSearch] = useState('');

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

    // Real Notification Center States
    const [systemUpdates, setSystemUpdates] = useState([]);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [readNotificationIds, setReadNotificationIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('admin_read_notifications') || '[]');
        } catch {
            return [];
        }
    });
    const notificationRef = useRef(null);

    // Live Clock State for Production SaaS HUD
    const [currentTime, setCurrentTime] = useState(new Date());

    // Initial Data Fetch
    useEffect(() => {
        fetchRealDashboardData();
        fetchSettings();

        // 1-Second Live Telemetry Clock Ticker
        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Keyboard Shortcut: Ctrl + K for Command Palette
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setShowCommandPalette(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearInterval(clockTimer);
            window.removeEventListener('keydown', handleKeyDown);
        };
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
            // Also fetch real system updates / broadcasts
            try {
                const updatesRes = await api.get('/admin/updates');
                if (updatesRes.data?.updates) {
                    setSystemUpdates(updatesRes.data.updates);
                }
            } catch (err) {
                // non-blocking
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

    /* ── Real Notifications Aggregation & Tracking ─────────── */
    const allRealNotifications = [
        ...(announcements || []).map(a => ({
            id: a._id || a.id,
            title: a.title || 'Broadcast Announcement',
            message: a.message || '',
            type: a.type || 'announcement',
            createdAt: a.createdAt
        })),
        ...(systemUpdates || []).map(u => ({
            id: u._id || u.id,
            title: u.titleEn || u.tickerEn || 'System Update',
            message: u.contentEn || u.tickerEn || '',
            type: 'system',
            createdAt: u.createdAt
        }))
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const unreadNotifications = allRealNotifications.filter(n => !readNotificationIds.includes(n.id));
    const unreadCount = unreadNotifications.length;

    const handleMarkAllNotificationsRead = () => {
        const allIds = allRealNotifications.map(n => n.id);
        const updated = Array.from(new Set([...readNotificationIds, ...allIds]));
        setReadNotificationIds(updated);
        try {
            localStorage.setItem('admin_read_notifications', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkSingleNotificationRead = (id) => {
        if (readNotificationIds.includes(id)) return;
        const updated = [...readNotificationIds, id];
        setReadNotificationIds(updated);
        try {
            localStorage.setItem('admin_read_notifications', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
    };

    const METRIC_CARDS = [
        {
            title: 'Total Seats',
            value: (metrics.totalSeats || 0).toLocaleString(),
            sub: `${metrics.occupiedSeats || 0} Occupied · ${metrics.vacantSeats || 0} Vacant`,
            badge: `${metrics.occupancyRate || 95}% Full`,
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
            icon: IoBedOutline,
            path: '/admin/floors',
            accentColor: '#2563eb',
            accentEnd: '#1d4ed8',
            hoverBorder: '#BFDBFE',
            hoverShadow: 'rgba(37, 99, 235, 0.12)',
            titleColor: '#1E40AF',
            subColor: '#2563eb'
        },
        {
            title: 'Active Students',
            value: (metrics.activeStudents || 0).toLocaleString(),
            sub: `Out of ${metrics.totalStudents || 0} registered`,
            badge: 'Enrolled',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            icon: IoPersonOutline,
            path: '/admin/students',
            accentColor: '#10b981',
            accentEnd: '#059669',
            hoverBorder: '#A7F3D0',
            hoverShadow: 'rgba(16, 185, 129, 0.12)',
            titleColor: '#065F46',
            subColor: '#059669'
        },
        {
            title: 'Today Check-ins',
            value: (metrics.todayAttendance || 0).toLocaleString(),
            sub: `${metrics.currentlyCheckedIn || 0} inside right now`,
            badge: 'Live',
            badgePulse: true,
            badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/80',
            icon: IoRefreshOutline,
            path: '/admin/attendance',
            accentColor: '#f59e0b',
            accentEnd: '#d97706',
            hoverBorder: '#FDE68A',
            hoverShadow: 'rgba(245, 158, 11, 0.12)',
            titleColor: '#92400E',
            subColor: '#D97706'
        },
        {
            title: 'Available Desks',
            value: (metrics.vacantSeats || 0).toLocaleString(),
            sub: 'Available for allocation',
            badge: `${metrics.vacantSeats || 0} Open`,
            badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80',
            icon: IoGridOutline,
            path: '/admin/vacant-seats',
            accentColor: '#0d9488',
            accentEnd: '#0f766e',
            hoverBorder: '#99F6E4',
            hoverShadow: 'rgba(13, 148, 136, 0.12)',
            titleColor: '#115E59',
            subColor: '#0D9488'
        },
        {
            title: 'Pending Dues',
            value: `₹${(metrics.pendingFeesAmount || 0).toLocaleString('en-IN')}`,
            sub: `${metrics.pendingFeesCount || 0} student fee dues`,
            badge: metrics.pendingFeesCount > 0 ? `${metrics.pendingFeesCount} Dues` : 'All Clear',
            badgeColor: metrics.pendingFeesCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-200/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            icon: IoTimeOutline,
            path: '/admin/fees',
            accentColor: '#ef4444',
            accentEnd: '#dc2626',
            hoverBorder: '#FECACA',
            hoverShadow: 'rgba(239, 68, 68, 0.12)',
            titleColor: '#991B1B',
            subColor: '#DC2626'
        },
        {
            title: 'Total Revenue',
            value: `₹${(metrics.feesCollected || 0).toLocaleString('en-IN')}`,
            sub: `+₹${(metrics.todayFeesCollected || 0).toLocaleString('en-IN')} collected today`,
            badge: 'Ledger',
            badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
            icon: IoCashOutline,
            path: '/admin/fees',
            accentColor: '#8b5cf6',
            accentEnd: '#7c3aed',
            hoverBorder: '#DDD6FE',
            hoverShadow: 'rgba(139, 92, 246, 0.12)',
            titleColor: '#5B21B6',
            subColor: '#7C3AED'
        },
    ];

    /* ── Filtered Modules for Dashboard Cards Grid ────────── */
    const filteredModules = ALL_ADMIN_MODULES.filter(mod => {
        const matchesCat = selectedModuleCategory === 'All' || mod.category === selectedModuleCategory;
        const q = moduleSearch.toLowerCase().trim();
        const matchesSearch = !q ||
            mod.title.toLowerCase().includes(q) ||
            mod.desc.toLowerCase().includes(q) ||
            mod.tag.toLowerCase().includes(q) ||
            mod.category.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
    });

    /* ── Filtered Modules for Command Palette ─────────────── */
    const paletteModules = ALL_ADMIN_MODULES.filter(mod => {
        const q = commandSearch.toLowerCase().trim();
        return !q ||
            mod.title.toLowerCase().includes(q) ||
            mod.desc.toLowerCase().includes(q) ||
            mod.tag.toLowerCase().includes(q) ||
            mod.category.toLowerCase().includes(q);
    });

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

    const trendAreaPath = trendPoints.length > 0
        ? `${trendPath} L ${trendPoints[trendPoints.length - 1].x} 150 L ${trendPoints[0].x} 150 Z`
        : '';

    /* ── Deduplicated Announcements for Clean Card Feed ─────── */
    const uniqueAnnouncements = [];
    const seenNoticeKeys = new Set();
    for (const a of (announcements || [])) {
        const key = `${a.title}_${a.message}`;
        if (!seenNoticeKeys.has(key)) {
            seenNoticeKeys.add(key);
            uniqueAnnouncements.push(a);
        }
    }
    const displayAnnouncements = uniqueAnnouncements.length > 0 ? uniqueAnnouncements.slice(0, 3) : (announcements || []).slice(0, 3);

    /* ── Real Donut Calculation ────────────────────────────── */
    const totalDesksReal = metrics.totalSeats || 0;
    const occupiedDesksReal = metrics.occupiedSeats || 0;
    const vacantDesksReal = metrics.vacantSeats || 0;
    const occupiedCirc = totalDesksReal > 0 ? (occupiedDesksReal / totalDesksReal) * 239 : 0;
    const vacantCirc = totalDesksReal > 0 ? (vacantDesksReal / totalDesksReal) * 239 : 0;

    /* ── Real-Time Live HUD Clock & Shift Computations ─────── */
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    const activeShiftName = hours >= 6 && hours < 14
        ? 'Morning Shift'
        : hours >= 14 && hours < 18
            ? 'Afternoon Shift'
            : hours >= 18 && hours < 23
                ? 'Evening Shift'
                : 'Night Shift';

    const activeShiftTimings = hours >= 6 && hours < 14
        ? '06:00 AM – 02:00 PM'
        : hours >= 14 && hours < 18
            ? '02:00 PM – 06:00 PM'
            : hours >= 18 && hours < 23
                ? '06:00 PM – 11:00 PM'
                : '11:00 PM – 06:00 AM';

    const formattedDigitalTime = currentTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const formattedFullDate = currentTime.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const secondAngle = seconds * 6;
    const minuteAngle = (minutes + seconds / 60) * 6;
    const hourAngle = ((hours % 12) + minutes / 60) * 30;
    const watchCircumference = 2 * Math.PI * 26; // ~163.36
    const watchDashOffset = watchCircumference * (1 - seconds / 60);

    const occupancyPercent = totalDesksReal > 0
        ? Math.round((occupiedDesksReal / totalDesksReal) * 100)
        : (metrics.occupancyRate || 0);

    return (
        <div
            className="flex h-screen w-screen overflow-hidden text-[#0F172A] antialiased relative"
            style={{ background: '#FAF6F0', fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif" }}
        >
            <style>{DASHBOARD_STYLES}</style>

            {/* Modals */}
            {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
            {showShiftModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-[#EDE8E0]">
                        <button onClick={() => setShowShiftModal(false)} className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-lg">
                            <IoClose size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-[#0F172A]">Shift Timings & Management</h2>
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-[#141210] text-[#D6D3D1] flex flex-col z-50 lg:hidden border-r border-[#292420] shadow-2xl"
                        >
                            {/* Brand Header with Close */}
                            <div className="h-16 px-4 flex items-center justify-between border-b border-[#292420] bg-[#1C1916] shrink-0">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/app-icon-192.png"
                                        alt="Apna Lakshay"
                                        className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0"
                                    />
                                    <div>
                                        <h1 className="font-bold text-white text-[15px] leading-tight tracking-tight">Apna Lakshay</h1>
                                        <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Super Admin Suite</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
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
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25"
                                    >
                                        <IoGridOutline size={18} className="shrink-0" />
                                        <span>Dashboard</span>
                                    </Link>
                                </div>

                                {NAV_CATEGORIES.map((cat, cIdx) => (
                                    <div key={cIdx} className="space-y-1">
                                        <p className="px-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                            {cat.name}
                                        </p>
                                        {cat.items.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                onClick={() => setMobileSidebarOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/6 transition-all text-xs font-medium group"
                                            >
                                                <item.icon size={17} className="shrink-0 text-stone-400 group-hover:text-amber-400 transition-colors" />
                                                <span>{item.title}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Mobile Drawer Bottom: Logout & AI */}
                            <div className="p-3 border-t border-[#292420] bg-[#1C1916] space-y-2 shrink-0">
                                <button
                                    onClick={() => {
                                        setMobileSidebarOpen(false);
                                        setShowAIModal(true);
                                    }}
                                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                className={`hidden lg:flex bg-[#141210] text-[#D6D3D1] flex-col transition-all duration-300 z-30 shrink-0 select-none border-r border-[#292420] ${
                    sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
                }`}
            >
                {/* Brand Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-[#292420] bg-[#1C1916]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img
                            src="/app-icon-192.png"
                            alt="Apna Lakshay"
                            className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0"
                        />
                        {!sidebarCollapsed && (
                            <div className="truncate">
                                <h1 className="font-bold text-white text-[15px] leading-tight tracking-tight">Apna Lakshay</h1>
                                <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Super Admin Suite</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarCollapsed(p => !p)}
                        className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25"
                        >
                            <IoGridOutline size={18} className="shrink-0" />
                            {!sidebarCollapsed && <span className="truncate">Dashboard</span>}
                        </Link>
                    </div>

                    {NAV_CATEGORIES.map((cat, cIdx) => (
                        <div key={cIdx} className="space-y-1">
                            {!sidebarCollapsed && (
                                <p className="px-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    {cat.name}
                                </p>
                            )}
                            {cat.items.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/6 transition-all text-xs font-medium group"
                                    title={sidebarCollapsed ? item.title : ''}
                                >
                                    <item.icon size={17} className="shrink-0 text-stone-400 group-hover:text-amber-400 transition-colors" />
                                    {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Bottom Executive Intelligence Card */}
                {!sidebarCollapsed ? (
                    <div className="p-3 border-t border-[#292420] bg-[#141210]">
                        <div className="p-3.5 rounded-2xl bg-[#1C1916] border border-[#292420] shadow-inner">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded-lg bg-orange-500/10 text-orange-400">
                                    <IoTerminalOutline size={14} />
                                </div>
                                <span className="text-xs font-bold text-white tracking-wide">Campus Intelligence</span>
                                <span className="text-[9px] bg-stone-800 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-stone-700">LIVE</span>
                            </div>
                            <p className="text-[11px] text-stone-400 leading-snug mb-3">Live database queries & telemetry</p>
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="w-full py-1.5 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IoAnalyticsOutline size={13} />
                                Open Command Console
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full mt-2 py-2 px-3 rounded-xl hover:bg-rose-500/10 text-stone-400 hover:text-rose-400 border border-transparent hover:border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                            title="Sign Out"
                        >
                            <IoLogOut size={15} />
                            <span>Logout</span>
                        </button>
                    </div>
                ) : (
                    <div className="p-3 border-t border-[#292420] flex flex-col items-center gap-2 bg-[#141210]">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="p-2.5 rounded-xl bg-[#1C1916] hover:bg-stone-800 text-orange-400 transition-colors cursor-pointer border border-[#292420]"
                            title="Open Command Console"
                        >
                            <IoTerminalOutline size={18} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Logout"
                        >
                            <IoLogOut size={18} />
                        </button>
                    </div>
                )}
            </aside>

            {/* ══════════════════════════════════════════════════════════
                MAIN CONTENT AREA
            ══════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

                {/* ── Top Bar (Global Header) ────────────────────────── */}
                <header className="h-16 px-3 sm:px-6 bg-white/90 backdrop-blur-md border-b border-[#EDE8E0] flex items-center justify-between gap-2 sm:gap-4 z-20 shrink-0 shadow-2xs">
                    {/* Left: Mobile Menu Trigger & Global Search */}
                    <div className="flex-1 max-w-xl flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors shrink-0"
                            title="Open Navigation Menu"
                        >
                            <IoMenuOutline size={20} />
                        </button>

                        <div
                            onClick={() => setShowCommandPalette(true)}
                            className="w-full flex items-center justify-between px-3.5 py-2 bg-stone-100/80 hover:bg-white border border-[#E2DBD2] hover:border-orange-500/50 rounded-xl text-xs sm:text-sm text-stone-500 cursor-pointer transition-all shadow-2xs min-w-0 group"
                        >
                            <div className="flex items-center gap-2 min-w-0 truncate">
                                <IoSearchOutline size={16} className="text-stone-400 group-hover:text-orange-500 transition-colors shrink-0" />
                                <span className="truncate">Search anything (students, seats, fees, rooms, actions)...</span>
                            </div>
                            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-stone-500 bg-white rounded border border-[#EDE8E0] shadow-2xs shrink-0 ml-1">
                                Ctrl + K
                            </kbd>
                        </div>
                    </div>

                    {/* Right: Quick Controls, Settings, Campus & Profile */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* Campus Selector */}
                        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl text-xs font-bold text-[#C2410C]">
                            <IoBusinessOutline size={15} className="text-amber-500" />
                            <span>{selectedCampus}</span>
                        </div>

                        {/* System Online Status Pill */}
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>System Online</span>
                        </div>

                        {/* ── Settings Dropdown Button (Fully Preserved) ── */}
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => { setShowSettingsDropdown(p => !p); setPinMsg(''); }}
                                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] transition-colors relative cursor-pointer shadow-2xs"
                                title="System Settings & Attendance Controls"
                            >
                                <IoSettingsOutline size={19} className={showSettingsDropdown ? 'rotate-90 transition-transform duration-300' : 'transition-transform duration-300'} />
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
                                            className="absolute right-0 top-full mt-2 z-40 w-96 max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden bg-white border border-[#EDE8E0]"
                                        >
                                            <div className="px-4 py-3 border-b border-[#EDE8E0] flex items-center justify-between bg-[#FAF6F0]">
                                                <p className="text-xs font-bold uppercase tracking-wider text-stone-700">Enterprise System Controls</p>
                                                <button onClick={() => setShowSettingsDropdown(false)} className="text-stone-400 hover:text-stone-600">
                                                    <IoClose size={18} />
                                                </button>
                                            </div>

                                            <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                                {/* System Status */}
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF6F0]">
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
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF6F0]">
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
                                                <div className="px-3 py-2.5 rounded-xl hover:bg-[#FAF6F0]">
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
                                                                className="flex-1 bg-white border border-[#E2DBD2] text-slate-900 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-amber-500"
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
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF6F0]">
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

                        {/* ── Real Notification Bell & Interactive Dropdown ── */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => {
                                    setShowNotificationDropdown(p => !p);
                                    setShowSettingsDropdown(false);
                                }}
                                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] transition-colors relative shadow-2xs cursor-pointer"
                                title="Announcements & Live Notifications"
                            >
                                <IoNotificationsOutline size={19} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Real Notification Dropdown */}
                            <AnimatePresence>
                                {showNotificationDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowNotificationDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 z-40 w-96 max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden bg-white border border-[#EDE8E0]"
                                        >
                                            <div className="px-4 py-3 border-b border-[#EDE8E0] flex items-center justify-between bg-[#FAF6F0]">
                                                <div className="flex items-center gap-2">
                                                    <IoNotificationsOutline className="text-orange-600" size={17} />
                                                    <p className="text-xs font-bold uppercase tracking-wider text-stone-700">Notifications & Alerts</p>
                                                    {unreadCount > 0 ? (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-extrabold">
                                                            {unreadCount} new
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                                                            Caught up
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={handleMarkAllNotificationsRead}
                                                            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                    <button onClick={() => setShowNotificationDropdown(false)} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                                                        <IoClose size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2 space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar divide-y divide-[#EDE8E0]/60">
                                                {allRealNotifications.length === 0 ? (
                                                    <div className="py-8 px-4 text-center">
                                                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                                            <IoNotificationsOutline size={20} />
                                                        </div>
                                                        <p className="text-xs font-semibold text-stone-700">No active notifications</p>
                                                        <p className="text-[11px] text-stone-400 mt-0.5">All student announcements and system alerts are clear.</p>
                                                    </div>
                                                ) : (
                                                    allRealNotifications.slice(0, 10).map((item) => {
                                                        const isRead = readNotificationIds.includes(item.id);
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => handleMarkSingleNotificationRead(item.id)}
                                                                className={`p-3 rounded-xl transition-colors cursor-pointer ${
                                                                    isRead ? 'bg-white hover:bg-stone-50 text-stone-600' : 'bg-orange-50/50 hover:bg-orange-50 border border-orange-200/40 text-stone-900'
                                                                }`}
                                                            >
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                                                        item.type === 'announcement'
                                                                            ? 'bg-amber-100 text-amber-700'
                                                                            : 'bg-orange-100 text-orange-700'
                                                                    }`}>
                                                                        <IoMegaphoneOutline size={15} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <p className={`text-xs font-bold truncate ${isRead ? 'text-stone-700' : 'text-stone-900'}`}>
                                                                                {item.title}
                                                                            </p>
                                                                            {!isRead && (
                                                                                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                                            {item.message}
                                                                        </p>
                                                                        <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-stone-400 border-t border-stone-100">
                                                                            <span className="font-semibold uppercase tracking-wider text-[9px] text-stone-400">
                                                                                {item.type}
                                                                            </span>
                                                                            <span>
                                                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <div className="p-2.5 bg-[#FAF6F0] border-t border-[#EDE8E0] text-center">
                                                <Link
                                                    to="/admin/notifications"
                                                    onClick={() => setShowNotificationDropdown(false)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                                                >
                                                    <span>Open Notification Center & Broadcasts</span>
                                                    <IoChevronForward size={14} />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Scan QR / ID button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
                            title="Scan Student QR / ID Card"
                        >
                            <IoQrCodeOutline size={15} />
                            <span>Scan QR / ID</span>
                        </motion.button>

                        {/* Admin Profile */}
                        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#EDE8E0] shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                                {user?.name ? user.name[0].toUpperCase() : 'A'}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-bold text-[#0F172A] leading-none truncate max-w-[120px]">{user?.name || 'Administrator'}</p>
                                <p className="text-[10px] text-stone-500 leading-tight font-medium">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Scrollable Dashboard Workspace ─────────────────── */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 relative">
                    {/* Ambient 28px Dot Grid Texture */}
                    <div
                        className="fixed inset-0 pointer-events-none -z-10"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                            backgroundSize: '28px 28px'
                        }}
                    />

                    {/* ══════════════════════════════════════════════════════
                        HERO GREETING BANNER
                    ══════════════════════════════════════════════════════ */}
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#431407] text-white p-6 sm:p-7 shadow-lg border border-[#3E3835]">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-white/15">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    <span>Super Admin Control Deck</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'Admin'}!
                                </h2>
                                <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed font-medium">
                                    Live telemetry across student seats, daily check-in attendance, shift rosters, and collections.
                                </p>
                            </div>
                            
                            {/* Circle Running Watch with Real-Time Digital Clock & Active Shift */}
                            <div className="w-full md:w-auto bg-white/[0.07] hover:bg-white/[0.10] backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-4.5 shadow-2xl shadow-black/25 transition-all duration-300 flex items-center gap-4 sm:gap-5">
                                {/* SVG Circular Running Watch Dial */}
                                <div className="relative shrink-0 flex items-center justify-center">
                                    <svg width="68" height="68" viewBox="0 0 64 64" className="drop-shadow-[0_2px_12px_rgba(249,115,22,0.3)]">
                                        <defs>
                                            <linearGradient id="watchSecondsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#F59E0B" />
                                                <stop offset="50%" stopColor="#F97316" />
                                                <stop offset="100%" stopColor="#EF4444" />
                                            </linearGradient>
                                        </defs>

                                        {/* Dial Background Face */}
                                        <circle cx="32" cy="32" r="28" fill="#1C1917" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />

                                        {/* 12 Hour Dial Ticks */}
                                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                                            <line
                                                key={deg}
                                                x1="32" y1="7" x2="32" y2={deg % 90 === 0 ? "10.5" : "8.5"}
                                                stroke={deg % 90 === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)"}
                                                strokeWidth={deg % 90 === 0 ? "1.5" : "1"}
                                                strokeLinecap="round"
                                                transform={`rotate(${deg} 32 32)`}
                                            />
                                        ))}

                                        {/* Circular Running Seconds Progress Track */}
                                        <circle
                                            cx="32" cy="32" r="26"
                                            fill="transparent"
                                            stroke="url(#watchSecondsGrad)"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeDasharray={watchCircumference}
                                            strokeDashoffset={watchDashOffset}
                                            transform="rotate(-90 32 32)"
                                            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                                        />

                                        {/* Hour Hand */}
                                        <line
                                            x1="32" y1="32" x2="32" y2="18"
                                            stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"
                                            transform={`rotate(${hourAngle} 32 32)`}
                                        />

                                        {/* Minute Hand */}
                                        <line
                                            x1="32" y1="32" x2="32" y2="12"
                                            stroke="#FDBA74" strokeWidth="1.8" strokeLinecap="round"
                                            transform={`rotate(${minuteAngle} 32 32)`}
                                        />

                                        {/* Running Second Hand */}
                                        <line
                                            x1="32" y1="36" x2="32" y2="9.5"
                                            stroke="#F97316" strokeWidth="1.2" strokeLinecap="round"
                                            transform={`rotate(${secondAngle} 32 32)`}
                                        />

                                        {/* Center Pivot Pin */}
                                        <circle cx="32" cy="32" r="2.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="1" />
                                    </svg>

                                    {/* Live pulsing status dot */}
                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-[#1C1917]" />
                                    </span>
                                </div>

                                {/* Active Shift & Digital Time Details */}
                                <div className="flex flex-col justify-center min-w-0">
                                    {/* Active Shift Tag */}
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold tracking-wide">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                                            <span>{activeShiftName}</span>
                                        </span>
                                        <span className="text-[10px] font-semibold text-stone-400">
                                            {activeShiftTimings}
                                        </span>
                                    </div>

                                    {/* Digital Running Time */}
                                    <div className="flex items-baseline gap-1 font-mono text-white tracking-wider">
                                        <span className="text-2xl sm:text-3xl font-black">
                                            {formattedDigitalTime}
                                        </span>
                                    </div>

                                    {/* Date & Campus Roster Subtitle */}
                                    <p className="text-[11px] font-medium text-stone-300 mt-0.5 flex items-center gap-1.5">
                                        <IoCalendarOutline size={12} className="text-amber-400" />
                                        <span>{formattedFullDate}</span>
                                        <span className="text-stone-500">·</span>
                                        <span className="text-[10px] text-stone-400 font-semibold">Live Campus Roster</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 1: REAL EXECUTIVE KPI METRICS (6 Cards)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
                        {METRIC_CARDS.map((card, idx) => (
                            <Link key={idx} to={card.path} className="block h-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                    className="group relative overflow-hidden rounded-2xl p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between transition-all duration-300 bg-white h-full"
                                    style={{
                                        border: '1.5px solid #EDE8E0',
                                        boxShadow: '0 2px 12px rgba(180,120,60,0.06)',
                                        minHeight: '144px'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = card.hoverBorder;
                                        e.currentTarget.style.boxShadow = `0 8px 28px ${card.hoverShadow}`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#EDE8E0';
                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(180,120,60,0.06)';
                                    }}
                                >
                                    {/* Top accent bar matching student panel */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                        style={{ background: `linear-gradient(90deg, ${card.accentColor}, ${card.accentEnd}, transparent)` }}
                                    />

                                    {/* Ghost watermark icon matching student panel */}
                                    <card.icon
                                        size={56}
                                        className="absolute -bottom-1 -right-1 opacity-[0.05] transition-opacity group-hover:opacity-[0.10] pointer-events-none"
                                        style={{ color: card.accentColor }}
                                    />

                                    {/* Header: Icon pill on left, Badge on right */}
                                    <div className="flex items-center justify-between gap-2 mb-2 relative">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-110 shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.accentEnd})` }}
                                        >
                                            <card.icon size={16} className="text-white" />
                                        </div>
                                        {card.badge && (
                                            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor} flex items-center gap-1 shrink-0`}>
                                                {card.badgePulse && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                )}
                                                {card.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Metric title + value */}
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: card.titleColor }}>
                                            {card.title}
                                        </p>
                                        <p className="text-2xl sm:text-[28px] font-black text-[#1A1A1A] leading-tight tracking-tight">
                                            {card.value}
                                        </p>
                                    </div>

                                    {/* Subtitle - clean wrap, never cuts off */}
                                    <p className="text-[11px] font-semibold leading-snug mt-2" style={{ color: card.subColor }}>
                                        {card.sub}
                                    </p>
                                </motion.div>
                            </Link>
                        ))}
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 2: VISUAL ANALYTICS & DISTRIBUTION (3 Columns)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                        {/* Column 1: Attendance Trends (Real 7-Day Line Chart from MongoDB) */}
                        <div
                            className="lg:col-span-5 bg-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#F97316,#FB923C,transparent)' }} />
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                        <IoCalendarOutline size={15} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight">Attendance Trends</h3>
                                        <p className="text-[11px] text-stone-500 font-medium">Real check-ins over 7 days</p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                                    {metrics.todayAttendance || 0} check-ins today
                                </span>
                            </div>

                            {/* SVG Multi-Line Chart Canvas with Area Fill */}
                            <div className="h-48 w-full relative pt-2">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
                                    <defs>
                                        <linearGradient id="attendanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                                        </linearGradient>
                                    </defs>
                                    <line x1="0" y1="30" x2="400" y2="30" stroke="#EDE8E0" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="70" x2="400" y2="70" stroke="#EDE8E0" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="110" x2="400" y2="110" stroke="#EDE8E0" strokeDasharray="4 4" strokeWidth="1" />
                                    <line x1="0" y1="150" x2="400" y2="150" stroke="#E2DBD2" strokeWidth="1" />

                                    {/* Area Gradient Fill */}
                                    {trendAreaPath && (
                                        <path d={trendAreaPath} fill="url(#attendanceAreaGrad)" />
                                    )}

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
                                            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" />
                                            {pt.count > 0 && (
                                                <text x={pt.x} y={pt.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1c1917">
                                                    {pt.count}
                                                </text>
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-stone-400 mt-2 px-2">
                                {trendPoints.map((pt, pIdx) => (
                                    <span key={pIdx}>{pt.day}</span>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Seat & Shift Allocation (Donut Chart) */}
                        <div
                            className="lg:col-span-4 bg-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#0d9488,#14b8a6,transparent)' }} />
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                                        <IoGridOutline size={15} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Seat Allocation</h3>
                                </div>
                                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">Live Desks</span>
                            </div>

                            <div className="flex items-center justify-center my-3 relative">
                                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EDE8E0" strokeWidth="12" />
                                    {/* Occupied Segment */}
                                    <circle
                                        cx="50" cy="50" r="38" fill="transparent" stroke="#f97316" strokeWidth="12"
                                        strokeDasharray={`${occupiedCirc} 239`} strokeDashoffset="0"
                                    />
                                    {/* Vacant Segment */}
                                    <circle
                                        cx="50" cy="50" r="38" fill="transparent" stroke="#E2DBD2" strokeWidth="12"
                                        strokeDasharray={`${vacantCirc} 239`} strokeDashoffset={-occupiedCirc}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-2xl font-black text-stone-900">{totalDesksReal}</span>
                                    <span className="text-[10px] uppercase font-bold text-stone-400">Total Desks</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0]/70">
                                    <span className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px]">
                                        <span className="w-2 h-2 rounded-full bg-orange-500" /> Occupied
                                    </span>
                                    <span className="font-black text-stone-900">{occupiedDesksReal}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0]/70">
                                    <span className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px]">
                                        <span className="w-2 h-2 rounded-full bg-stone-400" /> Vacant
                                    </span>
                                    <span className="font-black text-stone-900">{vacantDesksReal}</span>
                                </div>
                                {shiftDistribution.slice(0, 2).map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0]/70">
                                        <span className="flex items-center gap-1.5 text-stone-600 font-semibold text-[11px] truncate max-w-[90px]">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {s._id}
                                        </span>
                                        <span className="font-black text-stone-900">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Real Floor Occupancy Matrix from MongoDB */}
                        <div
                            className="lg:col-span-3 bg-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#10b981,#34d399,transparent)' }} />
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                        <IoBedOutline size={15} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm">Floor Occupancy</h3>
                                </div>
                                <Link to="/admin/floors" className="text-xs font-bold text-orange-600 hover:underline">Manage</Link>
                            </div>

                            <div className="space-y-3.5 my-auto">
                                {floorOccupancy.length === 0 ? (
                                    <div className="text-center py-6 text-stone-400 text-xs">
                                        <p>No floors configured yet.</p>
                                        <Link to="/admin/floors" className="text-orange-600 font-bold hover:underline mt-1 block">
                                            + Configure Floors
                                        </Link>
                                    </div>
                                ) : (
                                    floorOccupancy.map((fl, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-stone-800 font-bold">{fl.name}</span>
                                                <span className="text-stone-900 font-black">{fl.occupiedSeats}/{fl.totalSeats} ({fl.percentage}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#FAF6F0] border border-[#EDE8E0] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${fl.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-3 border-t border-[#EDE8E0] flex items-center justify-between text-xs text-stone-500">
                                <span className="font-medium">Configured Floors</span>
                                <span className="font-bold text-stone-900">{floorOccupancy.length} Floors Active</span>
                            </div>
                        </div>

                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 3: ALL ENTERPRISE CAMPUS MODULES (All 20 Cards)
                    ══════════════════════════════════════════════════════ */}
                    <div className="space-y-3.5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EDE8E0] shadow-2xs">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">Campus Management Modules</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
                                        {ALL_ADMIN_MODULES.length} Active Modules
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 mt-0.5 font-medium">Explore all library operations, financial ledgers, analytics, and administrative suites</p>
                            </div>

                            {/* Search & Category Filter Controls */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative flex-1 sm:w-56">
                                    <IoSearchOutline size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="text"
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                        placeholder="Search modules..."
                                        className="w-full pl-8 pr-7 py-2 bg-[#FAF6F0] border border-[#E2DBD2] rounded-xl text-xs text-[#0F172A] placeholder-stone-400 outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs"
                                    />
                                    {moduleSearch && (
                                        <button onClick={() => setModuleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">
                                            <IoClose size={13} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                                    {[
                                        { id: 'All', label: 'All (20)' },
                                        { id: 'Library Operations', label: 'Operations (10)' },
                                        { id: 'Analytics & Insights', label: 'Analytics (4)' },
                                        { id: 'Administration', label: 'Admin (6)' }
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedModuleCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                                selectedModuleCategory === cat.id
                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25'
                                                    : 'bg-[#F5F0EA] text-stone-600 hover:text-[#0F172A] hover:bg-[#EDE8E0]'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Module Cards Grid - Exact Student Panel Design */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
                            {filteredModules.map((mod, i) => (
                                <Link key={mod.id} to={mod.path} className="block">
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 + i * 0.02, type: 'spring', stiffness: 120 }}
                                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                        className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group bg-white"
                                        style={{
                                            border: `1.5px solid ${mod.color}25`,
                                            padding: '14px 13px 14px',
                                            minHeight: '124px',
                                            boxShadow: `0 2px 10px ${mod.color}10`,
                                            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = `${mod.color}60`;
                                            e.currentTarget.style.boxShadow = `0 8px 28px -4px ${mod.color}30`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = `${mod.color}25`;
                                            e.currentTarget.style.boxShadow = `0 2px 10px ${mod.color}10`;
                                        }}
                                    >
                                        {/* Top accent bar */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                            style={{ background: `linear-gradient(90deg, ${mod.color}, ${mod.color}60, transparent)` }}
                                        />

                                        {/* Ghost watermark */}
                                        <mod.icon
                                            size={56}
                                            className="absolute -bottom-1 -right-1 opacity-[0.05] transition-opacity group-hover:opacity-[0.10] pointer-events-none"
                                            style={{ color: mod.color }}
                                        />

                                        {/* Icon pill + Tag */}
                                        <div className="flex items-center justify-between mb-2.5 relative">
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110 shrink-0"
                                                style={{ background: `linear-gradient(135deg, ${mod.color}, ${mod.color}bb)` }}
                                            >
                                                <mod.icon size={16} className="text-white" />
                                            </div>
                                            <span
                                                className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border truncate max-w-[90px]"
                                                style={{
                                                    background: `${mod.color}15`,
                                                    color: mod.color,
                                                    borderColor: `${mod.color}35`
                                                }}
                                            >
                                                {mod.tag}
                                            </span>
                                        </div>

                                        {/* Text info */}
                                        <div className="mt-auto">
                                            <h4 className="text-[12.5px] font-bold leading-snug text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                                {mod.title}
                                            </h4>
                                            <p className="text-[10px] mt-0.5 font-medium leading-relaxed line-clamp-2 text-stone-500">
                                                {mod.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>

                        {filteredModules.length === 0 && (
                            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-8 text-center">
                                <p className="text-sm font-bold text-stone-700">No modules match "{moduleSearch}"</p>
                                <button
                                    onClick={() => { setModuleSearch(''); setSelectedModuleCategory('All'); }}
                                    className="mt-2 text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                                >
                                    Reset search filters
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 4: REAL TABLES & AUDIT STREAM (2 Columns)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                        {/* Recent Transactions Table (Real from Fee Collection) - Student Panel Design */}
                        <div
                            className="lg:col-span-7 bg-white rounded-2xl overflow-hidden relative"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#8b5cf6,#a78bfa,transparent)' }} />
                            
                            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EDE8E0]/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                                        <IoCashOutline size={15} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">Recent Transactions & Collections</h3>
                                        <p className="text-[11px] text-stone-500 font-medium">Live payment ledger from student accounts</p>
                                    </div>
                                </div>
                                <Link to="/admin/fees" className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">View All</Link>
                            </div>

                            <div className="overflow-x-auto px-4 sm:px-5 py-2">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[#EDE8E0] text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                                            <th className="pb-3 pt-2">Date</th>
                                            <th className="pb-3 pt-2">Student</th>
                                            <th className="pb-3 pt-2">Period / Shift</th>
                                            <th className="pb-3 pt-2">Amount</th>
                                            <th className="pb-3 pt-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EDE8E0]/70 text-stone-700">
                                        {recentTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-stone-400 text-xs font-medium">
                                                    No completed transactions recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            recentTransactions.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-[#FAF6F0]/60 transition-colors">
                                                    <td className="py-2.5 text-stone-500 font-medium text-[11px]">
                                                        {new Date(t.paidDate || t.updatedAt || t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td className="py-2.5 font-bold text-stone-900 text-xs">
                                                        {t.student?.name || 'Student'}
                                                    </td>
                                                    <td className="py-2.5 text-stone-500 text-xs">
                                                        {t.month && t.year ? `${t.month}/${t.year}` : (t.type || 'Standard Fee')}
                                                    </td>
                                                    <td className="py-2.5 font-black text-stone-900 text-xs">
                                                        ₹{(t.amount || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {t.status || 'Paid'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer eliminating awkward blank space */}
                            <div className="p-3 bg-[#FAF6F0] border-t border-[#EDE8E0] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-semibold text-stone-700">Today's Collections: ₹{(metrics.todayFeesCollected || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <Link to="/admin/fees" className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                    <span>Open Full Ledger</span>
                                    <IoChevronForward size={13} />
                                </Link>
                            </div>
                        </div>

                        {/* Real System Announcements & Notices from MongoDB - Student Panel Design */}
                        <div
                            className="lg:col-span-5 bg-white rounded-2xl overflow-hidden relative flex flex-col justify-between"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#f97316,#fb923c,transparent)' }} />
                            
                            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EDE8E0]/80">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                                        <IoMegaphoneOutline size={15} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">System Alerts & Notices</h3>
                                        <p className="text-[11px] text-stone-500 font-medium">Broadcasts to campus students</p>
                                    </div>
                                </div>
                                <Link to="/admin/notifications" className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">Broadcast</Link>
                            </div>

                            <div className="p-4 space-y-2.5 my-auto">
                                {displayAnnouncements.length === 0 ? (
                                    <div className="text-center py-6 text-stone-400 text-xs">
                                        <p>No active announcements broadcasted.</p>
                                        <Link to="/admin/notifications" className="text-orange-600 font-bold hover:underline mt-1 block">
                                            + Send Announcement
                                        </Link>
                                    </div>
                                ) : (
                                    displayAnnouncements.map((alert, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-[#FAF6F0] hover:bg-[#FAF3EA] border border-[#EDE8E0] transition-colors flex items-start gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600 mt-0.5 shrink-0">
                                                <IoMegaphoneOutline size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="text-xs font-bold text-stone-900 truncate">{alert.title}</p>
                                                    <span className="text-[10px] text-stone-400 font-medium shrink-0">
                                                        {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug line-clamp-2 font-medium">{alert.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 bg-[#FAF6F0] border-t border-[#EDE8E0] flex items-center justify-between text-xs">
                                <span className="text-stone-400 font-medium">Broadcaster Node: Main Server</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">Operational</span>
                            </div>
                        </div>

                    </div>

                    {/* ══════════════════════════════════════════════════════
                        ROW 5: REAL GROWTH & APNA LAKSHAY AI ASSISTANT (BETA)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8 items-start">

                        {/* Student Registration Growth (Real 6 Months from User createdAt) - Student Panel Design */}
                        <div
                            className="lg:col-span-5 bg-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#F97316,#FB923C,transparent)' }} />
                            
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                        <IoBarChartOutline size={15} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">Student Registration Growth</h3>
                                        <p className="text-[11px] text-stone-500 font-medium">New student enrolments (last 6 months)</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                    6 Months
                                </span>
                            </div>

                            {/* Bar Chart Representation */}
                            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
                                {monthlyGrowth.length === 0 ? (
                                    <div className="w-full text-center text-stone-400 text-xs my-auto">
                                        Calculating monthly registration trends...
                                    </div>
                                ) : (
                                    monthlyGrowth.map((bar, i) => {
                                        const maxGrowth = Math.max(1, ...monthlyGrowth.map(b => b.count || 0));
                                        const heightPct = bar.count > 0 ? Math.max(14, Math.round((bar.count / maxGrowth) * 100)) : 6;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                                <span className="text-[10px] font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {bar.count}
                                                </span>
                                                <div className="w-full bg-[#FAF6F0] rounded-t-xl overflow-hidden flex flex-col justify-end border border-[#EDE8E0]/60" style={{ height: '78%' }}>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t-xl transition-all duration-500 group-hover:from-orange-400 group-hover:to-amber-400"
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-bold text-stone-600">{bar.month}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-3 mt-2 border-t border-[#EDE8E0] flex items-center justify-between text-xs text-stone-500">
                                <span className="font-medium">Total Enrolled Roster</span>
                                <span className="font-bold text-stone-900">{metrics.totalStudents || 0} Registered</span>
                            </div>
                        </div>

                        {/* CAMPUS EXECUTIVE INTELLIGENCE - Student Panel Design */}
                        <div
                            className="lg:col-span-7 bg-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.06)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#0ea5e9,#38bdf8,transparent)' }} />

                            <div>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
                                            <IoTerminalOutline size={15} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm">Executive Intelligence Console</h3>
                                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">LIVE</span>
                                            </div>
                                            <p className="text-[11px] text-stone-500 font-medium">Query live campus records, attendance telemetry, and financial health</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAIModal(true)}
                                        className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        Fullscreen <IoArrowForward size={12} />
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
                                            className="px-2.5 py-1 rounded-xl bg-[#FAF6F0] hover:bg-orange-50 border border-[#EDE8E0] hover:border-orange-300 text-[11px] font-semibold text-stone-700 transition-all shadow-2xs text-left cursor-pointer"
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
                            className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden relative"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 24px 70px rgba(28,25,23,0.22)' }}
                        >
                            {/* 3px Student Panel top gradient accent bar */}
                            <div className="h-[3px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #F97316, #F59E0B, #EA580C)' }} />

                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-[#18130E] text-white flex items-center justify-between border-b border-[#2E261F]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-md">
                                        <IoTerminalOutline size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold text-base text-[#FAF6F0]">Executive Operations & Intelligence Console</h2>
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide">LIVE DB</span>
                                        </div>
                                        <p className="text-xs text-[#A89F91]">Direct conversational access to live database metrics</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    className="p-2 rounded-xl text-[#A89F91] hover:text-[#FAF6F0] hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {/* Chat Conversation History */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[#FAF6F0]">
                                {aiHistory.length === 0 && !aiAnswer ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
                                        <div className="w-16 h-16 rounded-2xl bg-white text-[#EA580C] border border-[#EDE8E0] flex items-center justify-center shadow-sm">
                                            <IoStatsChartOutline size={32} />
                                        </div>
                                        <h3 className="font-extrabold text-[#0F172A] text-base">How can I assist your operations today?</h3>
                                        <p className="text-xs text-[#786D62] leading-relaxed max-w-sm">
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
                                                    className="p-3 rounded-xl bg-white border border-[#EDE8E0] hover:border-orange-400 hover:shadow-md hover:bg-[#FFFDF9] text-xs font-semibold text-[#0F172A] hover:text-[#EA580C] text-left transition-all flex items-center justify-between cursor-pointer group"
                                                >
                                                    <span>{suggest}</span>
                                                    <IoArrowForward size={14} className="text-[#9E9287] group-hover:text-[#EA580C] group-hover:translate-x-0.5 transition-all" />
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
                                                            ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-tr-none shadow-md font-semibold'
                                                            : 'bg-white border border-[#EDE8E0] text-[#0F172A] rounded-tl-none shadow-sm w-full'
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
                            <div className="p-4 bg-white border-t border-[#EDE8E0]">
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
                                        className="flex-1 bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl px-4 py-3 text-xs font-medium text-[#0F172A] placeholder-[#9E9287] outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!modalAiQuestion.trim() || aiLoading}
                                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
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
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden relative"
                            style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 20px 60px rgba(28,25,23,0.18)' }}
                        >
                            {/* 3px Student Panel top gradient accent bar */}
                            <div className="h-[3px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #F97316, #F59E0B, #EA580C)' }} />

                            <div className="p-4 border-b border-[#EDE8E0] flex items-center gap-3 bg-[#FAF6F0]">
                                <IoSearchOutline size={20} className="text-[#EA580C]" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={commandSearch}
                                    onChange={(e) => setCommandSearch(e.target.value)}
                                    placeholder="Search any module, operation, or log (20 available)..."
                                    className="w-full text-sm font-semibold outline-none text-[#0F172A] placeholder-[#9E9287] bg-transparent"
                                />
                                <kbd className="text-[10px] font-bold text-[#786D62] bg-white border border-[#EDE8E0] px-2 py-0.5 rounded-md shadow-2xs">ESC</kbd>
                            </div>
                            <div className="p-3 max-h-80 overflow-y-auto space-y-1 text-xs custom-scrollbar bg-white">
                                <p className="px-3 py-1.5 text-[10px] font-bold text-[#8C7E72] uppercase tracking-wider">
                                    {commandSearch ? `Matching Modules (${paletteModules.length})` : 'All Campus Modules (20)'}
                                </p>
                                {paletteModules.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => { navigate(item.path); setShowCommandPalette(false); setCommandSearch(''); }}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#FAF6F0] border border-transparent hover:border-[#EDE8E0] text-[#0F172A] transition-all text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/5 shadow-2xs"
                                                style={{ background: item.bg, color: item.color }}
                                            >
                                                <item.icon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-xs text-[#0F172A] group-hover:text-orange-600 transition-colors block truncate">{item.title}</span>
                                                <span className="text-[11px] text-[#786D62] truncate block">{item.desc}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#786D62] bg-[#FAF6F0] border border-[#EDE8E0] px-2.5 py-0.5 rounded-full shrink-0 ml-2 group-hover:bg-white group-hover:border-orange-200 group-hover:text-orange-700 transition-colors">
                                            {item.tag}
                                        </span>
                                    </button>
                                ))}
                                {paletteModules.length === 0 && (
                                    <p className="text-center py-6 text-[#786D62] text-xs">No matching modules found for "{commandSearch}".</p>
                                )}
                            </div>
                            <div className="p-3 bg-[#FAF6F0] border-t border-[#EDE8E0] flex justify-between items-center text-[11px] text-[#786D62]">
                                <span>Press ESC or click outside to close</span>
                                <button onClick={() => setShowCommandPalette(false)} className="text-orange-600 font-bold hover:text-orange-700 hover:underline cursor-pointer">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminDashboard;
