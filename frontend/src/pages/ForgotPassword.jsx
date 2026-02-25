import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMail, IoKeypad, IoLockClosed, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import api from '../utils/api';
import useMobileViewport from '../hooks/useMobileViewport';

const ForgotPassword = () => {
    useMobileViewport();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form Data
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/forgot-password', { email });
            setSuccess(response.data.message || 'OTP sent successfully!');
            setTimeout(() => {
                setSuccess('');
                setStep(2);
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-otp', { email, otp });
            setSuccess('OTP Verified!');
            setTimeout(() => {
                setSuccess('');
                setStep(3);
            }, 500);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/reset-password', { email, otp, password });
            setSuccess('Password Reset Successfully!');
            setTimeout(() => { navigate('/login'); }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 dark"
            style={{ background: 'radial-gradient(ellipse at 25% 20%, rgba(249,115,22,0.11) 0%, transparent 55%), radial-gradient(ellipse at 75% 80%, rgba(239,68,68,0.09) 0%, transparent 55%), #030712' }}
        >
            {/* Ambient blobs */}
            <div className="fixed top-[-15%] left-[-5%] w-[450px] h-[450px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-red-600/8 blur-[110px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[95vw] sm:max-w-md relative z-10"
            >
                <div className="bg-white/4 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/login"
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                            <IoArrowBack size={18} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {step === 1 && 'Forgot Password'}
                                {step === 2 && 'Verify OTP'}
                                {step === 3 && 'Set New Password'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 3</p>
                        </div>
                        {/* Step progress dots */}
                        <div className="ml-auto flex gap-1.5">
                            {[1, 2, 3].map(s => (
                                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-gradient-to-r from-orange-500 to-red-500'
                                    : s < step ? 'w-3 bg-orange-500/60'
                                        : 'w-3 bg-white/15'
                                    }`} />
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/25 text-green-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                            <IoCheckmarkCircle size={16} className="shrink-0" />
                            {success}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 1 — Email */}
                        {step === 1 && (
                            <motion.form key="step1"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOTP} className="space-y-5"
                            >
                                <p className="text-gray-400 text-sm">Enter your registered email to receive a verification code.</p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <IoMail className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-600" size={17} />
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm"
                                            placeholder="hello@example.com" required />
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    type="submit" disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</> : 'Send Verification Code'}
                                </motion.button>
                            </motion.form>
                        )}

                        {/* Step 2 — OTP */}
                        {step === 2 && (
                            <motion.form key="step2"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOTP} className="space-y-5"
                            >
                                <p className="text-gray-400 text-sm">
                                    Enter the 4-digit code sent to <span className="text-white font-medium break-all">{email}</span>
                                </p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">OTP Code</label>
                                    <div className="relative">
                                        <IoKeypad className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-600" size={17} />
                                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 tracking-[0.4em] text-base font-mono text-center"
                                            placeholder="····" maxLength={4} required />
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    type="submit" disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</> : 'Verify Code'}
                                </motion.button>
                                <div className="text-center">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                                        ← Change email
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* Step 3 — New Password */}
                        {step === 3 && (
                            <motion.form key="step3"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword} className="space-y-5"
                            >
                                <p className="text-gray-400 text-sm">Create a strong new password for your account.</p>
                                {[
                                    { label: 'New Password', val: password, set: setPassword, ph: 'New password' },
                                    { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword, ph: 'Confirm password' }
                                ].map(({ label, val, set, ph }) => (
                                    <div key={label}>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
                                        <div className="relative">
                                            <IoLockClosed className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-600" size={17} />
                                            <input type="password" value={val} onChange={(e) => set(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm"
                                                placeholder={ph} minLength={6} required />
                                        </div>
                                    </div>
                                ))}
                                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    type="submit" disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
                                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting…</> : 'Set New Password'}
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
