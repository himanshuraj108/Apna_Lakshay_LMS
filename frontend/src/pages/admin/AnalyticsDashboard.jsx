import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack,
    IoAnalytics,
    IoDownload,
    IoPeople,
    IoTime,
    IoTrendingUp,
    IoCalendar,
    IoDocumentTextOutline
} from 'react-icons/io5';
import jsPDF from 'jspdf';

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [period, setPeriod] = useState('week'); // week, month
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/admin/analytics?period=${period}`);
            setAnalytics(response.data.analytics);
        } catch (error) {
            console.error('Analytics error:', error);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6"><SkeletonLoader type="card" count={3} /></div>;

    if (error || !analytics) return (
        <div className="p-6">
            <Card className="bg-red-500/10 border border-red-500/50 p-6 text-center">
                <p className="text-red-400 mb-4">{error || 'No analytics data available'}</p>
                <Button onClick={fetchAnalytics}>Retry</Button>
            </Card>
        </div>
    );

    const {
        activeCount,
        dailyTrends,
        peakHours,
        topStudents
    } = analytics;

    // Helper for Custom Charts
    const maxDayValue = Math.max(...dailyTrends.map(d => d.presentCount), 1);
    const maxPeakValue = Math.max(...peakHours.map(d => d.count), 1);

    const formatHour = (hour) => {
        const h = parseInt(hour);
        if (isNaN(h)) return hour;
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        if (h > 12) return `${h - 12} PM`;
        return `${h} AM`;
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/attendance">
                            <Button variant="secondary" className="!p-3">
                                <IoArrowBack size={20} />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Analytics Dashboard
                        </h1>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant={period === 'week' ? 'primary' : 'secondary'}
                            onClick={() => setPeriod('week')}
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            variant={period === 'month' ? 'primary' : 'secondary'}
                            onClick={() => setPeriod('month')}
                        >
                            Last 30 Days
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 border-blue-500/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-200 text-sm mb-1">Live Occupancy</p>
                                <h3 className="text-4xl font-bold text-white">{activeCount}</h3>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                <IoPeople size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-4">Students inside now</p>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/20 border-purple-500/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-200 text-sm mb-1">Avg Duration</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {Math.round(dailyTrends.reduce((acc, curr) => acc + (curr.avgDuration || 0), 0) / (dailyTrends.length || 1))}m
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                                <IoTime size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-purple-300 mt-4">Per session average</p>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-900/50 to-green-800/20 border-green-500/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-200 text-sm mb-1">Peak Hour</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {peakHours.length > 0
                                        ? formatHour(peakHours.sort((a, b) => b.count - a.count)[0]._id)
                                        : 'N/A'}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                                <IoTrendingUp size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-green-300 mt-4">Most busy time (30d)</p>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/20 border-orange-500/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-200 text-sm mb-1">Total Visits</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {dailyTrends.reduce((acc, curr) => acc + curr.presentCount, 0)}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400">
                                <IoCalendar size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-orange-300 mt-4">In selected period</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Attendance Trend Chart */}
                    <Card>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <IoAnalytics className="text-blue-400" /> Attendance Trends
                        </h3>
                        <div className="h-64 flex items-end gap-2">
                            {dailyTrends.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    {/* Tooltip */}
                                    <div className="absolute -top-12 bg-gray-800 text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition shadow-lg border border-white/10 whitespace-nowrap z-10">
                                        {day._id}: {day.presentCount} students
                                        <br />
                                        Avg: {Math.round(day.avgDuration)} mins
                                    </div>

                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(day.presentCount / maxDayValue) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.05 }}
                                        className="w-full bg-blue-500/50 hover:bg-blue-400 rounded-t-lg relative"
                                    >
                                        <div
                                            className="absolute bottom-0 w-full bg-purple-500/30"
                                            style={{ height: `${Math.min(day.avgDuration / 2, 100)}%` }} // Overlay avg duration roughly
                                        ></div>
                                    </motion.div>
                                    <span className="text-[10px] text-gray-500 rotate-0 truncate w-full text-center">
                                        {new Date(day._id).getDate()}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 justify-center mt-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500/50 rounded"></div> Count</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500/30 rounded"></div> Duration</div>
                        </div>
                    </Card>

                    {/* Peak Hours Chart */}
                    <Card>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <IoTime className="text-green-400" /> Peak Hours (Last 30 Days)
                        </h3>
                        <div className="h-64 flex flex-col justify-end space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                            {peakHours.map((hour, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm font-mono text-gray-400 w-16">{formatHour(hour._id)}</span>
                                    <div className="flex-1 h-8 bg-gray-800/50 rounded-full overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(hour.count / maxPeakValue) * 100}%` }}
                                            transition={{ duration: 0.8 }}
                                            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full flex items-center justify-end pr-2"
                                        >
                                            <span className="text-xs font-bold text-black">{hour.count}</span>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top Students */}
                    <Card className="lg:col-span-2">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <IoTrendingUp className="text-yellow-400" /> Top Students (Study Hours)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                        <th className="p-3">Rank</th>
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Days</th>
                                        <th className="p-3 text-right">Total Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topStudents.map((student, i) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <td className="p-3">
                                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' :
                                                    i === 1 ? 'bg-gray-400 text-black' :
                                                        i === 2 ? 'bg-orange-500 text-black' :
                                                            'bg-gray-800 text-gray-400'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-bold text-sm">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </td>
                                            <td className="p-3 text-sm">{student.daysPresent}</td>
                                            <td className="p-3 text-right font-mono font-bold text-purple-400">
                                                {Math.floor(student.totalDuration / 60)}h {student.totalDuration % 60}m
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>


                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
