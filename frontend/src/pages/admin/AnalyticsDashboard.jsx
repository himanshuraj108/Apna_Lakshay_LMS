import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoAnalyticsOutline, IoDownload,
    IoPeopleOutline, IoTimeOutline, IoTrendingUpOutline,
    IoCalendarOutline
} from 'react-icons/io5';

const PAGE_BG = { background: '#050508' };

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [period, setPeriod] = useState('week');
    const [error, setError] = useState(null);

    useEffect(() => { fetchAnalytics(); }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true); setError(null);
        try {
            const res = await api.get(`/admin/analytics?period=${period}`);
            setAnalytics(res.data.analytics);
        } catch (e) { setError('Failed to load analytics data'); }
        finally { setLoading(false); }
    };

    const formatHour = (hour) => {
        const h = parseInt(hour);
        if (isNaN(h)) return hour;
        if (h === 0) return '12 AM'; if (h === 12) return '12 PM';
        return h > 12 ? `${h - 12} PM` : `${h} AM`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={PAGE_BG}>
            <div className="grid grid-cols-2 gap-4 w-full max-w-7xl px-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/3 rounded-2xl animate-pulse" />)}
            </div>
        </div>
    );

    if (error || !analytics) return (
        <div className="min-h-screen flex items-center justify-center" style={PAGE_BG}>
            <div className="text-center">
                <p className="text-red-400 mb-4">{error || 'No analytics data'}</p>
                <button onClick={fetchAnalytics} className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl">Retry</button>
            </div>
        </div>
    );

    const { activeCount, dailyTrends, peakHours, topStudents } = analytics;
    const maxDayValue = Math.max(...dailyTrends.map(d => d.presentCount), 1);
    const maxPeakValue = Math.max(...peakHours.map(d => d.count), 1);
    const avgDuration = Math.round(dailyTrends.reduce((a, c) => a + (c.avgDuration || 0), 0) / (dailyTrends.length || 1));
    const peakHour = peakHours.length > 0 ? formatHour(peakHours.sort((a, b) => b.count - a.count)[0]._id) : 'N/A';
    const totalVisits = dailyTrends.reduce((a, c) => a + c.presentCount, 0);

    const STAT_CARDS = [
        { label: 'Live Occupancy', value: activeCount, sub: 'Students inside now', icon: IoPeopleOutline, color: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.3)' },
        { label: 'Avg. Duration', value: `${avgDuration}m`, sub: 'Per session average', icon: IoTimeOutline, color: 'from-purple-500 to-violet-500', glow: 'rgba(139,92,246,0.3)' },
        { label: 'Peak Hour', value: peakHour, sub: 'Most busy time (30d)', icon: IoTrendingUpOutline, color: 'from-green-500 to-emerald-500', glow: 'rgba(16,185,129,0.3)' },
        { label: 'Total Visits', value: totalVisits, sub: 'In selected period', icon: IoCalendarOutline, color: 'from-orange-400 to-amber-500', glow: 'rgba(245,158,11,0.3)' },
    ];

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-3xl" />
                <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/attendance">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"><IoAnalyticsOutline size={14} className="text-white" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Analytics Dashboard</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['week', 'month'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === p
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'}`}>
                                {p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, glow }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="relative bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            <div className={`p-2 rounded-xl bg-gradient-to-br ${color} w-fit mb-3`} style={{ boxShadow: `0 6px 20px -4px ${glow}` }}>
                                <Icon size={16} className="text-white" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                            <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
                            <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                    {/* Attendance Trend */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                        className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <IoAnalyticsOutline size={16} className="text-blue-400" />
                            <h3 className="font-bold text-white text-sm">Attendance Trends</h3>
                        </div>
                        <div className="h-48 flex items-end gap-1">
                            {dailyTrends.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div className="absolute -top-10 bg-gray-900 border border-white/10 text-xs p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-xl">
                                        {day._id}: {day.presentCount} students
                                    </div>
                                    <motion.div initial={{ height: 0 }} animate={{ height: `${(day.presentCount / maxDayValue) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.04 }}
                                        className="w-full bg-gradient-to-t from-blue-600/70 to-blue-400/50 hover:from-blue-500/90 hover:to-blue-400/70 rounded-t-lg transition-colors" />
                                    <span className="text-[9px] text-gray-600">{new Date(day._id).getDate()}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Peak Hours */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                        className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-5">
                            <IoTimeOutline size={16} className="text-green-400" />
                            <h3 className="font-bold text-white text-sm">Peak Hours (Last 30 Days)</h3>
                        </div>
                        <div className="space-y-2 h-48 overflow-y-auto pr-1">
                            {peakHours.map((hour, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-gray-500 w-14 shrink-0">{formatHour(hour._id)}</span>
                                    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(hour.count / maxPeakValue) * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.03 }}
                                            className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full flex items-center justify-end pr-2">
                                            <span className="text-[9px] font-bold text-black">{hour.count}</span>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Top Students */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
                        <IoTrendingUpOutline size={16} className="text-yellow-400" />
                        <h3 className="font-bold text-white text-sm">Top Students — Study Hours</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Rank', 'Student', 'Days', 'Total Hours'].map(h => (
                                        <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${h === 'Total Hours' ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topStudents.map((s, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-500'}`}>{i + 1}</span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-semibold text-white text-sm">{s.name}</p>
                                            <p className="text-xs text-gray-600">{s.email}</p>
                                        </td>
                                        <td className="px-5 py-3 text-sm text-gray-300">{s.daysPresent}</td>
                                        <td className="px-5 py-3 text-right font-mono font-bold text-purple-400">{Math.floor(s.totalDuration / 60)}h {s.totalDuration % 60}m</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
