import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    IoArrowBack, IoSearchOutline, IoDocumentTextOutline,
    IoDownloadOutline, IoOpenOutline, IoEyeOutline,
    IoCloseCircle, IoRefreshOutline, IoAlertCircleOutline,
    IoCalendarOutline, IoArrowDownCircleOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import Footer from '../../components/layout/Footer';

const BG_STYLE = `
@keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
@keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-50px,40px) scale(1.15);}66%{transform:translate(25px,-35px) scale(0.85);}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
@keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
.card-glass{background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.07);}
.card-glass:hover{background:linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02));border-color:rgba(255,255,255,0.12);}
`;

const CATEGORIES = [
    { key: 'upsc', label: 'UPSC / IAS', color: 'from-red-500 to-rose-600', glow: 'rgba(239,68,68,0.3)' },
    { key: 'ssc', label: 'SSC', color: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.3)' },
    { key: 'banking', label: 'Banking', color: 'from-green-500 to-emerald-600', glow: 'rgba(16,185,129,0.3)' },
    { key: 'nta', label: 'JEE / NEET', color: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.3)' },
    { key: 'ncert', label: 'NCERT', color: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,0.3)' },
    { key: 'rrb', label: 'RRB / Railway', color: 'from-sky-500 to-blue-600', glow: 'rgba(14,165,233,0.3)' },
    { key: 'polity', label: 'Polity', color: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,0.3)' },
    { key: 'history', label: 'History', color: 'from-yellow-500 to-amber-500', glow: 'rgba(234,179,8,0.3)' },
    { key: 'geography', label: 'Geography', color: 'from-teal-500 to-cyan-600', glow: 'rgba(20,184,166,0.3)' },
    { key: 'economy', label: 'Economy', color: 'from-cyan-500 to-blue-500', glow: 'rgba(6,182,212,0.3)' },
    { key: 'reasoning', label: 'Reasoning', color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.3)' },
    { key: 'english', label: 'English', color: 'from-indigo-500 to-blue-600', glow: 'rgba(99,102,241,0.3)' },
    { key: 'gk', label: 'GK / Current Affairs', color: 'from-orange-500 to-red-500', glow: 'rgba(249,115,22,0.3)' },
];

// ─── Note Card ────────────────────────────────────────────────────
const NoteCard = ({ note, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 90 }}
        className="card-glass rounded-2xl p-5 flex flex-col gap-3 group relative overflow-hidden"
    >
        {/* top accent */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Icon + title */}
        <div className="flex items-start gap-3">
            <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20">
                <IoDocumentTextOutline size={22} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-bold leading-snug line-clamp-2">{note.title}</h3>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{note.author}</p>
            </div>
        </div>

        {/* Description */}
        {note.description && (
            <p className="text-gray-600 text-xs line-clamp-3">{note.description}</p>
        )}

        {/* Tags */}
        {note.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {note.subjects.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-500 truncate max-w-[120px]">
                        {s}
                    </span>
                ))}
            </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
            {note.year && (
                <span className="flex items-center gap-1">
                    <IoCalendarOutline size={11} /> {note.year}
                </span>
            )}
            {note.downloads > 0 && (
                <span className="flex items-center gap-1">
                    <IoArrowDownCircleOutline size={11} /> {note.downloads.toLocaleString()}
                </span>
            )}
            {note.hasPdf && (
                <span className="ml-auto px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded font-bold text-[9px]">PDF</span>
            )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
            <a
                href={note.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-all"
            >
                <IoEyeOutline size={14} /> View
            </a>
            <a
                href={note.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
                <IoDownloadOutline size={14} /> Download
            </a>
        </div>
    </motion.div>
);

// ─── Notes Page ───────────────────────────────────────────────────
const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [customExam, setCustomExam] = useState('');
    const [activeCategory, setActiveCategory] = useState('upsc');
    const [lang, setLang] = useState('en');

    const fetchNotes = useCallback(async (q = '', cat = 'upsc', l = 'en') => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim());
            else params.set('category', cat);
            params.set('limit', '20');
            params.set('lang', l);
            const res = await api.get(`/student/notes?${params}`);
            setNotes(res.data.data || []);
        } catch {
            setError('Could not load notes. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNotes('', activeCategory, lang); }, [activeCategory, lang]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) fetchNotes(search, activeCategory, lang);
    };

    const clearSearch = () => {
        setSearch('');
        fetchNotes('', activeCategory, lang);
    };

    const toggleLang = () => {
        const next = lang === 'en' ? 'hi' : 'en';
        setLang(next);
        setSearch('');
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050508' }}>
            <style>{BG_STYLE}</style>

            {/* Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div style={{ animation: 'orb1 14s ease-in-out infinite' }} className="absolute top-[-15%] left-[-8%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
                <div style={{ animation: 'orb2 18s ease-in-out infinite' }} className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"
                        >
                            <IoArrowBack size={20} />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="shimmer-text text-3xl font-black">Study Notes</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Free downloadable notes from Internet Archive for exam prep</p>
                    </div>
                    {/* Language Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleLang}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${lang === 'hi'
                            ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                    >
                        <span className={lang === 'en' ? 'text-white font-black' : 'text-gray-500'}>EN</span>
                        <span className="text-gray-600">|</span>
                        <span className={lang === 'hi' ? 'text-white font-black' : 'text-gray-500'}>हिं</span>
                    </motion.button>
                </motion.div>

                {/* Search bar */}
                <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    onSubmit={handleSearch} className="relative mb-6"
                >
                    <IoSearchOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search notes, topics, subjects…"
                        className="w-full pl-11 pr-24 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all text-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {search && (
                            <button type="button" onClick={clearSearch} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                <IoCloseCircle size={18} />
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
                            Search
                        </button>
                    </div>
                </motion.form>

                {/* Category pills */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className="flex gap-2 mb-3 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {CATEGORIES.map(cat => (
                        <motion.button
                            key={cat.key}
                            onClick={() => { setActiveCategory(cat.key); setSearch(''); setCustomExam(''); }}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeCategory === cat.key && !search && !customExam
                                ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg`
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                }`}
                            style={activeCategory === cat.key && !search && !customExam ? { boxShadow: `0 4px 20px -4px ${cat.glow}` } : {}}
                        >
                            {cat.label}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Custom exam input */}
                <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
                    onSubmit={e => { e.preventDefault(); if (customExam.trim()) { setSearch(''); fetchNotes(customExam.trim(), activeCategory, lang); } }}
                    className="flex gap-2 mb-6"
                >
                    <input
                        value={customExam}
                        onChange={e => setCustomExam(e.target.value)}
                        placeholder="Can't find your exam? Type it here e.g. CAPF, CLAT, CDS…"
                        className="flex-1 px-4 py-2.5 bg-white/3 border border-dashed border-white/10 rounded-xl text-white text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500/40 transition-all"
                    />
                    <motion.button type="submit" whileTap={{ scale: 0.95 }}
                        className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
                    >Search</motion.button>
                    {customExam && (
                        <motion.button type="button" whileTap={{ scale: 0.95 }}
                            onClick={() => { setCustomExam(''); fetchNotes('', activeCategory, lang); }}
                            className="px-3 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs rounded-xl transition-all"
                        >✕</motion.button>
                    )}
                </motion.form>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                        <p className="text-gray-500 text-sm">Loading notes…</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoAlertCircleOutline size={36} className="text-red-400" />
                        <p className="text-gray-400 text-sm">{error}</p>
                        <button onClick={() => fetchNotes(search, activeCategory)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-all"
                        >
                            <IoRefreshOutline size={16} /> Retry
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoDocumentTextOutline size={40} className="text-gray-600" />
                        <p className="text-gray-500 text-sm">No notes found. Try a different search.</p>
                    </div>
                )}

                {/* Notes grid */}
                {!loading && !error && notes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((note, i) => (
                            <NoteCard key={note.id || i} note={note} delay={i * 0.04} />
                        ))}
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
};

export default NotesPage;
