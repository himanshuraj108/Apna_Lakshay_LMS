import { useAuth } from '../context/AuthContext';

/**
 * Returns the correct "back to dashboard" path based on the logged-in role.
 * - Super admin → /admin
 * - Sub-admin   → /sub-admin
 * - Student     → /student
 */
const useBackPath = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'subadmin') return '/sub-admin';
    return '/student';
};

export default useBackPath;
