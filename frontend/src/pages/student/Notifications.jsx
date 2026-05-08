import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader, { PageSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCheckmark, IoNotificationsOutline, IoCash, IoCalendar, IoChatbubble, IoMegaphoneOutline, IoCheckmarkDoneOutline, IoGridOutline, IoDocumentTextOutline, IoCalendarOutline, IoChatbubbleOutline } from 'react-icons/io5';

// ── Shared BG ────────────────────────────────────────────────────────────
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </>
);

const typeConfig = {
    fee:          { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: <IoCash />, label: 'Payment'    },
    seat:         { bg: 'bg-orange-50',   border: 'border-orange-200',   text: 'text-orange-700',   icon: <IoGridOutline />, label: 'Seat'       },
    request:      { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: <IoDocumentTextOutline />, label: 'Request'    },
    announcement: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: <IoMegaphoneOutline />, label: 'Notice'     },
    attendance:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   icon: <IoCalendarOutline />, label: 'Attendance' },
    general:      { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   icon: <IoChatbubbleOutline />, label: 'General'    },
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchNotifications(); }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/student/notifications');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/student/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
            await Promise.all(unreadIds.map(id => api.put(`/student/notifications/${id}/read`)));
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead)
        : filter === 'read' ? notifications.filter(n => n.isRead)
            : notifications;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/student">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all shadow-sm">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-gray-900">Notifications</h1>
                                {unreadCount > 0 && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm mt-0.5">Your library updates</p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <IoCheckmarkDoneOutline size={16} /> Mark All Read
                        </motion.button>
                    )}
                </motion.div>

                {/* Filter Tabs */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-2xl border border-gray-200 w-fit">
                    {[
                        { key: 'all', label: 'All', count: notifications.length },
                        { key: 'unread', label: 'Unread', count: unreadCount },
                        { key: 'read', label: 'Read', count: notifications.length - unreadCount }
                    ].map(({ key, label, count }) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === key
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-800'}`}>
                            {label} <span className="opacity-60 ml-1">({count})</span>
                        </button>
                    ))}
                </motion.div>

                {/* List */}
                {loading ? <SkeletonLoader type="notification" count={6} /> : filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20 rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <IoNotificationsOutline size={56} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No notifications here</p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((n, idx) => {
                            const cfg = typeConfig[n.type] || typeConfig.general;
                            return (
                                <motion.div key={n._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                    className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${!n.isRead
                                        ? 'bg-white border-orange-300 shadow-md'
                                        : 'bg-white border-gray-200 hover:shadow-sm'}`}>
                                    {/* Unread bar */}
                                    {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-500" />}

                                    <div className="p-5 flex gap-4">
                                        {/* Icon */}
                                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${cfg.bg} border ${cfg.border}`}>
                                            {cfg.icon}
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {!n.isRead && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                                    {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className={`font-bold leading-tight mb-1.5 ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
