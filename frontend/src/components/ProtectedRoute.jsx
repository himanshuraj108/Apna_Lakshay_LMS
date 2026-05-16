import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PWAInstallPrompt from './ui/PWAInstallPrompt';
import SubAdminPinGuard from './admin/SubAdminPinGuard';

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false, requireSeat = false }) => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isSubAdmin = user.role === 'subadmin';

    // Super-admin-only routes: sub-admins get bounced to their own dashboard
    if (superAdminOnly && !isAdmin) {
        return <Navigate to={isSubAdmin ? '/sub-admin' : '/'} replace />;
    }

    // adminOnly routes: allow super-admin OR sub-admin
    if (adminOnly && !isAdmin && !isSubAdmin) {
        return <Navigate to="/" replace />;
    }

    // requireSeat check — skip for admin and sub-admin roles
    if (requireSeat && user.role !== 'admin' && !isSubAdmin) {
        const hasSeat = user.seat || user.seatNumber;
        if (!hasSeat) {
            return <Navigate to="/pending-allocation" replace />;
        }
    }

    return (
        <SubAdminPinGuard>
            {children}
            <PWAInstallPrompt />
        </SubAdminPinGuard>
    );
};

export default ProtectedRoute;

