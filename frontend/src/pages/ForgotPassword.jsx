import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMail, IoKeypad, IoLockClosed, IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5';
import Button from '../components/ui/Button';
import api from '../utils/api';

const ForgotPassword = () => {
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
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0f172a] p-3 sm:p-6 md:p-8">
            {/* Background elements similar to Login */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[95vw] sm:max-w-md relative z-10"
            >
                <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl">
                    <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 md:gap-4">
                        <Link to="/login" className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                            <IoArrowBack size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                        </Link>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                            {step === 1 && 'Forgot Password'}
                            {step === 2 && 'Verify OTP'}
                            {step === 3 && 'Reset Password'}
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl text-xs sm:text-sm mb-3 sm:mb-4 md:mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl text-xs sm:text-sm mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
                            <IoCheckmarkCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" /> {success}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOTP}
                                className="space-y-3 sm:space-y-4 md:space-y-6"
                            >
                                <p className="text-gray-400 text-xs sm:text-sm">Enter your registered email address to receive a verification code.</p>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Email Address</label>
                                    <div className="relative">
                                        <IoMail className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 text-gray-500" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-9 sm:pl-10 md:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500 transition-colors text-white outline-none text-sm sm:text-base"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button variant="primary" type="submit" className="w-full text-sm sm:text-base py-2 sm:py-2.5 md:py-3" disabled={loading}>
                                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                                </Button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOTP}
                                className="space-y-4 sm:space-y-6"
                            >
                                <p className="text-gray-400 text-xs sm:text-sm">Enter the 4-digit code sent to <span className="text-white font-medium break-all">{email}</span></p>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">OTP Code</label>
                                    <div className="relative">
                                        <IoKeypad className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 text-gray-500" size={18} />
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500 transition-colors text-white outline-none tracking-widest text-base sm:text-lg font-mono"
                                            placeholder="XXXX"
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button variant="primary" type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-3" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </Button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs sm:text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        Change Email
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-4 sm:space-y-6"
                            >
                                <p className="text-gray-400 text-xs sm:text-sm">Create a new strong password for your account.</p>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">New Password</label>
                                    <div className="relative">
                                        <IoLockClosed className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500 transition-colors text-white outline-none text-sm sm:text-base"
                                            placeholder="New password"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <IoLockClosed className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-4 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-[#0f172a]/50 border border-white/10 rounded-xl focus:border-blue-500 transition-colors text-white outline-none text-sm sm:text-base"
                                            placeholder="Confirm new password"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button variant="primary" type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-3" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Set New Password'}
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
