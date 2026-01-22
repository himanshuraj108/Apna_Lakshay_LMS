import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { IoBedOutline, IoPersonOutline, IoTimeOutline, IoCashOutline } from 'react-icons/io5';
import Badge from '../ui/Badge';

const SeatDetailsModal = ({ isOpen, onClose, seat }) => {
    if (!isOpen || !seat) return null;

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
                    className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full"
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
                        <Badge variant={seat.isOccupied ? 'red' : 'green'} className="text-lg px-6 py-2">
                            {seat.isOccupied ? '🔴 Occupied' : '🟢 Available'}
                        </Badge>
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
                                <p className="text-lg font-bold capitalize">{seat.shift} Shift</p>
                            </div>
                        )}

                        {/* Base Prices */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <IoCashOutline size={20} className="text-green-400" />
                                <h3 className="font-semibold text-gray-300">Base Prices</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/10 rounded p-3 text-center">
                                    <p className="text-xs text-gray-400 mb-1">Morning Shift</p>
                                    <p className="text-lg font-bold text-green-400">₹{seat.basePrices?.day || 800}</p>
                                </div>
                                <div className="bg-white/10 rounded p-3 text-center">
                                    <p className="text-xs text-gray-400 mb-1">Evening Shift</p>
                                    <p className="text-lg font-bold text-blue-400">₹{seat.basePrices?.night || 800}</p>
                                </div>
                                <div className="bg-white/10 rounded p-3 text-center">
                                    <p className="text-xs text-gray-400 mb-1">Full Day</p>
                                    <p className="text-lg font-bold text-purple-400">₹{seat.basePrices?.full || 1200}</p>
                                </div>
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
