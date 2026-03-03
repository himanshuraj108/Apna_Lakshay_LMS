import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoBedOutline, IoTimeOutline, IoLocationOutline } from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const SeatDetailsModal = ({ isOpen, onClose, seat }) => {
    const { shifts, getShiftName } = useShifts();
    if (!isOpen || !seat) return null;

    const getShiftDisplay = (shiftVal) => {
        if (!shiftVal) return 'N/A';
        if (shiftVal === 'Full Day' || shiftVal === 'full') return 'Full Day';
        if (shiftVal === 'day') return 'Day';
        if (shiftVal === 'night') return 'Night';
        return getShiftName(shiftVal);
    };

    // ---------- Overlap helper ----------
    const doTimeRangesOverlap = (s1, e1, s2, e2) => {
        if (!s1 || !e1 || !s2 || !e2) return false;
        const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
    };

    // ---------- Status calculation ----------
    const getShiftStatus = (shift) => {
        const isDirectlyBooked =
            (seat.activeShifts?.some(s => s === shift.id || s === shift.legacyName)) ||
            (seat.assignments?.some(a => a.shift && a.shift._id === shift.id));
        const isFullDayShift =
            shift.id === 'full' || shift.legacyName === 'full_day' ||
            (shift.name?.toLowerCase().includes('full'));
        const isDirectFullDayBooked = seat.isFullyBlocked && isFullDayShift;
        const isOverlapOccupied = seat.assignments?.some(a => {
            if (a.status !== 'active' || !a.shift) return false;
            return doTimeRangesOverlap(shift.startTime, shift.endTime, a.shift.startTime, a.shift.endTime);
        });
        const isPartiallyBooked = seat.assignments && seat.assignments.length > 0;

        if (isDirectlyBooked || isDirectFullDayBooked)
            return { label: 'Occupied', color: 'bg-red-500/15 text-red-400 border-red-500/25' };
        if (isOverlapOccupied || (seat.isFullyBlocked && !isFullDayShift))
            return { label: 'Not Available', color: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
        if (isFullDayShift && isPartiallyBooked)
            return { label: 'Not Available', color: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };
        return { label: 'Available', color: 'bg-green-500/15 text-green-400 border-green-500/25' };
    };

    const isFullyOccupied = shifts.every(s => getShiftStatus(s).label !== 'Available');
    const hasAnyOccupied = seat.assignments && seat.assignments.length > 0;
    const overallStatus = isFullyOccupied
        ? { label: 'Fully Occupied', dot: 'bg-red-400', pill: 'bg-red-500/10 border-red-500/20 text-red-300' }
        : hasAnyOccupied
            ? { label: 'Partially Occupied', dot: 'bg-amber-400', pill: 'bg-amber-500/10 border-amber-500/20 text-amber-300' }
            : { label: 'Available', dot: 'bg-green-400', pill: 'bg-green-500/10 border-green-500/20 text-green-300' };

    return (
        <AnimatePresence>
            <motion.div
                key="seat-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    key="seat-modal-panel"
                    initial={{ scale: 0.93, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.93, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
                    style={{ background: 'linear-gradient(160deg, rgba(13,13,22,0.99) 0%, rgba(18,18,30,0.99) 100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 rounded-t-2xl" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-orange-500/10 blur-2xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                                <IoBedOutline size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Seat {seat.number}</h2>
                                <p className="text-xs text-gray-500 capitalize">{seat.position?.wall || 'Library'} wall</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-white/6 mb-5" />

                    <div className="px-6 pb-6 space-y-4">
                        {/* Overall status pill */}
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border w-fit mx-auto ${overallStatus.pill}`}>
                            <span className={`w-2 h-2 rounded-full ${overallStatus.dot} animate-pulse`} />
                            <span className="text-sm font-semibold">{overallStatus.label}</span>
                        </div>

                        {/* Shift availability */}
                        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <IoTimeOutline size={16} className="text-orange-400" />
                                <h3 className="text-sm font-semibold text-gray-300">Shift Availability & Pricing</h3>
                            </div>
                            <div className="space-y-2">
                                {shifts.map(shift => {
                                    const st = getShiftStatus(shift);
                                    const price = seat.basePrices?.[shift.id] || seat.shiftPrices?.[shift.id] || 800;
                                    return (
                                        <div key={shift.id} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2.5 border border-white/5">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{shift.name}</p>
                                                <p className="text-[11px] text-gray-500">{shift.startTime} – {shift.endTime}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${st.color} mb-1`}>
                                                    {st.label}
                                                </span>
                                                <p className="text-sm font-bold text-gray-300">₹{price}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Position */}
                        {seat.position && (
                            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                                <IoLocationOutline size={16} className="text-gray-500 shrink-0" />
                                <p className="text-sm text-gray-400">
                                    <span className="text-white font-medium capitalize">{seat.position.wall}</span> wall
                                    {seat.position.index !== undefined && ` · Position ${seat.position.index + 1}`}
                                </p>
                            </div>
                        )}

                        {/* Close CTA */}
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 mt-2"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SeatDetailsModal;
