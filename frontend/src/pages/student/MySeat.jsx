import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';
import { IoArrowBack, IoLocationOutline, IoTimeOutline, IoCash, IoCheckmarkCircle, IoSadOutline } from 'react-icons/io5';
import { MdChair } from 'react-icons/md';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';

const PageBg = () => (
    <>
        <div className="fixed inset-0 bg-[#050508] -z-10" />
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-700/10 blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
    </>
);

const InfoRow = ({ icon: Icon, label, value, accent = 'text-purple-400' }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-all">
        <div className={`p-2 rounded-lg bg-white/5 border border-white/8 ${accent}`}>
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
            <p className="font-semibold text-white truncate">{value}</p>
        </div>
    </div>
);

const MySeat = () => {
    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { shifts, isCustom, getShiftTimeRange } = useShifts();

    useEffect(() => { fetchSeatData(); }, []);

    const fetchSeatData = async () => {
        try {
            const response = await api.get('/student/seat');
            setSeatData(response.data);
        } catch (error) { console.error('Error fetching seat:', error); }
        finally { setLoading(false); }
    };

    if (loading) return (
        <div className="min-h-screen p-6 bg-[#050508]"><div className="max-w-4xl mx-auto"><SkeletonLoader type="card" count={1} /></div></div>
    );

    if (!seatData?.seat) return (
        <div className="min-h-screen text-white">
            <PageBg />
            <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
                <Link to="/student">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all mb-8">
                        <IoArrowBack size={16} /> Back
                    </motion.button>
                </Link>
                <div className="text-center py-20 rounded-2xl border border-white/8 bg-white/3">
                    <IoSadOutline size={56} className="mx-auto text-gray-600 mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-white">No Seat Assigned</h2>
                    <p className="text-gray-500">Contact admin to get a seat allocated.</p>
                </div>
            </div>
        </div>
    );

    const { seat } = seatData;
    const { floor, room } = seat;

    return (
        <div className="min-h-screen text-white overflow-x-auto">
            <PageBg />
            <div className="relative z-10 min-w-[1024px] max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-10">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white">My Seat</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Your assigned study spot</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-3 gap-8">
                    {/* Left: Details */}
                    <div className="col-span-1 space-y-5">
                        {/* Seat Number Hero */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="relative rounded-2xl border border-purple-500/30 bg-white/3 backdrop-blur-xl p-6 overflow-hidden text-center">
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-500 to-indigo-500 opacity-70" />
                            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-600/10 blur-2xl" />
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                                <MdChair size={40} className="text-white" />
                            </div>
                            <p className="text-5xl font-black text-white mb-1">{seat.number}</p>
                            <p className="text-gray-500 text-sm">Your assigned seat</p>
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Active Membership
                            </div>
                        </motion.div>

                        {/* Info Rows */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="space-y-2.5">
                            <InfoRow icon={IoLocationOutline} label="Location" value={`${floor?.name}, ${room?.name}`} accent="text-blue-400" />
                            <InfoRow icon={IoTimeOutline} label="Shift" value={`${seat.shift}`} accent="text-green-400" />
                            <InfoRow icon={IoCash} label="Monthly Fee" value={`₹${seat.shiftPrices?.[seat.shiftId] || seat.basePrices?.[seat.shiftId] || seat.price || 800}`} accent="text-yellow-400" />
                        </motion.div>

                        {/* Pricing Plan */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Pricing Plans</h3>
                            <div className="space-y-2">
                                {shifts.map(shift => {
                                    const isCurrent = (seat.shiftId && seat.shiftId.toString() === shift.id.toString()) || seat.shift === shift.name;
                                    const price = seat.shiftPrices?.[shift.id] || seat.basePrices?.[shift.id] || 800;
                                    return (
                                        <div key={shift.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isCurrent ? 'border-green-500/40 bg-green-500/10' : 'border-white/8 bg-white/3 hover:bg-white/5'}`}>
                                            <div>
                                                <p className={`text-sm font-semibold ${isCurrent ? 'text-green-400' : 'text-gray-300'}`}>{shift.name}</p>
                                                <p className="text-xs text-gray-600">{getShiftTimeRange(shift)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isCurrent && <IoCheckmarkCircle className="text-green-400" size={16} />}
                                                <span className={`font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}`}>₹{price}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!isCustom && !shifts.some(s => s.id === 'full') && (
                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${seat.shift === 'Full Day' ? 'border-green-500/40 bg-green-500/10' : 'border-white/8 bg-white/3'}`}>
                                        <span className="text-sm text-gray-400">Full Day</span>
                                        <span className="font-bold text-gray-400">₹{seat.basePrices?.full || 1200}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Map */}
                    <div className="col-span-2">
                        {room && room.seats && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6 h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">Seat Location Map</h3>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">Room View</span>
                                </div>
                                <StudentRoomGrid room={room} highlightSeatId={seat._id} onSeatClick={() => { }} />
                                <div className="mt-5 p-4 bg-purple-500/8 border border-purple-500/20 rounded-xl text-sm text-center text-purple-300">
                                    Your seat <strong className="text-white">#{seat.number}</strong> is highlighted on the map.
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySeat;
