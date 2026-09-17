import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoMail, IoKeypad, IoLockClosed, IoArrowBack,
    IoCheckmarkCircle, IoArrowForward, IoSparkles
} from 'react-icons/io5';
import api from '../utils/api';
import useMobileViewport from '../hooks/useMobileViewport';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/800.css';

const FONT = "'DM Sans','Inter','Segoe UI',sans-serif";

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

    // ── Strictly 0% scroll on forgot password page ──
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
            document.documentElement.style.overflow = prevHtmlOverflow;
        };
    }, []);

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
            setTimeout(() => { navigate('/login'); }, 1800);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (name) => ({
        width: '100%',
        padding: '10px 14px 10px 40px',
        border: focused === name ? '1.5px solid #F97316' : '1.5px solid #EDE8E0',
        borderRadius: 12,
        fontSize: 13.5,
        color: '#111827',
        background: focused === name ? '#FFFBF7' : '#fff',
        outline: 'none',
        boxShadow: focused === name ? '0 0 0 3px rgba(249,115,22,0.10)' : '0 1px 3px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        fontFamily: FONT,
        boxSizing: 'border-box',
    });

    return (
        <div
            style={{
                height: '100dvh',
                minHeight: '100vh',
                maxHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT,
                background: '#FFFBF7',
                position: 'relative',
                overflow: 'hidden',
                padding: 'clamp(14px, 2.5vh, 24px) 16px',
            }}
        >
            <style>{`
                html, body { overflow: hidden !important; height: 100% !important; margin: 0 !important; }
                * { font-family: 'DM Sans','Inter','Segoe UI',sans-serif !important; }
                @keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
                @keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-40px,30px) scale(1.08);}66%{transform:translate(20px,-30px) scale(0.92);}}
                @keyframes orb3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(25px,40px) scale(1.05);}}
                @keyframes spin{to{transform:rotate(360deg)}}
                input:-webkit-autofill{-webkit-box-shadow:0 0 0 50px #FFFBF7 inset !important;-webkit-text-fill-color:#111827 !important;}
                .forgot-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
                .forgot-blob-1{width:460px;height:460px;top:-120px;left:-140px;background:radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%);animation:orb1 22s ease-in-out infinite;}
                .forgot-blob-2{width:360px;height:360px;top:15%;right:-80px;background:radial-gradient(circle,rgba(251,146,60,0.05) 0%,transparent 70%);animation:orb2 28s ease-in-out infinite;}
                .forgot-blob-3{width:300px;height:300px;bottom:10%;left:5%;background:radial-gradient(circle,rgba(253,186,116,0.06) 0%,transparent 70%);animation:orb3 32s ease-in-out infinite;}
                .warm-input-wrap { position: relative; }
            `}</style>

            {/* ── Ambient Blobs ── */}
            <div className="forgot-blob forgot-blob-1" />
            <div className="forgot-blob forgot-blob-2" />
            <div className="forgot-blob forgot-blob-3" />

            {/* ── Fixed Dot Grid ── */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                    zIndex: 0,
                }}
            />

            {/* ── Top Header Brand Pill ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 'clamp(12px, 2vh, 20px)', zIndex: 10 }}>
                <img
                    src="/app-icon-192.png"
                    alt="Apna Lakshay"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        objectFit: 'cover',
                        boxShadow: '0 4px 12px rgba(249,115,22,0.28)',
                        flexShrink: 0,
                    }}
                />
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: 16, color: '#111827', lineHeight: 1, margin: 0 }}>Apna Lakshay</h1>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 2, margin: 0 }}>Account Recovery</p>
                </div>
            </div>

            {/* ── Recovery Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    maxWidth: 410,
                    background: '#fff',
                    borderRadius: 22,
                    padding: 'clamp(22px, 3vh, 30px) clamp(20px, 3vw, 28px)',
                    boxShadow: '0 8px 30px rgba(180,120,60,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                    border: '1.5px solid #EDE8E0',
                    position: 'relative',
                    zIndex: 10,
                    boxSizing: 'border-box',
                }}
            >
                {/* Top orange card stripe */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3.5,
                        background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)',
                        borderRadius: '22px 22px 0 0',
                    }}
                />

                {/* Card Header with Back button, title, and step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'clamp(14px, 2vh, 20px)' }}>
                    <Link
                        to="/login"
                        style={{
                            width: 34,
                            height: 34,
                            background: '#FFF7ED',
                            border: '1.5px solid #FED7AA',
                            borderRadius: 10,
                            color: '#EA580C',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.18s ease',
                            flexShrink: 0,
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#FFEDD5'; e.currentTarget.style.borderColor = '#F97316'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FED7AA'; }}
                    >
                        <IoArrowBack size={17} />
                    </Link>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 'clamp(17px, 2.2vh, 20px)', fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                            {step === 1 && 'Forgot Password'}
                            {step === 2 && 'Verify OTP'}
                            {step === 3 && 'Set New Password'}
                        </h2>
                        <p style={{ fontSize: 11.5, color: '#6B7280', margin: '2px 0 0', fontWeight: 600 }}>
                            Step {step} of 3
                        </p>
                    </div>

                    {/* Step progress pills */}
                    <div style={{ display: 'flex', gap: 5 }}>
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                style={{
                                    height: 5,
                                    borderRadius: 99,
                                    transition: 'all 0.3s',
                                    width: s === step ? 22 : 7,
                                    background: s === step ? 'linear-gradient(90deg, #F97316, #EA580C)' : s < step ? '#FB923C' : '#EDE8E0',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: '#FEF2F2',
                                border: '1.5px solid #FECACA',
                                color: '#B91C1C',
                                padding: '9px 12px',
                                borderRadius: 11,
                                fontSize: 12.5,
                                marginBottom: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                            }}
                        >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                background: '#F0FDF4',
                                border: '1.5px solid #BBF7D0',
                                color: '#15803D',
                                padding: '9px 12px',
                                borderRadius: 11,
                                fontSize: 12.5,
                                marginBottom: 14,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 7,
                            }}
                        >
                            <IoCheckmarkCircle size={15} style={{ color: '#22C55E' }} />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* Step 1: Send OTP */}
                    {step === 1 && (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            onSubmit={handleSendOTP}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 16px)' }}
                        >
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                                Enter your registered email to receive a verification code.
                            </p>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 5 }}>
                                    Email Address
                                </label>
                                <div className="warm-input-wrap">
                                    <IoMail
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            left: 13,
                                            color: focused === 'email' ? '#F97316' : '#9CA3AF',
                                            transition: 'color 0.15s',
                                            pointerEvents: 'none',
                                        }}
                                        size={16}
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={inputStyle('email')}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused('')}
                                        placeholder="hello@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={!loading ? { opacity: 0.92, y: -1 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)',
                                    color: loading ? '#9CA3AF' : '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.32)',
                                    transition: 'background 0.15s, box-shadow 0.15s',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        Send Verification Code <IoArrowForward size={14} />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            onSubmit={handleVerifyOTP}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 16px)' }}
                        >
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                                Enter the 4-digit code sent to <strong style={{ color: '#111827' }}>{email}</strong>
                            </p>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 5 }}>
                                    OTP Code
                                </label>
                                <div className="warm-input-wrap">
                                    <IoKeypad
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            left: 13,
                                            color: focused === 'otp' ? '#F97316' : '#9CA3AF',
                                            transition: 'color 0.15s',
                                            pointerEvents: 'none',
                                        }}
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        style={{
                                            ...inputStyle('otp'),
                                            textAlign: 'center',
                                            letterSpacing: '0.4em',
                                            fontFamily: 'monospace',
                                            fontSize: 18,
                                            fontWeight: 800,
                                        }}
                                        onFocus={() => setFocused('otp')}
                                        onBlur={() => setFocused('')}
                                        placeholder="····"
                                        maxLength={4}
                                        required
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={!loading ? { opacity: 0.92, y: -1 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)',
                                    color: loading ? '#9CA3AF' : '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.32)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Verifying…
                                    </>
                                ) : (
                                    <>
                                        Verify Code <IoArrowForward size={14} />
                                    </>
                                )}
                            </motion.button>

                            <div style={{ textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#F97316',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ← Change email
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* Step 3: Set New Password */}
                    {step === 3 && (
                        <motion.form
                            key="step3"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            onSubmit={handleResetPassword}
                            style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.8vh, 16px)' }}
                        >
                            <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                                Create a strong new password for your account.
                            </p>
                            {[
                                { label: 'New Password', val: password, set: setPassword, ph: 'Enter new password', id: 'password' },
                                { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword, ph: 'Confirm new password', id: 'confirm' }
                            ].map(({ label, val, set, ph, id }) => (
                                <div key={label}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#4B5563', marginBottom: 5 }}>
                                        {label}
                                    </label>
                                    <div className="warm-input-wrap">
                                        <IoLockClosed
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                left: 13,
                                                color: focused === id ? '#F97316' : '#9CA3AF',
                                                transition: 'color 0.15s',
                                                pointerEvents: 'none',
                                            }}
                                            size={16}
                                        />
                                        <input
                                            type="password"
                                            value={val}
                                            onChange={(e) => set(e.target.value)}
                                            style={inputStyle(id)}
                                            onFocus={() => setFocused(id)}
                                            onBlur={() => setFocused('')}
                                            placeholder={ph}
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                </div>
                            ))}

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={!loading ? { opacity: 0.92, y: -1 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                style={{
                                    width: '100%',
                                    padding: '11px',
                                    background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)',
                                    color: loading ? '#9CA3AF' : '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.32)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Resetting…
                                    </>
                                ) : (
                                    <>
                                        Set New Password <IoArrowForward size={14} />
                                    </>
                                )}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom subtitle note */}
            <p style={{ marginTop: 'clamp(10px, 1.8vh, 18px)', fontSize: 11, color: '#9CA3AF', textAlign: 'center', zIndex: 10 }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none' }}>
                    Login here
                </Link>
            </p>

            {/* Bottom full-width orange accent line (matches Login) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)',
                    zIndex: 40,
                }}
            />
        </div>
    );
};

export default ForgotPassword;
