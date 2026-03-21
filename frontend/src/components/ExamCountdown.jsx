import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoAdd, IoTrash, IoTimeOutline, IoBookOutline } from 'react-icons/io5';
import Button from './ui/Button';
import Modal from './ui/Modal';
import api from '../utils/api';

const ExamCountdown = () => {
    const [exams, setExams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', date: '', subject: 'General', color: '#3B82F6' });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/study/exams');
            if (res.data.success) {
                setExams(res.data.exams);
            }
        } catch (error) {
            console.error('Fetch Exams Error:', error);
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/study/exams', formData);
            if (res.data.success) {
                setExams([...exams, res.data.exam].sort((a, b) => new Date(a.date) - new Date(b.date)));
                setShowModal(false);
                setFormData({ title: '', date: '', subject: 'General', color: '#3B82F6' });
            }
        } catch (error) {
            console.error('Create Exam Error:', error);
        }
    };

    const handleDeleteExam = async (id) => {
        try {
            await api.delete(`/study/exams/${id}`);
            setExams(exams.filter(e => e._id !== id));
        } catch (error) {
            console.error('Delete Exam Error:', error);
        }
    };

    const getDaysRemaining = (dateString) => {
        const examDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        examDate.setHours(0, 0, 0, 0);
        const diffTime = examDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <IoTimeOutline className="text-blue-400" />
                    Exam Countdown
                </h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                >
                    <IoAdd size={18} />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {exams.length > 0 ? (
                    exams.map(exam => {
                        const daysLeft = getDaysRemaining(exam.date);
                        return (
                            <motion.div
                                key={exam._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-none w-56 bg-gray-800 border border-gray-700 rounded-xl p-4 relative group snap-start shadow-lg"
                            >
                                {/* Color accent line */}
                                <div
                                    className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl"
                                    style={{ backgroundColor: exam.color }}
                                />

                                <button
                                    onClick={() => handleDeleteExam(exam._id)}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <IoTrash size={16} />
                                </button>

                                <div className="ml-2">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                                        <IoBookOutline /> {exam.subject}
                                    </div>
                                    <h4 className="font-bold text-lg text-white mb-3 truncate pr-4" title={exam.title}>{exam.title}</h4>

                                    <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700/50 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 font-medium">Days Left:</span>
                                        <span className={`text-xl font-bold ${daysLeft <= 3 ? 'text-red-400 animate-pulse' : daysLeft <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {daysLeft < 0 ? 'Done' : daysLeft}
                                        </span>
                                    </div>

                                    <div className="mt-2 text-xs text-right text-gray-500">
                                        {new Date(exam.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="w-full text-center py-6 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 mb-3 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-semibold transition-all"
                        >
                            <IoAdd size={14} /> Add your first exam
                        </button>
                        <p className="text-gray-600 text-xs italic">No upcoming exams.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Exam">
                <form onSubmit={handleCreateExam} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Exam Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                            placeholder="e.g. Maths Final"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-300">Subject</label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                placeholder="e.g. Physics"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Color Tag</label>
                        <div className="flex gap-2">
                            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-4">Add Countdown</Button>
                </form>
            </Modal>
        </div>
    );
};

export default ExamCountdown;
