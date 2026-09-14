import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparklesOutline, IoNewspaper, IoRefresh,
    IoOpenOutline, IoTimeOutline, IoCheckmarkCircleOutline,
    IoAlertCircleOutline, IoHelpCircleOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const CATEGORY_COLORS = {
    india:   { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#ea580c' },
    world:   { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#2563eb' },
    economy: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  text: '#16a34a' },
    science: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#7c3aed' },
    sports:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  text: '#dc2626' },
    govt:    { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.2)',  text: '#b45309' },
};

const TABS = [
    { id: 'all', label: 'All' }, { id: 'india', label: 'India' },
    { id: 'world', label: 'World' }, { id: 'economy', label: 'Economy' },
    { id: 'science', label: 'Science' }, { id: 'sports', label: 'Sports' },
    { id: 'govt', label: 'Govt' },
];

const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const AICurrentAffairsQuiz = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setTab] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [lang, setLang] = useState('en');
    const [quizzes, setQuizzes] = useState({});         // articleId -> { loading, questions, answers, revealed }
    const [openQuiz, setOpenQuiz] = useState(null);

    const fetchArticles = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/student/current-affairs?lang=${lang}`);
            setArticles(res.data.data || []);
        } catch {
            setError('Failed to load news. Check your connection.');
        } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchArticles(); }, []);

    const handleQuiz = async (article) => {
        const id = article.id || article.link;
        if (quizzes[id]?.questions) {
            setOpenQuiz(openQuiz === id ? null : id);
            return;
        }
        setQuizzes(q => ({ ...q, [id]: { loading: true, questions: null, answers: {}, revealed: {} } }));
        setOpenQuiz(id);
        try {
            const res = await api.post('/student/ai/quiz-from-article', {
                title: article.title,
                source: article.source,
                category: article.categoryName,
            });
            setQuizzes(q => ({ ...q, [id]: { loading: false, questions: res.data.questions, answers: {}, revealed: {} } }));
        } catch {
            setQuizzes(q => ({ ...q, [id]: { loading: false, questions: [], error: 'Failed to generate quiz.' } }));
        }
    };

    const handleAnswer = (id, qi, letter) => {
        setQuizzes(q => ({
            ...q,
            [id]: { ...q[id], answers: { ...q[id].answers, [qi]: letter }, revealed: { ...q[id].revealed, [qi]: true } }
        }));
    };

    const filtered = activeTab === 'all' ? articles : articles.filter(a => a.category === activeTab);

    return (
        <div className="min-h-screen" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            {/* Dot grid overlay */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                backgroundSize: '28px 28px',
            }} />

            {/* Header */}
            <div className="sticky top-0 z-30" style={{
                background: 'rgba(247,243,236,0.92)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1.5px solid #EDE8E0',
            }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg transition-all" style={{
                        background: '#FFFFFF', border: '1px solid #EDE8E0', color: '#78350F',
                    }}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                            background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.15)',
                        }}>
                            <IoNewspaper size={14} style={{ color: '#EA580C' }} />
                        </div>
                        <h1 className="font-bold text-base" style={{ color: '#1A1A1A' }}>Current Affairs + AI Quiz</h1>
                    </div>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1.5px solid #EDE8E0' }}>
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => { setLang(l); setArticles([]); setLoading(true); api.get(`/student/current-affairs?lang=${l}`).then(r => setArticles(r.data.data || [])).finally(() => setLoading(false)); }}
                                className="px-3 py-1.5 text-xs font-bold transition-all"
                                style={{
                                    background: lang === l ? 'linear-gradient(135deg,#F97316,#EA580C)' : 'transparent',
                                    color: lang === l ? '#FFFFFF' : '#9B7B5A',
                                }}>
                                {l === 'en' ? 'EN' : 'HI'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchArticles(true)} disabled={refreshing}
                        className="p-2 rounded-lg transition-all disabled:opacity-50"
                        style={{ background: '#FFFFFF', border: '1px solid #EDE8E0', color: '#9B7B5A' }}>
                        <IoRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                {/* Tab pills */}
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setTab(tab.id)}
                            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
                                color: activeTab === tab.id ? '#EA580C' : '#9B7B5A',
                                border: activeTab === tab.id ? '1.5px solid #FDDCAE' : '1.5px solid transparent',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-5" style={{ position: 'relative', zIndex: 1 }}>
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{
                            borderColor: '#FDDCAE', borderTopColor: '#F97316',
                        }} />
                    </div>
                )}
                {error && !loading && (
                    <div className="rounded-xl p-4 text-sm text-center" style={{
                        color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)',
                    }}>{error}</div>
                )}
                {!loading && !error && (
                    <div className="grid gap-3">
                        {filtered.map((article, i) => {
                            const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.india;
                            const id = article.id || article.link;
                            const quiz = quizzes[id];
                            return (
                                <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className="rounded-xl overflow-hidden transition-all"
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1.5px solid #EDE8E0',
                                        boxShadow: '0 4px 20px rgba(180,120,60,0.07)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = '#FDDCAE';
                                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.11)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#EDE8E0';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,120,60,0.07)';
                                    }}>
                                    {/* Article Row */}
                                    <div className="p-4 flex items-start gap-3">
                                        <div className="w-1 min-h-[40px] rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg,#F97316,#EA580C)', opacity: 0.7 }} />
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
                                            <h3 className="text-sm font-semibold leading-snug mb-2" style={{ color: '#1A1A1A' }}>{article.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <a href={article.link} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[11px] transition-colors"
                                                    style={{ color: '#9B7B5A' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#78350F'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#9B7B5A'}>
                                                    <IoOpenOutline size={11} /> Read
                                                </a>
                                                <span style={{ color: '#EDE8E0' }}>|</span>
                                                <button onClick={() => handleQuiz(article)}
                                                    className="relative flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                                                    style={{
                                                        background: openQuiz === id ? 'rgba(249,115,22,0.10)' : 'rgba(249,115,22,0.06)',
                                                        borderColor: openQuiz === id ? 'rgba(249,115,22,0.30)' : 'rgba(249,115,22,0.15)',
                                                        color: '#EA580C',
                                                    }}>
                                                    {/* Ping animation dot */}
                                                    {openQuiz !== id && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#FDDCAE' }}></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#F97316' }}></span>
                                                        </span>
                                                    )}
                                                    <IoHelpCircleOutline size={13} style={{ color: openQuiz === id ? '#EA580C' : '#F97316' }} />
                                                    <span>{openQuiz === id ? 'Hide Quiz' : 'Quiz Me'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quiz Panel */}
                                    <AnimatePresence>
                                        {openQuiz === id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                                style={{ borderTop: '1.5px solid #EDE8E0' }}>
                                                <div className="px-4 py-4" style={{ background: 'rgba(249,115,22,0.03)' }}>
                                                    {quiz?.loading && (
                                                        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#EA580C' }}>
                                                            <IoSparklesOutline size={13} className="animate-pulse" />
                                                            Generating questions...
                                                        </div>
                                                    )}
                                                    {quiz?.error && (
                                                        <div className="flex items-center gap-2 text-xs" style={{ color: '#dc2626' }}>
                                                            <IoAlertCircleOutline size={13} />{quiz.error}
                                                        </div>
                                                    )}
                                                    {quiz?.questions?.map((q, qi) => (
                                                        <div key={qi} className="mb-4 last:mb-0">
                                                            <p className="text-xs font-bold mb-2" style={{ color: '#1A1A1A' }}>Q{qi + 1}. {q.question}</p>
                                                            <div className="grid grid-cols-1 gap-1">
                                                                {q.options.map((opt, oi) => {
                                                                    const letter = opt.charAt(0);
                                                                    const isCorrect = letter === q.answer;
                                                                    const isSelected = quiz.answers[qi] === letter;
                                                                    const revealed = quiz.revealed[qi];
                                                                    return (
                                                                        <button key={oi}
                                                                            onClick={() => handleAnswer(id, qi, letter)}
                                                                            className="text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
                                                                            style={{
                                                                                background: !revealed ? (isSelected ? 'rgba(249,115,22,0.08)' : 'white')
                                                                                    : isCorrect ? 'rgba(16,185,129,0.08)' : (isSelected ? 'rgba(239,68,68,0.08)' : 'white'),
                                                                                borderColor: !revealed ? (isSelected ? 'rgba(249,115,22,0.4)' : '#EDE8E0')
                                                                                    : isCorrect ? 'rgba(16,185,129,0.4)' : (isSelected ? 'rgba(239,68,68,0.4)' : '#EDE8E0'),
                                                                                color: !revealed ? (isSelected ? '#EA580C' : '#1A1A1A')
                                                                                    : isCorrect ? '#059669' : (isSelected ? '#dc2626' : '#1A1A1A'),
                                                                            }}>
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {quiz.revealed[qi] && q.explanation && (
                                                                <div className="mt-2 text-[11px] rounded-lg px-3 py-2 flex items-start gap-1.5"
                                                                    style={{ color: '#6B6560', background: '#FFFFFF', border: '1.5px solid #EDE8E0' }}>
                                                                    <IoCheckmarkCircleOutline size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#059669' }} />
                                                                    {q.explanation}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="py-16 text-center text-sm" style={{ color: '#9B7B5A' }}>No articles in this category</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICurrentAffairsQuiz;
