import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import Modal from '../../components/ui/Modal';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';
import SeatDetailsModal from '../../components/student/SeatDetailsModal';
import api from '../../utils/api';
import { IoDownload, IoGlobe, IoLogInOutline, IoArrowForward } from 'react-icons/io5';

const PublicSeatView = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [seatDetailsModal, setSeatDetailsModal] = useState({ isOpen: false, seat: null });

    useEffect(() => {
        fetchSeats();
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching seats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        setSeatDetailsModal({ isOpen: true, seat });
    };

    return (
        <div className="min-h-screen p-6 min-w-[1280px] overflow-x-auto bg-[#0f172a]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                        Hamara <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Lakshya</span>
                    </h1>
                    <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">Library Management System</p>

                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-4"></div>

                    <p className="text-gray-300 text-lg">Library Seat Availability</p>
                </div>

                {/* Login Floating Button - Prominent Call to Action */}
                <Link to="/login" className="fixed top-8 right-8 z-50 w-max">
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            boxShadow: ["0px 0px 0px rgba(124, 58, 237, 0)", "0px 0px 20px rgba(124, 58, 237, 0.5)", "0px 0px 0px rgba(124, 58, 237, 0)"]
                        }}
                        transition={{
                            scale: { duration: 0.5 },
                            opacity: { duration: 0.5 },
                            boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full text-white shadow-2xl border border-white/20 backdrop-blur-md group"
                    >
                        <IoLogInOutline size={24} className="animate-pulse" />
                        <span className="font-bold text-lg tracking-wide">LOGIN</span>
                        <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={20} />
                    </motion.button>
                </Link>

                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : (
                    <>
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

                        {/* Rooms with New Box Layout */}
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
                                    <h3 className="text-xl font-bold mb-4">Floor Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Total Seats</p>
                                            <p className="text-3xl font-bold">{floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.length, 0)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Occupied</p>
                                            <p className="text-3xl font-bold text-red-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Available</p>
                                            <p className="text-3xl font-bold text-green-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => !s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Seat Details Modal */}
            <SeatDetailsModal
                isOpen={seatDetailsModal.isOpen}
                onClose={() => setSeatDetailsModal({ isOpen: false, seat: null })}
                seat={seatDetailsModal.seat}
            />
        </div>
    );
};

export default PublicSeatView;
