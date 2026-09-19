import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoAnalyticsOutline,
    IoPeopleOutline, IoTimeOutline, IoTrendingUpOutline,
    IoCalendarOutline
} from 'react-icons/io5';

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
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-7xl px-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-white border border-[#EDE8E0] rounded-2xl animate-pulse" />
                ))}
            </div>
        </div>
    );

    if (error || !analytics) return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div className="text-center bg-white border border-[#EDE8E0] p-8 rounded-3xl shadow-xl max-w-md w-full">
                <p className="text-rose-600 font-bold text-sm mb-4">{error || 'No analytics data available'}</p>
                <button onClick={fetchAnalytics} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer">
                    Retry Loading
                </button>
            </div>
        </div>
    );

    const { activeCount, dailyTrends = [], peakHours = [], topStudents = [] } = analytics;
    const maxDayValue = Math.max(...dailyTrends.map(d => d.presentCount), 1);
    const maxPeakValue = Math.max(...peakHours.map(d => d.count), 1);
    const avgDuration = Math.round(dailyTrends.reduce((a, c) => a + (c.avgDuration || 0), 0) / (dailyTrends.length || 1));
    const peakHour = peakHours.length > 0 ? formatHour(peakHours.sort((a, b) => b.count - a.count)[0]._id) : 'N/A';
    const totalVisits = dailyTrends.reduce((a, c) => a + c.presentCount, 0);

    const STAT_CARDS = [
        { label: 'Live Occupancy', value: activeCount, sub: 'Students inside now', icon: IoPeopleOutline, color: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-50 text-blue-600 border border-blue-200' },
        { label: 'Avg. Duration', value: `${avgDuration}m`, sub: 'Per session average', icon: IoTimeOutline, color: 'from-purple-500 to-violet-500', iconBg: 'bg-purple-50 text-purple-600 border border-purple-200' },
        { label: 'Peak Hour', value: peakHour, sub: 'Most busy window (30d)', icon: IoTrendingUpOutline, color: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
        { label: 'Total Visits', value: totalVisits, sub: 'In selected period', icon: IoCalendarOutline, color: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-50 text-orange-600 border border-orange-200' },
    ];

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
                        <Link to="/admin/attendance">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                                <IoArrowBack size={15} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-sm">
                                    <IoAnalyticsOutline size={13} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">Analytics & Insights</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Analytics Dashboard</h1>
                            <p className="text-stone-500 text-xs mt-0.5 font-medium">Real-time occupancy trends and student learning duration</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['week', 'month'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${period === p
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 shadow-2xs'}`}>
                                {p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {STAT_CARDS.map(({ label, value, sub, icon: Icon, iconBg }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white border border-[#EDE8E0] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
                                <div className={`p-2 rounded-xl ${iconBg}`}>
                                    <Icon size={16} />
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{value}</p>
                            <p className="text-[11px] text-stone-400 font-medium mt-1">{sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                    {/* Attendance Trend */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white border border-[#EDE8E0] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#EDE8E0]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg">
                                    <IoAnalyticsOutline size={15} />
                                </div>
                                <h3 className="font-black text-stone-900 text-sm">Attendance Trends</h3>
                            </div>
                            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Students Present</span>
                        </div>
                        <div className="h-48 flex items-end gap-1.5 pt-4">
                            {dailyTrends.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div className="absolute -top-9 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                        {day._id}: {day.presentCount} students
                                    </div>
                                    <motion.div initial={{ height: 0 }} animate={{ height: `${(day.presentCount / maxDayValue) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.03 }}
                                        className="w-full bg-gradient-to-t from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 rounded-t-lg transition-colors cursor-pointer min-h-[4px]" />
                                    <span className="text-[10px] font-bold text-stone-500">{new Date(day._id).getDate()}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Peak Hours */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        className="bg-white border border-[#EDE8E0] rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#EDE8E0]">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg">
                                    <IoTimeOutline size={15} />
                                </div>
                                <h3 className="font-black text-stone-900 text-sm">Peak Hours (Last 30 Days)</h3>
                            </div>
                            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Activity Distribution</span>
                        </div>
                        <div className="space-y-2.5 h-48 overflow-y-auto pr-1">
                            {peakHours.map((hour, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-bold text-stone-600 w-16 shrink-0">{formatHour(hour._id)}</span>
                                    <div className="flex-1 h-5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EDE8E0]">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(hour.count / maxPeakValue) * 100}%` }}
                                            transition={{ duration: 0.6, delay: i * 0.02 }}
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-end pr-2 min-w-[24px]">
                                            <span className="text-[10px] font-black text-white">{hour.count}</span>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Top Students */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-[#EDE8E0] bg-[#FAF6F0]/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg">
                                <IoTrendingUpOutline size={15} />
                            </div>
                            <h3 className="font-black text-stone-900 text-sm">Top Students — Study Hours</h3>
                        </div>
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Leaderboard</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#EDE8E0] bg-[#FAF6F0]/30">
                                    {['Rank', 'Student', 'Days Present', 'Total Hours'].map(h => (
                                        <th key={h} className={`px-6 py-3.5 text-[11px] font-black uppercase tracking-wider text-stone-500 ${h === 'Total Hours' ? 'text-right' : 'text-left'}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EDE8E0]/70">
                                {topStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-stone-400 text-xs">No student data recorded in this period</td>
                                    </tr>
                                ) : (
                                    topStudents.map((s, i) => (
                                        <tr key={i} className="hover:bg-[#FAF6F0]/50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shadow-2xs ${
                                                    i === 0 ? 'bg-amber-400 text-stone-900' :
                                                    i === 1 ? 'bg-stone-300 text-stone-900' :
                                                    i === 2 ? 'bg-amber-700 text-white' :
                                                    'bg-stone-100 text-stone-600 border border-[#EDE8E0]'
                                                }`}>{i + 1}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <p className="font-bold text-stone-900 text-xs">{s.name}</p>
                                                <p className="text-[11px] text-stone-500 font-medium">{s.email}</p>
                                            </td>
                                            <td className="px-6 py-3.5 text-xs font-bold text-stone-700">{s.daysPresent} days</td>
                                            <td className="px-6 py-3.5 text-right font-mono font-black text-orange-600 text-xs">{Math.floor(s.totalDuration / 60)}h {s.totalDuration % 60}m</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
