import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
    IoArrowBack, IoMail, IoCall, IoHome, IoLockClosed,
    IoPerson, IoArrowForward, IoEye, IoEyeOff,
    IoCheckmarkCircle, IoShieldCheckmarkOutline,
    IoBookOutline, IoCalendarOutline, IoSparklesOutline, IoPeopleOutline
} from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';

const FEATURES = [
    { icon: IoBookOutline,     text: 'Smart seat assignment & real-time availability' },
    { icon: IoCalendarOutline, text: 'Automated attendance with QR & geo-verification' },
    { icon: IoSparklesOutline, text: 'AI-powered mock tests for competitive exams' },
    { icon: IoPeopleOutline,   text: 'Live discussion rooms & study collaboration' },
];

const Orb = ({ style, className }) => (
    <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} style={style} />
);

const Register = () => {
    useMobileViewport();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', mobile: '', address: '', password: '', confirmPassword: ''
    });
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState('');
    const [success, setSuccess]           = useState('');
    const [emailError, setEmailError]     = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [showPass, setShowPass]         = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    const checkEmailAvailability = async (email) => {
        if (!email || !email.includes('@')) { setEmailError(''); return; }
        setCheckingEmail(true);
        try {
            const res = await api.get(`/public/check-email?email=${encodeURIComponent(email)}`);
            setEmailError(res.data.available ? '' : 'This email is already registered');
        } catch { /* silent */ } finally { setCheckingEmail(false); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'mobile') {
            const n = value.replace(/\D/g, '');
            if (n.length > 10) return;
            setFormData(p => ({ ...p, mobile: n }));
            return;
        }
        setFormData(p => ({ ...p, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (emailError)                                      { setError('Please use a different email address'); return; }
        if (formData.password !== formData.confirmPassword)  { setError('Passwords do not match'); return; }
        if (formData.password.length < 6)                   { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const res = await api.post('/public/register', formData);
            if (res.data.success) {
                setSuccess(res.data.message);
                const creds = { email: formData.email, password: formData.password };
                setFormData({ name: '', email: '', mobile: '', address: '', password: '', confirmPassword: '' });
                setTimeout(() => navigate('/login', { state: creds }), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
    };
    const focusIn  = e => { e.target.style.border = '1px solid rgba(249,115,22,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; };
    const focusOut = e => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; };

    return (
        <div className="min-h-screen flex dark" style={{ background: '#080b12' }}>

            {/* ══ LEFT BRAND PANEL — desktop only ══ */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">
                <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #0a0e1a 40%, #0d1520 100%)' }} />
                <Orb className="w-[450px] h-[450px] top-[-15%] left-[-15%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }} />
                <Orb className="w-[350px] h-[350px] bottom-[-10%] right-[-10%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)' }} />
                <div className="absolute inset-0 z-0 opacity-30"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10">
                    {/* Brand */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-14">
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

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-10">
                        <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] mb-4">
                            Join your<br />
                            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #f97316, #ef4444)' }}>
                                study community.
                            </span>
                        </h1>
                        <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                            Create your account and get access to smart seat booking, attendance tracking, AI mock tests and more.
                        </p>
                    </motion.div>

                    <div className="space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }} className="flex items-start gap-3">
                                <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                                    <f.icon size={15} className="text-orange-400" />
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed pt-1">{f.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    className="relative z-10 mt-8">
                    <Link to="/login">
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors">
                            <IoArrowBack size={15} /> Back to Login
                        </motion.button>
                    </Link>
                </motion.div>
            </div>

            {/* ══ RIGHT FORM PANEL ══ */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-5 sm:px-8 py-8 overflow-y-auto"
                style={{ background: 'linear-gradient(160deg, #0b0f1c 0%, #080b12 60%, #0c0a14 100%)' }}>
                <Orb className="w-[350px] h-[350px] top-[-10%] right-[-15%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />
                <Orb className="w-[300px] h-[300px] bottom-[-5%] left-[-10%] z-0"
                    style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)' }} />

                {/* Mobile: brand + back link */}
                <div className="lg:hidden w-full max-w-sm mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-white font-black text-base leading-none">
                                Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                            </p>
                            <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-0.5">Library System</p>
                        </div>
                        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-400 transition-colors group">
                            <IoArrowBack size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Login
                        </Link>
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-sm relative z-10">

                    <div className="rounded-2xl border border-white/8 p-7 sm:p-8"
                        style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 64px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

                        {/* Card header */}
                        <div className="mb-7">
                            <h2 className="text-2xl font-black text-white mb-1">Create account</h2>
                            <p className="text-gray-500 text-sm">Join Apna Lakshay to get started</p>
                        </div>

                        {/* Success */}
                        <AnimatePresence>
                            {success && (
                                <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-4 py-3 rounded-xl text-sm overflow-hidden">
                                    <IoCheckmarkCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Registration successful!</p>
                                        <p className="text-xs text-emerald-400/70 mt-0.5 animate-pulse">Redirecting to login…</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                    className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm overflow-hidden">
                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            {[
                                { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Your full name', icon: IoPerson },
                                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: IoMail, onBlur: (e) => checkEmailAvailability(e.target.value), extraError: emailError, checking: checkingEmail },
                                { label: 'Mobile Number', name: 'mobile', type: 'tel', placeholder: '10-digit number', icon: IoCall },
                            ].map(({ label, name, type, placeholder, icon: Icon, onBlur, extraError, checking }) => (
                                <div key={name}>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Icon size={16} className="text-gray-600 group-focus-within:text-orange-400 transition-colors duration-200" />
                                        </div>
                                        <input type={type} name={name} value={formData[name]} onChange={handleChange}
                                            placeholder={placeholder} required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                                            style={extraError ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.45)' } : inputStyle}
                                            onFocus={extraError ? undefined : focusIn}
                                            onBlur={e => { focusOut(e); onBlur?.(e); }} />
                                    </div>
                                    {checking && <p className="text-xs text-gray-500 mt-1">Checking availability…</p>}
                                    {extraError && <p className="text-xs text-red-400 mt-1">{extraError}</p>}
                                </div>
                            ))}

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                                <div className="relative group">
                                    <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none">
                                        <IoHome size={16} className="text-gray-600 group-focus-within:text-orange-400 transition-colors duration-200" />
                                    </div>
                                    <textarea name="address" value={formData.address} onChange={handleChange}
                                        placeholder="Your complete address" rows={2} required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200 resize-none"
                                        style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                                </div>
                            </div>

                            {/* Passwords — 2 col */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Password', name: 'password', show: showPass, toggle: () => setShowPass(p => !p) },
                                    { label: 'Confirm', name: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(p => !p) },
                                ].map(({ label, name, show, toggle }) => (
                                    <div key={name}>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                <IoLockClosed size={15} className="text-gray-600 group-focus-within:text-orange-400 transition-colors duration-200" />
                                            </div>
                                            <input type={show ? 'text' : 'password'} name={name} value={formData[name]}
                                                onChange={handleChange} placeholder="••••••" minLength={6} required
                                                className="w-full pl-10 pr-9 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
                                                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                                            <button type="button" onClick={toggle} tabIndex={-1}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-orange-400 transition-colors">
                                                {show ? <IoEyeOff size={15} /> : <IoEye size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Submit */}
                            <motion.button whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.985 } : {}}
                                type="submit" disabled={loading}
                                className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                                style={{ background: loading ? 'rgba(100,100,100,0.4)' : 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', boxShadow: loading ? 'none' : '0 8px 24px -4px rgba(249,115,22,0.4)' }}>
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
                                ) : (
                                    <>Create Account <IoArrowForward size={16} className="group-hover:translate-x-1 transition-transform duration-200" /></>
                                )}
                            </motion.button>
                        </form>

                        {/* Email reminder note */}
                        <div className="mt-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/25 rounded-2xl p-4">
                            <div className="flex gap-3 items-start">
                                <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <IoMail size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-300 mb-1">Check Your Email After Registration</p>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                        <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-400 shrink-0 mt-1.5" />Your <span className="text-white font-semibold">login credentials</span> will be sent to your email.</li>
                                        <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-400 shrink-0 mt-1.5" />Seat allocation will be assigned by the library admin.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Divider + login link */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-white/6" />
                            <span className="text-[11px] text-gray-700 uppercase tracking-widest font-medium">or</span>
                            <div className="flex-1 h-px bg-white/6" />
                        </div>
                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">Sign in</Link>
                        </p>
                    </div>

                    {/* Note below card */}
                    <p className="text-center text-[11px] text-gray-700 mt-5 flex items-center justify-center gap-2">
                        <IoShieldCheckmarkOutline size={13} className="text-gray-600" />
                        Protected by secure encryption · Ver 1.0.0
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
