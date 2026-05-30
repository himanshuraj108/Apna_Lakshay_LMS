import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { BASE_URL } from '../../utils/api';
import { Link } from 'react-router-dom';
import {
    IoArrowBack, IoSearch, IoFilter, IoSparklesOutline,
    IoPersonOutline, IoInformationCircleOutline, IoCalendarOutline,
    IoTimeOutline, IoRefreshOutline, IoCloseOutline, IoBookOutline,
    IoBulbOutline, IoAnalyticsOutline, IoCheckboxOutline, IoShieldCheckmarkOutline
} from 'react-icons/io5';

const PAGE_BG = { background: '#F8FAFC' };
const INPUT = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 shadow-sm";

const TOOL_COLORS = {
    'Study Planner': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Test Analyzer': 'bg-orange-50 text-orange-600 border-orange-100',
    'Notes Summarizer': 'bg-violet-50 text-violet-600 border-violet-100',
    'News Quiz': 'bg-sky-50 text-sky-600 border-sky-100',
    'Task Suggestions': 'bg-amber-50 text-amber-600 border-amber-100',
    'Readiness Score': 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const renderPayloadDetails = (toolName, payload) => {
    if (!payload) return <p className="text-gray-400 font-medium italic text-xs">No detail data payload saved.</p>;
    
    switch (toolName) {
        case 'Study Planner':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4">
                        <p className="font-extrabold text-indigo-900 mb-1 text-sm flex items-center gap-1.5">
                            <IoSparklesOutline size={14} className="text-indigo-600" /> Study Summary
                        </p>
                        <p className="text-gray-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.weeklyPlans?.map((w, wIdx) => (
                        <div key={wIdx} className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                            <h5 className="font-black text-gray-800 text-sm border-b border-gray-100 pb-1.5">Week {w.week}: {w.focus}</h5>
                            <div className="divide-y divide-gray-100">
                                {w.days?.map((d, dIdx) => (
                                    <div key={dIdx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-gray-800 text-xs">{d.day} — <span className="text-indigo-600 font-bold">{d.subject}</span></p>
                                            <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{d.topics}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 border text-gray-600">
                                                {d.hours} hrs
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {payload.tips?.length > 0 && (
                        <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 space-y-2">
                            <p className="font-extrabold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1">
                                <IoBulbOutline size={14} className="text-amber-600" /> Plan Tips
                            </p>
                            <ul className="list-disc pl-4 space-y-1.5 text-gray-705 leading-relaxed font-semibold">
                                {payload.tips.map((t, idx) => <li key={idx}>{t}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        case 'Test Analyzer':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-4">
                        <p className="font-extrabold text-orange-900 mb-1 text-sm flex items-center gap-1.5">
                            <IoAnalyticsOutline size={14} className="text-orange-600" /> Performance Analysis
                        </p>
                        <p className="text-gray-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.weakAreas?.length > 0 && (
                        <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                            <h5 className="font-black text-red-600 text-xs uppercase tracking-wider border-b border-gray-100 pb-1.5">Identified Weak Areas</h5>
                            <div className="divide-y divide-gray-100">
                                {payload.weakAreas.map((w, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                                        <p className="font-bold text-gray-800">{w.topic}</p>
                                        <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed"><span className="font-bold text-gray-600">Issue:</span> {w.reason}</p>
                                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5"><span className="uppercase text-[9px] tracking-wider font-extrabold">Action:</span> {w.action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {payload.strongAreas?.length > 0 && (
                        <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2 shadow-sm">
                            <h5 className="font-black text-green-600 text-xs uppercase tracking-wider">Strong Areas</h5>
                            <div className="flex flex-wrap gap-1.5">
                                {payload.strongAreas.map((a, idx) => (
                                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold">
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {payload.revisionPlan?.length > 0 && (
                        <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                            <h5 className="font-black text-indigo-605 text-xs uppercase tracking-wider border-b border-gray-100 pb-1.5">AI Revision Plan</h5>
                            <div className="divide-y divide-gray-100">
                                {payload.revisionPlan.map((r, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-gray-800">{r.subject}</p>
                                            <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed">{r.suggestion}</p>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                            r.priority === 'high' ? 'bg-red-50 text-red-650 border border-red-100' :
                                            r.priority === 'medium' ? 'bg-amber-50 text-amber-650 border border-amber-100' :
                                            'bg-green-50 text-green-650 border border-green-100'
                                        }`}>
                                            {r.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'Notes Summarizer':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-4">
                        <p className="font-extrabold text-purple-900 mb-1 text-sm flex items-center gap-1.5">
                            <IoBookOutline size={14} className="text-purple-600" /> Summary
                        </p>
                        <p className="text-gray-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.keyPoints?.length > 0 && (
                        <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2 shadow-sm">
                            <h5 className="font-black text-gray-800 text-xs uppercase tracking-wider">Key Takeaways</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-gray-700 font-semibold leading-relaxed">
                                {payload.keyPoints.map((p, idx) => <li key={idx}>{p}</li>)}
                            </ul>
                        </div>
                    )}
                    {payload.importantFacts?.length > 0 && (
                        <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                            <h5 className="font-black text-purple-600 text-xs uppercase tracking-wider border-b border-gray-100 pb-1.5">Important Facts & Relevance</h5>
                            <div className="divide-y divide-gray-100">
                                {payload.importantFacts.map((f, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                                        <p className="font-bold text-gray-800">{f.fact}</p>
                                        <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed"><span className="font-bold text-gray-650">Why it's important:</span> {f.importance}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'News Quiz':
            return (
                <div className="space-y-4 text-xs">
                    <h5 className="font-black text-gray-800 text-xs uppercase tracking-wider mb-1">Generated Questions</h5>
                    {payload.questions?.map((q, idx) => (
                        <div key={idx} className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                            <p className="font-bold text-gray-800">Q{idx + 1}: {q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {q.options?.map((opt, optIdx) => {
                                    const letter = optIdx === 0 ? 'A' : optIdx === 1 ? 'B' : optIdx === 2 ? 'C' : 'D';
                                    const isCorrect = q.answer?.toUpperCase().includes(letter);
                                    return (
                                        <div key={optIdx} className={`px-3 py-2 rounded-lg border text-[11px] ${
                                            isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-gray-50/50 border-gray-200 text-gray-700'
                                        }`}>
                                            {opt}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-gray-500 italic mt-1.5"><span className="font-bold text-gray-700 not-italic uppercase text-[9px] tracking-wider block">Explanation:</span> {q.explanation}</p>
                        </div>
                    ))}
                </div>
            );
        case 'Task Suggestions':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4">
                        <p className="font-extrabold text-amber-800 mb-1 text-sm flex items-center gap-1.5">
                            <IoBulbOutline size={14} className="text-amber-600" /> Motivation Tip
                        </p>
                        <p className="text-gray-700 leading-relaxed font-semibold italic">"{payload.motivationTip}"</p>
                    </div>
                    {payload.suggestions?.map((s, idx) => (
                        <div key={idx} className="border border-gray-150 rounded-xl bg-white p-4 flex justify-between items-start gap-4 shadow-sm">
                            <div>
                                <p className="font-extrabold text-gray-800 text-xs">{s.title}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Subject: {s.subject} • Reason: {s.reason}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 border text-gray-600 shrink-0">
                                {s.estimatedMinutes} mins
                            </span>
                        </div>
                    ))}
                </div>
            );
        case 'Readiness Score':
            return (
                <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-4 bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
                        <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center font-black text-base text-emerald-600 bg-white shadow-sm shrink-0">
                            {payload.score}%
                        </div>
                        <div>
                            <p className="font-extrabold text-emerald-800 text-sm">Readiness Level: {payload.level}</p>
                            <p className="text-gray-650 leading-relaxed font-medium mt-0.5 italic">"{payload.insight}"</p>
                        </div>
                    </div>
                    <div className="border border-gray-150 rounded-xl bg-white p-4 space-y-2.5 shadow-sm">
                        <h5 className="font-black text-gray-800 text-xs uppercase tracking-wider border-b border-gray-100 pb-1.5">Breakdown Metric Points</h5>
                        <div className="grid grid-cols-2 gap-3.5">
                            {payload.breakdown?.map((b, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-1">{b.label}</span>
                                    <span className="text-sm font-black text-gray-800">{b.score} <span className="text-[10px] text-gray-400 font-medium">/{b.max}</span></span>
                                    <span className="text-[9px] text-gray-550 font-bold block truncate mt-1">{b.detail}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        default:
            return <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-[10px] leading-relaxed">{JSON.stringify(payload, null, 2)}</pre>;
    }
};

const AIActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ tool: '', search: '' });
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (filters.tool) q.append('tool', filters.tool);
            if (filters.search) q.append('search', filters.search);
            const res = await api.get(`/admin/ai-activity?${q}`);
            if (res.data.success) {
                setLogs(res.data.logs || []);
            }
        } catch (e) {
            console.error('Failed to fetch AI activity logs:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSetFilter = (k, v) => {
        setFilters(p => ({ ...p, [k]: v }));
    };

    const fmtDate = (d) => {
        return new Date(d).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            {/* Background design accents */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-6%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-3xl" />
                <div className="absolute bottom-[10%] right-[-6%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                                <IoSparklesOutline size={12} /> AI Suite
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">AI Study Suite Activity Logs</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-semibold">Showing last 100 AI activity actions</span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={fetchLogs} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/85 border border-indigo-100 text-indigo-600 rounded-xl text-sm font-semibold transition-all">
                            <IoRefreshOutline size={15} className={loading ? 'animate-spin' : ''} /> Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {/* Filters Row */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white border border-gray-200/80 rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center gap-1 mb-1.5">
                                <IoSearch size={10} /> Search student
                            </label>
                            <input
                                value={filters.search}
                                onChange={e => handleSetFilter('search', e.target.value)}
                                placeholder="Search by student name or details…"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center gap-1 mb-1.5">
                                <IoFilter size={10} /> Filter by AI tool
                            </label>
                            <select
                                value={filters.tool}
                                onChange={e => handleSetFilter('tool', e.target.value)}
                                className={INPUT}
                            >
                                <option value="">All Tools</option>
                                <option value="Study Planner">Study Planner</option>
                                <option value="Test Analyzer">Test Analyzer</option>
                                <option value="Notes Summarizer">Notes Summarizer</option>
                                <option value="News Quiz">News Quiz</option>
                                <option value="Task Suggestions">Task Suggestions</option>
                                <option value="Readiness Score">Readiness Score</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Table card */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-left">Date & Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-left">Student Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-left">Seat info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-left">AI tool</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-left">Activity details</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-450 text-center">Payload</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <IoSparklesOutline size={32} className="mx-auto text-indigo-200 mb-2 animate-pulse" />
                                                <p className="text-sm font-black text-gray-700">No AI activity logs found</p>
                                                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search query.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map(log => {
                                            const student = log.student || {};
                                            const badgeStyle = TOOL_COLORS[log.toolName] || 'bg-gray-55 text-gray-600 border-gray-200';
                                            const hasPayload = !!log.payload;

                                            return (
                                                <tr key={log._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/45 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5"><IoTimeOutline size={13} className="text-gray-400" /> {fmtDate(log.createdAt)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {student.profileImage ? (
                                                                <img src={student.profileImage.startsWith('http') ? student.profileImage : `${BASE_URL}${student.profileImage}`} alt={student.name || 'Student'} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 font-black text-xs flex items-center justify-center">
                                                                    {(student.name || log.studentName || 'S').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-gray-800 leading-tight">{student.name || log.studentName}</p>
                                                                <p className="text-[10px] text-gray-450 font-semibold truncate max-w-[150px]">{log.studentEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.seat?.number ? (
                                                            <span className="text-[10px] font-black bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                                                                Seat {student.seat.number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 italic font-medium">No Seat</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                                                            {log.toolName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-sm">
                                                        <span className="text-xs text-gray-600 font-medium leading-relaxed block line-clamp-2">
                                                            {log.details}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        {hasPayload ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    setSelectedLog(log);
                                                                    setShowModal(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-all"
                                                            >
                                                                Inspect
                                                            </motion.button>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 font-semibold italic">No Payload</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Modal for inspect payload details */}
            <AnimatePresence>
                {showModal && selectedLog && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-black z-45"
                        />
                        {/* Modal Container */}
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-gray-50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl pointer-events-auto border border-gray-200 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl border ${TOOL_COLORS[selectedLog.toolName] || 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                            <IoSparklesOutline size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-800 text-sm">{selectedLog.toolName} payload</h3>
                                            <p className="text-[10px] font-bold text-gray-400">Generated for {selectedLog.student?.name || selectedLog.studentName}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <IoCloseOutline size={20} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
                                    {renderPayloadDetails(selectedLog.toolName, selectedLog.payload)}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3.5 border-t border-gray-150 bg-white flex justify-between items-center text-[10px] text-gray-400 font-bold">
                                    <span>Logged at {fmtDate(selectedLog.createdAt)}</span>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-lg transition-colors"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIActivityLogs;
