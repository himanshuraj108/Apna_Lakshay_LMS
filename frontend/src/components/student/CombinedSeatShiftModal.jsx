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
                                Find Available Seat & Shift
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

                    {/* Main Content */}
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {error && (
                            <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg flex items-center gap-2">
                                <IoAlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {/* Shift Selector */}
                        <div className="p-6 pb-4 border-b border-white/10">
                            <label className="block text-sm font-medium mb-2">Select Desired Shift</label>
                            <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-900 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Choose a shift...</option>
                                {shifts.map(shift => (
                                    <option key={shift.id} value={shift.id}>
                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                    </option>
                                ))}
                                {!isCustom && !shifts.some(s => s.id === 'full') && (
                                    <option value="full">Full Day (9 AM - 9 PM)</option>
                                )}
                            </select>
                            {selectedShift && (
                                <p className="text-xs text-green-400 mt-2">
                                    ✓ Showing seats available for {shifts.find(s => s.id === selectedShift)?.name || 'selected shift'}
                                </p>
                            )}
                            {!selectedShift && (
                                <p className="text-xs text-gray-400 mt-2">
                                    ℹ️ Select a shift to filter available seats
                                </p>
                            )}
                        </div>

                        {/* Seats Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-400 mb-6">
                                        {selectedShift
                                            ? 'Click on any available (green) seat to view details and request'
                                            : 'Select a shift above to see available seats'}
                                    </p>

                                    {/* Floor Selector */}
                                    <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                                        {displayFloors.map((floor, index) => (
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
                                    {displayFloors[selectedFloor] && (
                                        <div className="space-y-6">
                                            {displayFloors[selectedFloor].rooms.map((room) => (
                                                <Card key={room._id}>
                                                    <div className="overflow-x-auto pb-4">
                                                        <div className="min-w-[800px]">
                                                            <StudentRoomGrid
                                                                room={room}
                                                                onSeatClick={handleSeatClick}
                                                                currentSeatId={currentSeat?._id}
                                                                useDisplayOccupied={true}
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
                            <div className="flex gap-4">
                                <Button onClick={onClose} variant="secondary" className="flex-1">
                                    Cancel
                                </Button>
                                {selectedSeat && selectedShift && (
                                    <Button
                                        onClick={handleSubmitRequest}
                                        variant="primary"
                                        className="flex-1"
                                        disabled={submitting || !selectedShift}
                                    >
                                        {submitting ? 'Submitting...' : `Request Seat ${selectedSeat.number}`}
                                    </Button>
                                )}
                            </div>
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
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h3 className="text-2xl font-bold">Seat Details</h3>
                                <button
                                    onClick={() => setShowSeatDetails(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <IoClose size={24} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-sm text-gray-400">Seat Number</p>
                                        <p className="text-2xl font-bold">{selectedSeat.number}</p>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4">
                                        <p className="text-sm text-gray-400">Status for Selected Shift</p>
                                        <p className={`text-lg font-semibold ${selectedSeat.displayOccupied ? 'text-red-400' : 'text-green-400'}`}>
                                            {selectedSeat.displayOccupied ? 'Occupied' : 'Available'}
                                        </p>
                                    </div>

                                    {selectedShift && (
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                            <p className="text-sm text-blue-400 mb-1">Selected Shift</p>
                                            <p className="text-white font-semibold">
                                                {shifts.find(s => s.id === selectedShift)?.name}
                                            </p>
                                        </div>
                                    )}

                                    {currentSeat && selectedSeat._id === currentSeat._id && (
                                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                                            <p className="text-sm text-yellow-400">📍 This is your current seat</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    {!selectedSeat.displayOccupied && currentSeat?._id !== selectedSeat._id && selectedShift ? (
                                        <Button
                                            onClick={handleSubmitRequest}
                                            disabled={submitting}
                                            variant="primary"
                                            className="flex-1"
                                        >
                                            {submitting ? 'Submitting...' : 'Request This Seat'}
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

export default CombinedSeatShiftModal;
