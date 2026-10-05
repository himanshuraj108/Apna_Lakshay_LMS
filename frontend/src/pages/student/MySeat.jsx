import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeatSkeleton } from '../../components/ui/SkeletonLoader';
import useShifts from '../../hooks/useShifts';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    IoArrowBack, IoLocationOutline, IoTimeOutline,
    IoCashOutline, IoCheckmarkCircle, IoSadOutline,
    IoBedOutline, IoGridOutline, IoDesktopOutline,
    IoLogOutOutline, IoSwapHorizontalOutline
} from 'react-icons/io5';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';

/* ─── Background ─────────────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F7F3EC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
    </>
);

/* ─── Detail chip ──────────────────────────────────────────────────── */
const DetailChip = ({ icon: Icon, label, value, accentColor }) => (
    <div className="relative flex items-center gap-3.5 rounded-2xl overflow-hidden"
        style={{ padding: '14px 16px', background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: accentColor }} />
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accentColor}18` }}>
            <Icon size={17} style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9B7B5A' }}>{label}</p>
            <p className="font-bold text-sm truncate" style={{ color: '#1A1A1A' }}>{value}</p>
        </div>
    </div>
);

const MySeat = () => {
    const { user } = useAuth();
    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [releasing, setReleasing] = useState(false);
    const { shifts, isCustom, getShiftTimeRange } = useShifts();

    useEffect(() => { fetchSeatData(); }, []);

    const fetchSeatData = async () => {
        try {
            const response = await api.get('/student/seat');
            setSeatData(response.data);
        } catch (error) { console.error('Error fetching seat:', error); }
        finally { setLoading(false); }
    };

    const handleReleaseSeat = async () => {
        if (!window.confirm('Release this desk? You can select another desk whenever you wish.')) return;
        setReleasing(true);
        try {
            await api.delete('/walkin/occupy');
            await fetchSeatData();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to release seat');
        } finally {
            setReleasing(false);
        }
    };

    if (loading) return <SeatSkeleton />;

    const flexShift = seatData?.flexShift || user?.flexShift;
    const isWaiting = seatData?.isWaiting || user?.studentType === 'waitingList' || seatData?.studentType === 'waitingList';
    const isWalkin = !isWaiting && (seatData?.isWalkin || user?.studentType === 'walkin' || Boolean(flexShift?.startTime));

    /* ── No seat ─────────────────────────────────────────────────── */
    if (!seatData?.seat && (!seatData?.tempAssignments || seatData.tempAssignments.length === 0)) {
        if (isWaiting) {
            const shiftTimeStr = flexShift?.startTime && flexShift?.endTime
                ? `${flexShift.startTime} – ${flexShift.endTime}`
                : '';
            return (
                <div className="min-h-screen" style={{ fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
                    <PageBg />
                    <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
                        <Link to="/student">
                            <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-10 cursor-pointer"
                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                                <IoArrowBack size={15} /> Back to Dashboard
                            </motion.button>
                        </Link>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="p-8 rounded-2xl relative overflow-hidden"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(124,58,237,0.08)' }}>
                            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #6d28d9, #8b5cf6)' }} />
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                                    style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#FFFFFF' }}>
                                    <IoTimeOutline size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-[#1A1A1A]">Waiting List Queue</h2>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                                            In Queue
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5">Awaiting Physical Desk Vacancy</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                <DetailChip
                                    icon={IoTimeOutline}
                                    label="Demanded Timing"
                                    value={shiftTimeStr ? `${flexShift?.label ? `${flexShift.label}: ` : ''}${shiftTimeStr}` : 'Preferred Shift'}
                                    accentColor="#7C3AED"
                                />
                                <DetailChip
                                    icon={IoLocationOutline}
                                    label="Desk Status"
                                    value="Awaiting Allotment"
                                    accentColor="#6D28D9"
                                />
                            </div>

                            <div className="p-4 rounded-xl mb-6" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                                <p className="text-xs font-semibold text-purple-950 leading-relaxed">
                                    Your application is currently on the waiting list. Library administration will assign your physical desk and shift as soon as a vacancy is available.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to="/student/find-seat" className="flex-1">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                        style={{ background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' }}>
                                        <IoDesktopOutline size={16} />
                                        <span>Find a Seat</span>
                                    </motion.button>
                                </Link>
                                <Link to="/student" className="flex-1">
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #DDD6FE', color: '#6D28D9' }}>
                                        <span>Dashboard</span>
                                    </motion.button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            );
        }
        if (isWalkin) {
            const shiftTimeStr = flexShift?.startTime && flexShift?.endTime
                ? `${flexShift.startTime} – ${flexShift.endTime}`
                : '';
            return (
                <div className="min-h-screen" style={{ fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
                    <PageBg />
                    <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
                        <Link to="/student">
                            <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-10 cursor-pointer"
                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                                <IoArrowBack size={15} /> Back to Dashboard
                            </motion.button>
                        </Link>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="p-8 rounded-2xl relative overflow-hidden"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #F97316, #EA580C)' }} />
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#FFFFFF' }}>
                                    <IoDesktopOutline size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-[#1A1A1A]">Flexible Seating</h2>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200">
                                            Flex Scholar
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5">Open Seating Membership</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                <DetailChip
                                    icon={IoTimeOutline}
                                    label="Allowed Hours"
                                    value={shiftTimeStr ? `${flexShift.label ? `${flexShift.label}: ` : ''}${shiftTimeStr}` : 'Demanded Window'}
                                    accentColor="#EA580C"
                                />
                                <DetailChip
                                    icon={IoLocationOutline}
                                    label="Desk Space"
                                    value="Any Available Desk"
                                    accentColor="#10B981"
                                />
                            </div>

                            <div className="p-4 rounded-xl mb-6" style={{ background: '#FFFAF5', border: '1px solid #FDDCAE' }}>
                                <p className="text-xs font-semibold text-orange-950 leading-relaxed">
                                    You have a flexible seating allotment. You can choose any unoccupied desk during your allotted shift time.
                                </p>
                            </div>

                            <Link to="/student/find-seat">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                                    <IoDesktopOutline size={16} />
                                    <span>Find a Seat</span>
                                </motion.button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen" style={{ fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
                <PageBg />
                <div className="relative z-10 max-w-2xl mx-auto px-5 py-10">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all mb-10"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                            <IoArrowBack size={15} /> Back to Dashboard
                        </motion.button>
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 px-6 rounded-2xl"
                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: '#FEF3C7' }}>
                            <IoSadOutline size={30} style={{ color: '#F59E0B' }} />
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>No Seat Assigned</h2>
                        <p className="text-sm mb-6" style={{ color: '#9B7B5A' }}>Contact admin to get a seat allocated or search for open desks.</p>
                        <Link to="/student/find-seat">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-white inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                                <IoDesktopOutline size={16} />
                                <span>Find a Seat</span>
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    const displaySeats = [];
    if (seatData.seat && !seatData.seat.isTemporary && (seatData.seat.shifts?.length > 0 || (seatData.seat.shift && seatData.seat.shift !== 'N/A'))) {
        const allShifts = seatData.seat.shifts || (seatData.seat.shift ? [{ name: seatData.seat.shift }] : []);
        const seatNums = seatData.seat.seatNumbers || [seatData.seat.number];
        if (seatNums.length > 1) {
            seatNums.forEach((sn, i) => {
                const deskShifts = allShifts.filter(m => m.seatNumber === sn || (!m.seatNumber && i === 0));
                const label = seatData.seat.room?.roomId ? `${seatData.seat.room.roomId} - ${sn}` : sn;
                displaySeats.push({
                    isTemp: false,
                    isWalkinClaim: Boolean(seatData.seat.isWalkinClaim || seatData.todayWalkin),
                    seat: seatData.seat,
                    number: label,
                    shifts: deskShifts.length > 0 ? deskShifts : allShifts,
                    price: seatData.seat.price || 0,
                    floor: seatData.seat.floor,
                    room: seatData.seat.room,
                });
            });
        } else {
            displaySeats.push({
                isTemp: false,
                isWalkinClaim: Boolean(seatData.seat.isWalkinClaim || seatData.todayWalkin),
                seat: seatData.seat,
                number: seatData.seat.room?.roomId ? `${seatData.seat.room.roomId} - ${seatData.seat.number}` : seatData.seat.number,
                shifts: allShifts,
                price: seatData.seat.shiftPrices?.[seatData.seat.shiftId] || seatData.seat.basePrices?.[seatData.seat.shiftId] || seatData.seat.price || 0,
                floor: seatData.seat.floor,
                room: seatData.seat.room,
            });
        }
    }
    if (seatData.tempAssignments && seatData.tempAssignments.length > 0) {
        seatData.tempAssignments.forEach(ta => {
            displaySeats.push({
                isTemp: true,
                seat: ta.seat,
                number: ta.seat?.room?.roomId ? `${ta.seat.room.roomId} - ${ta.seat.number}` : ta.seat?.room?.name ? `${ta.seat.room.name} - ${ta.seat.number}` : ta.seat?.number || '?',
                shifts: [{ name: ta.shift?.name, startTime: ta.shift?.startTime, endTime: ta.shift?.endTime }],
                price: 0,
                floor: ta.seat?.floor,
                room: ta.seat?.room,
                note: ta.note
            });
        });
    } else if (seatData.seat && seatData.seat.isTemporary) {
        displaySeats.push({
            isTemp: true,
            seat: seatData.seat,
            number: seatData.seat.room?.roomId ? `${seatData.seat.room.roomId} - ${seatData.seat.number}` : seatData.seat.number,
            shifts: seatData.seat.shifts || (seatData.seat.shift ? [{ name: seatData.seat.shift }] : []),
            price: 0,
            floor: seatData.seat.floor,
            room: seatData.seat.room,
            note: seatData.seat.tempNote
        });
    }

    // Use the primary seat for pricing and map view (if available, else first temp seat)
    const primarySeat = displaySeats[0]?.seat || seatData.seat;
    const room = primarySeat?.room;

    return (
        <div className="min-h-screen" style={{ fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                            <IoArrowBack size={15} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black" style={{ color: '#1A1A1A' }}>My Seat</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#9B7B5A' }}>Your assigned study spot</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {[...displaySeats].sort((a, b) => {
                            const aT = [...(a.shifts || [])].sort((x, y) => (x.startTime || '').localeCompare(y.startTime || ''))[0]?.startTime || '99:99';
                            const bT = [...(b.shifts || [])].sort((x, y) => (x.startTime || '').localeCompare(y.startTime || ''))[0]?.startTime || '99:99';
                            return aT.localeCompare(bT);
                        }).map((ds, idx) => (
                            <div key={idx} className="flex flex-col gap-4">
                                {/* Seat number hero */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.1 }}
                                    className="relative rounded-2xl overflow-hidden"
                                    style={{
                                        padding: '20px',
                                        background: '#FFFFFF',
                                        border: `1.5px solid ${ds.isTemp ? '#FECACA' : ds.isWalkinClaim ? '#A7F3D0' : '#FDDCAE'}`,
                                        boxShadow: '0 4px 20px rgba(180,120,60,0.07)'
                                    }}>
                                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                        style={{ background: ds.isTemp ? 'linear-gradient(90deg, #ef4444, #f87171, transparent)' : ds.isWalkinClaim ? 'linear-gradient(90deg, #10b981, #059669, transparent)' : 'linear-gradient(90deg, #f97316, #fb923c, transparent)' }} />
                                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none"
                                        style={{ background: ds.isTemp ? 'rgba(239,68,68,0.06)' : ds.isWalkinClaim ? 'rgba(16,185,129,0.08)' : 'rgba(249,115,22,0.06)' }} />

                                    <div className="relative flex items-center gap-4 pr-28">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5"
                                                style={{ color: ds.isTemp ? '#dc2626' : ds.isWalkinClaim ? '#059669' : '#EA580C' }}>
                                                {ds.isTemp ? 'Temporary Seat No.' : ds.isWalkinClaim ? 'Flexible Desk (Occupied Today)' : 'Seat No.'}
                                            </p>
                                            <p className="text-3xl font-black leading-none truncate" title={ds.number} style={{ color: '#1A1A1A' }}>
                                                {ds.number}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stamp */}
                                    <div className={`absolute top-1/2 right-10 -translate-y-1/2 flex items-center justify-center w-[96px] h-[96px] transform rotate-[-18deg] border-[4px] rounded-full pointer-events-none mix-blend-multiply opacity-70 ${ds.isTemp ? 'border-red-600 text-red-600' : 'border-emerald-600 text-emerald-600'}`}>
                                        <div className={`absolute inset-[3px] border-[1.5px] rounded-full ${ds.isTemp ? 'border-red-600' : 'border-emerald-600'}`} />
                                        <div className="flex flex-col items-center justify-center w-full">
                                            <p className="font-bold text-[6.5px] tracking-[0.2em] uppercase text-center leading-[1.2] mb-[3px]">
                                                APNA LAKSHAY<br/>LIBRARY
                                            </p>
                                            <div className={`w-[85%] h-[1.5px] mb-[3px] ${ds.isTemp ? 'bg-red-600' : 'bg-emerald-600'}`} />
                                            <p className="font-black text-[11px] tracking-widest uppercase text-center" style={{ transform: 'scaleY(1.2)' }}>
                                                {ds.isTemp ? 'TEMPORARY' : ds.isWalkinClaim ? 'OCCUPIED' : 'CONFIRMED'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative mt-4 pt-4" style={{ borderTop: '1px solid #EDE8E0' }}>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full animate-pulse ${ds.isTemp ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                                <span className={`text-xs font-semibold ${ds.isTemp ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {ds.isWalkinClaim ? 'Occupied & Checked In' : 'Active'}
                                                </span>
                                            </div>
                                            {ds.isWalkinClaim && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleReleaseSeat}
                                                        disabled={releasing}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <IoLogOutOutline size={13} />
                                                        <span>{releasing ? 'Releasing...' : 'Release Desk'}</span>
                                                    </button>
                                                    <Link to="/student/find-seat">
                                                        <button className="px-2.5 py-1 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1 cursor-pointer">
                                                            <IoSwapHorizontalOutline size={13} />
                                                            <span>Change</span>
                                                        </button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        {ds.shifts && ds.shifts.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {ds.shifts.map((s, i) => (
                                                    <span key={i} className="inline-flex flex-col px-3 py-1.5 rounded-xl text-xs font-bold"
                                                        style={{ 
                                                            background: ds.isTemp ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', 
                                                            border: `1px solid ${ds.isTemp ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, 
                                                            color: ds.isTemp ? '#dc2626' : '#059669' 
                                                        }}>
                                                        <span>{s.name}</span>
                                                        {s.startTime && s.endTime && (
                                                            <span className={`text-[10px] font-normal mt-0.5 ${ds.isTemp ? 'text-red-500' : 'text-emerald-500'}`}>{s.startTime}–{s.endTime}</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs" style={{ color: '#9B7B5A' }}>—</span>
                                        )}
                                        {ds.isTemp && ds.note && (
                                            <p className="mt-3 text-xs italic text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{ds.note}</p>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Detail chips */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + idx * 0.1 }}
                                    className="flex flex-col gap-3">
                                    <DetailChip icon={IoLocationOutline} label="Location" value={`${ds.floor?.name || 'Floor'}, ${ds.room?.roomId || ds.room?.name || 'Room'}`} accentColor="#3b82f6" />
                                    {ds.shifts && ds.shifts.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {ds.shifts.map((s, i) => (
                                                <div key={i} className="relative flex items-center gap-3.5 rounded-2xl overflow-hidden"
                                                    style={{ padding: '14px 16px', background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                                    <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${ds.isTemp ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ds.isTemp ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                                        <IoTimeOutline size={17} className={ds.isTemp ? 'text-red-500' : 'text-emerald-500'} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9B7B5A' }}>Shift {i + 1}</p>
                                                        <p className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{s.name}</p>
                                                        {s.startTime && s.endTime && (
                                                            <p className={`text-[11px] font-semibold mt-0.5 ${ds.isTemp ? 'text-red-600' : 'text-emerald-600'}`}>{s.startTime} – {s.endTime}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                    {ds.isWalkinClaim ? (
                                        <DetailChip icon={IoDesktopOutline} label="Membership Type" value="Flexible Seating Allotment" accentColor="#10B981" />
                                    ) : !ds.isTemp ? (
                                        <DetailChip icon={IoCashOutline} label="Monthly Fee" value={`₹${ds.price}`} accentColor="#f59e0b" />
                                    ) : null}
                                </motion.div>
                            </div>
                        ))}

                        {/* Pricing plans - Only show for primary seat */}
                        {seatData.seat && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                                className="rounded-2xl overflow-hidden mt-2"
                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid #EDE8E0' }}>
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                        <IoCashOutline size={13} style={{ color: '#FFFFFF' }} />
                                    </div>
                                    <p className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Pricing Plans</p>
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    {shifts.map(shift => {
                                        const shiftIdStr = (shift._id || shift.id || '').toString();
                                        const isCurrent = seatData.seat.shifts
                                            ? seatData.seat.shifts.some(s => s._id && s._id.toString() === shiftIdStr)
                                            : (seatData.seat.shiftId && seatData.seat.shiftId.toString() === shiftIdStr) || seatData.seat.shift === shift.name;
                                        const shiftPrice = seatData.seat.shiftPrices?.[shift.id] || seatData.seat.basePrices?.[shift.id] || 800;
                                        return (
                                            <div key={shift.id} className="flex justify-between items-center px-4 py-3 rounded-xl transition-all"
                                                style={{
                                                    background: isCurrent ? 'rgba(16,185,129,0.06)' : '#F5F0EA',
                                                    border: `1px solid ${isCurrent ? 'rgba(16,185,129,0.25)' : '#EDE8E0'}`,
                                                }}>
                                                <div>
                                                    <p className="text-sm font-semibold" style={{ color: isCurrent ? '#059669' : '#1A1A1A' }}>{shift.name}</p>
                                                    <p className="text-[11px]" style={{ color: '#9B7B5A' }}>{getShiftTimeRange(shift)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isCurrent && <IoCheckmarkCircle className="text-emerald-500" size={15} />}
                                                    <span className="font-black text-sm" style={{ color: isCurrent ? '#059669' : '#9B7B5A' }}>₹{shiftPrice}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!isCustom && !shifts.some(s => s.id === 'full') && (
                                        <div className="flex justify-between items-center px-4 py-3 rounded-xl"
                                            style={{ background: seatData.seat.shift === 'Full Day' ? 'rgba(16,185,129,0.06)' : '#F5F0EA', border: '1px solid #EDE8E0' }}>
                                            <span className="text-sm" style={{ color: '#9B7B5A' }}>Full Day</span>
                                            <span className="font-black text-sm" style={{ color: '#9B7B5A' }}>₹{seatData.seat.basePrices?.full || 1200}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* RIGHT COLUMN — Room map */}
                    <div className="lg:col-span-3">
                        {room && room.seats ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="rounded-2xl overflow-hidden h-full"
                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDE8E0' }}>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                            <IoGridOutline size={13} style={{ color: '#FFFFFF' }} />
                                        </div>
                                        <p className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Seat Location Map</p>
                                    </div>
                                    <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                                        style={{ background: '#FEF3C7', border: '1px solid #FDDCAE', color: '#EA580C' }}>
                                        {room?.name || 'Room View'}
                                    </span>
                                </div>
                                <div className="p-6 overflow-x-auto min-h-[600px] flex items-start justify-center">
                                    <StudentRoomGrid
                                        room={room}
                                        highlightSeatNumbers={seatData.seat?.seatNumbers?.length > 0 ? seatData.seat.seatNumbers : (seatData.seat?.number ? [seatData.seat.number] : [])}
                                        onSeatClick={() => {}}
                                    />
                                </div>
                                <div className="mx-5 mb-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm"
                                    style={{ background: '#FEF3C7', border: '1px solid #FDDCAE' }}>
                                    <IoBedOutline size={15} style={{ color: '#EA580C' }} className="shrink-0" />
                                    <p className="text-sm" style={{ color: '#92400E' }}>
                                        {(seatData.seat?.seatNumbers?.length > 1)
                                             ? <>Your seats <strong className="font-black" style={{ color: '#78350F' }}>#{seatData.seat.seatNumbers.join(' & #')}</strong> are highlighted on the map.</>
                                             : <>Your seat <strong className="font-black" style={{ color: '#78350F' }}>#{room.roomId ? `${room.roomId} - ${primarySeat.number}` : primarySeat.number}</strong> is highlighted on the map.</>
                                        }
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-64 lg:h-full rounded-2xl flex items-center justify-center text-center"
                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                <div>
                                    <IoGridOutline size={36} className="mx-auto mb-3" style={{ color: '#FDDCAE' }} />
                                    <p className="text-sm" style={{ color: '#9B7B5A' }}>Room map not available</p>
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
