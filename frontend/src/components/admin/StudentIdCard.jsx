import { motion } from 'framer-motion';
import { IoPersonCircleOutline, IoWarning } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import { IoCellular } from 'react-icons/io5';
import { FaWind, FaBan } from 'react-icons/fa';
import useShifts from '../../hooks/useShifts';
import { BASE_URL } from '../../utils/api';

// Seat chip colors for split-seat multi-assignments
const SEAT_COLORS = [
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
    { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500'   },
    { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300',   dot: 'bg-teal-500'   },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-500' },
];

const StudentIdCard = ({ student }) => {
    const { getShiftName } = useShifts();

    // Generate a pseudo-ID if not existent (using last 6 chars of MongoID)
    const id = student._id || student.id || '';
    const studentId = id ? id.slice(-6).toUpperCase() : '------';
    const verificationUrl = `${window.location.origin}/admin/verify/${id}`;

    const registrationSource = student.registrationSource || 'admin';

    // Strict Active Check: Must have a verified Seat AND a Shift assigned.
    const isPending = !student.seat?.number && !student.seatNumber || !student.shift;

    // Temp assignments (caution badges)
    const tempAssignments = student.tempAssignments || [];

    // Helper to get formatted shift name
    const getFormattedShift = () => {
        let shiftName = 'N/A';

        if (student.shift && typeof student.shift === 'string') {
            shiftName = student.shift;
        } else if (student.shift && student.shift.name) {
            shiftName = student.shift.name;
        } else {
            const shiftVal = student.shift?._id || student.shift || student.seat?.shift;
            if (shiftVal) shiftName = getShiftName(shiftVal);
        }

        if (student.shift?.startTime && student.shift?.endTime) {
            return `${shiftName} (${student.shift.startTime} - ${student.shift.endTime})`;
        } else if (student.shiftDetails?.startTime && student.shiftDetails?.endTime) {
            return `${shiftName} (${student.shiftDetails.startTime} - ${student.shiftDetails.endTime})`;
        }

        return typeof shiftName === 'string' ? shiftName : 'N/A';
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

    // Determine if student has split seats (multiple seat assignments from shifts array with different seats)
    const hasSplitSeats = student.shifts && student.shifts.length > 1;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[340px] bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200 relative group hover:shadow-2xl transition-all duration-300"
        >
            {/* Header / Brand */}
            <div className={`bg-gradient-to-r ${theme.gradient} pt-6 pb-20 text-center relative overflow-hidden transition-colors duration-300`}>
                <div className="absolute top-0 left-0 w-full h-full bg-gray-100 opacity-30 pattern-grid-lg"></div>
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
                            <IoPersonCircleOutline className="w-full h-full text-gray-700" />
                        )}
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mt-3 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 leading-tight">{student.name}</h2>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 uppercase tracking-wide ${theme.tag}`}>
                            Student
                        </span>

                        {/* AC / NON-AC Badge — only show if seat is assigned */}
                        {(student.seat?.number || student.seatNumber) && (
                            <div className="flex justify-center mt-2">
                                {(student.seat?.roomHasAc || student.seat?.room?.hasAc || student.room?.hasAc) ? (
                                    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        <FaWind size={10} className="text-blue-500" />
                                        AC Room
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        <FaBan size={10} className="text-gray-600" />
                                        Non-AC Room
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-t border-gray-100 pt-4">
                        <div className="text-left">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">ID Number</p>
                            <p className="font-mono font-bold text-gray-700 text-sm">AL-{studentId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Assigned Seat</p>
                            {(student.seat?.number || student.seatNumber) ? (
                                <p className="font-bold text-lg text-purple-600 truncate" title={(student.roomId || student.seat?.room?.roomId || student.seat?.roomId) ? `${student.roomId || student.seat?.room?.roomId || student.seat?.roomId} - ${student.seat?.number || student.seatNumber}` : (student.seat?.number || student.seatNumber)}>
                                    {(student.roomId || student.seat?.room?.roomId || student.seat?.roomId)
                                        ? `${student.roomId || student.seat?.room?.roomId || student.seat?.roomId} - ${student.seat?.number || student.seatNumber}`
                                        : (student.seat?.number || student.seatNumber)
                                    }
                                </p>
                            ) : (
                                <p className="font-bold text-lg text-gray-600">N/A</p>
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Joined Date</p>
                            <p className="font-medium text-gray-700 text-xs">
                                {student.createdAt
                                    ? new Date(student.createdAt).toLocaleDateString('en-GB', {
                                        day: '2-digit', month: 'short', year: '2-digit'
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Shift</p>
                            {/* Multi-shift / split-seat support */}
                            {student.shifts && student.shifts.length > 0 ? (
                                <div className="flex flex-col items-end gap-1.5">
                                    {student.shifts.map((s, i) => {
                                        const c = SEAT_COLORS[i % SEAT_COLORS.length];
                                        return (
                                            <div key={i} className={`flex flex-row items-center justify-center gap-1.5 px-2 py-1 rounded-md border whitespace-nowrap ${c.bg} ${c.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                                                <p className={`font-bold text-[10px] leading-none ${c.text}`}>{s.name}</p>
                                                {s.startTime && s.endTime && (
                                                    <p className="text-gray-600 text-[9px] leading-none font-medium">{s.startTime} – {s.endTime}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`px-2 py-1 rounded-md border whitespace-nowrap ${student.seat?.number || student.seatNumber ? 'bg-purple-100 border-purple-300' : 'bg-gray-100 border-gray-300'}`}>
                                    <p className={`font-bold text-[10px] leading-none ${student.seat?.number || student.seatNumber ? 'text-purple-700' : 'text-gray-600'}`}>
                                        {getFormattedShift()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Address Row */}

                    </div>

                    {/* ⚠️ Temp Seat Caution Badges */}
                    {tempAssignments.length > 0 && (
                        <div className="w-full mt-4 pt-3 border-t-2 border-dashed border-red-200">
                            <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold mb-2 flex items-center gap-1">
                                <IoWarning size={12} />
                                Temporary Seats
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {tempAssignments.map((ta, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                                        <IoWarning size={14} className="text-red-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-red-700 font-black text-[11px] truncate" title={`${ta.seat?.room?.roomId || ta.seat?.room?.name || 'Seat'} ${ta.seat?.number || '?'} — ${ta.shift?.name || '?'}`}>
                                                {ta.seat?.room?.roomId || ta.seat?.room?.name || 'Seat'} {ta.seat?.number || '?'} — {ta.shift?.name || '?'}
                                            </p>
                                            {ta.shift?.startTime && ta.shift?.endTime && (
                                                <p className="text-red-400 text-[9px]">{ta.shift.startTime} – {ta.shift.endTime}</p>
                                            )}
                                            {ta.originalOwner && (
                                                <p className="text-red-400 text-[9px]">Owner: {ta.originalOwner.name}</p>
                                            )}
                                            {ta.note && (
                                                <p className="text-red-500 text-[9px] italic mt-0.5 break-words whitespace-pre-wrap">{ta.note}</p>
                                            )}
                                        </div>
                                        <span className="text-[9px] bg-red-100 border border-red-300 text-red-600 font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">
                                            Temp
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Address Block */}
                    {student.address && (
                        <div className="w-full text-left mt-3 pt-3 border-t border-gray-100">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider mb-0.5">Address</p>
                            <p className="font-medium text-gray-700 text-xs leading-tight line-clamp-2" title={student.address}>
                                {student.address}
                            </p>
                        </div>
                    )}

                    {/* Footer / Barcode Area */}
                    <div className="w-full mt-6 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center group-hover:border-blue-100 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-600 uppercase">
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
