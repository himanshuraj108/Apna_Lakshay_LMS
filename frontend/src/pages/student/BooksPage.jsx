import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    IoArrowBack, IoSearchOutline, IoBookOutline,
    IoOpenOutline, IoStar,
    IoCloseCircle, IoRefreshOutline, IoAlertCircleOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import { BooksNotesPageSkeleton } from '../../components/ui/SkeletonLoader';
import Footer from '../../components/layout/Footer';

const BG_STYLE = `
.shimmer-text{background:linear-gradient(90deg,#f97316,#f59e0b,#ea580c,#f59e0b,#f97316);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
@keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
`;

const CATEGORIES = [
    { key: 'upsc',      label: 'UPSC / IAS',       color: 'from-red-500 to-rose-600',    glow: 'rgba(239,68,68,0.25)'    },
    { key: 'ssc',       label: 'SSC',               color: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.25)'   },
    { key: 'banking',   label: 'Banking',           color: 'from-green-500 to-emerald-600', glow: 'rgba(16,185,129,0.25)' },
    { key: 'nta',       label: 'JEE / NEET',        color: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.25)' },
    { key: 'ncert',     label: 'NCERT',             color: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,0.25)'  },
    { key: 'rrb',       label: 'RRB / Railway',     color: 'from-sky-500 to-blue-600',    glow: 'rgba(14,165,233,0.25)'   },
    { key: 'reasoning', label: 'Reasoning',         color: 'from-cyan-500 to-blue-500',   glow: 'rgba(6,182,212,0.25)'    },
    { key: 'english',   label: 'English',           color: 'from-pink-500 to-rose-500',   glow: 'rgba(236,72,153,0.25)'   },
    { key: 'gk',        label: 'GK / Current Affairs', color: 'from-teal-500 to-cyan-600', glow: 'rgba(20,184,166,0.25)'  },
];

const BookCard = ({ book, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 90 }}
        className="rounded-2xl overflow-hidden flex flex-col group bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
        {/* Cover */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {book.thumbnail ? (
                <img src={book.thumbnail} alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <IoBookOutline size={48} className="text-gray-300" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {book.rating && (
                <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-600 shadow-sm">
                    <IoStar size={10} /> {book.rating.toFixed(1)}
                </span>
            )}
        </div>
        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
            <h3 className="text-gray-900 text-sm font-bold leading-snug line-clamp-2">{book.title}</h3>
            <p className="text-gray-400 text-xs line-clamp-1">{(book.authors || []).join(', ')}</p>
            {book.description && <p className="text-gray-500 text-xs line-clamp-2 flex-1">{book.description}</p>}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                {book.pageCount && <span className="text-gray-400 text-[10px]">{book.pageCount} pages</span>}
                {book.publishedDate && <span className="text-gray-400 text-[10px]">{book.publishedDate.slice(0, 4)}</span>}
            </div>
            {book.previewLink && (
                <a href={book.previewLink} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all">
                    <IoOpenOutline size={14} /> Read Preview
                </a>
            )}
        </div>
    </motion.div>
);

const BooksPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [customExam, setCustomExam] = useState('');
    const [activeCategory, setActiveCategory] = useState('upsc');
    const [lang, setLang] = useState('en');

    const fetchBooks = useCallback(async (q = '', cat = 'upsc', l = 'en') => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim()); else params.set('category', cat);
            params.set('limit', '20'); params.set('lang', l);
            const res = await api.get(`/student/books?${params}`);
            setBooks(res.data.data || []);
        } catch { setError('Could not load books. Please try again.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchBooks('', activeCategory, lang); }, [activeCategory, lang]);

    const handleSearch = (e) => { e.preventDefault(); if (search.trim()) fetchBooks(search, activeCategory, lang); };
    const clearSearch = () => { setSearch(''); fetchBooks('', activeCategory, lang); };
    const toggleLang = () => { const next = lang === 'en' ? 'hi' : 'en'; setLang(next); setSearch(''); };

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <style>{BG_STYLE}</style>
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-all shadow-sm">
                            <IoArrowBack size={20} />
                        </motion.button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="shimmer-text text-3xl font-black">Books Library</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Free preview books for government exam preparation</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={toggleLang}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${lang === 'hi'
                            ? 'bg-orange-50 border-orange-300 text-orange-600'
                            : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 shadow-sm'}`}>
                        <span className={lang === 'en' ? 'text-gray-900 font-black' : 'text-gray-400'}>EN</span>
                        <span className="text-gray-300">|</span>
                        <span className={lang === 'hi' ? 'text-gray-900 font-black' : 'text-gray-400'}>हिं</span>
                    </motion.button>
                </motion.div>

                {/* Search bar */}
                <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    onSubmit={handleSearch} className="relative mb-6">
                    <IoSearchOutline size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search books, authors, topics…"
                        className="w-full pl-11 pr-24 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm shadow-sm" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {search && (
                            <button type="button" onClick={clearSearch} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                                <IoCloseCircle size={18} />
                            </button>
                        )}
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity">
                            Search
                        </button>
                    </div>
                </motion.form>

                {/* Category pills */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {CATEGORIES.map((cat) => (
                        <motion.button key={cat.key}
                            onClick={() => { setActiveCategory(cat.key); setSearch(''); setCustomExam(''); }}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${activeCategory === cat.key && !search && !customExam
                                ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                                : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
                            style={activeCategory === cat.key && !search && !customExam ? { boxShadow: `0 4px 14px -4px ${cat.glow}` } : {}}>
                            {cat.label}
                        </motion.button>
                    ))}
                </motion.div>

                {loading && <BooksNotesPageSkeleton variant="books" />}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoAlertCircleOutline size={36} className="text-red-400" />
                        <p className="text-gray-500 text-sm">{error}</p>
                        <button onClick={() => fetchBooks(search, activeCategory)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all shadow-sm">
                            <IoRefreshOutline size={16} /> Retry
                        </button>
                    </div>
                )}

                {!loading && !error && books.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <IoBookOutline size={40} className="text-gray-300" />
                        <p className="text-gray-400 text-sm">No books found. Try a different search.</p>
                    </div>
                )}

                {!loading && !error && books.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {books.map((book, i) => <BookCard key={book.id || i} book={book} delay={i * 0.04} />)}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default BooksPage;
