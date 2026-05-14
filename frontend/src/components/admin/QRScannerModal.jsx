import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaCamera, FaSignInAlt, FaSignOutAlt, FaUserCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Badge from '../../components/ui/Badge';

// --- Scan Feedback: MAX volume beep + vibrate ---
// NOTE: Browsers cannot override system volume, but Web Audio gain boost
// makes it as loud as physically possible within the browser.
let beepBuffer = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Preload and decode beep.mp3 into AudioBuffer for max volume control
fetch('/beep.mp3')
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => { beepBuffer = buffer; })
    .catch(() => { beepBuffer = null; });

const playBeep = (type = 'success') => {
    if (type === 'success') {
        if (beepBuffer) {
            // Play decoded MP3 with gain boost (as loud as browser allows)
            const source = audioCtx.createBufferSource();
            const gainNode = audioCtx.createGain();
            source.buffer = beepBuffer;
            gainNode.gain.value = 3.0; // Boost: 3x amplification
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            source.start(0);
        } else {
            // Fallback: synthesized square wave (already loud)
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(3800, audioCtx.currentTime);
                gain.gain.setValueAtTime(3.0, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.12);
            } catch (e) { }
        }
    } else {
        // Error: two loud buzzes
        try {
            [0, 0.2].forEach(delay => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime + delay);
                gain.gain.setValueAtTime(3.0, audioCtx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.15);
                osc.start(audioCtx.currentTime + delay); osc.stop(audioCtx.currentTime + delay + 0.15);
            });
        } catch (e) { }
    }
};

const vibrate = (type = 'success') => {
    if (!navigator.vibrate) return;
    if (type === 'success') {
        navigator.vibrate([80, 40, 80]); // two short pulses
    } else {
        navigator.vibrate([200, 100, 200, 100, 400]); // error pattern
    }
};

const QRScannerModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('check-in'); // check-in, check-out, verify
    const [scanResult, setScanResult] = useState(null); // { type: 'success'|'error', message, studentName }
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualId, setManualId] = useState('');
    const [cameraError, setCameraError] = useState(null);
    const html5QrCodeRef = useRef(null);

    // We use a ref for mode to access the latest state inside the QR callback closure
    const modeRef = useRef(mode);
    useEffect(() => { modeRef.current = mode; }, [mode]);

    const handleProcessing = async (decodedText) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Access the current mode via Ref
        const currentMode = modeRef.current;

        // Pause scanning visually and logically
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.pause();
        }

        // Parse QR Data (JSON Token or Legacy String)
        let qrData = {};
        try {
            const parsed = JSON.parse(decodedText);
            if (parsed.token) qrData.qrToken = parsed.token;
            if (parsed.id) qrData.studentId = parsed.id;
        } catch (e) {
            // Legacy / Manual ID
            const id = decodedText.includes('/verify/')
                ? decodedText.split('/verify/')[1]
                : decodedText;
            qrData.studentId = id;
        }

        if (currentMode === 'verify') {
            navigate(`/admin/verify/${qrData.studentId}`);
            onClose();
            return;
        }

        try {
            const endpoint = currentMode === 'check-in'
                ? '/admin/attendance/check-in'
                : '/admin/attendance/check-out';

            const response = await api.post(endpoint, qrData);

            playBeep('success');
            vibrate('success');

            setScanResult({
                type: 'success',
                message: response.data.message,
                studentName: response.data.attendance?.student?.name
            });

            // Auto resume after 2 seconds
            setTimeout(() => {
                setScanResult(null);
                setIsProcessing(false);
                if (html5QrCodeRef.current) {
                    html5QrCodeRef.current.resume();
                }
            }, 2000);

        } catch (error) {
            console.error('Scan Action Failed:', error);
            playBeep('error');
            vibrate('error');

            setScanResult({
                type: 'error',
                message: error.response?.data?.message || 'Action failed'
            });

            setTimeout(() => {
                setScanResult(null);
                setIsProcessing(false);
                if (html5QrCodeRef.current) {
                    html5QrCodeRef.current.resume();
                }
            }, 2000);
        }
    };

    const handleManualSubmit = () => {
        if (manualId.trim()) {
            handleProcessing(manualId.trim());
            setManualId('');
        }
    };

    useEffect(() => {
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        // Success callback
                        if (!isProcessing) {
                            handleProcessing(decodedText);
                        }
                    },
                    (errorMessage) => {
                        // ignore errors during scanning
                    }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                setCameraError("Camera permission denied or camera not found.");
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => {
                        html5QrCodeRef.current.clear();
                    }).catch(console.error);
                } else {
                    html5QrCodeRef.current.clear();
                }
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className="bg-gray-50 rounded-3xl p-6 max-w-[340px] w-full shadow-2xl relative border border-gray-200 overflow-hidden mx-auto my-auto max-h-[90vh] flex flex-col">
                {/* Background glow effects */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition-all z-30"
                >
                    <FaTimes size={16} />
                </button>

                <div className="flex flex-col items-center justify-center gap-2 mb-6 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20 mb-2">
                        <FaCamera className="text-gray-900 text-xl" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">QR Scanner</h2>
                </div>

                {/* Mode Toggles */}
                <div className="flex bg-gray-50 border border-gray-200 rounded-2xl p-1 mb-6 relative z-10 backdrop-blur-md">
                    <button
                        onClick={() => setMode('check-in')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'check-in'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                            : 'text-gray-600 hover:text-white hover:bg-gray-50'
                            }`}
                    >
                        <FaSignInAlt size={16} /> In
                    </button>
                    <button
                        onClick={() => setMode('check-out')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'check-out'
                            ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                            : 'text-gray-600 hover:text-white hover:bg-gray-50'
                            }`}
                    >
                        <FaSignOutAlt size={16} /> Out
                    </button>
                    <button
                        onClick={() => setMode('verify')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'verify'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-600 hover:text-white hover:bg-gray-50'
                            }`}
                    >
                        <FaUserCheck size={16} /> Verify
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0f] w-full aspect-square max-h-[260px] max-w-[260px] mx-auto mb-6 border-2 border-gray-100 group shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-10 transition-colors flex items-center justify-center">
                    {!cameraError ? (
                        <div id="reader" className="w-[105%] h-[105%] flex items-center justify-center object-cover [&_video]:object-cover [&_video]:rounded-2xl [&_video]:!w-full [&_video]:!h-full"></div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                            <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl p-6 shadow-xl w-full max-w-[280px]">
                                <FaCamera className="mx-auto text-red-500 mb-4" size={40} />
                                <p className="text-red-400 font-bold mb-2">{cameraError}</p>
                                <p className="text-gray-500 text-xs">Please allow camera access in your browser settings to scan QR Codes.</p>
                            </div>
                        </div>
                    )}

                    {/* Result Overlay */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xl ${scanResult.type === 'success' && modeRef.current === 'check-in'
                                    ? 'bg-green-500/30 border-4 border-green-500/50'
                                    : scanResult.type === 'success' && modeRef.current === 'check-out'
                                        ? 'bg-red-500/30 border-4 border-red-500/50'
                                        : 'bg-red-500/30 border-4 border-red-500/50'
                                    }`}
                            >
                                <div className={`rounded-3xl p-5 mb-5 shadow-2xl backdrop-blur-xl border border-white/20 ${scanResult.type === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'}`}>
                                    {scanResult.type === 'success' ? (
                                        <FaSignInAlt size={40} className="text-gray-900 drop-shadow-md" />
                                    ) : (
                                        <FaTimes size={40} className="text-gray-900 drop-shadow-md" />
                                    )}
                                </div>
                                <h3 className="text-3xl font-black mb-3 text-gray-900 drop-shadow-lg">
                                    {scanResult.type === 'success' ? 'Success!' : 'Error'}
                                </h3>
                                <p className="font-bold text-lg mb-4 text-gray-900/90 drop-shadow-md px-4">{scanResult.message}</p>
                                {scanResult.studentName && (
                                    <div className="px-5 py-2.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold tracking-wide shadow-xl">
                                        {scanResult.studentName}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scanning Line Animation overlay */}
                    {!scanResult && !cameraError && (
                        <motion.div
                            className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_25px_rgba(59,130,246,0.8)] z-10 opacity-70"
                            animate={{ top: ['5%', '95%', '5%'] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}
                </div>

                <div className="flex gap-3 relative z-10 w-full">
                    <input
                        type="text"
                        placeholder="Or scan/type ID here..."
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-gray-100 outline-none transition-all font-medium"
                    />
                    <button
                        onClick={handleManualSubmit}
                        disabled={!manualId.trim() || isProcessing}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:from-blue-500/50 disabled:to-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/25 transition-all outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        Go
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default QRScannerModal;
