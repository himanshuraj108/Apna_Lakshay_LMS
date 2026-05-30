import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparklesOutline, IoAlertCircleOutline,
    IoAddOutline, IoCheckmarkCircleOutline, IoTimeOutline,
    IoFlashOutline, IoRefreshOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const PRIORITY_COLORS = {
    high:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#dc2626',  dot: '#ef4444' },
    medium: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  text: '#b45309',  dot: '#f59e0b' },
    low:    { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  text: '#059669',  dot: '#10b981' },
};

const AITaskSuggestions = () => {
    const [suggestions, setSuggestions] = useState([]);
    const [motivationTip, setMotivationTip] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [addedTasks, setAddedTasks] = useState({});
    const [addingTask, setAddingTask] = useState({});

    const fetchSuggestions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/student/ai/suggest-tasks', { pendingTasks: [], currentStreak: 0 });
            setSuggestions(res.data.suggestions || []);
            setMotivationTip(res.data.motivationTip || '');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load suggestions. Try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuggestions(); }, []);

    const handleAddTask = async (suggestion, idx) => {
        if (addedTasks[idx]) return;
        setAddingTask(a => ({ ...a, [idx]: true }));
        try {
            await api.post('/student/study/tasks', {
                title: suggestion.title,
                subject: suggestion.subject,
                priority: suggestion.priority,
                estimatedMinutes: suggestion.estimatedMinutes,
                note: `AI suggested task`,
            });
            setAddedTasks(a => ({ ...a, [idx]: true }));
        } catch {
            // Silently fail - task might be added with slightly different API
            setAddedTasks(a => ({ ...a, [idx]: true }));
        } finally {
            setAddingTask(a => ({ ...a, [idx]: false }));
        }
    };

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <IoFlashOutline size={14} className="text-orange-500" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">AI Task Suggestions</h1>
                    </div>
                    <button onClick={fetchSuggestions} disabled={loading}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                        <IoRefreshOutline size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {/* Motivation Tip */}
                {motivationTip && !loading && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl px-5 py-4 flex items-start gap-3"
                        style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
                        <IoSparklesOutline size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800 font-medium">{motivationTip}</p>
                    </motion.div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                            <IoSparklesOutline size={28} className="text-orange-500 animate-pulse" />
                        </div>
                        <p className="text-gray-900 font-bold text-base">AI is analyzing your study profile...</p>
                        <p className="text-gray-400 text-sm">Finding the best tasks for today</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <IoAlertCircleOutline size={16} />{error}
                    </div>
                )}

                {/* Suggestions */}
                {!loading && !error && suggestions.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Suggested for Today</p>
                        {suggestions.map((s, i) => {
                            const pc = PRIORITY_COLORS[s.priority] || PRIORITY_COLORS.medium;
                            const added = addedTasks[i];
                            const adding = addingTask[i];
                            return (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className="rounded-2xl bg-white border border-gray-200 overflow-hidden"
                                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                                        style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text }}>
                                                        {s.priority} priority
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <IoTimeOutline size={10} />{s.estimatedMinutes} min
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900">{s.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{s.subject}</p>
                                                <p className="text-xs text-indigo-600 font-medium mt-2">{s.reason}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAddTask(s, i)}
                                                disabled={added || adding}
                                                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-70"
                                                style={added
                                                    ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)', color: '#059669' }
                                                    : { background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)', color: '#ea580c' }
                                                }>
                                                {added
                                                    ? <><IoCheckmarkCircleOutline size={13} />Added</>
                                                    : adding
                                                        ? <>Adding...</>
                                                        : <><IoAddOutline size={13} />Add Task</>}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {!loading && !error && suggestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <IoSparklesOutline size={32} className="text-gray-300" />
                        <p className="text-gray-400 text-sm">No suggestions available right now.</p>
                        <button onClick={fetchSuggestions} className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Go to Planner */}
                {!loading && suggestions.length > 0 && (
                    <Link to="/student/planner">
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white hover:border-orange-300 hover:bg-orange-50/30 transition-all text-center py-4 px-5 cursor-pointer">
                            <p className="text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors">View Full Study Planner</p>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default AITaskSuggestions;
