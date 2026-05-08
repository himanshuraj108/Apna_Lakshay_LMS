import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import PomodoroTimer from '../../components/PomodoroTimer';
import StudyAnalytics from '../../components/StudyAnalytics';
import AchievementBadge from '../../components/AchievementBadge';
import CalendarView from '../../components/CalendarView';
import ExamCountdown from '../../components/ExamCountdown';
import api from '../../utils/api';
import {
    IoArrowBack, IoAdd, IoCheckmark, IoTrash, IoCreateOutline,
    IoCalendar, IoList, IoStatsChart, IoTimer, IoRocket,
    IoFlameOutline, IoLockClosed, IoBookOutline
} from 'react-icons/io5';

// ── Background ───────────────────────────────────────────────────────────
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </>
);

// ── Priority config ──────────────────────────────────────────────────────
const priorityCfg = {
    high: { label: 'High', badge: 'bg-red-50 text-red-600 border-red-200', glow: 'hover:border-red-200 hover:shadow-red-100' },
    medium: { label: 'Medium', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', glow: 'hover:border-yellow-200' },
    low: { label: 'Low', badge: 'bg-green-50 text-green-700 border-green-200', glow: 'hover:border-green-200' },
};

const StudyPlanner = () => {
    const { user } = useAuth();
    const [view, setView] = useState('tasks');
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', priority: 'medium',
        dueDate: '', estimatedTime: 30, notes: '', attachments: ''
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, statsRes, examsRes] = await Promise.all([
                api.get('/study/tasks'),
                api.get('/study/stats'),
                api.get('/study/exams')
            ]);
            if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
            if (statsRes.data.success) setStats(statsRes.data.stats);
            if (examsRes.data.success) setExams(examsRes.data.exams);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally { setLoading(false); }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode && selectedTask) {
                const res = await api.patch(`/study/tasks/${selectedTask._id}`, formData);
                if (res.data.success) setTasks(prev => prev.map(t => t._id === selectedTask._id ? res.data.task : t));
            } else {
                const res = await api.post('/study/tasks', formData);
                if (res.data.success) setTasks(prev => [res.data.task, ...prev]);
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Task save error:', error);
        }
    };

    const toggleComplete = async (task) => {
        try {
            const newStatus = !task.completed;
            setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: newStatus } : t));
            const res = await api.patch(`/study/tasks/${task._id}`, { completed: newStatus });
            if (res.data.success) {
                setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
                const statsRes = await api.get('/study/stats');
                if (statsRes.data.success) setStats(statsRes.data.stats);
            }
        } catch { fetchData(); }
    };

    const deleteTask = async (taskId) => {
        try {
            setTasks(prev => prev.filter(t => t._id !== taskId));
            await api.delete(`/study/tasks/${taskId}`);
        } catch { fetchData(); }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '', estimatedTime: 30, notes: '', attachments: '' });
        setEditMode(false);
        setSelectedTask(null);
    };

    const openEditModal = (task) => {
        setEditMode(true);
        setSelectedTask(task);
        setFormData({
            title: task.title, description: task.description, priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            estimatedTime: task.estimatedTime
        });
        setShowModal(true);
    };

    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const xpPct = ((stats?.totalXP || 0) % 1000) / 10;

    // ── Access Control ──────────────────────────────────────────────────
    if (user && !user.isActive) return (
        <div className="min-h-screen flex items-center justify-center text-gray-900" style={{ background: '#F8FAFC' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center p-8 rounded-2xl border border-red-200 bg-white shadow-xl mx-4">
                <div className="w-20 h-20 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <IoLockClosed size={38} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black mb-2 text-gray-900">Access Restricted</h1>
                <p className="text-gray-500 mb-6">Your library membership is currently inactive. Please renew to access premium study tools.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-700 text-sm">
                    Contact the admin or visit the library office to reactivate your account.
                </div>
                <Link to="/student">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 font-semibold text-gray-700 transition-all">
                        Back to Dashboard
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    );

    // ── Main ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen text-gray-900 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-5">
                        {/* Title */}
                        <div className="flex items-center gap-4">
                            <Link to="/student">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition-all shadow-sm">
                                    <IoArrowBack size={16} /> Back
                                </motion.button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <IoRocket className="text-yellow-400" size={22} />
                                    <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                                        Study Base
                                    </h1>
                                </div>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Level <strong className="text-orange-500">{stats?.level || 1}</strong> &nbsp;·&nbsp; {stats?.totalXP || 0} XP
                                    {stats?.currentStreak > 0 && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-orange-400">
                                            <IoFlameOutline size={13} /> {stats.currentStreak}d streak
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-1 p-1 bg-gray-100 border border-gray-200 rounded-2xl w-fit">
                            {[
                                { key: 'tasks', label: 'Tasks', icon: IoList, active: 'from-blue-600 to-indigo-600' },
                                { key: 'calendar', label: 'Calendar', icon: IoCalendar, active: 'from-pink-600 to-rose-600' },
                                { key: 'analytics', label: 'Analytics', icon: IoStatsChart, active: 'from-purple-600 to-violet-600' },
                            ].map(({ key, label, icon: Icon, active }) => (
                                <button key={key} onClick={() => setView(key)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === key
                                        ? `bg-gradient-to-r ${active} text-white shadow-md`
                                        : 'text-gray-500 hover:text-gray-800'}`}>
                                    <Icon size={15} /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{(stats?.totalXP || 0) % 1000} XP</span>
                        <span>Next level: 1000 XP</span>
                    </div>
                </motion.div>

                {/* ── Body Grid ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Main Content (2/3) */}
                    <div className="lg:col-span-2 space-y-5 order-1">
                        <AnimatePresence mode="wait">

                            {/* ── TASKS VIEW ── */}
                            {view === 'tasks' && (
                                <motion.div key="tasks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                    {/* New Task CTA — top */}
                                    <motion.button
                                        onClick={() => { resetForm(); setShowModal(true); }}
                                        animate={{ boxShadow: ["0 0 0 rgba(249,115,22,0)", "0 0 30px rgba(249,115,22,0.5)", "0 0 0 rgba(249,115,22,0)"] }}
                                        transition={{ boxShadow: { duration: 2.5, repeat: Infinity } }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        className="relative group w-full rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center gap-2 text-white shadow-lg shadow-orange-500/20 cursor-pointer py-3 px-5"
                                    >
                                        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <IoAdd size={20} className="relative" />
                                        <span className="relative text-sm font-black tracking-wider">NEW TASK</span>
                                    </motion.button>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Pending', value: pendingTasks, color: 'from-blue-500 to-cyan-400' },
                                            { label: 'Completed', value: completedTasks, color: 'from-green-500 to-emerald-400' },
                                        ].map(({ label, value, color }) => (
                                            <motion.div key={label}
                                                whileHover={{ scale: 1.02 }}
                                                className="relative group rounded-2xl p-4 border border-gray-200 bg-white shadow-sm overflow-hidden">
                                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color}`} />
                                                <p className={`text-xs uppercase tracking-widest font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{label}</p>
                                                <p className="text-3xl font-black text-gray-900">{value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Task List */}
                                    <div className="space-y-3">
                                        {tasks.length === 0 ? (
                                            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-300 bg-white">
                                                <IoBookOutline size={44} className="mx-auto text-gray-300 mb-3" />
                                                <p className="text-gray-400 font-medium">No active tasks. Time to plan your success!</p>
                                            </div>
                                        ) : tasks.map((task, idx) => {
                                            const pCfg = priorityCfg[task.priority] || priorityCfg.medium;
                                            return (
                                                <motion.div key={task._id}
                                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                                                    className={`group relative rounded-2xl border transition-all duration-300 p-4 overflow-hidden
                                                        ${task.completed
                                                            ? 'opacity-50 grayscale bg-gray-50 border-gray-200'
                                                            : `bg-white border-gray-200 hover:shadow-md ${pCfg.glow}`}`}>
                                                    {/* Priority top border */}
                                                    {!task.completed && (
                                                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                                    )}
                                                    <div className="flex items-start gap-4 pl-2">
                                                        {/* Checkbox */}
                                                        <button onClick={() => toggleComplete(task)}
                                                            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.completed
                                                                ? 'bg-green-500 border-green-500'
                                                                : 'border-gray-300 hover:border-blue-400'}`}>
                                                            {task.completed && <IoCheckmark size={13} className="text-white" />}
                                                        </button>

                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`font-bold text-gray-900 truncate ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</h3>
                                                            {task.description && <p className="text-gray-500 text-sm line-clamp-1 mt-0.5">{task.description}</p>}
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pCfg.badge}`}>{pCfg.label}</span>
                                                                {task.dueDate && (
                                                                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                                                        <IoCalendar size={11} className="text-gray-400" />
                                                                        {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                                                    <IoTimer size={11} className="text-gray-400" /> {task.estimatedTime}m
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <button onClick={() => openEditModal(task)}
                                                                className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors">
                                                                <IoCreateOutline size={15} />
                                                            </button>
                                                            <button onClick={() => deleteTask(task._id)}
                                                                className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors">
                                                                <IoTrash size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── CALENDAR VIEW ── */}
                            {view === 'calendar' && (
                                <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <CalendarView tasks={tasks} exams={exams} />
                                </motion.div>
                            )}

                            {/* ── ANALYTICS VIEW ── */}
                            {view === 'analytics' && (
                                <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <StudyAnalytics stats={stats} />
                                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                                            🏆 Achievements
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <AchievementBadge achievement={{ icon: '🔥', title: 'Week Warrior', description: 'Study for 7 days in a row', progress: stats?.currentStreak || 0, total: 7 }} locked={(stats?.currentStreak || 0) < 7} />
                                            <AchievementBadge achievement={{ icon: '⚡', title: 'Focus Master', description: 'Complete 250 mins of Focus', progress: stats?.totalFocusTime || 0, total: 250 }} locked={(stats?.totalFocusTime || 0) < 250} />
                                            <AchievementBadge achievement={{ icon: '🚀', title: 'Level 5', description: 'Reach Level 5 to unlock', progress: stats?.level || 1, total: 5 }} locked={(stats?.level || 1) < 5} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Right: Sidebar (1/3) - sticky widgets */}
                    <div className="lg:col-span-1 space-y-5 order-2">
                        <div className="lg:sticky lg:top-6 space-y-5">
                            <ExamCountdown />
                            <PomodoroTimer onSessionComplete={fetchData} />

                            {/* Pro Tip */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="relative rounded-2xl border border-indigo-200 bg-indigo-50 p-5 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
                                <h3 className="font-bold mb-2 flex items-center gap-2 text-indigo-700">
                                    <IoRocket size={16} className="text-indigo-500" /> Pro Tip
                                </h3>
                                <p className="text-sm text-indigo-600 leading-relaxed">
                                    "The Pomodoro Technique optimizes your focus by breaking work into productive intervals separated by short breaks — training your brain to stay fresh and agile."
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Task Modal ──────────────────────────────────────────── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Mission' : 'New Mission'}>
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Title</label>
                        <input type="text" value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                            placeholder="What do you want to accomplish?" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Description</label>
                        <textarea value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 outline-none h-24 resize-none transition-all"
                            placeholder="Add details..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Priority</label>
                            <select value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700">Est. Minutes</label>
                            <input type="number" value={formData.estimatedTime}
                                onChange={e => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                min="5" step="5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700">Due Date</label>
                        <input type="date" value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                            {editMode ? 'Update Mission' : 'Create Task'}
                        </motion.button>
                        <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold transition-all">
                            Cancel
                        </motion.button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudyPlanner;
