import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoShieldCheckmarkOutline, IoCalendarOutline, IoPersonOutline,
    IoCashOutline, IoNotificationsOutline, IoDocumentTextOutline,
    IoSearchOutline, IoLogOutOutline, IoChevronForwardOutline,
    IoLockClosedOutline, IoBedOutline, IoIdCard,
    IoAlertCircleOutline, IoRefreshOutline,
    IoGridOutline, IoTimeOutline, IoCheckmarkCircle,
    IoScanOutline, IoChatbubblesOutline, IoBarChartOutline,
    IoRibbonOutline, IoTrophy, IoWalletOutline, IoMegaphoneOutline, IoSparklesOutline, IoPulseOutline,
    IoSettingsOutline, IoKey, IoCheckmarkCircleOutline, IoCheckmarkDoneOutline, IoInformationCircleOutline,
} from 'react-icons/io5';

const fmt12h = (t) => {
    if (!t || !t.includes(':')) return t || '';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (isNaN(h)) return t;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${h12}:00 ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/* ─── All modules — mirrors AdminDashboard exactly ─────────────────────────── */
const PERM_CARDS = {
    /* ── Library Operations ───────────────────────────────── */
    students: {
        title: 'Student Directory',
        path: '/admin/students',
        icon: IoPersonOutline,
        color: '#2563eb',
        desc: 'Student rosters, profiles, seat allocations & documents',
        tag: 'Roster',
    },
    floors: {
        title: 'Floor & Seat Matrix',
        path: '/admin/floors',
        icon: IoBedOutline,
        color: '#10b981',
        desc: 'Visual desk layout, hall occupancy, rooms & seat pricing',
        tag: 'Seats',
    },
    attendance: {
        title: 'Attendance Tracking',
        path: '/admin/attendance',
        icon: IoCalendarOutline,
        color: '#f59e0b',
        desc: 'Daily check-in logs, biometric punches & absent tracking',
        tag: 'Daily Log',
    },
    fees: {
        title: 'Fee Management',
        path: '/admin/fees',
        icon: IoCashOutline,
        color: '#8b5cf6',
        desc: 'Automated billing, dues settlement & physical receipts',
        tag: 'Finance',
    },
    shifts: {
        title: 'Shift Operations',
        path: '/admin/shifts',
        icon: IoTimeOutline,
        color: '#06b6d4',
        desc: 'Configure shift timings, hourly quotas & batch schedules',
        tag: 'Timings',
    },
    vacant_seats: {
        title: 'Vacant Seats',
        path: '/admin/vacant-seats',
        icon: IoSearchOutline,
        color: '#0d9488',
        desc: 'Real-time vacant desks matrix across shifts and rooms',
        tag: 'Available',
    },
    kiosk: {
        title: 'QR Entry Kiosk',
        path: '/admin/kiosk',
        icon: IoScanOutline,
        color: '#ec4899',
        desc: 'Full-screen entrance kiosk for instant QR code attendance',
        tag: 'Kiosk',
    },
    notifications: {
        title: 'Notice & Announcements',
        path: '/admin/notifications',
        icon: IoMegaphoneOutline,
        color: '#f97316',
        desc: 'Broadcast alerts, exam updates & campus announcements',
        tag: 'Broadcast',
    },
    chat: {
        title: 'Discussion Rooms',
        path: '/admin/chat',
        icon: IoChatbubblesOutline,
        color: '#6366f1',
        desc: 'Real-time subject study rooms & community chat groups',
        tag: 'Community',
    },
    chat_history: {
        title: 'Student Chat History',
        path: '/admin/chat-history',
        icon: IoDocumentTextOutline,
        color: '#475569',
        desc: 'Audit AI doubt queries, chat transcripts & moderation',
        tag: 'Audit',
    },
    id_cards: {
        title: 'Student ID Cards',
        path: '/admin/students?tab=id-cards',
        icon: IoIdCard,
        color: '#a855f7',
        desc: 'Generate, verify & print official library ID cards',
        tag: 'Credentials',
    },
    requests: {
        title: 'Requests',
        path: '/admin/requests',
        icon: IoShieldCheckmarkOutline,
        color: '#e11d48',
        desc: 'Process seat shifting, student approvals & requests',
        tag: 'Approvals',
    },

    /* ── Analytics & Insights ─────────────────────────────── */
    analytics: {
        title: 'Reports & Analytics',
        path: '/admin/analytics',
        icon: IoBarChartOutline,
        color: '#2563eb',
        desc: 'In-depth charts, revenue forecasting & library growth',
        tag: 'Executive',
    },
    activities: {
        title: 'Student Activities & XP',
        path: '/admin/activities',
        icon: IoRibbonOutline,
        color: '#e11d48',
        desc: 'Gamification leaderboard, study streaks & student XP',
        tag: 'Streaks',
    },
    ai_activity: {
        title: 'AI Study Logs',
        path: '/admin/ai-activity',
        icon: IoTrophy,
        color: '#d97706',
        desc: 'Telemetry on AI Doubt Solver, quiz tests & study planner',
        tag: 'Telemetry',
    },
    referral_wallet: {
        title: 'Referral & Wallet',
        path: '/admin/referral-wallet',
        icon: IoWalletOutline,
        color: '#059669',
        desc: 'Student referral payouts, coin ledger & reward balance',
        tag: 'Rewards',
    },

    /* ── Administration & Governance ──────────────────────── */
    history: {
        title: 'Action History Logs',
        path: '/admin/history',
        icon: IoTimeOutline,
        color: '#0891b2',
        desc: 'Immutable audit trail of staff actions, edits & deletes',
        tag: 'Logs',
    },
    password_activity: {
        title: 'Password Activity',
        path: '/admin/password-activity',
        icon: IoKey,
        color: '#dc2626',
        desc: 'Live security log of student password resets & credential updates',
        tag: 'Security',
    },
    manage_cards: {
        title: 'Manage Cards & Layout',
        path: '/admin/manage-cards',
        icon: IoGridOutline,
        color: '#7c3aed',
        desc: 'Customize student app cards order, visibility & AI credits',
        tag: 'Student App',
    },
    settings: {
        title: 'System Settings',
        path: '/admin/settings',
        icon: IoSettingsOutline,
        color: '#334155',
        desc: 'Campus maintenance mode, geofence & attendance rules',
        tag: 'System',
    },
};

const ALL_PERMS = Object.keys(PERM_CARDS);

const StatCard = ({ label, value, sub, badge, gradient, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35, ease: 'easeOut' }}
        className="relative rounded-2xl p-4 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
        style={{
            background: '#FFFFFF',
            border: '1.5px solid #EDE8E0',
            boxShadow: '0 4px 20px rgba(180,120,60,0.06)'
        }}
    >
        {/* Top 3px Accent Gradient */}
        <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient}`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786D62]">
                {label}
            </span>
            <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
                <Icon size={15} />
            </div>
        </div>

        {/* Value */}
        <div className="my-1">
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight leading-tight">
                {value}
            </p>
        </div>

        {/* Bottom Sub Info */}
        <div className="flex items-center justify-between gap-1 mt-1 text-[11px] min-h-[22px] flex-wrap">
            {sub ? (
                typeof sub === 'string' ? <span className="font-semibold text-[#786D62]">{sub}</span> : sub
            ) : <span />}
            {badge && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/90 shrink-0 ml-auto shadow-2xs">
                    {badge}
                </span>
            )}
        </div>
    </motion.div>
);

const SubAdminDashboard = () => {
    const { user, logout } = useAuth();
    const permissions = user?.permissions || [];
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const fetchStats = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [liveRes, stdRes] = await Promise.allSettled([
                api.get('/admin/dashboard/live'),
                api.get('/admin/dashboard')
            ]);
            let s = {};
            if (stdRes.status === 'fulfilled' && stdRes.value.data?.data) {
                s = { ...s, ...stdRes.value.data.data };
            }
            if (liveRes.status === 'fulfilled' && liveRes.value.data?.metrics) {
                s = {
                    ...s,
                    ...liveRes.value.data.metrics,
                    acVacantSeats: s.acVacantSeats ?? 0,
                    nonAcVacantSeats: s.nonAcVacantSeats ?? 0
                };
            }
            setStats(s);
        } catch (e) {
            console.error('Failed to fetch sub-admin stats:', e);
        } finally {
            setLoadingStats(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    // ── Institutional Holiday Gate ("Got It" / "Remind Later" Modal & Banner in IST Asia/Kolkata) ──
    const HOLIDAY_ACK_KEY = 'lms_subadmin_ack_holidays_v1';
    const [acknowledgedHolidays, setAcknowledgedHolidays] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('lms_subadmin_ack_holidays_v1') || '{}');
        } catch (_) {
            return {};
        }
    });
    const [forceShowHolidayModal, setForceShowHolidayModal] = useState(false);
    const [snoozedHolidayModal, setSnoozedHolidayModal] = useState(false);
    const [holidayClockTick, setHolidayClockTick] = useState(() => Date.now());

    // Live 30-second tick so expired holidays (by IST date or partial endTime) auto-remove while dashboard is open
    useEffect(() => {
        const timer = setInterval(() => {
            setHolidayClockTick(Date.now());
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    const toISTDateStr = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        } catch (_) {
            const istShifted = new Date(new Date(d).getTime() + 330 * 60 * 1000);
            return istShifted.toISOString().slice(0, 10);
        }
    };

    const getISTMinutesNow = (ts = Date.now()) => {
        try {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).formatToParts(new Date(ts));
            const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10) % 24;
            const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
            return h * 60 + m;
        } catch (_) {
            const istShifted = new Date(ts + 330 * 60 * 1000);
            return istShifted.getUTCHours() * 60 + istShifted.getUTCMinutes();
        }
    };

    const todayISTStr = toISTDateStr(holidayClockTick);
    const nowISTMins = getISTMinutesNow(holidayClockTick);

    const getHolidayAckId = (h) => `${h._id}_${h.updatedAt || h.date || ''}`;

    // Filter activeHolidays strictly in IST (Asia/Kolkata):
    // 1. Remove any holiday whose IST date is in the past (< todayISTStr) — e.g. on 18th IST, 17th is removed and 19th is kept.
    // 2. Remove today's partial holiday once current IST time reaches/passes endTime (nowISTMins >= endTotalMins).
    const activeHolidaysList = (stats?.activeHolidays || []).filter((h) => {
        const hDateIST = h.dateIST || toISTDateStr(h.date);
        if (hDateIST < todayISTStr) return false;
        if (hDateIST === todayISTStr && h.isPartial && h.endTime && h.endTime.includes(':')) {
            const [endH, endM] = h.endTime.split(':').map(Number);
            if (!isNaN(endH)) {
                const endTotalMins = endH * 60 + (endM || 0);
                if (nowISTMins >= endTotalMins) return false;
            }
        }
        return true;
    });

    const activeTodayHoliday = activeHolidaysList.find(
        (h) => (h.dateIST || toISTDateStr(h.date)) === todayISTStr
    ) || null;

    const unacknowledgedHolidays = activeHolidaysList.filter(h => !acknowledgedHolidays[getHolidayAckId(h)]);
    const showHolidayGateModal = (!snoozedHolidayModal && unacknowledgedHolidays.length > 0) || (forceShowHolidayModal && activeHolidaysList.length > 0);
    const holidaysToDisplay = unacknowledgedHolidays.length > 0 ? unacknowledgedHolidays : activeHolidaysList;

    // Group multi-day holidays (by batchId or same name + timing) for clean presentation
    const groupedHolidaysToDisplay = (() => {
        const groups = [];
        const map = new Map();
        holidaysToDisplay.forEach((h) => {
            const key = h.batchId || `${h.name}__${h.isPartial ? `${h.startTime}-${h.endTime}` : 'full'}__${h.description || ''}`;
            if (!map.has(key)) {
                const group = {
                    key,
                    name: h.name,
                    description: h.description || '',
                    isPartial: !!h.isPartial,
                    startTime: h.startTime || null,
                    endTime: h.endTime || null,
                    dates: [h.date],
                    items: [h]
                };
                map.set(key, group);
                groups.push(group);
            } else {
                const g = map.get(key);
                g.dates.push(h.date);
                g.items.push(h);
            }
        });
        return groups;
    })();

    const handleRemindLaterHolidays = () => {
        setSnoozedHolidayModal(true);
        setForceShowHolidayModal(false);
    };

    const handleAcknowledgeHolidays = () => {
        const nextAck = { ...acknowledgedHolidays };
        activeHolidaysList.forEach((h) => {
            nextAck[getHolidayAckId(h)] = true;
        });
        setAcknowledgedHolidays(nextAck);
        setSnoozedHolidayModal(false);
        setForceShowHolidayModal(false);
        try {
            localStorage.setItem(HOLIDAY_ACK_KEY, JSON.stringify(nextAck));
        } catch (_) {}
    };

    const allowedCards = permissions.map(p => PERM_CARDS[p]).filter(Boolean);
    const lockedCards  = ALL_PERMS.filter(p => !permissions.includes(p)).map(p => PERM_CARDS[p]).filter(Boolean);
    const initials = (user?.name || 'S A').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const greetingHour = currentTime.getHours();
    const greeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening';
    const timeStr = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loadingStats) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: '#FAF6F0', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
                <div className="relative flex flex-col items-center gap-5">
                    <div className="relative w-20 h-20">
                        <svg className="animate-spin absolute inset-0 w-full h-full" viewBox="0 0 96 96" fill="none">
                            <circle cx="48" cy="48" r="44" stroke="#FDDCAE" strokeWidth="4" />
                            <circle cx="48" cy="48" r="44"
                                stroke="#F97316" strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="138 138"
                                strokeDashoffset="104" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                                <IoShieldCheckmarkOutline size={22} className="text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-base font-black text-[#0F172A]">
                            Sub-Admin Portal
                        </h3>
                        <p className="text-xs font-semibold text-[#786D62]">Loading authorized modules & ledger telemetry...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative text-[#0F172A]" style={{ background: '#FAF6F0', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            <style>{`
                @keyframes shimmer-ltr {
                    0% { background-position: 0% center; }
                    100% { background-position: -200% center; }
                }
                .dash-blob {
                    position: fixed; border-radius: 50%; filter: blur(120px); pointer-events: none; z-index: 0;
                }
                .dash-blob-1 {
                    width: 500px; height: 500px; top: -120px; left: -150px; background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%);
                }
                .dash-blob-2 {
                    width: 420px; height: 420px; top: 30%; right: -120px; background: radial-gradient(circle, rgba(251,146,60,0.05) 0%, transparent 70%);
                }
            `}</style>

            {/* Ambient Background Blobs */}
            <div className="dash-blob dash-blob-1" />
            <div className="dash-blob dash-blob-2" />

            {/* Ambient Dot Grid */}
            <div className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.075) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            {/* ── Blocking Institutional Holiday Notice Gate Modal ("Got It" / "Remind Later") ── */}
            <AnimatePresence>
                {showHolidayGateModal && (
                    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                            className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-[#EDE8E0] max-h-[90vh] flex flex-col"
                        >
                            {/* Top Institutional Accent Bar */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
                            <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-amber-100/60 blur-2xl pointer-events-none" />

                            {/* Modal Header */}
                            <div className="flex items-start gap-3.5 mb-5 relative z-10 shrink-0">
                                <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 text-orange-600 shadow-sm">
                                    <IoCalendarOutline size={26} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                            Official Library Notice
                                        </span>
                                        {activeTodayHoliday && (
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                                Active Today
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-gray-900 font-black text-xl tracking-tight leading-snug">
                                        {groupedHolidaysToDisplay.length === 1
                                            ? groupedHolidaysToDisplay[0].name
                                            : 'Declared Library Holiday Schedule'}
                                    </h3>
                                    <p className="text-xs font-semibold text-[#9B7B5A] mt-0.5">
                                        Please review the holiday operational details below to access the Sub-Admin Console
                                    </p>
                                </div>
                            </div>

                            {/* Holiday Cards Body */}
                            <div className="overflow-y-auto flex-1 pr-1 space-y-3.5 my-1">
                                {groupedHolidaysToDisplay.map((grp) => {
                                    const todayIso = todayISTStr;
                                    const dateSummaryStr = grp.dates
                                        .map((dt) =>
                                            new Date(dt).toLocaleDateString('en-IN', {
                                                timeZone: 'Asia/Kolkata',
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                        )
                                        .join(' | ');
                                    return (
                                        <div
                                            key={grp.key}
                                            className="rounded-2xl p-4 border space-y-3.5"
                                            style={{ background: '#FFFAF5', borderColor: '#FDDCAE' }}
                                        >
                                            {/* Always visible Occasion / Festival Header */}
                                            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-orange-200/70">
                                                <div>
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9B7B5A] block mb-1">
                                                        Occasion / Festival · अवसर / पर्व
                                                    </span>
                                                    <h4 className="font-black text-sm sm:text-base text-gray-900 flex items-center gap-1.5 flex-wrap">
                                                        <span className="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-800 border border-orange-300 shadow-2xs">
                                                            {grp.name}
                                                        </span>
                                                    </h4>
                                                </div>
                                                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${
                                                    grp.isPartial
                                                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                        : 'bg-rose-100 text-rose-700 border-rose-200'
                                                }`}>
                                                    {grp.isPartial ? 'Partial Timing' : 'Full Day Closure'}
                                                </span>
                                            </div>

                                            {/* Operational Status Box with Festival Name & Timing Highlighted */}
                                            <div className={`p-3.5 rounded-xl border ${
                                                grp.isPartial
                                                    ? 'bg-amber-50/90 border-amber-200'
                                                    : 'bg-rose-50/80 border-rose-200'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <IoTimeOutline size={16} className={grp.isPartial ? 'text-amber-700 shrink-0' : 'text-rose-600 shrink-0'} />
                                                    <span className={`text-xs font-black uppercase tracking-wider ${
                                                        grp.isPartial ? 'text-amber-900' : 'text-rose-800'
                                                    }`}>
                                                        {grp.isPartial
                                                            ? `Partial Timing Closure: ${fmt12h(grp.startTime)} to ${fmt12h(grp.endTime)}`
                                                            : `Full Day Library Closure — ${grp.name}`}
                                                    </span>
                                                </div>
                                                <p className={`text-xs font-semibold leading-relaxed ${
                                                    grp.isPartial ? 'text-amber-900' : 'text-rose-800'
                                                }`}>
                                                    {grp.isPartial ? (
                                                        <>
                                                            Due to <span className="px-1.5 py-0.5 rounded bg-white text-orange-800 border border-amber-300 font-extrabold">{grp.name}</span>, the library will remain non-functional from <span className="px-1.5 py-0.5 rounded bg-white text-amber-900 border border-amber-300 font-extrabold">{fmt12h(grp.startTime)} to {fmt12h(grp.endTime)}</span>. Regular library study sessions remain operational outside this window.
                                                        </>
                                                    ) : (
                                                        <>
                                                            On account of <span className="px-1.5 py-0.5 rounded bg-white text-rose-800 border border-rose-300 font-extrabold">{grp.name}</span>, the library will observe a <span className="px-1.5 py-0.5 rounded bg-white text-rose-800 border border-rose-300 font-extrabold">Full Day Closure</span> on the scheduled holiday date(s).
                                                        </>
                                                    )}
                                                </p>
                                            </div>

                                            {/* Scheduled Dates & Days */}
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9B7B5A] mb-1.5">
                                                    Scheduled Date{grp.dates.length > 1 ? `s (${grp.dates.length} Days)` : ''} (IST)
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {grp.dates.map((dt, idx) => {
                                                        const dObj = new Date(dt);
                                                        const dIso = toISTDateStr(dObj);
                                                        const isTodayDate = dIso === todayIso;
                                                        return (
                                                            <span
                                                                key={idx}
                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                                    isTodayDate
                                                                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                                                        : 'bg-white text-gray-800 border-[#EDE8E0]'
                                                                }`}
                                                            >
                                                                <IoCalendarOutline size={12} />
                                                                {dObj.toLocaleDateString('en-IN', {
                                                                    timeZone: 'Asia/Kolkata',
                                                                    weekday: 'short',
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                                {isTodayDate && (
                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-white/20 text-white">
                                                                        Today
                                                                    </span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* AI-Structured Institutional Notice / Description (Bilingual + Highlighted Festival Name, Date & Time) */}
                                            {grp.description && (() => {
                                                const escapedName = String(grp.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                const namePart = escapedName ? `|${escapedName}` : '';
                                                const highlightRegex = new RegExp(
                                                    `(\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\\s+\\d{4}\\b|\\b\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\\s+\\d{4}\\b|\\b\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)(?:\\s*(?:to|–|-|से)\\s*\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm))?\\b|\\bFull Day(?: Library)? Closure\\b|पूर्ण दिवस अवकाश${namePart})`,
                                                    'gi'
                                                );
                                                const renderWithHighlights = (text) => {
                                                    const parts = String(text || '').split(highlightRegex);
                                                    return parts.map((part, pIdx) =>
                                                        pIdx % 2 === 1 && part ? (
                                                            <span
                                                                key={pIdx}
                                                                className="inline px-1.5 py-0.5 mx-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]"
                                                            >
                                                                {part}
                                                            </span>
                                                        ) : (
                                                            <span key={pIdx}>{part}</span>
                                                        )
                                                    );
                                                };

                                                // Strip any past/expired dates from multi-day batch descriptions (e.g. on 18th IST, remove 17th and keep 19th)
                                                const dateTokenRegex = /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+\d{4}\b/gi;
                                                const safeDesc = String(grp.description || '')
                                                    .replace(/व्य\uFFFD+स्थित/g, 'व्यवस्थित')
                                                    .replace(/सामग्र\uFFFD+/g, 'सामग्री')
                                                    .replace(/\uFFFD+/g, '')
                                                    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, '-')
                                                    .replace(dateTokenRegex, (matchedDateStr) => {
                                                        const parsed = new Date(matchedDateStr);
                                                        if (!isNaN(parsed.getTime()) && toISTDateStr(parsed) < todayIso) {
                                                            return '__EXPIRED_DATE__';
                                                        }
                                                        return matchedDateStr;
                                                    })
                                                    .replace(/__EXPIRED_DATE__\s*(?:,\s*|\s+and\s+|\s+एवं\s+|\s+तथा\s+|\s*\|\s*)/gi, '')
                                                    .replace(/(?:,\s*|\s+and\s+|\s+एवं\s+|\s+तथा\s+|\s*\|\s*)__EXPIRED_DATE__/gi, '')
                                                    .replace(/__EXPIRED_DATE__/g, dateSummaryStr);
                                                const blocks = safeDesc.split('---').map(b => b.trim()).filter(Boolean);
                                                return (
                                                    <div className="space-y-2.5">
                                                        {blocks.map((blockText, bIdx) => (
                                                            <div
                                                                key={bIdx}
                                                                className="p-3.5 rounded-xl bg-white border border-[#EDE8E0] space-y-2"
                                                            >
                                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <IoDocumentTextOutline size={13} className="text-orange-600" />
                                                                        <p className="text-[10px] font-black uppercase tracking-wider text-[#9B7B5A]">
                                                                            {bIdx === 0
                                                                                ? 'Official Notice Summary (English)'
                                                                                : 'हिंदी आधिकारिक सूचना (Hindi Version)'}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                                                        {grp.name}
                                                                    </span>
                                                                </div>

                                                                {/* Intro sentence with Festival Name, Date & Timing highlighted */}
                                                                <p className="text-xs font-medium text-gray-700 leading-relaxed pb-1.5 border-b border-dashed border-orange-200/70">
                                                                    {bIdx === 0 ? (
                                                                        grp.isPartial ? (
                                                                            <>
                                                                                Please be informed that <strong>Apna Lakshay Library</strong> will remain non-functional from <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{fmt12h(grp.startTime)} to {fmt12h(grp.endTime)}</span> on <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{dateSummaryStr}</span> due to <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{grp.name}</span>.
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                Please be informed that <strong>Apna Lakshay Library</strong> will observe a <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">Full Day Closure</span> on <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{dateSummaryStr}</span> on the occasion of <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{grp.name}</span>.
                                                                            </>
                                                                        )
                                                                    ) : (
                                                                        grp.isPartial ? (
                                                                            <>
                                                                                आपको सूचित किया जाता है कि <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{grp.name}</span> के अवसर पर दिनांक <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{dateSummaryStr}</span> को पुस्तकालय में सेवाएं <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{fmt12h(grp.startTime)} से {fmt12h(grp.endTime)}</span> तक आंशिक रूप से बंद रहेंगी।
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                आपको सूचित किया जाता है कि <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{grp.name}</span> के अवसर पर दिनांक <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">{dateSummaryStr}</span> को पुस्तकालय में <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-300 font-extrabold text-[11px]">पूर्ण दिवस अवकाश (Full Day Closure)</span> रहेगा।
                                                                            </>
                                                                        )
                                                                    )}
                                                                </p>

                                                                <div className="space-y-1.5 pt-0.5">
                                                                    {blockText
                                                                        .split('\n')
                                                                        .map(line => line.trim())
                                                                        .filter(Boolean)
                                                                        .map((line, lIdx) => {
                                                                            const cleaned = line.replace(/^[•\-*]\s*/, '');
                                                                            const colonIdx = cleaned.indexOf(':');
                                                                            if (colonIdx > 0 && colonIdx < 36) {
                                                                                const label = cleaned.slice(0, colonIdx);
                                                                                const rest = cleaned.slice(colonIdx + 1).trim();
                                                                                return (
                                                                                    <div key={lIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                                                                        <p className="text-gray-700 font-medium">
                                                                                            <span className="font-extrabold text-gray-900">{label}: </span>
                                                                                            {renderWithHighlights(rest)}
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <p key={lIdx} className="text-xs font-medium text-gray-700 leading-relaxed">
                                                                                    {renderWithHighlights(cleaned)}
                                                                                </p>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })}

                                {/* Neutral Attendance Assurance Policy Card */}
                                <div className="rounded-2xl p-4 bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
                                        <IoCheckmarkCircleOutline size={18} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                            Attendance Percentage Protected (Neutral Policy)
                                        </h5>
                                        <p className="text-xs text-emerald-800 font-medium leading-relaxed mt-0.5">
                                            Student attendance percentages remain completely unchanged — neither reduced nor increased — if a student is absent on a declared holiday. Any student who attends and marks attendance (via self or staff) is counted as Present normally.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Remind Later & Got It CTA Buttons */}
                            <div className="pt-4 mt-3 border-t border-[#EDE8E0] shrink-0 grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleRemindLaterHolidays}
                                    className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-[#78350F] bg-[#FFF5EE] hover:bg-[#FEEBD8] border border-[#FDDCAE] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <IoTimeOutline size={18} className="text-orange-600 shrink-0" />
                                    <span>Remind Later</span>
                                </button>
                                <button
                                    onClick={handleAcknowledgeHolidays}
                                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] hover:opacity-95 cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                        boxShadow: '0 8px 24px rgba(234,88,12,0.32)'
                                    }}
                                >
                                    <IoCheckmarkDoneOutline size={18} className="shrink-0" />
                                    <span>Got It</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════
                PRIMARY TOP NAVIGATION BAR (Matching Primary Design)
            ══════════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-40 backdrop-blur-xl shadow-2xs"
                style={{
                    background: 'rgba(250, 246, 240, 0.94)',
                    borderBottom: '1.5px solid #EDE8E0'
                }}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand Left */}
                    <div className="flex items-center gap-3 select-none min-w-0">
                        <img
                            src="/app-icon-192.png"
                            alt="Apna Lakshay"
                            className="w-8 h-8 rounded-xl object-contain shadow-sm shrink-0"
                        />
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-black text-base tracking-tight truncate hidden xs:inline-block" style={{
                                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 20%, #fb923c 40%, #f97316 70%, #ea580c 100%)',
                                backgroundSize: '300% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'shimmer-ltr 3s linear infinite',
                            }}>
                                Apna Lakshay
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200/90 text-orange-700 shrink-0">
                                Sub-Admin Portal
                            </span>
                        </div>
                    </div>

                    {/* Nav Right: Time HUD, Profile, Refresh & Logout */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Live Shift Clock HUD */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#EDE8E0] bg-white/80 shadow-2xs text-[11px] font-bold text-[#786D62]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{timeStr}</span>
                        </div>

                        {/* Refresh Stats Button */}
                        <button
                            onClick={() => fetchStats(true)}
                            className="p-2 rounded-xl text-stone-500 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer shadow-2xs"
                            style={{ border: '1.5px solid #EDE8E0', background: '#FFFFFF' }}
                            title="Refresh Dashboard Data"
                        >
                            <IoRefreshOutline size={17} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                        </button>

                        {/* Profile Pill */}
                        <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-white border border-[#EDE8E0] shadow-2xs select-none">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-orange-700 bg-orange-100 shrink-0 border border-orange-200">
                                {initials}
                            </div>
                            <div className="hidden sm:block text-left min-w-0">
                                <p className="text-xs font-black text-[#0F172A] truncate max-w-[130px] leading-tight">
                                    {user?.name || 'Sub-Admin'}
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-600 leading-none">
                                    Staff Panelist
                                </p>
                            </div>
                        </div>

                        {/* Logout Button (Triggers Universal Confirmation Modal) */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => logout()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 rounded-xl transition-all shadow-2xs cursor-pointer"
                            style={{ border: '1.5px solid #FECACA' }}
                            title="Log Out of Sub-Admin Portal"
                        >
                            <IoLogOutOutline size={16} />
                            <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════
                MAIN DASHBOARD CONTENT (max-w-6xl primary grid)
            ══════════════════════════════════════════════════════════ */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">

                {/* -- ACTIVE / UPCOMING HOLIDAY SCHEDULE BANNER -- */}
                {activeHolidaysList.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)',
                            border: '1.5px solid #FDE68A',
                            boxShadow: '0 4px 18px rgba(245,158,11,0.10)',
                        }}
                    >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500 text-white shadow-xs">
                                <IoCalendarOutline size={20} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                                        {activeTodayHoliday ? "Today's Holiday Notice" : 'Upcoming Holiday Notice'}
                                    </span>
                                    <span className="text-sm font-black text-gray-900 truncate">
                                        {(activeTodayHoliday || activeHolidaysList[0]).name}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-amber-900/90 mt-0.5">
                                    {(() => {
                                        const primary = activeTodayHoliday || activeHolidaysList[0];
                                        const formattedActiveDates = activeHolidaysList
                                            .slice(0, 3)
                                            .map(h => new Date(h.date).toLocaleDateString('en-IN', {
                                                timeZone: 'Asia/Kolkata',
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short'
                                            }))
                                            .join(' & ');
                                        const moreSuffix = activeHolidaysList.length > 3 ? ` (+${activeHolidaysList.length - 3} more)` : '';
                                        const timingLabel = primary.isPartial
                                            ? `Library non-functional from ${fmt12h(primary.startTime)} to ${fmt12h(primary.endTime)}`
                                            : 'Full Day Library Closure';
                                        return `${formattedActiveDates}${moreSuffix} · ${timingLabel} · Attendance % Protected`;
                                    })()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setForceShowHolidayModal(true)}
                            className="shrink-0 self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-black text-amber-900 bg-white hover:bg-amber-50 border border-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                            <IoInformationCircleOutline size={15} />
                            <span>Holiday Details</span>
                        </button>
                    </motion.div>
                )}

                {/* ─── Hero Welcome Card (Primary Warm Architecture) ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative rounded-2xl p-5 sm:p-6 overflow-hidden transition-all"
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #EDE8E0',
                        boxShadow: '0 4px 24px rgba(180,120,60,0.07)'
                    }}
                >
                    {/* Left Accent Bar */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl"
                        style={{ background: 'linear-gradient(180deg, #F97316, #FB923C, transparent)' }}
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            {/* Avatar Badge */}
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md shadow-orange-500/25 shrink-0"
                                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                                {initials}
                            </div>

                            {/* Greeting & Meta */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                        Sub-Admin Console
                                    </span>
                                    <span className="text-[11px] font-semibold text-[#786D62]">
                                        {dateStr}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight truncate">
                                    {greeting}, {user?.name?.split(' ')[0] || 'Staff'}!
                                </h1>
                                <p className="text-xs font-medium text-[#786D62] mt-0.5">
                                    {allowedCards.length > 0
                                        ? <>You have access to <span className="font-bold text-[#0F172A]">{allowedCards.length} module{allowedCards.length !== 1 ? 's' : ''}</span>. <span className="text-stone-400">{lockedCards.length} locked by admin.</span></>
                                        : <span className="text-amber-700 font-semibold">No modules enabled yet — contact the Super Admin to assign permissions.</span>
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Status Badges on Right */}
                        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold shadow-2xs">
                                <IoCheckmarkCircle size={15} className="text-emerald-600" />
                                <span>{allowedCards.length} Active</span>
                            </div>
                            {lockedCards.length > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs font-bold shadow-2xs">
                                    <IoLockClosedOutline size={13} />
                                    <span>{lockedCards.length} Locked</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ─── Executive Operational Metrics (Primary Grid) ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <StatCard
                        label="Seats Occupied"
                        value={`${stats?.occupiedSeats || 0} / ${stats?.totalSeats || 0}`}
                        sub={
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-1.5 py-0.2 rounded text-[10px]">
                                    AC: {stats?.acVacantSeats ?? 0}
                                </span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded text-[10px]">
                                    Non-AC: {stats?.nonAcVacantSeats ?? 0}
                                </span>
                                <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-1.5 py-0.2 rounded text-[10px]">
                                    Active Scholars: {stats?.activeStudents ?? 0}
                                </span>
                            </div>
                        }
                        gradient="from-emerald-500 to-teal-500"
                        icon={IoBedOutline}
                        delay={0.05}
                    />

                    <StatCard
                        label="Fees Collected"
                        value={`₹${(stats?.feesCollected || 0).toLocaleString('en-IN')}`}
                        badge={`+₹${(stats?.todayFeesCollected || 0).toLocaleString('en-IN')}`}
                        gradient="from-amber-400 to-orange-500"
                        icon={IoCashOutline}
                        delay={0.10}
                    />
                </div>

                {/* ─── Module Directory: Primary Warm Cards Grid ─── */}
                <section className="space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                                <IoGridOutline size={16} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                                    All Modules
                                </h2>
                                <p className="text-[10px] font-medium text-[#9B7B5A] mt-0.5">
                                    Unlocked modules first, locked below
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                                {allowedCards.length} Unlocked
                            </span>
                            {lockedCards.length > 0 && (
                                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-500">
                                    {lockedCards.length} Locked
                                </span>
                            )}
                        </div>
                    </div>

                    {/* One unified grid — active cards first, locked cards after */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">

                        {/* Active / Unlocked cards */}
                        {allowedCards.map((card, i) => (
                            <Link key={card.path} to={card.path} className="block">
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 + i * 0.02, type: 'spring', stiffness: 120 }}
                                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                    className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-pointer group bg-white"
                                    style={{
                                        border: `1.5px solid ${card.color}25`,
                                        padding: '14px 13px 14px',
                                        minHeight: '124px',
                                        boxShadow: `0 2px 10px ${card.color}10`,
                                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = `${card.color}60`;
                                        e.currentTarget.style.boxShadow = `0 8px 28px -4px ${card.color}30`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = `${card.color}25`;
                                        e.currentTarget.style.boxShadow = `0 2px 10px ${card.color}10`;
                                    }}
                                >
                                    {/* Top accent bar */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                        style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}60, transparent)` }}
                                    />
                                    {/* Ghost watermark */}
                                    <card.icon
                                        size={56}
                                        className="absolute -bottom-1 -right-1 opacity-[0.05] transition-opacity group-hover:opacity-[0.10] pointer-events-none"
                                        style={{ color: card.color }}
                                    />
                                    {/* Icon pill + Tag */}
                                    <div className="flex items-center justify-between mb-2.5 relative">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110 shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}bb)` }}
                                        >
                                            <card.icon size={16} className="text-white" />
                                        </div>
                                        <span
                                            className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border truncate max-w-[90px]"
                                            style={{
                                                background: `${card.color}15`,
                                                color: card.color,
                                                borderColor: `${card.color}35`
                                            }}
                                        >
                                            {card.tag}
                                        </span>
                                    </div>
                                    {/* Text info */}
                                    <div className="mt-auto">
                                        <h4 className="text-[12.5px] font-bold leading-snug text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                            {card.title}
                                        </h4>
                                        <p className="text-[10px] mt-0.5 font-medium leading-relaxed line-clamp-2 text-stone-500">
                                            {card.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}

                        {/* Locked cards — same layout, dimmed + lock overlay */}
                        {lockedCards.map((card, i) => (
                            <div
                                key={card.path}
                                className="relative flex flex-col justify-between overflow-hidden rounded-2xl cursor-not-allowed select-none bg-white"
                                style={{
                                    border: `1.5px solid ${card.color}20`,
                                    padding: '14px 13px 14px',
                                    minHeight: '124px',
                                    boxShadow: `0 2px 8px ${card.color}08`,
                                    filter: 'grayscale(0.5)',
                                    opacity: 0.68,
                                }}
                            >
                                {/* Top accent bar */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                    style={{ background: `linear-gradient(90deg, ${card.color}70, ${card.color}30, transparent)` }}
                                />
                                {/* Ghost watermark */}
                                <card.icon
                                    size={56}
                                    className="absolute -bottom-1 -right-1 opacity-[0.04] pointer-events-none"
                                    style={{ color: card.color }}
                                />
                                {/* Lock badge overlay */}
                                <div
                                    className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
                                    style={{ background: 'rgba(247,243,236,0.50)' }}
                                >
                                    <div
                                        className="flex items-center gap-1 px-2 py-1 rounded-full"
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1.5px solid #EDE8E0',
                                            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                                        }}
                                    >
                                        <IoLockClosedOutline size={10} style={{ color: '#9B7B5A' }} />
                                        <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#9B7B5A', fontFamily: "'DM Sans','Inter',sans-serif" }}>
                                            Locked
                                        </span>
                                    </div>
                                </div>
                                {/* Icon pill + Tag */}
                                <div className="flex items-center justify-between mb-2.5 relative">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${card.color}70, ${card.color}44)` }}
                                    >
                                        <card.icon size={16} className="text-white" />
                                    </div>
                                    <span
                                        className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border truncate max-w-[90px]"
                                        style={{
                                            background: `${card.color}0d`,
                                            color: `${card.color}88`,
                                            borderColor: `${card.color}22`
                                        }}
                                    >
                                        {card.tag}
                                    </span>
                                </div>
                                {/* Text info */}
                                <div className="mt-auto">
                                    <h4 className="text-[12.5px] font-bold leading-snug text-gray-400 truncate">
                                        {card.title}
                                    </h4>
                                    <p className="text-[10px] mt-0.5 font-medium leading-relaxed line-clamp-2 text-stone-300">
                                        {card.desc}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>

                    {allowedCards.length === 0 && lockedCards.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE8E0] shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-3 text-orange-500">
                                <IoShieldCheckmarkOutline size={26} />
                            </div>
                            <h3 className="text-base font-black text-[#0F172A]">No Modules Available</h3>
                            <p className="text-xs text-[#786D62] mt-1">Please ask the Super Admin to configure module permissions.</p>
                        </div>
                    )}
                </section>



                {/* ─── Enterprise Security & System Telemetry Footer ─── */}
                <div
                    className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #EDE8E0',
                        boxShadow: '0 4px 20px rgba(180,120,60,0.06)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-600 bg-orange-50 border border-orange-200 shrink-0 shadow-2xs">
                            <IoShieldCheckmarkOutline size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-[#0F172A] leading-tight">
                                Enterprise Session &amp; Action Audit Active
                            </p>
                            <p className="text-[11px] font-medium text-[#786D62] mt-0.5">
                                All attendance entries, fee collections and records marked are cryptographically tied to your staff account.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0] text-[10px] font-bold text-[#786D62] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Database Sync</span>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SubAdminDashboard;
