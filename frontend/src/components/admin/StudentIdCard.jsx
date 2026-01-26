import { motion } from 'framer-motion';
import { IoPersonCircleOutline } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import useShifts from '../../hooks/useShifts';
import { BASE_URL } from '../../utils/api';

const StudentIdCard = ({ student }) => {
    const { getShiftName } = useShifts();

    // Generate a pseudo-ID if not existent (using last 6 chars of MongoID)
    const id = student._id || student.id || '';
    const studentId = id ? id.slice(-6).toUpperCase() : '------';
    const verificationUrl = `${window.location.origin}/admin/verify/${id}`;

    // Check if student is self-registered without seat
    // Treat undefined/null registrationSource as 'admin' (existing students)
    // Check if student has no seat assigned
    // Treat undefined/null registrationSource as 'admin' (existing students)
    // Treat undefined/null registrationSource as 'admin' (existing students)
    const registrationSource = student.registrationSource || 'admin';

    // Strict Active Check: Must have a verified Seat AND a Shift assigned.
    // getStudents populates 'shift' field if a valid active assignment exists.
    const isPending = !student.seat?.number && !student.seatNumber || !student.shift;



    // Helper to get formatted shift name
    const getFormattedShift = () => {
        let shiftName = 'N/A';

        // 1. If we have the shift name directly
        if (student.shift && typeof student.shift === 'string') {
            shiftName = student.shift;
        } else {
            // 2. Try lookup
            const shiftVal = student.shift || student.seat?.shift;
            if (shiftVal) shiftName = getShiftName(shiftVal);
        }

        // 3. Append details if available (from backend population)
        if (student.shiftDetails?.startTime && student.shiftDetails?.endTime) {
            return `${shiftName} (${student.shiftDetails.startTime} - ${student.shiftDetails.endTime})`;
        }

        return shiftName;
    };

    // Theme Logic
    const getTheme = () => {
        if (!student.isActive) return {
            gradient: 'from-red-600 to-rose-700',
            footer: 'from-red-400 to-rose-500',
            tag: 'bg-red-100 text-red-700'
        };
        if (isPending) return {
            gradient: 'from-yellow-500 to-amber-600',
            footer: 'from-yellow-400 to-amber-500',
            tag: 'bg-yellow-100 text-yellow-700'
        };
        return {
            gradient: 'from-green-600 to-emerald-700',
            footer: 'from-green-400 to-emerald-500',
            tag: 'bg-green-100 text-green-700'
        };
    };

    const theme = getTheme();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200 relative group hover:shadow-2xl transition-all duration-300"
        >
            {/* Header / Brand */}
            <div className={`bg-gradient-to-r ${theme.gradient} pt-6 pb-20 text-center relative overflow-hidden transition-colors duration-300`}>
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-grid-lg"></div>
                <h3 className="text-white font-bold text-xl relative z-10 tracking-widest uppercase">Apna Lakshay</h3>
                <p className="text-blue-100 text-xs tracking-wider uppercase relative z-10 mt-1">Library Management System</p>
            </div>

            <div className="px-6 pb-6 mt-[-10px]">
                <div className="flex flex-col items-center">
                    {/* Photo Area */}
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg -mt-16 bg-gray-100 flex items-center justify-center overflow-hidden z-10 relative">
                        {student.profileImage ? (
                            <img
                                src={student.profileImage.startsWith('http') ? student.profileImage : `${BASE_URL}${student.profileImage}`}
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
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 uppercase tracking-wide ${theme.tag}`}>
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
                            <p className={`font-bold text-lg ${student.seat?.number || student.seatNumber ? 'text-purple-600' : 'text-gray-400'}`}>
                                {student.seat?.number || student.seatNumber || 'N/A'}
                            </p>
                        </div>
                        <div className="text-left">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Joined Date</p>
                            <p className="font-medium text-gray-700 text-xs">
                                {student.seatAssignedAt || student.seat?.assignedAt || student.createdAt
                                    ? new Date(student.seatAssignedAt || student.seat?.assignedAt || student.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit', month: 'short', year: '2-digit'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Shift</p>
                            <p className={`font-medium text-xs font-bold ${student.seat?.number || student.seatNumber ? 'text-purple-600' : 'text-gray-400'}`}>
                                {getFormattedShift()}
                            </p>
                        </div>

                        {/* Address Row */}
                        {student.address && (
                            <div className="col-span-2 text-left mt-2 pt-2 border-t border-gray-100">
                                <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Address</p>
                                <p className="font-medium text-gray-700 text-xs leading-tight line-clamp-2" title={student.address}>
                                    {student.address}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer / Barcode Area */}
                    <div className="w-full mt-6 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center group-hover:border-blue-100 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase">
                                {!student.isActive ? 'Status' : (isPending ? 'Status' : 'Valid Until')}
                            </span>
                            <span className={`text-xs font-bold ${!student.isActive ? 'text-red-600' : (isPending ? 'text-yellow-600' : 'text-green-600')}`}>
                                {!student.isActive ? 'Inactive' : (isPending ? 'Pending Allocation' : 'Active Membership')}
                            </span>
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
            <div className={`h-2 w-full bg-gradient-to-r ${theme.footer}`}></div>
        </motion.div>
    );
};

export default StudentIdCard;
