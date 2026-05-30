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
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                            <IoDocumentTextOutline size={14} className="text-violet-500" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">AI Notes Summarizer</h1>
                    </div>
                    {step === 'result' && (
                        <button onClick={() => { setStep('form'); setResult(null); setQuizAnswers({}); setQuizRevealed({}); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                            Summarize More
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">

                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-4">
                            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-800">Paste Your Study Material</p>
                                    <p className="text-xs text-gray-400 mt-0.5">AI will summarize, extract key facts, and generate practice questions</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    {/* Subject */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                                        <div className="relative">
                                            <select value={subject} onChange={e => setSubject(e.target.value)}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-violet-400 transition-all capitalize">
                                                {SUBJECTS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                            </select>
                                            <IoChevronDownOutline size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                        {subject === 'other' && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Subject Name</label>
                                                <input type="text" value={customSubject}
                                                    onChange={e => setCustomSubject(e.target.value)}
                                                    placeholder="e.g. Physics, Chemistry, Biology..."
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-violet-400 transition-all" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Textarea */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Study Material — <span className="text-violet-600 normal-case font-semibold">{text.length}/4000 chars</span>
                                        </label>
                                        <textarea ref={textareaRef} value={text}
                                            onChange={e => setText(e.target.value)}
                                            rows={8}
                                            maxLength={4000}
                                            placeholder="Paste chapter notes, textbook paragraphs, articles, or any study content here..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-violet-400 transition-all leading-relaxed" />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <IoAlertCircleOutline size={16} />{error}
                                        </div>
                                    )}

                                    <button onClick={handleSummarize} disabled={text.length < 30}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                                        style={{ background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' }}>
                                        Summarize with AI
                                    </button>
                                </div>
                            </div>

                            {/* Recent History Card */}
                            {history.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden mt-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <IoTimeOutline className="text-violet-500" />
                                                Recent Summaries
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Click any past summary to restore and view it instantly</p>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                        {history.map((item, idx) => (
                                            <button
                                                key={item._id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setResult(item.payload);
                                                    setStep('result');
                                                }}
                                                className="w-full text-left px-5 py-3.5 hover:bg-violet-55/10 active:bg-violet-55/20 transition-colors flex justify-between items-center group"
                                            >
                                                <div className="pr-4 min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 group-hover:text-violet-600 transition-colors truncate">
                                                        {item.payload?.title || item.details || 'Note Summary'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 truncate">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg shrink-0">
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
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                <IoSparklesOutline size={28} className="text-violet-500 animate-pulse" />
                            </div>
                            <p className="text-gray-900 font-bold text-base">Summarizing your notes...</p>
                            <p className="text-gray-400 text-sm">Extracting key points and generating questions</p>
                        </motion.div>
                    )}

                    {step === 'result' && result && (
                        <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4">

                            {/* Title + Summary */}
                            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-800">{result.title}</p>
                                    <button onClick={() => copyToClipboard(result.summary, 'summary')}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                                        {copiedIndex === 'summary' ? <IoCheckmarkCircleOutline size={14} className="text-green-500" /> : <IoCopyOutline size={14} />}
                                    </button>
                                </div>
                                <div className="p-5">
                                    <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
                                    {result.examRelevance && (
                                        <p className="text-xs text-violet-600 font-semibold mt-3 border-t border-gray-100 pt-3">{result.examRelevance}</p>
                                    )}
                                </div>
                            </div>

                            {/* Key Points */}
                            {result.keyPoints?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoBulbOutline size={14} className="text-violet-500" />
                                        <p className="text-sm font-bold text-gray-800">Key Points</p>
                                    </div>
                                    <div className="p-5 space-y-2.5">
                                        {result.keyPoints.map((point, i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                                                    style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed' }}>{i + 1}</span>
                                                <p className="text-sm text-gray-700">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Important Facts */}
                            {result.importantFacts?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-800">Important Facts for Exam</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {result.importantFacts.map((f, i) => (
                                            <div key={i} className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-gray-800">{f.fact}</p>
                                                <p className="text-xs text-violet-600 mt-0.5">{f.importance}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Practice Questions */}
                            {result.practiceQuestions?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoHelpCircleOutline size={14} className="text-violet-500" />
                                        <p className="text-sm font-bold text-gray-800">Practice Questions</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {result.practiceQuestions.map((q, qi) => (
                                            <div key={qi} className="p-5 space-y-3">
                                                <p className="text-sm font-bold text-gray-800">Q{qi + 1}. {q.question}</p>
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
                                                                    background: !revealed ? (isSelected ? 'rgba(139,92,246,0.08)' : 'transparent')
                                                                        : isCorrect ? 'rgba(16,185,129,0.08)' : (isSelected ? 'rgba(239,68,68,0.08)' : 'transparent'),
                                                                    borderColor: !revealed ? (isSelected ? 'rgba(139,92,246,0.3)' : '#e2e8f0')
                                                                        : isCorrect ? 'rgba(16,185,129,0.3)' : (isSelected ? 'rgba(239,68,68,0.3)' : '#e2e8f0'),
                                                                    color: !revealed ? (isSelected ? '#7c3aed' : '#374151')
                                                                        : isCorrect ? '#059669' : (isSelected ? '#dc2626' : '#374151'),
                                                                }}>
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {quizRevealed[qi] && q.explanation && (
                                                    <div className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200">
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
