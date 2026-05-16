import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoChatbubblesOutline, IoPersonOutline,
    IoSearchOutline, IoTimeOutline, IoSparkles, IoTrashOutline,
    IoWarningOutline, IoChevronDown, IoClose, IoAlertCircle
} from 'react-icons/io5';
import api from '../../utils/api';

const LANG_LABEL = { en: 'English', hi: 'हिंदी', hinglish: 'Hinglish' };

// ─── Reuses the same answer formatter from DoubtBoard ─────────────────────────
const FormatAnswer = ({ text }) => {
    const lines = text.split('\n').filter(l => l.trim());
    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {lines.map((line, i) => {
                const boldified = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
                if (line.startsWith('## ') || line.startsWith('# ')) {
                    return <p key={i} className="font-black text-amber-600 text-[15px] mt-3" dangerouslySetInnerHTML={{ __html: boldified.replace(/^#+\s/, '') }} />;
                }
                if (line.match(/^\d+\.\s/)) {
                    return <p key={i} className="pl-3 text-gray-700" dangerouslySetInnerHTML={{ __html: boldified }} />;
                }
                if (line.startsWith('- ') || line.startsWith('• ')) {
                    return (
                        <div key={i} className="flex gap-2 pl-2">
                            <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                            <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: boldified.replace(/^[-•]\s/, '') }} />
                        </div>
                    );
                }
                return <p key={i} className="text-gray-700" dangerouslySetInnerHTML={{ __html: boldified }} />;
            })}
        </div>
    );
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-xl"><IoAlertCircle size={20} className="text-red-500" /></div>
                <p className="text-gray-900 font-bold text-sm">{message}</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all">
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-red-500/25">
                    Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
const StudentChatHistory = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [selected, setSelected] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loadingSess, setLS]    = useState(false);
    const [activeSession, setActiveSession] = useState(null); // { sessionId, messages, title, lang }
    const [confirm, setConfirm]   = useState(null); // { type: 'one'|'all', sessionId? }
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast]       = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        api.get('/admin/chat-history')
            .then(r => setStudents(r.data.students || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadStudent = async (s) => {
        setSelected(s);
        setActiveSession(null);
        setLS(true);
        try {
            const r = await api.get(`/admin/chat-history/${s._id}`);
            setSessions(r.data.sessions || []);
        } catch { setSessions([]); }
        finally { setLS(false); }
    };

    const handleDeleteSession = async (studentId, sessionId) => {
        setDeleting(true);
        try {
            await api.delete(`/admin/chat-history/${studentId}/${sessionId}`);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            if (activeSession?.sessionId === sessionId) setActiveSession(null);
            // Update count in students list
            setStudents(prev => prev.map(s => s._id === studentId
                ? { ...s, sessionCount: Math.max(0, (s.sessionCount || 1) - 1) }
                : s));
            showToast('Session deleted');
        } catch { showToast('Failed to delete', 'error'); }
        finally { setDeleting(false); setConfirm(null); }
    };

    const handleDeleteAll = async (studentId) => {
        setDeleting(true);
        try {
            await api.delete(`/admin/chat-history/${studentId}/all`);
            setSessions([]);
            setActiveSession(null);
            setStudents(prev => prev.filter(s => s._id !== studentId));
            setSelected(null);
            showToast('All sessions deleted');
        } catch { showToast('Failed to delete', 'error'); }
        finally { setDeleting(false); setConfirm(null); }
    };

    const fmt = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
            dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${
                            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm dialog */}
            <AnimatePresence>
                {confirm && (
                    <ConfirmDialog
                        message={confirm.type === 'all'
                            ? `Delete ALL ${sessions.length} sessions for ${selected?.name}?`
                            : 'Delete this chat session?'}
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => {
                            if (confirm.type === 'all') handleDeleteAll(selected._id);
                            else handleDeleteSession(selected._id, confirm.sessionId);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── LEFT PANEL: Student List (240px) ── */}
            <div className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
                {/* Header */}
                <div className="flex items-center gap-2 px-3 h-14 border-b border-gray-200 flex-shrink-0">
                    <Link to="/admin" className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={16} />
                    </Link>
                    <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <IoChatbubblesOutline size={12} className="text-white" />
                    </div>
                    <span className="text-gray-900 font-bold text-sm flex-1 truncate">Chat History</span>
                </div>
                {/* Search */}
                <div className="px-2 pt-2 pb-1">
                    <div className="relative">
                        <IoSearchOutline size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search students…"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-lg pl-7 pr-2 py-2 focus:outline-none focus:border-indigo-400 placeholder-gray-400" />
                    </div>
                </div>
                {/* Student list */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                    {loading && <div className="flex justify-center pt-8"><div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" /></div>}
                    {!loading && filtered.length === 0 && <p className="text-center text-gray-400 text-xs py-8">No sessions recorded</p>}
                    {filtered.map(s => (
                        <button key={s._id} onClick={() => loadStudent(s)}
                            className={`w-full text-left px-2.5 py-2.5 rounded-xl transition-all ${
                                selected?._id === s._id
                                    ? 'bg-indigo-50 border border-indigo-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                    {s.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-gray-900 text-xs font-semibold truncate">{s.name}</p>
                                    <p className="text-gray-500 text-[10px]">{s.sessionCount} session{s.sessionCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── MIDDLE PANEL: Session List ── */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
                {!selected ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
                            <IoPersonOutline size={22} className="text-indigo-400" />
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">Select a student</p>
                        <p className="text-gray-400 text-xs mt-1">to view their sessions</p>
                    </div>
                ) : (
                    <>
                        {/* Student header */}
                        <div className="px-3 h-14 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                {selected.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 text-xs font-bold truncate">{selected.name}</p>
                                <p className="text-gray-500 text-[10px]">{sessions.length} sessions</p>
                            </div>
                            {sessions.length > 0 && (
                                <button
                                    onClick={() => setConfirm({ type: 'all' })}
                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
                                    title="Delete all sessions"
                                    disabled={deleting}
                                >
                                    <IoTrashOutline size={14} />
                                </button>
                            )}
                        </div>
                        {/* Sessions */}
                        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                            {loadingSess && <div className="flex justify-center pt-8"><div className="w-5 h-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" /></div>}
                            {!loadingSess && sessions.length === 0 && (
                                <p className="text-center text-gray-400 text-xs py-8">No sessions found</p>
                            )}
                            {sessions.map(sess => (
                                <div key={sess.sessionId}
                                    className={`group relative rounded-xl border transition-all cursor-pointer ${
                                        activeSession?.sessionId === sess.sessionId
                                            ? 'bg-indigo-50 border-indigo-200'
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <button
                                        onClick={() => setActiveSession(sess)}
                                        className="w-full text-left px-3 py-2.5"
                                    >
                                        <div className="flex items-start gap-1.5">
                                            <IoSparkles size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-gray-900 text-xs font-semibold truncate leading-snug">{sess.title || 'Untitled'}</p>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className="text-gray-400 text-[9px] flex items-center gap-0.5">
                                                        <IoTimeOutline size={8} />{fmt(sess.lastActive)}
                                                    </span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-semibold">
                                                        {LANG_LABEL[sess.lang] || sess.lang}
                                                    </span>
                                                    <span className="text-gray-400 text-[9px]">{sess.messages?.length || 0} msg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    {/* Delete button — appears on hover */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'one', sessionId: sess.sessionId }); }}
                                        className="absolute top-2 right-2 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete session"
                                        disabled={deleting}
                                    >
                                        <IoClose size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── RIGHT PANEL: Chat View ── */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Top bar */}
                <div className="h-14 border-b border-gray-200 bg-white px-4 flex items-center gap-3 flex-shrink-0">
                    {activeSession ? (
                        <>
                            <IoSparkles size={14} className="text-amber-500 flex-shrink-0" />
                            <span className="text-gray-900 font-bold text-sm flex-1 truncate">{activeSession.title || 'Untitled'}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-semibold">
                                {LANG_LABEL[activeSession.lang] || activeSession.lang}
                            </span>
                            <span className="text-xs text-gray-500">{activeSession.messages?.length || 0} messages</span>
                            <button
                                onClick={() => setConfirm({ type: 'one', sessionId: activeSession.sessionId })}
                                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete this session"
                                disabled={deleting}
                            >
                                <IoTrashOutline size={15} />
                            </button>
                        </>
                    ) : (
                        <span className="text-gray-400 text-sm">Select a session to view the chat</span>
                    )}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {!activeSession && !selected && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                                <IoChatbubblesOutline size={28} className="text-amber-500" />
                            </div>
                            <p className="text-gray-800 font-bold mb-1">AI Doubt Board — Admin View</p>
                            <p className="text-gray-400 text-sm">Select a student, then a session to read the conversation</p>
                        </div>
                    )}

                    {!activeSession && selected && !loadingSess && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-3">
                                <IoSparkles size={20} className="text-indigo-400" />
                            </div>
                            <p className="text-gray-700 font-semibold text-sm">Pick a session</p>
                            <p className="text-gray-400 text-xs mt-1">from the list on the left</p>
                        </div>
                    )}

                    {activeSession && (
                        <AnimatePresence>
                            {(activeSession.messages || []).map((msg, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.02 }}
                                    className="max-w-2xl mx-auto"
                                >
                                    {msg.role === 'user' ? (
                                        /* User bubble — right aligned, amber (same as DoubtBoard) */
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-black font-medium"
                                                style={{ background: '#FACC15' }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ) : msg.role === 'error' ? (
                                        /* Error bubble */
                                        <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                            <IoWarningOutline size={16} className="flex-shrink-0 mt-0.5" />
                                            {msg.text}
                                        </div>
                                    ) : (
                                        /* AI answer bubble — white card with FormatAnswer (same as DoubtBoard) */
                                        <div className="rounded-2xl rounded-tl-sm px-4 py-4 border border-gray-200 bg-white shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-50 border border-yellow-200">
                                                    <IoSparkles size={12} className="text-yellow-500" />
                                                </div>
                                                <span className="text-[11px] font-bold text-yellow-600">Groq AI</span>
                                            </div>
                                            <FormatAnswer text={msg.text} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};

export default StudentChatHistory;
