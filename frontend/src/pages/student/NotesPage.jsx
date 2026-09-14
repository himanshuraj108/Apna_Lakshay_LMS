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
import { BooksNotesPageSkeleton } from '../../components/ui/SkeletonLoader';
import Footer from '../../components/layout/Footer';

const BG_STYLE = `
.shimmer-text-orange{background:linear-gradient(90deg,#f97316,#fb923c,#ea580c,#fb923c,#f97316);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer-o 4s linear infinite;}
@keyframes shimmer-o{0%{background-position:200% center;}100%{background-position:-200% center;}}
`;

const CATEGORIES = [
    { key: 'upsc',      label: 'UPSC / IAS',          color: 'from-red-500 to-rose-600',    glow: 'rgba(239,68,68,0.25)'    },
    { key: 'ssc',       label: 'SSC',                  color: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.25)'   },
    { key: 'banking',   label: 'Banking',              color: 'from-green-500 to-emerald-600', glow: 'rgba(16,185,129,0.25)' },
    { key: 'nta',       label: 'JEE / NEET',           color: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.25)' },
    { key: 'ncert',     label: 'NCERT',                color: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,0.25)'  },
    { key: 'rrb',       label: 'RRB / Railway',        color: 'from-sky-500 to-blue-600',    glow: 'rgba(14,165,233,0.25)'   },
    { key: 'polity',    label: 'Polity',               color: 'from-pink-500 to-rose-500',   glow: 'rgba(236,72,153,0.25)'   },
    { key: 'history',   label: 'History',              color: 'from-yellow-500 to-amber-500', glow: 'rgba(234,179,8,0.25)'   },
    { key: 'geography', label: 'Geography',            color: 'from-teal-500 to-cyan-600',   glow: 'rgba(20,184,166,0.25)'   },
    { key: 'economy',   label: 'Economy',              color: 'from-cyan-500 to-blue-500',   glow: 'rgba(6,182,212,0.25)'    },
    { key: 'reasoning', label: 'Reasoning',            color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.25)' },
    { key: 'english',   label: 'English',              color: 'from-indigo-500 to-blue-600', glow: 'rgba(99,102,241,0.25)'   },
    { key: 'gk',        label: 'GK / Current Affairs', color: 'from-orange-500 to-red-500',  glow: 'rgba(249,115,22,0.25)'   },
];

const NoteCard = ({ note, delay }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 90 }}
        className="rounded-2xl p-5 flex flex-col gap-3 group relative overflow-hidden transition-all"
        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 12px rgba(180,120,60,0.06)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#FDDCAE'; e.currentTarget.style.boxShadow='0 8px 28px rgba(249,115,22,0.11)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#EDE8E0'; e.currentTarget.style.boxShadow='0 2px 12px rgba(180,120,60,0.06)'; }}>
        <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg,#F97316,#EA580C,transparent)' }} />
        <div className="flex items-start gap-3">
            <div className="shrink-0 p-2.5 rounded-xl" style={{ background: '#FFF5EE', border: '1px solid #FDDCAE' }}>
                <IoDocumentTextOutline size={22} style={{ color: '#F97316' }} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>{note.title}</h3>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#9B7B5A' }}>{note.author}</p>
            </div>
        </div>
        {note.description && <p className="text-xs line-clamp-3" style={{ color: '#6B6560' }}>{note.description}</p>}
        {note.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {note.subjects.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full truncate max-w-[120px]"
                        style={{ background: '#FFF5EE', border: '1px solid #FDDCAE', color: '#EA580C' }}>{s}</span>
                ))}
            </div>
        )}
        <div className="flex items-center gap-3 text-[10px]" style={{ color: '#9B7B5A' }}>
            {note.year && <span className="flex items-center gap-1"><IoCalendarOutline size={11} /> {note.year}</span>}
            {note.downloads > 0 && <span className="flex items-center gap-1"><IoArrowDownCircleOutline size={11} /> {note.downloads.toLocaleString()}</span>}
            {note.hasPdf && <span className="ml-auto px-1.5 py-0.5 rounded font-bold text-[9px]" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626' }}>PDF</span>}
        </div>
        <div className="flex gap-2 mt-auto pt-2" style={{ borderTop: '1px solid #F0EDE8' }}>
            <a href={note.detailUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ background: '#F5F0EA', border: '1px solid #EDE8E0', color: '#6B6560' }}
                onMouseEnter={e => { e.currentTarget.style.background='#EDE8E0'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#F5F0EA'; }}>
                <IoEyeOutline size={14} /> View
            </a>
            <a href={note.downloadUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
                onMouseEnter={e => { e.currentTarget.style.opacity='0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}>
                <IoDownloadOutline size={14} /> Download
            </a>
        </div>
    </motion.div>
);

const NotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [customExam, setCustomExam] = useState('');
    const [activeCategory, setActiveCategory] = useState('upsc');
    const [lang, setLang] = useState('en');

    const fetchNotes = useCallback(async (q = '', cat = 'upsc', l = 'en') => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim()); else params.set('category', cat);
            params.set('limit', '20'); params.set('lang', l);
            const res = await api.get(`/student/notes?${params}`);
            setNotes(res.data.data || []);
        } catch { setError('Could not load notes. Please try again.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchNotes('', activeCategory, lang); }, [activeCategory, lang]);

    const handleSearch = (e) => { e.preventDefault(); if (search.trim()) fetchNotes(search, activeCategory, lang); };
    const clearSearch = () => { setSearch(''); fetchNotes('', activeCategory, lang); };
    const toggleLang = () => { const next = lang === 'en' ? 'hi' : 'en'; setLang(next); setSearch(''); };

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif" }}>
            <style>{BG_STYLE}</style>
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="p-2.5 rounded-xl transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', boxShadow: '0 2px 8px rgba(180,120,60,0.07)' }}>
                            <IoArrowBack size={20} />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="shimmer-text-orange text-3xl font-black">Study Notes</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#9B7B5A' }}>Free downloadable notes for exam prep</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={toggleLang}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all"
                        style={lang === 'hi'
                            ? { background: '#FFF5EE', border: '1.5px solid #FDDCAE', color: '#EA580C' }
                            : { background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#9B7B5A', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}>
                        <span style={{ color: lang === 'en' ? '#1A1A1A' : '#9B7B5A', fontWeight: lang === 'en' ? '900' : '500' }}>EN</span>
                        <span style={{ color: '#EDE8E0' }}>|</span>
                        <span style={{ color: lang === 'hi' ? '#1A1A1A' : '#9B7B5A', fontWeight: lang === 'hi' ? '900' : '500' }}>हिं</span>
                    </motion.button>
                </motion.div>

                {/* Search */}
                <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    onSubmit={handleSearch} className="relative mb-6">
                    <IoSearchOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9B7B5A' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search notes, topics, subjects…"
                        className="w-full pl-11 pr-24 py-3.5 rounded-2xl text-sm outline-none transition-all"
                        style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#1A1A1A', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}
                        onFocus={e => { e.target.style.borderColor='#F97316'; e.target.style.boxShadow='0 0 0 3px rgba(249,115,22,0.12)'; }}
                        onBlur={e => { e.target.style.borderColor='#EDE8E0'; e.target.style.boxShadow='0 2px 8px rgba(180,120,60,0.05)'; }} />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {search && (
                            <button type="button" onClick={clearSearch} className="p-1.5 transition-colors" style={{ color: '#9B7B5A' }}>
                                <IoCloseCircle size={18} />
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                            Search
                        </button>
                    </div>
                </motion.form>

                {/* Category pills */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {CATEGORIES.map(cat => (
                        <motion.button key={cat.key}
                            onClick={() => { setActiveCategory(cat.key); setSearch(''); setCustomExam(''); }}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeCategory === cat.key && !search && !customExam
                                ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                                : ''}`}
                            style={activeCategory === cat.key && !search && !customExam
                                ? { boxShadow: `0 4px 14px -4px ${cat.glow}` }
                                : { background: '#FFFFFF', borderColor: '#EDE8E0', color: '#9B7B5A' }}>
                            {cat.label}
                        </motion.button>
                    ))}
                </motion.div>

                {loading && <BooksNotesPageSkeleton variant="notes" />}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoAlertCircleOutline size={36} style={{ color: '#F97316' }} />
                        <p className="text-sm" style={{ color: '#9B7B5A' }}>{error}</p>
                        <button onClick={() => fetchNotes(search, activeCategory)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                            style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F' }}>
                            <IoRefreshOutline size={16} /> Retry
                        </button>
                    </div>
                )}

                {!loading && !error && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoDocumentTextOutline size={40} style={{ color: '#FDDCAE' }} />
                        <p className="text-sm" style={{ color: '#9B7B5A' }}>No notes found. Try a different search.</p>
                    </div>
                )}

                {!loading && !error && notes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((note, i) => <NoteCard key={note.id || i} note={note} delay={i * 0.04} />)}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default NotesPage;
