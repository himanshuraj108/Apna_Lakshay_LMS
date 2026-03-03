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
        <div className="min-h-screen p-6 min-w-[1280px] overflow-x-auto dark relative">
            {/* ── Fixed full-screen background — blocks body CSS blobs ── */}
            <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(249,115,22,0.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(239,68,68,0.07) 0%, transparent 55%), #030712' }} />
            {/* Ambient blob */}
            <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[140px] pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-white mb-1">
                        Apna <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Lakshay</span>
                    </h1>
                    <p className="text-gray-500 text-xs tracking-widest uppercase mb-5">Library Management System</p>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mx-auto mb-5" />
                    <p className="text-gray-300 text-lg font-medium">Library Seat Availability</p>
                </div>

                {/* Login Floating Button */}
                <Link to="/login" className="fixed top-8 right-8 z-50 w-max">
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, boxShadow: ["0px 0px 0px rgba(249,115,22,0)", "0px 0px 22px rgba(249,115,22,0.5)", "0px 0px 0px rgba(249,115,22,0)"] }}
                        transition={{ scale: { duration: 0.5 }, opacity: { duration: 0.5 }, boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 rounded-full text-white shadow-2xl shadow-orange-500/30 border border-white/15 group font-bold tracking-wide text-sm"
                    >
                        <IoLogInOutline size={22} className="animate-pulse" />
                        <span>LOGIN</span>
                        <IoArrowForward className="group-hover:translate-x-1 transition-transform" size={18} />
                    </motion.button>
                </Link>

                {/* Floor Selector */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    {floors.map((floor, index) => (
                        <button
                            key={floor._id}
                            onClick={() => setSelectedFloor(index)}
                            className={`px-6 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap text-sm border ${selectedFloor === index
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-lg shadow-orange-500/25'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
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
                            <Card key={room._id}>
                                <StudentRoomGrid room={room} onSeatClick={handleSeatClick} />
                            </Card>
                        ))}

                        {/* Floor Summary */}
                        <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-5">Floor Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Seats', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.length, 0), color: 'text-white' },
                                    { label: 'Occupied', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.filter(s => s.isOccupied).length, 0), color: 'text-red-400' },
                                    { label: 'Available', value: floors[selectedFloor].rooms.reduce((acc, r) => acc + r.seats.filter(s => !s.isOccupied).length, 0), color: 'text-green-400' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white/5 border border-white/8 rounded-xl p-4 text-center">
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
