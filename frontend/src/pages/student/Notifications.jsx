import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCheckmark, IoNotifications } from 'react-icons/io5';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        fetchNotifications();
    }, []);

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
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
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

    const getFilteredNotifications = () => {
        if (filter === 'unread') return notifications.filter(n => !n.isRead);
        if (filter === 'read') return notifications.filter(n => n.isRead);
        return notifications;
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getNotificationIcon = (type) => {
        const icons = {
            seat: '🪑',
            fee: '💰',
            attendance: '📅',
            announcement: '📢',
            request: '📝',
            general: '💬'
        };
        return icons[type] || '💬';
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/student">
                        <Button variant="secondary">
                            <IoArrowBack className="inline mr-2" /> Back to Dashboard
                        </Button>
                    </Link>
                    {unreadCount > 0 && (
                        <Button variant="primary" onClick={markAllAsRead}>
                            <IoCheckmark className="inline mr-2" /> Mark All Read
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gradient-primary rounded-lg">
                        <IoNotifications size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Notifications
                        </h1>
                        <p className="text-gray-400">{unreadCount} unread</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={filter === 'all' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('all')}
                    >
                        All ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('unread')}
                    >
                        Unread ({unreadCount})
                    </Button>
                    <Button
                        variant={filter === 'read' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('read')}
                    >
                        Read ({notifications.length - unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : filteredNotifications.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <IoNotifications size={64} className="mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-400">No notifications found</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredNotifications.map((notification) => (
                            <motion.div
                                key={notification._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div
                                    className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${!notification.isRead
                                            ? 'bg-gray-800/80 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                            : 'bg-gray-900/40 border-white/5 hover:bg-gray-800/60'
                                        }`}
                                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                                >
                                    {/* Unread Indicator Bar */}
                                    {!notification.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600" />
                                    )}

                                    <div className="p-5 flex gap-5">
                                        {/* Icon Container */}
                                        <div className={`mt-1 flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-2xl ${notification.type === 'fee' ? 'bg-green-500/10 text-green-400' :
                                                notification.type === 'seat' ? 'bg-blue-500/10 text-blue-400' :
                                                    notification.type === 'request' ? 'bg-red-500/10 text-red-400' :
                                                        notification.type === 'announcement' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-gray-700/50 text-gray-300'
                                            }`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-xs font-medium uppercase tracking-wider opacity-60">
                                                            {notification.type}
                                                        </span>
                                                        {!notification.isRead && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className={`text-lg font-bold leading-tight ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                                                        {notification.title}
                                                    </h3>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap bg-black/20 px-2 py-1 rounded">
                                                    {new Date(notification.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base opacity-90">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
