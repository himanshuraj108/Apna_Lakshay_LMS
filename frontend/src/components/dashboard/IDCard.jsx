import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaDownload, FaPrint, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const IDCard = ({ student, onClose }) => {
    const cardRef = useRef(null);

    const downloadPNG = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { scale: 4, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `${student.name.replace(/\s+/g, '_')}_ID_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const printPDF = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { scale: 4 });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 10, width, height);
        pdf.save(`${student.name}_ID_Card.pdf`);
    };

    const verificationUrl = `${window.location.origin}/verify/${student._id || student.id}`;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                    <FaTimes size={24} />
                </button>

                {/* ID Card Container */}
                <div className="flex justify-center mb-6">
                    <div
                        ref={cardRef}
                        className="w-[320px] h-[500px] relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1a1c2e] to-[#2d3748] text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Background Patterns */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                        </div>

                        {/* Header */}
                        <div className="relative z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-center">
                            <h2 className="text-xl font-bold tracking-wider uppercase">Hamara Lakshay</h2>
                            <p className="text-xs opacity-90 uppercase tracking-widest mt-1">Library Student ID</p>
                        </div>

                        {/* Profile Image */}
                        <div className="relative z-10 flex flex-col items-center mt-6">
                            <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-lg bg-gray-700">
                                {student.photo ? (
                                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h3 className="mt-3 text-xl font-bold">{student.name}</h3>
                            <p className="text-sm text-blue-300">{student.email}</p>
                            <span className="mt-2 px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30 flex items-center gap-1">
                                <FaCheckCircle size={10} /> Active Student
                            </span>
                        </div>

                        {/* Details */}
                        <div className="relative z-10 px-6 mt-6 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Student ID</span>
                                <span className="font-mono text-sm">{(student._id || student.id || 'Unknown').slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Seat Number</span>
                                <span className="font-bold text-yellow-400">{student.seatNumber || 'Not Assigned'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Joined Date</span>
                                <span className="text-sm">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="absolute bottom-0 w-full bg-white p-4 flex items-center justify-between">
                            <div className="text-black">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Scan to Verify</p>
                                <p className="text-[8px] text-gray-400 mt-1">Property of Hamara Lakshay</p>
                            </div>
                            <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                <QRCodeCanvas
                                    value={verificationUrl}
                                    size={80}
                                    level={"H"}
                                    includeMargin={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={downloadPNG}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        <FaDownload /> Download PNG
                    </button>
                    <button
                        onClick={printPDF}
                        className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-semibold backdrop-blur-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                    >
                        <FaPrint /> Print PDF
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default IDCard;
