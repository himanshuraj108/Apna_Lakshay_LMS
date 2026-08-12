import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// Session key: unlocked per tab/session
const SESSION_KEY = 'pin_unlocked';

/**
 * PinLockScreen
 * Shows a full-screen lock screen when:
 *  - User is logged in as student
 *  - PIN is enabled (appPinEnabled === true)
 *  - This browser session has NOT yet been unlocked
 *
 * On correct PIN → sets sessionStorage flag and hides the overlay.
 * On logout → sessionStorage is cleared automatically.
 */
export default function PinLockScreen({ children }) {
    const { user, logout } = useAuth();

    const [pinEnabled, setPinEnabled] = useState(false);
    const [pinLength, setPinLength] = useState(4); // Dynamically set to 4, 5, or 6
    const [locked, setLocked] = useState(false);
    const [checking, setChecking] = useState(true);

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [cooldown, setCooldown] = useState(0); // seconds

    const inputRef = useRef(null);
    const cooldownRef = useRef(null);

    // Check if lock screen should be shown
    useEffect(() => {
        if (!user || user.role !== 'student') {
            setChecking(false);
            return;
        }

        const alreadyUnlocked = sessionStorage.getItem(SESSION_KEY) === 'true';
        if (alreadyUnlocked) {
            setChecking(false);
            return;
        }

        // Fetch PIN status
        const check = async () => {
            try {
                const res = await api.get('/student/pin/status');
                if (res.data.success && res.data.appPinEnabled) {
                    setPinEnabled(true);
                    setPinLength(res.data.appPinLength || 4);
                    setLocked(true);
                }
            } catch {
                // If fails, don't lock (fail open)
            } finally {
                setChecking(false);
            }
        };
        check();
    }, [user]);

    // Auto-focus input when locked
    useEffect(() => {
        if (locked && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [locked]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        cooldownRef.current = setInterval(() => {
            setCooldown(c => {
                if (c <= 1) { clearInterval(cooldownRef.current); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(cooldownRef.current);
    }, [cooldown]);

    const handleUnlock = async (pinVal) => {
        const activePin = pinVal || pin;
        if (cooldown > 0 || loading) return;
        if (!activePin || activePin.length < pinLength) { setError(`Enter your ${pinLength}-digit PIN`); return; }

        setLoading(true);
        setError('');
        try {
            await api.post('/student/pin/verify', { pin: activePin });
            // Success — unlock
            sessionStorage.setItem(SESSION_KEY, 'true');
            setLocked(false);
            setPinEnabled(false);
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPin('');
            setError(err?.response?.data?.message || 'Incorrect PIN');
            setShake(true);
            setTimeout(() => setShake(false), 500);

            // Cooldown after 3 wrong attempts
            if (newAttempts >= 3) {
                const wait = Math.min(30, newAttempts * 5);
                setCooldown(wait);
                setError(`Too many attempts. Wait ${wait}s before trying again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Digit pad handler
    const handlePad = (d) => {
        if (cooldown > 0) return;
        if (d === 'del') { setPin(p => p.slice(0, -1)); setError(''); return; }
        if (pin.length >= pinLength) return;
        const next = pin + d;
        setPin(next);
        setError('');
        if (next.length === pinLength) {
            // Auto-submit when exact configured length is matched
            setTimeout(() => handleUnlock(next), 100);
        }
    };

    // If not student or PIN not enabled, just render children
    if (checking) return null;
    if (!locked) return children;

    return (
        <>
            {/* Blur the background */}
            <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none', height: '100vh', overflow: 'hidden' }} aria-hidden="true">
                {children}
            </div>

            {/* Lock overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(20px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter','Segoe UI',sans-serif",
                padding: 24,
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                    style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
                >
                    {/* Lock icon with Orange Branding */}
                    <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #F97316, #FB923C)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(249,115,22,0.4)',
                            marginBottom: 20,
                        }}>
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </motion.div>

                    {/* Profile name */}
                    <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>
                        {user?.name?.split(' ')[0] || 'Welcome back'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 28px', textAlign: 'center' }}>
                        Enter your {pinLength}-digit PIN to unlock
                    </p>

                    {/* PIN dots display - Dynamic length */}
                    <motion.div
                        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.45 }}
                        style={{ display: 'flex', gap: 12, marginBottom: 24 }}
                    >
                        {Array.from({ length: pinLength }).map((_, i) => (
                            <div key={i} style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: i < pin.length ? '#F97316' : 'rgba(255,255,255,0.15)',
                                border: '2px solid ' + (i < pin.length ? '#EA580C' : 'rgba(255,255,255,0.2)'),
                                transition: 'all 0.18s',
                                transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
                            }} />
                        ))}
                    </motion.div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ fontSize: 12, color: '#FCA5A5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '7px 14px', marginBottom: 16, textAlign: 'center', maxWidth: 280 }}
                            >
                                {cooldown > 0 ? `Too many attempts — wait ${cooldown}s` : error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Number pad */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12, marginBottom: 20 }}>
                        {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => (
                            d === '' ? <div key={i} /> :
                            <motion.button
                                key={i}
                                whileHover={d !== 'del' || pin.length > 0 ? { scale: 1.07 } : {}}
                                whileTap={d !== 'del' || pin.length > 0 ? { scale: 0.93 } : {}}
                                onClick={() => handlePad(d)}
                                disabled={cooldown > 0 || loading}
                                style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: d === 'del' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                                    border: '1.5px solid rgba(255,255,255,0.12)',
                                    color: d === 'del' ? '#9CA3AF' : '#fff',
                                    fontSize: d === 'del' ? 12 : 22,
                                    fontWeight: 700, cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                                    opacity: cooldown > 0 ? 0.4 : 1,
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'inherit',
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
                        ))}
                    </div>

                    {/* Unlock button with Orange color branding */}
                    <motion.button
                        whileHover={!loading && !cooldown ? { opacity: 0.9, scale: 1.02 } : {}}
                        whileTap={!loading && !cooldown ? { scale: 0.97 } : {}}
                        onClick={() => handleUnlock()}
                        disabled={loading || cooldown > 0 || pin.length < pinLength}
                        style={{
                            width: '100%', padding: '13px',
                            borderRadius: 14, border: 'none',
                            background: (loading || cooldown > 0 || pin.length < pinLength)
                                ? 'rgba(255,255,255,0.08)'
                                : 'linear-gradient(135deg, #F97316, #FB923C)',
                            color: (loading || cooldown > 0 || pin.length < pinLength) ? 'rgba(255,255,255,0.3)' : '#fff',
                            fontSize: 15, fontWeight: 700,
                            cursor: (loading || cooldown > 0 || pin.length < pinLength) ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            boxShadow: pin.length >= pinLength && !cooldown ? '0 8px 24px rgba(249,115,22,0.4)' : 'none',
                            transition: 'all 0.2s',
                            marginBottom: 16,
                        }}
                    >
                        {loading ? 'Verifying…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Unlock'}
                    </motion.button>

                    {/* Logout fallback */}
                    <button
                        onClick={() => { sessionStorage.removeItem(SESSION_KEY); logout(); }}
                        style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        Not you? Sign out
                    </button>
                </motion.div>
            </div>
        </>
    );
}
