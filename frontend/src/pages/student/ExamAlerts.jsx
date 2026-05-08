import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoAlertCircleOutline, IoOpenOutline,
    IoRefresh, IoTimeOutline, IoCalendarOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const CATEGORY_COLORS = {
    red:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#dc2626' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  text: '#2563eb' },
    green:  { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: '#16a34a' },
    purple: { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#7c3aed' },
    orange: { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#ea580c' },
};

const SOURCES = ['All', 'UPSC', 'SSC', 'IBPS', 'NTA'];

const formatDate = (iso) => {
    try {
        const diff = (Date.now() - new Date(iso)) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return ''; }
};

const ExamAlerts = () => {
    const [alerts, setAlerts]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeTab, setTab]       = useState('All');
    const [refreshing, setRefreshing] = useState(false);
    const [lang, setLang]           = useState('en');

    useEffect(() => { fetchAlerts(); }, [lang]);

    const fetchAlerts = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/student/exam-alerts?lang=${lang}`);
            setAlerts(res.data.data || []);
        } catch {
            setError('Failed to load exam alerts.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLangToggle = (l) => { if (l === lang) return; setLang(l); setTab('All'); };
    const filtered = activeTab === 'All' ? alerts : alerts.filter(a => a.source === activeTab);
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <IoAlertCircleOutline size={16} className="text-orange-500" />
                        <h1 className="text-gray-900 font-bold text-base">Exam Alerts</h1>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    {/* Language toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => handleLangToggle(l)}
                                className="px-3 py-1.5 text-xs font-bold transition-all"
                                style={{
                                    background: lang === l ? '#f97316' : 'transparent',
                                    color: lang === l ? '#fff' : '#6b7280',
                                }}>
                                {l === 'en' ? 'EN' : 'HI'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchAlerts(true)} disabled={refreshing}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                        <IoRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                {/* Source tabs */}
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {SOURCES.map(src => (
                        <button key={src} onClick={() => setTab(src)}
                            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === src ? '#f97316' : '#f1f5f9',
                                color: activeTab === src ? '#fff' : '#64748b',
                                border: activeTab === src ? 'none' : '1px solid #e2e8f0',
                            }}>
                            {src}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#f97316' }} />
                    <p className="text-gray-500 text-xs font-medium">{today}</p>
                    {!loading && <span className="ml-auto text-xs text-gray-400">{filtered.length} alerts</span>}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-orange-300 border-t-orange-500 animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl p-4 text-red-600 text-sm border border-red-200 bg-red-50 text-center">
                        {error}
                        <button onClick={() => fetchAlerts()} className="block mx-auto mt-2 text-xs text-red-500 underline">Try again</button>
                    </div>
                )}

                {!loading && !error && (
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3">
                            {filtered.length === 0 ? (
                                <div className="py-16 text-center">
                                    <IoCalendarOutline size={32} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">No alerts for {activeTab}</p>
                                </div>
                            ) : filtered.map((item, i) => {
                                const c = CATEGORY_COLORS[item.color] || CATEGORY_COLORS.orange;
                                return (
                                    <motion.a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        className="block group rounded-xl p-4 border border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 min-h-[40px] rounded-full flex-shrink-0 mt-0.5" style={{ background: '#f97316', opacity: 0.8 }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                                                        {item.source}
                                                    </span>
                                                    {item.category && <span className="text-[10px] text-gray-400">{item.category}</span>}
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-auto">
                                                        <IoTimeOutline size={10} />{formatDate(item.pubDate)}
                                                    </span>
                                                </div>
                                                <h3 className="text-gray-800 text-sm font-semibold leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                                {item.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>}
                                                <div className="flex items-center justify-end mt-2">
                                                    <IoOpenOutline size={12} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.a>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}

                {!loading && (
                    <p className="text-center text-gray-400 text-[10px] mt-8">
                        Sourced from official RSS feeds · UPSC · SSC · IBPS · NTA · Updates every 30 min
                    </p>
                )}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
};

export default ExamAlerts;
