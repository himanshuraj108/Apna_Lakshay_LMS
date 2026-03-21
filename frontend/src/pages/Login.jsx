import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    IoMail, IoLockClosed, IoGridOutline, IoArrowForward,
    IoEye, IoEyeOff, IoLocationOutline, IoCheckmarkCircle,
    IoBookOutline, IoCalendarOutline, IoPeopleOutline,
    IoSparklesOutline, IoShieldCheckmarkOutline
} from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';
import AttendanceFloatingBtn from '../components/ui/AttendanceFloatingBtn';

/* ── Feature list shown on the left brand panel ─────────────────────── */
const FEATURES = [
    { icon: IoBookOutline,          text: 'Smart seat management & real-time availability' },
    { icon: IoCalendarOutline,      text: 'Automated attendance with QR & geo-verification' },
    { icon: IoSparklesOutline,      text: 'AI-powered mock tests for competitive exams' },
    { icon: IoPeopleOutline,        text: 'Live discussion rooms & study collaboration' },
    { icon: IoShieldCheckmarkOutline, text: 'Secure encrypted access — your data is safe' },
];

/* ── Animated floating orb decorations ──────────────────────────────── */
const Orb = ({ style, className }) => (
    <div
        className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
        style={style}
    />
);

const Login = () => {
    useMobileViewport();
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]               = useState('');
    const [shake, setShake]               = useState(false);
    const [loading, setLoading]           = useState(false);
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
            setTimeout(() => setShake(false), 600);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex dark" style={{ background: '#080b12' }}>

            {/* ══════════════════════════════════════════════
                LEFT BRAND PANEL  — hidden on mobile
               ══════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">

                {/* Background gradient */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        background: 'linear-gradient(135deg, #0f1629 0%, #0a0e1a 40%, #0d1520 100%)',
                    }}
                />

                {/* Decorative orbs */}
                <Orb className="w-[500px] h-[500px] top-[-15%] left-[-15%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
                <Orb className="w-[400px] h-[400px] bottom-[-10%] right-[-10%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }} />
                <Orb className="w-[300px] h-[300px] top-[40%] left-[30%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)' }} />

                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0 z-0 opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Content */}
                <div className="relative z-10">
                    {/* Brand logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-16"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">Apna Lakshay</p>
                            <p className="text-orange-400/70 text-[10px] uppercase tracking-[0.2em] font-semibold mt-0.5">Library System</p>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] mb-4">
                            Your study space,
                            <br />
                            <span
                                className="bg-clip-text text-transparent"
                                style={{ backgroundImage: 'linear-gradient(90deg, #f97316, #ef4444)' }}
                            >
                                reimagined.
                            </span>
                        </h1>
                        <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                            A complete library management system built for serious students. Track your seat, attendance, fees and learning — all in one place.
                        </p>
                    </motion.div>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                                className="flex items-start gap-3"
                            >
                                <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                                    <f.icon size={15} className="text-orange-400" />
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed pt-1">{f.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom links row */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative z-10 flex items-center gap-4 mt-8"
                >
                    <Link to="/public-seats">
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
                        >
                            <IoGridOutline size={16} />
                            View Available Seats
                            <IoArrowForward size={14} />
                        </motion.button>
                    </Link>
                    <Link to="/contact" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors group">
                        <IoLocationOutline size={15} className="group-hover:text-orange-400 transition-colors" />
                        <span>Library Location</span>
                    </Link>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════
                RIGHT FORM PANEL
               ══════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-5 sm:px-8 py-8"
                style={{
                    background: 'linear-gradient(160deg, #0b0f1c 0%, #080b12 60%, #0c0a14 100%)',
                }}
            >
                {/* Subtle right-panel orbs */}
                <Orb className="w-[350px] h-[350px] top-[-10%] right-[-15%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />
                <Orb className="w-[300px] h-[300px] bottom-[-5%] left-[-10%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)' }} />

                {/* Mobile: compact brand + quick links */}
                <div className="lg:hidden w-full max-w-sm mb-5 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-white font-black text-base leading-none">
                                Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                            </p>
                            <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-0.5">Library System</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/public-seats" className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-300 font-semibold text-xs transition-all hover:bg-orange-500/15">
                                <IoGridOutline size={13} /> View Seats
                            </button>
                        </Link>
                        <Link to="/contact" className="flex-1">
                            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 font-semibold text-xs transition-all hover:bg-white/8">
                                <IoLocationOutline size={13} /> Location
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ── Login Card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`w-full max-w-sm relative z-10 ${shake ? 'shake-screen' : ''}`}
                >
                    {/* Card */}
                    <div
                        className="rounded-2xl border border-white/8 p-7 sm:p-8"
                        style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* Card header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white mb-1.5">Welcome back</h2>
                            <p className="text-gray-500 text-sm">Sign in to access your dashboard</p>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm overflow-hidden"
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email field */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <IoMail
                                            size={17}
                                            className="text-gray-600 group-focus-within:text-orange-400 transition-colors duration-200"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                        onFocus={e => {
                                            e.target.style.border = '1px solid rgba(249,115,22,0.5)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)';
                                        }}
                                        onBlur={e => {
                                            e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <IoLockClosed
                                            size={17}
                                            className="text-gray-600 group-focus-within:text-orange-400 transition-colors duration-200"
                                        />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                        onFocus={e => {
                                            e.target.style.border = '1px solid rgba(249,115,22,0.5)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)';
                                        }}
                                        onBlur={e => {
                                            e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-orange-400 transition-colors cursor-pointer focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <IoEyeOff size={17} /> : <IoEye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot password */}
                            <div className="flex justify-end -mt-1">
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit button */}
                            <motion.button
                                whileHover={!loading ? { scale: 1.015 } : {}}
                                whileTap={!loading ? { scale: 0.985 } : {}}
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    background: loading
                                        ? 'rgba(100,100,100,0.4)'
                                        : 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                                    boxShadow: loading ? 'none' : '0 8px 24px -4px rgba(249,115,22,0.4)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <IoArrowForward
                                            size={16}
                                            className="group-hover:translate-x-1 transition-transform duration-200"
                                        />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-white/6" />
                            <span className="text-[11px] text-gray-700 uppercase tracking-widest font-medium">or</span>
                            <div className="flex-1 h-px bg-white/6" />
                        </div>

                        {/* Register link */}
                        <p className="text-center text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link
                                to="/register"
                                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                            >
                                Create account
                            </Link>
                        </p>
                    </div>

                    {/* Below card */}
                    <p className="text-center text-[11px] text-gray-700 mt-5 flex items-center justify-center gap-2">
                        <IoShieldCheckmarkOutline size={13} className="text-gray-600" />
                        Protected by secure encryption · Ver 1.0.0
                    </p>
                </motion.div>
            </div>

            {/* Attendance floating btn — visible on login screen too */}
            <AttendanceFloatingBtn />
        </div>
    );
};

export default Login;
