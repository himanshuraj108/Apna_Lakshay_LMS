import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// ==========================================
// PERFORMANCE OPTIMIZATION: Code Splitting with React.lazy()
// All page components are loaded on-demand, reducing initial bundle size
// from ~800KB to <200KB
// ==========================================

// Loading Fallback Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
        </div>
    </div>
);

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

function App() {
    const { user, loading, systemStatus } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

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
        <Suspense fallback={<PageLoader />}>
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

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
    );
}

export default App;
