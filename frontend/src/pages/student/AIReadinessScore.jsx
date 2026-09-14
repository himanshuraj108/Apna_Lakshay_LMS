import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    IoArrowBack, IoSparklesOutline, IoAlertCircleOutline,
    IoRefreshOutline, IoTrendingUpOutline, IoCalendarOutline,
    IoCheckmarkCircleOutline, IoFlashOutline, IoBookOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const GaugeArc = ({ score, color }) => {
    const radius = 64;
    const circ = 2 * Math.PI * radius;
    const pct = Math.min(score / 100, 1);
    const halfCirc = Math.PI * radius;
    const dash = pct * halfCirc;
    return (
        <svg width="160" height="90" viewBox="0 0 160 90" fill="none">
            <path d="M 16 80 A 64 64 0 0 1 144 80" stroke="#EDE8E0" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 16 80 A 64 64 0 0 1 144 80"
                stroke={color} strokeWidth="10" strokeLinecap="round" fill="none"
                strokeDasharray={`${dash} ${halfCirc}`} strokeDashoffset="0"
                style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
    );
};

const LEVEL_CONFIG = {
    Excellent:    { color: '#059669', barColor: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)' },
    Good:         { color: '#1d4ed8', barColor: '#2563eb', bg: 'rgba(37,99,235,0.06)',   border: 'rgba(37,99,235,0.15)'  },
    Average:      { color: '#b45309', barColor: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)' },
    'Needs Work': { color: '#dc2626', barColor: '#ef4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)'  },
};

const AIReadinessScore = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchScore = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/student/ai/readiness-score');
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load readiness score.');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchScore(); }, []);
    const lc = data ? (LEVEL_CONFIG[data.level] || LEVEL_CONFIG['Average']) : null;

    return (
        <div className="min-h-screen" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

            {/* Sticky header */}
            <div className="sticky top-0 z-30" style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8E0' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg transition-all" style={{ color: '#9B7B5A' }}
                        onMouseEnter={e => { e.currentTarget.style.background='#FFF5EE'; e.currentTarget.style.color='#EA580C'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#9B7B5A'; }}>
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                            <IoTrendingUpOutline size={14} className="text-white" />
                        </div>
                        <h1 className="font-bold text-base" style={{ color: '#1A1A1A' }}>Exam Readiness Score</h1>
                    </div>
                    <button onClick={fetchScore} disabled={loading}
                        className="p-2 rounded-lg transition-all disabled:opacity-50" style={{ color: '#9B7B5A' }}>
                        <IoRefreshOutline size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#FFF5EE', border: '1.5px solid #FDDCAE' }}>
                            <IoSparklesOutline size={28} className="animate-pulse" style={{ color: '#F97316' }} />
                        </div>
                        <p className="font-bold text-base" style={{ color: '#1A1A1A' }}>Calculating your readiness...</p>
                        <p className="text-sm" style={{ color: '#9B7B5A' }}>Analyzing attendance, streaks, mock tests</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <IoAlertCircleOutline size={16} />{error}
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* Main Score Card */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden text-center"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                            <div className="px-5 pt-8 pb-4">
                                <div className="flex justify-center mb-1 relative">
                                    <GaugeArc score={data.score} color={lc.barColor} />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-4xl font-black" style={{ color: lc.color }}>{data.score}</span>
                                        <span className="text-xs font-bold" style={{ color: '#9B7B5A' }}>/ 100</span>
                                    </div>
                                </div>
                                <div className="mt-3 mb-1">
                                    <span className="text-sm font-black px-4 py-1.5 rounded-full"
                                        style={{ background: lc.bg, border: `1px solid ${lc.border}`, color: lc.color }}>
                                        {data.level}
                                    </span>
                                </div>
                                <p className="text-xs mt-3 max-w-xs mx-auto" style={{ color: '#6B6560' }}>{data.insight}</p>
                                {data.examTarget && data.examTarget !== 'generic' && (
                                    <p className="text-[10px] mt-1 font-semibold" style={{ color: '#9B7B5A' }}>Target: {data.examTarget.toUpperCase().replace(/_/g, ' ')}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Breakdown */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="rounded-2xl overflow-hidden"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                            <div className="px-5 py-3 border-b" style={{ borderColor: '#EDE8E0', background: '#FFFAF5' }}>
                                <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>Score Breakdown</p>
                            </div>
                            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
                                {data.breakdown?.map((item, i) => {
                                    const pct = Math.round((item.score / item.max) * 100);
                                    return (
                                        <div key={i} className="px-5 py-4" style={{ borderBottom: i < data.breakdown.length - 1 ? '1px solid #F0EDE8' : 'none' }}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{item.label}</p>
                                                    <p className="text-[11px]" style={{ color: '#9B7B5A' }}>{item.detail}</p>
                                                </div>
                                                <span className="text-sm font-black" style={{ color: lc.color }}>
                                                    {item.score}<span className="text-xs font-semibold" style={{ color: '#9B7B5A' }}>/{item.max}</span>
                                                </span>
                                            </div>
                                            <div className="w-full rounded-full h-1.5" style={{ background: '#F0EDE8' }}>
                                                <motion.div className="h-1.5 rounded-full" style={{ background: lc.barColor }}
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Take Mock Test',    icon: IoFlashOutline,            link: '/student/mock-test',  color: '#ea580c', bg: 'rgba(234,88,12,0.08)'   },
                                { label: 'Study Planner',     icon: IoCalendarOutline,          link: '/student/planner',    color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
                                { label: 'Ask AI Doubt',      icon: IoSparklesOutline,          link: '/student/doubt',      color: '#F97316', bg: 'rgba(249,115,22,0.08)'  },
                                { label: 'Check Attendance',  icon: IoCheckmarkCircleOutline,   link: '/student/attendance', color: '#10b981', bg: 'rgba(16,185,129,0.08)'  },
                            ].map((action, i) => (
                                <Link key={i} to={action.link}>
                                    <div className="rounded-xl flex items-center gap-3 p-4 cursor-pointer transition-all"
                                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor='#FDDCAE'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor='#EDE8E0'; }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: action.bg }}>
                                            <action.icon size={15} style={{ color: action.color }} />
                                        </div>
                                        <p className="text-xs font-bold" style={{ color: '#1A1A1A' }}>{action.label}</p>
                                    </div>
                                </Link>
                            ))}
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AIReadinessScore;
