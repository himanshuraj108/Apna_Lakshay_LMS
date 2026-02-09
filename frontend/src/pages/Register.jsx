import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import api from '../utils/api';
import { IoArrowBack, IoPersonAdd } from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';

const Register = () => {
    useMobileViewport();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [emailError, setEmailError] = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);

    // Debounced email check
    const checkEmailAvailability = async (email) => {
        if (!email || !email.includes('@')) {
            setEmailError('');
            return;
        }

        setCheckingEmail(true);
        try {
            const response = await api.get(`/public/check-email?email=${encodeURIComponent(email)}`);
            if (!response.data.available) {
                setEmailError('This email is already registered');
            } else {
                setEmailError('');
            }
        } catch (error) {
            console.error('Email check error:', error);
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Mobile Restriction: Numbers only, max 10 digits
        if (name === 'mobile') {
            const numericValue = value.replace(/\D/g, ''); // Remove non-digits
            if (numericValue.length > 10) return; // Prevent > 10

            setFormData({
                ...formData,
                [name]: numericValue
            });
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Check for email error
        if (emailError) {
            setError('Please use a different email address');
            return;
        }

        // Basic validation
        if (!formData.name || !formData.email || !formData.mobile || !formData.address) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/public/register', formData);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ name: '', email: '', mobile: '', address: '' });

                // Redirect to login after 5 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[10px] opacity-50">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Link to="/login" className="block mb-4">
                        <Button variant="secondary" className="mb-4">
                            <IoArrowBack className="inline mr-2" /> Back to Login
                        </Button>
                    </Link>

                    <div className="relative bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        {/* Brand Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                                Apna <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Lakshay</span>
                            </h1>
                            <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">Apna Lakshay Library Management System</p>

                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-6"></div>

                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                                    <IoPersonAdd size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">Student Registration</h2>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}


                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-2xl p-6 mb-6 text-center"
                            >
                                <h3 className="text-lg font-semibold text-green-400 mb-4">Registration Successful!</h3>

                                {/* Prominent Email Check Message with Blinking Animation */}
                                <div className="bg-white/10 rounded-xl p-6 mb-4 relative overflow-hidden">
                                    {/* Pulsing background effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>

                                    {/* Animated Email Icon */}
                                    <div className="flex justify-center mb-4 relative z-10">
                                        <div className="bg-blue-500 rounded-full p-4 animate-bounce">
                                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Blinking Check Email Text */}
                                    <p className="text-2xl font-bold text-white mb-3 relative z-10 animate-pulse">
                                        Check Your Email for Credentials
                                    </p>
                                    <p className="text-sm text-gray-300 relative z-10">
                                        Your login credentials have been sent to <br />
                                        <span className="font-bold text-green-400 text-base">{formData.email || 'your email'}</span>
                                    </p>
                                </div>

                                <p className="text-sm text-gray-400 animate-pulse">Redirecting to login in 5 seconds...</p>
                            </motion.div>
                        )}


                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={(e) => checkEmailAvailability(e.target.value)}
                                    className={`input w-full ${emailError ? 'border-red-500' : ''}`}
                                    placeholder="your.email@example.com"
                                    required
                                />
                                {checkingEmail && (
                                    <p className="text-xs text-gray-400 mt-1">Checking availability...</p>
                                )}
                                {emailError && (
                                    <p className="text-xs text-red-400 mt-1">{emailError}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Mobile Number *
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="10-digit mobile number"
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Address *
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="input w-full"
                                    placeholder="Enter your complete address"
                                    rows="3"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p class="text-gray-400 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
                                    Login here
                                </Link>
                            </p>
                        </div>

                        <div className="mt-6 bg-white/5 rounded-lg p-4">
                            <p className="text-xs text-gray-400">
                                <strong>Note:</strong> After registration, you'll receive login credentials via email.
                                Seat allocation will be done by the library admin.
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-slate-500">
                                Protected by secure encryption • Ver 1.0.0
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
