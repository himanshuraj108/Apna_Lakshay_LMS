import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StudentRoomGrid from './StudentRoomGrid';
import { IoClose, IoAlertCircle } from 'react-icons/io5';
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
        if (isOpen) {
            fetchSeats();
        }
    }, [isOpen]);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching seats:', error);
            setError('Failed to load seats');
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        setSelectedSeat(seat);
        setShowSeatDetails(true);
    };

    const handleRequestSeat = async () => {
        if (!selectedSeat) return;

        // Validate
        if (selectedSeat.isOccupied) {
            setError('This seat is already occupied');
            return;
        }
        if (currentSeat && selectedSeat._id === currentSeat._id) {
            setError('You cannot request your current seat');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await api.post('/student/request-seat-change', {
                requestedSeatId: selectedSeat._id
            });

            onSuccess?.();
            onClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-6xl max-h-[90vh] bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                Request Seat Change
                            </h2>
                            {currentSeat && (
                                <p className="text-sm text-gray-400 mt-1">
                                    Current Seat: <span className="text-white font-medium">{currentSeat.number}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <IoClose size={24} />
                        </button>
                    </div>

                    {/* Main Content (Responsive) */}
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {error && (
                            <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-400 mb-6">Click on any seat to view details and request</p>

                                    {/* Floor Selector */}
                                    <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                                        {floors.map((floor, index) => (
                                            <button
                                                key={floor._id}
                                                onClick={() => setSelectedFloor(index)}
                                                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${selectedFloor === index
                                                    ? 'bg-gradient-primary shadow-lg'
                                                    : 'bg-white/10 hover:bg-white/20'
                                                    }`}
                                            >
                                                {floor.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Rooms Grid */}
                                    {floors[selectedFloor] && (
                                        <div className="space-y-6">
                                            {floors[selectedFloor].rooms.map((room) => (
                                                <Card key={room._id}>
                                                    <div className="overflow-x-auto pb-4">
                                                        <div className="min-w-[800px]">
                                                            <StudentRoomGrid
                                                                room={room}
                                                                onSeatClick={handleSeatClick}
                                                                currentSeatId={currentSeat?._id}
                                                            />
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10">
                            <Button onClick={onClose} variant="secondary" className="w-full">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Seat Details Modal */}
                {showSeatDetails && selectedSeat && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h3 className="text-2xl font-bold">Seat Details</h3>
                                <button
                                    onClick={() => setShowSeatDetails(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <IoClose size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-sm text-gray-400">Seat Number</p>
                                        <p className="text-2xl font-bold">{selectedSeat.number}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-sm text-gray-400">Status</p>
                                        <p className={`text-lg font-semibold ${selectedSeat.isOccupied ? 'text-red-400' : 'text-green-400'}`}>
                                            {selectedSeat.isOccupied ? 'Occupied' : 'Available'}
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-3">Shift Prices</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {shifts.map(shift => {
                                                const price = selectedSeat.shiftPrices?.[shift.id] ?? selectedSeat.basePrices?.[shift.id] ?? 800;
                                                return (
                                                    <div key={shift.id} className="bg-white/10 rounded p-2 text-center">
                                                        <p className="text-xs text-gray-400 mb-1">{shift.name}</p>
                                                        <p className="text-sm font-bold text-green-400">₹{price}</p>
                                                    </div>
                                                );
                                            })}
                                            {!isCustom && !shifts.some(s => s.id === 'full') && (
                                                <div className="bg-white/10 rounded p-2 text-center">
                                                    <p className="text-xs text-gray-400 mb-1">Full Day</p>
                                                    <p className="text-sm font-bold text-purple-400">₹{selectedSeat.basePrices?.full || 1200}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {currentSeat && selectedSeat._id === currentSeat._id && (
                                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                                            <p className="text-sm text-blue-400">📍 This is your current seat</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    {!selectedSeat.isOccupied && currentSeat?._id !== selectedSeat._id ? (
                                        <Button
                                            onClick={handleRequestSeat}
                                            disabled={submitting}
                                            variant="primary"
                                            className="flex-1"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Submitting...
                                                </>
                                            ) : 'Request For This'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            disabled
                                            className="flex-1"
                                        >
                                            {currentSeat?._id === selectedSeat._id ? 'Current Seat' : 'Not Available'}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => setShowSeatDetails(false)}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AnimatePresence>
    );
};

export default SeatChangeModal;
