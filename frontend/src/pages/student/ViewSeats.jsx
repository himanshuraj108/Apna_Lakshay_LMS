import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';
import SeatDetailsModal from '../../components/student/SeatDetailsModal';
import api from '../../utils/api';
import { IoArrowBack, IoGridOutline, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F7F3EC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
    </>
);

const ViewSeats = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [seatDetailsModal, setSeatDetailsModal] = useState({ isOpen: false, seat: null });

    useEffect(() => { fetchFloors(); }, []);

    const fetchFloors = async () => {
        try {
            const response = await api.get('/public/seats');
            setFloors(response.data.floors);
        } catch (error) { console.error('Error fetching floors:', error); }
        finally { setLoading(false); }
    };

    const handleSeatClick = (seat) => setSeatDetailsModal({ isOpen: true, seat });
    const currentFloor = floors[selectedFloor];
    const totalSeats = currentFloor?.rooms.reduce((a, r) => a + r.seats.length, 0) || 0;
    const occupied = currentFloor?.rooms.reduce((a, r) => a + r.seats.filter(s => s.isOccupied).length, 0) || 0;
    const available = totalSeats - occupied;

    const statCards = [
        { label: 'Total Seats', value: totalSeats, icon: IoGridOutline,     accent: '#6366F1', accentBg: 'rgba(99,102,241,0.08)', accentBorder: 'rgba(99,102,241,0.2)' },
        { label: 'Occupied',    value: occupied,    icon: IoCloseCircle,     accent: '#EF4444', accentBg: 'rgba(239,68,68,0.08)',  accentBorder: 'rgba(239,68,68,0.2)'  },
        { label: 'Available',   value: available,   icon: IoCheckmarkCircle, accent: '#10B981', accentBg: 'rgba(16,185,129,0.08)', accentBorder: 'rgba(16,185,129,0.2)' },
    ];

    return (
        <div className="min-h-screen" style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#1A1A1A' }}>Available Seats</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#9B7B5A' }}>Click on any seat to view details</p>
                    </div>
                </motion.div>

                {loading ? <SkeletonLoader type="card" count={3} /> : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="flex gap-2 mb-6 p-1 rounded-2xl border w-fit overflow-x-auto"
                            style={{ background: '#F5F0EA', borderColor: '#EDE8E0' }}>
                            {floors.map((floor, index) => (
                                <button key={floor._id} onClick={() => setSelectedFloor(index)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                                    style={selectedFloor === index
                                        ? { background: '#FFFFFF', color: '#EA580C', border: '1.5px solid #FDDCAE', boxShadow: '0 2px 8px rgba(180,120,60,0.1)' }
                                        : { color: '#9B7B5A', border: '1.5px solid transparent' }}>
                                    {floor.name}
                                </button>
                            ))}
                        </motion.div>

                        {currentFloor && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="grid grid-cols-3 gap-4 mb-6">
                                {statCards.map(({ label, value, icon: Icon, accent, accentBg, accentBorder }, idx) => (
                                    <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.06 }}
                                        className="relative rounded-2xl p-4 overflow-hidden"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 12px rgba(180,120,60,0.06)' }}>
                                        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                            style={{ background: "linear-gradient(90deg," + accent + "," + accent + "80,transparent)" }} />
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="p-2 rounded-xl shrink-0" style={{ background: accentBg, border: "1px solid " + accentBorder }}>
                                                <Icon size={16} style={{ color: accent }} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#9B7B5A' }}>{label}</p>
                                                <p className="text-2xl font-black" style={{ color: '#1A1A1A' }}>{value}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {currentFloor && (
                            <div className="space-y-5">
                                {currentFloor.rooms.map((room, idx) => (
                                    <motion.div key={room._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.08 }}
                                        className="rounded-2xl p-5"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 12px rgba(180,120,60,0.06)' }}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                                <IoGridOutline size={14} className="text-white" />
                                            </div>
                                            <h3 className="font-bold" style={{ color: '#1A1A1A' }}>{room.name}</h3>
                                            <span className="ml-auto text-xs px-2 py-1 rounded-lg font-semibold"
                                                style={{ background: '#FFF5EE', border: '1px solid #FDDCAE', color: '#EA580C' }}>
                                                {room.seats.filter(s => !s.isOccupied).length} free
                                            </span>
                                        </div>
                                        <StudentRoomGrid room={room} onSeatClick={handleSeatClick} />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            className="mt-6 flex items-center gap-6 p-4 rounded-2xl w-fit"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}>
                            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#9B7B5A' }}>Legend</span>
                            {[{ color: '#22C55E', label: 'Available' }, { color: '#EF4444', label: 'Occupied' }, { color: '#F97316', label: 'Your Seat' }].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-md" style={{ background: color, opacity: 0.85 }} />
                                    <span className="text-xs" style={{ color: '#6B6560' }}>{label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </>
                )}
                <SeatDetailsModal isOpen={seatDetailsModal.isOpen} onClose={() => setSeatDetailsModal({ isOpen: false, seat: null })} seat={seatDetailsModal.seat} />
            </div>
        </div>
    );
};

export default ViewSeats;
