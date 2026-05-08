import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Card from '../ui/Card';
import StudentRoomGrid from './StudentRoomGrid';
import { IoClose, IoAlertCircle, IoSwapHorizontalOutline, IoCheckmarkCircle, IoBedOutline } from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const SeatChangeModal = ({ isOpen, onClose, currentSeat, onSuccess }) => {
    const { shifts, isCustom } = useShifts();
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showSeatDetails, setShowSeatDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) fetchSeats();
    }, [isOpen]);

    const fetchSeats = async () => {
        try {
            const res = await api.get('/public/seats');
            setFloors(res.data.floors);
        } catch {
            setError('Failed to load seats');
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => { setSelectedSeat(seat); setShowSeatDetails(true); };

    const handleRequestSeat = async () => {
        if (!selectedSeat) return;
        if (selectedSeat.isOccupied) { setError('This seat is already occupied'); return; }
        if (currentSeat && selectedSeat._id === currentSeat._id) { setError('You cannot request your current seat'); return; }
        setSubmitting(true); setError('');
        try {
            await api.post('/student/request-seat-change', { requestedSeatId: selectedSeat._id });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                {/* Main modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
                    style={{ backgroundColor: '#ffffff' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-orange-500/10 blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-7 pt-7 pb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <IoSwapHorizontalOutline size={18} className="text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Request Seat Change</h2>
                                {currentSeat && (
                                    <p className="text-xs text-gray-500">
                                        Current: <span className="text-gray-700 font-medium">Seat {currentSeat.number}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-900 transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-7 h-px bg-gray-200 mb-1 shrink-0" />

                    {/* Error banner */}
                    {error && (
                        <div className="mx-7 mt-3 flex items-center gap-2 bg-red-50 border border-red-500/20 rounded-xl px-4 py-2.5 shrink-0">
                            <IoAlertCircle size={16} className="text-red-600 shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-7 py-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                                <p className="text-sm text-gray-500">Loading available seats…</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500 mb-5">Click on any available seat to view details and submit a change request.</p>

                                {/* Floor tabs */}
                                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                                    {floors.map((floor, idx) => (
                                        <button
                                            key={floor._id}
                                            onClick={() => setSelectedFloor(idx)}
                                            className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${selectedFloor === idx
                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-lg shadow-orange-500/20'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {floor.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Rooms */}
                                {floors[selectedFloor] && (
                                    <div className="space-y-5">
                                        {floors[selectedFloor].rooms.map(room => (
                                            <div key={room._id} className="rounded-2xl overflow-hidden"
                                                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                                                <div className="overflow-x-auto">
                                                    <div className="min-w-[520px]">
                                                        <StudentRoomGrid
                                                            room={room}
                                                            onSeatClick={handleSeatClick}
                                                            currentSeatId={currentSeat?._id}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-7 py-4 border-t border-gray-200 shrink-0">
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-gray-400 text-sm font-medium transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>

                {/* ── Seat Details sub-modal (z-[60]) ── */}
                <AnimatePresence>
                    {showSeatDetails && selectedSeat && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowSeatDetails(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.93, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.93, opacity: 0, y: 16 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                                className="relative w-full max-w-sm rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
                                style={{ backgroundColor: '#ffffff' }}
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Accent */}
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-400 to-amber-500" />

                                {/* Header */}
                                <div className="flex items-center justify-between px-5 pt-6 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <IoBedOutline size={16} className="text-orange-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900">Seat {selectedSeat.number}</h3>
                                            <p className={`text-xs font-semibold ${selectedSeat.isOccupied ? 'text-red-600' : 'text-green-600'}`}>
                                                {selectedSeat.isOccupied ? 'Occupied' : 'Available'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowSeatDetails(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                        <IoClose size={16} />
                                    </button>
                                </div>

                                <div className="mx-5 h-px bg-gray-200 mb-4" />

                                <div className="px-5 pb-5 space-y-3">
                                    {/* Shift prices */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {shifts.map(shift => {
                                            const price = selectedSeat.shiftPrices?.[shift.id] ?? selectedSeat.basePrices?.[shift.id] ?? 800;
                                            return (
                                                <div key={shift.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                                                    <p className="text-[11px] text-gray-500 mb-1">{shift.name}</p>
                                                    <p className="text-sm font-bold text-green-600">₹{price}</p>
                                                </div>
                                            );
                                        })}
                                        {!isCustom && !shifts.some(s => s.id === 'full') && (
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                                                <p className="text-[11px] text-gray-500 mb-1">Full Day</p>
                                                <p className="text-sm font-bold text-purple-600">₹{selectedSeat.basePrices?.full || 1200}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Current seat notice */}
                                    {currentSeat && selectedSeat._id === currentSeat._id && (
                                        <div className="bg-orange-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-blue-400 flex items-center gap-2">
                                            <IoCheckmarkCircle size={14} /> This is your current seat
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-600 flex items-center gap-2">
                                            <IoAlertCircle size={14} /> {error}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        {!selectedSeat.isOccupied && currentSeat?._id !== selectedSeat._id ? (
                                            <button
                                                onClick={handleRequestSeat}
                                                disabled={submitting}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                            >
                                                {submitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                                {submitting ? 'Submitting…' : 'Request This Seat'}
                                            </button>
                                        ) : (
                                            <button disabled className="flex-1 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-gray-500 cursor-not-allowed">
                                                {currentSeat?._id === selectedSeat._id ? 'Your Current Seat' : 'Not Available'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowSeatDetails(false)}
                                            className="py-2.5 px-4 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
};

export default SeatChangeModal;
