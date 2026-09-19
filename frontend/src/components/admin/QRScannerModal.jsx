import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    IoClose, IoCameraOutline, IoCameraReverseOutline,
    IoLogInOutline, IoLogOutOutline, IoPersonOutline,
    IoQrCodeOutline, IoImageOutline, IoCheckmarkCircleOutline,
    IoAlertCircleOutline, IoRefreshOutline
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

// --- Scan Audio Feedback: MAX volume beep + vibrate ---
let beepBuffer = null;
const audioCtx = typeof window !== 'undefined'
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

if (typeof window !== 'undefined') {
    fetch('/beep.mp3')
        .then(res => res.arrayBuffer())
        .then(data => audioCtx?.decodeAudioData(data))
        .then(buffer => { beepBuffer = buffer; })
        .catch(() => { beepBuffer = null; });
}

const playBeep = (type = 'success') => {
    if (!audioCtx) return;
    if (type === 'success') {
        if (beepBuffer) {
            try {
                const source = audioCtx.createBufferSource();
                const gainNode = audioCtx.createGain();
                source.buffer = beepBuffer;
                gainNode.gain.value = 3.0;
                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                source.start(0);
            } catch (_) { }
        } else {
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(3800, audioCtx.currentTime);
                gain.gain.setValueAtTime(3.0, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.12);
            } catch (_) { }
        }
    } else {
        try {
            [0, 0.2].forEach(delay => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime + delay);
                gain.gain.setValueAtTime(3.0, audioCtx.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.15);
                osc.start(audioCtx.currentTime + delay);
                osc.stop(audioCtx.currentTime + delay + 0.15);
            });
        } catch (_) { }
    }
};

const vibrate = (type = 'success') => {
    if (!navigator?.vibrate) return;
    if (type === 'success') {
        navigator.vibrate([80, 40, 80]);
    } else {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }
};

const QRScannerModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('check-in'); // 'check-in' | 'check-out' | 'verify'
    const [scanResult, setScanResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualId, setManualId] = useState('');
    const [cameraError, setCameraError] = useState(null);
    const [isCameraLoading, setIsCameraLoading] = useState(true);
    const [cameraList, setCameraList] = useState([]);
    const [activeCameraIndex, setActiveCameraIndex] = useState(0);

    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);
    const modeRef = useRef(mode);

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    // Handle Scanned Token or Manual ID
    const handleProcessing = async (decodedText) => {
        if (!decodedText || isProcessing) return;
        setIsProcessing(true);

        const currentMode = modeRef.current;

        // Briefly pause camera detection to avoid double triggers
        if (html5QrCodeRef.current?.isScanning) {
            try {
                html5QrCodeRef.current.pause(true);
            } catch (_) { }
        }

        // Parse QR Payload: Support JSON tokens, URL parameters, or raw ID strings
        let qrData = {};
        try {
            const parsed = JSON.parse(decodedText);
            if (parsed.token) qrData.qrToken = parsed.token;
            if (parsed.id) qrData.studentId = parsed.id;
        } catch (_) {
            let id = decodedText;
            if (id.includes('/verify/')) {
                id = id.split('/verify/')[1];
            } else if (id.includes('?id=')) {
                id = new URL(id, window.location.origin).searchParams.get('id') || id;
            }
            qrData.studentId = id.trim();
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
                message: response.data?.message || 'Attendance registered successfully',
                studentName: response.data?.attendance?.student?.name || 'Student',
                studentSeat: response.data?.attendance?.student?.seatNumber || response.data?.student?.seat || null,
                timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            });

            // Auto-resume after 2.2 seconds
            setTimeout(() => {
                setScanResult(null);
                setIsProcessing(false);
                if (html5QrCodeRef.current?.isScanning) {
                    try {
                        html5QrCodeRef.current.resume();
                    } catch (_) { }
                }
            }, 2200);

        } catch (error) {
            console.error('Attendance Scan Failed:', error);
            playBeep('error');
            vibrate('error');

            setScanResult({
                type: 'error',
                message: error.response?.data?.message || 'Verification failed. Student not found or inactive.'
            });

            setTimeout(() => {
                setScanResult(null);
                setIsProcessing(false);
                if (html5QrCodeRef.current?.isScanning) {
                    try {
                        html5QrCodeRef.current.resume();
                    } catch (_) { }
                }
            }, 2400);
        }
    };

    // Manual ID Submit
    const handleManualSubmit = () => {
        if (manualId.trim()) {
            handleProcessing(manualId.trim());
            setManualId('');
        }
    };

    // Scan from image file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !html5QrCodeRef.current) return;
        try {
            const decodedText = await html5QrCodeRef.current.scanFile(file, true);
            if (decodedText) {
                handleProcessing(decodedText);
            }
        } catch (err) {
            console.warn('QR decode from file failed:', err);
            setScanResult({
                type: 'error',
                message: 'No readable QR code found in this image. Try another photo.'
            });
            setTimeout(() => setScanResult(null), 2500);
        }
        e.target.value = '';
    };

    // Start scanner with device enumeration & multi-stage fallback
    const initAndStartScanner = async (preferredIndex = 0) => {
        setIsCameraLoading(true);
        setCameraError(null);

        try {
            // Stop any existing scanner instance
            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        await html5QrCodeRef.current.stop();
                    }
                    html5QrCodeRef.current.clear();
                } catch (_) { }
            }

            const qrInstance = new Html5Qrcode('qr-camera-viewport');
            html5QrCodeRef.current = qrInstance;

            // 1. Enumerate available video devices
            let devices = [];
            try {
                devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameraList(devices);
                }
            } catch (enumErr) {
                console.warn('Could not enumerate cameras upfront:', enumErr);
            }

            // 2. Determine target camera
            let cameraConfig;
            if (devices && devices.length > 0) {
                const targetIdx = preferredIndex % devices.length;
                setActiveCameraIndex(targetIdx);
                cameraConfig = devices[targetIdx].id;
            } else {
                // Device without enumerated labels, fallback by user agent
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                cameraConfig = { facingMode: isMobile ? 'environment' : 'user' };
            }

            const scanConfig = {
                fps: 15,
                qrbox: (viewWidth, viewHeight) => {
                    const edge = Math.min(viewWidth, viewHeight);
                    const box = Math.max(180, Math.floor(edge * 0.72));
                    return { width: box, height: box };
                },
                aspectRatio: 1.0
            };

            // 3. Attempt primary start
            await qrInstance.start(
                cameraConfig,
                scanConfig,
                (decodedText) => {
                    handleProcessing(decodedText);
                },
                () => { } // ignore frame misses
            );

            setIsCameraLoading(false);
        } catch (primaryErr) {
            console.warn('Primary camera start failed, attempting fallback...', primaryErr);
            // 4. Secondary fallback: try facingMode: "user"
            try {
                if (html5QrCodeRef.current) {
                    await html5QrCodeRef.current.start(
                        { facingMode: 'user' },
                        { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
                        (decodedText) => handleProcessing(decodedText),
                        () => { }
                    );
                    setIsCameraLoading(false);
                    return;
                }
            } catch (fallbackErr) {
                console.error('All camera start attempts failed:', fallbackErr);
                setCameraError('Camera access blocked or device not found. Please enable camera permission in your browser, or type the ID below.');
                setIsCameraLoading(false);
            }
        }
    };

    // Camera Switcher
    const handleSwitchCamera = () => {
        if (cameraList.length <= 1) return;
        const nextIndex = (activeCameraIndex + 1) % cameraList.length;
        initAndStartScanner(nextIndex);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            initAndStartScanner(0);
        }, 150);

        return () => {
            clearTimeout(timer);
            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        html5QrCodeRef.current.stop().then(() => {
                            html5QrCodeRef.current.clear();
                        }).catch(() => { });
                    } else {
                        html5QrCodeRef.current.clear();
                    }
                } catch (_) { }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4"
        >
            <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl p-5 sm:p-6 max-w-[390px] w-full shadow-2xl relative border border-[#EDE8E0] overflow-hidden flex flex-col my-auto"
                style={{ fontFamily: "'DM Sans', 'Inter', -apple-system, sans-serif" }}
            >
                {/* Top Warm Accent Bar */}
                <div
                    className="absolute top-0 left-0 right-0 h-[3.5px] rounded-t-3xl"
                    style={{ background: 'linear-gradient(90deg, #F97316, #FB923C, #EA580C)' }}
                />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors z-30 cursor-pointer"
                    title="Close Scanner"
                >
                    <IoClose size={18} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center justify-center text-center mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-md shadow-orange-500/20"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                        <IoQrCodeOutline size={24} className="text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
                        Campus Attendance Scanner
                    </h2>
                    <p className="text-stone-500 text-xs mt-0.5 font-medium">
                        Instant QR code scan, student token or manual entry
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-[#F5F0EA] border border-[#E2DBD2] rounded-2xl p-1 mb-4 relative z-10">
                    <button
                        onClick={() => setMode('check-in')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mode === 'check-in'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                                : 'text-stone-600 hover:text-[#0F172A]'
                        }`}
                    >
                        <IoLogInOutline size={15} />
                        <span>In</span>
                    </button>
                    <button
                        onClick={() => setMode('check-out')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mode === 'check-out'
                                ? 'bg-gradient-to-r from-rose-500 to-amber-600 text-white shadow-md shadow-rose-500/25'
                                : 'text-stone-600 hover:text-[#0F172A]'
                        }`}
                    >
                        <IoLogOutOutline size={15} />
                        <span>Out</span>
                    </button>
                    <button
                        onClick={() => setMode('verify')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mode === 'verify'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                                : 'text-stone-600 hover:text-[#0F172A]'
                        }`}
                    >
                        <IoPersonOutline size={15} />
                        <span>Verify</span>
                    </button>
                </div>

                {/* Viewfinder Camera Feed Container */}
                <div className="relative overflow-hidden rounded-2xl bg-stone-950 w-full aspect-square max-h-[250px] mx-auto mb-4 border-2 border-[#EDE8E0] shadow-inner flex items-center justify-center">
                    {/* HTML5-QRCode Target Canvas */}
                    <div
                        id="qr-camera-viewport"
                        className="w-full h-full flex items-center justify-center object-cover [&_video]:object-cover [&_video]:!w-full [&_video]:!h-full [&_video]:rounded-2xl"
                    />

                    {/* Camera Control HUD inside Viewfinder */}
                    {!cameraError && (
                        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-auto">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white/90 backdrop-blur-md border border-white/20 truncate max-w-[170px]">
                                {cameraList[activeCameraIndex]?.label || 'Active Camera'}
                            </span>

                            <div className="flex items-center gap-1.5">
                                {cameraList.length > 1 && (
                                    <button
                                        onClick={handleSwitchCamera}
                                        className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 transition-colors"
                                        title="Switch / Flip Camera"
                                    >
                                        <IoCameraReverseOutline size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md border border-white/20 transition-colors"
                                    title="Scan QR from photo"
                                >
                                    <IoImageOutline size={14} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}

                    {/* Laser Scanning Line Animation */}
                    {!scanResult && !cameraError && !isCameraLoading && (
                        <motion.div
                            className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_rgba(245,158,11,0.9)] z-10"
                            animate={{ top: ['8%', '92%', '8%'] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    )}

                    {/* 4 High-Tech Target Reticle Corners */}
                    {!cameraError && (
                        <div className="absolute inset-4 pointer-events-none z-10">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br-lg" />
                        </div>
                    )}

                    {/* Camera Loading State */}
                    {isCameraLoading && !cameraError && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4 text-center">
                            <div className="w-8 h-8 rounded-full border-3 border-orange-500 border-t-transparent animate-spin mb-3" />
                            <p className="text-white text-xs font-bold">Connecting to camera feed...</p>
                            <p className="text-stone-400 text-[10px] mt-1">Initializing video capture stream</p>
                        </div>
                    )}

                    {/* Camera Error Fallback View */}
                    {cameraError && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-900/95 p-4 text-center">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2.5">
                                <IoCameraOutline size={24} />
                            </div>
                            <p className="text-white text-xs font-bold mb-1">Camera Feed Inactive</p>
                            <p className="text-stone-400 text-[10px] leading-relaxed max-w-[220px] mb-3">
                                {cameraError}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => initAndStartScanner(activeCameraIndex)}
                                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <IoRefreshOutline size={14} />
                                    <span>Retry</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1 border border-stone-700 transition-all cursor-pointer"
                                >
                                    <IoImageOutline size={14} />
                                    <span>Upload QR</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Verification Result Overlay */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center backdrop-blur-md ${
                                    scanResult.type === 'success'
                                        ? 'bg-emerald-950/85 border-2 border-emerald-500'
                                        : 'bg-rose-950/85 border-2 border-rose-500'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-lg ${
                                    scanResult.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {scanResult.type === 'success' ? (
                                        <IoCheckmarkCircleOutline size={30} />
                                    ) : (
                                        <IoAlertCircleOutline size={30} />
                                    )}
                                </div>
                                <h3 className="text-base font-black text-white">
                                    {scanResult.type === 'success' ? 'Attendance Recorded!' : 'Scan Denied'}
                                </h3>
                                <p className="text-xs text-stone-200 mt-1 max-w-[240px] font-medium leading-snug">
                                    {scanResult.message}
                                </p>
                                {scanResult.studentName && (
                                    <div className="mt-2.5 px-3 py-1 bg-white/15 rounded-xl border border-white/20 text-white text-xs font-black tracking-wide">
                                        {scanResult.studentName}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Manual Student ID / Roll Number Entry */}
                <div className="flex gap-2 relative z-10 w-full">
                    <input
                        type="text"
                        placeholder="Type ID, Roll No, or Phone..."
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        className="flex-1 px-3.5 py-2.5 bg-[#FAF6F0] border border-[#E2DBD2] rounded-xl text-xs text-[#0F172A] placeholder-stone-400 focus:border-orange-500 focus:bg-white outline-none transition-all font-semibold"
                    />
                    <button
                        onClick={handleManualSubmit}
                        disabled={!manualId.trim() || isProcessing}
                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
                    >
                        Submit
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default QRScannerModal;
