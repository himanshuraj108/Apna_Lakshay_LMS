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
    // Half-circle: sweep = PI * r = 201.06
    const halfCirc = Math.PI * radius;
    const dash = pct * halfCirc;

    return (
        <svg width="160" height="90" viewBox="0 0 160 90" fill="none">
            {/* Track */}
            <path d="M 16 80 A 64 64 0 0 1 144 80" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" fill="none" />
            {/* Fill */}
            <path d="M 16 80 A 64 64 0 0 1 144 80"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dash} ${halfCirc}`}
                strokeDashoffset="0"
                style={{ transition: 'stroke-dasharray 1s ease' }}
            />
        </svg>
    );
};

const LEVEL_CONFIG = {
    Excellent:     { color: '#059669', barColor: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.15)' },
    Good:          { color: '#1d4ed8', barColor: '#2563eb', bg: 'rgba(37,99,235,0.06)',   border: 'rgba(37,99,235,0.15)'  },
    Average:       { color: '#b45309', barColor: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)' },
    'Needs Work':  { color: '#dc2626', barColor: '#ef4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)'  },
};

const AIReadinessScore = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchScore = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/student/ai/readiness-score');
            setData(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load readiness score.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScore(); }, []);

    const lc = data ? (LEVEL_CONFIG[data.level] || LEVEL_CONFIG['Average']) : null;

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                            <IoTrendingUpOutline size={14} className="text-emerald-500" />
                        </div>
                        <h1 className="text-gray-900 font-bold text-base">Exam Readiness Score</h1>
                    </div>
                    <button onClick={fetchScore} disabled={loading}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50">
                        <IoRefreshOutline size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <IoSparklesOutline size={28} className="text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-gray-900 font-bold text-base">Calculating your readiness...</p>
                        <p className="text-gray-400 text-sm">Analyzing attendance, streaks, mock tests</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <IoAlertCircleOutline size={16} />{error}
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* Main Score Card */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-white border border-gray-200 overflow-hidden text-center"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-5 pt-8 pb-4">
                                {/* Gauge */}
                                <div className="flex justify-center mb-1 relative">
                                    <GaugeArc score={data.score} color={lc.barColor} />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <span className="text-4xl font-black" style={{ color: lc.color }}>{data.score}</span>
                                        <span className="text-xs font-bold text-gray-400">/ 100</span>
                                    </div>
                                </div>

                                <div className="mt-3 mb-1">
                                    <span className="text-sm font-black px-4 py-1.5 rounded-full"
                                        style={{ background: lc.bg, border: `1px solid ${lc.border}`, color: lc.color }}>
                                        {data.level}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 max-w-xs mx-auto">{data.insight}</p>
                                {data.examTarget && data.examTarget !== 'generic' && (
                                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">Target: {data.examTarget.toUpperCase().replace(/_/g, ' ')}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Breakdown */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="rounded-2xl bg-white border border-gray-200 overflow-hidden"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                <p className="text-sm font-bold text-gray-800">Score Breakdown</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {data.breakdown?.map((item, i) => {
                                    const pct = Math.round((item.score / item.max) * 100);
                                    return (
                                        <div key={i} className="px-5 py-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                                    <p className="text-[11px] text-gray-400">{item.detail}</p>
                                                </div>
                                                <span className="text-sm font-black" style={{ color: lc.color }}>
                                                    {item.score}<span className="text-xs font-semibold text-gray-400">/{item.max}</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <motion.div className="h-1.5 rounded-full" style={{ background: lc.barColor }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
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
                                { label: 'Take Mock Test', icon: IoFlashOutline, link: '/student/mock-test', color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
                                { label: 'Study Planner', icon: IoCalendarOutline, link: '/student/planner', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                                { label: 'Ask AI Doubt', icon: IoSparklesOutline, link: '/student/doubt', color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
                                { label: 'Check Attendance', icon: IoCheckmarkCircleOutline, link: '/student/attendance', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                            ].map((action, i) => (
                                <Link key={i} to={action.link}>
                                    <div className="rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all p-4 flex items-center gap-3 cursor-pointer"
                                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: action.bg }}>
                                            <action.icon size={15} style={{ color: action.color }} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-700">{action.label}</p>
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
