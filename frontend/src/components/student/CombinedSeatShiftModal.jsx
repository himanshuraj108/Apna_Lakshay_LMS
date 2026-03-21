import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import StudentRoomGrid from './StudentRoomGrid';
import { IoClose, IoAlertCircle } from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const CombinedSeatShiftModal = ({ isOpen, onClose, currentSeat, onSuccess }) => {
    const { shifts, isCustom } = useShifts();
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [selectedShift, setSelectedShift] = useState('');
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showSeatDetails, setShowSeatDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [filteredFloors, setFilteredFloors] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchSeats();
        }
    }, [isOpen]);

    // Filter seats by selected shift
    useEffect(() => {
        if (!selectedShift || floors.length === 0) {
            setFilteredFloors(floors);
            return;
        }

        console.log('🔄 Filtering seats for shift:', selectedShift);

        // Import time overlap detection logic
        const doTimeRangesOverlap = (start1, end1, start2, end2) => {
            const timeToMinutes = (time) => {
                const [hours, minutes] = time.split(':').map(Number);
                return hours * 60 + minutes;
            };
            const s1 = timeToMinutes(start1);
            const e1 = timeToMinutes(end1);
            const s2 = timeToMinutes(start2);
            const e2 = timeToMinutes(end2);
            return s1 < e2 && s2 < e1;
        };

        const selectedShiftData = shifts.find(s => s.id === selectedShift);
        if (!selectedShiftData) {
            console.warn('⚠️ Selected shift not found in shifts array');
            setFilteredFloors(floors);
            return;
        }

        console.log('✅ Selected shift data:', selectedShiftData);
        console.log('🔍 Shift ID type:', typeof selectedShift, 'Value:', selectedShift);

        // Filter seats based on shift availability
        let processedSeatsCount = 0;
        let seatsWithAssignments = 0;

        const filtered = floors.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => ({
                ...room,
                seats: room.seats.map(seat => {
                    processedSeatsCount++;

                    // Debug: Check if seat has assignments
                    if (seat.assignments && seat.assignments.length > 0) {
                        seatsWithAssignments++;
                        console.log(`📋 Seat ${seat.number} assignments:`, seat.assignments);
                    }

                    // Check if this seat has any active assignments that overlap with selected shift
                    const hasOverlap = seat.assignments?.some(assignment => {
                        if (assignment.status !== 'active' || !assignment.shift) {
                            console.log(`⚠️ Seat ${seat.number} - Skipping assignment:`, {
                                hasShift: !!assignment.shift,
                                status: assignment.status
                            });
                            return false;
                        }

                        const overlaps = doTimeRangesOverlap(
                            selectedShiftData.startTime || '00:00',
                            selectedShiftData.endTime || '23:59',
                            assignment.shift.startTime,
                            assignment.shift.endTime
                        );

                        console.log(`🔍 Seat ${seat.number} overlap check:`, {
                            assignmentShift: assignment.shift.name,
                            assignmentTime: `${assignment.shift.startTime}-${assignment.shift.endTime}`,
                            selectedShift: selectedShiftData.name,
                            selectedTime: `${selectedShiftData.startTime}-${selectedShiftData.endTime}`,
                            overlaps
                        });

                        if (overlaps) {
                            console.log(`🔴 Seat ${seat.number} occupied - ${assignment.shift.name} overlaps with ${selectedShiftData.name}`);
                        }

                        return overlaps;
                    });

                    return {
                        ...seat,
                        isOccupiedForShift: hasOverlap,
                        // Override isOccupied to show availability for selected shift
                        displayOccupied: hasOverlap
                    };
                })
            }))
        }));

        const totalSeats = filtered.reduce((sum, floor) =>
            sum + floor.rooms.reduce((rsum, room) => rsum + room.seats.length, 0), 0
        );
        const occupiedSeats = filtered.reduce((sum, floor) =>
            sum + floor.rooms.reduce((rsum, room) =>
                rsum + room.seats.filter(s => s.displayOccupied).length, 0
            ), 0
        );

        console.log(`📊 Filtering results:`, {
            totalProcessed: processedSeatsCount,
            seatsWithAssignments,
            occupiedForShift: occupiedSeats,
            availableForShift: totalSeats - occupiedSeats,
            shiftName: selectedShiftData.name
        });

        setFilteredFloors(filtered);
    }, [selectedShift, floors, shifts]);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            console.log('🏢 Fetched seat data:', response.data);
            console.log('📊 Sample seat structure:', response.data.floors[0]?.rooms[0]?.seats[0]);
            setFloors(response.data.floors);
        } catch (error) {
            console.error('❌ Error fetching seats:', error);
            setError('Failed to load seats');
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        setSelectedSeat(seat);
        setShowSeatDetails(true);
    };

    const handleSubmitRequest = async () => {
        if (!selectedSeat || !selectedShift) return;

        // Validation
        if (selectedSeat.displayOccupied) {
            setError('This seat is not available for the selected shift');
            return;
        }
        if (currentSeat && selectedSeat._id === currentSeat._id) {
            setError('You cannot request your current seat');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Submit combined seat + shift change request
            await api.post('/student/request', {
                type: 'seat',
                description: `Request to change to Seat ${selectedSeat.number} with ${shifts.find(s => s.id === selectedShift)?.name}`,
                requestedData: {
                    requestedSeatId: selectedSeat._id,
                    requestedShift: selectedShift
                }
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

    const displayFloors = filteredFloors.length > 0 ? filteredFloors : floors;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, rgba(12,12,20,0.99) 0%, rgba(17,17,28,0.99) 100%)' }}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-violet-500/8 blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-7 pt-7 pb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <IoAlertCircle size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Find Available Seat & Shift</h2>
                                {currentSeat && (
                                    <p className="text-xs text-gray-500">
                                        Current: <span className="text-gray-300 font-medium">Seat {currentSeat.number}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-7 h-px bg-white/6 mb-1 shrink-0" />

                    {/* Main content */}
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {error && (
                            <div className="mx-7 mt-3 flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-2.5 shrink-0">
                                <IoAlertCircle size={16} className="text-red-400 shrink-0" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Shift Selector */}
                        <div className="px-7 pt-4 pb-3 border-b border-white/6 shrink-0">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Desired Shift</label>
                            <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value)}
                                className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all appearance-none"
                                style={{ background: '#111118', colorScheme: 'dark' }}
                            >
                                <option value="">Choose a shift…</option>
                                {shifts.map(shift => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.name} ({shift.startTime} – {shift.endTime})
                                    </option>
                                ))}
                                {!isCustom && !shifts.some(s => s.id === 'full') && (
                                    <option value="full">Full Day (9 AM – 9 PM)</option>
                                )}
                            </select>
                            {selectedShift ? (
                                <p className="text-xs text-green-400 mt-2">✓ Showing seats available for {shifts.find(s => s.id === selectedShift)?.name || 'selected shift'}</p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-2">Select a shift to filter available seats</p>
                            )}
                        </div>

                        {/* Seats Grid */}
                        <div className="flex-1 overflow-y-auto px-7 py-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                                    <p className="text-sm text-gray-500">Loading available seats…</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {selectedShift
                                            ? 'Click on any available (green) seat to view details and request'
                                            : 'Select a shift above to see available seats'}
                                    </p>

                                    {/* Floor Selector */}
                                    <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                                        {displayFloors.map((floor, index) => (
                                            <button
                                                key={floor._id}
                                                onClick={() => setSelectedFloor(index)}
                                                className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all ${selectedFloor === index
                                                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-lg shadow-violet-500/20'
                                                        : 'bg-white/4 text-gray-400 border-white/8 hover:bg-white/8 hover:text-white'
                                                    }`}
                                            >
                                                {floor.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Rooms Grid */}
                                    {displayFloors[selectedFloor] && (
                                        <div className="space-y-6">
                                            {displayFloors[selectedFloor].rooms.map((room) => (
                                                <div key={room._id} className="rounded-2xl overflow-hidden"
                                                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <div className="overflow-x-auto">
                                                        <div className="min-w-[520px]">
                                                            <StudentRoomGrid
                                                                room={room}
                                                                onSeatClick={handleSeatClick}
                                                                currentSeatId={currentSeat?._id}
                                                                useDisplayOccupied={true}
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
                        <div className="px-7 py-4 border-t border-white/6 shrink-0">
                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-gray-400 text-sm font-medium transition-all">
                                    Cancel
                                </button>
                                {selectedSeat && selectedShift && (
                                    <button
                                        onClick={handleSubmitRequest}
                                        disabled={submitting}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                        {submitting ? 'Submitting…' : `Request Seat ${selectedSeat.number}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Seat Details sub-modal (z-[60]) */}
                <AnimatePresence>
                    {showSeatDetails && selectedSeat && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowSeatDetails(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.93, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.93, opacity: 0, y: 16 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                                className="relative w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                                style={{ background: 'linear-gradient(160deg, rgba(13,13,22,0.99) 0%, rgba(18,18,30,0.99) 100%)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-violet-400" />
                                <div className="flex items-center justify-between px-5 pt-6 pb-3">
                                    <h3 className="text-base font-bold text-white">Seat {selectedSeat.number}</h3>
                                    <button onClick={() => setShowSeatDetails(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                        <IoClose size={16} />
                                    </button>
                                </div>
                                <div className="mx-5 h-px bg-white/6 mb-4" />
                                <div className="px-5 pb-5 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-center col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Status for selected shift</p>
                                            <p className={`text-base font-bold ${selectedSeat.displayOccupied ? 'text-red-400' : 'text-green-400'}`}>
                                                {selectedSeat.displayOccupied ? 'Occupied' : 'Available'}
                                            </p>
                                        </div>
                                        {selectedShift && (
                                            <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-3 text-center col-span-2">
                                                <p className="text-xs text-gray-500 mb-1">Shift</p>
                                                <p className="text-sm font-semibold text-indigo-300">{shifts.find(s => s.id === selectedShift)?.name}</p>
                                            </div>
                                        )}
                                        {currentSeat && selectedSeat._id === currentSeat._id && (
                                            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400 col-span-2 flex items-center gap-2">
                                                📍 This is your current seat
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        {!selectedSeat.displayOccupied && currentSeat?._id !== selectedSeat._id && selectedShift ? (
                                            <button
                                                onClick={handleSubmitRequest}
                                                disabled={submitting}
                                                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                            >
                                                {submitting ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                                {submitting ? 'Submitting…' : 'Request This Seat'}
                                            </button>
                                        ) : (
                                            <button disabled className="flex-1 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-gray-500 cursor-not-allowed">
                                                {currentSeat?._id === selectedSeat._id ? 'Your Current Seat' : 'Not Available'}
                                            </button>
                                        )}
                                        <button onClick={() => setShowSeatDetails(false)} className="py-2.5 px-4 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-sm text-gray-400 hover:text-white transition-all">
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

export default CombinedSeatShiftModal;
