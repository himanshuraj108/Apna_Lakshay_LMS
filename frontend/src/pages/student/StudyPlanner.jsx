import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { IoArrowBack, IoAdd, IoCheckmark, IoTrash, IoCreateOutline } from 'react-icons/io5';

const StudyPlanner = () => {
    const [tasks, setTasks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
    });

    useEffect(() => {
        // Load tasks from localStorage
        const savedTasks = localStorage.getItem('studyTasks');
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        }
    }, []);

    const saveTasks = (updatedTasks) => {
        setTasks(updatedTasks);
        localStorage.setItem('studyTasks', JSON.stringify(updatedTasks));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editMode) {
            const updatedTasks = tasks.map(t =>
                t.id === selectedTask.id ? { ...t, ...formData } : t
            );
            saveTasks(updatedTasks);
        } else {
            const newTask = {
                id: Date.now(),
                ...formData,
                completed: false,
                createdAt: new Date().toISOString()
            };
            saveTasks([...tasks, newTask]);
        }

        setShowModal(false);
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
    };

    const toggleComplete = (id) => {
        const updatedTasks = tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        saveTasks(updatedTasks);
    };

    const deleteTask = (id) => {
        if (window.confirm('Delete this task?')) {
            saveTasks(tasks.filter(t => t.id !== id));
        }
    };

    const openEditModal = (task) => {
        setEditMode(true);
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditMode(false);
        setSelectedTask(null);
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
        setShowModal(true);
    };

    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'red',
            medium: 'yellow',
            low: 'green'
        };
        return colors[priority] || 'green';
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/student">
                        <Button variant="secondary">
                            <IoArrowBack className="inline mr-2" /> Back to Dashboard
                        </Button>
                    </Link>
                    <Button variant="primary" onClick={openAddModal}>
                        <IoAdd className="inline mr-2" size={20} /> Add Task
                    </Button>
                </div>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Study Planner
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <p className="text-sm text-gray-400 mb-2">Total Tasks</p>
                        <p className="text-4xl font-bold">{tasks.length}</p>
                    </Card>
                    <Card>
                        <p className="text-sm text-gray-400 mb-2">Pending</p>
                        <p className="text-4xl font-bold text-yellow-400">{pendingTasks}</p>
                    </Card>
                    <Card>
                        <p className="text-sm text-gray-400 mb-2">Completed</p>
                        <p className="text-4xl font-bold text-green-400">{completedTasks}</p>
                    </Card>
                </div>

                {/* Progress Bar */}
                {tasks.length > 0 && (
                    <Card className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{Math.round((completedTasks / tasks.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4">
                            <div
                                className="bg-gradient-primary h-4 rounded-full transition-all duration-500"
                                style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                            />
                        </div>
                    </Card>
                )}

                {/* Tasks List */}
                {tasks.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <p className="text-gray-400 mb-4">No tasks yet. Add your first study task!</p>
                            <Button variant="primary" onClick={openAddModal}>
                                <IoAdd className="inline mr-2" /> Add Task
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {sortedTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className={task.completed ? 'opacity-60' : ''}>
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleComplete(task.id)}
                                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${task.completed
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-white/30 hover:border-white/50'
                                                }`}
                                        >
                                            {task.completed && <IoCheckmark size={16} />}
                                        </button>

                                        {/* Task Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3
                                                    className={`text-lg font-bold ${task.completed ? 'line-through text-gray-500' : ''
                                                        }`}
                                                >
                                                    {task.title}
                                                </h3>
                                                <div className="flex gap-2">
                                                    <Badge variant={getPriorityColor(task.priority)}>
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {task.description && (
                                                <p className="text-gray-400 mb-3">{task.description}</p>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-4 text-sm text-gray-400">
                                                    {task.dueDate && (
                                                        <span>Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</span>
                                                    )}
                                                </div>

                                                {!task.completed && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(task)}
                                                            className="text-blue-400 hover:text-blue-300 transition-colors"
                                                        >
                                                            <IoCreateOutline size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            <IoTrash size={20} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editMode ? 'Edit Task' : 'Add New Task'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Task Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input"
                                placeholder="e.g., Complete Math Assignment"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input min-h-[100px]"
                                placeholder="Add notes or details..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="input"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" variant="primary" className="flex-1">
                                {editMode ? 'Update Task' : 'Add Task'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default StudyPlanner;
