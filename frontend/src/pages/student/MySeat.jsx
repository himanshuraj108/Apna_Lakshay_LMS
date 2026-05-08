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

/* ─── Background ─────────────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </>
);

/* ─── Detail chip ──────────────────────────────────────────────────── */
const DetailChip = ({ icon: Icon, label, value, accentColor }) => (
    <div className="relative flex items-center gap-3.5 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm"
        style={{ padding: '14px 16px' }}>
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accentColor }} />
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}18` }}>
            <Icon size={17} style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-gray-500">{label}</p>
            <p className="text-gray-900 font-bold text-sm truncate">{value}</p>
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

    if (loading) return <SeatSkeleton />;

    /* ── No seat ─────────────────────────────────────────────────── */
    if (!seatData?.seat) return (
        <div className="min-h-screen text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
                <Link to="/student">
                    <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 transition-all mb-10 bg-white border border-gray-200 shadow-sm">
                        <IoArrowBack size={15} /> Back to Dashboard
                    </motion.button>
                </Link>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 rounded-2xl bg-white border border-gray-200 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <IoSadOutline size={30} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Seat Assigned</h2>
                    <p className="text-gray-500 text-sm">Contact admin to get a seat allocated.</p>
                </motion.div>
            </div>
        </div>
    );

    const { seat } = seatData;
    const { floor, room } = seat;
    const price = seat.shiftPrices?.[seat.shiftId] || seat.basePrices?.[seat.shiftId] || seat.price || 800;

    return (
        <div className="min-h-screen text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 transition-all bg-white border border-gray-200 shadow-sm">
                            <IoArrowBack size={15} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Seat</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Your assigned study spot</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Seat number hero */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="relative rounded-2xl overflow-hidden bg-white border border-orange-200 shadow-sm"
                            style={{ padding: '20px' }}>
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                                style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, transparent)' }} />
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none"
                                style={{ background: 'rgba(249,115,22,0.06)' }} />

                            <div className="relative flex items-center gap-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-orange-500">Seat No.</p>
                                    <p className="text-3xl font-black text-gray-900 leading-none truncate">{seat.number}</p>
                                </div>
                            </div>

                            {/* Stamp */}
                            <div className="absolute top-1/2 right-10 -translate-y-1/2 flex items-center justify-center w-[96px] h-[96px] transform rotate-[-18deg] border-[4px] border-emerald-600 text-emerald-600 rounded-full pointer-events-none mix-blend-multiply opacity-70">
                                <div className="absolute inset-[3px] border-[1.5px] border-emerald-600 rounded-full" />
                                <div className="flex flex-col items-center justify-center w-full">
                                    <p className="font-bold text-[6.5px] tracking-[0.2em] uppercase text-center leading-[1.2] mb-[3px]">
                                        APNA LAKSHAY<br/>LIBRARY
                                    </p>
                                    <div className="w-[85%] h-[1.5px] bg-emerald-600 mb-[3px]" />
                                    <p className="font-black text-[11px] tracking-widest uppercase text-center" style={{ transform: 'scaleY(1.2)' }}>
                                        CONFIRMED
                                    </p>
                                </div>
                            </div>

                            <div className="relative mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-emerald-600 text-xs font-semibold">Active</span>
                                </div>
                                {seat.shifts && seat.shifts.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {seat.shifts.map((s, i) => (
                                            <span key={i} className="inline-flex flex-col px-3 py-1.5 rounded-xl text-xs font-bold"
                                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                                                <span>{s.name}</span>
                                                {s.startTime && s.endTime && (
                                                    <span className="text-[10px] text-emerald-500 font-normal mt-0.5">{s.startTime}–{s.endTime}</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400 text-xs">{seat.shift || ''}</span>
                                )}
                            </div>
                        </motion.div>

                        {/* Detail chips */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                            className="flex flex-col gap-3">
                            <DetailChip icon={IoLocationOutline} label="Location" value={`${floor?.name}, ${room?.name}`} accentColor="#3b82f6" />
                            {seat.shifts && seat.shifts.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {seat.shifts.map((s, i) => (
                                        <div key={i} className="relative flex items-center gap-3.5 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm"
                                            style={{ padding: '14px 16px' }}>
                                            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-emerald-500" />
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50">
                                                <IoTimeOutline size={17} className="text-emerald-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-gray-500">Shift {i + 1}</p>
                                                <p className="text-gray-900 font-bold text-sm">{s.name}</p>
                                                {s.startTime && s.endTime && (
                                                    <p className="text-emerald-600 text-[11px] font-semibold mt-0.5">{s.startTime} – {s.endTime}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <DetailChip icon={IoTimeOutline} label="Shift" value={seat.shift || '—'} accentColor="#10b981" />
                            )}
                            <DetailChip icon={IoCashOutline} label="Monthly Fee" value={`₹${price}`} accentColor="#f59e0b" />
                        </motion.div>

                        {/* Pricing plans */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                            className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-50">
                                    <IoCashOutline size={13} className="text-amber-500" />
                                </div>
                                <p className="text-gray-900 font-bold text-sm">Pricing Plans</p>
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                {shifts.map(shift => {
                                    const shiftIdStr = (shift._id || shift.id || '').toString();
                                    const isCurrent = seat.shifts
                                        ? seat.shifts.some(s => s._id && s._id.toString() === shiftIdStr)
                                        : (seat.shiftId && seat.shiftId.toString() === shiftIdStr) || seat.shift === shift.name;
                                    const shiftPrice = seat.shiftPrices?.[shift.id] || seat.basePrices?.[shift.id] || 800;
                                    return (
                                        <div key={shift.id} className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
                                            style={{
                                                background: isCurrent ? 'rgba(16,185,129,0.06)' : '#f8fafc',
                                                border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.25)' : '#e2e8f0'}`,
                                            }}>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: isCurrent ? '#059669' : '#374151' }}>{shift.name}</p>
                                                <p className="text-[11px] text-gray-400">{getShiftTimeRange(shift)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isCurrent && <IoCheckmarkCircle className="text-emerald-500" size={15} />}
                                                <span className="font-black text-sm" style={{ color: isCurrent ? '#059669' : '#9ca3af' }}>₹{shiftPrice}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {!isCustom && !shifts.some(s => s.id === 'full') && (
                                    <div className="flex justify-between items-center px-4 py-3 rounded-xl"
                                        style={{ background: seat.shift === 'Full Day' ? 'rgba(16,185,129,0.06)' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <span className="text-sm text-gray-500">Full Day</span>
                                        <span className="font-black text-sm text-gray-400">₹{seat.basePrices?.full || 1200}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN — Room map */}
                    <div className="lg:col-span-3">
                        {room && room.seats ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-2xl overflow-hidden h-full bg-white border border-gray-200 shadow-sm">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-orange-50">
                                            <IoGridOutline size={13} className="text-orange-500" />
                                        </div>
                                        <p className="text-gray-900 font-bold text-sm">Seat Location Map</p>
                                    </div>
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600">
                                        {room?.name || 'Room View'}
                                    </span>
                                </div>
                                <div className="p-6 overflow-x-auto min-h-[600px] flex items-start justify-center">
                                    <StudentRoomGrid room={room} highlightSeatId={seat._id} onSeatClick={() => {}} />
                                </div>
                                <div className="mx-5 mb-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm bg-orange-50 border border-orange-200">
                                    <IoBedOutline size={15} className="text-orange-500 shrink-0" />
                                    <p className="text-orange-700 text-sm">
                                        Your seat <strong className="text-orange-900 font-black">#{seat.number}</strong> is highlighted on the map.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-64 lg:h-full rounded-2xl flex items-center justify-center text-center bg-white border border-gray-200 shadow-sm">
                                <div>
                                    <IoGridOutline size={36} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">Room map not available</p>
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
