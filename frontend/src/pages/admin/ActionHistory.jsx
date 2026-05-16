import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    IoArrowBack, IoSearch, IoFilter, IoCalendarOutline,
    IoPersonOutline, IoInformationCircleOutline, IoTrashOutline,
    IoTimeOutline, IoChevronDownOutline
} from 'react-icons/io5';

const PAGE_BG = { background: '#F8FAFC' };
const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-purple-500/50 outline-none transition-all placeholder-gray-700";

const ACTION_STYLES = {
    student_created: { label: 'Student Created', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    student_updated: { label: 'Student Updated', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    student_deleted_soft: { label: 'Soft Deleted', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    student_deleted_hard: { label: 'Hard Deleted', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    seat_assigned: { label: 'Seat Assigned', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    seat_freed: { label: 'Seat Freed', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    fee_marked_paid: { label: 'Fee Paid', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    request_approved: { label: 'Req. Approved', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    request_rejected: { label: 'Req. Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    notification_sent: { label: 'Notif. Sent', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    attendance_marked: { label: 'Attendance', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
};

const ActionHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', action: '', search: '' });

    useEffect(() => { fetchLogs(); }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (filters.startDate) q.append('startDate', filters.startDate);
            if (filters.endDate) q.append('endDate', filters.endDate);
            if (filters.action) q.append('action', filters.action);
            if (filters.search) q.append('search', filters.search);
            const res = await api.get(`/admin/action-history?${q}`);
            if (res.data.success) setLogs(res.data.logs);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this log entry permanently?')) return;
        try {
            await api.delete(`/admin/action-history/${id}`);
            setLogs(prev => prev.filter(l => l._id !== id));
        } catch (e) { alert('Failed to delete log'); }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('Delete ALL action history? This cannot be undone.')) return;
        try {
            await api.delete('/admin/action-history/clear');
            setLogs([]);
        } catch (e) { alert('Failed to clear history'); }
    };

    const set = (k, v) => setFilters(p => ({ ...p, [k]: v }));
    const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-6%] w-[500px] h-[500px] rounded-full bg-purple-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] right-[-6%] w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Admin</span>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Action History</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-600">Showing last 100 actions</span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleClearHistory} disabled={loading || logs.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all">
                            <IoTrashOutline size={15} /> Clear All
                        </motion.button>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 mb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoSearch size={10} /> Search</label>
                            <input value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Name or details…" className={INPUT} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoFilter size={10} /> Action Type</label>
                            <select value={filters.action} onChange={e => set('action', e.target.value)} className={INPUT} style={{ background: '#0d0d10' }}>
                                <option value="">All Actions</option>
                                {Object.entries(ACTION_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoCalendarOutline size={10} /> Start Date</label>
                            <input type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoCalendarOutline size={10} /> End Date</label>
                            <input type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} className={INPUT} />
                        </div>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-white/3 rounded-xl animate-pulse" />)}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {['Time', 'Admin', 'Action', 'Target', 'Details', ''].map(h => (
                                            <th key={h || 'del'} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={6} className="py-12 text-center text-gray-500">No actions match your criteria</td></tr>
                                    ) : logs.map(log => {
                                        const a = ACTION_STYLES[log.action] || { label: log.action, color: 'text-gray-400 bg-white/5 border-white/10' };
                                        return (
                                            <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="border-b border-gray-100 hover:bg-white/3 transition-colors">
                                                <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap"><IoTimeOutline className="inline mr-1" size={12} />{fmt(log.createdAt)}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="flex items-center gap-1.5 text-purple-300 text-sm"><IoPersonOutline size={14} />{log.adminName}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${a.color}`}>{a.label}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-700">
                                                    {log.targetName || '–'}
                                                    {log.targetModel && <span className="text-[10px] text-gray-600 block">{log.targetModel}</span>}
                                                </td>
                                                <td className="px-5 py-3.5 max-w-xs">
                                                    <span className="text-xs text-gray-500 line-clamp-2"><IoInformationCircleOutline className="inline mr-1" size={12} />{log.details}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(log._id)}
                                                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                                        <IoTrashOutline size={15} />
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ActionHistory;
