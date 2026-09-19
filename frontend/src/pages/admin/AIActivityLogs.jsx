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

const INPUT = "w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-stone-900 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs font-medium placeholder:text-stone-400";

const TOOL_COLORS = {
    'Study Planner': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Test Analyzer': 'bg-orange-50 text-orange-700 border-orange-200',
    'Notes Summarizer': 'bg-purple-50 text-purple-700 border-purple-200',
    'News Quiz': 'bg-sky-50 text-sky-700 border-sky-200',
    'Task Suggestions': 'bg-amber-50 text-amber-700 border-amber-200',
    'Readiness Score': 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const renderPayloadDetails = (toolName, payload) => {
    if (!payload) return <p className="text-stone-400 font-medium italic text-xs">No detail data payload saved.</p>;
    
    switch (toolName) {
        case 'Study Planner':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                        <p className="font-bold text-indigo-950 mb-1 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <IoSparklesOutline size={14} className="text-indigo-600" /> Study Summary
                        </p>
                        <p className="text-stone-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.weeklyPlans?.map((w, wIdx) => (
                        <div key={wIdx} className="border border-[#EDE8E0] rounded-2xl bg-[#FAF6F0]/60 p-4 space-y-2.5 shadow-2xs">
                            <h5 className="font-black text-stone-900 text-xs border-b border-[#EDE8E0] pb-2">Week {w.week}: {w.focus}</h5>
                            <div className="divide-y divide-[#EDE8E0]/70">
                                {w.days?.map((d, dIdx) => (
                                    <div key={dIdx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-bold text-stone-900 text-xs">{d.day} — <span className="text-indigo-600 font-bold">{d.subject}</span></p>
                                            <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">{d.topics}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EDE8E0] text-stone-600">
                                                {d.hours} hrs
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {payload.tips?.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2">
                            <p className="font-bold text-amber-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                <IoBulbOutline size={14} className="text-amber-600" /> Plan Tips
                            </p>
                            <ul className="list-disc pl-4 space-y-1.5 text-stone-700 leading-relaxed font-semibold">
                                {payload.tips.map((t, idx) => <li key={idx}>{t}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        case 'Test Analyzer':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-4">
                        <p className="font-bold text-orange-950 mb-1 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <IoAnalyticsOutline size={14} className="text-orange-600" /> Performance Analysis
                        </p>
                        <p className="text-stone-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.weakAreas?.length > 0 && (
                        <div className="border border-[#EDE8E0] rounded-2xl bg-[#FAF6F0]/60 p-4 space-y-2.5 shadow-2xs">
                            <h5 className="font-black text-rose-600 text-xs uppercase tracking-wider border-b border-[#EDE8E0] pb-2">Identified Weak Areas</h5>
                            <div className="divide-y divide-[#EDE8E0]/70">
                                {payload.weakAreas.map((w, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                                        <p className="font-bold text-stone-900">{w.topic}</p>
                                        <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed"><span className="font-bold text-stone-700">Issue:</span> {w.reason}</p>
                                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5"><span className="uppercase text-[9px] tracking-wider font-black">Action:</span> {w.action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {payload.strongAreas?.length > 0 && (
                        <div className="border border-[#EDE8E0] rounded-2xl bg-white p-4 space-y-2 shadow-2xs">
                            <h5 className="font-black text-emerald-700 text-xs uppercase tracking-wider">Strong Areas</h5>
                            <div className="flex flex-wrap gap-1.5">
                                {payload.strongAreas.map((a, idx) => (
                                    <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {payload.revisionPlan?.length > 0 && (
                        <div className="border border-[#EDE8E0] rounded-2xl bg-[#FAF6F0]/60 p-4 space-y-2.5 shadow-2xs">
                            <h5 className="font-black text-indigo-700 text-xs uppercase tracking-wider border-b border-[#EDE8E0] pb-2">AI Revision Plan</h5>
                            <div className="divide-y divide-[#EDE8E0]/70">
                                {payload.revisionPlan.map((r, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-stone-900">{r.subject}</p>
                                            <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">{r.suggestion}</p>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            r.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            r.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                    <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4">
                        <p className="font-bold text-purple-950 mb-1 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <IoBookOutline size={14} className="text-purple-600" /> Summary
                        </p>
                        <p className="text-stone-700 leading-relaxed font-semibold">{payload.summary}</p>
                    </div>
                    {payload.keyPoints?.length > 0 && (
                        <div className="border border-[#EDE8E0] rounded-2xl bg-white p-4 space-y-2 shadow-2xs">
                            <h5 className="font-black text-stone-900 text-xs uppercase tracking-wider">Key Takeaways</h5>
                            <ul className="list-disc pl-4 space-y-1.5 text-stone-700 font-semibold leading-relaxed">
                                {payload.keyPoints.map((p, idx) => <li key={idx}>{p}</li>)}
                            </ul>
                        </div>
                    )}
                    {payload.importantFacts?.length > 0 && (
                        <div className="border border-[#EDE8E0] rounded-2xl bg-[#FAF6F0]/60 p-4 space-y-2.5 shadow-2xs">
                            <h5 className="font-black text-purple-700 text-xs uppercase tracking-wider border-b border-[#EDE8E0] pb-2">Important Facts & Relevance</h5>
                            <div className="divide-y divide-[#EDE8E0]/70">
                                {payload.importantFacts.map((f, idx) => (
                                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                                        <p className="font-bold text-stone-900">{f.fact}</p>
                                        <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed"><span className="font-bold text-stone-700">Why it's important:</span> {f.importance}</p>
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
                    <h5 className="font-black text-stone-900 text-xs uppercase tracking-wider">Generated Current Affairs Questions</h5>
                    {payload.questions?.map((q, idx) => (
                        <div key={idx} className="border border-[#EDE8E0] rounded-2xl bg-white p-4 space-y-2.5 shadow-2xs">
                            <p className="font-bold text-stone-900">Q{idx + 1}: {q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {q.options?.map((opt, optIdx) => {
                                    const letter = optIdx === 0 ? 'A' : optIdx === 1 ? 'B' : optIdx === 2 ? 'C' : 'D';
                                    const isCorrect = q.answer?.toUpperCase().includes(letter);
                                    return (
                                        <div key={optIdx} className={`px-3 py-2 rounded-xl border text-[11px] ${
                                            isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-[#FAF6F0] border-[#EDE8E0] text-stone-700'
                                        }`}>
                                            {opt}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-stone-500 italic mt-1.5"><span className="font-bold text-stone-700 not-italic uppercase text-[9px] tracking-wider block">Explanation:</span> {q.explanation}</p>
                        </div>
                    ))}
                </div>
            );
        case 'Task Suggestions':
            return (
                <div className="space-y-4 text-xs">
                    <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
                        <p className="font-bold text-amber-800 mb-1 uppercase tracking-wider text-[11px]">Motivation Tip</p>
                        <p className="text-stone-700 leading-relaxed font-semibold italic">"{payload.motivationTip}"</p>
                    </div>
                    {payload.suggestions?.map((s, idx) => (
                        <div key={idx} className="border border-[#EDE8E0] rounded-2xl bg-white p-4 flex justify-between items-start gap-4 shadow-2xs">
                            <div>
                                <p className="font-bold text-stone-900 text-xs">{s.title}</p>
                                <p className="text-[11px] text-stone-400 font-medium mt-0.5">Subject: {s.subject} • Reason: {s.reason}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#EDE8E0] text-stone-600 shrink-0">
                                {s.estimatedMinutes} mins
                            </span>
                        </div>
                    ))}
                </div>
            );
        case 'Readiness Score':
            return (
                <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-full border-3 border-emerald-500 border-t-transparent flex items-center justify-center font-black text-base text-emerald-700 bg-white shrink-0">
                            {payload.score}%
                        </div>
                        <div>
                            <p className="font-black text-emerald-900 text-sm">Readiness Level: {payload.level}</p>
                            <p className="text-stone-600 leading-relaxed font-medium mt-0.5 italic">"{payload.insight}"</p>
                        </div>
                    </div>
                    <div className="border border-[#EDE8E0] rounded-2xl bg-white p-4 space-y-2.5 shadow-2xs">
                        <h5 className="font-black text-stone-900 text-xs uppercase tracking-wider border-b border-[#EDE8E0] pb-2">Breakdown Metric Points</h5>
                        <div className="grid grid-cols-2 gap-3.5">
                            {payload.breakdown?.map((b, idx) => (
                                <div key={idx} className="bg-[#FAF6F0] border border-[#EDE8E0] p-3 rounded-xl text-center">
                                    <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider mb-1">{b.label}</span>
                                    <span className="text-sm font-black text-stone-900">{b.score} <span className="text-[10px] text-stone-400 font-medium">/{b.max}</span></span>
                                    <span className="text-[10px] text-stone-500 font-bold block truncate mt-1">{b.detail}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        default:
            return <pre className="bg-stone-900 text-stone-100 p-4 rounded-xl overflow-x-auto text-[11px] leading-relaxed">{JSON.stringify(payload, null, 2)}</pre>;
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
        <div className="relative min-h-screen" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                                <IoArrowBack size={15} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-sm">
                                    <IoSparklesOutline size={13} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">AI Study Suite</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">AI Activity Logs</h1>
                            <p className="text-stone-500 text-xs mt-0.5 font-medium">Audit real-time AI generation, test analysis, and student study plans</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-500 font-medium">Showing last 100 actions</span>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={fetchLogs} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                            <IoRefreshOutline size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {/* Filters Row */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl p-5 mb-6 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[11px] text-stone-500 uppercase tracking-wider font-bold flex items-center gap-1 mb-1.5">
                                <IoSearch size={11} className="text-stone-400" /> Search Student
                            </label>
                            <input
                                value={filters.search}
                                onChange={e => handleSetFilter('search', e.target.value)}
                                placeholder="Search by student name or details…"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-stone-500 uppercase tracking-wider font-bold flex items-center gap-1 mb-1.5">
                                <IoFilter size={11} className="text-stone-400" /> Filter by AI Tool
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-xs">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-14 bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#EDE8E0] bg-[#FAF6F0]/60">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">Date & Time</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">Student Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">Seat Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">AI Tool</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500">Activity Details</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-stone-500 text-center">Payload</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <IoSparklesOutline size={36} className="mx-auto text-amber-300 mb-2" />
                                                <p className="text-sm font-black text-stone-800">No AI activity logs found</p>
                                                <p className="text-xs text-stone-400 mt-1">Try adjusting your filters or search query.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map(log => {
                                            const student = log.student || {};
                                            const badgeStyle = TOOL_COLORS[log.toolName] || 'bg-stone-100 text-stone-700 border-[#EDE8E0]';
                                            const hasPayload = !!log.payload;

                                            return (
                                                <tr key={log._id} className="border-b border-[#EDE8E0]/70 last:border-0 hover:bg-[#FAF6F0]/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap font-medium">
                                                        <span className="flex items-center gap-1.5"><IoTimeOutline size={13} className="text-stone-400" /> {fmtDate(log.createdAt)}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {student.profileImage ? (
                                                                <img src={student.profileImage.startsWith('http') ? student.profileImage : `${BASE_URL}${student.profileImage}`} alt={student.name || 'Student'} className="w-8 h-8 rounded-full object-cover border border-[#EDE8E0]" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-400/20">
                                                                    {(student.name || log.studentName || 'S').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-stone-900 leading-tight">{student.name || log.studentName}</p>
                                                                <p className="text-[10px] text-stone-500 font-medium truncate max-w-[150px]">{log.studentEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.seat?.number ? (
                                                            <span className="text-[10px] font-bold bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 px-2 py-0.5 rounded-md">
                                                                Seat {student.seat.number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-stone-400 italic font-medium">No Seat</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                                            {log.toolName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-sm">
                                                        <span className="text-xs text-stone-600 font-medium leading-relaxed block line-clamp-2">
                                                            {log.details}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        {hasPayload ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    setSelectedLog(log);
                                                                    setShowModal(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-orange-500/20 cursor-pointer transition-all"
                                                            >
                                                                Inspect
                                                            </motion.button>
                                                        ) : (
                                                            <span className="text-[10px] text-stone-400 font-medium italic">No Payload</span>
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl pointer-events-auto border border-[#EDE8E0] overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-5 border-b border-[#EDE8E0] flex items-center justify-between bg-[#FAF6F0]/70">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl border ${TOOL_COLORS[selectedLog.toolName] || 'bg-stone-100 border-[#EDE8E0] text-stone-600'}`}>
                                            <IoSparklesOutline size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-stone-900 text-sm">{selectedLog.toolName} Payload</h3>
                                            <p className="text-[11px] font-bold text-stone-500">Generated for {selectedLog.student?.name || selectedLog.studentName}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
                                    >
                                        <IoCloseOutline size={20} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-5 bg-white" style={{ scrollbarWidth: 'thin' }}>
                                    {renderPayloadDetails(selectedLog.toolName, selectedLog.payload)}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3.5 border-t border-[#EDE8E0] bg-[#FAF6F0]/70 flex justify-between items-center text-[11px] text-stone-400 font-bold">
                                    <span>Logged at {fmtDate(selectedLog.createdAt)}</span>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 font-bold rounded-xl text-xs transition-all shadow-2xs cursor-pointer"
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
