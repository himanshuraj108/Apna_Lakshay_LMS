import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import IDCard from '../../components/dashboard/IDCard'; // Import IDCard
import api from '../../utils/api';
import {
    IoBedOutline, IoCalendarOutline, IoCashOutline,
    IoBookOutline, IoNotificationsOutline, IoLogOut, IoPersonOutline,
    IoIdCardOutline, // Import new icon
    IoArrowForward // Added IoArrowForward
} from 'react-icons/io5';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showIDCard, setShowIDCard] = useState(false);
    const [showFeeReminder, setShowFeeReminder] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
        // ... visibility change logic ...
    }, []);

    // Show reminder when data is loaded
    useEffect(() => {
        if (dashboardData?.feeReminder?.show) {
            setShowFeeReminder(true);
        }
    }, [dashboardData]);

    // ... fetchDashboardData ... (omitted)

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/student/dashboard');
            setDashboardData(response.data.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };
    // ... existing ...

    // Fee Reminder Component
    const FeeReminderModal = () => (
        <AnimatePresence>
            {showFeeReminder && dashboardData?.feeReminder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500" />

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <IoNotificationsOutline className="text-red-500 text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Attention Needed</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {dashboardData.feeReminder.message}
                            </p>
                        </div>

                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                            <span className="text-gray-400 text-xs uppercase tracking-wider">Amount Due</span>
                            <span className="text-2xl font-bold text-white">₹{dashboardData.feeReminder.amount}</span>
                        </div>

                        <Button
                            className="w-full justify-center py-3 text-lg"
                            onClick={() => setShowFeeReminder(false)}
                        >
                            I Understand
                        </Button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // ... existing render ...

    // Insert <FeeReminderModal /> inside return


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getFeeStatusBadge = (status) => {
        if (status === 'paid') return <Badge variant="green">Paid</Badge>;
        if (status === 'overdue') return <Badge variant="red">Overdue</Badge>;
        return <Badge variant="yellow">Due Soon</Badge>;
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-6xl mx-auto">
                    <SkeletonLoader type="card" count={4} />
                </div>
            </div>
        );
    }

    const isActive = dashboardData ? dashboardData.isActive : user?.isActive;

    return (
        <div className="min-h-screen p-6 relative">
            <AnimatePresence>
                {showIDCard && (
                    <IDCard
                        student={{
                            ...user,
                            isActive: isActive, // Use fresh status
                            registrationSource: dashboardData?.registrationSource,
                            seat: dashboardData?.seat,
                            shift: dashboardData?.seat?.shift,
                            seatNumber: dashboardData?.seat?.number,
                            shiftDetails: dashboardData?.seat?.shiftDetails // Pass shift time details
                        }}
                        onClose={() => setShowIDCard(false)}
                    />
                )}
            </AnimatePresence>

            <FeeReminderModal />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
                            Welcome, {user?.name}!
                            {!isActive && (
                                <span className="text-sm bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full font-medium">
                                    Inactive
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-400 mt-2">Your daily dashboard</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/student/profile">
                            <Button variant="secondary">
                                <IoPersonOutline className="inline mr-2" size={20} />
                                Profile
                            </Button>
                        </Link>
                        <Button variant="danger" onClick={handleLogout}>
                            <IoLogOut className="inline mr-2" size={20} />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* My Seat */}
                    <Link to="/student/seat" className="h-full block">
                        <Card delay={0} className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <IoBedOutline size={32} className="text-blue-400" />
                                    <span className="text-xs text-gray-400">VIEW DETAILS</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">My Seat</h3>
                            </div>
                            {dashboardData?.seat ? (
                                <div>
                                    <p className="text-2xl font-bold text-blue-400">{dashboardData.seat.number}</p>
                                    <p className="text-sm text-gray-400">{dashboardData.seat.shift?.toUpperCase()} Shift</p>
                                </div>
                            ) : (
                                <p className="text-yellow-400">No Seat Assigned</p>
                            )}
                        </Card>
                    </Link>

                    {/* Attendance */}
                    <Link to="/student/attendance" className="h-full block">
                        <Card delay={0.1} className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <IoCalendarOutline size={32} className="text-green-400" />
                                    <span className="text-xs text-gray-400">VIEW DETAILS</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Attendance</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-400">{dashboardData?.attendance?.percentage || 0}%</p>
                                <p className="text-sm text-gray-400">
                                    {dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Fee Status */}
                    <Link to="/student/fees" className="h-full block">
                        <Card delay={0.2} className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <IoCashOutline size={32} className="text-yellow-400" />
                                    <span className="text-xs text-gray-400">VIEW DETAILS</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Fee Status</h3>
                            </div>
                            {dashboardData?.fee ? (
                                <div>
                                    <p className="text-2xl font-bold">₹{dashboardData.fee.amount}</p>
                                    <div className="mt-2">{getFeeStatusBadge(dashboardData.fee.status)}</div>
                                </div>
                            ) : (
                                <p className="text-gray-400">No Fee Record</p>
                            )}
                        </Card>
                    </Link>

                    {/* Notifications */}
                    <Link to="/student/notifications" className="h-full block">
                        <Card delay={0.3} className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <IoNotificationsOutline size={32} className="text-pink-400" />
                                    <span className="text-xs text-gray-400">VIEW ALL</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-pink-400">{dashboardData?.unreadNotifications || 0}</p>
                                <p className="text-sm text-gray-400">Unread Messages</p>
                            </div>
                        </Card>
                    </Link>
                </div>

                {/* Quick Actions */}
                <Card>
                    <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div onClick={() => setShowIDCard(true)}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-xl shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                                    <IoIdCardOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-blue-200 transition-colors">Virtual ID Card</h3>
                                    <p className="text-sm text-gray-400">View & Download</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </div>

                        <Link to="/student/planner">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                                    <IoBookOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-purple-200 transition-colors">Study Planner</h3>
                                    <p className="text-sm text-gray-400">Plan your day</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </Link>

                        <Link to="/student/seat">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                                    <IoBedOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg group-hover:text-cyan-200 transition-colors">View Seat on Map</h3>
                                    <p className="text-sm text-gray-400">See where you sit</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
