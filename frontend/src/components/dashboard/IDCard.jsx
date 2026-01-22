import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FaDownload, FaPrint, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import StudentIdCard from '../admin/StudentIdCard';

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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl relative flex flex-col items-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                    <FaTimes size={24} />
                </button>

                {/* ID Card Container */}
                <div className="flex justify-center mb-6 mt-4">
                    {/* Wrap in div for ref capture */}
                    <div ref={cardRef}>
                        <StudentIdCard student={student} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full">
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
