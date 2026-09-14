import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoNewspaper, IoRefresh, IoOpenOutline, IoTimeOutline } from 'react-icons/io5';
import api from '../../utils/api';

const CATEGORY_COLORS = {
    india:   { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  text: '#ea580c' },
    world:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  text: '#2563eb' },
    economy: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',   text: '#16a34a' },
    science: { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#7c3aed' },
    sports:  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   text: '#dc2626' },
    govt:    { bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)',   text: '#b45309' },
};

const TABS = [
    { id: 'all',     label: 'All'     },
    { id: 'india',   label: 'India'   },
    { id: 'world',   label: 'World'   },
    { id: 'economy', label: 'Economy' },
    { id: 'science', label: 'Science' },
    { id: 'sports',  label: 'Sports'  },
    { id: 'govt',    label: 'Govt'    },
];

const timeAgo = (isoStr) => {
    const diff = (Date.now() - new Date(isoStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const CurrentAffairs = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [activeTab, setTab]     = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [lang, setLang]         = useState('en');

    useEffect(() => { fetchArticles(); }, [lang]);

    const fetchArticles = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/student/current-affairs?lang=${lang}`);
            setArticles(res.data.data || []);
        } catch {
            setError('Failed to load news. Check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLangToggle = (newLang) => { if (newLang === lang) return; setLang(newLang); setTab('all'); };
    const filtered = activeTab === 'all' ? articles : articles.filter(a => a.category === activeTab);
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            {/* Header */}
            <div className="sticky top-0 z-30" style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8E0' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg transition-all" style={{ background: '#FFFFFF', border: '1px solid #EDE8E0', color: '#78350F' }}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <IoNewspaper size={16} style={{ color: '#F97316' }} />
                        <h1 className="font-bold text-base" style={{ color: '#1A1A1A' }}>Current Affairs</h1>
                    </div>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1.5px solid #EDE8E0' }}>
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => handleLangToggle(l)}
                                className="px-3 py-1.5 text-xs font-bold transition-all"
                                style={{
                                    background: lang === l ? '#F97316' : 'transparent',
                                    color: lang === l ? '#FFFFFF' : '#9B7B5A',
                                }}>
                                {l === 'en' ? 'EN' : 'HI'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchArticles(true)} disabled={refreshing}
                        className="p-2 rounded-lg transition-all disabled:opacity-50"
                        style={{ color: '#9B7B5A' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#EA580C'; e.currentTarget.style.background = '#FFF7ED'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9B7B5A'; e.currentTarget.style.background = 'transparent'; }}>
                        <IoRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setTab(tab.id)}
                            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === tab.id ? '#FFFFFF' : '#F5F0EA',
                                color: activeTab === tab.id ? '#EA580C' : '#9B7B5A',
                                border: activeTab === tab.id ? '1.5px solid #FDDCAE' : '1px solid transparent',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#F97316' }} />
                    <p className="text-xs font-medium" style={{ color: '#9B7B5A' }}>{today}</p>
                    {!loading && <span className="ml-auto text-xs" style={{ color: '#9B7B5A' }}>{filtered.length} articles</span>}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FDDCAE', borderTopColor: '#F97316' }} />
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl p-4 text-red-600 text-sm border border-red-200 bg-red-50 text-center">
                        {error}
                        <button onClick={() => fetchArticles()} className="block mx-auto mt-2 text-xs text-red-500 underline">Try again</button>
                    </div>
                )}

                {!loading && !error && (
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3">
                            {filtered.length === 0 ? (
                                <div className="py-16 text-center text-sm" style={{ color: '#9B7B5A' }}>No articles in this category</div>
                            ) : filtered.map((article, i) => {
                                const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.india;
                                return (
                                    <motion.a key={article.id || i} href={article.link} target="_blank" rel="noopener noreferrer"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        className="block group rounded-xl p-4 transition-all cursor-pointer"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDDCAE'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.11)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDE8E0'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,120,60,0.07)'; }}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0 mt-0.5" style={{ background: '#F97316', opacity: 0.85 }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                        style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                                                        {article.categoryName}
                                                    </span>
                                                    <span className="text-[10px] flex items-center gap-1" style={{ color: '#9B7B5A' }}>
                                                        <IoTimeOutline size={10} />{timeAgo(article.pubDate)}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-orange-600" style={{ color: '#1A1A1A' }}>
                                                    {article.title}
                                                </h3>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-[11px] truncate" style={{ color: '#9B7B5A' }}>{article.source}</p>
                                                    <IoOpenOutline size={12} className="transition-colors flex-shrink-0 ml-2 group-hover:text-orange-500" style={{ color: '#FDDCAE' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.a>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
};

export default CurrentAffairs;
