import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { IoMail, IoLockClosed, IoGridOutline, IoArrowForward, IoDownload, IoClose, IoEye, IoEyeOff } from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';
import AttendanceFloatingBtn from '../components/ui/AttendanceFloatingBtn';

const Login = () => {
    useMobileViewport();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Auto-fill from registration redirection
        if (location.state?.email && location.state?.password) {
            setEmail(location.state.email);
            setPassword(location.state.password);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // PWA Install Prompt Logic
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };
        const handleAppInstalled = () => {
            setShowInstallBanner(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

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
        }
        setLoading(false);
    };

    return (
        <div
            className="min-h-screen relative flex items-center justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto dark"
            style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(249,115,22,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(239,68,68,0.10) 0%, transparent 55%), #030712' }}
        >
            {/* Ambient blobs */}
            <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/8 blur-[120px] pointer-events-none" />

            {/* View Seats Floating Button (desktop) */}
            <Link to="/public-seats" className="hidden lg:block fixed top-8 right-8 z-50 w-max">
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, boxShadow: ["0px 0px 0px rgba(249,115,22,0)", "0px 0px 22px rgba(249,115,22,0.5)", "0px 0px 0px rgba(249,115,22,0)"] }}
                    transition={{ scale: { duration: 0.5 }, opacity: { duration: 0.5 }, boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-full text-white shadow-2xl shadow-orange-500/30 border border-white/15 backdrop-blur-md group font-bold tracking-wide text-sm"
                >
                    <IoGridOutline size={20} className="animate-pulse" />
                    VIEW SEATS
                    <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={18} />
                </motion.button>
            </Link>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="relative bg-white/4 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 md:p-9 shadow-2xl shadow-black/60">

                    {/* Brand */}
                    <div className="text-center mb-7">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
                            Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                        </h1>
                        <p className="text-gray-500 text-xs tracking-widest uppercase">Library Management System</p>
                        <div className="h-px w-20 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mx-auto mt-4" />
                    </div>

                    {/* Mobile View Seats */}
                    <div className="lg:hidden mb-6">
                        <Link to="/public-seats" className="w-full">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/25 rounded-xl text-orange-300 font-semibold text-sm transition-all group"
                            >
                                <IoGridOutline size={18} />
                                VIEW AVAILABLE SEATS
                                <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={16} />
                            </motion.button>
                        </Link>
                    </div>

                    <div className="mb-7 text-center">
                        <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
                        <p className="text-gray-500 text-sm">Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IoMail className="text-gray-600 group-focus-within:text-orange-400 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm"
                                        placeholder="hello@example.com" required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IoLockClosed className="text-gray-600 group-focus-within:text-orange-400 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm"
                                        placeholder="••••••••" required
                                    />
                                    <button
                                        type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-orange-400 transition-colors cursor-pointer focus:outline-none"
                                    >
                                        {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            type="submit" disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={16} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                                Register here
                            </Link>
                        </p>
                    </div>

                    <div className="mt-7 pt-5 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-700">Protected by secure encryption • Ver 1.0.0</p>
                    </div>
                </div>
            </motion.div>

            {/* PWA Install Banner */}
            <AnimatePresence>
                {showInstallBanner && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 sm:bottom-6 left-0 sm:left-auto sm:right-6 w-full sm:w-[380px] z-[60] p-4 sm:p-0 flex items-end justify-center sm:block"
                    >
                        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl p-6 shadow-2xl shadow-orange-500/30 relative overflow-hidden w-full max-w-sm mx-auto border border-white/15">
                            <button onClick={() => setShowInstallBanner(false)}
                                className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <IoClose size={18} />
                            </button>
                            <div className="flex gap-4 mb-5">
                                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                                    <IoGridOutline className="text-white text-2xl" />
                                </div>
                                <div className="pt-0.5">
                                    <h3 className="text-lg font-bold text-white mb-1">Install Apna Lakshay</h3>
                                    <p className="text-orange-100 text-xs leading-relaxed">Faster loading, offline access, full app experience.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {[['⚡', 'Fast'], ['📴', 'Offline'], ['📱', 'Native']].map(([icon, label]) => (
                                    <div key={label} className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center">
                                        <span className="text-lg">{icon}</span>
                                        <span className="text-[10px] font-semibold text-white uppercase tracking-wider">{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handleInstallClick}
                                    className="flex-1 bg-white text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg active:scale-95 transition-transform">
                                    <IoDownload size={18} /> Install App
                                </button>
                                <button onClick={() => setShowInstallBanner(false)}
                                    className="px-4 py-3 text-white/80 font-semibold hover:bg-white/10 rounded-xl transition-colors text-sm">
                                    Later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attendance floating button — visible to students on login screen */}
            <AttendanceFloatingBtn />
        </div>
    );
};

export default Login;
