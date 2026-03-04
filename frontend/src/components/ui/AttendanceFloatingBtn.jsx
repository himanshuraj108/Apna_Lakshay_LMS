import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import {
    IoClose, IoPhonePortrait, IoQrCode, IoCheckmarkCircle,
    IoWarning, IoKeypad, IoLogIn, IoTime, IoMail, IoLocationOutline, IoWarningOutline
} from 'react-icons/io5';
import CredentialPopup from './CredentialPopup';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/api';

const API = BASE_URL; // e.g. http://localhost:5000

// Steps: closed → phone → location (optional) → scanning → success → (otp) → done
const STEPS = { CLOSED: 'closed', PHONE: 'phone', LOCATION: 'location', SCANNING: 'scanning', SUCCESS: 'success', OTP: 'otp', DONE: 'done' };

export default function AttendanceFloatingBtn() {
    const [step, setStep] = useState(STEPS.CLOSED);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scanResult, setScanResult] = useState(null);   // { name, type, time, message }
    const [coords, setCoords] = useState(null); // Optional cached location
    const [maskedEmail, setMaskedEmail] = useState('');
    const [debugOtp, setDebugOtp] = useState('');       // shown in dev if email fails
    const [credentials, setCredentials] = useState(null); // { user, password }
    const scannerRef = useRef(null);
    const navigate = useNavigate();

    // Clean up scanner on unmount / step change
    useEffect(() => {
        return () => stopScanner();
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const isRunning = scannerRef.current.isScanning;
                if (isRunning) await scannerRef.current.stop();
            } catch (_) { }
            scannerRef.current = null;
        }
    };

    const reset = () => {
        stopScanner();
        setStep(STEPS.CLOSED);
        setMobile('');
        setOtp('');
        setError('');
        setScanResult(null);
        setMaskedEmail('');
    };

    // ── STEP 1: Phone lookup — verify in DB first ─────────────────
    const handlePhone = async (e) => {
        e.preventDefault();
        if (mobile.length !== 10) { setError('Enter a valid 10-digit phone number'); return; }
        setError('');
        setLoading(true);
        try {
            // Verify phone exists in DB before opening scanner
            await axios.post(`${API}/api/auth/check-phone`, { mobile });

            // Check if location is required by admin
            try {
                const settingsRes = await axios.get(`${API}/api/public/settings`);
                if (settingsRes.data.success && settingsRes.data.settings.locationAttendance === false) {
                    setStep(STEPS.SCANNING); // Skip location step
                } else {
                    setStep(STEPS.LOCATION); // Require location first
                }
            } catch (err) {
                console.warn('Failed to fetch public settings for location requirements');
                setStep(STEPS.LOCATION); // Default to requiring location on failure
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Phone number not found. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── STEP 2: Start QR scanner after DOM mounts ─────────────────
    useEffect(() => {
        if (step !== STEPS.SCANNING) return;
        let cancelled = false;

        const startScanner = async () => {
            await new Promise(r => setTimeout(r, 300)); // wait for DOM
            if (cancelled) return;

            const qr = new Html5Qrcode('qr-attendance-reader');
            scannerRef.current = qr;

            try {
                await qr.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 220, height: 220 } },
                    async (decodedText) => {
                        // QR scanned → decodedText is the kioskToken
                        await stopScanner();
                        if (cancelled) return;
                        await markAttendance(decodedText);
                    },
                    () => { }
                );
            } catch (err) {
                if (!cancelled) setError('Camera access denied. Please allow camera and try again.');
            }
        };

        startScanner();
        return () => { cancelled = true; stopScanner(); };
    }, [step]);

    // ── Get current GPS location ─────────────────────────────────────────
    const getLocation = () =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser.'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => reject(new Error('Location access denied. Please allow location to mark attendance.')),
                { timeout: 10000, maximumAge: 0 }
            );
        });

    // ── Mark attendance via API ────────────────────────────────────
    const markAttendance = async (kioskToken) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API}/api/auth/kiosk-attendance`, { mobile, kioskToken, ...(coords || {}) });
            setScanResult(res.data);
            setStep(STEPS.SUCCESS);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to mark attendance';
            setError(msg);
            setStep(STEPS.PHONE); // go back
        } finally {
            setLoading(false);
        }
    };

    // ── STEP 3: User chose Login → send OTP ───────────────────────
    const handleLoginChoice = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API}/api/auth/send-otp-phone`, { mobile });
            setMaskedEmail(res.data.maskedEmail || '');
            setDebugOtp(res.data.debug_otp || ''); // shown as hint in dev mode
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ── STEP 4: Verify OTP → auto-login ───────────────────────────
    const handleOtp = async (e) => {
        e.preventDefault();
        if (otp.length < 4) { setError('Enter the full OTP'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API}/api/auth/verify-otp-login`, { mobile, otp });
            const { token, user, password } = res.data;

            // Store in localStorage (same shape as normal login)
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setCredentials({ user, password });
            setStep(STEPS.DONE);

            // Full reload so AuthContext picks up the new token from localStorage
            // Direct Admin to /admin, Students to /student
            setTimeout(() => {
                window.location.href = user.role === 'admin' ? '/admin' : '/student';
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {step === STEPS.CLOSED && (
                    <motion.button
                        key="fab"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setStep(STEPS.PHONE)}
                        className="fixed bottom-8 right-6 z-50 flex flex-col items-center gap-1 group"
                        style={{ filter: 'drop-shadow(0 0 18px rgba(34,197,94,0.55))' }}
                    >
                        {/* Pulse ring */}
                        <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" style={{ borderRadius: '999px' }} />
                        <span
                            className="relative flex items-center gap-2 px-5 py-3.5 rounded-full font-bold text-white text-sm tracking-wide"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 24px rgba(22,163,74,0.4)' }}
                        >
                            <IoQrCode size={20} />
                            Attendance
                        </span>
                        <span className="text-[10px] text-green-400 font-semibold tracking-wider uppercase opacity-80">
                            Mark Now
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal Overlay */}
            <AnimatePresence>
                {step !== STEPS.CLOSED && step !== STEPS.DONE && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                        onClick={(e) => e.target === e.currentTarget && reset()}
                    >
                        <motion.div
                            key="modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #0a0c1c 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
                            }}
                        >
                            {/* Header bar */}
                            <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #16a34a, #22c55e, #4ade80)' }} />

                            <div className="p-6">
                                {/* Title row */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                                            {step === STEPS.PHONE && <IoPhonePortrait size={18} className="text-white" />}
                                            {step === STEPS.LOCATION && <IoLocationOutline size={18} className="text-white" />}
                                            {step === STEPS.SCANNING && <IoQrCode size={18} className="text-white" />}
                                            {step === STEPS.SUCCESS && <IoCheckmarkCircle size={18} className="text-white" />}
                                            {step === STEPS.OTP && <IoKeypad size={18} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">
                                                {step === STEPS.PHONE && 'Mark Attendance'}
                                                {step === STEPS.LOCATION && 'Location Access Required'}
                                                {step === STEPS.SCANNING && 'Scan Kiosk QR'}
                                                {step === STEPS.SUCCESS && 'Attendance Marked!'}
                                                {step === STEPS.OTP && 'Verify & Login'}
                                            </p>
                                            <p className="text-gray-500 text-xs">Apna Lakshay Library</p>
                                        </div>
                                    </div>
                                    <button onClick={reset} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                                        <IoClose size={18} />
                                    </button>
                                </div>

                                {/* Error message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 text-sm text-red-400"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                            <IoWarning size={16} className="shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── STEP: Phone ── */}
                                {step === STEPS.PHONE && (
                                    <form onSubmit={handlePhone} className="space-y-4">
                                        <div className="text-center mb-4">
                                            <p className="text-gray-400 text-sm">Enter your registered phone number to scan the attendance QR</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">+91</span>
                                                <input
                                                    type="tel" maxLength={10} value={mobile}
                                                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="98765 43210"
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-sm font-mono outline-none transition-all placeholder-gray-600"
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    autoFocus required
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={loading || mobile.length !== 10}
                                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 20px rgba(22,163,74,0.3)' }}>
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><IoQrCode size={16} /> Open Scanner</>}
                                        </button>
                                    </form>
                                )}

                                {/* ── STEP: Location ── */}
                                {step === STEPS.LOCATION && (
                                    <div className="space-y-4">
                                        <div className="text-center mb-4">
                                            <div className="w-16 h-16 mx-auto bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                                                <IoLocationOutline size={32} />
                                            </div>
                                            <p className="text-white font-bold text-lg mb-2">Enable Location Services</p>
                                            <p className="text-gray-400 text-sm">
                                                To ensure you are at the library, we need to verify your current location before proceeding to the QR scanner.
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setError('');
                                                setLoading(true);
                                                try {
                                                    const fetchedCoords = await getLocation();
                                                    setCoords(fetchedCoords);
                                                    setStep(STEPS.SCANNING);
                                                } catch (err) {
                                                    // Check if it's a permission denied error
                                                    if (err.message.toLowerCase().includes('denied')) {
                                                        setError('Location was denied. Please enable location in your browser settings, then try again.');
                                                    } else {
                                                        setError(err.message);
                                                    }
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading}
                                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
                                            {loading
                                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                : <><IoLocationOutline size={16} /> Allow Location Access</>}
                                        </button>
                                    </div>
                                )}

                                {/* ── STEP: Scanning ── */}
                                {step === STEPS.SCANNING && (
                                    <div>
                                        <p className="text-gray-400 text-xs text-center mb-3">Point your camera at the <span className="text-green-400 font-semibold">Kiosk QR code</span> on the wall</p>
                                        <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(34,197,94,0.4)' }}>
                                            <div id="qr-attendance-reader" style={{ width: '100%' }} />
                                            {/* Corner markers */}
                                            {[['top-2 left-2', 'border-t-2 border-l-2'], ['top-2 right-2', 'border-t-2 border-r-2'], ['bottom-2 left-2', 'border-b-2 border-l-2'], ['bottom-2 right-2', 'border-b-2 border-r-2']].map(([pos, cls]) => (
                                                <div key={pos} className={`absolute ${pos} w - 6 h - 6 ${cls} border - green - 400`} />
                                            ))}
                                        </div>
                                        {loading && (
                                            <div className="flex items-center justify-center gap-2 mt-3 text-green-400 text-sm">
                                                <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                                                Marking attendance…
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── STEP: Success ── */}
                                {step === STEPS.SUCCESS && scanResult && (
                                    <div className="text-center space-y-4">
                                        {/* Avatar / icon */}
                                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                                            style={{ background: scanResult.type === 'check-in' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: `0 0 30px ${scanResult.type === 'check-in' ? 'rgba(22,163,74,0.4)' : 'rgba(37,99,235,0.4)'} ` }}>
                                            {scanResult.type === 'check-in' ? '✅' : '👋'}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">{scanResult.student?.name}</p>
                                            <p className="text-gray-400 text-sm">{scanResult.message}</p>
                                            <div className="flex items-center justify-center gap-1 mt-1 text-gray-500 text-xs">
                                                <IoTime size={12} />
                                                {scanResult.time}
                                                {scanResult.student?.seat !== 'No Seat' && <> · Seat {scanResult.student?.seat}</>}
                                            </div>
                                        </div>

                                        {/* Login or Later */}
                                        <div className="rounded-2xl p-4 mt-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <p className="text-gray-400 text-xs mb-3">Do you want to log into your dashboard?</p>
                                            <div className="flex gap-3">
                                                <button onClick={handleLoginChoice} disabled={loading}
                                                    className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><IoLogIn size={16} /> Login</>}
                                                </button>
                                                <button onClick={reset}
                                                    className="flex-1 py-2.5 rounded-xl font-semibold text-gray-400 text-sm hover:bg-white/5 transition-all"
                                                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    Later
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── STEP: OTP ── */}
                                {step === STEPS.OTP && (
                                    <form onSubmit={handleOtp} className="space-y-4">
                                        {/* Gmail instruction */}
                                        <div className="rounded-2xl px-5 py-4 text-center relative overflow-hidden flex flex-col items-center gap-1.5"
                                            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.2)' }}>
                                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                                            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-1 border border-violet-500/30">
                                                <IoMail size={24} className="text-violet-400" />
                                            </div>
                                            <h3 className="text-white font-black text-lg tracking-wide">Check your Gmail</h3>
                                            <p className="text-gray-300 text-sm mt-1">
                                                OTP sent to <br /><span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full mt-2 inline-block shadow-inner border border-white/5">{maskedEmail}</span>
                                            </p>
                                            <p className="text-violet-300 text-[10px] font-medium mt-2 uppercase tracking-widest">Verify inbox &amp; spam folder</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Enter OTP</label>
                                            <input
                                                type="text" inputMode="numeric" maxLength={6} value={otp}
                                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="● ● ● ● ● ●"
                                                className="w-full px-4 py-3.5 rounded-xl text-white text-center text-xl font-mono tracking-[0.5em] outline-none transition-all placeholder-gray-700"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                autoFocus
                                            />
                                        </div>
                                        <button type="submit" disabled={loading || otp.length < 4}
                                            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                                            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
                                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><IoLogIn size={16} /> Verify &amp; Login</>}
                                        </button>
                                        <button type="button" onClick={() => setStep(STEPS.SUCCESS)} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">← Go back</button>
                                    </form>
                                )}
                            </div>

                            {/* Step indicator dots */}
                            <div className="flex justify-center gap-1.5 pb-4">
                                {[STEPS.PHONE, STEPS.SCANNING, STEPS.SUCCESS, STEPS.OTP].map((s, i) => (
                                    <div key={i} className="h-1 rounded-full transition-all duration-300"
                                        style={{ width: step === s ? 20 : 6, background: step === s ? '#22c55e' : 'rgba(255,255,255,0.1)' }} />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Credential popup after login */}
            {step === STEPS.DONE && credentials && (
                <CredentialPopup user={credentials.user} password={credentials.password} onClose={() => setCredentials(null)} />
            )}
        </>
    );
}
