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
        <div className="min-h-screen" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            {/* Header */}
            <div className="sticky top-0 z-30" style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8E0' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg transition-all" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F' }}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <IoAlertCircleOutline size={16} style={{ color: '#F97316' }} />
                        <h1 className="font-bold text-base" style={{ color: '#1A1A1A' }}>Exam Alerts</h1>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    {/* Language toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1.5px solid #EDE8E0' }}>
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => handleLangToggle(l)}
                                className="px-3 py-1.5 text-xs font-bold transition-all"
                                style={{
                                    background: lang === l ? '#F97316' : 'transparent',
                                    color: lang === l ? '#fff' : '#9B7B5A',
                                }}>
                                {l === 'en' ? 'EN' : 'HI'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchAlerts(true)} disabled={refreshing}
                        className="p-2 rounded-lg transition-all disabled:opacity-50"
                        style={{ color: '#9B7B5A' }}>
                        <IoRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                {/* Source tabs */}
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {SOURCES.map(src => (
                        <button key={src} onClick={() => setTab(src)}
                            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === src ? '#F97316' : '#F5F0EA',
                                color: activeTab === src ? '#fff' : '#9B7B5A',
                                border: activeTab === src ? 'none' : '1px solid #EDE8E0',
                            }}>
                            {src}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#F97316' }} />
                    <p className="text-xs font-medium" style={{ color: '#9B7B5A' }}>{today}</p>
                    {!loading && <span className="ml-auto text-xs" style={{ color: '#9B7B5A' }}>{filtered.length} alerts</span>}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid #FDDCAE', borderTopColor: '#F97316' }} />
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
                                    <IoCalendarOutline size={32} className="mx-auto mb-3" style={{ color: '#FDDCAE' }} />
                                    <p className="text-sm" style={{ color: '#9B7B5A' }}>No alerts for {activeTab}</p>
                                </div>
                            ) : filtered.map((item, i) => {
                                const c = CATEGORY_COLORS[item.color] || CATEGORY_COLORS.orange;
                                return (
                                    <motion.a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        className="block group rounded-xl p-4 transition-all cursor-pointer"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDDCAE'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.11)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8E0'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,120,60,0.07)'; }}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 min-h-[40px] rounded-full flex-shrink-0 mt-0.5" style={{ background: '#F97316', opacity: 0.8 }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                                                        {item.source}
                                                    </span>
                                                    {item.category && <span className="text-[10px]" style={{ color: '#9B7B5A' }}>{item.category}</span>}
                                                    <span className="text-[10px] flex items-center gap-1 ml-auto" style={{ color: '#9B7B5A' }}>
                                                        <IoTimeOutline size={10} />{formatDate(item.pubDate)}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold leading-snug group-hover:text-orange-600 transition-colors line-clamp-2" style={{ color: '#1A1A1A' }}>
                                                    {item.title}
                                                </h3>
                                                {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9B7B5A' }}>{item.description}</p>}
                                                <div className="flex items-center justify-end mt-2">
                                                    <IoOpenOutline size={12} className="group-hover:text-orange-400 transition-colors" style={{ color: '#FDDCAE' }} />
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
                    <p className="text-center text-[10px] mt-8" style={{ color: '#9B7B5A' }}>
                        Sourced from official RSS feeds · UPSC · SSC · IBPS · NTA · Updates every 30 min
                    </p>
                )}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
};

export default ExamAlerts;
