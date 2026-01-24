import { motion } from 'framer-motion';
import { IoPersonCircleOutline } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import useShifts from '../../hooks/useShifts';

const StudentIdCard = ({ student }) => {
    const { getShiftName } = useShifts();

    // Generate a pseudo-ID if not existent (using last 6 chars of MongoID)
    const id = student._id || student.id || '';
    const studentId = id ? id.slice(-6).toUpperCase() : '------';
    const verificationUrl = `${window.location.origin}/admin/verify/${id}`;

    // Helper to get formatted shift name
    const getFormattedShift = () => {
        // 1. Try direct shift property (might be populated name or ID)
        const shiftVal = student.shift || student.seat?.shift;

        if (!shiftVal) return 'N/A';

        // If it's already a full readable name (e.g. from getStudents API)
        if (shiftVal.length > 10 && shiftVal.includes(' ')) return shiftVal;

        // Otherwise try to lookup ID or return standardized name
        return getShiftName(shiftVal);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200 relative group hover:shadow-2xl transition-all duration-300"
        >
            {/* Header / Brand */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pt-6 pb-20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-grid-lg"></div>
                <h3 className="text-white font-bold text-xl relative z-10 tracking-widest uppercase">Hamara Lakshay</h3>
                <p className="text-blue-100 text-xs tracking-wider uppercase relative z-10 mt-1">Library Management System</p>
            </div>

            <div className="px-6 pb-6 mt-[-10px]">
                <div className="flex flex-col items-center">
                    {/* Photo Area */}
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg -mt-16 bg-gray-100 flex items-center justify-center overflow-hidden z-10 relative">
                        {student.profileImage ? (
                            <img
                                src={`http://localhost:5000${student.profileImage}`}
                                alt={student.name}
                                crossOrigin="anonymous"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <IoPersonCircleOutline className="w-full h-full text-gray-300" />
                        )}
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mt-3 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 leading-tight">{student.name}</h2>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mt-2 uppercase tracking-wide">
                            Student
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-gray-100 pt-4">
                        <div className="text-left">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">ID Number</p>
                            <p className="font-mono font-bold text-gray-700 text-sm">HL-{studentId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Assigned Seat</p>
                            <p className="font-bold text-purple-600 text-lg">{student.seat?.number || student.seatNumber || 'N/A'}</p>
                        </div>
                        <div className="text-left">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Joined Date</p>
                            <p className="font-medium text-gray-700 text-xs">
                                {new Date(student.createdAt).toLocaleDateString('en-GB', {
                                    day: '2-digit', month: 'short', year: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Shift</p>
                            <p className="font-medium text-purple-600 text-xs font-bold">
                                {getFormattedShift()}
                            </p>
                        </div>
                    </div>

                    {/* Footer / Barcode Area */}
                    <div className="w-full mt-6 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center group-hover:border-blue-100 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase">Valid Until</span>
                            <span className="text-xs font-bold text-green-600">Active Membership</span>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-gray-100">
                            <QRCodeCanvas
                                value={verificationUrl}
                                size={64}
                                level={"H"}
                                includeMargin={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative bottom strip */}
            <div className="h-2 w-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
        </motion.div>
    );
};

export default StudentIdCard;
