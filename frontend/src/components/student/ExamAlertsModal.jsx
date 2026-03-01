import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoClose, IoAlertCircleOutline, IoOpenOutline,
    IoCalendarOutline, IoRefreshOutline, IoNewspaper,
    IoFilterOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const SOURCE_COLORS = {
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
};

const formatDate = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
};

const ExamAlertsModal = ({ isOpen, onClose }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');

    const sources = ['All', 'UPSC', 'SSC', 'IBPS', 'NTA'];

    const fetchAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/student/exam-alerts');
            setAlerts(res.data.data || []);
        } catch (e) {
            setError('Could not load exam alerts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && alerts.length === 0) fetchAlerts();
    }, [isOpen]);

    const filtered = activeFilter === 'All'
        ? alerts
        : alerts.filter(a => a.source === activeFilter);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
                onClick={e => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                    className="relative w-full sm:max-w-2xl bg-[#0c0c14] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    style={{ maxHeight: '88vh' }}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                                <IoNewspaper size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-none">Exam Alerts</h2>
                                <p className="text-gray-500 text-xs mt-0.5">Live from UPSC · SSC · IBPS · NTA</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9, rotate: 180 }}
                                onClick={fetchAlerts}
                                disabled={loading}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                                title="Refresh"
                            >
                                <IoRefreshOutline size={16} className={loading ? 'animate-spin' : ''} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <IoClose size={18} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-white/5"
                        style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <IoFilterOutline size={14} className="text-gray-500 shrink-0" />
                        {sources.map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveFilter(s)}
                                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeFilter === s
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                        {/* right breathing room */}
                        <span className="shrink-0 w-2" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                                <p className="text-gray-500 text-sm">Fetching latest exam alerts…</p>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <IoAlertCircleOutline size={32} className="text-red-400" />
                                <p className="text-gray-400 text-sm text-center">{error}</p>
                                <button onClick={fetchAlerts} className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-all">
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <IoCalendarOutline size={32} className="text-gray-600" />
                                <p className="text-gray-500 text-sm">No alerts found for {activeFilter}</p>
                            </div>
                        )}

                        {!loading && !error && filtered.map((item, i) => {
                            const c = SOURCE_COLORS[item.color] || SOURCE_COLORS.blue;
                            return (
                                <motion.a
                                    key={i}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex gap-3 p-4 rounded-xl bg-white/3 hover:bg-white/6 border border-white/6 hover:border-white/12 transition-all group cursor-pointer"
                                >
                                    {/* Source badge */}
                                    <div className="shrink-0 mt-0.5">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                                            <span className={`w-1 h-1 rounded-full ${c.dot}`} />
                                            {item.source}
                                        </span>
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-white text-sm font-semibold leading-snug group-hover:text-amber-200 transition-colors line-clamp-2">
                                                {item.title}
                                            </p>
                                            <IoOpenOutline size={14} className="shrink-0 text-gray-600 group-hover:text-gray-300 transition-colors mt-0.5" />
                                        </div>
                                        {item.description && (
                                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-gray-600 text-[10px]">{formatDate(item.pubDate)}</span>
                                            <span className="text-gray-700 text-[10px]">·</span>
                                            <span className="text-gray-600 text-[10px]">{item.category}</span>
                                        </div>
                                    </div>
                                </motion.a>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/5 text-center">
                        <p className="text-gray-600 text-[10px]">
                            Data sourced from official RSS feeds of UPSC, SSC, IBPS & NTA · Updates every 30 min
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExamAlertsModal;
