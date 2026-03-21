import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoChatbubblesOutline, IoPersonOutline,
    IoSearchOutline, IoChevronDown, IoChevronUp, IoTimeOutline,
    IoSparkles
} from 'react-icons/io5';
import api from '../../utils/api';

const LANG_LABEL = { en: 'English', hi: 'हिंदी', hinglish: 'Hinglish' };

const StudentChatHistory = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [selected, setSelected] = useState(null);   // { _id, name }
    const [sessions, setSessions] = useState([]);
    const [loadingSess, setLS]    = useState(false);
    const [openSession, setOpen]  = useState(null);   // sessionId

    useEffect(() => {
        api.get('/admin/chat-history')
            .then(r => setStudents(r.data.students || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const loadStudent = async (s) => {
        setSelected(s);
        setLS(true);
        try {
            const r = await api.get(`/admin/chat-history/${s._id}`);
            setSessions(r.data.sessions || []);
        } catch { setSessions([]); }
        finally { setLS(false); }
    };

    const fmt = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
            dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen" style={{ background: '#070a10' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-white/5"
                style={{ background: 'rgba(7,10,16,0.96)', backdropFilter: 'blur(16px)' }}>
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <IoChatbubblesOutline size={15} className="text-yellow-400" />
                    <h1 className="text-white font-bold text-base flex-1">Student Chat History</h1>
                    <span className="text-xs text-gray-500">AI Doubt Board</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 flex gap-5 h-[calc(100vh-56px)]">

                {/* Left: student list */}
                <div className="w-72 flex-shrink-0 flex flex-col">
                    <div className="relative mb-3">
                        <IoSearchOutline size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search students…"
                            className="w-full bg-white/5 border border-white/8 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-yellow-400/30 placeholder-gray-600" />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5">
                        {loading && <div className="flex justify-center pt-10"><div className="w-6 h-6 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" /></div>}
                        {!loading && filtered.length === 0 && <p className="text-center text-gray-700 text-xs py-10">No sessions recorded yet</p>}
                        {filtered.map(s => (
                            <button key={s._id} onClick={() => loadStudent(s)}
                                className="w-full text-left px-3 py-2.5 rounded-xl border transition-all"
                                style={{
                                    background: selected?._id === s._id ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.025)',
                                    border: selected?._id === s._id ? '1px solid rgba(250,204,21,0.25)' : '1px solid rgba(255,255,255,0.06)',
                                }}>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                        {s.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-xs font-semibold truncate">{s.name}</p>
                                        <p className="text-gray-600 text-[10px]">{s.sessionCount} session{s.sessionCount !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: sessions */}
                <div className="flex-1 overflow-y-auto">
                    {!selected && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.15)' }}>
                                <IoChatbubblesOutline size={24} className="text-yellow-400" />
                            </div>
                            <p className="text-white font-bold mb-1">Select a student</p>
                            <p className="text-gray-600 text-sm">to view their AI doubt sessions</p>
                        </div>
                    )}

                    {selected && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <IoPersonOutline size={13} className="text-gray-400" />
                                <span className="text-white font-bold text-sm">{selected.name}</span>
                                <span className="text-gray-600 text-xs">· {sessions.length} sessions</span>
                            </div>

                            {loadingSess && <div className="flex justify-center pt-10"><div className="w-6 h-6 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" /></div>}

                            {!loadingSess && sessions.length === 0 && (
                                <p className="text-center text-gray-700 text-xs py-10">No sessions synced yet</p>
                            )}

                            {sessions.map(sess => (
                                <motion.div key={sess.sessionId} layout
                                    className="rounded-2xl border border-white/6 overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.025)' }}>
                                    {/* Session header */}
                                    <button
                                        onClick={() => setOpen(openSession === sess.sessionId ? null : sess.sessionId)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/4 transition-all">
                                        <IoSparkles size={13} className="text-yellow-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-xs font-semibold truncate">{sess.title || 'Untitled'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-gray-600 text-[10px] flex items-center gap-1">
                                                    <IoTimeOutline size={10} />{fmt(sess.lastActive)}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                                                    {LANG_LABEL[sess.lang] || sess.lang}
                                                </span>
                                                <span className="text-gray-600 text-[10px]">{sess.messages?.length || 0} msg</span>
                                            </div>
                                        </div>
                                        {openSession === sess.sessionId ? <IoChevronUp size={13} className="text-gray-500 flex-shrink-0" /> : <IoChevronDown size={13} className="text-gray-500 flex-shrink-0" />}
                                    </button>

                                    {/* Messages */}
                                    <AnimatePresence>
                                        {openSession === sess.sessionId && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-white/5 overflow-hidden">
                                                <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
                                                    {(sess.messages || []).map((m, i) => (
                                                        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            {m.role !== 'user' && (
                                                                <div className="w-5 h-5 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <IoSparkles size={9} className="text-yellow-400" />
                                                                </div>
                                                            )}
                                                            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                                                m.role === 'user'
                                                                    ? 'bg-yellow-400/10 border border-yellow-400/15 text-white'
                                                                    : m.role === 'error'
                                                                    ? 'bg-red-500/10 border border-red-500/15 text-red-400'
                                                                    : 'bg-white/4 border border-white/6 text-gray-300'
                                                            }`}>
                                                                {m.text}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentChatHistory;
