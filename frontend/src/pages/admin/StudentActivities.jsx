import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api, { BASE_URL } from '../../utils/api';
import {
    IoArrowBack, IoSearchOutline, IoFlame, IoTrendingUpOutline,
    IoTimeOutline, IoTrophyOutline, IoTrophy, IoPulseOutline, IoChevronBackOutline,
    IoChevronForwardOutline, IoBookOutline, IoPersonOutline, IoRibbonOutline,
    IoCalendarOutline, IoChevronDownOutline, IoChevronUpOutline, IoCloseOutline,
    IoStatsChartOutline, IoAlertCircleOutline, IoCheckmarkCircleOutline, IoShieldOutline
} from 'react-icons/io5';

const PAGE_BG = { background: '#F8FAFC' };

const StudentActivities = () => {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('xp');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [error, setError] = useState(null);

    // Navigation Tab: 'logs' or 'leaderboard'
    const [activeTab, setActiveTab] = useState('logs');

    // Leaderboard Tab States
    const [leaderboardSortBy, setLeaderboardSortBy] = useState('xp');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Detail Modal States
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [studentDetails, setStudentDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [detailsTab, setDetailsTab] = useState('tests'); // 'tests' or 'activity'
    const [expandedQuizAttempt, setExpandedQuizAttempt] = useState(null);

    // Fetch activities list
    useEffect(() => {
        if (activeTab === 'logs') {
            const timer = setTimeout(() => {
                fetchActivities();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [search, sortBy, page, activeTab]);

    // Fetch leaderboard
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            fetchLeaderboard();
        }
    }, [leaderboardSortBy, activeTab]);

    const fetchActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/admin/engagement/activities', {
                params: {
                    search,
                    page,
                    sortBy,
                    limit: 10
                }
            });
            if (res.data.success) {
                setActivities(res.data.activities || []);
                setTotalRecords(res.data.total || 0);
                setTotalPages(res.data.pages || 1);
            }
        } catch (e) {
            console.error('Error fetching activities:', e);
            setError(e.response?.data?.message || 'Failed to load engagement activities');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
            const res = await api.get(`/student/engagement/leaderboard?sortBy=${leaderboardSortBy}`);
            if (res.data.success) {
                setLeaderboardData(res.data.leaderboard || []);
            }
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const fetchStudentDetails = async (studentId) => {
        setSelectedStudentId(studentId);
        setDetailsLoading(true);
        setDetailsError(null);
        setStudentDetails(null);
        setExpandedQuizAttempt(null);
        setShowModal(true);
        try {
            const res = await api.get(`/admin/students/${studentId}/engagement-details`);
            if (res.data.success) {
                setStudentDetails(res.data);
            }
        } catch (e) {
            console.error('Error fetching student details:', e);
            setDetailsError(e.response?.data?.message || 'Failed to load student activity details');
        } finally {
            setDetailsLoading(false);
        }
    };

    const getExamTargetLabel = (target) => {
        const targets = {
            'ssc_cgl': 'SSC CGL',
            'ssc_chsl': 'SSC CHSL',
            'ssc_gd': 'SSC GD',
            'ssc_mts': 'SSC MTS',
            'ssc_cpo': 'SSC CPO',
            'upsc_cse': 'UPSC CSE',
            'upsc_cds': 'UPSC CDS',
            'ibps_po': 'IBPS PO',
            'ibps_clerk': 'IBPS Clerk',
            'sbi_po': 'SBI PO',
            'sbi_clerk': 'SBI Clerk',
            'rrb_ntpc': 'RRB NTPC',
            'jee_main': 'JEE Main',
            'neet_ug': 'NEET UG',
            'generic': 'General Aptitude',
            '': 'Not Set'
        };
        return targets[target] || target || 'Not Set';
    };

    const formatFocusTime = (minutes) => {
        if (!minutes) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getOptionLetter = (idx) => {
        return ['A', 'B', 'C', 'D'][idx] || '';
    };

    // Render activity heatmap log (last 30 days)
    const renderActivityHeatmap = (activityLog) => {
        const today = new Date();
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            
            // find count
            const logEntry = activityLog?.find(log => {
                const logDateStr = new Date(log.date).toLocaleDateString('en-CA');
                return logDateStr === dateStr;
            });
            days.push({
                date: d,
                count: logEntry ? logEntry.count : 0
            });
        }

        return (
            <div className="bg-gray-50 border border-gray-150 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <IoCalendarOutline size={14} className="text-orange-500" />
                        30-Day Activity Heatmap
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400">Recent consistency</span>
                </div>
                <div className="grid grid-cols-10 gap-2 justify-items-center py-1">
                    {days.map((day, idx) => {
                        let bgColor = 'bg-gray-200';
                        if (day.count > 0 && day.count <= 2) bgColor = 'bg-orange-200 text-orange-850';
                        else if (day.count > 2 && day.count <= 5) bgColor = 'bg-orange-400 text-white';
                        else if (day.count > 5) bgColor = 'bg-orange-600 text-white';

                        return (
                            <div key={idx} className="group relative">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-115 cursor-help ${bgColor}`}>
                                    {day.date.getDate()}
                                </div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: {day.count} active logs
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center justify-end gap-3 mt-3 text-[9px] font-semibold text-gray-400">
                    <span>Inactive</span>
                    <span className="w-2.5 h-2.5 bg-gray-200 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-orange-200 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-orange-400 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-orange-600 rounded-sm" />
                    <span>Legendary Active</span>
                </div>
            </div>
        );
    };

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-6%] w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg"><IoPulseOutline size={14} className="text-white" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Super Admin Only</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Engagement & Activity Logs</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Monitor student daily streaks, XP gains, mock tests, and library leaderboards.</p>
                        </div>
                    </div>

                    {/* Segment Tab Controls */}
                    <div className="flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm self-start sm:self-auto">
                        <button
                            onClick={() => { setActiveTab('logs'); setPage(1); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'logs'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <IoStatsChartOutline size={14} />
                            Logs & Reports
                        </button>
                        <button
                            onClick={() => { setActiveTab('leaderboard'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                activeTab === 'leaderboard'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <IoTrophyOutline size={14} />
                            Leaderboard Showcase
                        </button>
                    </div>
                </motion.div>

                {/* VIEW 1: LOGS & SEARCH */}
                {activeTab === 'logs' && (
                    <>
                        {/* Filters Row */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:w-96">
                                <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by student name..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-all"
                                />
                            </div>

                            {/* Sorting */}
                            <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-start">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By</span>
                                <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl">
                                    {[
                                        { id: 'xp', label: 'XP / Level', icon: IoTrendingUpOutline },
                                        { id: 'streak', label: 'Streak', icon: IoFlame },
                                        { id: 'focus', label: 'Focus Time', icon: IoTimeOutline },
                                        { id: 'quiz', label: 'Quizzes', icon: IoBookOutline }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setSortBy(opt.id); setPage(1); }}
                                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === opt.id
                                                ? 'bg-white text-orange-600 shadow-sm border border-gray-100'
                                                : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            <opt.icon size={13} className={sortBy === opt.id ? 'text-orange-500' : 'text-gray-400'} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Table Container */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            {error ? (
                                <div className="p-12 text-center">
                                    <p className="text-red-500 font-semibold mb-3">{error}</p>
                                    <button onClick={fetchActivities} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                                        Retry
                                    </button>
                                </div>
                            ) : loading && activities.length === 0 ? (
                                <div className="p-20 flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4" />
                                    <p className="text-gray-500 text-sm font-medium">Fetching activities...</p>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-4">
                                        <IoPersonOutline size={26} className="text-gray-300" />
                                    </div>
                                    <p className="text-gray-800 font-bold text-base">No Student Activities Found</p>
                                    <p className="text-gray-500 text-sm mt-1 max-w-sm">No active students match your search filter or have study records at the moment.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Rank & Student Details</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Exam Target</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Level & Progress</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Streak (Current / Best)</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Focus Hours</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Quizzes Done</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Achievements</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.map((student, idx) => {
                                                const initials = student.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                                const imgSrc = student.profileImage
                                                    ? (student.profileImage.startsWith('http') ? student.profileImage : `${BASE_URL}${student.profileImage}`)
                                                    : null;

                                                // Calculate overall XP rank based on sorting order
                                                const studentRank = sortBy === 'xp' ? (page - 1) * 10 + idx + 1 : null;

                                                return (
                                                    <tr 
                                                        key={student._id} 
                                                        onClick={() => fetchStudentDetails(student._id)}
                                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors cursor-pointer"
                                                    >
                                                        {/* Student Details with Rank Indicator */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {studentRank && (
                                                                    <span className={`w-5 text-xs font-black ${
                                                                        studentRank === 1 ? 'text-amber-500' :
                                                                        studentRank === 2 ? 'text-slate-400' :
                                                                        studentRank === 3 ? 'text-amber-700' : 'text-gray-400'
                                                                    }`}>
                                                                        #{studentRank}
                                                                    </span>
                                                                )}
                                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white shrink-0">
                                                                    {imgSrc ? (
                                                                        <img src={imgSrc} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                                    ) : (
                                                                        initials
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Exam Target */}
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                student.examTarget === 'generic' || !student.examTarget
                                                                    ? 'bg-gray-105 text-gray-600 border border-gray-200'
                                                                    : 'bg-orange-50 text-orange-600 border border-orange-100'
                                                            }`}>
                                                                {getExamTargetLabel(student.examTarget)}
                                                            </span>
                                                        </td>

                                                        {/* Level & XP */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xs font-black border border-indigo-100">
                                                                    L{student.level || 1}
                                                                </span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-gray-800">{student.totalXP || 0} XP</span>
                                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((student.totalXP % 1000) / 1000) * 100, 100)}%` }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Streak */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <IoFlame className={student.currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'} size={18} />
                                                                <div>
                                                                    <span className="text-sm font-bold text-gray-900">{student.currentStreak || 0}d</span>
                                                                    <span className="text-[10px] text-gray-400 font-semibold ml-1.5">Best: {student.longestStreak || 0}d</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Focus Time */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 text-gray-700">
                                                                <IoTimeOutline size={15} className="text-gray-400" />
                                                                <span className="text-xs font-semibold">{formatFocusTime(student.totalFocusTime)}</span>
                                                            </div>
                                                        </td>

                                                        {/* Daily Quizzes */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 text-gray-700">
                                                                <IoBookOutline size={15} className="text-gray-400" />
                                                                <span className="text-xs font-bold">{student.quizAttemptsCount || 0} attempt{student.quizAttemptsCount !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        </td>

                                                        {/* Achievements */}
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-extrabold">
                                                                <IoTrophyOutline size={12} />
                                                                {student.achievementsCount || 0}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-500">
                                        Showing <span className="font-bold text-gray-800">{(page - 1) * 10 + 1}</span> to <span className="font-bold text-gray-800">{Math.min(page * 10, totalRecords)}</span> of <span className="font-bold text-gray-800">{totalRecords}</span> students
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                                            disabled={page === 1}
                                            className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                        >
                                            <IoChevronBackOutline size={16} />
                                        </button>
                                        <span className="text-xs font-bold text-gray-700">Page {page} of {totalPages}</span>
                                        <button
                                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                            disabled={page === totalPages}
                                            className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                        >
                                            <IoChevronForwardOutline size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}

                {/* VIEW 2: LEADERBOARD SHOWCASE */}
                {activeTab === 'leaderboard' && (
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                        {/* Leaderboard Controls */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Library Rank Leaderboard</h3>
                                <p className="text-xs text-gray-400">Top 20 most engaged students in the library.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Metrics</span>
                                <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl">
                                    {[
                                        { id: 'xp', label: 'XP / Level', icon: IoTrendingUpOutline },
                                        { id: 'streak', label: 'Streaks', icon: IoFlame },
                                        { id: 'focus', label: 'Focus Time', icon: IoTimeOutline }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setLeaderboardSortBy(opt.id)}
                                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${leaderboardSortBy === opt.id
                                                ? 'bg-white text-orange-600 shadow-sm border border-gray-100'
                                                : 'text-gray-500 hover:text-gray-800'}`}
                                        >
                                            <opt.icon size={13} className={leaderboardSortBy === opt.id ? 'text-orange-500' : 'text-gray-400'} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {leaderboardLoading ? (
                            <div className="p-20 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl">
                                <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4" />
                                <p className="text-gray-500 text-sm font-medium">Loading ranking table...</p>
                            </div>
                        ) : leaderboardData.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl">
                                <IoTrophyOutline size={40} className="text-gray-300 mb-2" />
                                <p className="text-gray-700 font-bold">No Records Yet</p>
                                <p className="text-gray-400 text-xs mt-1">Streaks and XP are computed daily once students start studying.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Top 3 Podium Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-6">
                                    {/* 2nd Place (Silver) */}
                                    {leaderboardData[1] && (
                                        <motion.div 
                                            whileHover={{ y: -4 }}
                                            onClick={() => fetchStudentDetails(leaderboardData[1].userId)}
                                            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center relative cursor-pointer md:order-1 h-fit border-t-4 border-t-slate-300"
                                        >
                                            <span className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-black shadow-inner">
                                                2
                                            </span>
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 mx-auto mb-3 shadow-inner relative border-2 border-slate-300">
                                                {leaderboardData[1].profileImage ? (
                                                    <img src={leaderboardData[1].profileImage.startsWith('http') ? leaderboardData[1].profileImage : `${BASE_URL}${leaderboardData[1].profileImage}`} alt={leaderboardData[1].name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-lg">{leaderboardData[1].name.slice(0,2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h4 className="font-extrabold text-gray-800 truncate text-sm">{leaderboardData[1].name}</h4>
                                            <p className="text-xs text-gray-400 font-medium">Lvl {leaderboardData[1].level || 1}</p>
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-slate-600">
                                                {leaderboardSortBy === 'xp' ? `${leaderboardData[1].value} XP` :
                                                 leaderboardSortBy === 'streak' ? `${leaderboardData[1].value} Days` :
                                                 formatFocusTime(leaderboardData[1].value)}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 1st Place (Gold) */}
                                    {leaderboardData[0] && (
                                        <motion.div 
                                            whileHover={{ y: -6 }}
                                            onClick={() => fetchStudentDetails(leaderboardData[0].userId)}
                                            className="bg-white border border-orange-100 rounded-2xl p-6 shadow-md text-center relative cursor-pointer md:order-2 border-t-4 border-t-amber-400 md:scale-105"
                                        >
                                            <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">
                                                👑
                                            </span>
                                            <span className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 text-xs font-black border border-amber-200 shadow-sm">
                                                1
                                            </span>
                                            <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-100 mx-auto mb-3 shadow-md relative border-4 border-amber-300">
                                                {leaderboardData[0].profileImage ? (
                                                    <img src={leaderboardData[0].profileImage.startsWith('http') ? leaderboardData[0].profileImage : `${BASE_URL}${leaderboardData[0].profileImage}`} alt={leaderboardData[0].name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-amber-700 font-bold text-xl">{leaderboardData[0].name.slice(0,2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-gray-900 truncate text-base">{leaderboardData[0].name}</h4>
                                            <p className="text-xs text-orange-500 font-bold">Lvl {leaderboardData[0].level || 1} Champion</p>
                                            <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-black text-amber-750">
                                                {leaderboardSortBy === 'xp' ? `${leaderboardData[0].value} XP` :
                                                 leaderboardSortBy === 'streak' ? `${leaderboardData[0].value} Days` :
                                                 formatFocusTime(leaderboardData[0].value)}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 3rd Place (Bronze) */}
                                    {leaderboardData[2] && (
                                        <motion.div 
                                            whileHover={{ y: -4 }}
                                            onClick={() => fetchStudentDetails(leaderboardData[2].userId)}
                                            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center relative cursor-pointer md:order-3 h-fit border-t-4 border-t-amber-600"
                                        >
                                            <span className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-full bg-amber-50 text-amber-800 text-xs font-black shadow-inner">
                                                3
                                            </span>
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-50 mx-auto mb-3 shadow-inner relative border-2 border-amber-700/35">
                                                {leaderboardData[2].profileImage ? (
                                                    <img src={leaderboardData[2].profileImage.startsWith('http') ? leaderboardData[2].profileImage : `${BASE_URL}${leaderboardData[2].profileImage}`} alt={leaderboardData[2].name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-amber-800 font-bold text-lg">{leaderboardData[2].name.slice(0,2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h4 className="font-extrabold text-gray-800 truncate text-sm">{leaderboardData[2].name}</h4>
                                            <p className="text-xs text-gray-400 font-medium">Lvl {leaderboardData[2].level || 1}</p>
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50/30 border border-amber-100/50 rounded-lg text-xs font-black text-amber-800">
                                                {leaderboardSortBy === 'xp' ? `${leaderboardData[2].value} XP` :
                                                 leaderboardSortBy === 'streak' ? `${leaderboardData[2].value} Days` :
                                                 formatFocusTime(leaderboardData[2].value)}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Ranks 4 to 20 Table */}
                                {leaderboardData.length > 3 && (
                                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-w-4xl mx-auto">
                                        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rankings #4 to #{leaderboardData.length}</h4>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <tbody>
                                                {leaderboardData.slice(3).map((item, index) => {
                                                    const initials = item.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                                    return (
                                                        <tr 
                                                            key={item.userId}
                                                            onClick={() => fetchStudentDetails(item.userId)}
                                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors cursor-pointer"
                                                        >
                                                            <td className="px-6 py-3 w-16 text-center text-sm font-bold text-gray-500">
                                                                #{index + 4}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-xs shadow-sm border border-white shrink-0">
                                                                        {item.profileImage ? (
                                                                            <img src={item.profileImage.startsWith('http') ? item.profileImage : `${BASE_URL}${item.profileImage}`} alt={item.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                                        ) : (
                                                                            initials
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-extrabold text-gray-800 text-sm">{item.name}</p>
                                                                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Level {item.level || 1}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-xs font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">
                                                                    {leaderboardSortBy === 'xp' ? `${item.value} XP` :
                                                                     leaderboardSortBy === 'streak' ? `${item.value} Days` :
                                                                     formatFocusTime(item.value)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* DETAIL MODAL (DRAWER VIEW) */}
            <AnimatePresence>
                {showModal && (
                    <>
                        {/* Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 cursor-zoom-out"
                        />

                        {/* Modal Panel */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, type: 'spring', damping: 25 }}
                            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-150 relative bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                <button 
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-5 right-5 p-1.5 rounded-xl bg-black/10 hover:bg-black/25 text-white transition-all outline-none"
                                >
                                    <IoCloseOutline size={20} />
                                </button>
                                
                                {detailsLoading ? (
                                    <div className="h-20 flex items-center justify-center">
                                        <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : detailsError ? (
                                    <div>
                                        <p className="font-bold text-sm text-red-200">Error Loading Details</p>
                                        <p className="text-xs text-white/80 mt-1">{detailsError}</p>
                                    </div>
                                ) : studentDetails?.student ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 overflow-hidden flex items-center justify-center font-black text-xl text-white shadow-md">
                                            {studentDetails.student.profileImage ? (
                                                <img 
                                                    src={studentDetails.student.profileImage.startsWith('http') ? studentDetails.student.profileImage : `${BASE_URL}${studentDetails.student.profileImage}`} 
                                                    alt={studentDetails.student.name} 
                                                    className="w-full h-full object-cover" 
                                                    crossOrigin="anonymous" 
                                                />
                                            ) : (
                                                studentDetails.student.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight">{studentDetails.student.name}</h3>
                                            <p className="text-xs text-white/80 font-medium">{studentDetails.student.email} · {studentDetails.student.mobile || 'No Mobile'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded border border-white/10">
                                                    Target: {getExamTargetLabel(studentDetails.student.examTarget)}
                                                </span>
                                                <span className="text-[10px] font-black bg-indigo-600 border border-indigo-400 px-2 py-0.5 rounded text-white uppercase tracking-wider">
                                                    Level {studentDetails.streak?.level || 1}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Inner Modal Tabs */}
                            <div className="flex border-b border-gray-150 bg-gray-50/50 p-2">
                                <button
                                    onClick={() => setDetailsTab('tests')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        detailsTab === 'tests'
                                            ? 'bg-white text-orange-600 shadow-sm border border-gray-200'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <IoBookOutline size={14} />
                                    Daily Tests & Quizzes
                                </button>
                                <button
                                    onClick={() => setDetailsTab('activity')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        detailsTab === 'activity'
                                            ? 'bg-white text-orange-600 shadow-sm border border-gray-200'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <IoStatsChartOutline size={14} />
                                    Daily Activity & Streaks
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                                {detailsLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-3 border-gray-250 border-t-orange-500 rounded-full animate-spin mb-3" />
                                        <p className="text-gray-400 text-xs font-semibold">Loading student history...</p>
                                    </div>
                                ) : studentDetails ? (
                                    <div className="space-y-6">
                                        {/* TAB 1: TESTS & QUIZZES */}
                                        {detailsTab === 'tests' && (
                                            <div className="space-y-6">
                                                {/* Daily Quiz Challenges Section */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <IoCheckmarkCircleOutline className="text-orange-500" size={15} />
                                                        Daily Quiz Attempts ({studentDetails.quizAttempts?.length || 0})
                                                    </h4>
                                                    
                                                    {studentDetails.quizAttempts?.length === 0 ? (
                                                        <p className="text-xs font-semibold text-gray-400 bg-gray-50 p-4 border border-dashed border-gray-200 rounded-xl text-center">
                                                            No daily quiz challenge attempts recorded.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {studentDetails.quizAttempts.map((attempt) => {
                                                                const isExpanded = expandedQuizAttempt === attempt._id;
                                                                const correctPct = (attempt.score / 5) * 100;
                                                                
                                                                return (
                                                                    <div key={attempt._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                                        <div 
                                                                            onClick={() => setExpandedQuizAttempt(isExpanded ? null : attempt._id)}
                                                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                                                        >
                                                                            <div>
                                                                                <p className="text-sm font-extrabold text-gray-800">Challenge Date: {formatDate(attempt.completedAt)}</p>
                                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                                                                    IST Date: {attempt.date} · Topic: {getExamTargetLabel(attempt.quiz?.examCode)}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="text-right">
                                                                                    <span className="text-sm font-black text-orange-600 block">{attempt.score}/5 Correct</span>
                                                                                    <span className="text-[10px] font-bold text-gray-400">+{attempt.xpAwarded} XP awarded</span>
                                                                                </div>
                                                                                {isExpanded ? <IoChevronUpOutline size={16} className="text-gray-400" /> : <IoChevronDownOutline size={16} className="text-gray-400" />}
                                                                            </div>
                                                                        </div>

                                                                        {/* Collapsible Details */}
                                                                        {isExpanded && (
                                                                            <div className="px-4 pb-4 border-t border-gray-100 bg-gray-55/30 pt-4 space-y-4">
                                                                                {attempt.quiz?.questions?.map((q, qIdx) => {
                                                                                    const studentAnswer = attempt.answers[qIdx];
                                                                                    const isCorrect = studentAnswer === q.correct;
                                                                                    
                                                                                    return (
                                                                                        <div key={q._id || qIdx} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                                                                                            <p className="text-xs font-bold text-gray-800 leading-relaxed">
                                                                                                Q{qIdx + 1}: {q.question}
                                                                                            </p>
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                                                                {q.options.map((opt, oIdx) => {
                                                                                                    let optionStyle = 'bg-white border-gray-200 text-gray-700';
                                                                                                    if (oIdx === q.correct) {
                                                                                                        optionStyle = 'bg-emerald-50 border-emerald-350 text-emerald-800 font-bold';
                                                                                                    } else if (oIdx === studentAnswer && !isCorrect) {
                                                                                                        optionStyle = 'bg-red-50 border-red-200 text-red-800 font-bold';
                                                                                                    }
                                                                                                    
                                                                                                    return (
                                                                                                        <div key={oIdx} className={`border px-3 py-2 rounded-lg text-xs flex items-center justify-between ${optionStyle}`}>
                                                                                                            <span>{getOptionLetter(oIdx)}. {opt}</span>
                                                                                                            {oIdx === q.correct && <IoCheckmarkCircleOutline className="text-emerald-500" size={14} />}
                                                                                                            {oIdx === studentAnswer && !isCorrect && <IoCloseOutline className="text-red-500" size={14} />}
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                            {q.explanation && (
                                                                                                <p className="text-[10px] text-gray-500 italic mt-2 bg-white/50 p-2 rounded-lg border border-gray-100 leading-snug">
                                                                                                    <span className="font-extrabold uppercase text-[9px] tracking-wider text-indigo-500 block not-italic mb-0.5">Explanation</span>
                                                                                                    {q.explanation}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mock Test History Section */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <IoStatsChartOutline className="text-orange-500" size={15} />
                                                        Mock Test Attempts ({studentDetails.mockTestAttempts?.length || 0})
                                                    </h4>
                                                    
                                                    {studentDetails.mockTestAttempts?.length === 0 ? (
                                                        <p className="text-xs font-semibold text-gray-400 bg-gray-50 p-4 border border-dashed border-gray-200 rounded-xl text-center">
                                                            No mock test attempts recorded.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {studentDetails.mockTestAttempts.map((test) => {
                                                                const durationMin = test.timeTaken ? Math.round(test.timeTaken / 60) : 0;
                                                                const scoreVal = test.score !== undefined ? test.score : '—';
                                                                const maxVal = test.maxScore || '—';
                                                                const pctVal = test.percentage !== undefined ? `${test.percentage.toFixed(1)}%` : '—';

                                                                return (
                                                                    <div key={test._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-extrabold text-gray-800">{getExamTargetLabel(test.examCode)}</span>
                                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                                                    {test.patternName}
                                                                                </span>
                                                                                {test.isCheating && (
                                                                                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-200 animate-pulse">
                                                                                        Flagged Cheating
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-400 font-semibold">
                                                                                Started: {new Date(test.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                                                                            <div className="text-left sm:text-right">
                                                                                <p className="text-xs font-semibold text-gray-400">Duration</p>
                                                                                <p className="text-xs font-bold text-gray-800 mt-0.5">{durationMin} min</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-gray-400">Score & %</p>
                                                                                <p className="text-sm font-black text-indigo-650 mt-0.5">
                                                                                    {scoreVal} / {maxVal} <span className="text-xs font-bold text-gray-500">({pctVal})</span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 2: ACTIVITY & STREAKS */}
                                        {detailsTab === 'activity' && (
                                            <div className="space-y-6">
                                                {/* XP & Level Stat Cards */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Current Streak</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <IoFlame className="text-orange-500" size={18} />
                                                            <span className="text-xl font-black text-gray-800">{studentDetails.streak?.currentStreak || 0} days</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Longest Streak</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <IoRibbonOutline className="text-indigo-500" size={18} />
                                                            <span className="text-xl font-black text-gray-800">{studentDetails.streak?.longestStreak || 0} days</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm col-span-2 sm:col-span-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Total Focus Time</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <IoTimeOutline className="text-emerald-500" size={18} />
                                                            <span className="text-xl font-black text-gray-800">{formatFocusTime(studentDetails.streak?.totalFocusTime)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Heatmap Widget */}
                                                {renderActivityHeatmap(studentDetails.streak?.activityLog)}

                                                {/* Achievements Unlocked Section */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <IoTrophyOutline className="text-orange-500" size={15} />
                                                        Unlocked Achievements ({studentDetails.streak?.achievements?.length || 0})
                                                    </h4>
                                                    
                                                    {studentDetails.streak?.achievements?.length === 0 ? (
                                                        <p className="text-xs font-semibold text-gray-400 bg-gray-50 p-4 border border-dashed border-gray-200 rounded-xl text-center">
                                                            No achievements unlocked yet.
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {studentDetails.streak.achievements.map((ach) => {
                                                                const achievementsMetadata = {
                                                                    'streak_5': { title: '5-Day Streak Explorer', desc: 'Maintain a 5-day continuous learning streak', color: 'from-amber-400 to-orange-500' },
                                                                    'streak_10': { title: '10-Day Streak Warrior', desc: 'Maintain a 10-day continuous learning streak', color: 'from-orange-500 to-red-500' },
                                                                    'streak_15': { title: '15-Day Streak Master', desc: 'Maintain a 15-day continuous learning streak', color: 'from-pink-500 to-rose-600' },
                                                                    'streak_30': { title: '30-Day Streak Legend', desc: 'Maintain a 30-day continuous learning streak', color: 'from-purple-500 to-indigo-650' }
                                                                };

                                                                const meta = achievementsMetadata[ach.id] || {
                                                                    title: ach.id.replace('_', ' ').toUpperCase(),
                                                                    desc: 'Milestone achievement unlocked',
                                                                    color: 'from-gray-400 to-slate-600'
                                                                };

                                                                return (
                                                                    <div key={ach.id} className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-sm flex items-center gap-3.5">
                                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                                                                            <IoTrophy size={18} />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="font-extrabold text-gray-800 text-xs">{meta.title}</h5>
                                                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-0.5">{meta.desc}</p>
                                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Unlocked: {formatDate(ach.unlockedAt)}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentActivities;
