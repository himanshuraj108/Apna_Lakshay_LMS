import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparklesOutline, IoAlertCircleOutline,
    IoCheckmarkCircleOutline, IoCopyOutline, IoDocumentTextOutline,
    IoChevronDownOutline, IoBulbOutline, IoHelpCircleOutline, IoTimeOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const SUBJECTS = [
    'general', 'history', 'polity', 'economy', 'geography',
    'science', 'maths', 'english', 'current affairs', 'other'
];

const AINoteSummarizer = () => {
    const [text, setText] = useState('');
    const [subject, setSubject] = useState('general');
    const [customSubject, setCustomSubject] = useState('');
    const [step, setStep] = useState('form');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizRevealed, setQuizRevealed] = useState({});
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const textareaRef = useRef(null);

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await api.get('/student/ai/history?toolName=Notes Summarizer');
            setHistory(res.data.history || []);
        } catch (e) {
            console.error('Failed to fetch history:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleSummarize = async () => {
        const finalSubject = subject === 'other' ? customSubject.trim() : subject;
        if (subject === 'other' && !finalSubject) {
            setError('Please enter a custom subject name.');
            return;
        }
        if (!text.trim() || text.trim().length < 30) {
            setError('Please enter at least 30 characters of study material.');
            return;
        }
        setError('');
        setStep('loading');
        try {
            const res = await api.post('/student/ai/summarize-notes', { text: text.trim(), subject: finalSubject });
            setResult(res.data.result);
            setStep('result');
            fetchHistory();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to summarize. Try again.');
            setStep('form');
        }
    };

    const copyToClipboard = (txt, idx) => {
        navigator.clipboard.writeText(txt).then(() => {
            setCopiedIndex(idx);
            setTimeout(() => setCopiedIndex(null), 1500);
        });
    };

    return (
        <div className="min-h-screen" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            {/* Warm dot grid overlay */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                backgroundSize: '28px 28px'
            }} />

            {/* Sticky Header */}
            <div className="sticky top-0 z-30" style={{ borderBottom: '1.5px solid #EDE8E0', background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student"
                        className="p-2 rounded-lg transition-all"
                        style={{ background: '#FFFFFF', border: '1px solid #EDE8E0', color: '#78350F' }}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <IoDocumentTextOutline size={14} style={{ color: '#F97316' }} />
                        </div>
                        <h1 className="font-bold text-base" style={{ color: '#1A1A1A' }}>AI Notes Summarizer</h1>
                    </div>
                    {step === 'result' && (
                        <button onClick={() => { setStep('form'); setResult(null); setQuizAnswers({}); setQuizRevealed({}); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F' }}>
                            Summarize More
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6" style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">

                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-4">
                            <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                {/* Card accent bar */}
                                <div style={{ height: 3, background: 'linear-gradient(135deg,#F97316,#EA580C)', borderRadius: '12px 12px 0 0' }} />
                                <div className="px-5 py-4 border-b" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Paste Your Study Material</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#9B7B5A' }}>AI will summarize, extract key facts, and generate practice questions</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B7B5A' }}>Subject</label>
                                        <div className="relative">
                                            <select value={subject} onChange={e => setSubject(e.target.value)}
                                                className="w-full appearance-none rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-all capitalize"
                                                style={{ background: '#FAFAF8', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                                                onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }}>
                                                {SUBJECTS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                            </select>
                                            <IoChevronDownOutline size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9B7B5A' }} />
                                        </div>
                                        {subject === 'other' && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B7B5A' }}>Custom Subject Name</label>
                                                <input type="text" value={customSubject}
                                                    onChange={e => setCustomSubject(e.target.value)}
                                                    placeholder="e.g. Physics, Chemistry, Biology..."
                                                    className="w-full rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-all"
                                                    style={{ background: '#FAFAF8', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                                                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                                                    onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }} />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Textarea */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9B7B5A' }}>
                                            Study Material — <span className="normal-case font-semibold" style={{ color: '#F97316' }}>{text.length}/4000 chars</span>
                                        </label>
                                        <textarea ref={textareaRef} value={text}
                                            onChange={e => setText(e.target.value)}
                                            rows={8}
                                            maxLength={4000}
                                            placeholder="Paste chapter notes, textbook paragraphs, articles, or any study content here..."
                                            className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all leading-relaxed"
                                            style={{ background: '#FAFAF8', border: '1.5px solid #EDE8E0', color: '#1A1A1A' }}
                                            onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                                            onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }} />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                                            <IoAlertCircleOutline size={16} />{error}
                                        </div>
                                    )}

                                    <button onClick={handleSummarize} disabled={text.length < 30}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                                        style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                        Summarize with AI
                                    </button>
                                </div>
                            </div>

                            {/* Recent History Card */}
                            {history.length > 0 && (
                                <div className="rounded-2xl overflow-hidden mt-6" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                    <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                        <div>
                                            <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                                                <IoTimeOutline style={{ color: '#F97316' }} />
                                                Recent Summaries
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: '#9B7B5A' }}>Click any past summary to restore and view it instantly</p>
                                        </div>
                                    </div>
                                    <div className="divide-y max-h-60 overflow-y-auto" style={{ borderColor: '#EDE8E0' }}>
                                        {history.map((item, idx) => (
                                            <button
                                                key={item._id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setResult(item.payload);
                                                    setStep('result');
                                                }}
                                                className="w-full text-left px-5 py-3.5 transition-colors flex justify-between items-center group"
                                                style={{ borderColor: '#EDE8E0' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div className="pr-4 min-w-0 flex-1">
                                                    <p className="text-xs font-bold truncate transition-colors" style={{ color: '#1A1A1A' }}>
                                                        {item.payload?.title || item.details || 'Note Summary'}
                                                    </p>
                                                    <p className="text-[10px] font-medium mt-1 truncate" style={{ color: '#9B7B5A' }}>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                                                    style={{ color: '#EA580C', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                                    Restore
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                <IoSparklesOutline size={28} className="animate-pulse" style={{ color: '#F97316' }} />
                            </div>
                            {/* Warm spinner */}
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                border: '3px solid #FDDCAE', borderTopColor: '#F97316',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <p className="font-bold text-base" style={{ color: '#1A1A1A' }}>Summarizing your notes...</p>
                            <p className="text-sm" style={{ color: '#9B7B5A' }}>Extracting key points and generating questions</p>
                        </motion.div>
                    )}

                    {step === 'result' && result && (
                        <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4">

                            {/* Title + Summary */}
                            <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                <div style={{ height: 3, background: 'linear-gradient(135deg,#F97316,#EA580C)', borderRadius: '12px 12px 0 0' }} />
                                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{result.title}</p>
                                    <button onClick={() => copyToClipboard(result.summary, 'summary')}
                                        className="p-1.5 rounded-lg transition-all"
                                        style={{ color: '#9B7B5A' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#F5F0EA'; e.currentTarget.style.color = '#1A1A1A'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9B7B5A'; }}>
                                        {copiedIndex === 'summary' ? <IoCheckmarkCircleOutline size={14} style={{ color: '#22c55e' }} /> : <IoCopyOutline size={14} />}
                                    </button>
                                </div>
                                <div className="p-5">
                                    <p className="text-sm leading-relaxed" style={{ color: '#6B6560' }}>{result.summary}</p>
                                    {result.examRelevance && (
                                        <p className="text-xs font-semibold mt-3 pt-3" style={{ color: '#EA580C', borderTop: '1px solid #EDE8E0' }}>{result.examRelevance}</p>
                                    )}
                                </div>
                            </div>

                            {/* Key Points */}
                            {result.keyPoints?.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                    <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                                            <IoBulbOutline size={13} style={{ color: '#F97316' }} />
                                        </div>
                                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Key Points</p>
                                    </div>
                                    <div className="p-5 space-y-2.5">
                                        {result.keyPoints.map((point, i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                                                    style={{ background: 'rgba(249,115,22,0.1)', color: '#EA580C' }}>{i + 1}</span>
                                                <p className="text-sm" style={{ color: '#6B6560' }}>{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Important Facts */}
                            {result.importantFacts?.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                    <div className="px-5 py-3 border-b" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Important Facts for Exam</p>
                                    </div>
                                    <div className="divide-y" style={{ borderColor: '#EDE8E0' }}>
                                        {result.importantFacts.map((f, i) => (
                                            <div key={i} className="px-5 py-3.5">
                                                <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{f.fact}</p>
                                                <p className="text-xs mt-0.5" style={{ color: '#EA580C' }}>{f.importance}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Practice Questions */}
                            {result.practiceQuestions?.length > 0 && (
                                <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                                    <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: '#EDE8E0', background: '#FAFAF8' }}>
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                                            <IoHelpCircleOutline size={13} style={{ color: '#F97316' }} />
                                        </div>
                                        <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Practice Questions</p>
                                    </div>
                                    <div className="divide-y" style={{ borderColor: '#EDE8E0' }}>
                                        {result.practiceQuestions.map((q, qi) => (
                                            <div key={qi} className="p-5 space-y-3">
                                                <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Q{qi + 1}. {q.question}</p>
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    {q.options.map((opt, oi) => {
                                                        const letter = opt.charAt(0);
                                                        const isCorrect = letter === q.answer;
                                                        const isSelected = quizAnswers[qi] === letter;
                                                        const revealed = quizRevealed[qi];
                                                        return (
                                                            <button key={oi}
                                                                onClick={() => { setQuizAnswers(a => ({ ...a, [qi]: letter })); setQuizRevealed(r => ({ ...r, [qi]: true })); }}
                                                                className="text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                                                                style={{
                                                                    background: !revealed ? (isSelected ? 'rgba(249,115,22,0.08)' : 'transparent')
                                                                        : isCorrect ? 'rgba(16,185,129,0.08)' : (isSelected ? 'rgba(239,68,68,0.08)' : 'transparent'),
                                                                    borderColor: !revealed ? (isSelected ? 'rgba(249,115,22,0.3)' : '#EDE8E0')
                                                                        : isCorrect ? 'rgba(16,185,129,0.3)' : (isSelected ? 'rgba(239,68,68,0.3)' : '#EDE8E0'),
                                                                    color: !revealed ? (isSelected ? '#EA580C' : '#6B6560')
                                                                        : isCorrect ? '#059669' : (isSelected ? '#dc2626' : '#6B6560'),
                                                                }}>
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {quizRevealed[qi] && q.explanation && (
                                                    <div className="text-xs rounded-xl px-3 py-2.5" style={{ color: '#6B6560', background: '#F5F0EA', border: '1px solid #EDE8E0' }}>
                                                        {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AINoteSummarizer;
