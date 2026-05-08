import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSend, IoSparkles, IoChevronDown,
    IoWarningOutline, IoLanguage, IoAddOutline,
    IoTrashOutline, IoPencilOutline, IoCheckmark,
    IoClose, IoMenuOutline, IoTimeOutline
} from 'react-icons/io5';
import api from '../../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'doubtboard_sessions';
const MAX_SESSIONS = 30;

const SUBJECTS = [
    { id: 'general',         label: 'General'         },
    { id: 'maths',           label: 'Maths'           },
    { id: 'science',         label: 'Science'         },
    { id: 'history',         label: 'History'         },
    { id: 'polity',          label: 'Polity'          },
    { id: 'economy',         label: 'Economy'         },
    { id: 'geography',       label: 'Geography'       },
    { id: 'current_affairs', label: 'Current Affairs' },
    { id: 'english',         label: 'English'         },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const loadSessions = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
};
const saveSessions = (sessions) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

const autoTitle = (question) => {
    const t = question.trim().replace(/\s+/g, ' ');
    return t.length <= 42 ? t : t.slice(0, 40) + '…';
};

// ─── Answer Formatter ─────────────────────────────────────────────────────────
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = ({ sessions, activeId, onSelect, onNew, onDelete, onRename, onPin }) => {
    const [editingId, setEditingId]   = useState(null);
    const [editVal, setEditVal]       = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const inputRef  = useRef(null);
    const menuRef   = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const startEdit = (s) => {
        setOpenMenuId(null);
        setEditingId(s.id);
        setEditVal(s.title);
        setTimeout(() => inputRef.current?.focus(), 50);
    };
    const commitEdit = (id) => {
        if (editVal.trim()) onRename(id, editVal.trim());
        setEditingId(null);
    };

    // Pinned chats first, then by createdAt desc
    const sorted = [...sessions].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
    });

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* New chat */}
            <button onClick={onNew}
                className="flex items-center gap-2 mx-3 mt-3 mb-2 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                <IoAddOutline size={16} className="text-yellow-500" />
                New Chat
            </button>

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4" ref={menuRef}>
                {sorted.length === 0 && (
                    <p className="text-center text-gray-400 text-xs mt-8">No chats yet</p>
                )}
                {sorted.map(s => (
                    <div key={s.id} className="relative group">
                        <div
                            onClick={() => { if (editingId !== s.id) onSelect(s.id); }}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${activeId === s.id ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                            {/* Active bar */}
                            {activeId === s.id && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-yellow-400" />}

                            {/* Pin dot */}
                            {s.pinned && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}

                            {/* Title / edit */}
                            {editingId === s.id ? (
                                <input
                                    ref={inputRef}
                                    value={editVal}
                                    onChange={e => setEditVal(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(s.id); if (e.key === 'Escape') setEditingId(null); }}
                                    onBlur={() => commitEdit(s.id)}
                                    onClick={e => e.stopPropagation()}
                                    className="flex-1 bg-transparent text-gray-900 text-xs outline-none border-b border-yellow-400 py-0.5"
                                />
                            ) : (
                                <span className="flex-1 text-xs text-gray-700 truncate font-medium leading-5 min-w-0">{s.title}</span>
                            )}

                            {/* 3-dot button — always visible on mobile, hover-only on desktop */}
                            {editingId !== s.id && (
                                <button
                                    onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === s.id ? null : s.id); }}
                                    className="flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                                    title="Options">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Dropdown menu */}
                        <AnimatePresence>
                            {openMenuId === s.id && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-2 top-9 z-50 rounded-xl overflow-hidden shadow-xl bg-white border border-gray-200"
                                    style={{ minWidth: 140 }}>
                                    {/* Pin */}
                                    <button
                                        onClick={e => { e.stopPropagation(); onPin(s.id); setOpenMenuId(null); }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        {s.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    {/* Rename */}
                                    <button
                                        onClick={e => { e.stopPropagation(); startEdit(s); }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all text-left">
                                        <IoPencilOutline size={13} />
                                        Rename
                                    </button>
                                    {/* Divider */}
                                    <div className="mx-2 border-t border-gray-100" />
                                    {/* Delete */}
                                    <button
                                        onClick={e => { e.stopPropagation(); onDelete(s.id); setOpenMenuId(null); }}
                                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-all text-left">
                                        <IoTrashOutline size={13} />
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ─── Main Component ───────────────────────────────────────────────────────────
const DoubtBoard = () => {
    const [lang, setLang]           = useState(null);
    const [sessions, setSessions]   = useState(() => loadSessions());
    const [activeId, setActiveId]   = useState(null);
    const [question, setQuestion]   = useState('');
    const [subject, setSubject]     = useState('general');
    const [loading, setLoading]     = useState(false);
    const [creditsLeft, setCredits] = useState(10);
    const [sidebarOpen, setSidebar] = useState(false);
    const bottomRef   = useRef(null);
    const textareaRef = useRef(null);

    // Fetch real credit count on mount
    useEffect(() => {
        api.get('/student/dashboard')
            .then(r => { if (r.data?.data?.doubtCredits != null) setCredits(r.data.data.doubtCredits); })
            .catch(() => {});
    }, []);

    const activeSession = sessions.find(s => s.id === activeId) || null;

    // Persist whenever sessions change
    useEffect(() => { saveSessions(sessions); }, [sessions]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages, loading]);

    // ── Session helpers ──────────────────────────────────────────────────────
    const createNewSession = useCallback((language = lang) => {
        const newSession = {
            id: uid(),
            title: 'New Chat',
            lang: language || 'en',
            messages: [],
            createdAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev].slice(0, MAX_SESSIONS));
        setActiveId(newSession.id);
        setQuestion('');
        return newSession.id;
    }, [lang]);

    const updateSession = (id, updater) => {
        setSessions(prev => {
            const next = prev.map(s => s.id === id ? { ...s, ...updater(s) } : s);
            const s = next.find(x => x.id === id);
            // Sync to backend if session has at least one message
            if (s && s.messages?.length > 0) {
                api.post('/student/doubt/sync-session', {
                    sessionId: s.id,
                    title: s.title,
                    lang: s.lang,
                    pinned: s.pinned,
                    messages: s.messages
                }).catch(() => {});
            }
            return next;
        });
    };

    const deleteSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeId === id) setActiveId(null);
    };

    const renameSession = (id, title) => {
        updateSession(id, () => ({ title }));
    };

    const pinSession = (id) => {
        updateSession(id, s => ({ pinned: !s.pinned }));
    };

    // ── Ask doubt ────────────────────────────────────────────────────────────
    const handleAsk = async () => {
        if (!question.trim() || loading) return;
        const q = question.trim();
        setQuestion('');

        // Ensure we have an active session
        let sessId = activeId;
        if (!sessId) { sessId = createNewSession(); }

        const isFirst = (sessions.find(s => s.id === sessId)?.messages || []).length === 0;

        // Add user message
        updateSession(sessId, s => ({
            messages: [...s.messages, { role: 'user', text: q, subject }],
            title: isFirst ? autoTitle(q) : s.title,
        }));

        setLoading(true);
        try {
            const res = await api.post('/student/doubt/ask', {
                question: q, subject, lang: activeSession?.lang || lang || 'en'
            });
            updateSession(sessId, s => ({
                messages: [...s.messages, { role: 'ai', text: res.data.answer, subject }],
            }));
            setCredits(res.data.creditsLeft);
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to get answer';
            setCredits(e.response?.data?.creditsLeft ?? creditsLeft);
            updateSession(sessId, s => ({
                messages: [...s.messages, { role: 'error', text: msg }],
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
    };

    // ── Language picker ──────────────────────────────────────────────────────
    if (!lang) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#F8FAFC' }}>
                <Link to="/student" className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                    <IoArrowBack size={18} />
                </Link>
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-yellow-50 border border-yellow-200">
                        <IoSparkles size={36} className="text-yellow-500" />
                    </div>
                    <h1 className="text-gray-900 font-black text-2xl mb-2">AI Doubt Board</h1>
                    <p className="text-gray-500 text-sm mb-10">Choose your preferred language to get started</p>
                    <div className="flex flex-col gap-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setLang('en')}
                            className="w-full py-5 rounded-2xl text-left px-6 transition-all bg-yellow-50 border border-yellow-300 hover:bg-yellow-100">
                            <p className="text-yellow-700 font-black text-xl">English</p>
                            <p className="text-gray-500 text-sm mt-0.5">Get answers in English</p>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setLang('hi')}
                            className="w-full py-5 rounded-2xl text-left px-6 transition-all bg-white border border-gray-200 hover:bg-gray-50">
                            <p className="text-gray-900 font-black text-xl">हिंदी</p>
                            <p className="text-gray-500 text-sm mt-0.5">हिंदी में जवाब पाएं — pure Hindi only</p>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => setLang('hinglish')}
                            className="w-full py-5 rounded-2xl text-left px-6 transition-all bg-white border border-gray-200 hover:bg-gray-50">
                            <p className="text-gray-900 font-black text-xl">Hinglish</p>
                            <p className="text-gray-500 text-sm mt-0.5">Roman Hindi — easy samajh aaye</p>
                        </motion.button>
                    </div>
                    <p className="text-gray-400 text-xs mt-8">10 questions per day · Powered by Groq AI</p>
                </motion.div>
            </div>
        );
    }

    const messages = activeSession?.messages || [];

    // ── Main chat layout ─────────────────────────────────────────────────────
    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Sidebar (desktop always visible, mobile as overlay) ── */}
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebar(false)}
                        className="fixed inset-0 z-30 bg-black/60 md:hidden" />
                )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <motion.div
                className="fixed md:relative z-40 md:z-auto h-full flex-shrink-0"
                style={{ width: 240, background: '#ffffff', borderRight: '1px solid #e2e8f0' }}
                initial={false}
                animate={{ x: sidebarOpen || window.innerWidth >= 768 ? 0 : -240 }}
                transition={{ type: 'tween', duration: 0.22 }}>
                <div className="flex items-center gap-2 px-3 h-14 border-b border-gray-200">
                    <IoSparkles size={13} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-900 font-bold text-sm flex-1 truncate">AI Doubt Board</span>
                    <button onClick={() => setSidebar(false)} className="md:hidden p-1 text-gray-400 hover:text-gray-700 flex-shrink-0">
                        <IoClose size={16} />
                    </button>
                </div>
                <Sidebar
                    sessions={sessions}
                    activeId={activeId}
                    onSelect={(id) => { setActiveId(id); setSidebar(false); }}
                    onNew={() => { createNewSession(); setSidebar(false); }}
                    onDelete={deleteSession}
                    onRename={renameSession}
                    onPin={pinSession}
                />
            </motion.div>

            {/* ── Chat area ── */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 flex-shrink-0 bg-white">
                    {/* Back to dashboard — visible on all screens, above/before menu */}
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>

                    {/* Mobile: open sidebar */}
                    <button onClick={() => setSidebar(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
                        <IoMenuOutline size={20} />
                    </button>

                    <h1 className="text-gray-900 font-bold text-sm truncate flex-1">
                        {activeSession?.title || 'New Chat'}
                    </h1>

                    {/* Lang switch */}
                    <button onClick={() => { setLang(null); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all flex-shrink-0"
                        style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', color: '#FACC15' }}>
                        <IoLanguage size={11} />
                        {lang === 'hi' ? 'हिंदी' : lang === 'hinglish' ? 'Hinglish' : 'English'}
                    </button>

                    {/* Credits */}
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{
                            background: creditsLeft > 3 ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${creditsLeft > 3 ? 'rgba(250,204,21,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            color: creditsLeft > 3 ? '#FACC15' : '#f87171'
                        }}>
                        {creditsLeft}/10
                    </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full pt-10 text-center px-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
                                <IoSparkles size={24} className="text-yellow-400" />
                            </div>
                            <p className="text-gray-900 font-bold text-base mb-1">Ask your first doubt</p>
                            <p className="text-gray-400 text-xs">Type below and press Enter to send</p>
                        </motion.div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                                className="max-w-2xl mx-auto">
                                {msg.role === 'user' ? (
                                    <div className="flex justify-end">
                                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-black font-medium"
                                            style={{ background: '#FACC15' }}>
                                            <p className="text-[10px] font-bold mb-1 opacity-50">
                                                {SUBJECTS.find(s => s.id === msg.subject)?.label || 'General'}
                                            </p>
                                            {msg.text}
                                        </div>
                                    </div>
                                ) : msg.role === 'error' ? (
                                    <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                        <IoWarningOutline size={16} className="flex-shrink-0 mt-0.5" />
                                        {msg.text}
                                    </div>
                                ) : (
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

                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="max-w-2xl mx-auto rounded-2xl px-4 py-4 border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-yellow-50 border border-yellow-200">
                                    <IoSparkles size={12} className="text-yellow-500" />
                                </div>
                                <span className="text-[11px] font-bold text-yellow-600">Thinking…</span>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-2 h-2 rounded-full bg-yellow-400/50"
                                        style={{ animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* ── Input bar with send INSIDE ── */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-white">
                    <div className="max-w-2xl mx-auto">
                        {/* Subject selector */}
                        <div className="relative inline-block mb-2">
                            <select value={subject} onChange={e => setSubject(e.target.value)}
                                className="appearance-none text-[11px] font-bold pl-2.5 pr-6 py-1.5 rounded-lg border border-yellow-300 text-yellow-700 bg-yellow-50 cursor-pointer focus:outline-none">
                                {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                            <IoChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-yellow-400/60 pointer-events-none" />
                        </div>

                        {/* Input + button inside */}
                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-yellow-400 bg-white transition-all shadow-sm">
                            <textarea
                                ref={textareaRef}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder={creditsLeft <= 0 ? 'Daily limit reached. Come back tomorrow!' : 'Ask your doubt… (Enter to send, Shift+Enter for new line)'}
                                rows={2}
                                disabled={loading || creditsLeft <= 0}
                                className="w-full resize-none text-sm text-gray-900 placeholder-gray-400 bg-transparent rounded-2xl px-4 pt-3 pb-10 focus:outline-none disabled:opacity-50"
                            />
                            {/* Send button inside */}
                            <button
                                onClick={handleAsk}
                                disabled={!question.trim() || loading || creditsLeft <= 0}
                                className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                                style={{ background: question.trim() && !loading ? '#FACC15' : 'rgba(250,204,21,0.15)' }}>
                                {loading
                                    ? <IoTimeOutline size={15} className="text-yellow-400 animate-spin" />
                                    : <IoSend size={14} className={question.trim() ? 'text-black' : 'text-yellow-400/50'} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoubtBoard;
