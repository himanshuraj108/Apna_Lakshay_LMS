import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import PublicSeatView from './pages/public/PublicSeatView';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Register from './pages/Register';
// import ServerCrash from './pages/ServerCrash'; // Deprecated
import MaintenancePage from './pages/public/MaintenancePage';
import PrivacyPolicy from './pages/common/PrivacyPolicy';
import TermsOfService from './pages/common/TermsOfService';
import AccessDeniedPending from './pages/public/AccessDeniedPending';
import ContactAdmin from './pages/common/ContactAdmin';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import FloorManagement from './pages/admin/FloorManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import FeeManagement from './pages/admin/FeeManagement';
import NotificationManagement from './pages/admin/NotificationManagement';
import RequestManagement from './pages/admin/RequestManagement';
import ActionHistory from './pages/admin/ActionHistory';

import PasswordActivity from './pages/admin/PasswordActivity';
import VerifyStudent from './pages/admin/VerifyStudent';
import ShiftManagement from './pages/admin/ShiftManagement';
import Settings from './pages/admin/Settings';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import QrKiosk from './pages/admin/QrKiosk';
import ChatManagement from './pages/admin/ChatManagement';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MySeat from './pages/student/MySeat';
import Attendance from './pages/student/Attendance';
import StudyPlanner from './pages/student/StudyPlanner';
import FeeStatus from './pages/student/FeeStatus';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';
import ViewSeats from './pages/student/ViewSeats';
import DiscussionRoom from './pages/student/DiscussionRoom';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/public-seats" element={<PublicSeatView />} />
            <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/student'} /> : <Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
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
    );
}

export default App;
