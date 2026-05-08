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
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
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

    return (
        <div className="min-h-screen text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all shadow-sm">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Available Seats</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Click on any seat to view details</p>
                    </div>
                </motion.div>

                {loading ? <SkeletonLoader type="card" count={3} /> : (
                    <>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl border border-gray-200 w-fit overflow-x-auto">
                            {floors.map((floor, index) => (
                                <button key={floor._id} onClick={() => setSelectedFloor(index)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${selectedFloor === index
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-800'}`}>
                                    {floor.name}
                                </button>
                            ))}
                        </motion.div>

                        {currentFloor && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                                className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: 'Total Seats', value: totalSeats, color: 'from-slate-500 to-gray-400', icon: IoGridOutline },
                                    { label: 'Occupied',    value: occupied,    color: 'from-red-500 to-rose-400',   icon: IoCloseCircle },
                                    { label: 'Available',   value: available,   color: 'from-green-500 to-emerald-400', icon: IoCheckmarkCircle },
                                ].map(({ label, value, color, icon: Icon }, idx) => (
                                    <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.06 }}
                                        className="relative rounded-2xl p-4 border border-gray-200 bg-white shadow-sm overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color}`} />
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-md shrink-0`}><Icon size={16} className="text-white" /></div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
                                                <p className={`text-2xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
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
                                        className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                                                <IoGridOutline size={14} className="text-white" />
                                            </div>
                                            <h3 className="font-bold text-gray-900">{room.name}</h3>
                                            <span className="ml-auto text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                                {room.seats.filter(s => !s.isOccupied).length} free
                                            </span>
                                        </div>
                                        <StudentRoomGrid room={room} onSeatClick={handleSeatClick} />
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            className="mt-6 flex items-center gap-6 p-4 rounded-2xl border border-gray-200 bg-white shadow-sm w-fit">
                            <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Legend</span>
                            {[
                                { color: 'bg-green-500', label: 'Available' },
                                { color: 'bg-red-500',   label: 'Occupied'  },
                                { color: 'bg-purple-500', label: 'Your Seat' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-md ${color} opacity-80`} />
                                    <span className="text-gray-600 text-xs">{label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </>
                )}

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
