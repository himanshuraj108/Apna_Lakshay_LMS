import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { IoRefresh, IoScan, IoDownload, IoArrowBack } from 'react-icons/io5';
import { motion } from 'framer-motion';

const QrKiosk = () => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchQrToken = async (forceNew = false) => {
        try {
            setLoading(true);
            let response;

            if (forceNew) {
                response = await api.post('/admin/qr/generate');
            } else {
                // Try to get existing valid token first
                try {
                    response = await api.get('/admin/qr/token');
                    // If no token exists, response might be empty or 404 depending on backend
                    if (!response.data.token) {
                        response = await api.post('/admin/qr/generate');
                    }
                } catch (err) {
                    // Fallback to generate if get fails
                    response = await api.post('/admin/qr/generate');
                }
            }

            if (response.data.success && response.data.token) {
                setQrData(response.data.token);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch kiosk QR:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQrToken();

        // Auto-refresh every 5 minutes to be safe (or rely on admin to click refresh)
        const interval = setInterval(() => {
            fetchQrToken(true);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const handleDownload = () => {
        const canvas = document.getElementById('kiosk-qr');
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `kiosk_qr_${new Date().getTime()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Link to="/admin">
                    <Button variant="secondary" className="bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 text-white">
                        <IoArrowBack className="mr-2" /> Back
                    </Button>
                </Link>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] top-[-10%] left-[-10%] animate-pulse"></div>
                <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] bottom-[-10%] right-[-10%] animate-pulse delay-1000"></div>
            </div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md"
            >
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8 text-center shadow-2xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Attendance Kiosk
                        </h1>
                        <p className="text-gray-400">Scan this QR code with your student app to mark attendance</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-inner mx-auto w-fit mb-8 relative group">
                        {loading ? (
                            <div className="w-[200px] h-[200px] flex items-center justify-center">
                                <IoRefresh className="animate-spin text-4xl text-gray-300" />
                            </div>
                        ) : qrData ? (
                            <QRCodeCanvas
                                id="kiosk-qr"
                                value={qrData}
                                size={250}
                                level={"H"}
                                includeMargin={true}
                                imageSettings={{
                                    src: "/logo.png", // Ensure you have a logo or remove this
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        ) : (
                            <div className="w-[250px] h-[250px] flex items-center justify-center text-red-400">
                                Failed to load QR
                            </div>
                        )}

                        {/* Overlay to show it's active */}
                        <div className="absolute -top-2 -right-2">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="secondary"
                                onClick={handleDownload}
                                disabled={loading || !qrData}
                                className="w-full py-3 text-lg shadow-lg hover:shadow-gray-500/25"
                            >
                                <IoDownload className="mr-2" />
                                Download
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => fetchQrToken(true)}
                                disabled={loading}
                                className="w-full py-3 text-lg shadow-lg hover:shadow-blue-500/25"
                            >
                                <IoRefresh className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            Auto-refreshes every 5 mins • Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </Card>
            </motion.div>

            {/* Admin Footer */}
            <div className="absolute bottom-6 text-center z-10">
                <p className="text-gray-600 text-sm font-mono">
                    KIOSK MODE ID: {import.meta.env.VITE_KIOSK_ID || 'SYS-01'}
                </p>
            </div>
        </div>
    );
};

export default QrKiosk;
