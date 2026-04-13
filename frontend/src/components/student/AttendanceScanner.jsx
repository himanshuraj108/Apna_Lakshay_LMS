import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '../ui/Button';

// --- Scan Feedback: beep + vibrate ---
const playBeep = (type = 'success') => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        if (type === 'success') {
            oscillator.frequency.setValueAtTime(1046, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1318, ctx.currentTime + 0.08);
            gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } else {
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.45);
        }
    } catch (e) { /* AudioContext not supported */ }
};

const vibrateFeedback = (type = 'success') => {
    if (!navigator.vibrate) return;
    if (type === 'success') {
        navigator.vibrate([80, 40, 80]);
    } else {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }
};

// Status Card Component
const VerificationCard = ({ status, student, timestamp, message }) => {
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isPending = status === 'pending';

    // Fire beep + vibration when card appears
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            playBeep(status);
            vibrateFeedback(status);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStatusColor = () => {
        if (isSuccess) return 'bg-emerald-500';
        if (isError) return 'bg-rose-500';
        return 'bg-amber-500';
    };

    const getStatusIcon = () => {
        if (isSuccess) return (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
        );
        if (isError) return (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
        return (
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                {/* Header Status Bar */}
                <div className={`${getStatusColor()} p-6 flex flex-col items-center justify-center text-center`}>
                    <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-md shadow-inner">
                        {getStatusIcon()}
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">
                        {isSuccess ? 'ACCESS GRANTED' : isError ? 'ACCESS DENIED' : 'ATTENTION'}
                    </h2>
                    <p className="text-white/90 font-medium mt-1 text-sm uppercase tracking-wider">{message}</p>
                </div>

                {/* Content Body */}
                <div className="p-6">
                    {student ? (
                        <div className="flex flex-col items-center">
                            {/* Photo */}
                            <div className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-md mb-4 overflow-hidden relative bg-gray-200">
                                {student.profileImage ? (
                                    <img
                                        src={student.profileImage}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Name & ID */}
                            <h3 className="text-xl font-bold text-gray-800 text-center mb-1">{student.name}</h3>
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-mono font-semibold text-gray-500 mb-6">
                                ID: {student._id ? student._id.slice(-6).toUpperCase() : '------'}
                            </div>

                            {/* Details Grid */}
                            <div className="w-full grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Seat No</p>
                                    <p className="text-lg font-bold text-gray-700">{student.seatNumber || 'N/A'}</p>
                                </div>
                                <div className="text-center border-l border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-semibold">Shift</p>
                                    <p className="text-lg font-bold text-gray-700">{student.shift || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Timestamp Footer */}
                            <div className="w-full mt-6 pt-4 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Recorded Time</p>
                                <p className="text-2xl font-bold text-gray-800 font-mono tracking-tight">
                                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-500 italic">No student data available.</p>
                        </div>
                    )}
                </div>

                {/* Timer Bar */}
                <div className="h-1 bg-gray-100 w-full overflow-hidden">
                    <div className="h-full bg-gray-400 animate-[width_3s_linear_forwards]" style={{ width: '0%' }}></div>
                </div>
            </div>
        </div>
    );
};

const AttendanceScanner = ({ onScanSuccess, onClose, verificationState }) => {
    const [hasPermission, setHasPermission] = useState(null);
    const [startError, setStartError] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef(null);

    // If verificationState is provided, pause scanning
    useEffect(() => {
        if (verificationState) {
            pauseScanner();
        } else {
            resumeScanner();
        }
    }, [verificationState]);

    const pauseScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause();
            setIsScanning(false);
        }
    };

    const resumeScanner = () => {
        if (scannerRef.current && !scannerRef.current.isScanning) { // Actually html5-qrcode resume might not work as expected, usually better to ignore output
            try {
                scannerRef.current.resume();
            } catch (e) { /* ignore if already scanning */ }
            setIsScanning(true);
        }
    };

    useEffect(() => {
        // ... (Permission logic remains same)
        const checkPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                stream.getTracks().forEach(track => track.stop());
                setHasPermission(true);
            } catch (err) {
                console.error("Camera permission denied:", err);
                setHasPermission(false);
            }
        };
        checkPermission();
    }, []);

    useEffect(() => {
        if (!hasPermission) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                if (isScanning) {
                    // Immediate beep on QR detection (before API)
                    playBeep('success');
                    navigator.vibrate && navigator.vibrate(60);
                    onScanSuccess(decodedText);
                }
            },
            () => { } // Ignore errors
        ).catch(err => {
            console.error("Failed to start scanner:", err);
            setStartError(err.message);
        });

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => scannerRef.current.clear())
                    .catch(err => console.error("Cleanup error", err));
            }
        };
    }, [hasPermission]); // Removed onScanSuccess dependency to avoid re-init loops

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            {/* Render Verification Card Overlay if state exists */}
            {verificationState && (
                <VerificationCard
                    status={verificationState.status}
                    student={verificationState.student}
                    message={verificationState.message}
                />
            )}

            <div className={`bg-white rounded-xl overflow-hidden w-full max-w-md relative ${verificationState ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* ... (Existing scanner UI) */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-50 bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-white/30 backdrop-blur-md"
                >
                    ✕
                </button>
                <div className="absolute top-0 left-0 right-0 p-4 text-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                    <h3 className="text-lg font-bold text-white tracking-wide">Scan Digital ID</h3>
                    <p className="text-xs text-white/70">Align QR code within the frame</p>
                </div>

                <div className="relative min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
                    {hasPermission === null && <p className="text-white animate-pulse">Initializing camera...</p>}

                    {hasPermission === false && (
                        <div className="text-center p-6 text-white">
                            <p className="mb-4 text-red-400">Camera access denied</p>
                            <Button variant="primary" onClick={() => window.location.reload()}>Retry Permission</Button>
                        </div>
                    )}

                    {startError && (
                        <div className="text-center p-6 text-white">
                            <p className="text-red-400 text-sm">{startError}</p>
                        </div>
                    )}

                    <div id="reader" className="w-full h-full object-cover"></div>

                    {/* Enhanced Guide Overlay */}
                    {hasPermission && !startError && (
                        <div className="absolute inset-0 border-[60px] border-black/60 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/30 rounded-lg relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
                                {/* Scanning Laser Effect */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/80 shadow-[0_0_10px_#10B981] animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceScanner;
