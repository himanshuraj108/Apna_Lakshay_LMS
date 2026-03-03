import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { IoRefresh, IoDownload, IoArrowBack, IoWifiOutline, IoTimeOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';

const PAGE_BG = { background: '#050508' };

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
                try {
                    response = await api.get('/admin/qr/token');
                    if (!response.data.token) {
                        response = await api.post('/admin/qr/generate');
                    }
                } catch (err) {
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
    }, []);

    const handleDownload = async () => {
        const canvas = document.getElementById('kiosk-qr');
        if (!canvas) return;
        const { jsPDF } = await import('jspdf');
        const qrDataUrl = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const W = 148, H = 210;

        pdf.setFillColor(10, 12, 28);
        pdf.rect(0, 0, W, H, 'F');
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, W, 2, 'F');

        pdf.setFillColor(59, 130, 246);
        pdf.setGState(pdf.GState({ opacity: 0.07 }));
        pdf.circle(-20, -20, 60, 'F');
        pdf.setFillColor(168, 85, 247);
        pdf.circle(W + 20, H + 20, 60, 'F');
        pdf.setGState(pdf.GState({ opacity: 1 }));

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

        const headY = 46;
        const word1 = 'Mark ', word2 = 'Attendance', word3 = ' here';

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(15);
        const w1 = pdf.getTextWidth(word1);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26); // Make Attendance big
        const w2 = pdf.getTextWidth(word2);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(15);
        const w3 = pdf.getTextWidth(word3);

        const totalW = w1 + w2 + w3;
        const startX = (W - totalW) / 2;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(15);
        pdf.setTextColor(255, 255, 255);
        // Add a slight y-offset for the smaller text to align the baseline with the big text
        pdf.text(word1, startX, headY);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor(96, 165, 250);
        pdf.text(word2, startX + w1, headY + 1.5); // align baseline

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(15);
        pdf.setTextColor(255, 255, 255);
        pdf.text(word3, startX + w1 + w2, headY);

        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.15);
        pdf.setGState(pdf.GState({ opacity: 0.10 }));
        pdf.line(30, headY + 7, W - 30, headY + 7);
        pdf.setGState(pdf.GState({ opacity: 1 }));

        const steps = [
            { num: '1', title: 'Open Website', url: 'apnalakshay.com', desc: '' },
            { num: '2', title: 'Click on Mark Attendance', url: '', desc: 'Find the scanner icon to open camera.' },
            { num: '3', title: 'Scan QR Code', url: '', desc: 'Allow camera access and point it at the QR.' },
            { num: '4', title: 'Scan & Done!', url: '', desc: 'Your attendance is marked automatically.' },
        ];
        let stepY = headY + 15;
        const circleX = 22, textColX = 35;
        steps.forEach((step) => {
            pdf.setFillColor(59, 130, 246);
            pdf.setGState(pdf.GState({ opacity: 0.85 }));
            pdf.circle(circleX, stepY - 1.5, 5, 'F');
            pdf.setGState(pdf.GState({ opacity: 1 }));
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(255, 255, 255);
            pdf.text(step.num, circleX, stepY - 0.2, { align: 'center' });
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.text(step.title, textColX, stepY - 1.5);
            if (step.url) {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(18);
                pdf.setTextColor(167, 139, 250);
                pdf.text(step.url, textColX, stepY + 8);
                stepY += 20;
            } else {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(148, 163, 184);
                pdf.text(step.desc, textColX, stepY + 3.5);
                stepY += 14;
            }
        });

        const qrSize = 52;
        const qrX = (W - qrSize) / 2;
        const qrY = stepY + 10;
        pdf.setFillColor(255, 255, 255);
        pdf.setGState(pdf.GState({ opacity: 0.06 }));
        pdf.roundedRect(qrX - 7, qrY - 7, qrSize + 14, qrSize + 14, 6, 6, 'F');
        pdf.setGState(pdf.GState({ opacity: 1 }));
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 4, 4, 'F');
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, H - 4, W, 2, 'F');
        pdf.setFillColor(168, 85, 247);
        pdf.rect(0, H - 2, W, 2, 'F');
        pdf.save(`kiosk_qr_${new Date().getTime()}.pdf`);
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden" style={PAGE_BG}>
            {/* Animated background orbs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-[600px] h-[600px] rounded-full bg-blue-600 blur-[130px] top-[-15%] left-[-10%]" />
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute w-[500px] h-[500px] rounded-full bg-purple-600 blur-[130px] bottom-[-15%] right-[-10%]" />
            </div>

            {/* Back button */}
            <div className="absolute top-6 left-6 z-20">
                <Link to="/admin">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium backdrop-blur-md transition-all">
                        <IoArrowBack size={16} /> Back
                    </motion.button>
                </Link>
            </div>

            {/* Kiosk ID footer */}
            <div className="absolute bottom-5 text-center z-10">
                <p className="text-gray-700 text-xs font-mono tracking-widest">
                    KIOSK ID: {import.meta.env.VITE_KIOSK_ID || 'SYS-01'}
                </p>
            </div>

            {/* Main card */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="relative z-10 w-full max-w-sm">

                {/* Glass card */}
                <div className="bg-white/3 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                    {/* Gradient header bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <div className="p-8 text-center">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
                                <IoWifiOutline size={13} className="text-blue-400" />
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Live Kiosk</span>
                            </div>
                            <h1 className="text-2xl font-black text-white mb-1.5">Attendance Kiosk</h1>
                            <p className="text-gray-500 text-sm">Scan QR code with your student app to mark attendance</p>
                        </div>

                        {/* QR Code */}
                        <div className="relative inline-block mb-6">
                            {/* Outer glow ring */}
                            <div className="absolute inset-[-8px] rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-lg" />
                            <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                                {loading ? (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                                        <IoRefresh className="animate-spin text-4xl text-gray-300" />
                                    </div>
                                ) : qrData ? (
                                    <QRCodeCanvas
                                        id="kiosk-qr"
                                        value={qrData}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                        imageSettings={{
                                            src: '/logo.png',
                                            height: 36,
                                            width: 36,
                                            excavate: true,
                                        }}
                                    />
                                ) : (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center text-red-400 text-sm">
                                        Failed to load QR
                                    </div>
                                )}
                            </div>
                            {/* Active indicator */}
                            <div className="absolute -top-1.5 -right-1.5">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500" />
                                </span>
                            </div>
                        </div>

                        {/* Last updated */}
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mb-5">
                            <IoTimeOutline size={13} />
                            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={handleDownload}
                                disabled={loading || !qrData}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all disabled:opacity-40">
                                <IoDownload size={16} /> Download PDF
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => fetchQrToken(true)}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40">
                                <IoRefresh size={16} className={loading ? 'animate-spin' : ''} /> Refresh QR
                            </motion.button>
                        </div>

                        <p className="text-xs text-gray-700 mt-4">Manual refresh only • QR stays valid until refreshed</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QrKiosk;
