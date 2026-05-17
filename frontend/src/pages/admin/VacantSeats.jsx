import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoBedOutline, IoSearchOutline,
    IoRefreshOutline, IoLayersOutline, IoTimeOutline,
    IoGridOutline, IoListOutline, IoCheckmarkCircle,
    IoCloseCircle, IoChevronDown, IoOpenOutline, IoInformationCircleOutline
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

// ─── Main Component ───────────────────────────────────────────────────────────
const VacantSeats = () => {
    const backPath = useBackPath();
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');
    const [filterFloor, setFloor] = useState('all');
    const [filterShift, setShift] = useState('all');
    const [acFilter, setAcFilter] = useState(null);
    const [viewMode, setView]     = useState('grid');

    useEffect(() => { fetchVacant(); }, []);

    const fetchVacant = async () => {
        setLoading(true); setError('');
        try { const r = await api.get('/admin/vacant-seats'); setData(r.data); }
        catch { setError('Failed to load data. Please refresh.'); }
        finally { setLoading(false); }
    };

    const floors = useMemo(() => {
        if (!data) return [];
        return [...new Map(data.vacantSlots.map(s => [s.floorId, { id: s.floorId, name: s.floorName }])).values()];
    }, [data]);

    const shifts = useMemo(() => {
        if (!data) return [];
        return [...new Map(data.vacantSlots.map(s => [s.shiftId, { id: s.shiftId, name: s.shiftName }])).values()];
    }, [data]);

    const shiftSlots = useMemo(() => {
        if (!data || filterShift === 'all') return [];
        return data.vacantSlots.filter(s => s.shiftId === filterShift);
    }, [data, filterShift]);

    const filtered = useMemo(() => {
        return shiftSlots.filter(slot => {
            const mQ = !search ||
                slot.seatNumber.toLowerCase().includes(search.toLowerCase()) ||
                slot.roomName.toLowerCase().includes(search.toLowerCase()) ||
                slot.floorName.toLowerCase().includes(search.toLowerCase());
            const mAc = acFilter === null || (acFilter === 'ac' ? slot.hasAc : !slot.hasAc);
            return mQ && mAc;
        });
    }, [shiftSlots, search, acFilter]);

    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(slot => {
            if (!map[slot.floorName]) map[slot.floorName] = [];
            map[slot.floorName].push(slot);
        });
        return map;
    }, [filtered]);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Link to={backPath}>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 transition-all">
                                <IoArrowBack size={16} /> Back to Dashboard
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium">
                            <IoCloseCircle size={18} />{error}
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Shift Cards — Step 1 */}
                {data && data.shiftSummary.length > 0 && (
                    <div className="mb-7">

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {data.shiftSummary.map(shift => {
                                const pct = Math.round((shift.vacant / (shift.total || 1)) * 100);
                                const isActive = filterShift === shift.shiftId;
                                const barColor = pct > 60 ? '#16a34a' : pct > 30 ? '#d97706' : '#dc2626';
                                return (
                                    <div key={shift.shiftId}
                                        onClick={() => setShift(isActive ? 'all' : shift.shiftId)}
                                        className={`rounded-xl p-4 cursor-pointer border-2 transition-all select-none ${
                                            isActive
                                                ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100'
                                                : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-sm'
                                        }`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className={`text-sm font-bold ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>{shift.shiftName}</p>
                                            {isActive
                                                ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white">Selected</span>
                                                : <span className="text-[10px] font-semibold text-gray-400">Click to filter</span>
                                            }
                                        </div>
                                        <div className={`inline-block px-2 py-1 rounded text-[11px] font-bold tracking-wide mb-3 border ${isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {shift.shiftTime}
                                        </div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-gray-600">{shift.vacant} empty out of {shift.total} seats</span>
                                            <span className="text-xs font-black" style={{ color: barColor }}>{pct}% free</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}





                {/* Results Popup Modal */}
                <AnimatePresence>
                    {filterShift !== 'all' && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-gray-50 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200 shadow-sm z-10">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            {acFilter !== null && (
                                                <button onClick={() => setAcFilter(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" title="Back to AC Selection">
                                                    <IoArrowBack size={20} />
                                                </button>
                                            )}
                                            <h2 className="text-xl font-black text-gray-900">
                                                Available Seats — <span className="text-green-700">{shifts.find(s => s.id === filterShift)?.name || 'Shift'}</span>
                                            </h2>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 font-medium ml-10">{acFilter === null ? shiftSlots.length : filtered.length} vacant seats found</p>
                                    </div>
                                    <button onClick={() => { setShift('all'); setAcFilter(null); }} className="flex items-center gap-1.5 p-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm font-bold">
                                        <IoCloseCircle size={32} />
                                        <span className="pr-2 text-sm uppercase tracking-wide">Close</span>
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                                    {loading ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                            {[...Array(12)].map((_, i) => (
                                                <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : acFilter === null ? (
                                        <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto py-12">
                                            {/* AC Card */}
                                            <div onClick={() => setAcFilter('ac')} className="flex-1 bg-white border-2 border-orange-200 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] rounded-3xl p-8 cursor-pointer shadow-sm transition-all group flex flex-col items-center justify-center text-center">
                                                <div className="w-24 h-24 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-sky-100 transition-all">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900 mb-2">AC Rooms</h3>
                                                <p className="text-gray-500 font-bold">{shiftSlots.filter(s => s.hasAc).length} vacant seats</p>
                                            </div>

                                            {/* Non-AC Card */}
                                            <div onClick={() => setAcFilter('non-ac')} className="flex-1 bg-white border-2 border-orange-200 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] rounded-3xl p-8 cursor-pointer shadow-sm transition-all group flex flex-col items-center justify-center text-center">
                                                <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-100 transition-all">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900 mb-2">Non-AC Rooms</h3>
                                                <p className="text-gray-500 font-bold">{shiftSlots.filter(s => !s.hasAc).length} vacant seats</p>
                                            </div>
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                            <IoCheckmarkCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                                            <p className="text-gray-800 font-bold text-lg">No vacant seats in this shift</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {Object.entries(grouped).map(([floorName, slots]) => (
                                                <div key={floorName}>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5">
                                                            <IoLayersOutline size={14} className="text-purple-600" />
                                                            <span className="text-sm font-bold text-purple-700">{floorName}</span>
                                                        </div>
                                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700">
                                                            {slots.length} seat{slots.length !== 1 ? 's' : ''} available
                                                        </span>
                                                        <div className="flex-1 h-px bg-gray-200" />
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                                        {slots.map((slot, i) => (
                                                            <motion.div key={`${slot.seatId}-${slot.shiftId}`}
                                                                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: i * 0.02 }}
                                                                whileHover={{ y: -3 }}
                                                                className={`relative bg-white border-2 rounded-xl p-4 shadow-sm transition-all ${
                                                                    slot.isPartial ? 'border-amber-300' : 'border-emerald-300'
                                                                }`}>
                                                                {/* Color bar at top */}
                                                                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl ${slot.isPartial ? 'bg-amber-400' : 'bg-emerald-500'}`} />

                                                                {/* Seat Number */}
                                                                <p className="text-gray-900 font-black text-2xl leading-none mt-1 mb-1">
                                                                    {slot.seatNumber}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400 font-medium mb-2 truncate">{slot.roomName}</p>

                                                                {/* Shift */}
                                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md w-fit ${
                                                                    slot.isPartial
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                }`}>
                                                                    {slot.shiftName}
                                                                </div>

                                                                {/* Partial warning */}
                                                                {slot.isPartial && (
                                                                    <div className="mt-1.5 text-[9px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                                                                        One shift already taken
                                                                    </div>
                                                                )}

                                                                {/* Price */}
                                                                {slot.price > 0 && (
                                                                    <p className="text-xs text-gray-500 mt-2 font-semibold">
                                                                        ₹{slot.price}<span className="font-normal text-gray-400">/month</span>
                                                                    </p>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default VacantSeats;
