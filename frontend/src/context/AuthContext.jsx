import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState('active');
    const [isSubAdminVerified, setSubAdminVerified] = useState(false);
    const [forceDoubtBoard, setForceDoubtBoard] = useState(false);

    const checkSystemStatus = async () => {
        try {
            const response = await api.get('/settings/public');
            if (response.data.success && response.data.settings) {
                setSystemStatus(response.data.settings.systemStatus || 'active');
                setForceDoubtBoard(!!response.data.settings.forceDoubtBoard);
            }
        } catch (error) {
            console.error('Failed to check system status:', error);
        }
    };

    // Live polling every 4 seconds
    useEffect(() => {
        const interval = setInterval(checkSystemStatus, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            if (token && savedUser) { setUser(JSON.parse(savedUser)); }
            await checkSystemStatus();
            if (token) { await checkAuth(); }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            try {
                const meRes = await api.get('/auth/me');
                if (meRes.data.success) { updateUser(meRes.data.user); }
            } catch (_) {}
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

    const updateUser = (userData) => {
        setUser((prevUser) => {
            const currentVal = prevUser || JSON.parse(localStorage.getItem('user')) || {};
            const newUser = { ...currentVal, ...userData };
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (systemStatus === 'maintenance' && savedUser?.role === 'student') { return; }
            const res = await api.get('/auth/me');
            if (res.data.success) { updateUser(res.data.user); }
        } catch (error) { console.error('Failed to update auth context:', error); }
    };

    const value = {
        user, setUser, loading, systemStatus, forceDoubtBoard,
        isSubAdminVerified, setSubAdminVerified,
        checkSystemStatus, checkAuth, login, logout, updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSubAdmin: user?.role === 'subadmin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};