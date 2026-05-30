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
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.1)' }}>
                            <IoNewspaper size={14} className="text-sky-500" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">Current Affairs + AI Quiz</h1>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => { setLang(l); setArticles([]); setLoading(true); api.get(`/student/current-affairs?lang=${l}`).then(r => setArticles(r.data.data || [])).finally(() => setLoading(false)); }}
                                className="px-3 py-1.5 text-xs font-bold transition-all"
                                style={{ background: lang === l ? '#FACC15' : 'transparent', color: lang === l ? '#000' : '#6b7280' }}>
                                {l === 'en' ? 'EN' : 'HI'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchArticles(true)} disabled={refreshing}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                        <IoRefresh size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setTab(tab.id)}
                            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === tab.id ? '#FACC15' : '#f1f5f9',
                                color: activeTab === tab.id ? '#000' : '#64748b',
                                border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-5">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-sky-300 border-t-sky-500 animate-spin" />
                    </div>
                )}
                {error && !loading && (
                    <div className="rounded-xl p-4 text-red-600 text-sm border border-red-200 bg-red-50 text-center">{error}</div>
                )}
                {!loading && !error && (
                    <div className="grid gap-3">
                        {filtered.map((article, i) => {
                            const c = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.india;
                            const id = article.id || article.link;
                            const quiz = quizzes[id];
                            return (
                                <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className="rounded-xl border border-gray-200 bg-white transition-all overflow-hidden"
                                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    {/* Article Row */}
                                    <div className="p-4 flex items-start gap-3">
                                        <div className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0 bg-yellow-400 opacity-70" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                                                    {article.categoryName}
                                                </span>
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <IoTimeOutline size={10} />{timeAgo(article.pubDate)}
                                                </span>
                                            </div>
                                            <h3 className="text-gray-800 text-sm font-semibold leading-snug mb-2">{article.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <a href={article.link} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                                                    <IoOpenOutline size={11} /> Read
                                                </a>
                                                <span className="text-gray-200">|</span>
                                                <button onClick={() => handleQuiz(article)}
                                                    className="relative flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all"
                                                    style={{
                                                        background: openQuiz === id ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.06)',
                                                        borderColor: openQuiz === id ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.15)',
                                                        color: '#0284c7'
                                                    }}>
                                                    {/* Ping animation dot */}
                                                    {openQuiz !== id && (
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                                        </span>
                                                    )}
                                                    <IoHelpCircleOutline size={13} className={openQuiz === id ? 'text-sky-600' : 'text-sky-500'} />
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
                                                className="overflow-hidden border-t border-gray-100">
                                                <div className="px-4 py-4 bg-sky-50/50">
                                                    {quiz?.loading && (
                                                        <div className="flex items-center gap-2 text-xs text-sky-600 font-semibold">
                                                            <IoSparklesOutline size={13} className="animate-pulse" />
                                                            Generating questions...
                                                        </div>
                                                    )}
                                                    {quiz?.error && (
                                                        <div className="flex items-center gap-2 text-xs text-red-600">
                                                            <IoAlertCircleOutline size={13} />{quiz.error}
                                                        </div>
                                                    )}
                                                    {quiz?.questions?.map((q, qi) => (
                                                        <div key={qi} className="mb-4 last:mb-0">
                                                            <p className="text-xs font-bold text-gray-800 mb-2">Q{qi + 1}. {q.question}</p>
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
                                                                                background: !revealed ? (isSelected ? 'rgba(14,165,233,0.08)' : 'white')
                                                                                    : isCorrect ? 'rgba(16,185,129,0.08)' : (isSelected ? 'rgba(239,68,68,0.08)' : 'white'),
                                                                                borderColor: !revealed ? (isSelected ? 'rgba(14,165,233,0.4)' : '#e2e8f0')
                                                                                    : isCorrect ? 'rgba(16,185,129,0.4)' : (isSelected ? 'rgba(239,68,68,0.4)' : '#e2e8f0'),
                                                                                color: !revealed ? (isSelected ? '#0369a1' : '#374151')
                                                                                    : isCorrect ? '#059669' : (isSelected ? '#dc2626' : '#374151'),
                                                                            }}>
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {quiz.revealed[qi] && q.explanation && (
                                                                <div className="mt-2 text-[11px] text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-200 flex items-start gap-1.5">
                                                                    <IoCheckmarkCircleOutline size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
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
                            <div className="py-16 text-center text-gray-400 text-sm">No articles in this category</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICurrentAffairsQuiz;
