import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PomodoroTimer from '../../components/PomodoroTimer';
import StudyAnalytics from '../../components/StudyAnalytics';
import AchievementBadge from '../../components/AchievementBadge';
import CalendarView from '../../components/CalendarView';
import ExamCountdown from '../../components/ExamCountdown';
import api from '../../utils/api';
import {
    IoArrowBack, IoAdd, IoCheckmark, IoTrash, IoCreateOutline,
    IoCalendar, IoList, IoStatsChart, IoTimer, IoRocket,
    IoFilter, IoSearch, IoDocumentText,
    IoLockClosed
} from 'react-icons/io5';

const StudyPlanner = () => {
    const { user } = useAuth();
    const [view, setView] = useState('tasks'); // 'tasks', 'analytics', 'achievements'
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [exams, setExams] = useState([]); // Add exams state
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        estimatedTime: 30,
        notes: '',
        attachments: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode && selectedTask) {
                const res = await api.patch(`/study/tasks/${selectedTask._id}`, formData);
                if (res.data.success) {
                    setTasks(prev => prev.map(t => t._id === selectedTask._id ? res.data.task : t));
                }
            } else {
                const res = await api.post('/study/tasks', formData);
                if (res.data.success) {
                    setTasks(prev => [res.data.task, ...prev]);
                }
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Task save error:', error);
            alert('Failed to save task');
        }
    };

    const toggleComplete = async (task) => {
        try {
            // Optimistic update
            const newStatus = !task.completed;
            const updatedTaskLocal = { ...task, completed: newStatus };
            setTasks(prev => prev.map(t => t._id === task._id ? updatedTaskLocal : t));

            const res = await api.patch(`/study/tasks/${task._id}`, {
                completed: newStatus
            });

            if (res.data.success) {
                // Update with server response (contains XP / stats updates)
                setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
                // Refetch stats to update streak/XP display
                const statsRes = await api.get('/study/stats');
                if (statsRes.data.success) setStats(statsRes.data.stats);
            }
        } catch (error) {
            console.error('Toggle complete error:', error);
            // Revert changes
            fetchData();
        }
    };

    const deleteTask = async (taskId) => {
        // Instant delete (no confirmation alert)
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t._id !== taskId));
            await api.delete(`/study/tasks/${taskId}`);
        } catch (error) {
            console.error('Delete error:', error);
            fetchData(); // Sync if failed
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '', estimatedTime: 30 });
        setEditMode(false);
        setSelectedTask(null);
    };

    const openEditModal = (task) => {
        setEditMode(true);
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Format date for input
            estimatedTime: task.estimatedTime
        });
        setShowModal(true);
    };

    // Derived state
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    // Access Control Check
    if (user && !user.isActive) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-gray-900 text-white">
                <div className="max-w-md w-full text-center p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IoLockClosed size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
                    <p className="text-gray-400 mb-6">
                        Your library membership is currently inactive. Please renew your subscription to access premium study tools.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-yellow-200 text-sm">
                        Contact the admin or visit the library office to reactivate your account.
                    </div>
                    <Link to="/student">
                        <Button variant="secondary" className="w-full">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 pb-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Navigation & Content (2/3 width) - Second on mobile */}
                <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link to="/student">
                                <Button variant="secondary" className="!p-2 rounded-full">
                                    <IoArrowBack size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                    <IoRocket className="text-yellow-400" />
                                    Study Base
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Level {stats?.level || 1} • {stats?.totalXP || 0} XP
                                </p>
                            </div>
                        </div>

                        <div className="flex bg-gray-800 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => setView('tasks')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <IoList /> Tasks
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <IoCalendar /> Calendar
                            </button>
                            <button
                                onClick={() => setView('analytics')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'analytics' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <IoStatsChart /> Analytics
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar (Global XP) */}
                    <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                            style={{ width: `${((stats?.totalXP || 0) % 1000) / 10}%` }}
                        ></div>
                    </div>

                    {/* Main Content Area */}
                    <AnimatePresence mode="wait">
                        {view === 'tasks' ? (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                                    <Card className="!p-4 bg-blue-500/10 border-blue-500/20">
                                        <p className="text-xs text-blue-300 uppercase font-bold">Pending</p>
                                        <p className="text-2xl font-bold text-white">{pendingTasks}</p>
                                    </Card>
                                    <Card className="!p-4 bg-green-500/10 border-green-500/20">
                                        <p className="text-xs text-green-300 uppercase font-bold">Completed</p>
                                        <p className="text-2xl font-bold text-white">{completedTasks}</p>
                                    </Card>
                                    <motion.button
                                        onClick={() => { resetForm(); setShowModal(true); }}
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            boxShadow: ["0px 0px 0px rgba(239,68,68,0)", "0px 0px 20px rgba(239,68,68,0.6)", "0px 0px 0px rgba(239,68,68,0)"]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            delay: 0.2,
                                            boxShadow: {
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: "reverse"
                                            }
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex flex-col items-center justify-center text-white shadow-lg shadow-orange-500/20 cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <div className="relative z-10 flex flex-col items-center">
                                            <IoAdd size={32} className="mb-1" />
                                            <span className="text-sm font-bold tracking-wider">NEW TASK</span>
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Task List */}
                                <div className="space-y-3">
                                    {tasks.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
                                            <p className="text-gray-500">No active tasks. Time to plan your success!</p>
                                        </div>
                                    ) : (
                                        tasks.map(task => (
                                            <Card key={task._id} className={`!p-4 group transition-all duration-300 hover:translate-x-1 hover:border-blue-500/30 ${task.completed ? 'opacity-50 grayscale' : 'bg-gray-800/80'}`}>
                                                <div className="flex items-start gap-4">
                                                    <button
                                                        onClick={() => toggleComplete(task)}
                                                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-gray-500 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {task.completed && <IoCheckmark size={14} className="text-white" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`text-lg font-bold text-white truncate ${task.completed ? 'line-through' : ''}`}>
                                                            {task.title}
                                                        </h3>
                                                        {task.description && <p className="text-gray-400 text-sm line-clamp-1">{task.description}</p>}

                                                        <div className="flex gap-3 mt-2 text-xs text-gray-500 items-center">
                                                            <Badge variant={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'green'}>
                                                                {task.priority}
                                                            </Badge>
                                                            {task.dueDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <IoCalendar /> {new Date(task.dueDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <IoTimer /> {task.estimatedTime}m
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(task)} className="text-blue-400 hover:text-white">
                                                            <IoCreateOutline size={18} />
                                                        </button>
                                                        <button onClick={() => deleteTask(task._id)} className="text-red-400 hover:text-white">
                                                            <IoTrash size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        ) : view === 'calendar' ? (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <CalendarView tasks={tasks} exams={exams} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <StudyAnalytics stats={stats} />
                                {/* ... existing achievements ... */}

                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Mock Achievements for now */}
                                        <AchievementBadge
                                            achievement={{
                                                icon: '🔥',
                                                title: 'Week Warrior',
                                                description: 'Study for 7 days in a row',
                                                progress: stats?.currentStreak || 0,
                                                total: 7
                                            }}
                                            locked={(stats?.currentStreak || 0) < 7}
                                        />
                                        <AchievementBadge
                                            achievement={{
                                                icon: '⚡',
                                                title: 'Focus Master',
                                                description: 'Complete 250 mins of Focus',
                                                progress: stats?.totalFocusTime || 0,
                                                total: 250
                                            }}
                                            locked={(stats?.totalFocusTime || 0) < 250}
                                        />
                                        <AchievementBadge
                                            achievement={{
                                                icon: '🚀',
                                                title: 'Level 5',
                                                description: 'Reach Level 5 to unlock',
                                                progress: stats?.level || 1,
                                                total: 5
                                            }}
                                            locked={(stats?.level || 1) < 5}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Timer & Widgets (1/3 width) - Sticky on Desktop - First on mobile */}
                <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
                    <div className="sticky top-6">
                        <div className="mb-8">
                            <ExamCountdown />
                        </div>
                        <PomodoroTimer onSessionComplete={fetchData} />

                        <Card className="mt-6 bg-gradient-to-br from-indigo-900/50 to-blue-900/20 border-indigo-500/30">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                <IoRocket className="text-indigo-400" />
                                Pro Tip
                            </h3>
                            <p className="text-sm text-gray-300">
                                "The Pomodoro Technique optimizes your focus by breaking work into productive intervals separated by short breaks. It trains your brain to stay fresh and agile."
                            </p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editMode ? 'Edit Mission' : 'New Mission'}
            >
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="What do you want to accomplish?"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24 resize-none"
                            placeholder="Add details..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Est. Minutes</label>
                            <input
                                type="number"
                                value={formData.estimatedTime}
                                onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                min="5"
                                step="5"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Due Date</label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button type="submit" variant="primary" className="flex-1">
                            {editMode ? 'Update' : 'Create Task'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudyPlanner;
