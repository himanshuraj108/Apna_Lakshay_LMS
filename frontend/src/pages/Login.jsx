import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    IoMail, IoLockClosed, IoArrowForward,
    IoEye, IoEyeOff, IoCheckmarkCircle,
    IoGridOutline, IoLocationOutline,
    IoBookOutline, IoCalendarOutline, IoSparklesOutline
} from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';
import AttendanceFloatingBtn from '../components/ui/AttendanceFloatingBtn';

/* ── Stats shown on left panel ──────────────────────────── */
const STATS = [
    { value: '100+', label: 'Active Students' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Access' },
];

/* ── Features ────────────────────────────────────────────── */
const FEATURES = [
    { icon: IoBookOutline,      text: 'Smart seat booking with real-time availability' },
    { icon: IoCalendarOutline,  text: 'QR + GPS verified attendance tracking' },
    { icon: IoSparklesOutline,  text: 'AI mock tests & doubt solving for exams' },
];

/* ── Input field component ───────────────────────────────── */
const Field = ({ label, icon: Icon, children }) => (
    <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#8892A4' }}>
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon size={16} style={{ color: '#4A5568' }} />
            </div>
            {children}
        </div>
    </div>
);

const Login = () => {
    useMobileViewport();
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState('');
    const [shake, setShake]               = useState(false);
    const [loading, setLoading]           = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login }    = useAuth();
    const navigate     = useNavigate();
    const location     = useLocation();

    useEffect(() => {
        if (location.state?.email && location.state?.password) {
            setEmail(location.state.email);
            setPassword(location.state.password);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (result.success) {
            const user = JSON.parse(localStorage.getItem('user'));
            navigate(user.role === 'admin' ? '/admin' : '/student');
        } else {
            setError(result.message);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
        setLoading(false);
    };

    const inputStyle = (field) => ({
        width: '100%',
        paddingLeft: '44px',
        paddingRight: field === 'password' ? '48px' : '16px',
        paddingTop: '13px',
        paddingBottom: '13px',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#E2E8F0',
        background: '#0D1117',
        border: focusedField === field
            ? '1.5px solid #F97316'
            : '1.5px solid #1E2A3A',
        outline: 'none',
        transition: 'border-color 0.15s ease',
        boxShadow: focusedField === field ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
    });

    return (
        <div className="min-h-screen flex" style={{ background: '#080D14', fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
                .shake { animation: shake 0.45s ease; }
                input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px #0D1117 inset !important; -webkit-text-fill-color: #E2E8F0 !important; }
            `}</style>

            {/* ══════════════════════════════════════
                LEFT BRAND PANEL — hidden on mobile
               ══════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[50%] flex-col justify-between relative"
                style={{ background: '#0B1220', borderRight: '1px solid #1A2332' }}>

                {/* Top nav bar */}
                <div className="flex items-center justify-between px-10 py-7"
                    style={{ borderBottom: '1px solid #1A2332' }}>
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: '#F97316' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-white text-base leading-none">Apna Lakshay</p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
                                style={{ color: '#F97316' }}>Library System</p>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="flex items-center gap-4">
                        <Link to="/public-seats"
                            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                            style={{ color: '#8892A4' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#E2E8F0'}
                            onMouseLeave={e => e.currentTarget.style.color = '#8892A4'}>
                            <IoGridOutline size={14} />
                            Seats
                        </Link>
                        <Link to="/contact"
                            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                            style={{ color: '#8892A4' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#E2E8F0'}
                            onMouseLeave={e => e.currentTarget.style.color = '#8892A4'}>
                            <IoLocationOutline size={14} />
                            Location
                        </Link>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col justify-center px-10 xl:px-14 py-12">

                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit mb-8"
                        style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-xs font-semibold" style={{ color: '#F97316' }}>Trusted by students</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="mb-10">
                        <h1 className="font-black leading-[1.1] mb-4"
                            style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', color: '#F1F5F9' }}>
                            Your Study Space,<br />
                            <span style={{ color: '#F97316' }}>Simplified.</span>
                        </h1>
                        <p className="text-base leading-relaxed max-w-sm" style={{ color: '#64748B' }}>
                            Everything a serious student needs — seat booking, attendance, fees, and AI-powered exam prep — in one platform.
                        </p>
                    </motion.div>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="flex items-center gap-6 mb-10 pb-10"
                        style={{ borderBottom: '1px solid #1A2332' }}>
                        {STATS.map((s, i) => (
                            <div key={i}>
                                <p className="text-2xl font-black" style={{ color: '#F1F5F9' }}>{s.value}</p>
                                <p className="text-xs font-medium" style={{ color: '#475569' }}>{s.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Features */}
                    <div className="space-y-5">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
                                className="flex items-center gap-3">
                                <IoCheckmarkCircle size={18} style={{ color: '#F97316', flexShrink: 0 }} />
                                <p className="text-sm" style={{ color: '#64748B' }}>{f.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom footer */}
                <div className="px-10 py-5 flex items-center gap-2"
                    style={{ borderTop: '1px solid #1A2332' }}>
                    <span className="text-xs" style={{ color: '#334155' }}>
                        © 2026 Apna Lakshay. Built for serious students.
                    </span>
                </div>
            </div>

            {/* ══════════════════════════════════════
                RIGHT FORM PANEL
               ══════════════════════════════════════ */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10 relative"
                style={{ background: '#080D14' }}>

                {/* Mobile brand header */}
                <div className="lg:hidden w-full max-w-sm mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#F97316' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-black text-white text-sm leading-none">Apna Lakshay</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                                style={{ color: '#F97316' }}>Library System</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/public-seats" className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: '#111827', border: '1px solid #1E2A3A', color: '#8892A4' }}>
                                <IoGridOutline size={12} /> View Seats
                            </button>
                        </Link>
                        <Link to="/contact" className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: '#111827', border: '1px solid #1E2A3A', color: '#8892A4' }}>
                                <IoLocationOutline size={12} /> Location
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className={`w-full max-w-sm ${shake ? 'shake' : ''}`}>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black mb-1.5" style={{ color: '#F1F5F9' }}>
                            Sign in to your account
                        </h2>
                        <p className="text-sm" style={{ color: '#475569' }}>
                            Enter your credentials to continue
                        </p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm mb-5"
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#F87171'
                                }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <Field label="Email or Mobile Number" icon={IoMail}>
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com or mobile number"
                                required
                                style={inputStyle('email')}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </Field>

                        {/* Password */}
                        <Field label="Password" icon={IoLockClosed}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{ ...inputStyle('password'), paddingRight: '48px' }}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none"
                                tabIndex={-1}
                                style={{ color: '#4A5568' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#8892A4'}
                                onMouseLeave={e => e.currentTarget.style.color = '#4A5568'}>
                                {showPassword ? <IoEyeOff size={17} /> : <IoEye size={17} />}
                            </button>
                        </Field>

                        {/* Forgot */}
                        <div className="flex justify-end -mt-1">
                            <Link to="/forgot-password"
                                className="text-xs font-semibold transition-colors"
                                style={{ color: '#F97316' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#FB923C'}
                                onMouseLeave={e => e.currentTarget.style.color = '#F97316'}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={!loading ? { opacity: 0.92 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                            style={{
                                background: loading ? '#1E2A3A' : '#F97316',
                                color: loading ? '#475569' : '#fff',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.02em'
                            }}>
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 rounded-full animate-spin"
                                        style={{ borderColor: '#334155', borderTopColor: '#64748B' }} />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <IoArrowForward size={15} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-xs mt-8" style={{ color: '#334155' }}>
                        Secure access · Contact admin to get your credentials
                    </p>
                </motion.div>
            </div>

            {/* Attendance floating btn */}
            <AttendanceFloatingBtn />
        </div>
    );
};

export default Login;
