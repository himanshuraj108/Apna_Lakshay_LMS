import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requireSeat = false }) => {
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

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (requireSeat && user.role !== 'admin') {
        const hasSeat = user.seat || user.seatNumber;
        if (user.isActive && !hasSeat) {
            return <Navigate to="/pending-allocation" replace />;
        }
        // Also block inactive users if seat is required (redundant if backend blocks, but good for UI)
        if (!user.isActive) {
            // Maybe redirect to profile or show toast?
            // For now, let's focus on Pending Allocation as requested.
        }
    }

    return children;
};

export default ProtectedRoute;
