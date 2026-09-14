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

    /* ── shared input style ── */
    const inputStyle = {
        width: '100%',
        background: '#FFFAF5',
        border: '1.5px solid #EDE8E0',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#1A1A1A',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: "'DM Sans','Inter',sans-serif",
    };

    /* ── shared card style ── */
    const cardStyle = {
        background: '#FFFFFF',
        border: '1.5px solid #EDE8E0',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(180,120,60,0.07)',
        overflow: 'hidden',
    };

    /* ── card section header ── */
    const cardHeaderStyle = {
        padding: '12px 20px',
        borderBottom: '1.5px solid #EDE8E0',
        background: '#FFFAF5',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background: '#F7F3EC',
                fontFamily: "'DM Sans','Inter',sans-serif",
                position: 'relative',
            }}
        >
            {/* Warm dot grid overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            {/* Sticky header */}
            <div
                className="sticky top-0 z-30"
                style={{
                    background: 'rgba(247,243,236,0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1.5px solid #EDE8E0',
                }}
            >
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link
                        to="/student"
                        style={{
                            padding: '7px',
                            borderRadius: '10px',
                            background: '#FFFFFF',
                            border: '1.5px solid #EDE8E0',
                            color: '#78350F',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'box-shadow 0.2s',
                        }}
                    >
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(249,115,22,0.12)',
                            }}
                        >
                            <IoTrendingUpOutline size={14} style={{ color: '#EA580C' }} />
                        </div>
                        <h1 style={{ color: '#1A1A1A', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                            AI Test Performance Analyzer
                        </h1>
                    </div>
                    {step === 'result' && (
                        <button
                            onClick={() => { setStep('form'); setAnalysis(null); }}
                            style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '6px 14px',
                                borderRadius: '12px',
                                border: '1.5px solid #EDE8E0',
                                background: '#FFFFFF',
                                color: '#78350F',
                                cursor: 'pointer',
                                transition: 'box-shadow 0.2s, border-color 0.2s',
                            }}
                        >
                            Analyze Again
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6" style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">

                    {step === 'form' && (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="space-y-5">
                            <div style={cardStyle}>
                                {/* Card top accent bar */}
                                <div style={{ height: '3px', background: 'linear-gradient(135deg,#F97316,#EA580C)', borderRadius: '16px 16px 0 0' }} />
                                <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #EDE8E0', background: '#FFFAF5' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Enter Your Test Results</p>
                                    <p style={{ fontSize: '12px', color: '#9B7B5A', marginTop: '2px', marginBottom: 0 }}>
                                        AI will identify weak areas and give you a revision strategy
                                    </p>
                                </div>
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9B7B5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                            Exam Type
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={form.examType}
                                                onChange={e => setForm(f => ({ ...f, examType: e.target.value }))}
                                                style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
                                                onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }}
                                            >
                                                <option value="">Select exam...</option>
                                                {EXAM_GROUPS.map(e => <option key={e} value={e}>{e}</option>)}
                                                <option value="Other">Other (Type custom exam...)</option>
                                            </select>
                                        </div>
                                        {form.examType === 'Other' && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9B7B5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                    Custom Exam Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customExam}
                                                    onChange={e => setCustomExam(e.target.value)}
                                                    placeholder="e.g. UPSC NDA, GATE, CAT..."
                                                    style={inputStyle}
                                                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                                    onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }}
                                                />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9B7B5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                Score Obtained
                                            </label>
                                            <input
                                                type="number"
                                                value={form.totalScore}
                                                onChange={e => setForm(f => ({ ...f, totalScore: e.target.value }))}
                                                placeholder="e.g. 145"
                                                style={inputStyle}
                                                onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9B7B5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                Max Score
                                            </label>
                                            <input
                                                type="number"
                                                value={form.maxScore}
                                                onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}
                                                placeholder="e.g. 200"
                                                style={inputStyle}
                                                onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                                                onBlur={e => { e.target.style.borderColor = '#EDE8E0'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            fontSize: '13px', color: '#dc2626',
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1.5px solid rgba(239,68,68,0.2)',
                                            borderRadius: '12px', padding: '12px 16px',
                                        }}>
                                            <IoAlertCircleOutline size={16} />{error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAnalyze}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            borderRadius: '12px',
                                            fontWeight: 800,
                                            fontSize: '14px',
                                            color: '#FFFFFF',
                                            background: 'linear-gradient(135deg,#F97316,#EA580C)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.2s, transform 0.1s',
                                            boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        Analyze My Performance
                                    </button>
                                </div>
                            </div>

                            {/* Recent History Card */}
                            {history.length > 0 && (
                                <div style={{ ...cardStyle, marginTop: '24px' }}>
                                    <div style={cardHeaderStyle}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoTimeOutline size={14} style={{ color: '#EA580C' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Recent Analyses</p>
                                            <p style={{ fontSize: '11px', color: '#9B7B5A', margin: 0 }}>Click any past analysis to restore and view it instantly</p>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                        {history.map((item, idx) => (
                                            <button
                                                key={item._id || idx}
                                                type="button"
                                                onClick={() => {
                                                    setAnalysis(item.payload);
                                                    setStep('result');
                                                }}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '14px 20px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1.5px solid #EDE8E0',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderBottomColor: '#EDE8E0',
                                                    borderBottomWidth: '1px',
                                                    borderBottomStyle: 'solid',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ paddingRight: '16px', minWidth: 0, flex: 1 }}>
                                                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.payload?.summary || item.details || 'Test Analysis'}
                                                    </p>
                                                    <p style={{ fontSize: '10px', color: '#9B7B5A', fontWeight: 500, marginTop: '4px', marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 700, color: '#EA580C',
                                                    background: 'rgba(249,115,22,0.08)',
                                                    border: '1.5px solid #FDDCAE',
                                                    padding: '2px 10px', borderRadius: '8px', flexShrink: 0,
                                                }}>
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
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '128px', paddingBottom: '128px', gap: '16px' }}>
                            {/* Warm spinner */}
                            <div style={{ position: 'relative', width: '56px', height: '56px', marginBottom: '4px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    border: '4px solid #FDDCAE',
                                    borderTopColor: '#F97316',
                                    animation: 'spin 0.9s linear infinite',
                                }} />
                            </div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <div
                                style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(249,115,22,0.08)',
                                    border: '1.5px solid rgba(249,115,22,0.2)',
                                    position: 'absolute',
                                }}
                            >
                                <IoSparklesOutline size={26} style={{ color: '#F97316' }} className="animate-pulse" />
                            </div>
                            <p style={{ color: '#1A1A1A', fontWeight: 700, fontSize: '15px', margin: 0 }}>Analyzing your performance...</p>
                            <p style={{ color: '#9B7B5A', fontSize: '13px', margin: 0 }}>Identifying weak areas and building your strategy</p>
                        </motion.div>
                    )}

                    {step === 'result' && analysis && (
                        <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4">

                            {/* Rating Banner */}
                            <div style={{ borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: rs.bg, border: `1.5px solid ${rs.border}` }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: '#FFFFFF', border: `1.5px solid ${rs.border}`,
                                }}>
                                    <span style={{ fontSize: '20px', fontWeight: 900, color: rs.text }}>
                                        {rating === 'Excellent' ? 'A' : rating === 'Good' ? 'B' : rating === 'Average' ? 'C' : 'D'}
                                    </span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 900, color: rs.text, margin: 0 }}>{rating}</p>
                                    <p style={{ fontSize: '12px', color: '#78350F', marginTop: '2px', marginBottom: 0 }}>{analysis.summary}</p>
                                </div>
                            </div>

                            {/* Weak Areas */}
                            {analysis.weakAreas?.length > 0 && (
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoTrendingDownOutline size={14} style={{ color: '#dc2626' }} />
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Weak Areas</p>
                                    </div>
                                    <div>
                                        {analysis.weakAreas.map((w, i) => (
                                            <div key={i} style={{ padding: '14px 20px', borderBottom: i < analysis.weakAreas.length - 1 ? '1.5px solid #EDE8E0' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <IoCloseCircleOutline size={14} style={{ color: '#dc2626', flexShrink: 0 }} />
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{w.topic}</p>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#9B7B5A', marginBottom: '4px', paddingLeft: '22px' }}>{w.reason}</p>
                                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#EA580C', margin: 0, paddingLeft: '22px' }}>{w.action}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strong Areas */}
                            {analysis.strongAreas?.length > 0 && (
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoTrendingUpOutline size={14} style={{ color: '#059669' }} />
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Strong Areas</p>
                                    </div>
                                    <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {analysis.strongAreas.map((s, i) => (
                                            <span key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '12px', fontWeight: 700,
                                                padding: '6px 12px', borderRadius: '999px',
                                                background: 'rgba(16,185,129,0.08)',
                                                border: '1.5px solid rgba(16,185,129,0.2)',
                                                color: '#059669',
                                            }}>
                                                <IoCheckmarkCircleOutline size={12} />{s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Next Steps */}
                            {analysis.nextSteps && (
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoBulbOutline size={14} style={{ color: '#b45309' }} />
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Next 3 Days Action Plan</p>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <p style={{ fontSize: '13px', color: '#1A1A1A', lineHeight: '1.7', margin: 0 }}>{analysis.nextSteps}</p>
                                    </div>
                                </div>
                            )}

                            {/* Exam Tips */}
                            {analysis.examTips?.length > 0 && (
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoCheckmarkCircleOutline size={14} style={{ color: '#EA580C' }} />
                                        </div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Exam Tips</p>
                                    </div>
                                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {analysis.examTips.map((t, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#1A1A1A' }}>
                                                <IoCheckmarkCircleOutline size={16} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />
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
