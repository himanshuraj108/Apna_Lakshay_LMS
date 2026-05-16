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

// ─── Color Legend ─────────────────────────────────────────────────────────────
const Legend = () => (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <span className="font-bold text-blue-700 flex items-center gap-1.5">
            <IoInformationCircleOutline size={16} /> How to read seat colors:
        </span>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500 flex-shrink-0" />
            <span className="text-gray-700"><b>Green</b> = Fully free for this shift</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-400 flex-shrink-0" />
            <span className="text-gray-700"><b>Yellow</b> = Partially free (one shift is taken, other is open)</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300 flex-shrink-0" />
            <span className="text-gray-500">Occupied seats are not shown here</span>
        </div>
    </div>
);

// ─── Step Guide ───────────────────────────────────────────────────────────────
const StepGuide = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        {[
            { step: '1', title: 'Choose a shift', desc: 'Click one of the shift cards below to see seats for that time slot only.' },
            { step: '2', title: 'Use filters if needed', desc: 'Use the Floor or Search filters to narrow down by location or seat number.' },
            { step: '3', title: 'Note the seat number', desc: 'Each card shows the seat number, room name, and monthly price. Assign the student to that seat.' },
        ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">{step}</div>
                <div>
                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
            </div>
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const VacantSeats = () => {
    const backPath = useBackPath();
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');
    const [filterFloor, setFloor] = useState('all');
    const [filterShift, setShift] = useState('all');
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

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.vacantSlots.filter(slot => {
            const mF = filterFloor === 'all' || slot.floorId === filterFloor;
            const mS = filterShift === 'all' || slot.shiftId === filterShift;
            const mQ = !search ||
                slot.seatNumber.toLowerCase().includes(search.toLowerCase()) ||
                slot.roomName.toLowerCase().includes(search.toLowerCase()) ||
                slot.floorName.toLowerCase().includes(search.toLowerCase());
            return mF && mS && mQ;
        });
    }, [data, filterFloor, filterShift, search]);

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
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-emerald-500 rounded-lg">
                                    <IoBedOutline size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Seat Availability</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Vacant Seats</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Shows all available seat slots across floors and shifts — updated live</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/office/vacant-seats" target="_blank">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all">
                                <IoOpenOutline size={16} /> Public View
                            </button>
                        </Link>
                        <button onClick={fetchVacant}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 transition-all">
                            <IoRefreshOutline size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
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

                {/* Step Guide */}
                <StepGuide />

                {/* Color Legend */}
                <div className="mb-6"><Legend /></div>

                {/* Summary Stats */}
                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
                        {[
                            { label: 'Total Seats in Library', value: data.stats.totalSeats, border: 'border-gray-300', bg: 'bg-white', num: 'text-gray-900' },
                            { label: 'Currently Occupied', value: data.stats.occupiedSeats, border: 'border-red-200', bg: 'bg-red-50', num: 'text-red-700' },
                            { label: 'Vacant Slots Available', value: data.stats.vacantSlots, border: 'border-emerald-200', bg: 'bg-emerald-50', num: 'text-emerald-700' },
                            { label: 'Overall Vacancy %', value: `${data.stats.vacancyRate}%`, border: 'border-amber-200', bg: 'bg-amber-50', num: 'text-amber-700' },
                        ].map(({ label, value, border, bg, num }) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                className={`${bg} border-2 ${border} rounded-2xl p-5 shadow-sm`}>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                                <p className={`text-4xl font-black ${num}`}>{value}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Shift Cards — Step 1 */}
                {data && data.shiftSummary.length > 0 && (
                    <div className="mb-7">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">1</div>
                            <p className="font-bold text-gray-900">Select a Shift to filter seats</p>
                            <span className="text-xs text-gray-400 font-normal">— click any card below</span>
                            {filterShift !== 'all' && (
                                <button onClick={() => setShift('all')}
                                    className="ml-auto text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-600 transition-all font-medium">
                                    Clear filter — show all shifts
                                </button>
                            )}
                        </div>
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
                                        <p className="text-xs text-gray-500 mb-3">{shift.shiftTime}</p>
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

                {/* Filter Bar — Step 2 */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">2</div>
                        <p className="font-bold text-gray-900">Filter by floor or search for a specific seat</p>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <div className="relative flex-1 min-w-[200px]">
                            <IoSearchOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Type seat number, room name, or floor name…"
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-all" />
                        </div>

                        <div className="relative">
                            <IoLayersOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select value={filterFloor} onChange={e => setFloor(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-indigo-400 appearance-none cursor-pointer font-medium">
                                <option value="all">All Floors</option>
                                {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <IoChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <IoTimeOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select value={filterShift} onChange={e => setShift(e.target.value)}
                                className="pl-8 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-indigo-400 appearance-none cursor-pointer font-medium">
                                <option value="all">All Shifts</option>
                                {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <IoChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700">
                            {filtered.length} vacant slot{filtered.length !== 1 ? 's' : ''} found
                        </div>

                        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            <button onClick={() => setView('grid')} title="Grid view"
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <IoGridOutline size={15} /> Grid
                            </button>
                            <button onClick={() => setView('list')} title="Table view"
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                <IoListOutline size={15} /> Table
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Step 3 heading */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">3</div>
                    <p className="font-bold text-gray-900">Available seats — note the seat number and room</p>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
                        <IoCheckmarkCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                        <p className="text-gray-800 font-bold text-lg">No vacant seats match your filters</p>
                        <p className="text-gray-500 text-sm mt-1">Try clearing the floor or shift filter above</p>
                    </div>
                ) : viewMode === 'grid' ? (

                    <div className="space-y-8">
                        {Object.entries(grouped).map(([floorName, slots]) => (
                            <motion.div key={floorName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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

                                            {/* Seat Number — the most important info */}
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
                            </motion.div>
                        ))}
                    </div>

                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                                        {['Seat No.', 'Room', 'Floor', 'Shift', 'Shift Timing', 'Availability', 'Price/Month'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-left whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((slot, i) => (
                                        <motion.tr key={`${slot.seatId}-${slot.shiftId}`}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="font-black text-gray-900 text-xl">{slot.seatNumber}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700 font-medium">{slot.roomName}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{slot.floorName}</td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700">
                                                    {slot.shiftName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{slot.shiftTime}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    slot.isPartial
                                                        ? 'bg-amber-100 border border-amber-200 text-amber-700'
                                                        : 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                                                }`}>
                                                    {slot.isPartial ? 'Partially Free' : 'Fully Free'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-gray-800">
                                                {slot.price > 0 ? `₹${slot.price}` : <span className="text-gray-400 font-normal">Not set</span>}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VacantSeats;
