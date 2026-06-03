import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparklesOutline, IoAlertCircleOutline,
    IoCheckmarkCircleOutline, IoCloseCircleOutline, IoBulbOutline,
    IoTrendingUpOutline, IoTrendingDownOutline, IoBookOutline, IoTimeOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const EXAM_GROUPS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'SSC CGL', 'SSC CHSL', 'SSC GD', 'UPSC CSE',
    'IBPS PO', 'SBI PO', 'RRB NTPC', 'JEE Main', 'NEET UG'
];

const RATING_STYLE = {
    Excellent: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#059669', bar: '#10b981' },
    Good: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)', text: '#1d4ed8', bar: '#2563eb' },
    Average: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#b45309', bar: '#f59e0b' },
    'Needs Improvement': { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#dc2626', bar: '#ef4444' },
};

const AITestAnalyzer = () => {
    const [step, setStep] = useState('form');
    const [form, setForm] = useState({
        examType: '',
        totalScore: '',
        maxScore: '',
        percentage: '',
    });
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');
    const [customExam, setCustomExam] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await api.get('/student/ai/history?toolName=Test Analyzer');
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

    const handleAnalyze = async () => {
        const finalExam = form.examType === 'Other' ? customExam.trim() : form.examType;
        if (!finalExam || !form.totalScore || !form.maxScore) {
            setError('Please fill all required fields.');
            return;
        }
        const pct = form.percentage || Math.round((parseFloat(form.totalScore) / parseFloat(form.maxScore)) * 100);
        setError('');
        setStep('loading');
        try {
            const res = await api.post('/student/ai/analyze-test', {
                examType: finalExam,
                totalScore: parseFloat(form.totalScore),
                maxScore: parseFloat(form.maxScore),
                percentage: pct,
            });
            setAnalysis(res.data.analysis);
            setStep('result');
            fetchHistory();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to analyze. Try again.');
            setStep('form');
        }
    };

    const rating = analysis?.overallRating;
    const rs = RATING_STYLE[rating] || RATING_STYLE['Average'];

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.1)' }}>
                            <IoTrendingUpOutline size={14} className="text-orange-600" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">AI Test Performance Analyzer</h1>
                    </div>
                    {step === 'result' && (
                        <button onClick={() => { setStep('form'); setAnalysis(null); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                            Analyze Again
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">

                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-5">
                            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-800">Enter Your Test Results</p>
                                    <p className="text-xs text-gray-400 mt-0.5">AI will identify weak areas and give you a revision strategy</p>
                                </div>
                                <div className="p-5 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam Type</label>
                                        <div className="relative">
                                            <select value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value }))}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-400 transition-all">
                                                <option value="">Select exam...</option>
                                                {EXAM_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                                                <option value="Other">Other (Type custom exam...)</option>
                                            </select>
                                        </div>
                                        {form.examType === 'Other' && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Exam Name</label>
                                                <input type="text" value={customExam}
                                                    onChange={e => setCustomExam(e.target.value)}
                                                    placeholder="e.g. UPSC NDA, GATE, CAT..."
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-400 transition-all" />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Score Obtained</label>
                                            <input type="number" value={form.totalScore}
                                                onChange={e => setForm(f => ({ ...f, totalScore: e.target.value }))}
                                                placeholder="e.g. 145"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-400 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Score</label>
                                            <input type="number" value={form.maxScore}
                                                onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}
                                                placeholder="e.g. 200"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-orange-400 transition-all" />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <IoAlertCircleOutline size={16} />{error}
                                        </div>
                                    )}

                                    <button onClick={handleAnalyze}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
                                        Analyze My Performance
                                    </button>
                                </div>
                            </div>

                            {/* Recent History Card */}
                            {history.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden mt-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <IoTimeOutline className="text-orange-600" />
                                                Recent Analyses
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Click any past analysis to restore and view it instantly</p>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                        {history.map((item, idx) => (
                                            <button
                                                key={item._id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setAnalysis(item.payload);
                                                    setStep('result');
                                                }}
                                                className="w-full text-left px-5 py-3.5 hover:bg-orange-50/10 active:bg-orange-50/20 transition-colors flex justify-between items-center group"
                                            >
                                                <div className="pr-4 min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 group-hover:text-orange-600 transition-colors truncate">
                                                        {item.payload?.summary || item.details || 'Test Analysis'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 truncate">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg shrink-0">
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
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)' }}>
                                <IoSparklesOutline size={28} className="text-orange-500 animate-pulse" />
                            </div>
                            <p className="text-gray-900 font-bold text-base">Analyzing your performance...</p>
                            <p className="text-gray-400 text-sm">Identifying weak areas and building your strategy</p>
                        </motion.div>
                    )}

                    {step === 'result' && analysis && (
                        <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4">

                            {/* Rating Banner */}
                            <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'white', border: `1px solid ${rs.border}` }}>
                                    <span className="text-xl font-black" style={{ color: rs.text }}>
                                        {rating === 'Excellent' ? 'A' : rating === 'Good' ? 'B' : rating === 'Average' ? 'C' : 'D'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black" style={{ color: rs.text }}>{rating}</p>
                                    <p className="text-xs text-gray-600 mt-0.5">{analysis.summary}</p>
                                </div>
                            </div>

                            {/* Weak Areas */}
                            {analysis.weakAreas?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoTrendingDownOutline size={14} className="text-red-500" />
                                        <p className="text-sm font-bold text-gray-800">Weak Areas</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {analysis.weakAreas.map((w, i) => (
                                            <div key={i} className="px-5 py-3.5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IoCloseCircleOutline size={14} className="text-red-500 flex-shrink-0" />
                                                    <p className="text-sm font-bold text-gray-800">{w.topic}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-1 pl-5">{w.reason}</p>
                                                <p className="text-xs font-semibold text-indigo-600 pl-5">{w.action}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strong Areas */}
                            {analysis.strongAreas?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoTrendingUpOutline size={14} className="text-green-500" />
                                        <p className="text-sm font-bold text-gray-800">Strong Areas</p>
                                    </div>
                                    <div className="p-5 flex flex-wrap gap-2">
                                        {analysis.strongAreas.map((s, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                                                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}>
                                                <IoCheckmarkCircleOutline size={12} />{s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Next Steps */}
                            {analysis.nextSteps && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoBulbOutline size={14} className="text-amber-500" />
                                        <p className="text-sm font-bold text-gray-800">Next 3 Days Action Plan</p>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-gray-700 leading-relaxed">{analysis.nextSteps}</p>
                                    </div>
                                </div>
                            )}

                            {/* Exam Tips */}
                            {analysis.examTips?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-800">Exam Tips</p>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        {analysis.examTips.map((t, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <IoCheckmarkCircleOutline size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                                <span>{t}</span>
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

export default AITestAnalyzer;
