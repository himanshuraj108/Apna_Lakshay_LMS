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

        // Initial fetch
        fetchQrToken();

        // No auto-refresh (Manual only based on user request)
    }, []);

    const handleDownload = async () => {
        const canvas = document.getElementById('kiosk-qr');
        if (!canvas) return;

        const { jsPDF } = await import('jspdf');

        const qrDataUrl = canvas.toDataURL('image/png');

        // A5 portrait (148 x 210 mm)
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const W = 148;
        const H = 210;

        // ── Background ──────────────────────────────────────────────
        pdf.setFillColor(10, 12, 28);
        pdf.rect(0, 0, W, H, 'F');

        // ── Top accent bar ───────────────────────────────────────────
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, W, 2, 'F');

        // ── Decorative glow circles ──────────────────────────────────
        pdf.setFillColor(59, 130, 246);
        pdf.setGState(pdf.GState({ opacity: 0.07 }));
        pdf.circle(-20, -20, 60, 'F');
        pdf.setFillColor(168, 85, 247);
        pdf.circle(W + 20, H + 20, 60, 'F');
        pdf.setGState(pdf.GState({ opacity: 1 }));

        // ── Title ────────────────────────────────────────────────────
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Apna Lakshay Library', W / 2, 22, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Smart Attendance System', W / 2, 29, { align: 'center' });

        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.2);
        pdf.setGState(pdf.GState({ opacity: 0.15 }));
        pdf.line(20, 33, W - 20, 33);
        pdf.setGState(pdf.GState({ opacity: 1 }));

        // ── "Mark Attendance here" headline ─────────────────────────
        const headY = 38;
        pdf.setFontSize(15);

        const word1 = 'Mark ';
        const word2 = 'Attendance';
        const word3 = ' here';

        pdf.setFont('helvetica', 'normal');
        const w1 = pdf.getTextWidth(word1);
        pdf.setFont('helvetica', 'bold');
        const w2 = pdf.getTextWidth(word2);
        pdf.setFont('helvetica', 'normal');
        const w3 = pdf.getTextWidth(word3);

        const totalW = w1 + w2 + w3;
        const startX = (W - totalW) / 2;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);
        pdf.text(word1, startX, headY);

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(96, 165, 250);
        pdf.text(word2, startX + w1, headY);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);
        pdf.text(word3, startX + w1 + w2, headY);

        // ── Divider ──────────────────────────────────────────────────
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.15);
        pdf.setGState(pdf.GState({ opacity: 0.10 }));
        pdf.line(30, headY + 5, W - 30, headY + 5);
        pdf.setGState(pdf.GState({ opacity: 1 }));

        // ── 4 numbered steps ─────────────────────────────────────────
        const steps = [
            { num: '1', title: 'Open Website', url: 'apnalakshay.com', desc: '' },
            { num: '2', title: 'Scan QR Code', url: '', desc: 'Tap the scanner icon in the attendance section.' },
            { num: '3', title: 'Tap Scanner', url: '', desc: 'Allow camera access and point it at the QR.' },
            { num: '4', title: 'Scan & Done!', url: '', desc: 'Your attendance is marked automatically.' },
        ];

        let stepY = headY + 15;
        const circleX = 22;
        const textColX = 35;

        steps.forEach((step) => {
            // Filled circle badge
            pdf.setFillColor(59, 130, 246);
            pdf.setGState(pdf.GState({ opacity: 0.85 }));
            pdf.circle(circleX, stepY - 1.5, 5, 'F');
            pdf.setGState(pdf.GState({ opacity: 1 }));

            // Number inside circle
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(255, 255, 255);
            pdf.text(step.num, circleX, stepY - 0.2, { align: 'center' });

            // Step title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text(step.title, textColX, stepY - 1.5);

            if (step.url) {
                // Big violet URL on its own line below the title
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(18);
                pdf.setTextColor(167, 139, 250);
                pdf.text(step.url, textColX, stepY + 8);
                stepY += 20;   // tighter advance for URL step
            } else {
                // Regular description
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(148, 163, 184);
                pdf.text(step.desc, textColX, stepY + 3.5);
                stepY += 14;   // tighter advance for regular steps
            }
        });

        // ── QR Code card (bottom section) ────────────────────────────
        const footerH = 6;
        const qrSize = 52;          // smaller so it fits: stepY~130 + 10gap + 52 + 4pad + 6footer = ~202, OK
        const qrX = (W - qrSize) / 2;
        const qrY = stepY + 10;     // tight but visible gap

        // Clamp: if QR would overflow, warn (shouldn't happen with size=60)
        // White glow shadow
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(pdf.GState({ opacity: 0.06 }));
        pdf.roundedRect(qrX - 7, qrY - 7, qrSize + 14, qrSize + 14, 6, 6, 'F');
        pdf.setGState(pdf.GState({ opacity: 1 }));

        // White card
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, 'F');

        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // ── Bottom accent bars only (no text footer) ─────────────────
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, H - 4, W, 2, 'F');
        pdf.setFillColor(168, 85, 247);
        pdf.rect(0, H - 2, W, 2, 'F');

        pdf.save(`kiosk_qr_${new Date().getTime()}.pdf`);
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
                                PDF
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
                            Manual Refresh Only • Last updated: {lastUpdated.toLocaleTimeString()}
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
