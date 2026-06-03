import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoCalendarOutline, IoSparklesOutline,
    IoChevronDownOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline,
    IoTimeOutline, IoBookOutline, IoBulbOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const EXAM_OPTIONS = [
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
    'SSC CGL', 'SSC CHSL', 'SSC GD', 'SSC MTS', 'SSC CPO',
    'UPSC CSE', 'UPSC CDS', 'IBPS PO', 'IBPS Clerk',
    'SBI PO', 'SBI Clerk', 'RRB NTPC', 'RRB Group D',
    'JEE Main', 'NEET UG'
];

const SUBJECTS = [
    'Maths', 'Reasoning', 'English', 'GK / Current Affairs',
    'Science', 'History', 'Polity', 'Geography', 'Economy'
];

const PRIORITY_COLORS = {
    high: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#dc2626' },
    medium: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#b45309' },
    low: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#059669' },
};

const formatDaysLeft = (days) => {
    if (!days || days <= 0) return '0 days';
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = (days % 365) % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 && years === 0) parts.push(`${remainingDays} day${remainingDays > 1 ? 's' : ''}`);

    return parts.length > 0 ? `${parts.join(', ')} remaining` : `${days} days remaining`;
};

const AIStudyPlanner = () => {
    const { user } = useAuth();
    const [step, setStep] = useState('form'); // form | loading | result
    const [form, setForm] = useState({
        examTarget: user?.examTarget?.replace(/_/g, ' ').toUpperCase() || '',
        examDate: '',
        studyHoursPerDay: 6,
        weakSubjects: [],
    });
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');
    const [activeWeek, setActiveWeek] = useState(0);
    const [customExam, setCustomExam] = useState('');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async () => {
        try {
            setHistoryLoading(true);
            const res = await api.get('/student/ai/history?toolName=Study Planner');
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

    const toggleSubject = (sub) => {
        setForm(f => ({
            ...f,
            weakSubjects: f.weakSubjects.includes(sub)
                ? f.weakSubjects.filter(s => s !== sub)
                : [...f.weakSubjects, sub]
        }));
    };

    const handleGenerate = async () => {
        const finalExam = form.examTarget === 'Other' ? customExam.trim() : form.examTarget;
        if (!finalExam || !form.examDate) {
            setError('Please select an exam and exam date.');
            return;
        }
        setError('');
        setStep('loading');
        try {
            const res = await api.post('/student/ai/generate-study-plan', {
                examTarget: finalExam,
                examDate: form.examDate,
                studyHoursPerDay: form.studyHoursPerDay,
                weakSubjects: form.weakSubjects,
            });
            setPlan(res.data.plan);
            setStep('result');
            fetchHistory();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate plan. Please try again.');
            setStep('form');
        }
    };

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                            <IoSparklesOutline size={14} className="text-indigo-500" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">AI Study Plan Generator</h1>
                    </div>
                    {step === 'result' && (
                        <button onClick={() => { setStep('form'); setPlan(null); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                            New Plan
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">

                    {/* FORM */}
                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                            className="space-y-5">
                            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-800">Configure Your Plan</p>
                                    <p className="text-xs text-gray-400 mt-0.5">AI will create a personalized week-wise study schedule</p>
                                </div>
                                <div className="p-5 space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Exam</label>
                                        <div className="relative">
                                            <select value={form.examTarget} onChange={e => setForm(f => ({ ...f, examTarget: e.target.value }))}
                                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-indigo-400 transition-all">
                                                <option value="">Select exam...</option>
                                                {EXAM_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                                                <option value="Other">Other (Type custom exam...)</option>
                                            </select>
                                            <IoChevronDownOutline size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                        {form.examTarget === 'Other' && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Target Exam</label>
                                                <input type="text" value={customExam}
                                                    onChange={e => setCustomExam(e.target.value)}
                                                    placeholder="e.g. UPSC NDA, GATE, CAT..."
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-indigo-400 transition-all" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Exam Date */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam Date</label>
                                        <div className="relative">
                                            <input type="date" value={form.examDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:border-indigo-400 transition-all" />
                                            <IoCalendarOutline size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Study Hours */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Study Hours Per Day — <span className="text-indigo-600">{form.studyHoursPerDay} hrs</span>
                                        </label>
                                        <input type="range" min={2} max={12} step={1}
                                            value={form.studyHoursPerDay}
                                            onChange={e => setForm(f => ({ ...f, studyHoursPerDay: parseInt(e.target.value) }))}
                                            className="w-full accent-indigo-500" />
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                            <span>2 hrs</span><span>12 hrs</span>
                                        </div>
                                    </div>

                                    {/* Weak Subjects */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Weak Subjects (optional)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SUBJECTS.map(sub => (
                                                <button key={sub} onClick={() => toggleSubject(sub)}
                                                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                                                    style={{
                                                        background: form.weakSubjects.includes(sub) ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                        borderColor: form.weakSubjects.includes(sub) ? 'rgba(99,102,241,0.4)' : '#e2e8f0',
                                                        color: form.weakSubjects.includes(sub) ? '#6366f1' : '#6b7280',
                                                    }}>
                                                    {sub}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <IoAlertCircleOutline size={16} className="flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button onClick={handleGenerate}
                                        className="w-full py-3.5 rounded-xl font-extrabold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                        Generate Study Plan with AI
                                    </button>
                                </div>
                            </div>

                            {/* Recent History Card */}
                            {history.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden mt-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                <IoTimeOutline className="text-indigo-500" />
                                                Recent Study Plans
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">Click any past plan to restore and view it instantly</p>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                        {history.map((item, idx) => (
                                            <button
                                                key={item._id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setPlan(item.payload);
                                                    setStep('result');
                                                }}
                                                className="w-full text-left px-5 py-3.5 hover:bg-indigo-55/10 active:bg-indigo-55/20 transition-colors flex justify-between items-center group"
                                            >
                                                <div className="pr-4 min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-650 transition-colors truncate">
                                                        {item.payload?.summary || item.details || 'Study Plan'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 truncate">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg shrink-0">
                                                    Restore
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* LOADING */}
                    {step === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                <IoSparklesOutline size={28} className="text-indigo-500 animate-pulse" />
                            </div>
                            <p className="text-gray-900 font-bold text-base">AI is building your plan...</p>
                            <p className="text-gray-400 text-sm">This takes a few seconds</p>
                            <div className="flex gap-1.5 mt-2">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                                        style={{ animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULT */}
                    {step === 'result' && plan && (
                        <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4">
                            {/* Summary Card */}
                            <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <div className="px-5 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        <IoSparklesOutline size={18} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{plan.summary}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDaysLeft(plan.daysLeft)} ({plan.daysLeft} days)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Long-Term Roadmap */}
                            {plan.roadmap && plan.roadmap.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                            <IoCalendarOutline className="text-indigo-500" />
                                            Long-Term Preparation Roadmap
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Your study timeline divided into targeted phases</p>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {plan.roadmap.map((phase, idx) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                {idx < plan.roadmap.length - 1 && (
                                                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px]" style={{ backgroundColor: '#e2e8f0' }}></div>
                                                )}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all ${phase.status === 'active' ? 'bg-indigo-500 text-white shadow-[0_4px_10px_rgba(99,102,241,0.4)]' : 'bg-gray-100 text-gray-500'}`}>
                                                    {phase.phase || (idx + 1)}
                                                </div>
                                                <div className="flex-1 min-w-0 pb-2">
                                                    <div className="flex justify-between items-start flex-wrap gap-1">
                                                        <p className={`text-sm font-bold ${phase.status === 'active' ? 'text-indigo-600' : 'text-gray-800'}`}>{phase.title}</p>
                                                        <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-150 shrink-0">{phase.duration}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{phase.focus}</p>
                                                    {phase.status === 'active' && (
                                                        <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 mt-2">Active Phase (Detailed Daily Schedule below)</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Week Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {plan.weeklyPlans?.map((w, i) => (
                                    <button key={i} onClick={() => setActiveWeek(i)}
                                        className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
                                        style={{
                                            background: activeWeek === i ? 'rgba(99,102,241,0.1)' : 'white',
                                            borderColor: activeWeek === i ? 'rgba(99,102,241,0.3)' : '#e2e8f0',
                                            color: activeWeek === i ? '#6366f1' : '#6b7280',
                                        }}>
                                        Week {w.week}
                                    </button>
                                ))}
                            </div>

                            {/* Week Plan */}
                            {plan.weeklyPlans?.[activeWeek] && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-bold text-gray-800">Week {plan.weeklyPlans[activeWeek].week}: {plan.weeklyPlans[activeWeek].focus}</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {plan.weeklyPlans[activeWeek].days?.map((day, i) => {
                                            const pc = PRIORITY_COLORS[day.priority] || PRIORITY_COLORS.medium;
                                            return (
                                                <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                                                    <div className="w-20 flex-shrink-0">
                                                        <p className="text-xs font-black text-gray-800">{day.day}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{day.subject}</p>
                                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{day.topics}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                            <IoTimeOutline size={11} />{day.hours}h
                                                        </span>
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase"
                                                            style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text }}>
                                                            {day.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            {plan.tips?.length > 0 && (
                                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                        <IoBulbOutline size={14} className="text-amber-500" />
                                        <p className="text-sm font-bold text-gray-800">AI Tips</p>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        {plan.tips.map((tip, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                <IoCheckmarkCircleOutline size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                                <span>{tip}</span>
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

export default AIStudyPlanner;
