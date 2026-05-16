import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    IoShieldCheckmarkOutline, IoLockClosedOutline,
    IoCheckmarkCircle, IoArrowForward, IoLogOutOutline,
} from 'react-icons/io5';

const FEATURES = [
    'Secure PIN-based access control',
    'Session-persistent verification',
    'Auto-lockout after 3 failed attempts',
    'Role-based dashboard protection',
];

const SubAdminPinGuard = ({ children }) => {
    const { user, logout } = useAuth();
    const [isVerified, setIsVerified] = useState(() => {
        if (user?.role !== 'subadmin') return true;
        if (user?.hasPin === false) return true;
        if (sessionStorage.getItem(`subAdminPinVerified_${user?.id}`) === 'true') return true;
        return false;
    });
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [shake, setShake] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (user?.role !== 'subadmin') { setIsVerified(true); return; }
        if (user.hasPin === false) { setIsVerified(true); return; }
        const sessionVerified = sessionStorage.getItem(`subAdminPinVerified_${user.id}`);
        if (sessionVerified === 'true') setIsVerified(true);
    }, [user]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (!isVerified) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isVerified]);

    const handlePinChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newPin = [...pin];
        if (value.length > 1) {
            const pastedDigits = value.replace(/\D/g, '').slice(0, 4).split('');
            for (let i = 0; i < pastedDigits.length; i++) {
                if (index + i < 4) newPin[index + i] = pastedDigits[i];
            }
            setPin(newPin);
            const nextIndex = Math.min(index + pastedDigits.length, 3);
            inputRefs.current[nextIndex]?.focus();
            if (newPin.join('').length === 4) verifyPin(newPin.join(''));
            return;
        }
        newPin[index] = value;
        setPin(newPin);
        setError('');
        if (value !== '' && index < 3) inputRefs.current[index + 1]?.focus();
        if (newPin.join('').length === 4) verifyPin(newPin.join(''));
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyPin = async (fullPin) => {
        setLoading(true);
        try {
            const res = await api.post('/admin/verify-subadmin-pin', { pin: fullPin });
            if (res.data.success) {
                setAttempts(0);
                sessionStorage.setItem(`subAdminPinVerified_${user.id}`, 'true');
                setIsVerified(true);
            }
        } catch (e) {
            const newAttempts = attempts + 1;
            if (newAttempts >= 3) {
                logout();
            } else {
                setAttempts(newAttempts);
                setError(`Incorrect PIN. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`);
                setPin(['', '', '', '']);
                setShake(true);
                setTimeout(() => setShake(false), 450);
                inputRefs.current[0]?.focus();
            }
        } finally {
            setLoading(false);
        }
    };

    if (isVerified) return <>{children}</>;

    const filledCount = pin.filter(d => d !== '').length;

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            background: '#fff', position: 'fixed', inset: 0, zIndex: 9999
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
                .do-shake{animation:shake 0.45s ease;}
                @keyframes spin{to{transform:rotate(360deg)}}
                .pin-spin{animation:spin 0.7s linear infinite}
            `}</style>

            {/* ═══ LEFT PANEL — brand (desktop only) ═══ */}
            <div className="hidden lg:flex flex-col" style={{
                width: '48%',
                background: '#FFF8F3',
                borderRight: '1px solid #FED7AA',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Orange top stripe */}
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)' }} />

                {/* Top nav */}
                <div style={{ padding: '20px 40px', display: 'flex', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: 900, fontSize: 18, color: '#111827', lineHeight: 1 }}>Apna Lakshay</p>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 4 }}>Library System</p>
                    </div>
                </div>

                {/* Brand content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 48px 40px' }}>
                    {/* Pill badge */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                            borderRadius: 100, marginBottom: 24, width: 'fit-content'
                        }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0 }} className="animate-pulse" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#EA6B00', letterSpacing: '0.04em' }}>Sub-Admin Secure Access</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
                        style={{ fontSize: 'clamp(1.9rem, 2.8vw, 2.6rem)', fontWeight: 900, color: '#111827', lineHeight: 1.15, marginBottom: 16 }}>
                        Verify Your Identity,<br />
                        <span style={{ color: '#F97316' }}>Stay Secure.</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65, maxWidth: 380, marginBottom: 32 }}>
                        Enter your 4-digit PIN assigned by the Super Admin to access your dashboard securely.
                    </motion.p>

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

                {/* Bottom footer */}
                <div style={{ padding: '16px 48px', borderTop: '1px solid #FED7AA' }}>
                    <p style={{ fontSize: 12, color: '#D1D5DB' }}>© 2026 Apna Lakshay · Secured Sub-Admin Portal</p>
                </div>
            </div>

            {/* ═══ RIGHT PANEL — PIN form ═══ */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px', background: '#fff',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Animated top/bottom orange bars (tied to filled digits) */}
                <motion.div
                    animate={{ width: `${(filledCount / 4) * 100}%`, opacity: filledCount > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{ position: 'absolute', top: 0, left: '50%', x: '-50%', height: '6px', background: 'linear-gradient(90deg, #F97316, #EF4444)', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
                />
                <motion.div
                    animate={{ width: `${(filledCount / 4) * 100}%`, opacity: filledCount > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{ position: 'absolute', bottom: 0, left: '50%', x: '-50%', height: '6px', background: 'linear-gradient(270deg, #EF4444, #F97316)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                />

                {/* Glow orbs */}
                <motion.div
                    animate={{ scale: 1 + (filledCount * 0.02), opacity: filledCount > 0 ? 0.15 : 0 }}
                    style={{ position: 'absolute', top: -150, left: '50%', x: '-50%', width: 300, height: 300, background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                />
                <motion.div
                    animate={{ scale: 1 + (filledCount * 0.02), opacity: filledCount > 0 ? 0.15 : 0 }}
                    style={{ position: 'absolute', bottom: -150, left: '50%', x: '-50%', width: 300, height: 300, background: 'radial-gradient(circle, #EF4444 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}
                />

                {/* Mobile brand header */}
                <div className="lg:hidden" style={{ width: '100%', maxWidth: 380, marginBottom: 28 }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg,#F97316,#FB923C)', borderRadius: 99, marginBottom: 20 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontWeight: 900, fontSize: 16, color: '#111827', lineHeight: 1 }}>Apna Lakshay</p>
                            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 3 }}>Library System</p>
                        </div>
                    </div>
                </div>

                {/* Form card */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={shake ? 'do-shake' : ''}
                    style={{ width: '100%', maxWidth: 380 }}
                >
                    {/* Header */}
                    <div style={{ marginBottom: 28 }}>
                        {/* Icon */}
                        <div style={{
                            width: 48, height: 48, background: '#FFF7ED',
                            border: '1.5px solid #FED7AA', borderRadius: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
                        }}>
                            <IoShieldCheckmarkOutline size={24} style={{ color: '#F97316' }} />
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                            Security Verification 🔐
                        </h2>
                        <p style={{ fontSize: 14, color: '#6B7280' }}>
                            Enter your 4-digit PIN to access the dashboard
                        </p>
                    </div>

                    {/* Error message */}
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

                    {/* PIN label */}
                    <div style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                        Enter 4-digit PIN
                    </div>

                    {/* PIN inputs */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                        {pin.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="password"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={4}
                                value={digit}
                                onChange={e => handlePinChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    height: 64,
                                    textAlign: 'center',
                                    fontSize: 28,
                                    fontWeight: 900,
                                    fontFamily: 'inherit',
                                    border: error
                                        ? '1.5px solid #FECACA'
                                        : digit
                                            ? '1.5px solid #F97316'
                                            : '1.5px solid #D1D5DB',
                                    borderRadius: 10,
                                    background: error ? '#FEF2F2' : digit ? '#FFF7ED' : '#fff',
                                    color: error ? '#B91C1C' : '#111827',
                                    outline: 'none',
                                    boxShadow: digit && !error ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
                                    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                                    cursor: 'text',
                                }}
                                onFocus={e => {
                                    if (!error) e.target.style.borderColor = '#F97316';
                                    if (!digit && !error) e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)';
                                }}
                                onBlur={e => {
                                    if (!digit && !error) {
                                        e.target.style.borderColor = '#D1D5DB';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F97316', fontWeight: 600, marginBottom: 16 }}>
                            <div className="pin-spin" style={{ width: 16, height: 16, border: '2px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%' }} />
                            Verifying PIN…
                        </div>
                    )}

                    {/* Attempts indicator */}
                    {attempts > 0 && !loading && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 20, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Attempts:</span>
                            {[0, 1, 2].map(i => (
                                <span key={i} style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: i < attempts ? '#EF4444' : '#E5E7EB',
                                    transition: 'background 0.2s'
                                }} />
                            ))}
                        </div>
                    )}

                    {/* Hint text */}
                    {!loading && !error && (
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>
                            PIN is automatically submitted when all 4 digits are entered.
                        </p>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20, marginTop: 4 }}>
                        <button
                            onClick={logout}
                            style={{
                                width: '100%', padding: '11px', borderRadius: 10,
                                border: '1.5px solid #E5E7EB',
                                background: '#fff', cursor: 'pointer',
                                fontSize: 14, fontWeight: 600, color: '#6B7280',
                                fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'border-color 0.15s, color 0.15s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.color = '#B91C1C'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
                        >
                            <IoLogOutOutline size={16} />
                            Cancel &amp; Log Out
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SubAdminPinGuard;
