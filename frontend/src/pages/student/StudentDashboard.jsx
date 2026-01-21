import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoBedOutline, IoCalendarOutline, IoCashOutline,
    IoBookOutline, IoNotificationsOutline, IoLogOut, IoPersonOutline
} from 'react-icons/io5';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Welcome, {user?.name}!
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
                    <Link to="/student/seat">
                        <Card delay={0}>
                            <div className="flex items-center justify-between mb-4">
                                <IoBedOutline size={32} className="text-blue-400" />
                                <span className="text-xs text-gray-400">VIEW DETAILS</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">My Seat</h3>
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
                    <Link to="/student/attendance">
                        <Card delay={0.1}>
                            <div className="flex items-center justify-between mb-4">
                                <IoCalendarOutline size={32} className="text-green-400" />
                                <span className="text-xs text-gray-400">VIEW DETAILS</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Attendance</h3>
                            <div>
                                <p className="text-2xl font-bold text-green-400">{dashboardData?.attendance?.percentage || 0}%</p>
                                <p className="text-sm text-gray-400">
                                    {dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Fee Status */}
                    <Link to="/student/fees">
                        <Card delay={0.2}>
                            <div className="flex items-center justify-between mb-4">
                                <IoCashOutline size={32} className="text-yellow-400" />
                                <span className="text-xs text-gray-400">VIEW DETAILS</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Fee Status</h3>
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
                    <Link to="/student/notifications">
                        <Card delay={0.3}>
                            <div className="flex items-center justify-between mb-4">
                                <IoNotificationsOutline size={32} className="text-pink-400" />
                                <span className="text-xs text-gray-400">VIEW ALL</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/student/planner">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="glass p-6 rounded-xl flex items-center gap-4 cursor-pointer"
                            >
                                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl">
                                    <IoBookOutline size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Study Planner</h3>
                                    <p className="text-sm text-gray-400">Plan your day</p>
                                </div>
                            </motion.div>
                        </Link>

                        <Link to="/student/seat">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="glass p-6 rounded-xl flex items-center gap-4 cursor-pointer"
                            >
                                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl">
                                    <IoBedOutline size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">View Seat on Map</h3>
                                    <p className="text-sm text-gray-400">See where you sit</p>
                                </div>
                            </motion.div>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
