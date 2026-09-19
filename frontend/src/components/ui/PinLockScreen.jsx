import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const SESSION_KEY = 'pin_unlocked';

export default function PinLockScreen({ children }) {
    const { user, logout } = useAuth();

    const [pinEnabled, setPinEnabled] = useState(false);
    const [pinLength, setPinLength] = useState(4);
    const [locked, setLocked] = useState(false);
    const [checking, setChecking] = useState(true);

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    const inputRef = useRef(null);
    const cooldownRef = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'student') { setChecking(false); return; }
        const alreadyUnlocked = sessionStorage.getItem(SESSION_KEY) === 'true';
        if (alreadyUnlocked) { setChecking(false); return; }
        const check = async () => {
            try {
                const res = await api.get('/student/pin/status');
                if (res.data.success && res.data.appPinEnabled) {
                    setPinEnabled(true);
                    setPinLength(res.data.appPinLength || 4);
                    setLocked(true);
                }
            } catch { /* fail open */ } finally { setChecking(false); }
        };
        check();
    }, [user]);

    useEffect(() => {
        if (locked && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
    }, [locked]);

    useEffect(() => {
        if (cooldown <= 0) return;
        cooldownRef.current = setInterval(() => {
            setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
        }, 1000);
        return () => clearInterval(cooldownRef.current);
    }, [cooldown]);

    const handleUnlock = async (pinVal) => {
        const activePin = pinVal || pin;
        if (cooldown > 0 || loading) return;
        if (!activePin || activePin.length < pinLength) { setError(`Enter your ${pinLength}-digit PIN`); return; }
        setLoading(true); setError('');
        try {
            await api.post('/student/pin/verify', { pin: activePin });
            sessionStorage.setItem(SESSION_KEY, 'true');
            setLocked(false); setPinEnabled(false);
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPin('');
            setError(err?.response?.data?.message || 'Incorrect PIN');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            if (newAttempts >= 3) {
                const wait = Math.min(30, newAttempts * 5);
                setCooldown(wait);
                setError(`Too many attempts. Wait ${wait}s before trying again.`);
            }
        } finally { setLoading(false); }
    };

    const handlePad = (d) => {
        if (cooldown > 0) return;
        if (d === 'del') { setPin(p => p.slice(0, -1)); setError(''); return; }
        if (pin.length >= pinLength) return;
        const next = pin + d;
        setPin(next); setError('');
        if (next.length === pinLength) setTimeout(() => handleUnlock(next), 100);
    };

    if (checking) return null;
    if (!locked) return children;

    const initials = (user?.name || 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <>
            {/* Blurred background */}
            <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', height: '100vh', overflow: 'hidden' }} aria-hidden="true">
                {children}
            </div>

            {/* ── Warm PIN overlay ── */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(250,246,240,0.96)',
                backdropFilter: 'blur(24px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif",
                padding: 20,
                backgroundImage: 'radial-gradient(circle, rgba(180,120,60,0.07) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
            }}>
                {/* Warm ambient blobs */}
                <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', filter: 'blur(100px)' }} />
                    <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'rgba(245,158,11,0.07)', filter: 'blur(90px)' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    style={{
                        width: '100%', maxWidth: 360,
                        background: '#FFFFFF',
                        border: '1.5px solid #EDE8E0',
                        borderRadius: 24,
                        boxShadow: '0 20px 60px rgba(120,80,30,0.12), 0 4px 16px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {/* 3px orange gradient top bar */}
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #F97316, #F59E0B, #EA580C)' }} />

                    <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

                        {/* Lock icon */}
                        <motion.div
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 28px rgba(249,115,22,0.30)',
                                marginBottom: 16,
                            }}
                        >
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </motion.div>

                        {/* Avatar + name */}
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)',
                            border: '2px solid #EDE8E0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 900, color: '#EA580C',
                            marginBottom: 10,
                        }}>
                            {initials}
                        </div>

                        <p style={{ color: '#0F172A', fontSize: 18, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>
                            {user?.name?.split(' ')[0] || 'Welcome back'}
                        </p>
                        <p style={{ color: '#786D62', fontSize: 12, fontWeight: 500, margin: '0 0 22px', textAlign: 'center' }}>
                            Enter your {pinLength}-digit PIN to unlock
                        </p>

                        {/* PIN dots */}
                        <motion.div
                            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
                            transition={{ duration: 0.45 }}
                            style={{ display: 'flex', gap: 12, marginBottom: 18 }}
                        >
                            {Array.from({ length: pinLength }).map((_, i) => (
                                <div key={i} style={{
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: i < pin.length
                                        ? 'linear-gradient(135deg, #F97316, #EA580C)'
                                        : '#F5EFE6',
                                    border: '2px solid ' + (i < pin.length ? '#EA580C' : '#EDE8E0'),
                                    transition: 'all 0.18s',
                                    transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
                                    boxShadow: i < pin.length ? '0 2px 8px rgba(249,115,22,0.35)' : 'none',
                                }} />
                            ))}
                        </motion.div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    style={{
                                        fontSize: 12, color: '#B91C1C',
                                        background: '#FEF2F2', border: '1.5px solid #FECACA',
                                        borderRadius: 10, padding: '8px 14px',
                                        marginBottom: 14, textAlign: 'center',
                                        width: '100%', boxSizing: 'border-box',
                                    }}
                                >
                                    {cooldown > 0 ? `Too many attempts — wait ${cooldown}s` : error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Number pad */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 16 }}>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((d, i) =>
                                d === '' ? <div key={i} /> : (
                                    <motion.button
                                        key={i}
                                        whileHover={cooldown <= 0 ? { scale: 1.05, background: '#FFF7ED' } : {}}
                                        whileTap={cooldown <= 0 ? { scale: 0.93 } : {}}
                                        onClick={() => handlePad(d)}
                                        disabled={cooldown > 0 || loading}
                                        style={{
                                            height: 58, borderRadius: 14,
                                            background: d === 'del' ? '#FAF6F0' : '#FFFFFF',
                                            border: '1.5px solid #EDE8E0',
                                            color: d === 'del' ? '#9B7B5A' : '#0F172A',
                                            fontSize: d === 'del' ? 13 : 20,
                                            fontWeight: 700,
                                            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                                            opacity: cooldown > 0 ? 0.4 : 1,
                                            transition: 'all 0.15s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontFamily: 'inherit',
                                            boxShadow: '0 1px 4px rgba(120,80,30,0.05)',
                                        }}
                                    >
                                        {d === 'del' ? (
                                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                                                <line x1="18" y1="9" x2="12" y2="15" />
                                                <line x1="12" y1="9" x2="18" y2="15" />
                                            </svg>
                                        ) : d}
                                    </motion.button>
                                )
                            )}
                        </div>

                        {/* Unlock button */}
                        <motion.button
                            whileHover={!loading && !cooldown && pin.length >= pinLength ? { opacity: 0.92, y: -1 } : {}}
                            whileTap={!loading && !cooldown && pin.length >= pinLength ? { scale: 0.98 } : {}}
                            onClick={() => handleUnlock()}
                            disabled={loading || cooldown > 0 || pin.length < pinLength}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 14, border: 'none',
                                background: (loading || cooldown > 0 || pin.length < pinLength)
                                    ? '#F0EBE4'
                                    : 'linear-gradient(135deg, #F97316, #EA580C)',
                                color: (loading || cooldown > 0 || pin.length < pinLength) ? '#9B7B5A' : '#fff',
                                fontSize: 15, fontWeight: 800,
                                cursor: (loading || cooldown > 0 || pin.length < pinLength) ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: pin.length >= pinLength && !cooldown ? '0 6px 20px rgba(249,115,22,0.35)' : 'none',
                                transition: 'all 0.2s',
                                marginBottom: 12,
                            }}
                        >
                            {loading ? 'Verifying…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Unlock'}
                        </motion.button>

                        {/* Logout fallback */}
                        <button
                            onClick={() => { sessionStorage.removeItem(SESSION_KEY); logout(); }}
                            style={{
                                fontSize: 12, color: '#9B7B5A', background: 'none',
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                textDecoration: 'underline', textDecorationColor: '#EDE8E0',
                            }}
                        >
                            Not you? Sign out
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
