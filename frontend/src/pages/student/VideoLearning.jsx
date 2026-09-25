import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
    IoArrowBackOutline, IoSearchOutline, IoPlayCircleOutline,
    IoCloseOutline, IoVideocamOutline, IoEyeOutline,
    IoTimeOutline, IoRefreshOutline, IoBookOutline,
    IoSchoolOutline, IoChevronDownOutline, IoPlayCircle,
    IoWarningOutline, IoLanguageOutline, IoCheckmarkCircleOutline,
} from 'react-icons/io5';

/* ─── All exams ───────────────────────────────────────────────────────────── */
const ALL_EXAMS = [
    { value: 'upsc_cse',   label: 'UPSC CSE / IAS',  group: 'UPSC' },
    { value: 'upsc_cds',   label: 'UPSC CDS',         group: 'UPSC' },
    { value: 'ssc_cgl',    label: 'SSC CGL',           group: 'SSC' },
    { value: 'ssc_chsl',   label: 'SSC CHSL',          group: 'SSC' },
    { value: 'ssc_gd',     label: 'SSC GD',            group: 'SSC' },
    { value: 'ssc_mts',    label: 'SSC MTS',           group: 'SSC' },
    { value: 'ssc_cpo',    label: 'SSC CPO',           group: 'SSC' },
    { value: 'ibps_po',    label: 'IBPS PO',           group: 'Banking' },
    { value: 'ibps_clerk', label: 'IBPS Clerk',        group: 'Banking' },
    { value: 'sbi_po',     label: 'SBI PO',            group: 'Banking' },
    { value: 'sbi_clerk',  label: 'SBI Clerk',         group: 'Banking' },
    { value: 'rrb_ntpc',   label: 'RRB NTPC',          group: 'Railway' },
    { value: 'jee_main',   label: 'JEE Main',          group: 'Engineering' },
    { value: 'neet_ug',    label: 'NEET UG',           group: 'Medical' },
    { value: 'bpsc_pre',   label: 'BPSC',              group: 'State' },
    { value: 'class_6',    label: 'Class 6',           group: 'School' },
    { value: 'class_7',    label: 'Class 7',           group: 'School' },
    { value: 'class_8',    label: 'Class 8',           group: 'School' },
    { value: 'class_9',    label: 'Class 9',           group: 'School' },
    { value: 'class_10',   label: 'Class 10',          group: 'School' },
    { value: 'class_11',   label: 'Class 11',          group: 'School' },
    { value: 'class_12',   label: 'Class 12',          group: 'School' },
    { value: 'generic',    label: 'General Studies',   group: 'Other' },
];

/* ─── Subject chips per exam ──────────────────────────────────────────────── */
const EXAM_CHIPS = {
    upsc_cse:   ['History', 'Polity', 'Geography', 'Economy', 'Science & Tech', 'Environment', 'Ethics', 'Current Affairs', 'CSAT'],
    upsc_cds:   ['History', 'Geography', 'Polity', 'Maths', 'English', 'Current Affairs'],
    ssc_cgl:    ['Quantitative Aptitude', 'English', 'General Awareness', 'Reasoning', 'Maths'],
    ssc_chsl:   ['English', 'Maths', 'General Awareness', 'Reasoning'],
    ssc_gd:     ['GK', 'Maths', 'English', 'Reasoning'],
    ssc_mts:    ['GK', 'English', 'Maths', 'Reasoning'],
    ssc_cpo:    ['Polity', 'Maths', 'English', 'Reasoning', 'GK'],
    ibps_po:    ['Reasoning', 'Quantitative Aptitude', 'English', 'Banking Awareness', 'Computer'],
    ibps_clerk: ['Reasoning', 'Maths', 'English', 'Banking Awareness', 'Computer'],
    sbi_po:     ['Reasoning', 'Quant', 'English', 'Banking', 'Data Interpretation'],
    sbi_clerk:  ['Reasoning', 'Maths', 'English', 'Banking', 'Computer'],
    rrb_ntpc:   ['Maths', 'GK', 'Reasoning', 'General Science', 'Current Affairs'],
    jee_main:   ['Physics', 'Chemistry', 'Maths', 'Mechanics', 'Organic Chemistry', 'Calculus'],
    neet_ug:    ['Biology', 'Physics', 'Chemistry', 'Botany', 'Zoology', 'Organic Chemistry'],
    bpsc_pre:   ['History', 'Geography', 'Polity', 'Economy', 'Bihar GK', 'Current Affairs'],
    bpse_pre:   ['History', 'Geography', 'Polity', 'Economy', 'Bihar GK'],
    class_6:    ['Maths', 'Science', 'Social Science', 'English', 'Hindi'],
    class_7:    ['Maths', 'Science', 'Social Science', 'English', 'Hindi'],
    class_8:    ['Maths', 'Science', 'Social Science', 'English', 'Hindi'],
    class_9:    ['Maths', 'Science', 'Social Science', 'English', 'Hindi', 'Economics'],
    class_10:   ['Maths', 'Science', 'Social Science', 'English', 'Hindi', 'Economics'],
    class_11:   ['Physics', 'Chemistry', 'Maths', 'Biology', 'Economics', 'English'],
    class_12:   ['Physics', 'Chemistry', 'Maths', 'Biology', 'Economics', 'English'],
    generic:    ['General Knowledge', 'Reasoning', 'Maths', 'English', 'Current Affairs', 'Science'],
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseDuration(iso) {
    if (!iso) return '';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const h = parseInt(match[1] || 0);
    const m = parseInt(match[2] || 0);
    const s = parseInt(match[3] || 0);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtViews(n) {
    const num = parseInt(n || 0);
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return String(num);
}

function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

/* ═══ STEP SCREENS ══════════════════════════════════════════════════════════ */

/* ── Step 1: Language selection ─────────────────────────────────────────────── */
function LanguageStep({ onSelect, onBack }) {
    return (
        <div style={{
            minHeight: '100vh', background: '#F7F3EC',
            fontFamily: "'DM Sans','Inter',sans-serif",
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{
                background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)',
                borderBottom: '1.5px solid #EDE8E0', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 10,
                    background: '#FFFFFF', border: '1.5px solid #EDE8E0',
                    color: '#78350F', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                }}>
                    <IoArrowBackOutline size={16} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg,#F97316,#EA580C)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(249,115,22,0.30)',
                    }}>
                        <IoVideocamOutline size={18} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Video Learning</h1>
                        <p style={{ fontSize: 11, color: '#9B7B5A', margin: 0 }}>Step 1 of 2 — Select Language</p>
                    </div>
                </div>
            </div>

            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 16px',
                position: 'relative',
            }}>
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }} />
                <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: 24,
                        border: '1.5px solid #EDE8E0',
                        boxShadow: '0 8px 40px rgba(180,120,60,0.10)',
                        overflow: 'hidden',
                    }}>
                        {/* Header band */}
                        <div style={{ height: 4, background: 'linear-gradient(90deg,#F97316,#EA580C)' }} />
                        <div style={{ padding: '28px 28px 32px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 56, height: 56, borderRadius: 16,
                                background: 'rgba(249,115,22,0.10)',
                                border: '1.5px solid rgba(249,115,22,0.20)',
                                margin: '0 auto 18px',
                            }}>
                                <IoLanguageOutline size={28} color="#F97316" />
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px', textAlign: 'center' }}>
                                Select Language
                            </h2>
                            <p style={{ fontSize: 13, color: '#9B7B5A', textAlign: 'center', margin: '0 0 28px' }}>
                                Choose the language for study videos
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {[
                                    { value: 'hi', label: 'Hindi', native: 'हिंदी', desc: 'Hindi medium lectures' },
                                    { value: 'en', label: 'English', native: 'English', desc: 'English medium lectures' },
                                ].map(lang => (
                                    <button
                                        key={lang.value}
                                        onClick={() => onSelect(lang.value)}
                                        style={{
                                            padding: '18px 16px', borderRadius: 16, cursor: 'pointer',
                                            background: '#FFFAF5', border: '1.5px solid #EDE8E0',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                            transition: 'all 0.18s',
                                            fontFamily: "'DM Sans',sans-serif",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = '#FDDCAE';
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.12)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = '#EDE8E0';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <span style={{ fontSize: 26, fontWeight: 800, color: '#EA580C' }}>
                                            {lang.native}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>
                                            {lang.label}
                                        </span>
                                        <span style={{ fontSize: 11, color: '#9B7B5A' }}>{lang.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Step 2: Exam selection ──────────────────────────────────────────────────── */
function ExamStep({ lang, defaultExam, onSelect, onBack }) {
    const [selected, setSelected] = useState(defaultExam || 'generic');
    const groups = [...new Set(ALL_EXAMS.map(e => e.group))];

    return (
        <div style={{
            minHeight: '100vh', background: '#F7F3EC',
            fontFamily: "'DM Sans','Inter',sans-serif",
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{
                background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)',
                borderBottom: '1.5px solid #EDE8E0', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 10,
                    background: '#FFFFFF', border: '1.5px solid #EDE8E0',
                    color: '#78350F', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                }}>
                    <IoArrowBackOutline size={16} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg,#F97316,#EA580C)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(249,115,22,0.30)',
                    }}>
                        <IoVideocamOutline size={18} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Video Learning</h1>
                        <p style={{ fontSize: 11, color: '#9B7B5A', margin: 0 }}>
                            Step 2 of 2 — Select Exam &nbsp;|&nbsp; Language: <strong>{lang === 'hi' ? 'Hindi' : 'English'}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px 40px', position: 'relative' }}>
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }} />
                <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
                        Select Your Exam
                    </h2>
                    <p style={{ fontSize: 13, color: '#9B7B5A', margin: '0 0 24px' }}>
                        Videos will be filtered for your selected exam target
                    </p>

                    {groups.map(group => (
                        <div key={group} style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: '#9B7B5A', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 8px' }}>
                                {group}
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                                {ALL_EXAMS.filter(e => e.group === group).map(exam => (
                                    <button
                                        key={exam.value}
                                        onClick={() => setSelected(exam.value)}
                                        style={{
                                            padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                                            background: selected === exam.value ? '#FFFFFF' : '#FFFAF5',
                                            border: selected === exam.value ? '1.5px solid #FDDCAE' : '1.5px solid #EDE8E0',
                                            color: selected === exam.value ? '#EA580C' : '#1A1A1A',
                                            fontWeight: selected === exam.value ? 700 : 500,
                                            fontSize: 13, textAlign: 'left',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            boxShadow: selected === exam.value ? '0 2px 10px rgba(249,115,22,0.12)' : 'none',
                                            transition: 'all 0.15s',
                                            fontFamily: "'DM Sans',sans-serif",
                                        }}
                                    >
                                        <span>{exam.label}</span>
                                        {selected === exam.value && (
                                            <IoCheckmarkCircleOutline size={16} color="#F97316" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => onSelect(selected)}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 14, marginTop: 8,
                            background: 'linear-gradient(135deg,#F97316,#EA580C)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 15, fontWeight: 800,
                            fontFamily: "'DM Sans',sans-serif",
                            boxShadow: '0 4px 20px rgba(249,115,22,0.30)',
                        }}
                    >
                        Start Watching Videos
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══ MAIN VIDEO SCREEN ═════════════════════════════════════════════════════ */
function VideoScreen({ lang, exam, onBack }) {
    const examObj   = ALL_EXAMS.find(e => e.value === exam) || ALL_EXAMS.at(-1);
    const examLabel = examObj.label;
    const chips     = EXAM_CHIPS[exam] || EXAM_CHIPS.generic;

    const [query,       setQuery]       = useState('');
    const [inputVal,    setInputVal]    = useState('');
    const [activeChip,  setActiveChip]  = useState('');
    const [videos,      setVideos]      = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPage,    setNextPage]    = useState(null);
    const [error,       setError]       = useState('');
    const [invalidSearch, setInvalidSearch] = useState(false);
    const [playerVid,   setPlayerVid]   = useState(null);
    const inputRef = useRef(null);

    const fetchVideos = useCallback(async (searchQ, pageToken = null) => {
        const isFirst = !pageToken;
        if (isFirst) { setLoading(true); setError(''); setVideos([]); setInvalidSearch(false); }
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams({ q: searchQ, exam, lang });
            if (pageToken) params.set('page', pageToken);
            const res  = await api.get(`/student/videos?${params}`);
            const data = res.data;
            if (isFirst) setVideos(data.videos || []);
            else setVideos(prev => [...prev, ...(data.videos || [])]);
            setNextPage(data.nextPageToken || null);
        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.invalidSearch) {
                setInvalidSearch(true);
                setVideos([]);
                setNextPage(null);
            } else {
                setError(err.response?.data?.message || 'Could not load videos. Please try again.');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [exam, lang]);

    useEffect(() => { fetchVideos(''); }, [fetchVideos]);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = inputVal.trim();
        setActiveChip(''); setQuery(q); fetchVideos(q);
    };
    const handleChip = (chip) => {
        setActiveChip(chip); setInputVal(chip); setQuery(chip); fetchVideos(chip);
    };
    const loadMore = () => { if (nextPage && !loadingMore) fetchVideos(query, nextPage); };

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setPlayerVid(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#F7F3EC', fontFamily: "'DM Sans','Inter',sans-serif", position: 'relative' }}>
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                backgroundSize: '28px 28px' }} />

            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)',
                borderBottom: '1.5px solid #EDE8E0', padding: '12px 16px',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={onBack} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
                        background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#78350F', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap',
                    }}>
                        <IoArrowBackOutline size={16} /> Change
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg,#F97316,#EA580C)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(249,115,22,0.30)',
                        }}>
                            <IoVideocamOutline size={18} color="#fff" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>Video Learning</h1>
                            <p style={{ fontSize: 11, color: '#9B7B5A', margin: 0 }}>
                                {examLabel} &nbsp;|&nbsp; {lang === 'hi' ? 'Hindi' : 'English'} &nbsp;|&nbsp; Study lectures only
                            </p>
                        </div>
                    </div>

                    {/* Language + Exam badges */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: 'rgba(249,115,22,0.10)', border: '1.5px solid rgba(249,115,22,0.20)', color: '#EA580C',
                        }}>
                            {lang === 'hi' ? 'हिंदी' : 'English'}
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#1A1A1A',
                        }}>
                            <IoSchoolOutline size={12} color="#EA580C" />
                            {examLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 40px', position: 'relative', zIndex: 1 }}>

                {/* Search bar */}
                <form onSubmit={handleSearch} style={{ marginBottom: 14 }}>
                    <div style={{
                        display: 'flex', gap: 10, background: '#FFFFFF',
                        border: `1.5px solid ${invalidSearch ? '#FCA5A5' : '#EDE8E0'}`,
                        borderRadius: 14, padding: '10px 14px',
                        boxShadow: invalidSearch ? '0 2px 12px rgba(239,68,68,0.08)' : '0 2px 12px rgba(180,120,60,0.07)',
                        alignItems: 'center', transition: 'border-color 0.2s',
                    }}>
                        <IoSearchOutline size={20} color={invalidSearch ? '#EF4444' : '#9B7B5A'} style={{ flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            value={inputVal}
                            onChange={e => { setInputVal(e.target.value); if (invalidSearch) setInvalidSearch(false); }}
                            placeholder={`Search ${examLabel} subjects... (e.g. History, Maths, Physics)`}
                            style={{
                                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                                fontSize: 14, color: '#1A1A1A', fontFamily: "'DM Sans',sans-serif",
                            }}
                        />
                        {inputVal && (
                            <button type="button" onClick={() => { setInputVal(''); setInvalidSearch(false); inputRef.current?.focus(); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                <IoCloseOutline size={18} color="#9B7B5A" />
                            </button>
                        )}
                        <button type="submit" style={{
                            padding: '7px 18px', borderRadius: 9,
                            background: 'linear-gradient(135deg,#F97316,#EA580C)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                            boxShadow: '0 2px 8px rgba(249,115,22,0.30)', whiteSpace: 'nowrap',
                        }}>
                            Search
                        </button>
                    </div>
                </form>

                {/* Subject chips */}
                <div style={{ marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {chips.map(chip => (
                        <button key={chip} onClick={() => handleChip(chip)} style={{
                            padding: '5px 12px', borderRadius: 20,
                            background: activeChip === chip ? '#FFFFFF' : '#F5F0EA',
                            border: activeChip === chip ? '1.5px solid #FDDCAE' : '1.5px solid #EDE8E0',
                            color: activeChip === chip ? '#EA580C' : '#786D62',
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s',
                        }}>
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Invalid search */}
                {invalidSearch && !loading && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '20px 22px', borderRadius: 16,
                        background: '#FFF7F7', border: '1.5px solid #FCA5A5',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.06)', marginBottom: 20,
                    }}>
                        <IoWarningOutline size={28} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>
                                Not a valid search
                            </p>
                            <p style={{ fontSize: 13, color: '#9B7B5A', margin: 0, lineHeight: 1.6 }}>
                                This page shows study lectures only. Please search a subject related to your exam —
                                for example: <strong style={{ color: '#EA580C' }}>History, Polity, Maths, Physics, Reasoning, Current Affairs</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} style={{ background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #EDE8E0', overflow: 'hidden' }}>
                                <div style={{ height: 148, background: 'linear-gradient(90deg,#F5F0EA,#EDE8E0,#F5F0EA)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                                <div style={{ padding: '12px 14px' }}>
                                    <div style={{ height: 12, borderRadius: 6, background: '#EDE8E0', marginBottom: 8 }} />
                                    <div style={{ height: 12, borderRadius: 6, background: '#F0EDE8', width: '70%' }} />
                                </div>
                            </div>
                        ))}
                        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #EDE8E0', boxShadow: '0 4px 20px rgba(180,120,60,0.07)' }}>
                        <IoVideocamOutline size={40} color="#FDDCAE" style={{ marginBottom: 12 }} />
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Could not load videos</p>
                        <p style={{ fontSize: 13, color: '#9B7B5A', marginBottom: 18 }}>{error}</p>
                        <button onClick={() => fetchVideos(query)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10,
                            background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', border: 'none',
                            cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
                        }}>
                            <IoRefreshOutline size={16} /> Retry
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && !invalidSearch && videos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #EDE8E0' }}>
                        <IoBookOutline size={44} color="#FDDCAE" style={{ marginBottom: 14 }} />
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>No videos found</p>
                        <p style={{ fontSize: 13, color: '#9B7B5A' }}>Try a different subject or select a chip above</p>
                    </div>
                )}

                {/* Video grid */}
                {!loading && videos.length > 0 && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                            {videos.map(vid => (
                                <VideoCard key={vid.id} vid={vid} onPlay={() => setPlayerVid(vid.id)} />
                            ))}
                        </div>
                        {nextPage && (
                            <div style={{ textAlign: 'center', marginTop: 28 }}>
                                <button onClick={loadMore} disabled={loadingMore} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7,
                                    padding: '11px 28px', borderRadius: 12,
                                    background: loadingMore ? '#F5F0EA' : '#FFFFFF',
                                    border: '1.5px solid #EDE8E0', color: '#786D62', fontSize: 13, fontWeight: 700,
                                    cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif",
                                }}>
                                    {loadingMore
                                        ? <><IoRefreshOutline size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</>
                                        : <><IoChevronDownOutline size={16} /> Load More</>}
                                </button>
                                <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Player modal */}
            {playerVid && (
                <div onClick={() => setPlayerVid(null)} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 860, background: '#1A1A1A',
                        borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IoPlayCircle size={20} color="#FF0000" />
                                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans',sans-serif" }}>
                                    Study Lecture
                                </span>
                            </div>
                            <button onClick={() => setPlayerVid(null)} style={{
                                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                                padding: '6px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center',
                            }}>
                                <IoCloseOutline size={18} />
                            </button>
                        </div>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${playerVid}?autoplay=1&rel=0`}
                                title="Study Lecture"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            />
                        </div>
                        <div style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <a href={`https://www.youtube.com/watch?v=${playerVid}`} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif" }}>
                                Open in YouTube
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── VideoCard ─────────────────────────────────────────────────────────────── */
function VideoCard({ vid, onPlay }) {
    const [hovered, setHovered] = useState(false);
    const dur  = parseDuration(vid.duration);
    const secs = vid.seconds || 0;

    return (
        <div
            onClick={onPlay}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#FFFFFF', borderRadius: 16,
                border: hovered ? '1.5px solid #FDDCAE' : '1.5px solid #EDE8E0',
                boxShadow: hovered ? '0 8px 28px rgba(249,115,22,0.11)' : '0 2px 10px rgba(180,120,60,0.06)',
                overflow: 'hidden', cursor: 'pointer',
                transition: 'all 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                display: 'flex', flexDirection: 'column',
            }}
        >
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#1A1A1A' }}>
                {vid.thumbnail ? (
                    <img src={vid.thumbnail} alt={vid.title} style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', opacity: hovered ? 0.85 : 1, transition: 'opacity 0.2s',
                    }} />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F0EA' }}>
                        <IoVideocamOutline size={36} color="#FDDCAE" />
                    </div>
                )}

                {/* Play overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.18s' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(249,115,22,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                        <IoPlayCircleOutline size={30} color="#fff" />
                    </div>
                </div>

                {/* Duration badge */}
                {dur && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans',sans-serif" }}>
                        <IoTimeOutline size={11} />
                        {dur}
                    </div>
                )}

                {/* Full Lecture badge for 60+ min */}
                {secs >= 3600 && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(249,115,22,0.92)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: "'DM Sans',sans-serif" }}>
                        Full Lecture
                    </div>
                )}
            </div>

            <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {vid.title}
                </p>
                <p style={{ fontSize: 11, color: '#EA580C', fontWeight: 600, margin: 0 }}>{vid.channel}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    {parseInt(vid.viewCount || 0) > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9B7B5A' }}>
                            <IoEyeOutline size={11} /> {fmtViews(vid.viewCount)}
                        </span>
                    )}
                    <span style={{ fontSize: 10, color: '#9B7B5A' }}>{fmtDate(vid.publishedAt)}</span>
                </div>
            </div>
        </div>
    );
}

/* ═══ ROOT COMPONENT — manages onboarding flow ══════════════════════════════ */
export default function VideoLearning() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // step: 'lang' | 'exam' | 'videos'
    const [step, setStep] = useState('lang');
    const [lang, setLang] = useState('hi');
    const [exam, setExam] = useState(user?.examTarget || 'generic');

    return (
        <>
            {step === 'lang' && (
                <LanguageStep
                    onSelect={(l) => { setLang(l); setStep('exam'); }}
                    onBack={() => navigate('/student')}
                />
            )}
            {step === 'exam' && (
                <ExamStep
                    lang={lang}
                    defaultExam={exam}
                    onSelect={(e) => { setExam(e); setStep('videos'); }}
                    onBack={() => setStep('lang')}
                />
            )}
            {step === 'videos' && (
                <VideoScreen
                    lang={lang}
                    exam={exam}
                    onBack={() => setStep('lang')}
                />
            )}
        </>
    );
}
