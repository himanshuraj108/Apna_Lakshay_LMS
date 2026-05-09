import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    IoMail, IoLockClosed, IoArrowForward,
    IoEye, IoEyeOff, IoCheckmarkCircle,
    IoGridOutline, IoLocationOutline, IoLibraryOutline,
} from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';
import AttendanceFloatingBtn from '../components/ui/AttendanceFloatingBtn';

const STATS = [
    { value: '100+', label: 'Students' },
    { value: '95%', label: 'Satisfaction' },
    { value: '24/7', label: 'Access' },
];

const FEATURES = [
    'Smart seat booking with real-time availability',
    'QR + GPS verified daily attendance tracking',
    'AI mock tests & doubt solving for competitive exams',
    'Live discussion rooms & study collaboration',
];

/* ─── tiny reusable label+input wrapper ─── */
const Field = ({ label, id, children }) => (
    <div className="space-y-1.5">
        <label htmlFor={id}
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
            {label}
        </label>
        {children}
    </div>
);

export default function Login() {
    useMobileViewport();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.email && location.state?.password) {
            setEmail(location.state.email);
            setPassword(location.state.password);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);


    const handleEmailChange = (e) => {
        let val = e.target.value;
        if (/^[\d\s]+$/.test(val)) {
            val = val.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);
        }
        setEmail(val);
    };

    const progress = (() => {
        let eProg = 0;
        if (email.length > 0) {
            if (/^\d+$/.test(email)) {
                eProg = Math.min((email.length / 10) * 100, 100);
            } else {
                eProg = Math.min((email.length / 12) * 100, 100);
                if (email.toLowerCase().includes('gmail.') || email.toLowerCase().includes('@')) {
                    eProg = 100;
                }
            }
        }
        let pProg = Math.min((password.length / 6) * 100, 100);
        return Math.min(100, Math.max(0, 100 - eProg + pProg));
    })();

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
            setTimeout(() => setShake(false), 450);
        }
        setLoading(false);
    };

    const inputStyle = (name) => ({
        width: '100%',
        padding: name === 'password' ? '12px 46px 12px 42px' : '12px 16px 12px 42px',
        border: focused === name ? '1.5px solid #F97316' : '1.5px solid #D1D5DB',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#111827',
        background: '#fff',
        outline: 'none',
        boxShadow: focused === name ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
    });

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#fff' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
                .do-shake{animation:shake 0.45s ease;}
                input:-webkit-autofill{-webkit-box-shadow:0 0 0 50px #fff inset !important;-webkit-text-fill-color:#111827 !important;}
            `}</style>

            {/* ══════════════════════════════════════════
                LEFT PANEL — brand / features (desktop)
               ══════════════════════════════════════════ */}
            <div className="hidden lg:flex flex-col" style={{
                width: '48%', background: '#FFF8F3',
                borderRight: '1px solid #FED7AA',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Subtle top stripe */}
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)' }} />

                {/* Top nav */}
                <div style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontWeight: 900, fontSize: 18, color: '#111827', lineHeight: 1 }}>Apna Lakshay</p>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 4 }}>Library System</p>
                        </div>
                    </div>
                    {/* Nav links */}
                    <div style={{ display: 'flex', gap: 20 }}>
                        <Link to="/public-seats" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#EA580C', background: '#FFF7ED', border: '1px solid #FED7AA', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#FFEDD5'} onMouseOut={e => e.currentTarget.style.background = '#FFF7ED'}>
                            <IoGridOutline size={14} /> Seats
                        </Link>
                        <Link to="/contact" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: '#6B7280', textDecoration: 'none' }}>
                            <IoLocationOutline size={14} /> Location
                        </Link>
                    </div>
                </div>

                {/* Main brand content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px 40px' }}>

                    {/* Pill badge */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                            borderRadius: 100, marginBottom: 24, width: 'fit-content'
                        }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} className="animate-pulse" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#EA6B00', letterSpacing: '0.04em' }}>Trusted by 100+ students</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
                        style={{
                            fontSize: 'clamp(1.9rem, 2.8vw, 2.6rem)', fontWeight: 900,
                            color: '#111827', lineHeight: 1.15, marginBottom: 16
                        }}>
                        Your Study Space,<br />
                        <span style={{ color: '#F97316' }}>All in One Place.</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65, maxWidth: 380, marginBottom: 32 }}>
                        A complete library management platform built for serious students — seat booking, attendance, fees, and AI-powered exam preparation.
                    </motion.p>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                        style={{ display: 'flex', gap: 32, paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid #FED7AA' }}>
                        {STATS.map((s, i) => (
                            <div key={i}>
                                <p style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{s.value}</p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {FEATURES.map((f, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.06 }}
                                style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                <IoCheckmarkCircle size={17} style={{ color: '#F97316', flexShrink: 0, marginTop: 2 }} />
                                <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.5 }}>{f}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ padding: '16px 48px', borderTop: '1px solid #FED7AA' }}>
                    <p style={{ fontSize: 12, color: '#D1D5DB' }}>© 2026 Apna Lakshay · Built for serious students</p>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT PANEL — login form
               ══════════════════════════════════════════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                {/* Typing Interactive Animations */}
                <motion.div
                    animate={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{ position: 'absolute', top: 0, left: '50%', x: '-50%', height: '6px', background: 'linear-gradient(90deg, #F97316, #EF4444)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
                />
                <motion.div
                    animate={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{ position: 'absolute', bottom: 0, left: '50%', x: '-50%', height: '6px', background: 'linear-gradient(270deg, #EF4444, #F97316)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                />

                {/* Subtle typing glows */}
                <motion.div
                    animate={{ scale: 1 + (progress * 0.005), opacity: progress > 0 ? 0.15 : 0 }}
                    transition={{ type: 'spring' }}
                    style={{ position: 'absolute', top: -150, left: '50%', x: '-50%', width: 300, height: 300, background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                />
                <motion.div
                    animate={{ scale: 1 + (progress * 0.005), opacity: progress > 0 ? 0.15 : 0 }}
                    transition={{ type: 'spring' }}
                    style={{ position: 'absolute', bottom: -150, left: '50%', x: '-50%', width: 300, height: 300, background: 'radial-gradient(circle, #EF4444 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                />



                {/* Mobile brand */}
                <div className="lg:hidden" style={{ width: '100%', maxWidth: 380, marginBottom: 28 }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg,#F97316,#FB923C)', borderRadius: 99, marginBottom: 20 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 900, fontSize: 16, color: '#111827', lineHeight: 1 }}>Apna Lakshay</p>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 3 }}>Library System</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link to="/public-seats" style={{ fontSize: 12, fontWeight: 700, color: '#EA580C', background: '#FFF7ED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #FED7AA', borderRadius: 8 }}>
                                <IoGridOutline size={12} /> Seats
                            </Link>
                            <Link to="/contact" style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                                <IoLocationOutline size={12} /> Map
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Form container */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={shake ? 'do-shake' : ''}
                    style={{ width: '100%', maxWidth: 380 }}>

                    {/* Form header */}
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                            Welcome back 👋
                        </h2>
                        <p style={{ fontSize: 14, color: '#6B7280' }}>
                            Login to access your library dashboard
                        </p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
                                    background: '#FEF2F2', border: '1px solid #FECACA',
                                    borderRadius: 10, fontSize: 13, color: '#B91C1C', marginBottom: 20
                                }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Email */}
                        <Field label="Email or Mobile Number" id="email">
                            <div style={{ position: 'relative' }}>
                                <IoMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s' }} />
                                <input
                                    id="email" type="text" value={email} required
                                    onChange={handleEmailChange}
                                    placeholder="you@example.com or 10-digit mobile"
                                    style={{ ...inputStyle('email'), letterSpacing: /^[\d]+$/.test(email) && email.length > 0 ? '6px' : 'normal' }}
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused('')}
                                />
                            </div>
                        </Field>

                        {/* Password */}
                        <Field label="Password" id="password">
                            <div style={{ position: 'relative' }}>
                                <IoLockClosed size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s' }} />
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'}
                                    value={password} required
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{ ...inputStyle('password'), letterSpacing: showPassword && /^[\d]+$/.test(password) && password.length > 0 ? '6px' : 'normal' }}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                                    {showPassword ? <IoEyeOff size={17} /> : <IoEye size={17} />}
                                </button>
                            </div>
                        </Field>

                        {/* Forgot */}
                        <div style={{ textAlign: 'right', marginTop: -8 }}>
                            <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: '#F97316', textDecoration: 'none' }}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit" disabled={loading}
                            whileHover={!loading ? { opacity: 0.9 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            style={{
                                width: '100%', padding: '13px', borderRadius: 10,
                                background: loading ? '#E5E7EB' : '#F97316',
                                color: loading ? '#9CA3AF' : '#fff',
                                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'background 0.15s',
                            }}>
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid #D1D5DB', borderTopColor: '#9CA3AF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Logging in…
                                </>
                            ) : (
                                <>Login <IoArrowForward size={15} /></>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                </motion.div>
            </div>

            <AttendanceFloatingBtn />
        </div>
    );
}
