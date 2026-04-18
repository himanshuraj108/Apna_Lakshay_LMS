import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoBedOutline, IoSearchOutline, IoFilterOutline,
    IoRefreshOutline, IoLayersOutline, IoTimeOutline, IoGridOutline,
    IoListOutline, IoCheckmarkCircle, IoCloseCircle, IoChevronDown
} from 'react-icons/io5';

const PAGE_BG = { background: '#050508' };

const PublicVacantSeats = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterFloor, setFilterFloor] = useState('all');
    const [filterShift, setFilterShift] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    useEffect(() => { fetchVacant(); }, []);

    const fetchVacant = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/public/office/vacant-seats');
            setData(res.data);
        } catch (e) {
            setError('Failed to load vacant seats data');
        } finally {
            setLoading(false);
        }
    };

    // Build unique floors & shifts for filter dropdowns
    const floors = useMemo(() => {
        if (!data) return [];
        const unique = [...new Map(data.vacantSlots.map(s => [s.floorId, { id: s.floorId, name: s.floorName }])).values()];
        return unique;
    }, [data]);

    const shifts = useMemo(() => {
        if (!data) return [];
        const unique = [...new Map(data.vacantSlots.map(s => [s.shiftId, { id: s.shiftId, name: s.shiftName, time: s.shiftTime }])).values()];
        return unique;
    }, [data]);

    // Filter logic
    const filtered = useMemo(() => {
        if (!data) return [];
        return data.vacantSlots.filter(slot => {
            const matchFloor = filterFloor === 'all' || slot.floorId === filterFloor;
            const matchShift = filterShift === 'all' || slot.shiftId === filterShift;
            const matchSearch = !search ||
                slot.seatNumber.toLowerCase().includes(search.toLowerCase()) ||
                slot.roomName.toLowerCase().includes(search.toLowerCase()) ||
                slot.floorName.toLowerCase().includes(search.toLowerCase());
            return matchFloor && matchShift && matchSearch;
        });
    }, [data, filterFloor, filterShift, search]);

    // Group by floor for grid view
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(slot => {
            const key = slot.floorName;
            if (!map[key]) map[key] = [];
            map[key].push(slot);
        });
        return map;
    }, [filtered]);

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-12%] right-[-6%] w-[500px] h-[500px] rounded-full bg-emerald-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-3xl" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.018) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">

                {/* ── Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> Home
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg">
                                    <IoBedOutline size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Public Office</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Vacant Seats</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Real-time seat availability by shift</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={fetchVacant}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                        <IoRefreshOutline size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </motion.button>
                </motion.div>

                {/* ── Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                            <IoCloseCircle size={18} />{error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Summary Stat Cards */}
                {data && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
                        {[
                            { label: 'Total Seats', value: data.stats.totalSeats, color: 'from-blue-500 to-purple-500', glow: 'rgba(99,102,241,0.3)' },
                            { label: 'Occupied', value: data.stats.occupiedSeats, color: 'from-red-500 to-rose-500', glow: 'rgba(239,68,68,0.3)' },
                            { label: 'Vacant Slots', value: data.stats.vacantSlots, color: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.3)' },
                            { label: 'Vacancy Rate', value: `${data.stats.vacancyRate}%`, color: 'from-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.3)' },
                        ].map(({ label, value, color, glow }, i) => (
                            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className="relative bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60`} />
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                                <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Shift Summary Pills */}
                {data && data.shiftSummary.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="mb-7 bg-white/3 border border-white/8 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <IoTimeOutline size={15} className="text-cyan-400" />
                            <p className="text-white font-bold text-sm">Vacant Slots by Shift</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {data.shiftSummary.map(shift => {
                                const pct = Math.round((shift.vacant / (shift.total || 1)) * 100);
                                const barColor = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={shift.shiftId}
                                        className="bg-white/4 border border-white/8 rounded-xl p-4 cursor-pointer hover:border-white/16 transition-all"
                                        onClick={() => setFilterShift(filterShift === shift.shiftId ? 'all' : shift.shiftId)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-bold text-white">{shift.shiftName}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${filterShift === shift.shiftId ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400' : 'bg-white/5 border border-white/10 text-gray-400'}`}>
                                                {filterShift === shift.shiftId ? 'Active' : 'Click'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mb-3">{shift.shiftTime}</p>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400">{shift.vacant} vacant / {shift.total} total</span>
                                            <span className="text-xs font-bold" style={{ color: barColor }}>{pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, background: barColor }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Filters + Search + View Toggle */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <IoSearchOutline size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search seat, room, floor…"
                            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-all"
                        />
                    </div>

                    {/* Floor filter */}
                    <div className="relative">
                        <IoLayersOutline size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)}
                            className="pl-8 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                            style={{ backgroundColor: '#0d0d12', colorScheme: 'dark' }}>
                            <option value="all">All Floors</option>
                            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <IoChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Shift filter */}
                    <div className="relative">
                        <IoTimeOutline size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select value={filterShift} onChange={e => setFilterShift(e.target.value)}
                            className="pl-8 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                            style={{ backgroundColor: '#0d0d12', colorScheme: 'dark' }}>
                            <option value="all">All Shifts</option>
                            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <IoChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>

                    {/* Result count */}
                    <span className="text-xs text-gray-500 font-medium">{filtered.length} slot{filtered.length !== 1 ? 's' : ''}</span>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                        <button onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <IoGridOutline size={15} />
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <IoListOutline size={15} />
                        </button>
                    </div>
                </motion.div>

                {/* ── Content */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/3 border border-white/8 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 bg-white/3 border border-white/8 rounded-2xl">
                        <IoCheckmarkCircle size={40} className="text-emerald-500/40 mx-auto mb-3" />
                        <p className="text-gray-400 font-semibold">No vacant slots found</p>
                        <p className="text-gray-600 text-sm mt-1">All seats are occupied or no match for filters</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* GRID VIEW — grouped by floor */
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([floorName, slots]) => (
                            <motion.div key={floorName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <IoLayersOutline size={14} className="text-purple-400" />
                                    <h3 className="text-sm font-bold text-white">{floorName}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        {slots.length} vacant
                                    </span>
                                    <div className="flex-1 h-px bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {slots.map((slot, i) => (
                                        <motion.div key={`${slot.seatId}-${slot.shiftId}`}
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            whileHover={{ y: -3, scale: 1.03 }}
                                            className={`relative border rounded-xl p-3 group transition-all cursor-default ${
                                                slot.isPartial
                                                    ? 'bg-amber-500/5 border-amber-500/25 hover:bg-amber-500/10 hover:border-amber-500/40'
                                                    : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/35'
                                            }`}>
                                            <div className={`absolute top-0 left-0 right-0 h-px rounded-t-xl bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity ${
                                                slot.isPartial ? 'from-amber-400 to-orange-400' : 'from-emerald-400 to-teal-400'
                                            }`} />
                                            <p className="text-white font-black text-lg leading-none mb-1">{slot.seatNumber}</p>
                                            <p className="text-[10px] text-gray-500 mb-1.5 truncate">{slot.roomName}</p>
                                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 truncate max-w-full">
                                                {slot.shiftName}
                                            </span>
                                            {slot.isPartial && (
                                                <span className="block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
                                                    Partial
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {['Seat', 'Room', 'Floor', 'Shift', 'Shift Time'].map(h => (
                                            <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((slot, i) => (
                                        <motion.tr key={`${slot.seatId}-${slot.shiftId}`}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <span className="font-black text-white text-sm">{slot.seatNumber}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-400">{slot.roomName}</td>
                                            <td className="px-5 py-3.5 text-sm text-gray-400">{slot.floorName}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                                    {slot.shiftName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500">{slot.shiftTime}</td>
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

export default PublicVacantSeats;
