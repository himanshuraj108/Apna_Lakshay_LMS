import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FaTimes, FaCamera } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QRScannerModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [scanError, setScanError] = useState(null);
    const [manualId, setManualId] = useState('');

    const handleManualVerify = () => {
        if (manualId.trim()) {
            navigate(`/admin/verify/${manualId.trim()}`);
            onClose();
        }
    };

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            // Handle the scanned code as you like, for example:
            console.log(`Code matched = ${decodedText}`, decodedResult);

            // Expected URL format: http://domain/verify/USER_ID
            // We can extract the ID or just navigate to the path

            try {
                // Check if it's a URL from our app
                if (decodedText.includes('/verify/')) {
                    const url = new URL(decodedText);
                    const path = url.pathname; // /verify/12345
                    scanner.clear().then(() => {
                        navigate(path);
                        onClose();
                    });
                } else {
                    setScanError("Invalid QR Code: Not a student ID");
                }
            } catch (e) {
                // If not a URL, maybe it's just the ID?
                // Try navigating to verify/text
                scanner.clear().then(() => {
                    navigate(`/admin/verify/${decodedText}`);
                    onClose();
                });
            }
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [navigate, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <FaTimes size={24} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                        <FaCamera className="text-blue-600" />
                        Scan ID Card
                    </h2>
                    <p className="text-sm text-gray-500">Hold the QR code steady in front of the camera</p>
                </div>

                {scanError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center font-medium border border-red-100">
                        {scanError}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl bg-black">
                    <div id="reader" className="w-full"></div>
                </div>

                <div className="flex items-center gap-4 my-4 w-full">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-gray-400 text-sm font-medium">OR</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Enter Student ID"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                    />
                    <button
                        onClick={handleManualVerify}
                        disabled={!manualId.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Verify
                    </button>
                </div>

                <p className="text-xs text-center text-gray-400 mt-4">
                    Requires camera permissions. Ensure your browser allows camera access.
                </p>
            </div>
        </motion.div>
    );
};

export default QRScannerModal;
