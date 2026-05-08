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
    const [focused, setFocused] = useState('');

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

    const inputStyle = (name) => ({
        width: '100%',
        padding: '12px 16px 12px 42px',
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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#F8FAFC', padding: '16px' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                input:-webkit-autofill{-webkit-box-shadow:0 0 0 50px #fff inset !important;-webkit-text-fill-color:#111827 !important;}
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #F3F4F6' }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <Link to="/login" style={{ padding: 8, background: '#F3F4F6', borderRadius: 10, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#E5E7EB'} onMouseOut={e => e.currentTarget.style.background = '#F3F4F6'}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>
                            {step === 1 && 'Forgot Password'}
                            {step === 2 && 'Verify OTP'}
                            {step === 3 && 'Set New Password'}
                        </h2>
                        <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: 0 }}>Step {step} of 3</p>
                    </div>
                    {/* Step dots */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ height: 6, borderRadius: 99, transition: 'all 0.3s', width: s === step ? 24 : 8, background: s === step ? 'linear-gradient(to right, #F97316, #EF4444)' : s < step ? 'rgba(249,115,22,0.6)' : '#E5E7EB' }} />
                        ))}
                    </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <IoCheckmarkCircle size={16} />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Step 1 */}
                    {step === 1 && (
                        <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Enter your registered email to receive a verification code.</p>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <IoMail style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: focused === 'email' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s' }} size={17} />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} placeholder="hello@example.com" required />
                                </div>
                            </div>
                            <motion.button type="submit" disabled={loading} whileHover={!loading ? { opacity: 0.9 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{ width: '100%', padding: '14px', background: loading ? '#E5E7EB' : 'linear-gradient(to right, #F97316, #EF4444)', color: loading ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</> : 'Send Verification Code'}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Enter the 4-digit code sent to <span style={{ color: '#111827', fontWeight: 600 }}>{email}</span></p>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OTP Code</label>
                                <div style={{ position: 'relative' }}>
                                    <IoKeypad style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: focused === 'otp' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s' }} size={17} />
                                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ ...inputStyle('otp'), textAlign: 'center', letterSpacing: '0.4em', fontFamily: 'monospace', fontSize: 18 }} onFocus={() => setFocused('otp')} onBlur={() => setFocused('')} placeholder="····" maxLength={4} required />
                                </div>
                            </div>
                            <motion.button type="submit" disabled={loading} whileHover={!loading ? { opacity: 0.9 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{ width: '100%', padding: '14px', background: loading ? '#E5E7EB' : 'linear-gradient(to right, #F97316, #EF4444)', color: loading ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Verifying…</> : 'Verify Code'}
                            </motion.button>
                            <div style={{ textAlign: 'center' }}>
                                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#F97316', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Change email</button>
                            </div>
                        </motion.form>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Create a strong new password for your account.</p>
                            {[
                                { label: 'New Password', val: password, set: setPassword, ph: 'New password', id: 'password' },
                                { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword, ph: 'Confirm password', id: 'confirm' }
                            ].map(({ label, val, set, ph, id }) => (
                                <div key={label}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                                    <div style={{ position: 'relative' }}>
                                        <IoLockClosed style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 14, color: focused === id ? '#F97316' : '#9CA3AF', transition: 'color 0.15s' }} size={17} />
                                        <input type="password" value={val} onChange={(e) => set(e.target.value)} style={inputStyle(id)} onFocus={() => setFocused(id)} onBlur={() => setFocused('')} placeholder={ph} minLength={6} required />
                                    </div>
                                </div>
                            ))}
                            <motion.button type="submit" disabled={loading} whileHover={!loading ? { opacity: 0.9 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{ width: '100%', padding: '14px', background: loading ? '#E5E7EB' : 'linear-gradient(to right, #F97316, #EF4444)', color: loading ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Resetting…</> : 'Set New Password'}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
