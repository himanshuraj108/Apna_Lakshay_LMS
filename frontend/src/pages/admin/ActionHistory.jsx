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
const INPUT = "w-full bg-white border border-[#E2DBD2] rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all shadow-2xs font-medium placeholder:text-stone-400";

const ACTION_STYLES = {
    student_created: { label: 'Student Created', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    student_updated: { label: 'Student Updated', color: 'text-amber-800 bg-amber-50 border-amber-200' },
    student_deleted_soft: { label: 'Soft Deleted', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    student_deleted_hard: { label: 'Hard Deleted', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    seat_assigned: { label: 'Seat Assigned', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    seat_freed: { label: 'Seat Freed', color: 'text-amber-800 bg-amber-50 border-amber-200' },
    fee_marked_paid: { label: 'Fee Paid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    request_approved: { label: 'Req. Approved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    request_rejected: { label: 'Req. Rejected', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    notification_sent: { label: 'Notif. Sent', color: 'text-sky-700 bg-sky-50 border-sky-200' },
    attendance_marked: { label: 'Attendance', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
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
        <div className="relative min-h-screen" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <button
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                                <IoArrowBack size={16} /> Back
                            </button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                    <IoTimeOutline size={14} />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Audit Trail</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Action History</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-400 font-medium">Showing last 100 actions</span>
                        <button
                            onClick={handleClearHistory} disabled={loading || logs.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-bold disabled:opacity-40 transition-all cursor-pointer shadow-2xs">
                            <IoTrashOutline size={15} /> Clear All
                        </button>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl p-5 mb-5 shadow-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoSearch size={11} className="text-orange-500" /> Search</label>
                            <input value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Name or details…" className={INPUT} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoFilter size={11} className="text-orange-500" /> Action Type</label>
                            <select value={filters.action} onChange={e => set('action', e.target.value)} className={INPUT}>
                                <option value="">All Actions</option>
                                {Object.entries(ACTION_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoCalendarOutline size={11} className="text-orange-500" /> Start Date</label>
                            <input type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} className={INPUT} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1 mb-1.5"><IoCalendarOutline size={11} className="text-orange-500" /> End Date</label>
                            <input type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} className={INPUT} />
                        </div>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-xs">
                    {loading ? (
                        <div className="p-6 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-stone-50 rounded-xl animate-pulse" />)}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#EDE8E0] bg-[#FAF6F0]">
                                        {['Time', 'Admin', 'Action', 'Target', 'Details', ''].map(h => (
                                            <th key={h || 'del'} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={6} className="py-12 text-center text-stone-400 text-xs">No actions match your criteria</td></tr>
                                    ) : logs.map(log => {
                                        const a = ACTION_STYLES[log.action] || { label: log.action, color: 'text-stone-600 bg-stone-100 border-[#EDE8E0]' };
                                        return (
                                            <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="border-b border-[#EDE8E0]/60 hover:bg-[#FAF6F0]/80 transition-colors">
                                                <td className="px-5 py-3.5 text-xs text-stone-500 whitespace-nowrap"><IoTimeOutline className="inline mr-1 text-stone-400" size={12} />{fmt(log.createdAt)}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="flex items-center gap-1.5 text-stone-800 font-bold text-xs"><IoPersonOutline size={14} className="text-orange-500" />{log.adminName}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${a.color}`}>{a.label}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-stone-800 font-semibold">
                                                    {log.targetName || '–'}
                                                    {log.targetModel && <span className="text-[10px] text-stone-400 font-medium block">{log.targetModel}</span>}
                                                </td>
                                                <td className="px-5 py-3.5 max-w-xs">
                                                    <span className="text-xs text-stone-600 line-clamp-2 leading-relaxed"><IoInformationCircleOutline className="inline mr-1 text-stone-400" size={12} />{log.details}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button onClick={() => handleDelete(log._id)}
                                                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                                        title="Delete log entry">
                                                        <IoTrashOutline size={15} />
                                                    </button>
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
