import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useSocket } from './hooks/useSocket';
import PwaInstallBanner from './components/ui/PwaInstallBanner';

// ==========================================
// PERFORMANCE OPTIMIZATION: Code Splitting with React.lazy()
// All page components are loaded on-demand, reducing initial bundle size
// from ~800KB to <200KB
// ==========================================

// Loading Fallback Component
const PageLoader = () => {
    const barRef = useRef(null);

    useEffect(() => {
        // Inject top progress bar
        const bar = document.createElement('div');
        bar.className = 'page-progress-bar';
        document.body.appendChild(bar);
        barRef.current = bar;
        return () => { bar.remove(); };
    }, []);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
            style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(239,68,68,0.08) 0%, transparent 60%), #030712' }}>

            {/* Logo card */}
            <div className="relative flex flex-col items-center gap-6">
                {/* Spinning ring */}
                <div className="relative w-24 h-24">
                    <svg className="loader-ring absolute inset-0 w-full h-full" viewBox="0 0 96 96" fill="none">
                        <circle cx="48" cy="48" r="44" stroke="rgba(249,115,22,0.15)" strokeWidth="4" />
                        <circle cx="48" cy="48" r="44"
                            stroke="url(#loaderGrad)" strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="138 138"
                            strokeDashoffset="104" />
                        <defs>
                            <linearGradient id="loaderGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Icon in centre */}
                    <div className="loader-logo absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="loader-text flex flex-col items-center gap-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent tracking-wide">
                        Study Portal
                    </h2>
                    <p className="text-gray-500 text-sm">Loading, please wait…</p>

                    {/* Inline dots */}
                    <div className="flex gap-1.5 mt-1">
                        {[0, 1, 2].map(i => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500/60"
                                style={{ animation: `logo-pulse 1.2s ease ${i * 0.2}s infinite` }} />
                        ))}
                    </div>
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

function App() {
    const { user, loading, systemStatus } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Force Desktop Mode for Admin Routes
    useEffect(() => {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        if (location.pathname.startsWith('/admin')) {
            // Force desktop layout with a wide viewport
            viewport.setAttribute('content', 'width=1280');
            // Add a class to body for any targeted CSS overrides if needed
            document.body.classList.add('admin-desktop-mode');
        } else {
            // Restore normal responsive layout
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            document.body.classList.remove('admin-desktop-mode');
        }
    }, [location.pathname]);

    // Initialize global socket connection for online status tracking
    useSocket(!!user);

    // Global Maintenance Check
    useEffect(() => {
        if (loading) return;

        if (systemStatus === 'maintenance') {
            const isMaintenancePage = location.pathname === '/maintenance';
            const isAdmin = user?.role === 'admin';

            // Check for admin override via URL query param
            const searchParams = new URLSearchParams(location.search);
            const adminOverride = searchParams.get('access') === 'admin';

            // Allow access if:
            // 1. It's the maintenance page
            // 2. User is already an admin
            // 3. User is accessing login with ?access=admin
            if (!isMaintenancePage && !isAdmin && !adminOverride) {
                navigate('/maintenance');
            }
        }
    }, [systemStatus, loading, user, location, navigate]);

    if (loading) {
        return null; // Don't show spinner, just blank (or nothing) while initializing
    }

    return (
        <Suspense key={location.pathname} fallback={<PageLoader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/public-seats" element={<PublicSeatView />} />
                <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/student'} /> : <Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<ContactAdmin />} />
                <Route path="/pending-allocation" element={<AccessDeniedPending />} />
                <Route path="/office/attendance" element={<SecurityAttendance />} />
                <Route path="/office/vacant-seats" element={<PublicVacantSeats />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/students" element={<ProtectedRoute adminOnly><StudentManagement /></ProtectedRoute>} />
                <Route path="/admin/floors" element={<ProtectedRoute adminOnly><FloorManagement /></ProtectedRoute>} />
                <Route path="/admin/attendance" element={<ProtectedRoute adminOnly><AttendanceManagement /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AnalyticsDashboard /></ProtectedRoute>} />
                <Route path="/admin/fees" element={<ProtectedRoute adminOnly><FeeManagement /></ProtectedRoute>} />
                <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><NotificationManagement /></ProtectedRoute>} />
                <Route path="/admin/requests" element={<ProtectedRoute adminOnly><RequestManagement /></ProtectedRoute>} />
                <Route path="/admin/kiosk" element={<ProtectedRoute adminOnly><QrKiosk /></ProtectedRoute>} />
                <Route path="/admin/shifts" element={<ProtectedRoute adminOnly><ShiftManagement /></ProtectedRoute>} />
                <Route path="/admin/history" element={<ProtectedRoute adminOnly><ActionHistory /></ProtectedRoute>} />
                <Route path="/admin/password-activity" element={<ProtectedRoute adminOnly><PasswordActivity /></ProtectedRoute>} />
                <Route path="/admin/verify/:id" element={<ProtectedRoute adminOnly><VerifyStudent /></ProtectedRoute>} />
                <Route path="/admin/chat" element={<ProtectedRoute adminOnly><ChatManagement /></ProtectedRoute>} />
                <Route path="/admin/chat-history" element={<ProtectedRoute adminOnly><StudentChatHistory /></ProtectedRoute>} />
                <Route path="/admin/manage-cards" element={<ProtectedRoute adminOnly><ManageCards /></ProtectedRoute>} />
                <Route path="/admin/vacant-seats" element={<ProtectedRoute adminOnly><VacantSeats /></ProtectedRoute>} />

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

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <PwaInstallBanner />
        </Suspense>
    );
}

export default App;
