import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';
import SeatDetailsModal from '../../components/student/SeatDetailsModal';
import api from '../../utils/api';
import { IoArrowBack } from 'react-icons/io5';

const ViewSeats = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [seatDetailsModal, setSeatDetailsModal] = useState({ isOpen: false, seat: null });

    useEffect(() => {
        fetchFloors();
    }, []);

    const fetchFloors = async () => {
        try {
            const response = await api.get('/public/seats'); // Use public endpoint for students
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching floors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        setSeatDetailsModal({ isOpen: true, seat });
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-4 sm:mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    Available Seats
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Click on any seat to view details and availability</p>

                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : (
                    <>
                        {/* Floor Selector */}
                        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
                            {floors.map((floor, index) => (
                                <button
                                    key={floor._id}
                                    onClick={() => setSelectedFloor(index)}
                                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all whitespace-nowrap ${selectedFloor === index
                                        ? 'bg-gradient-primary shadow-lg text-white'
                                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                        }`}
                                >
                                    {floor.name}
                                </button>
                            ))}
                        </div>

                        {/* Floor Details */}
                        {floors[selectedFloor] && (
                            <div className="space-y-6">
                                {floors[selectedFloor].rooms.map((room) => (
                                    <Card key={room._id}>
                                        <StudentRoomGrid
                                            room={room}
                                            onSeatClick={handleSeatClick}
                                        />
                                    </Card>
                                ))}

                                {/* Summary */}
                                <Card>
                                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white">Floor Summary</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                            <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Seats</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-white">{floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.length, 0)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                            <p className="text-gray-400 text-xs sm:text-sm mb-1">Occupied</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-red-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                            <p className="text-gray-400 text-xs sm:text-sm mb-1">Available</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-green-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => !s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                )}

                {/* Seat Details Modal */}
                <SeatDetailsModal
                    isOpen={seatDetailsModal.isOpen}
                    onClose={() => setSeatDetailsModal({ isOpen: false, seat: null })}
                    seat={seatDetailsModal.seat}
                />
            </div>
        </div>
    );
};

export default ViewSeats;
