import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaCamera, FaSignInAlt, FaSignOutAlt, FaUserCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Badge from '../../components/ui/Badge';

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
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-white/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-30"
                >
                    <FaTimes size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-6">QR Scanner</h2>

                {/* Mode Toggles */}
                <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setMode('check-in')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${mode === 'check-in' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <FaSignInAlt /> In
                    </button>
                    <button
                        onClick={() => setMode('check-out')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${mode === 'check-out' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <FaSignOutAlt /> Out
                    </button>
                    <button
                        onClick={() => setMode('verify')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${mode === 'verify' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <FaUserCheck /> Verify
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative overflow-hidden rounded-xl bg-black aspect-square mb-6 border border-white/20">
                    {!cameraError ? (
                        <div id="reader" className="w-full h-full object-cover"></div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                            <div className="text-center">
                                <FaCamera className="mx-auto text-red-500 mb-2" size={32} />
                                <p className="text-red-400">{cameraError}</p>
                                <p className="text-gray-500 text-sm mt-2">Please allow camera access in your browser settings.</p>
                            </div>
                        </div>
                    )}

                    {/* Result Overlay */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md ${scanResult.type === 'success' && modeRef.current === 'check-in'
                                    ? 'bg-green-500/80 text-white'
                                    : 'bg-red-500/80 text-white'
                                    }`}
                            >
                                <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
                                    {scanResult.type === 'success' ? (
                                        <FaSignInAlt size={32} className="text-green-500" />
                                    ) : (
                                        <FaTimes size={32} className="text-red-500" />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">
                                    {scanResult.type === 'success' ? 'Success!' : 'Error'}
                                </h3>
                                <p className="font-medium text-lg mb-2 shadow-black drop-shadow-md">{scanResult.message}</p>
                                {scanResult.studentName && (
                                    <Badge variant="success" className="mt-2 bg-white text-green-700">{scanResult.studentName}</Badge>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scanning Line Animation */}
                    {!scanResult && !cameraError && (
                        <motion.div
                            className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] z-10"
                            animate={{ top: ['10%', '90%', '10%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Manual Student ID..."
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={handleManualSubmit}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                    >
                        Go
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default QRScannerModal;
