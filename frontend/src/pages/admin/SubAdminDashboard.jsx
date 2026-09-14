import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoShieldCheckmarkOutline, IoCalendarOutline, IoPersonOutline,
    IoCashOutline, IoNotificationsOutline, IoDocumentTextOutline,
    IoSearchOutline, IoLogOutOutline, IoChevronForwardOutline,
    IoLockClosedOutline, IoBedOutline, IoIdCard, IoTrendingUpOutline,
    IoAlertCircleOutline, IoCheckmarkCircleOutline, IoRefreshOutline,
    IoGridOutline, IoTimeOutline, IoStatsChartOutline
} from 'react-icons/io5';

const PERM_CARDS = {
    attendance:    {
        title: 'Attendance',
        path: '/admin/attendance',
        icon: IoCalendarOutline,
        gradient: 'from-orange-500 to-red-500',
        glow: 'rgba(249,115,22,0.25)',
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        iconColor: 'text-orange-500',
        desc: 'Mark & view daily attendance records',
        tag: 'Daily Task'
    },
    students:      {
        title: 'Students',
        path: '/admin/students',
        icon: IoPersonOutline,
        gradient: 'from-blue-500 to-indigo-600',
        glow: 'rgba(99,102,241,0.25)',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        iconColor: 'text-blue-500',
        desc: 'Browse & manage student profiles',
        tag: 'Management'
    },
    id_cards:      {
        title: 'Student ID Cards',
        path: '/admin/students?tab=id-cards',
        icon: IoIdCard,
        gradient: 'from-purple-500 to-pink-500',
        glow: 'rgba(168,85,247,0.25)',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        iconColor: 'text-purple-500',
        desc: 'Generate & print student ID cards',
        tag: 'Cards'
    },
    fees:          {
        title: 'Fee Status',
        path: '/admin/fees',
        icon: IoCashOutline,
        gradient: 'from-yellow-400 to-orange-500',
        glow: 'rgba(245,158,11,0.25)',
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        iconColor: 'text-yellow-500',
        desc: 'View & manage student fee records',
        tag: 'Finance'
    },
    notifications: {
        title: 'Notifications',
        path: '/admin/notifications',
        icon: IoNotificationsOutline,
        gradient: 'from-pink-500 to-rose-500',
        glow: 'rgba(244,63,94,0.25)',
        bg: 'bg-pink-50',
        border: 'border-pink-100',
        iconColor: 'text-pink-500',
        desc: 'Send announcements to students',
        tag: 'Comms'
    },
    requests:      {
        title: 'Student Requests',
        path: '/admin/requests',
        icon: IoDocumentTextOutline,
        gradient: 'from-indigo-500 to-purple-600',
        glow: 'rgba(99,102,241,0.25)',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100',
        iconColor: 'text-indigo-500',
        desc: 'Handle seat & shift change requests',
        tag: 'Requests'
    },
    vacant_seats:  {
        title: 'Vacant Seats',
        path: '/admin/vacant-seats',
        icon: IoSearchOutline,
        gradient: 'from-emerald-500 to-teal-500',
        glow: 'rgba(16,185,129,0.25)',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        iconColor: 'text-emerald-500',
        desc: 'Browse all available seat slots',
        tag: 'Seats'
    },
};

const ALL_PERMS = Object.keys(PERM_CARDS);

const StatCard = ({ label, value, sub, badge, gradient, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl p-3.5 sm:p-4 group flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{
            background: '#FFFFFF',
            border: '1.5px solid #EDE8E0',
            boxShadow: '0 4px 20px rgba(180,120,60,0.07)'
        }}
    >
        {/* top accent bar */}
        <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${gradient}`} />

        {/* Header: Label & Icon */}
        <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: '#9B7B5A' }}>{label}</p>
            <div className={`p-1.5 sm:p-2 rounded-xl bg-gradient-to-br ${gradient} opacity-90 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <Icon size={14} className="text-white sm:w-4 sm:h-4" />
            </div>
        </div>

        {/* Value */}
        <div className="my-0.5">
            <p className={`text-xl sm:text-2xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent leading-tight truncate`}>{value}</p>
        </div>

        {/* Bottom row: Sub content on left, Larger Today Income Badge on right */}
        <div className="flex items-center justify-between gap-1 mt-1 text-[10px] sm:text-[11px] min-h-[22px] flex-wrap">
            {sub ? (
                typeof sub === 'string' ? <p className="font-medium truncate" style={{ color: '#9B7B5A' }}>{sub}</p> : sub
            ) : <div />}
            {badge && (
                <span className="text-xs sm:text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80 shrink-0 ml-auto shadow-2xs">
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
            console.error(e);
        } finally {
            setLoadingStats(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const allowedCards = permissions.map(p => PERM_CARDS[p]).filter(Boolean);
    const lockedCards  = ALL_PERMS.filter(p => !permissions.includes(p)).map(p => PERM_CARDS[p]).filter(Boolean);
    const initials = (user?.name || 'S A').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const greetingHour = currentTime.getHours();
    const greeting = greetingHour < 12 ? 'Good Morning' : greetingHour < 17 ? 'Good Afternoon' : 'Good Evening';
    const timeStr = currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    if (loadingStats) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
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
                        <h3 className="text-base font-black" style={{ color: '#1A1A1A' }}>
                            Sub-Admin Portal
                        </h3>
                        <p className="text-xs font-medium" style={{ color: '#9B7B5A' }}>Loading module permissions & stats...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
            {/* ─── Dot Grid Background ─── */}
            <div className="fixed inset-0 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

            {/* ─── Sticky Header ─── */}
            <div className="sticky top-0 z-40 backdrop-blur-xl shadow-xs" style={{ background: 'rgba(247,243,236,0.92)', borderBottom: '1.5px solid #EDE8E0' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <img
                        src="/app-icon-192.png"
                        alt="Apna Lakshay"
                        className="w-8 h-8 rounded-xl object-contain shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: '#EA580C' }}>Sub Admin Panel</p>
                        <p className="font-black text-sm truncate leading-tight mt-0.5" style={{ color: '#1A1A1A' }}>{user?.name}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium mr-2" style={{ color: '#9B7B5A' }}>
                        <IoTimeOutline size={13} />
                        <span>{timeStr}</span>
                    </div>
                    <button
                        onClick={() => fetchStats(true)}
                        className="p-2 rounded-xl text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer"
                        style={{ border: '1.5px solid #EDE8E0', background: '#FFFFFF' }}
                        title="Refresh stats"
                    >
                        <IoRefreshOutline size={16} className={refreshing ? 'animate-spin text-orange-500' : ''} />
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => logout()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                        style={{ border: '1.5px solid #FCA5A5' }}
                        title="Log Out"
                    >
                        <IoLogOutOutline size={15} />
                        <span className="hidden sm:inline">Logout</span>
                    </motion.button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 pb-24 space-y-5">

                {/* ─── Hero Welcome Card (StudentDashboard Style) ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-2xl overflow-hidden shadow-lg border border-white/20"
                    style={{
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 60%, #C2410C 100%)',
                        boxShadow: '0 10px 30px rgba(249,115,22,0.22)'
                    }}
                >
                    {/* subtle decorative circles */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 blur-2xl" />

                    <div className="relative p-4 sm:p-5 flex items-center gap-3.5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white font-black text-lg sm:text-xl shrink-0 shadow-md">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-[11px] font-semibold mb-0.5">{greeting} • {dateStr}</p>
                            <h1 className="text-white font-black text-xl sm:text-2xl leading-tight truncate">
                                {user?.name?.split(' ')[0]}!
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-white rounded-full border border-white/25">
                                    {allowedCards.length} module{allowedCards.length !== 1 ? 's' : ''} active
                                </span>
                                {stats?.pendingRequests > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-900/40 text-white rounded-full border border-red-300/30 flex items-center gap-1">
                                        <IoAlertCircleOutline size={10} />
                                        {stats.pendingRequests} pending request{stats.pendingRequests !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Stats Grid ─── */}
                {loadingStats ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#FFFFFF", border: "1.5px solid #EDE8E0" }} />
                        ))}
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            label="Seats Occupied"
                            value={`${stats.occupiedSeats}/${stats.totalSeats}`}
                            sub={
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-bold text-sky-600 bg-sky-50 border border-sky-200/70 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]">
                                        AC: {stats.acVacantSeats || 0}
                                    </span>
                                    <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]">
                                        Non-AC: {stats.nonAcVacantSeats || 0}
                                    </span>
                                </div>
                            }
                            gradient="from-emerald-500 to-teal-500"
                            icon={IoBedOutline}
                            delay={0.05}
                        />
                        <StatCard
                            label="Fees Collected"
                            value={`₹${(stats.feesCollected || 0).toLocaleString('en-IN')}`}
                            badge={`+₹${(stats.todayFeesCollected || 0).toLocaleString('en-IN')}`}
                            gradient="from-yellow-400 to-orange-500"
                            icon={IoCashOutline}
                            delay={0.10}
                        />
                    </div>
                )}

                {/* ─── Module Grid ─── */}
                {allowedCards.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                            <IoShieldCheckmarkOutline size={28} className="text-gray-300" />
                        </div>
                        <p className="text-gray-700 font-bold text-lg">No permissions assigned</p>
                        <p className="text-gray-400 text-sm mt-1">Ask the super admin to grant module access.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">

                        {/* Section label */}
                        <div className="flex items-center gap-2 px-1">
                            <IoGridOutline size={14} style={{ color: '#9B7B5A' }} />
                            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#9B7B5A' }}>Your Modules</p>
                            <div className="flex-1 h-px" style={{ background: '#EDE8E0' }} />
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: '#EA580C', background: '#F5F0EA', border: '1px solid #FDDCAE' }}>
                                {allowedCards.length} accessible
                            </span>
                        </div>

                        {/* Cards — 2 column grid on sm+ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allowedCards.map((card, i) => (
                                <motion.div
                                    key={card.path}
                                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Link
                                        to={card.path}
                                        className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 group active:scale-[0.98] relative overflow-hidden hover:-translate-y-0.5"
                                        style={{
                                            background: '#FFFFFF',
                                            border: '1.5px solid #EDE8E0',
                                            boxShadow: '0 4px 20px rgba(180,120,60,0.07)'
                                        }}
                                    >
                                        {/* subtle gradient hover bg */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 rounded-2xl`} />

                                        {/* Icon */}
                                        <div
                                            className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${card.bg} ${card.border} border transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}
                                        >
                                            <card.icon size={22} className={card.iconColor} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-black text-sm leading-tight" style={{ color: '#1A1A1A' }}>{card.title}</p>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r ${card.gradient} text-white opacity-90`}>
                                                    {card.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs leading-tight line-clamp-1" style={{ color: '#9B7B5A' }}>{card.desc}</p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300" style={{ background: '#F5F0EA', border: '1px solid #EDE8E0' }}>
                                            <IoChevronForwardOutline size={13} style={{ color: '#9B7B5A' }} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* ─── Locked Modules ─── */}
                        {lockedCards.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 px-1">
                                    <IoLockClosedOutline size={13} style={{ color: '#9B7B5A' }} />
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#9B7B5A' }}>Locked Modules</p>
                                    <div className="flex-1 h-px" style={{ background: '#EDE8E0' }} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {lockedCards.map((card, i) => (
                                        <motion.div
                                            key={card.path}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 + i * 0.04 }}
                                            className="flex items-center gap-3 rounded-2xl px-4 py-3 select-none"
                                            style={{
                                                background: '#F5F0EA',
                                                border: '1.5px solid #EDE8E0'
                                            }}
                                        >
                                            <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0 grayscale opacity-40`}>
                                                <card.icon size={16} className={card.iconColor} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs leading-tight" style={{ color: '#6B6560' }}>{card.title}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: '#9B7B5A' }}>Contact admin for access</p>
                                            </div>
                                            <IoLockClosedOutline size={13} style={{ color: '#9B7B5A' }} className="shrink-0" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Quick Tips footer ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl px-5 py-4 flex items-center gap-3"
                    style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #EDE8E0',
                        boxShadow: '0 4px 20px rgba(180,120,60,0.07)'
                    }}
                >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/20" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                        <IoStatsChartOutline size={15} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>Stats refresh automatically</p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#9B7B5A' }}>Use the refresh button in the header to get latest data at any time.</p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default SubAdminDashboard;
