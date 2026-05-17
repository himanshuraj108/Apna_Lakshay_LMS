import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
    IoShieldCheckmarkOutline, IoCalendarOutline, IoPersonOutline,
    IoCashOutline, IoNotificationsOutline, IoDocumentTextOutline,
    IoSearchOutline, IoLogOutOutline, IoChevronForwardOutline,
    IoLockClosedOutline, IoSparklesOutline, IoBedOutline
} from 'react-icons/io5';

const PERM_CARDS = {
    attendance:    { title: 'Attendance',       path: '/admin/attendance',    icon: IoCalendarOutline,      color: 'from-orange-500 to-red-500',    bg: 'bg-orange-50',   border: 'border-orange-200',   iconColor: 'text-orange-600', desc: 'Mark & view daily attendance' },
    students:      { title: 'Students',          path: '/admin/students',      icon: IoPersonOutline,        color: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',     border: 'border-blue-200',     iconColor: 'text-blue-600',   desc: 'Browse student list & details' },
    fees:          { title: 'Fee Status',         path: '/admin/fees',          icon: IoCashOutline,          color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50',   border: 'border-yellow-200',   iconColor: 'text-yellow-600', desc: 'View student fee records' },
    notifications: { title: 'Notifications',     path: '/admin/notifications', icon: IoNotificationsOutline, color: 'from-pink-500 to-rose-500',     bg: 'bg-pink-50',     border: 'border-pink-200',     iconColor: 'text-pink-600',   desc: 'Send announcements to students' },
    requests:      { title: 'Student Requests',  path: '/admin/requests',      icon: IoDocumentTextOutline,  color: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50',   border: 'border-indigo-200',   iconColor: 'text-indigo-600', desc: 'Handle seat & shift requests' },
    vacant_seats:  { title: 'Vacant Seats',      path: '/admin/vacant-seats',  icon: IoSearchOutline,        color: 'from-emerald-500 to-teal-500',  bg: 'bg-emerald-50',  border: 'border-emerald-200',  iconColor: 'text-emerald-600',desc: 'View available seat slots' },
};

const ALL_PERMS = Object.keys(PERM_CARDS);

const SubAdminDashboard = () => {
    const { user, logout } = useAuth();
    const permissions = user?.permissions || [];
    
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                // Fetch stats for custom mode which is the active mode for the LMS
                const res = await api.get(`/admin/dashboard?mode=custom`);
                setStats(res.data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const allowedCards = permissions.map(p => PERM_CARDS[p]).filter(Boolean);
    const lockedCards  = ALL_PERMS.filter(p => !permissions.includes(p)).map(p => PERM_CARDS[p]).filter(Boolean);

    const initials = (user?.name || 'S A').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Sticky Top Header ── */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shrink-0">
                        <IoShieldCheckmarkOutline size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Sub Admin</p>
                        <p className="text-gray-900 font-black text-sm truncate">{user?.name}</p>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-all shrink-0">
                        <IoLogOutOutline size={14} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 pb-24">

                {/* ── Welcome card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-200">
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-gray-900 font-black text-lg sm:text-xl leading-tight">
                            Welcome, {user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {allowedCards.length} module{allowedCards.length !== 1 ? 's' : ''} accessible
                        </p>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                {!loadingStats && stats && (
                    <motion.div 
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 gap-3 mb-7"
                    >
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-green-500 to-teal-500" />
                            <div className="flex items-center gap-2 mb-2 mt-1">
                                <div className="p-1.5 bg-gradient-to-br from-green-500 to-teal-500 text-white rounded-lg shadow-md" style={{ boxShadow: '0 4px 12px -2px rgba(16,185,129,0.35)' }}>
                                    <IoBedOutline size={16} />
                                </div>
                                <p className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Occupied Seats</p>
                            </div>
                            <p className="text-2xl font-black bg-gradient-to-br from-green-500 to-teal-500 bg-clip-text text-transparent ml-1">
                                {stats.occupiedSeats} / {stats.totalSeats}
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-yellow-400 to-orange-500" />
                            <div className="flex items-center gap-2 mb-2 mt-1">
                                <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg shadow-md" style={{ boxShadow: '0 4px 12px -2px rgba(245,158,11,0.35)' }}>
                                    <IoCashOutline size={16} />
                                </div>
                                <p className="text-gray-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Fees Collected</p>
                            </div>
                            <p className="text-2xl font-black bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent ml-1">
                                ₹{stats.feesCollected}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── Modules ── */}
                {allowedCards.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <IoShieldCheckmarkOutline size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-700 font-bold">No permissions assigned yet</p>
                        <p className="text-gray-400 text-sm mt-1">Ask the super admin to grant access.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Your Modules</p>
                        <div className="flex flex-col gap-3 mb-8">
                            {allowedCards.map((card, i) => (
                                <motion.div
                                    key={card.path}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.07 }}>
                                    <Link to={card.path}
                                        className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group active:scale-[0.98]">
                                        {/* Icon circle */}
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                                            <card.icon size={22} className={card.iconColor} />
                                        </div>
                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 font-black text-sm sm:text-base leading-tight">{card.title}</p>
                                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{card.desc}</p>
                                        </div>
                                        {/* Arrow */}
                                        <IoChevronForwardOutline
                                            size={18}
                                            className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── Locked modules ── */}
                        {lockedCards.length > 0 && (
                            <>
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3 px-1">Locked Modules</p>
                                <div className="flex flex-col gap-2">
                                    {lockedCards.map((card, i) => (
                                        <motion.div
                                            key={card.path}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 + i * 0.04 }}>
                                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 opacity-50 cursor-not-allowed select-none">
                                                <div className={`w-12 h-12 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0 grayscale`}>
                                                    <card.icon size={20} className={card.iconColor} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-500 font-bold text-sm">{card.title}</p>
                                                    <p className="text-gray-400 text-xs">Not permitted</p>
                                                </div>
                                                <IoLockClosedOutline size={16} className="text-gray-300 shrink-0" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SubAdminDashboard;
