import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import SkeletonLoader, { PublicSeatViewSkeleton } from '../../components/ui/SkeletonLoader';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';
import SeatDetailsModal from '../../components/student/SeatDetailsModal';
import MaintenancePage from './MaintenancePage';
import api from '../../utils/api';
import { IoLogInOutline, IoArrowForward } from 'react-icons/io5';

const PublicSeatView = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [seatDetailsModal, setSeatDetailsModal] = useState({ isOpen: false, seat: null });
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => { fetchSeats(); }, []);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            if (response.data.maintenance) { setIsMaintenance(true); setLoading(false); return; }
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching seats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => setSeatDetailsModal({ isOpen: true, seat });

    if (isMaintenance) return <MaintenancePage />;
    if (loading) return <PublicSeatViewSkeleton />;

    return (
        <div className="min-h-screen p-4 sm:p-6 relative text-gray-900" style={{ background: "#F8FAFC" }}>
            {/* ── Fixed full-screen background ── */}
            <div className="fixed inset-0 -z-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="max-w-7xl mx-auto">
                {/* ── Top navbar row: brand left, LOGIN right ── */}
                <div className="flex items-start justify-between mb-6 pt-1">
                    {/* Brand */}
                    <div>
                        <p className="text-gray-900 font-black text-base sm:text-lg leading-tight">
                            Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                        </p>
                        <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Library Management System</p>
                        <p className="text-gray-600 text-xs font-semibold mt-1">Library Seat Availability</p>
                    </div>

                    {/* LOGIN */}
                    <Link to="/login">
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-full text-white shadow-lg shadow-orange-500/30 border border-white/15 group font-bold tracking-wide text-xs sm:text-sm"
                        >
                            <IoLogInOutline size={15} />
                            <span>LOGIN</span>
                            <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={13} />
                        </motion.button>
                    </Link>
                </div>

                {/* Floor Selector */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    {floors.map((floor, index) => (
                        <button
                            key={floor._id}
                            onClick={() => setSelectedFloor(index)}
                            className={`px-5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap text-sm border ${selectedFloor === index
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/25'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800 shadow-sm'
                                }`}
                        >
                            {floor.name}
                        </button>
                    ))}
                </div>

                {/* Rooms */}
                {floors[selectedFloor] && (
                    <div className="space-y-6">
                        {floors[selectedFloor].rooms.map((room) => (
                            <div key={room._id} className="rounded-2xl overflow-hidden"
                                style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div className="overflow-x-auto">
                                    <div className="min-w-[520px]">
                                        <StudentRoomGrid room={room} onSeatClick={handleSeatClick} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Floor Summary */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Floor Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Seats', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.length, 0), color: 'text-gray-900' },
                                    { label: 'Occupied', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.filter(s => s.isOccupied).length, 0), color: 'text-red-600' },
                                    { label: 'Available', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.filter(s => !s.isOccupied).length, 0), color: 'text-green-600' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">{label}</p>
                                        <p className={`text-3xl font-black ${color}`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
