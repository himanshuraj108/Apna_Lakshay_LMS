import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SubAdminPinGuard from './components/admin/SubAdminPinGuard';
import { useSocket } from './hooks/useSocket';
import PwaInstallBanner from './components/ui/PwaInstallBanner';
import PinLockScreen from './components/ui/PinLockScreen';
import ForcedDoubtOverlay from './components/ForcedDoubtOverlay';

// ==========================================
// PERFORMANCE OPTIMIZATION: Code Splitting with React.lazy()
// All page components are loaded on-demand, reducing initial bundle size
// from ~800KB to <200KB
// ==========================================

// Loading Fallback Component (High Production Grade)
const PageLoader = () => {
    const barRef = useRef(null);

    useEffect(() => {
        const bar = document.createElement('div');
        bar.className = 'page-progress-bar';
        document.body.appendChild(bar);
        barRef.current = bar;
        return () => { bar.remove(); };
    }, []);

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center z-50 select-none"
            style={{
                backgroundColor: 'rgba(250, 246, 240, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}
        >
            <style>{`
                @keyframes orbitSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulseLogo {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 14px rgba(249,115,22,0.25)); }
                    50% { transform: scale(1.04); filter: drop-shadow(0 8px 22px rgba(249,115,22,0.45)); }
                }
                @keyframes liquidBar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(50%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>

            {/* Seamless Frameless Loader Content */}
            <div className="relative flex flex-col items-center gap-5 z-10 text-center">
                {/* Logo with Orbiting Glowing Ring */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Outer Rotating Energy Ring */}
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                        style={{ animation: 'orbitSpin 1.8s linear infinite' }}
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="rgba(249, 115, 22, 0.12)"
                            strokeWidth="3"
                            fill="none"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="url(#alOrangeGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray="90 190"
                            fill="none"
                        />
                        <defs>
                            <linearGradient id="alOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F97316" />
                                <stop offset="100%" stopColor="#EA580C" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Official AL Logo inside */}
                    <img
                        src="/app-icon-192.png"
                        alt="Apna Lakshay"
                        className="w-14 h-14 rounded-2xl object-cover relative z-10"
                        style={{
                            boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                            animation: 'pulseLogo 2.4s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* Brand Titles */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                        Apna <span style={{ color: '#F97316' }}>Lakshay</span>
                    </h2>
                    <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                        style={{
                            background: 'rgba(249, 115, 22, 0.08)',
                            color: '#EA580C',
                            border: '1px solid rgba(249, 115, 22, 0.2)',
                        }}
                    >
                        Library Management System
                    </span>
                </div>

                {/* Sleek Liquid Progress Bar */}
                <div
                    className="w-36 h-1 rounded-full overflow-hidden relative"
                    style={{ background: '#F0EDE8' }}
                >
                    <div
                        className="absolute inset-y-0 w-20 rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, #F97316, #FB923C, #F97316)',
                            boxShadow: '0 0 10px rgba(249, 115, 22, 0.6)',
                            animation: 'liquidBar 1.6s ease-in-out infinite',
                        }}
                    />
                </div>

                {/* Status Text with Animated Dots */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span>Loading workspace</span>
                    <span className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => (
                            <span
                                key={i}
                                className="w-1 h-1 rounded-full bg-orange-500"
                                style={{
                                    animation: `pulseLogo 1.2s ease-in-out ${i * 0.2}s infinite`,
                                }}
                            />
                        ))}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Public Pages - Lazy Loaded
const PublicSeatView = lazy(() => import('./pages/public/PublicSeatView'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Register = lazy(() => import('./pages/Register'));
const MaintenancePage = lazy(() => import('./pages/public/MaintenancePage'));
const PrivacyPolicy = lazy(() => import('./pages/common/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/common/TermsOfService'));
const AccessDeniedPending = lazy(() => import('./pages/public/AccessDeniedPending'));
const ContactAdmin = lazy(() => import('./pages/common/ContactAdmin'));
const SecurityAttendance = lazy(() => import('./pages/public/SecurityAttendance'));
const PublicVacantSeats = lazy(() => import('./pages/public/PublicVacantSeats'));

// Admin Pages - Lazy Loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const FloorManagement = lazy(() => import('./pages/admin/FloorManagement'));
const AttendanceManagement = lazy(() => import('./pages/admin/AttendanceManagement'));
const FeeManagement = lazy(() => import('./pages/admin/FeeManagement'));
const NotificationManagement = lazy(() => import('./pages/admin/NotificationManagement'));
const RequestManagement = lazy(() => import('./pages/admin/RequestManagement'));
const ActionHistory = lazy(() => import('./pages/admin/ActionHistory'));
const PasswordActivity = lazy(() => import('./pages/admin/PasswordActivity'));
const VerifyStudent = lazy(() => import('./pages/admin/VerifyStudent'));
const ShiftManagement = lazy(() => import('./pages/admin/ShiftManagement'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const QrKiosk = lazy(() => import('./pages/admin/QrKiosk'));
const ChatManagement = lazy(() => import('./pages/admin/ChatManagement'));
const ManageCards = lazy(() => import('./pages/admin/ManageCards'));
const StudentChatHistory = lazy(() => import('./pages/admin/StudentChatHistory'));
const VacantSeats = lazy(() => import('./pages/admin/VacantSeats'));
const SubAdminManagement = lazy(() => import('./pages/admin/SubAdminManagement'));
const SubAdminDashboard = lazy(() => import('./pages/admin/SubAdminDashboard'));
const StudentActivities = lazy(() => import('./pages/admin/StudentActivities'));
const AIActivityLogs = lazy(() => import('./pages/admin/AIActivityLogs'));
const AdminReferralWallet = lazy(() => import('./pages/admin/AdminReferralWallet'));


// Student Pages - Lazy Loaded
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MySeat = lazy(() => import('./pages/student/MySeat'));
const Attendance = lazy(() => import('./pages/student/Attendance'));
const StudyPlanner = lazy(() => import('./pages/student/StudyPlanner'));
const FeeStatus = lazy(() => import('./pages/student/FeeStatus'));
const Notifications = lazy(() => import('./pages/student/Notifications'));
const Profile = lazy(() => import('./pages/student/Profile'));
const ViewSeats = lazy(() => import('./pages/student/ViewSeats'));
const DiscussionRoom = lazy(() => import('./pages/student/DiscussionRoom'));
const BooksPage = lazy(() => import('./pages/student/BooksPage'));
const NotesPage = lazy(() => import('./pages/student/NotesPage'));
const MockTestPage = lazy(() => import('./pages/student/MockTestPage'));
const MonthlyReport = lazy(() => import('./pages/student/MonthlyReport'));
const DoubtBoard = lazy(() => import('./pages/student/DoubtBoard'));
const CurrentAffairs = lazy(() => import('./pages/student/CurrentAffairs'));
const ExamAlerts = lazy(() => import('./pages/student/ExamAlerts'));
const AIStudyPlanner = lazy(() => import('./pages/student/AIStudyPlanner'));
const AITestAnalyzer = lazy(() => import('./pages/student/AITestAnalyzer'));
const AINoteSummarizer = lazy(() => import('./pages/student/AINoteSummarizer'));
const AICurrentAffairsQuiz = lazy(() => import('./pages/student/AICurrentAffairsQuiz'));
const AITaskSuggestions = lazy(() => import('./pages/student/AITaskSuggestions'));
const AIReadinessScore = lazy(() => import('./pages/student/AIReadinessScore'));
const WalletPage = lazy(() => import('./pages/student/WalletPage'));

function App() {
    const { user, loading, systemStatus, forceDoubtBoard } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    // When student firstly enters, it will show if admin has toggle ON
    // Clicking the red cross will dismiss it for the current viewing session
    const [doubtDismissed, setDoubtDismissed] = useState(false);

    // When admin turns force OFF, reset dismissed so it triggers again when turned ON
    useEffect(() => {
        if (!forceDoubtBoard) {
            setDoubtDismissed(false);
        }
    }, [forceDoubtBoard]);

    // Ensure viewport is always responsive across all routes
    useEffect(() => {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        // Always use standard responsive layout
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        document.body.classList.remove('admin-desktop-mode');
    }, [location.pathname]);

    // Initialize global socket connection for online status tracking
    useSocket(!!user);

    // Global Maintenance Check
    useEffect(() => {
        if (loading) return;

        const isMaintenancePage = location.pathname === '/maintenance';
        const isAdmin = user?.role === 'admin' || user?.role === 'subadmin';

        if (systemStatus === 'maintenance') {
            // When maintenance is active, only authorized admins can access non-maintenance routes
            if (!isMaintenancePage && !isAdmin) {
                navigate('/maintenance');
            }
        } else if (systemStatus === 'active' && isMaintenancePage) {
            // When maintenance ends, automatically route back without forcing students to re-login
            if (user?.role === 'subadmin') {
                navigate('/sub-admin');
            } else if (user?.role === 'admin') {
                navigate('/admin');
            } else if (user?.role === 'student') {
                navigate('/student');
            } else {
                navigate('/login');
            }
        }
    }, [systemStatus, loading, user, location.pathname, navigate]);

    if (loading) {
        return null; // Don't show spinner, just blank (or nothing) while initializing
    }

    return (
        <PinLockScreen>
            <Suspense key={location.pathname} fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/public-seats" element={<PublicSeatView />} />
                    <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'subadmin' ? '/sub-admin' : '/student'} /> : <Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/contact" element={<ContactAdmin />} />
                    <Route path="/pending-allocation" element={<AccessDeniedPending />} />
                    <Route path="/office/attendance" element={<SecurityAttendance />} />
                    <Route path="/office/vacant-seats" element={<PublicVacantSeats />} />

                    {/* Admin Routes — Super Admin ONLY (sub-admins are redirected to /sub-admin) */}
                    <Route path="/admin" element={<ProtectedRoute superAdminOnly><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/floors" element={<ProtectedRoute superAdminOnly><FloorManagement /></ProtectedRoute>} />
                    <Route path="/admin/analytics" element={<ProtectedRoute superAdminOnly><AnalyticsDashboard /></ProtectedRoute>} />
                    <Route path="/admin/kiosk" element={<ProtectedRoute superAdminOnly><QrKiosk /></ProtectedRoute>} />
                    <Route path="/admin/shifts" element={<ProtectedRoute superAdminOnly><ShiftManagement /></ProtectedRoute>} />
                    <Route path="/admin/history" element={<ProtectedRoute superAdminOnly><ActionHistory /></ProtectedRoute>} />
                    <Route path="/admin/password-activity" element={<ProtectedRoute superAdminOnly><PasswordActivity /></ProtectedRoute>} />
                    <Route path="/admin/verify/:id" element={<ProtectedRoute superAdminOnly><VerifyStudent /></ProtectedRoute>} />
                    <Route path="/admin/chat" element={<ProtectedRoute superAdminOnly><ChatManagement /></ProtectedRoute>} />
                    <Route path="/admin/chat-history" element={<ProtectedRoute superAdminOnly><StudentChatHistory /></ProtectedRoute>} />
                    <Route path="/admin/manage-cards" element={<ProtectedRoute superAdminOnly><ManageCards /></ProtectedRoute>} />
                    <Route path="/admin/sub-admins" element={<ProtectedRoute superAdminOnly><SubAdminManagement /></ProtectedRoute>} />
                    <Route path="/admin/activities" element={<ProtectedRoute superAdminOnly><StudentActivities /></ProtectedRoute>} />
                    <Route path="/admin/ai-activity" element={<ProtectedRoute superAdminOnly><AIActivityLogs /></ProtectedRoute>} />
                    <Route path="/admin/referral-wallet" element={<ProtectedRoute superAdminOnly><AdminReferralWallet /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute superAdminOnly><Settings /></ProtectedRoute>} />


                    {/* Admin Routes — Sub-Admin accessible (based on permissions granted by super admin) */}
                    <Route path="/admin/students" element={<ProtectedRoute adminOnly><StudentManagement /></ProtectedRoute>} />
                    <Route path="/admin/attendance" element={<ProtectedRoute adminOnly><AttendanceManagement /></ProtectedRoute>} />
                    <Route path="/admin/fees" element={<ProtectedRoute adminOnly><FeeManagement /></ProtectedRoute>} />
                    <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><NotificationManagement /></ProtectedRoute>} />
                    <Route path="/admin/requests" element={<ProtectedRoute adminOnly><RequestManagement /></ProtectedRoute>} />
                    <Route path="/admin/vacant-seats" element={<ProtectedRoute adminOnly><VacantSeats /></ProtectedRoute>} />

                    {/* Sub-Admin Dashboard */}
                    <Route path="/sub-admin" element={<ProtectedRoute><SubAdminDashboard /></ProtectedRoute>} />


                    {/* Student Routes */}
                    <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/student/view-seats" element={<ProtectedRoute><ViewSeats /></ProtectedRoute>} />
                    <Route path="/student/seat" element={<ProtectedRoute><MySeat /></ProtectedRoute>} />
                    <Route path="/student/attendance" element={<ProtectedRoute requireSeat><Attendance /></ProtectedRoute>} />
                    <Route path="/student/planner" element={<ProtectedRoute requireSeat><StudyPlanner /></ProtectedRoute>} />
                    <Route path="/student/fees" element={<ProtectedRoute><FeeStatus /></ProtectedRoute>} />
                    <Route path="/student/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/student/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/student/chat" element={<ProtectedRoute requireSeat><DiscussionRoom /></ProtectedRoute>} />
                    <Route path="/student/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
                    <Route path="/student/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                    <Route path="/student/mock-test" element={<ProtectedRoute><MockTestPage /></ProtectedRoute>} />
                    <Route path="/student/report" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
                    <Route path="/student/doubt" element={<ProtectedRoute requireSeat><DoubtBoard /></ProtectedRoute>} />
                    <Route path="/student/current-affairs" element={<ProtectedRoute><CurrentAffairs /></ProtectedRoute>} />
                    <Route path="/student/exam-alerts" element={<ProtectedRoute><ExamAlerts /></ProtectedRoute>} />
                    <Route path="/student/ai/study-planner" element={<ProtectedRoute><AIStudyPlanner /></ProtectedRoute>} />
                    <Route path="/student/ai/test-analyzer" element={<ProtectedRoute><AITestAnalyzer /></ProtectedRoute>} />
                    <Route path="/student/ai/note-summarizer" element={<ProtectedRoute><AINoteSummarizer /></ProtectedRoute>} />
                    <Route path="/student/ai/current-affairs-quiz" element={<ProtectedRoute><AICurrentAffairsQuiz /></ProtectedRoute>} />
                    <Route path="/student/ai/task-suggestions" element={<ProtectedRoute><AITaskSuggestions /></ProtectedRoute>} />
                    <Route path="/student/ai/readiness-score" element={<ProtectedRoute><AIReadinessScore /></ProtectedRoute>} />
                    <Route path="/student/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <PwaInstallBanner />
            </Suspense>
            {/* Force Doubt Board overlay: shown to students when admin enables it */}
            {forceDoubtBoard && user?.role === 'student' && !doubtDismissed && location.pathname !== '/student/doubt' && (
                <ForcedDoubtOverlay onClose={() => setDoubtDismissed(true)} />
            )}
        </PinLockScreen>
    );
}

export default App;
