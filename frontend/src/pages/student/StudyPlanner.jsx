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

const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F7F3EC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
    </>
);

const priorityCfg = {
    high:   { label: 'High',   badge: 'bg-red-50 text-red-600 border-red-200',       glow: 'hover:border-red-200'    },
    medium: { label: 'Medium', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', glow: 'hover:border-yellow-200' },
    low:    { label: 'Low',    badge: 'bg-green-50 text-green-700 border-green-200',  glow: 'hover:border-green-200'  },
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
        } catch (error) { console.error('Task save error:', error); }
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

    if (user && !user.isActive) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center p-8 rounded-2xl mx-4"
                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <IoLockClosed size={38} style={{ color: '#ef4444' }} />
                </div>
                <h1 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>Access Restricted</h1>
                <p className="mb-6" style={{ color: '#9B7B5A' }}>Your library membership is currently inactive. Please renew to access premium study tools.</p>
                <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: '#FFF5EE', border: '1px solid #FDDCAE', color: '#92400E' }}>
                    Contact the admin or visit the library office to reactivate your account.
                </div>
                <Link to="/student">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="w-full py-3 rounded-xl font-semibold transition-all"
                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F' }}>
                        Back to Dashboard
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen pb-16" style={{ fontFamily: "'DM Sans','Inter',sans-serif", color: '#1A1A1A' }}>
            <PageBg />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-5">
                        <div className="flex items-center gap-4">
                            <Link to="/student">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                                    style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.06)' }}>
                                    <IoArrowBack size={16} /> Back
                                </motion.button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <IoRocket style={{ color: '#F97316' }} size={22} />
                                    <h1 className="text-3xl font-black" style={{ color: '#1A1A1A' }}>Study Base</h1>
                                </div>
                                <p className="text-sm mt-0.5" style={{ color: '#9B7B5A' }}>
                                    Level <strong style={{ color: '#EA580C' }}>{stats?.level || 1}</strong> &nbsp;·&nbsp; {stats?.totalXP || 0} XP
                                    {stats?.currentStreak > 0 && (
                                        <span className="ml-2 inline-flex items-center gap-1" style={{ color: '#F97316' }}>
                                            <IoFlameOutline size={13} /> {stats.currentStreak}d streak
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: '#F5F0EA', border: '1px solid #EDE8E0' }}>
                            {[
                                { key: 'tasks',     label: 'Tasks',     icon: IoList      },
                                { key: 'calendar',  label: 'Calendar',  icon: IoCalendar  },
                                { key: 'analytics', label: 'Analytics', icon: IoStatsChart },
                            ].map(({ key, label, icon: Icon }) => (
                                <button key={key} onClick={() => setView(key)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                    style={view === key
                                        ? { background: '#FFFFFF', color: '#EA580C', border: '1.5px solid #FDDCAE', boxShadow: '0 2px 6px rgba(249,115,22,0.1)' }
                                        : { color: '#9B7B5A', border: '1.5px solid transparent' }}>
                                    <Icon size={15} /> {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="absolute top-0 left-0 h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg,#F97316,#EA580C)' }} />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{ color: '#9B7B5A' }}>
                        <span>{(stats?.totalXP || 0) % 1000} XP</span>
                        <span>Next level: 1000 XP</span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5 order-1">
                        <AnimatePresence mode="wait">

                            {view === 'tasks' && (
                                <motion.div key="tasks" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                                    <motion.button
                                        onClick={() => { resetForm(); setShowModal(true); }}
                                        animate={{ boxShadow: ["0 0 0 rgba(249,115,22,0)", "0 0 30px rgba(249,115,22,0.4)", "0 0 0 rgba(249,115,22,0)"] }}
                                        transition={{ boxShadow: { duration: 2.5, repeat: Infinity } }}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                        className="relative group w-full rounded-2xl overflow-hidden flex items-center justify-center gap-2 text-white cursor-pointer py-3 px-5"
                                        style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 4px 20px rgba(249,115,22,0.25)' }}>
                                        <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <IoAdd size={20} className="relative" />
                                        <span className="relative text-sm font-black tracking-wider">NEW TASK</span>
                                    </motion.button>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Pending',   value: pendingTasks,   color: 'from-blue-500 to-cyan-400'   },
                                            { label: 'Completed', value: completedTasks, color: 'from-green-500 to-emerald-400' },
                                        ].map(({ label, value, color }) => (
                                            <motion.div key={label} whileHover={{ scale: 1.02 }}
                                                className="relative rounded-2xl p-4 overflow-hidden"
                                                style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}>
                                                <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${color} rounded-t-2xl`} />
                                                <p className={`text-xs uppercase tracking-widest font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{label}</p>
                                                <p className="text-3xl font-black" style={{ color: '#1A1A1A' }}>{value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        {tasks.length === 0 ? (
                                            <div className="text-center py-20 rounded-2xl border-2 border-dashed"
                                                style={{ borderColor: '#EDE8E0', background: '#FFFFFF' }}>
                                                <IoBookOutline size={44} className="mx-auto mb-3" style={{ color: '#FDDCAE' }} />
                                                <p className="font-medium" style={{ color: '#9B7B5A' }}>No active tasks. Time to plan your success!</p>
                                            </div>
                                        ) : tasks.map((task, idx) => {
                                            const pCfg = priorityCfg[task.priority] || priorityCfg.medium;
                                            return (
                                                <motion.div key={task._id}
                                                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                                                    className="group relative rounded-2xl p-4 overflow-hidden transition-all"
                                                    style={task.completed
                                                        ? { opacity: 0.5, filter: 'grayscale(1)', background: '#FFFAF5', border: '1.5px solid #EDE8E0' }
                                                        : { background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}
                                                    onMouseEnter={e => { if (!task.completed) e.currentTarget.style.borderColor = '#FDDCAE'; }}
                                                    onMouseLeave={e => { if (!task.completed) e.currentTarget.style.borderColor = '#EDE8E0'; }}>
                                                    {!task.completed && (
                                                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                                    )}
                                                    <div className="flex items-start gap-4 pl-2">
                                                        <button onClick={() => toggleComplete(task)}
                                                            className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                                                            style={task.completed
                                                                ? { background: '#10b981', borderColor: '#10b981' }
                                                                : { borderColor: '#EDE8E0' }}>
                                                            {task.completed && <IoCheckmark size={13} className="text-white" />}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className={`font-bold truncate ${task.completed ? 'line-through' : ''}`}
                                                                style={{ color: task.completed ? '#9B7B5A' : '#1A1A1A' }}>{task.title}</h3>
                                                            {task.description && <p className="text-sm line-clamp-1 mt-0.5" style={{ color: '#9B7B5A' }}>{task.description}</p>}
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pCfg.badge}`}>{pCfg.label}</span>
                                                                {task.dueDate && (
                                                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                                                        style={{ color: '#9B7B5A', background: '#F5F0EA', border: '1px solid #EDE8E0' }}>
                                                                        <IoCalendar size={11} style={{ color: '#9B7B5A' }} />
                                                                        {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                                                    style={{ color: '#9B7B5A', background: '#F5F0EA', border: '1px solid #EDE8E0' }}>
                                                                    <IoTimer size={11} style={{ color: '#9B7B5A' }} /> {task.estimatedTime}m
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <button onClick={() => openEditModal(task)}
                                                                className="p-1.5 rounded-lg transition-colors"
                                                                style={{ background: 'rgba(249,115,22,0.1)', color: '#EA580C' }}>
                                                                <IoCreateOutline size={15} />
                                                            </button>
                                                            <button onClick={() => deleteTask(task._id)}
                                                                className="p-1.5 rounded-lg transition-colors"
                                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
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

                            {view === 'calendar' && (
                                <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <CalendarView tasks={tasks} exams={exams} />
                                </motion.div>
                            )}

                            {view === 'analytics' && (
                                <motion.div key="analytics" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <StudyAnalytics stats={stats} />
                                    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                        <h3 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
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

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-5 order-2">
                        <div className="lg:sticky lg:top-6 space-y-5">
                            <ExamCountdown />
                            <PomodoroTimer onSessionComplete={fetchData} />
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="relative rounded-2xl p-5 overflow-hidden"
                                style={{ background: '#FFF5EE', border: '1.5px solid #FDDCAE' }}>
                                <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#F97316,#EA580C,transparent)' }} />
                                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#92400E' }}>
                                    <IoRocket size={16} style={{ color: '#F97316' }} /> Pro Tip
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>
                                    "The Pomodoro Technique optimizes your focus by breaking work into productive intervals separated by short breaks — training your brain to stay fresh and agile."
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMode ? 'Edit Mission' : 'New Mission'}>
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#6B6560' }}>Title</label>
                        <input type="text" value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                            style={{ background: '#FFFAF5', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                            onFocus={e => { e.target.style.borderColor='#F97316'; e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor='#EDE8E0'; e.target.style.boxShadow='none'; }}
                            placeholder="What do you want to accomplish?" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#6B6560' }}>Description</label>
                        <textarea value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-xl px-4 py-2.5 outline-none h-24 resize-none transition-all"
                            style={{ background: '#FFFAF5', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                            onFocus={e => { e.target.style.borderColor='#F97316'; e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor='#EDE8E0'; e.target.style.boxShadow='none'; }}
                            placeholder="Add details..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#6B6560' }}>Priority</label>
                            <select value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                                style={{ background: '#FFFAF5', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}>
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#6B6560' }}>Est. Minutes</label>
                            <input type="number" value={formData.estimatedTime}
                                onChange={e => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                                className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                                style={{ background: '#FFFAF5', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                                min="5" step="5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: '#6B6560' }}>Due Date</label>
                        <input type="date" value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                            style={{ background: '#FFFAF5', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex-1 py-2.5 rounded-xl text-white font-semibold transition-all"
                            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                            {editMode ? 'Update Mission' : 'Create Task'}
                        </motion.button>
                        <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-2.5 rounded-xl font-semibold transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#6B6560' }}>
                            Cancel
                        </motion.button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudyPlanner;
