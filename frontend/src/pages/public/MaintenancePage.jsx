import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { IoShieldCheckmark, IoLockClosed, IoPerson, IoEye, IoEyeOff, IoArrowBack, IoArrowForward, IoTimeOutline, IoAlertCircleOutline } from 'react-icons/io5';

/* ── Floating ambient particle ────────────────────────────────────────── */
const Particle = ({ style }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={style}
        animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: style.duration, repeat: Infinity, ease: 'easeInOut', delay: style.delay }}
    />
);

const MaintenancePage = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [studentNotice, setStudentNotice] = useState('');
    const [shake, setShake] = useState(false);

    // Particles array
    const particles = Array.from({ length: 18 }, (_, i) => ({
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 8 + 4}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        background: i % 3 === 0
            ? 'rgba(249,115,22,0.4)'
            : i % 3 === 1
            ? 'rgba(251,146,60,0.25)'
            : 'rgba(255,237,213,0.3)',
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 3,
    }));

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');
        setStudentNotice('');
        if (!adminEmail.trim() || !adminPassword.trim()) {
            setError('Please enter both Email and Password');
            setShake(true);
            setTimeout(() => setShake(false), 450);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', {
                email: adminEmail.trim(),
                password: adminPassword
            });

            const { token, user: userData } = res.data;

            if (userData?.role === 'admin' || userData?.role === 'subadmin') {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                if (setUser) setUser(userData);
                navigate('/admin');
            } else {
                // Student account tried to sign in via admin terminal:
                // Do NOT save token or trigger backend requests
                // Smoothly close admin form and return to maintenance home screen
                setAdminEmail('');
                setAdminPassword('');
                setShowAdminLogin(false);
                setStudentNotice('Student account detected. Access is restricted to administrators during maintenance.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid administrator credentials');
            setShake(true);
            setTimeout(() => setShake(false), 450);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden select-none p-4"
            style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 40%, #1a0f00 70%, #0f0a00 100%)' }}>

            {/* Ambient bg glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full -translate-x-1/2"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            {/* Floating particles */}
            {particles.map((p, i) => <Particle key={i} style={p} />)}

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(249,115,22,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <AnimatePresence mode="wait">
                {!showAdminLogin ? (
                    /* ── VIEW 1: Under Maintenance Notice ── */
                    <motion.div
                        key="maintenance-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
                        className="relative z-10 flex flex-col items-center text-center px-8 py-12 max-w-md w-full"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(249,115,22,0.2)',
                            borderRadius: '28px',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 0 80px rgba(249,115,22,0.08), 0 20px 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-8 right-8 h-[1.5px] rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.7), rgba(251,146,60,1), rgba(249,115,22,0.7), transparent)' }} />

                        {/* Icon */}
                        <motion.div
                            animate={{ rotate: [0, -4, 4, -2, 2, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative"
                            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,146,60,0.08))', border: '1px solid rgba(249,115,22,0.25)' }}
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                <motion.path
                                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                    stroke="url(#iconGrad)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    animate={{ pathLength: [0.8, 1, 0.8] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                />
                                <defs>
                                    <linearGradient id="iconGrad" x1="0" y1="0" x2="24" y2="24">
                                        <stop offset="0%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#fb923c" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            {/* Glow ring */}
                            <motion.div
                                className="absolute inset-0 rounded-2xl"
                                animate={{ boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 0 8px rgba(249,115,22,0.08)', '0 0 0 0 rgba(249,115,22,0)'] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Brand */}
                        <div className="mb-2">
                            <span className="text-sm font-black tracking-widest uppercase" style={{ color: '#f97316', letterSpacing: '0.2em' }}>
                                Apna Lakshay
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
                            Under Maintenance
                        </h1>

                        {/* Divider */}
                        <div className="w-12 h-[2px] rounded-full mb-5" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />

                        {/* Description */}
                        <p className="text-sm font-medium leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            We're currently performing scheduled maintenance to optimize system performance.
                        </p>
                        <p className="text-xs font-semibold mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            All accounts & study records are safe. We will be back online shortly.
                        </p>

                        {/* Status indicator */}
                        <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
                            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)' }}>
                            <motion.div
                                className="w-2 h-2 rounded-full"
                                style={{ background: '#f97316' }}
                                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-xs font-bold" style={{ color: '#fb923c' }}>Maintenance mode active</span>
                        </div>

                        {/* Student Notice Banner */}
                        {studentNotice && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-3.5 rounded-2xl text-xs font-semibold text-amber-300 flex items-center gap-2.5 text-left w-full"
                                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
                            >
                                <IoAlertCircleOutline size={20} className="shrink-0 text-amber-400" />
                                <span className="leading-snug">{studentNotice}</span>
                            </motion.div>
                        )}

                        {/* Admin Login Button — Opens separate Admin Console */}
                        <motion.button
                            onClick={() => setShowAdminLogin(true)}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-bold text-sm relative overflow-hidden cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,146,60,0.08))',
                                border: '1px solid rgba(249,115,22,0.35)',
                                color: '#fb923c',
                                boxShadow: '0 4px 20px rgba(249,115,22,0.12)',
                            }}
                        >
                            {/* Shimmer */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(249,115,22,0.1) 50%, transparent 65%)', backgroundSize: '200% 100%' }}
                                animate={{ backgroundPosition: ['-200% center', '200% center'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            />
                            <IoLockClosed size={16} className="text-orange-500" />
                            <span className="font-extrabold tracking-wide">Administrator Login</span>
                        </motion.button>

                        <p className="text-[11px] mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            Administrator portal access only
                        </p>
                    </motion.div>
                ) : (
                    /* ── VIEW 2: Dedicated Administrator Login Terminal ── */
                    <motion.div
                        key="admin-login-card"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: shake ? [-6, 6, -4, 4, -2, 2, 0] : 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.45, type: 'spring', stiffness: 130 }}
                        className="relative z-10 px-8 py-10 max-w-md w-full"
                        style={{
                            background: 'rgba(18,14,12,0.85)',
                            border: '1.5px solid rgba(249,115,22,0.35)',
                            borderRadius: '28px',
                            backdropFilter: 'blur(25px)',
                            boxShadow: '0 0 90px rgba(249,115,22,0.12), 0 25px 70px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Top accent line */}
                        <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, #f97316, #fb923c, transparent)' }} />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => { setShowAdminLogin(false); setError(''); }}
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
                            >
                                <IoArrowBack size={14} />
                                <span>Back</span>
                            </button>

                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}>
                                <IoShieldCheckmark size={12} />
                                <span>Admin Portal</span>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
                                <IoLockClosed size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Admin Console</h2>
                            <p className="text-xs text-gray-400 mt-1">Authorized access to management dashboard</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3 rounded-xl text-xs font-semibold text-red-400 flex items-start gap-2"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                            >
                                <span>⚠️</span>
                                <span className="flex-1">{error}</span>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                                    Admin Email / ID
                                </label>
                                <div className="relative flex items-center">
                                    <IoPerson className="absolute left-3.5 text-gray-500 pointer-events-none" size={16} />
                                    <input
                                        type="text"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        placeholder="admin@apnalakshay.com"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                                        style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative flex items-center">
                                    <IoLockClosed className="absolute left-3.5 text-gray-500 pointer-events-none" size={16} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                                        style={{
                                            background: 'rgba(255,255,255,0.06)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 text-gray-400 hover:text-white p-1 transition-colors"
                                    >
                                        {showPassword ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full mt-6 py-3.5 px-6 rounded-xl font-extrabold text-white text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <IoTimeOutline size={18} className="animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to Admin Panel</span>
                                        <IoArrowForward size={16} />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom brand footer */}
            <p className="absolute bottom-6 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.2)' }}>
                © {new Date().getFullYear()} Apna Lakshay Library Management System
            </p>
        </div>
    );
};

export default MaintenancePage;
