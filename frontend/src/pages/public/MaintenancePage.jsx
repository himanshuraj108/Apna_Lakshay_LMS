import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    IoShieldCheckmark, IoLockClosed, IoPerson, IoEye, IoEyeOff,
    IoArrowBack, IoArrowForward, IoTimeOutline, IoAlertCircleOutline,
    IoConstructOutline, IoCheckmarkCircle
} from 'react-icons/io5';

/* ─── Official AL Logo ──────────────────────────────────────────────── */
const ALLogo = ({ size = 72 }) => (
    <motion.div
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
    >
        <img
            src="/app-icon-192.png"
            alt="Apna Lakshay"
            style={{
                width: size,
                height: size,
                borderRadius: Math.round(size * 0.22) + 'px',
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(249,115,22,0.22), 0 2px 8px rgba(249,115,22,0.10)',
            }}
        />
        {/* Subtle pulse ring */}
        <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: Math.round(size * 0.22) + 'px', border: '2px solid rgba(249,115,22,0.35)' }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
    </motion.div>
);

/* ─── Floating dot ──────────────────────────────────────────────────── */
const Dot = ({ style }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={style}
        animate={{ y: [0, -18, 0], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: style.dur, repeat: Infinity, ease: 'easeInOut', delay: style.delay }}
    />
);

const dots = Array.from({ length: 14 }, (_, i) => ({
    width: `${5 + Math.random() * 6}px`,
    height: `${5 + Math.random() * 6}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    background: i % 2 === 0 ? 'rgba(249,115,22,0.25)' : 'rgba(251,146,60,0.18)',
    dur: 3.5 + Math.random() * 3,
    delay: Math.random() * 3,
}));

/* ─── Status Step ───────────────────────────────────────────────────── */
const StatusStep = ({ done, label }) => (
    <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'bg-orange-100 border-2 border-orange-300'}`}>
            {done
                ? <IoCheckmarkCircle size={13} className="text-white" />
                : <motion.div className="w-2 h-2 rounded-full bg-orange-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            }
        </div>
        <span className={`text-[12px] font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
    </div>
);

/* ─── Main Component ────────────────────────────────────────────────── */
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
                navigate(userData?.role === 'subadmin' ? '/sub-admin' : '/admin');
            } else {
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
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden select-none p-4"
            style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #fef3e2 45%, #fff7ed 100%)' }}
        >
            {/* Ambient blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.09) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
                    style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            {/* Dot pattern */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(249,115,22,0.09) 1px, transparent 0)', backgroundSize: '36px 36px' }} />

            {/* Floating dots */}
            {dots.map((d, i) => <Dot key={i} style={d} />)}

            <AnimatePresence mode="wait">
                {!showAdminLogin ? (
                    /* ── VIEW 1: Maintenance Notice ── */
                    <motion.div
                        key="maintenance-card"
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
                        className="relative z-10 flex flex-col items-center text-center max-w-[420px] w-full"
                        style={{
                            background: 'rgba(255,255,255,0.82)',
                            border: '1.5px solid rgba(249,115,22,0.18)',
                            borderRadius: '28px',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(249,115,22,0.10), 0 1px 2px rgba(0,0,0,0.06)',
                            padding: '40px 36px 36px',
                        }}
                    >
                        {/* Top orange bar */}
                        <div className="absolute top-0 left-8 right-8 h-[3px] rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, #f97316, #fb923c, #f97316, transparent)' }} />

                        {/* AL Logo */}
                        <div className="mb-5">
                            <ALLogo size={72} />
                        </div>

                        {/* Brand name */}
                        <div className="mb-1">
                            <span className="text-[11px] font-black tracking-[0.22em] uppercase text-orange-500">
                                Apna Lakshay
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-[28px] font-black text-slate-900 leading-tight mb-2 tracking-tight">
                            Under Maintenance
                        </h1>

                        {/* Orange divider */}
                        <div className="w-10 h-[3px] rounded-full mb-4" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />

                        {/* Description */}
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-2 max-w-[320px]">
                            We are performing scheduled improvements to deliver a better experience.
                        </p>
                        <p className="text-[12px] text-slate-400 font-semibold mb-6">
                            Your records and data are safe. We will be back shortly.
                        </p>

                        {/* Status checklist */}
                        <div className="w-full mb-6 p-4 rounded-2xl text-left space-y-2.5"
                            style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)' }}>
                            <StatusStep done label="Database optimization" />
                            <StatusStep done label="Security patches applied" />
                            <StatusStep done={false} label="System health checks" />
                            <StatusStep done={false} label="Restoring public access" />
                        </div>

                        {/* Live status pill */}
                        <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
                            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.20)' }}>
                            <motion.div
                                className="w-2 h-2 rounded-full bg-orange-500"
                                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-[11px] font-black text-orange-600 uppercase tracking-wider">Maintenance active</span>
                        </div>

                        {/* Student notice */}
                        {studentNotice && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 w-full p-3.5 rounded-2xl text-[12px] font-semibold text-amber-800 flex items-start gap-2.5 text-left"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                            >
                                <IoAlertCircleOutline size={18} className="shrink-0 text-amber-500 mt-px" />
                                <span className="leading-snug">{studentNotice}</span>
                            </motion.div>
                        )}

                        {/* Admin login button */}
                        <motion.button
                            onClick={() => setShowAdminLogin(true)}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm cursor-pointer relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                color: '#fff',
                                boxShadow: '0 4px 20px rgba(249,115,22,0.30), 0 1px 2px rgba(249,115,22,0.20)',
                            }}
                        >
                            {/* Shimmer sweep */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)', backgroundSize: '200% 100%' }}
                                animate={{ backgroundPosition: ['-200% center', '200% center'] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            />
                            <IoShieldCheckmark size={16} />
                            <span className="font-extrabold tracking-wide">Administrator Login</span>
                            <IoArrowForward size={14} className="opacity-80" />
                        </motion.button>

                        <p className="text-[11px] mt-4 text-slate-400 font-medium">
                            Restricted to authorized administrators only
                        </p>
                    </motion.div>
                ) : (
                    /* ── VIEW 2: Admin Login Panel ── */
                    <motion.div
                        key="admin-login-card"
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: shake ? [-8, 8, -5, 5, -2, 2, 0] : 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ duration: 0.45, type: 'spring', stiffness: 130 }}
                        className="relative z-10 max-w-[420px] w-full"
                        style={{
                            background: 'rgba(255,255,255,0.92)',
                            border: '1.5px solid rgba(249,115,22,0.22)',
                            borderRadius: '28px',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(249,115,22,0.12)',
                            padding: '36px 36px 32px',
                        }}
                    >
                        {/* Top orange bar */}
                        <div className="absolute top-0 left-8 right-8 h-[3px] rounded-full"
                            style={{ background: 'linear-gradient(90deg, transparent, #f97316, #fb923c, transparent)' }} />

                        {/* Header row */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => { setShowAdminLogin(false); setError(''); }}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
                            >
                                <IoArrowBack size={14} />
                                <span>Back</span>
                            </button>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.22)', color: '#f97316' }}>
                                <IoShieldCheckmark size={11} />
                                <span>Admin Portal</span>
                            </div>
                        </div>

                        {/* Logo + title */}
                        <div className="text-center mb-7">
                            <div className="flex justify-center mb-4">
                                <ALLogo size={64} />
                            </div>
                            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Admin Console</h2>
                            <p className="text-[12px] text-slate-500 mt-1 font-medium">Authorized access to management dashboard</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-5 p-3.5 rounded-xl text-[12px] font-semibold text-red-700 flex items-start gap-2"
                                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)' }}
                            >
                                <IoAlertCircleOutline size={16} className="shrink-0 mt-px text-red-500" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-600 mb-1.5 uppercase tracking-wider">
                                    Admin Email
                                </label>
                                <div className="relative flex items-center">
                                    <IoPerson className="absolute left-3.5 text-slate-400 pointer-events-none" size={15} />
                                    <input
                                        type="text"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        placeholder="admin@apnalakshay.com"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200"
                                        style={{
                                            background: '#f8fafc',
                                            border: '1.5px solid #e2e8f0',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.10)'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-600 mb-1.5 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative flex items-center">
                                    <IoLockClosed className="absolute left-3.5 text-slate-400 pointer-events-none" size={15} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200"
                                        style={{
                                            background: '#f8fafc',
                                            border: '1.5px solid #e2e8f0',
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.10)'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full mt-2 py-3.5 px-6 rounded-xl font-extrabold text-white text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all relative overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    boxShadow: '0 4px 20px rgba(249,115,22,0.28)',
                                }}
                            >
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)', backgroundSize: '200% 100%' }}
                                    animate={{ backgroundPosition: ['-200% center', '200% center'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                />
                                {loading ? (
                                    <>
                                        <IoTimeOutline size={17} className="animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to Admin Panel</span>
                                        <IoArrowForward size={15} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Security note */}
                        <p className="text-[11px] text-center text-slate-400 font-medium mt-5">
                            Secured connection — administrator credentials only
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <p className="absolute bottom-5 text-[11px] font-medium text-slate-400">
                © {new Date().getFullYear()} Apna Lakshay — Library Management System
            </p>
        </div>
    );
};

export default MaintenancePage;
