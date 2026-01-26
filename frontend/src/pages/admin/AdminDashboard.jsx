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
    IoPersonOutline, IoBarChartOutline, IoChatbubblesOutline, IoSunny, IoMoon, IoDesktopOutline
} from 'react-icons/io5';
import ShiftManager from '../../components/admin/ShiftManager';
import QRScannerModal from '../../components/admin/QRScannerModal';
import { IoPower } from 'react-icons/io5';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState('custom');
    const [settings, setSettings] = useState({
        activeModes: { default: true, custom: false }
    });
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchDashboardStats(activeTab);
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            if (response.data.settings) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleToggleMode = async (mode) => {
        try {
            const currentModes = settings.activeModes || { default: true, custom: false };
            const newModes = { ...currentModes, [mode]: !currentModes[mode] };

            // Optimistic update
            setSettings({ ...settings, activeModes: newModes });

            await api.put('/admin/settings', {
                activeModes: newModes
            });

            // Refresh to ensure sync
            fetchSettings();
        } catch (error) {
            console.error('Error toggling mode:', error);
            // Revert on error
            fetchSettings();
        }
    };

    const fetchDashboardStats = async (mode = 'default') => {
        // Don't set loading true here if you want smooth tab switch, 
        // but user expects data change visual.
        // We can keep setLoading(true) but Skeleton might flicker. 
        // Let's keep it for clarity that data is changing.
        setLoading(true);
        try {
            const response = await api.get(`/admin/dashboard?mode=${mode}`);
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
        { title: 'Shift Management', path: '/admin/shifts', icon: IoTimeOutline, color: 'from-cyan-500 to-blue-500' },
        { title: 'Action History', path: '/admin/history', icon: IoPersonOutline, color: 'from-gray-500 to-slate-500' },
        { title: 'Password Activity', path: '/admin/password-activity', icon: IoKey, color: 'from-red-500 to-orange-500' },
        { title: 'Analytics & Reports', path: '/admin/analytics', icon: IoBarChartOutline, color: 'from-blue-500 to-cyan-500' },
        { title: 'Discussion Management', path: '/admin/chat', icon: IoChatbubblesOutline, color: 'from-violet-500 to-fuchsia-500' },
        { title: 'Kiosk Mode', path: '/admin/kiosk', icon: IoScanOutline, color: 'from-purple-500 to-pink-500' }
    ];

    const { theme, toggleTheme, setTheme } = useTheme();

    // ... (rest of code) ...

    return (
        <div className="min-h-screen p-6 pb-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Apna Lakshay Management System</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {/* Theme Toggle - Segmented Control */}
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full border border-gray-300 dark:border-gray-700">
                            <button
                                onClick={() => setTheme('system')}
                                className={`p-2 rounded-full transition-all ${theme === 'system'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="System Theme"
                            >
                                <IoDesktopOutline size={18} />
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 rounded-full transition-all ${theme === 'light'
                                    ? 'bg-yellow-500 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="Light Mode"
                            >
                                <IoSunny size={18} />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 rounded-full transition-all ${theme === 'dark'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="Dark Mode"
                            >
                                <IoMoon size={18} />
                            </button>
                        </div>

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

                {/* Main Dashboard Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">

                    {/* Status Toggle Header */}
                    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 rounded-xl p-6 flex justify-between items-center shadow-sm dark:shadow-none">
                        <div>
                            <h2 className="text-2xl font-bold text-green-400 mb-1">Server Maintenance Mode</h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enable to test system crash scenarios. Students will see maintenance page when enabled.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-black/20 p-2 rounded-full border border-gray-200 dark:border-white/5">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 px-2">STATUS:</span>
                            <button
                                className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-lg transition-all ${settings?.activeModes?.custom
                                    ? 'bg-green-500 text-white shadow-green-500/30 hover:bg-green-600'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                onClick={() => handleToggleMode('custom')}
                            >
                                {settings?.activeModes?.custom ? 'ENABLED' : 'DISABLED'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {loading ? (
                        <SkeletonLoader type="card" count={4} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card delay={0}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
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
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Occupied Seats</p>
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
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Fees Collected</p>
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
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Requests</p>
                                        <p className="text-3xl font-bold mt-2">{stats?.pendingRequests || 0}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-xl">
                                        <IoNotificationsOutline size={28} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    <ShiftManager allowDelete={false} />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item, index) => (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="glass rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 border border-green-500/20 bg-green-900/10"
                                >
                                    <div className={`bg-gradient-to-br ${item.color} p-4 rounded-xl w-fit mb-4 text-white`}>
                                        <item.icon size={32} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{item.title}</h3>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
