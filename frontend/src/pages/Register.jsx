import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { IoArrowBack, IoPersonAdd, IoMail, IoCall, IoHome, IoLockClosed, IoPerson, IoArrowForward } from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';

const Register = () => {
    useMobileViewport();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [emailError, setEmailError] = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);

    // Debounced email check
    const checkEmailAvailability = async (email) => {
        if (!email || !email.includes('@')) { setEmailError(''); return; }
        setCheckingEmail(true);
        try {
            const response = await api.get(`/public/check-email?email=${encodeURIComponent(email)}`);
            setEmailError(response.data.available ? '' : 'This email is already registered');
        } catch (error) {
            console.error('Email check error:', error);
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'mobile') {
            const numericValue = value.replace(/\D/g, '');
            if (numericValue.length > 10) return;
            setFormData({ ...formData, [name]: numericValue });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (emailError) { setError('Please use a different email address'); return; }
        if (!formData.name || !formData.email || !formData.mobile || !formData.address || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields'); setLoading(false); return;
        }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }

        setLoading(true);
        try {
            const response = await api.post('/public/register', formData);
            if (response.data.success) {
                setSuccess(response.data.message);
                const loginCredentials = { email: formData.email, password: formData.password };
                setFormData({ name: '', email: '', mobile: '', address: '', password: '', confirmPassword: '' });
                setTimeout(() => { navigate('/login', { state: loginCredentials }); }, 3000);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Enter your full name', icon: IoPerson },
        { label: 'Email Address', name: 'email', type: 'email', placeholder: 'your.email@example.com', icon: IoMail, onBlur: (e) => checkEmailAvailability(e.target.value), hasError: !!emailError },
        { label: 'Mobile Number', name: 'mobile', type: 'tel', placeholder: '10-digit mobile number', icon: IoCall },
    ];

    return (
        <div
            className="min-h-screen relative flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto dark"
            style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(249,115,22,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(239,68,68,0.10) 0%, transparent 55%), #030712' }}
        >
            {/* Ambient blobs */}
            <div className="fixed top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/8 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-5 group">
                    <IoArrowBack size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Login
                </Link>

                <div className="bg-white/4 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 md:p-9 shadow-2xl shadow-black/60">

                    {/* Brand Header */}
                    <div className="text-center mb-7">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
                            <IoPersonAdd size={24} color="white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-1">
                            Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                        </h1>
                        <p className="text-gray-500 text-xs tracking-widest uppercase">Library Management System</p>
                        <div className="h-px w-20 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent mx-auto mt-4" />
                        <h2 className="text-xl font-bold text-white mt-5">Student Registration</h2>
                        <p className="text-gray-500 text-sm mt-1">Create your account to get started</p>
                    </div>

                    {/* Success Banner */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-6 text-center"
                            >
                                <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-green-400 mb-1">Registration Successful!</h3>
                                <p className="text-sm text-gray-400">Check your email for login credentials.</p>
                                <p className="text-xs text-gray-500 mt-2 animate-pulse">Redirecting to login…</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Standard fields */}
                        {fields.map(({ label, name, type, placeholder, icon: Icon, onBlur, hasError }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label} *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Icon className="text-gray-600 group-focus-within:text-orange-400 transition-colors" size={17} />
                                    </div>
                                    <input
                                        type={type} name={name} value={formData[name]} onChange={handleChange} onBlur={onBlur}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-white/5 border rounded-xl focus:ring-2 outline-none transition-all text-white placeholder-gray-600 text-sm ${hasError ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/15' : 'border-white/10 focus:border-orange-500/60 focus:ring-orange-500/15'
                                            }`}
                                        placeholder={placeholder} required
                                    />
                                </div>
                                {name === 'email' && checkingEmail && <p className="text-xs text-gray-500 mt-1">Checking availability…</p>}
                                {name === 'email' && emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
                            </div>
                        ))}

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Address *</label>
                            <div className="relative group">
                                <div className="absolute top-3.5 left-0 pl-4 flex items-start pointer-events-none">
                                    <IoHome className="text-gray-600 group-focus-within:text-orange-400 transition-colors" size={17} />
                                </div>
                                <textarea
                                    name="address" value={formData.address} onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm resize-none"
                                    placeholder="Enter your complete address" rows={3} required
                                />
                            </div>
                        </div>

                        {/* Password row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Password', name: 'password' },
                                { label: 'Confirm Password', name: 'confirmPassword' }
                            ].map(({ label, name }) => (
                                <div key={name}>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{label} *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <IoLockClosed className="text-gray-600 group-focus-within:text-orange-400 transition-colors" size={17} />
                                        </div>
                                        <input
                                            type="password" name={name} value={formData[name]} onChange={handleChange}
                                            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all text-white placeholder-gray-600 text-sm"
                                            placeholder="••••••••" minLength={6} required
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            type="submit" disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide mt-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering…</>
                            ) : (
                                <>Register <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={16} /></>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                                Login here
                            </Link>
                        </p>
                    </div>

                    {/* Prominent email reminder */}
                    <div className="mt-5 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-4">
                        <div className="flex gap-3 items-start">
                            <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-orange-300 mb-1">Check Your Email After Registration</p>
                                <ul className="text-xs text-gray-400 space-y-1">
                                    <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />Your <span className="text-white font-semibold">login credentials</span> will be sent to your email.</li>
                                    <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />Seat allocation will be assigned by the library admin.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-700">Protected by secure encryption • Ver 1.0.0</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
