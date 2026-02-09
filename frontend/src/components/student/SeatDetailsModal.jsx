import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { IoBedOutline, IoPersonOutline, IoTimeOutline, IoCashOutline } from 'react-icons/io5';
import Badge from '../ui/Badge';
import useShifts from '../../hooks/useShifts';

const SeatDetailsModal = ({ isOpen, onClose, seat }) => {
    const { shifts, isCustom, getShiftName } = useShifts();
    if (!isOpen || !seat) return null;

    // Helper to get display name
    const getShiftDisplay = (shiftVal) => {
        if (!shiftVal) return 'N/A';
        if (shiftVal === 'Full Day' || shiftVal === 'full') return 'Full Day';
        if (shiftVal === 'day') return 'Day';
        if (shiftVal === 'night') return 'Night';
        return getShiftName(shiftVal);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <IoBedOutline size={28} />
                            Seat {seat.number}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6 flex justify-center">
                        {(() => {
                            // Calculate if seat is fully occupied (all shifts unavailable)
                            const isFullyOccupied = shifts.every(shift => {
                                const isFullDay = shift.id === 'full' ||
                                    shift.legacyName === 'full_day' ||
                                    (shift.name && shift.name.toLowerCase().includes('full'));

                                const isPartiallyBooked = seat.activeShifts && seat.activeShifts.length > 0;
                                const isOccupied = seat.isFullyBlocked || (seat.activeShifts && seat.activeShifts.some(s => s === shift.id || s === shift.legacyName));

                                // Shift is unavailable if it's occupied OR (it's full day and partial shifts exist)
                                return isOccupied || (isFullDay && isPartiallyBooked);
                            });

                            const hasAnyOccupied = seat.activeShifts && seat.activeShifts.length > 0;

                            const variant = isFullyOccupied ? 'red' : hasAnyOccupied ? 'red' : 'green';
                            const text = isFullyOccupied ? '🔴 Fully Occupied' : hasAnyOccupied ? '🔴 Partially Occupied' : '🟢 Available';

                            return (
                                <Badge variant={variant} className="text-lg px-6 py-2">
                                    {text}
                                </Badge>
                            );
                        })()}
                    </div>

                    {/* Seat Details */}
                    <div className="space-y-4">
                        {/* Shift Information */}
                        {seat.shift && (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <IoTimeOutline size={20} className="text-blue-400" />
                                    <h3 className="font-semibold text-gray-300">Shift</h3>
                                </div>
                                <p className="text-lg font-bold capitalize">{getShiftDisplay(seat.shift)}</p>
                            </div>
                        )}

                        {/* Shift Availability & Prices */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <IoTimeOutline size={20} className="text-blue-400" />
                                <h3 className="font-semibold text-gray-300">Shift Availability</h3>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {shifts.map(shift => {
                                    const isOccupied = seat.isFullyBlocked || (seat.activeShifts && seat.activeShifts.some(s => s === shift.id || s === shift.legacyName));

                                    // Special logic for Full Day: Not Available (Gray) if any partial shift is taken
                                    // Robust check: ID is 'full', or legacy name, OR name contains 'Full' (case insensitive)
                                    const isFullDay = shift.id === 'full' ||
                                        shift.legacyName === 'full_day' ||
                                        (shift.name && shift.name.toLowerCase().includes('full'));

                                    const isPartiallyBooked = seat.activeShifts && seat.activeShifts.length > 0;
                                    const isFullDayblocked = isFullDay && isPartiallyBooked;

                                    let statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                                    let statusText = 'Vacant';

                                    if (isOccupied) {
                                        statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                                        statusText = 'Occupied';
                                    } else if (isFullDayblocked) {
                                        statusColor = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                                        statusText = 'Not Available';
                                    }

                                    return (
                                        <div key={shift.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div>
                                                <p className="font-semibold text-white">{shift.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {shift.startTime} - {shift.endTime}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 justify-end mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-300">₹{seat.basePrices?.[shift.id] || seat.shiftPrices?.[shift.id] || 800}</p>
                                            </div>
                                        </div>
                                    );
                                })}


                            </div>
                        </div>

                        {/* Position Info */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h3 className="font-semibold text-gray-300 mb-2">Position</h3>
                            <p className="text-sm text-gray-400">
                                <span className="capitalize font-semibold text-white">{seat.position?.wall || 'Unknown'}</span> Wall
                                {seat.position?.index !== undefined && ` • Position ${seat.position.index + 1}`}
                            </p>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-semibold"
                    >
                        Close
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SeatDetailsModal;
