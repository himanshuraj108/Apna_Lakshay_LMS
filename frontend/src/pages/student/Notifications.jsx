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
                                <Card
                                    className={`cursor-pointer transition-all ${!notification.isRead ? 'bg-white/10 border-2 border-primary-500/50' : ''
                                        }`}
                                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                                >
                                    <div className="flex gap-4">
                                        {/* Removed emoji icon */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold">{notification.title}</h3>
                                                    {!notification.isRead && (
                                                        <Badge variant="green" className="mt-1">New</Badge>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant={
                                                        notification.type === 'announcement' ? 'yellow' :
                                                            notification.type === 'fee' ? 'green' :
                                                                notification.type === 'request' ? 'red' : 'green'
                                                    }
                                                >
                                                    {notification.type}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-300 mb-3 whitespace-pre-wrap">{notification.message}</p>
                                            <p className="text-sm text-gray-400">
                                                {new Date(notification.createdAt).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
