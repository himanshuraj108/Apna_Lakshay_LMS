import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeatSkeleton } from '../../components/ui/SkeletonLoader';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';
import {
    IoArrowBack, IoLocationOutline, IoTimeOutline,
    IoCashOutline, IoCheckmarkCircle, IoSadOutline,
    IoBedOutline, IoGridOutline
} from 'react-icons/io5';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';

/* ─── Animated background ─────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#070a10' }} />
        <div className="fixed top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full -z-10 blur-[130px]"
            style={{ background: 'rgba(124,58,237,0.08)', animation: 'orb1 18s ease-in-out infinite' }} />
        <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full -z-10 blur-[100px]"
            style={{ background: 'rgba(59,130,246,0.07)', animation: 'orb2 22s ease-in-out infinite' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
    </>
);

/* ─── Detail chip ──────────────────────────────────────────────────── */
const DetailChip = ({ icon: Icon, label, value, accentColor }) => (
    <div className="relative flex items-center gap-3.5 rounded-2xl overflow-hidden"
        style={{
            background: `linear-gradient(145deg, ${accentColor}0d, rgba(255,255,255,0.02))`,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 16px',
        }}>
        {/* Accent left line */}
        <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
            style={{ background: accentColor }} />
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}18` }}>
            <Icon size={17} style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(156,163,175,0.7)' }}>{label}</p>
            <p className="text-white font-bold text-sm truncate">{value}</p>
        </div>
    </div>
);

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
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

    if (loading) return <SeatSkeleton />;

    /* ── No seat ─────────────────────────────────────────────────── */
    if (!seatData?.seat) return (
        <div className="min-h-screen text-white">
            <PageBg />
            <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
                <Link to="/student">
                    <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all mb-10"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <IoArrowBack size={15} /> Back to Dashboard
                    </motion.button>
                </Link>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <IoSadOutline size={30} className="text-gray-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">No Seat Assigned</h2>
                    <p className="text-gray-500 text-sm">Contact admin to get a seat allocated.</p>
                </motion.div>
            </div>
        </div>
    );

    const { seat } = seatData;
    const { floor, room } = seat;
    const price = seat.shiftPrices?.[seat.shiftId] || seat.basePrices?.[seat.shiftId] || seat.price || 800;

    return (
        <div className="min-h-screen text-white">
            <PageBg />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ─────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <IoArrowBack size={15} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">My Seat</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Your assigned study spot</p>
                    </div>
                </motion.div>

                {/* ── Main grid ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Seat number hero */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="relative rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(124,58,237,0.1), rgba(99,102,241,0.05))',
                                border: '1px solid rgba(124,58,237,0.2)',
                                padding: '20px',
                            }}>
                            {/* Accent line top */}
                            <div className="absolute top-0 left-0 right-0 h-[2px]"
                                style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1, transparent)' }} />
                            {/* Soft glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none"
                                style={{ background: 'rgba(124,58,237,0.15)' }} />

                            {/* Horizontal layout */}
                            <div className="relative flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
                                    <IoBedOutline size={22} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(167,139,250,0.7)' }}>Seat No.</p>
                                    <p className="text-3xl font-black text-white leading-none truncate">{seat.number}</p>
                                </div>
                            </div>

                            {/* Status row */}
                            <div className="relative mt-4 pt-4 border-t border-white/6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-emerald-400 text-xs font-semibold">Active</span>
                                <span className="text-gray-700 text-xs ml-auto">{seat.shift || ''}</span>
                            </div>
                        </motion.div>

                        {/* Detail chips */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                            className="flex flex-col gap-3">
                            <DetailChip icon={IoLocationOutline} label="Location" value={`${floor?.name}, ${room?.name}`} accentColor="#3b82f6" />
                            <DetailChip icon={IoTimeOutline} label="Shift" value={seat.shift || '—'} accentColor="#10b981" />
                            <DetailChip icon={IoCashOutline} label="Monthly Fee" value={`₹${price}`} accentColor="#f59e0b" />
                        </motion.div>

                        {/* Pricing plans */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                            className="rounded-2xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                                    <IoCashOutline size={13} className="text-amber-400" />
                                </div>
                                <p className="text-white font-bold text-sm">Pricing Plans</p>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                {shifts.map(shift => {
                                    const isCurrent = (seat.shiftId && seat.shiftId.toString() === shift.id.toString()) || seat.shift === shift.name;
                                    const shiftPrice = seat.shiftPrices?.[shift.id] || seat.basePrices?.[shift.id] || 800;
                                    return (
                                        <div key={shift.id}
                                            className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
                                            style={{
                                                background: isCurrent ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                            }}>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: isCurrent ? '#4ade80' : '#d1d5db' }}>{shift.name}</p>
                                                <p className="text-[11px] text-gray-600">{getShiftTimeRange(shift)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isCurrent && <IoCheckmarkCircle className="text-emerald-400" size={15} />}
                                                <span className="font-black text-sm" style={{ color: isCurrent ? '#fff' : '#6b7280' }}>₹{shiftPrice}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!isCustom && !shifts.some(s => s.id === 'full') && (
                                    <div className="flex justify-between items-center px-4 py-3 rounded-xl"
                                        style={{ background: seat.shift === 'Full Day' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span className="text-sm text-gray-400">Full Day</span>
                                        <span className="font-black text-sm text-gray-500">₹{seat.basePrices?.full || 1200}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN — Room map */}
                    <div className="lg:col-span-3">
                        {room && room.seats ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-2xl overflow-hidden h-full"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {/* Map header */}
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                                            <IoGridOutline size={13} className="text-blue-400" />
                                        </div>
                                        <p className="text-white font-bold text-sm">Seat Location Map</p>
                                    </div>
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                                        {room?.name || 'Room View'}
                                    </span>
                                </div>

                                {/* Map body */}
                                <div className="p-6 overflow-x-auto min-h-[600px] flex items-start justify-center">
                                    <StudentRoomGrid room={room} highlightSeatId={seat._id} onSeatClick={() => {}} />
                                </div>

                                {/* Callout */}
                                <div className="mx-5 mb-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm"
                                    style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                    <IoBedOutline size={15} className="text-purple-400 shrink-0" />
                                    <p className="text-purple-300 text-sm">
                                        Your seat <strong className="text-white font-black">#{seat.number}</strong> is highlighted on the map.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-64 lg:h-full rounded-2xl flex items-center justify-center text-center"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div>
                                    <IoGridOutline size={36} className="text-gray-700 mx-auto mb-3" />
                                    <p className="text-gray-600 text-sm">Room map not available</p>
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
