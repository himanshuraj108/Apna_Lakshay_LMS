import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoSchool, IoCalendarOutline, IoCashOutline, IoBedOutline, IoDocumentTextOutline,
    IoNotificationsOutline, IoLogOut, IoSettings, IoScanOutline, IoTimeOutline, IoKey,
    IoPersonOutline
} from 'react-icons/io5';
import QRScannerModal from '../../components/admin/QRScannerModal';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/admin/dashboard');
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { title: 'Student Management', path: '/admin/students', icon: IoPersonOutline, color: 'from-blue-500 to-purple-500' },
        { title: 'Floor & Seat Management', path: '/admin/floors', icon: IoBedOutline, color: 'from-green-500 to-teal-500' },
        { title: 'Attendance Marking', path: '/admin/attendance', icon: IoSettings, color: 'from-orange-500 to-red-500' },
        { title: 'Fee Management', path: '/admin/fees', icon: IoCashOutline, color: 'from-yellow-500 to-orange-500' },
        { title: 'Notifications', path: '/admin/notifications', icon: IoNotificationsOutline, color: 'from-pink-500 to-rose-500' },
        { title: 'Student Requests', path: '/admin/requests', icon: IoSettings, color: 'from-indigo-500 to-blue-500' },
        { title: 'Action History', path: '/admin/history', icon: IoPersonOutline, color: 'from-gray-500 to-slate-500' },
        { title: 'Password Activity', path: '/admin/password-activity', icon: IoKey, color: 'from-red-500 to-orange-500' }
    ];

    return (
        <div className="min-h-screen p-6 pb-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2">Hamara Lakshay Management System</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="primary"
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2"
                        >
                            <IoScanOutline size={20} />
                            Scan ID
                        </Button>
                        <Button variant="danger" onClick={handleLogout}>
                            <IoLogOut className="inline mr-2" size={20} />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* QR Scanner Modal */}
                {showScanner && (
                    <QRScannerModal onClose={() => setShowScanner(false)} />
                )}

                {/* Stats Cards */}
                {loading ? (
                    <SkeletonLoader type="card" count={4} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card delay={0}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Total Students</p>
                                    <p className="text-3xl font-bold mt-2">{stats?.totalStudents || 0}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-xl">
                                    <IoPersonOutline size={28} />
                                </div>
                            </div>
                        </Card>

                        <Card delay={0.1}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Occupied Seats</p>
                                    <p className="text-3xl font-bold mt-2">{stats?.occupiedSeats || 0} / {stats?.totalSeats || 0}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-teal-500 p-4 rounded-xl">
                                    <IoBedOutline size={28} />
                                </div>
                            </div>
                        </Card>

                        <Card delay={0.2}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Fees Collected</p>
                                    <p className="text-3xl font-bold mt-2">₹{stats?.feesCollected || 0}</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-xl">
                                    <IoCashOutline size={28} />
                                </div>
                            </div>
                        </Card>

                        <Card delay={0.3}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">Pending Requests</p>
                                    <p className="text-3xl font-bold mt-2">{stats?.pendingRequests || 0}</p>
                                </div>
                                <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-xl">
                                    <IoNotificationsOutline size={28} />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item, index) => (
                        <Link key={item.path} to={item.path}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="glass rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
                            >
                                <div className={`bg-gradient-to-br ${item.color} p-4 rounded-xl w-fit mb-4`}>
                                    <item.icon size={32} />
                                </div>
                                <h3 className="text-xl font-semibold">{item.title}</h3>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
