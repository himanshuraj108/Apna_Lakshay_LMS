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

    const checkSystemStatus = async () => {
        try {
            const response = await api.get('/settings/public');
            if (response.data.success) {
                setSystemStatus(response.data.settings.systemStatus);
            }
        } catch (error) {
            console.error('Failed to check system status:', error);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            // Check if user is logged in on mount
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
            }

            // Start system status check in background (instant open)
            checkSystemStatus();

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

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await api.get('/auth/me');
            if (res.data.success) {
                updateUser(res.data.user);
            }
        } catch (error) {
            console.error('Failed to update auth context:', error);
        }
    };

    const value = {
        user,
        loading,
        systemStatus,
        checkSystemStatus,
        checkAuth,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
