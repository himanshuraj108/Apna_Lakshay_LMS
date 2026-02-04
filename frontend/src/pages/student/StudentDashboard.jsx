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
    IoIdCardOutline, IoArrowForward, IoScan, IoCheckmarkCircle, IoCloseCircle,
    IoChatbubblesOutline, IoHelpCircleOutline, IoGridOutline, IoTabletLandscapeOutline
} from 'react-icons/io5';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import HelpSupportModal from '../../components/student/HelpSupportModal';
import RequestHistoryModal from '../../components/student/RequestHistoryModal';
import LmsGuideSection from '../../components/student/LmsGuideSection';
import Footer from '../../components/layout/Footer';

const StudentDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showIDCard, setShowIDCard] = useState(false);
    const [showFeeReminder, setShowFeeReminder] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // View Mode State
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || 'desktop');
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    // Detect Mobile Device
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
                setIsMobileDevice(true);
            }
        };
        checkMobile();
    }, []);

    // Toggle Viewport
    useEffect(() => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            if (viewMode === 'mobile') {
                viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
            } else if (viewMode === 'tablet') {
                viewportMeta.setAttribute('content', 'width=768, user-scalable=yes');
            } else {
                // Desktop
                viewportMeta.setAttribute('content', 'width=1280, user-scalable=yes');
            }
            // Persist the selection
            localStorage.setItem('viewMode', viewMode);
        }
    }, [viewMode]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Show reminder when data is loaded
    useEffect(() => {
        if (dashboardData?.feeReminder?.show) {
            setShowFeeReminder(true);
        }
    }, [dashboardData]);

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

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            const response = await api.post('/student/attendance/qr-scan', { qrToken: token });
            if (response.data.success) {
                setScanMessage({ type: 'success', text: response.data.message });
                fetchDashboardData();
                setTimeout(() => setScanMessage(null), 5000);
            }
        } catch (error) {
            setScanMessage({
                type: 'error',
                text: error.response?.data?.message || 'Scan failed'
            });
            setTimeout(() => setScanMessage(null), 5000);
        }
    };

    const getFeeStatusBadge = (status) => {
        if (status === 'paid') return <Badge variant="green">Paid</Badge>;
        if (status === 'overdue') return <Badge variant="red">Overdue</Badge>;
        return <Badge variant="yellow">Due Soon</Badge>;
    };

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

    const getAttendanceColor = (percentage) => {
        if (percentage >= 75) return 'text-green-400';
        if (percentage >= 60) return 'text-blue-400';
        if (percentage >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen p-6 relative">
            <AnimatePresence>
                {showIDCard && (
                    <IDCard
                        student={{
                            ...user,
                            isActive: isActive,
                            registrationSource: dashboardData?.registrationSource,
                            seat: dashboardData?.seat,
                            shift: dashboardData?.seat?.shift,
                            seatNumber: dashboardData?.seat?.number,
                            shiftDetails: dashboardData?.seat?.shiftDetails
                        }}
                        onClose={() => setShowIDCard(false)}
                    />
                )}
            </AnimatePresence>

            <FeeReminderModal />
            <HelpSupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
            <RequestHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />

            {/* Scan Result Message */}
            <AnimatePresence>
                {scanMessage && (
                    <div className="fixed top-24 right-6 z-50">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${scanMessage.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}
                        >
                            {scanMessage.type === 'success' ? <IoCheckmarkCircle size={24} /> : <IoCloseCircle size={24} />}
                            <p className="font-semibold">{scanMessage.text}</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scanner Modal */}
            {showScanner && (
                <AttendanceScanner
                    onScanSuccess={handleQrScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

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
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Your daily dashboard</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {isMobileDevice && (
                            <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-full border border-gray-700">
                                <button
                                    onClick={() => setViewMode('desktop')}
                                    className={`p-2 rounded-full transition-all ${viewMode === 'desktop' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    title="Desktop View"
                                >
                                    <IoGridOutline size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('tablet')}
                                    className={`p-2 rounded-full transition-all ${viewMode === 'tablet' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    title="Tablet View"
                                >
                                    <IoTabletLandscapeOutline size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('mobile')}
                                    className={`p-2 rounded-full transition-all ${viewMode === 'mobile' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    title="Mobile View"
                                >
                                    <IoIdCardOutline size={16} className="rotate-90" />
                                </button>
                            </div>
                        )}
                        <Link to="/student/profile">
                            <Button variant="secondary">
                                <IoPersonOutline className="inline mr-2" size={20} />
                                Profile
                            </Button>
                        </Link>
                    </div>
                </div >

                {/* Dashboard Cards */}
                < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" >
                    {/* My Seat */}
                    < Link to="/student/seat" className="h-full block" >
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
                    </Link >

                    {/* Attendance */}
                    < Link to="/student/attendance" className="h-full block" >
                        <Card delay={0.1} className="h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <IoCalendarOutline size={32} className={getAttendanceColor(dashboardData?.attendance?.percentage || 0)} />
                                    <span className="text-xs text-gray-400">VIEW DETAILS</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Attendance</h3>
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${getAttendanceColor(dashboardData?.attendance?.percentage || 0)}`}>{dashboardData?.attendance?.percentage || 0}%</p>
                                <p className="text-sm text-gray-400">
                                    {dashboardData?.attendance?.present || 0} / {dashboardData?.attendance?.total || 0} days
                                </p>
                            </div>
                        </Card>
                    </Link >

                    {/* Fee Status */}
                    < Link to="/student/fees" className="h-full block" >
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
                    </Link >

                    {/* Notifications */}
                    < Link to="/student/notifications" className="h-full block" >
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
                    </Link >
                </div >

                {/* Quick Actions */}
                < Card >
                    <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div onClick={() => setShowScanner(true)} className="h-full">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                <div className="bg-gradient-to-br from-green-500 to-teal-500 p-4 rounded-xl shadow-lg group-hover:shadow-green-500/30 transition-shadow">
                                    <IoScan size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-200 transition-colors">Scan Entry/Exit</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Mark Attendance</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </div>
                        <div onClick={() => setShowIDCard(true)} className="h-full">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-xl shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                                    <IoIdCardOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-blue-200 transition-colors">Virtual ID Card</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">View & Download</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </div>

                        <Link to="/student/chat" className="block h-full">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-xl shadow-lg group-hover:shadow-orange-500/30 transition-shadow">
                                    <IoChatbubblesOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-200 transition-colors">Discussion Room</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Study Chat</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-orange-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </Link>

                        <Link to="/student/planner" className="block h-full">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
                                    <IoBookOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">Study Planner</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Plan your day</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-purple-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </Link>

                        <Link to="/student/seat" className="block h-full">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-full relative group p-6 rounded-xl flex items-center gap-4 cursor-pointer bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
                                    <IoBedOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">View Seat on Map</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">See where you sit</p>
                                </div>
                                <IoArrowForward className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-cyan-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        </Link>

                        {/* Help & Support Action */}
                        <div className="h-full relative group p-6 rounded-xl flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-white/20 hover:shadow-xl transition-all duration-300 shadow-sm dark:shadow-none">
                            <div
                                onClick={() => setShowSupportModal(true)}
                                className="flex-1 flex items-center gap-4 cursor-pointer"
                            >
                                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-4 rounded-xl shadow-lg group-hover:shadow-yellow-500/30 transition-shadow">
                                    <IoHelpCircleOutline size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-200 transition-colors">Help & Support</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Report Issues</p>
                                </div>
                            </div>

                            <IoArrowForward
                                onClick={() => setShowSupportModal(true)}
                                className="ml-auto text-gray-400 dark:text-gray-600 group-hover:text-yellow-600 dark:group-hover:text-white cursor-pointer hover:scale-110 transition-all"
                                title="New Request"
                            />

                            {dashboardData?.requestsCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowHistoryModal(true);
                                    }}
                                    className="absolute bottom-4 right-4 text-xs text-yellow-600 dark:text-yellow-500 hover:text-yellow-500 dark:hover:text-yellow-400 underline underline-offset-2 z-10"
                                >
                                    View Status
                                </button>
                            )}
                        </div>
                    </div>
                </Card >

                {/* LMS Guide Section */}
                < LmsGuideSection />

                {/* Floating Scan Button */}
                < motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowScanner(true)}
                    className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-full shadow-2xl shadow-green-500/40 text-white border border-white/20 backdrop-blur-sm"
                >
                    <IoScan size={28} />
                </motion.button >

                <Footer />
            </div >
        </div >
    );
};

export default StudentDashboard;
