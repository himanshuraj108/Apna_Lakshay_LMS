import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { IoMail, IoLockClosed, IoGridOutline, IoArrowForward, IoDownload, IoClose } from 'react-icons/io5';
import Button from '../components/ui/Button';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

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
        <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">

            {/* View Seats Floating Button - Prominent Call to Action */}
            <Link to="/public-seats" className="hidden lg:block fixed top-8 right-8 z-50 w-max">
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        boxShadow: ["0px 0px 0px rgba(124, 58, 237, 0)", "0px 0px 20px rgba(124, 58, 237, 0.5)", "0px 0px 0px rgba(124, 58, 237, 0)"]
                    }}
                    transition={{
                        scale: { duration: 0.5 },
                        opacity: { duration: 0.5 },
                        boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full text-white shadow-2xl border border-white/20 backdrop-blur-md group"
                >
                    <IoGridOutline size={20} className="animate-pulse w-6 h-6" />
                    <span className="font-bold text-lg tracking-wide">VIEW SEATS</span>
                    <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={20} />
                </motion.button>
            </Link>

            {/* Main Content - Centered */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10 p-6"
            >
                <div className="relative bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Brand Header Inside Card */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                            Hamara <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Lakshay</span>
                        </h1>
                        <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">Library Management System</p>

                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
                    </div>

                    {/* Mobile View Seats Button - Inline */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <Link to="/public-seats" className="w-full">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-white shadow-lg border border-white/10 backdrop-blur-md group"
                            >
                                <IoGridOutline size={20} className="animate-pulse" />
                                <span className="font-bold text-base tracking-wide">VIEW AVAILABLE SEATS</span>
                                <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={18} />
                            </motion.button>
                        </Link>
                    </div>

                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-400 text-sm">Please sign in to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IoMail className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-gray-600 outline-none"
                                        placeholder="hello@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IoLockClosed className="text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder-gray-600 outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <IoArrowForward className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Registration Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                                Register here
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-500">
                            Protected by secure encryption • Ver 1.0.0
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* PWA Install Banner - Blue Card Design */}
            <AnimatePresence>
                {showInstallBanner && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 sm:bottom-6 left-0 sm:left-auto sm:right-6 w-full sm:w-[400px] z-[60] p-4 sm:p-0 flex items-end justify-center sm:block"
                    >
                        <div className="bg-[#4f46e5] rounded-3xl p-6 shadow-2xl relative overflow-hidden w-full max-w-sm mx-auto">
                            {/* Close Button */}
                            <button
                                onClick={() => setShowInstallBanner(false)}
                                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <IoClose size={20} />
                            </button>

                            {/* Header Section */}
                            <div className="flex gap-4 mb-6">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <IoGridOutline className="text-[#4f46e5] text-3xl" />
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-xl font-bold text-white leading-tight mb-1">Install Hamara Lakshya</h3>
                                    <p className="text-indigo-100 text-xs leading-relaxed">
                                        Get the full app experience with offline access and faster loading.
                                    </p>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
                                    <IoArrowForward className="text-white -rotate-45" />
                                    <span className="text-[10px] font-medium text-white uppercase tracking-wider">Fast</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
                                    <IoDownload className="text-white" />
                                    <span className="text-[10px] font-medium text-white uppercase tracking-wider">Offline</span>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
                                    <IoGridOutline className="text-white" />
                                    <span className="text-[10px] font-medium text-white uppercase tracking-wider">Native</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleInstallClick}
                                    className="flex-1 bg-white text-[#4f46e5] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                                >
                                    <IoDownload className="text-lg" />
                                    Install App
                                </button>
                                <button
                                    onClick={() => setShowInstallBanner(false)}
                                    className="px-4 py-3.5 text-white font-semibold hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
