import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PublicSeatViewSkeleton } from '../../components/ui/SkeletonLoader';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';
import SeatDetailsModal from '../../components/student/SeatDetailsModal';
import MaintenancePage from './MaintenancePage';
import api from '../../utils/api';
import {
    IoLogInOutline, IoArrowForward, IoLibraryOutline,
    IoGridOutline, IoSnowOutline, IoBedOutline, IoSparkles
} from 'react-icons/io5';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/800.css';

const FONT = "'DM Sans', 'Inter', sans-serif";

const PublicSeatView = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [seatDetailsModal, setSeatDetailsModal] = useState({ isOpen: false, seat: null });
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        fetchSeats();
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            if (response.data.maintenance) {
                setIsMaintenance(true);
                setLoading(false);
                return;
            }
            setFloors(response.data.floors || []);
        } catch (error) {
            console.error('Error fetching seats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => setSeatDetailsModal({ isOpen: true, seat });

    if (isMaintenance) return <MaintenancePage />;
    if (loading) return <PublicSeatViewSkeleton />;

    const currentFloor = floors[selectedFloor];
    const totalSeatsOnFloor = currentFloor?.rooms?.reduce((acc, r) => acc + (r.seats?.length || 0), 0) || 0;
    const occupiedSeatsOnFloor = currentFloor?.rooms?.reduce((acc, r) => acc + (r.seats?.filter(s => s.isOccupied)?.length || 0), 0) || 0;
    const availableSeatsOnFloor = totalSeatsOnFloor - occupiedSeatsOnFloor;

    return (
        <div
            className="min-h-screen p-4 sm:p-6 sm:pb-12 relative text-slate-900"
            style={{ background: '#FFFBF7', fontFamily: FONT }}
        >
            {/* ── Fixed full-screen warm dot grid ── */}
            <div
                className="fixed inset-0 -z-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* ── Subtle warm ambient glow in top-right ── */}
            <div
                className="fixed top-0 right-0 w-96 h-96 pointer-events-none -z-10"
                style={{
                    background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }}
            />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* ── Top Navbar ── */}
                <div
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border"
                    style={{
                        borderColor: '#EDE8E0',
                        boxShadow: '0 4px 20px rgba(180,120,60,0.06)',
                    }}
                >
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/app-icon-192.png"
                            alt="Apna Lakshay"
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                            style={{
                                boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
                            }}
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-black text-base sm:text-lg text-slate-900 leading-none tracking-tight">
                                    Apna Lakshay
                                </h1>
                                <span
                                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{
                                        background: 'rgba(249,115,22,0.1)',
                                        color: '#EA580C',
                                        border: '1px solid rgba(249,115,22,0.2)',
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Seat Availability
                                </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                Library Management System
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5">
                        <Link to="/login">
                            <motion.button
                                whileHover={{ scale: 1.03, y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold tracking-wide text-xs sm:text-sm cursor-pointer shadow-md transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                    boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                                }}
                            >
                                <IoLogInOutline size={17} />
                                <span>Student Login</span>
                                <IoArrowForward size={13} className="hidden sm:block" />
                            </motion.button>
                        </Link>
                    </div>
                </div>

                {/* ── Floor Selector Tabs ── */}
                {floors.length > 0 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                        {floors.map((floor, index) => {
                            const isSelected = selectedFloor === index;
                            return (
                                <button
                                    key={floor._id}
                                    onClick={() => setSelectedFloor(index)}
                                    className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs sm:text-sm cursor-pointer border flex items-center gap-2 ${
                                        isSelected
                                            ? 'text-white border-transparent shadow-md'
                                            : 'bg-white text-slate-600 hover:text-slate-900 shadow-xs'
                                    }`}
                                    style={
                                        isSelected
                                            ? {
                                                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                                  boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                                              }
                                            : {
                                                  borderColor: '#EDE8E0',
                                              }
                                    }
                                >
                                    <IoGridOutline size={14} className={isSelected ? 'text-white' : 'text-orange-500'} />
                                    <span>{floor.name}</span>
                                    {floor.rooms && (
                                        <span
                                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                            }`}
                                        >
                                            {floor.rooms.length} {floor.rooms.length === 1 ? 'room' : 'rooms'}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Rooms on Selected Floor ── */}
                {currentFloor && (
                    <div className="space-y-6">
                        {currentFloor.rooms?.map((room) => (
                            <div
                                key={room._id}
                                className="rounded-3xl overflow-hidden bg-white border"
                                style={{
                                    borderColor: '#EDE8E0',
                                    boxShadow: '0 4px 20px rgba(180,120,60,0.06)',
                                }}
                            >
                                {/* Room Title Header */}
                                <div
                                    className="px-5 py-3.5 border-b flex items-center justify-between flex-wrap gap-2"
                                    style={{
                                        background: '#FFFBF7',
                                        borderColor: '#EDE8E0',
                                    }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                        <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                                            {room.name}
                                        </h2>
                                        {room.hasAc && (
                                            <span
                                                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border"
                                                style={{
                                                    background: '#F0F9FF',
                                                    color: '#0284C7',
                                                    borderColor: '#BAE6FD',
                                                }}
                                            >
                                                <IoSnowOutline size={11} /> Air Conditioned
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                        <span>Total: <strong className="text-slate-800 font-bold">{room.seats?.length || 0}</strong> seats</span>
                                        <span>•</span>
                                        <span>Available: <strong className="text-emerald-600 font-bold">{room.seats?.filter(s => !s.isOccupied).length || 0}</strong></span>
                                    </div>
                                </div>

                                {/* Room Grid Container */}
                                <div className="p-3 sm:p-5 overflow-x-auto">
                                    <div className="min-w-[520px]">
                                        <StudentRoomGrid room={room} onSeatClick={handleSeatClick} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* ── Floor Summary Cards ── */}
                        <div
                            className="bg-white rounded-3xl p-5 sm:p-6 border"
                            style={{
                                borderColor: '#EDE8E0',
                                boxShadow: '0 4px 20px rgba(180,120,60,0.06)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase tracking-wider text-xs text-slate-500">
                                    {currentFloor.name} — Real-time Statistics
                                </h3>
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Live
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {[
                                    {
                                        label: 'Total Desks',
                                        value: totalSeatsOnFloor,
                                        sub: 'Installed on this floor',
                                        color: '#1E293B',
                                        bg: '#FFFBF7',
                                        border: '#EDE8E0',
                                    },
                                    {
                                        label: 'Occupied',
                                        value: occupiedSeatsOnFloor,
                                        sub: 'Currently allocated',
                                        color: '#EA580C',
                                        bg: 'rgba(249,115,22,0.05)',
                                        border: 'rgba(249,115,22,0.2)',
                                    },
                                    {
                                        label: 'Available',
                                        value: availableSeatsOnFloor,
                                        sub: 'Ready for booking',
                                        color: '#16A34A',
                                        bg: 'rgba(34,197,94,0.05)',
                                        border: 'rgba(34,197,94,0.25)',
                                    },
                                ].map(({ label, value, sub, color, bg, border }) => (
                                    <div
                                        key={label}
                                        className="rounded-2xl p-4 text-center border transition-all"
                                        style={{ background: bg, borderColor: border }}
                                    >
                                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                                            {label}
                                        </p>
                                        <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color }}>
                                            {value}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            {sub}
                                        </p>
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
