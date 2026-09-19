import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoChatbubblesOutline, IoPersonOutline,
    IoSearchOutline, IoTimeOutline, IoSparkles, IoTrashOutline,
    IoWarningOutline, IoChevronDown, IoClose, IoAlertCircle
} from 'react-icons/io5';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';

import katex from 'katex';
import 'katex/dist/katex.min.css';

const LANG_LABEL = { en: 'English', hi: 'हिंदी', hinglish: 'Hinglish' };

// ─── Mathematical LaTeX & Formula Renderer with KaTeX & Fallback ─────────────
function renderMath(rawExpr, isBlock = false, isDark = false) {
    if (!rawExpr) return null;
    let expr = String(rawExpr).trim();
    // Strip wrapping $, $$, \[, \], \(, \), or `
    if (expr.startsWith('`') && expr.endsWith('`')) expr = expr.slice(1, -1).trim();
    if (expr.startsWith('$$') && expr.endsWith('$$')) expr = expr.slice(2, -2).trim();
    else if (expr.startsWith('$') && expr.endsWith('$')) expr = expr.slice(1, -1).trim();
    else if (expr.startsWith('\\[') && expr.endsWith('\\]')) expr = expr.slice(2, -2).trim();
    else if (expr.startsWith('\\(') && expr.endsWith('\\)')) expr = expr.slice(2, -2).trim();

    const mathColor = isDark ? '#f8fafc' : '#0f172a';

    try {
        const html = katex.renderToString(expr, {
            displayMode: isBlock,
            throwOnError: false,
        });
        return (
            <span
                className="katex-rendered-math"
                style={{
                    display: isBlock ? 'block' : 'inline-block',
                    overflowX: 'auto',
                    maxWidth: '100%',
                    verticalAlign: isBlock ? 'baseline' : 'middle',
                    color: mathColor,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    } catch (e) {
        // Fallback for safety
        let cleaned = expr
            .replace(/\\rightarrow/g, ' → ')
            .replace(/\\leftarrow/g, ' ← ')
            .replace(/\\Rightarrow/g, ' ⇒ ')
            .replace(/\\times/g, ' × ')
            .replace(/\\div/g, ' ÷ ')
            .replace(/\\cdot/g, ' · ')
            .replace(/\\pm/g, ' ± ')
            .replace(/\\le/g, ' ≤ ')
            .replace(/\\ge/g, ' ≥ ')
            .replace(/\\neq/g, ' ≠ ')
            .replace(/\\approx/g, ' ≈ ')
            .replace(/\\infty/g, ' ∞ ')
            .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
            .replace(/\\sqrt/g, '√')
            .replace(/\\alpha/g, 'α')
            .replace(/\\beta/g, 'β')
            .replace(/\\gamma/g, 'γ')
            .replace(/\\theta/g, 'θ')
            .replace(/\\pi/g, 'π')
            .replace(/\\Delta/g, 'Δ')
            .replace(/\\sigma/g, 'σ')
            .replace(/\\lambda/g, 'λ')
            .replace(/\\mu/g, 'μ')
            .replace(/\\omega/g, 'ω')
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>')
            .replace(/\\mathit\{([^}]+)\}/g, '<i>$1</i>')
            .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
            .replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>')
            .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
            .replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>')
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

        return (
            <span
                style={{
                    fontFamily: 'KaTeX_Main, "Cambria Math", "Times New Roman", serif',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: mathColor,
                }}
                dangerouslySetInnerHTML={{ __html: cleaned }}
            />
        );
    }
}

function applyInline(text, isDark = false) {
    if (!text) return null;
    const parts = [];
    // Matches code blocks, bold, strike, links, display math $$, bracket math \[, \( \), and single $ math
    const re = /(`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\[([^\]]+)\]\(([^)]+)\)|\\\[[\s\S]+?\\\]|\$\$(?:[^$]|\$(?!\$))+?\$\$|\\\((.+?)\\\)|(?<!\\)\$([^\$\n]+?)(?<!\\)\$)/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
            parts.push(text.slice(last, m.index));
        }
        const s = m[0];
        if (s.startsWith('`')) {
            const inner = s.slice(1, -1);
            const isMath = inner.startsWith('$') || inner.includes('\\') || /[_^]\{/.test(inner) || /\\(mathbf|mathit|mathrm|frac|sqrt|cdot|vec|times|pm|alpha|beta|gamma|theta|pi|le|ge|neq|approx|sum|int)/.test(inner);
            if (isMath) {
                parts.push(<span key={m.index}>{renderMath(inner, false, isDark)}</span>);
            } else {
                parts.push(
                    <code
                        key={m.index}
                        style={{
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: '0.88em',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            color: isDark ? '#fb923c' : '#c2410c',
                            fontWeight: 600
                        }}
                    >
                        {inner}
                    </code>
                );
            }
        } else if (s.startsWith('**')) {
            parts.push(<strong key={m.index} style={{ fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>{s.slice(2, -2)}</strong>);
        } else if (s.startsWith('~~')) {
            parts.push(<del key={m.index} style={{ opacity: 0.7 }}>{s.slice(2, -2)}</del>);
        } else if (s.startsWith('[') && m[2] && m[3]) {
            parts.push(
                <a
                    key={m.index}
                    href={m[3]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#f97316', textDecoration: 'underline', fontWeight: 600 }}
                >
                    {m[2]}
                </a>
            );
        } else if (s.startsWith('$$') && s.endsWith('$$')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false, isDark)}</span>);
        } else if (s.startsWith('\\[') && s.endsWith('\\]')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false, isDark)}</span>);
        } else if (s.startsWith('\\(')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false, isDark)}</span>);
        } else if (s.startsWith('$') && s.endsWith('$')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(1, -1), false, isDark)}</span>);
        }
        last = m.index + s.length;
    }
    if (last < text.length) {
        parts.push(text.slice(last));
    }
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

const MarkdownRenderer = ({ text, isDark = false }) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

        // Universal Display LaTeX Math Block: $$ ... $$ or \[ ... \]
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('$$') || trimmedLine.startsWith('\\[')) {
            const isBracket = trimmedLine.startsWith('\\[');
            const closeMarker = isBracket ? '\\]' : '$$';

            // Check if closed on the same line and has math inside
            if (trimmedLine.length > 3 && trimmedLine.endsWith(closeMarker)) {
                const inner = trimmedLine.slice(2, -2).trim();
                if (inner) {
                    elements.push(
                        <div key={`m-s-${i}`} style={{ margin: '14px 0', padding: '14px 18px', borderRadius: 14, background: isDark ? '#141419' : '#FAF6F0', border: isDark ? '1px solid rgba(249,115,22,0.25)' : '1px solid #EDE8E0', color: isDark ? '#f8fafc' : '#0f172a', overflowX: 'auto', textAlign: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 1px 4px rgba(180,120,60,0.04)' }}>
                            {renderMath(inner, true, isDark)}
                        </div>
                    );
                    i++;
                    continue;
                }
            }

            // Multi-line math block
            const mathLines = [];
            const firstContent = trimmedLine.slice(2).trim();
            if (firstContent && !firstContent.endsWith(closeMarker)) mathLines.push(firstContent);
            i++;
            while (i < lines.length && !lines[i].includes(closeMarker)) {
                mathLines.push(lines[i]);
                i++;
            }
            if (i < lines.length) {
                const closingLine = lines[i];
                const closeIdx = closingLine.indexOf(closeMarker);
                const beforeClose = closingLine.slice(0, closeIdx).trim();
                if (beforeClose) mathLines.push(beforeClose);
                i++;
            }
            elements.push(
                <div key={`m-m-${i}`} style={{ margin: '16px 0', padding: '16px 20px', borderRadius: 14, background: isDark ? '#141419' : '#FAF6F0', border: isDark ? '1px solid rgba(249,115,22,0.25)' : '1px solid #EDE8E0', color: isDark ? '#f8fafc' : '#0f172a', overflowX: 'auto', textAlign: 'center', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(180,120,60,0.06)' }}>
                    {renderMath(mathLines.join('\n'), true, isDark)}
                </div>
            );
            continue;
        }

        // Markdown Table: lines starting with |
        if (line.trim().startsWith('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i].trim());
                i++;
            }
            if (tableLines.length >= 2) {
                const parseRow = r => r.split('|').slice(1, -1).map(c => c.trim());
                const header = parseRow(tableLines[0]);
                const bodyRows = tableLines.slice(1)
                    .filter(r => !/^[|\s:-]+$/.test(r))
                    .map(parseRow);

                elements.push(
                    <div key={`t-${i}`} style={{ margin: '16px 0', borderRadius: 14, overflow: 'hidden', border: isDark ? '1px solid #27272a' : '1px solid #EDE8E0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', maxWidth: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: isDark ? '#18181b' : '#FAF6F0', borderBottom: isDark ? '1px solid #27272a' : '1px solid #EDE8E0' }}>
                                    {header.map((h, hIdx) => (
                                        <th key={hIdx} style={{ padding: '10px 14px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                                            {applyInline(h, isDark)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? (isDark ? '#121215' : '#FAF6F0') : 'transparent', borderBottom: rIdx < bodyRows.length - 1 ? (isDark ? '1px solid #27272a' : '1px solid #f1f5f9') : 'none' }}>
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} style={{ padding: '10px 14px', color: isDark ? '#d4d4d8' : '#334155' }}>
                                                {applyInline(cell, isDark)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            }
        }

        // Code block: ```lang
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <div key={`c-${i}`} style={{ margin: '16px 0', borderRadius: 14, overflow: 'hidden', background: isDark ? '#121215' : '#1e293b', border: isDark ? '1px solid #27272a' : '1px solid rgba(0,0,0,0.1)' }}>
                    {lang && <div style={{ padding: '6px 14px', fontSize: 11, fontFamily: 'monospace', color: '#f97316', borderBottom: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang}</div>}
                    <pre style={{ padding: 16, fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', color: '#e2e8f0', overflowX: 'auto', lineHeight: 1.65, margin: 0 }}>{codeLines.join('\n')}</pre>
                </div>
            );
            i++;
            continue;
        }

        // Blockquote / Callout tip
        if (line.startsWith('> ') || line.startsWith('>')) {
            const quoteText = line.replace(/^>\s*/, '');
            elements.push(
                <div key={`q-${i}`} style={{ margin: '14px 0', padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed', borderLeft: '4px solid #f97316', color: isDark ? '#fed7aa' : '#9a3412', fontSize: 14.5, lineHeight: 1.6, fontWeight: 500 }}>
                    {applyInline(quoteText, isDark)}
                </div>
            );
            i++;
            continue;
        }

        // Headings (# h1, ## h2, ### h3, #### h4)
        if (/^#{1,4}\s/.test(line)) {
            const level = line.match(/^(#{1,4})\s/)[1].length;
            const hText = line.replace(/^#{1,4}\s/, '');
            const fontSize = level === 1 ? 20 : level === 2 ? 17 : level === 3 ? 15.5 : 14.5;
            elements.push(
                <div key={`h-${i}`} style={{ marginTop: 20, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 4, height: level === 1 ? 22 : 18, borderRadius: 2, background: '#f97316', flexShrink: 0 }} />
                    <h3 style={{ fontSize, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
                        {applyInline(hText, isDark)}
                    </h3>
                </div>
            );
            i++;
            continue;
        }

        // Numbered Steps — Structured Step Cards
        if (/^\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <div key={`ol-${i}`} style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 12, background: isDark ? '#18181b' : '#FAF6F0', border: isDark ? '1px solid #27272a' : '1px solid #EDE8E0', alignItems: 'flex-start' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: isDark ? '#27272a' : '#fff7ed', border: '1.5px solid #f97316', color: '#ea580c', fontWeight: 800, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                {idx + 1}
                            </span>
                            <span style={{ fontSize: 14.5, color: isDark ? '#e4e4e7' : '#0f172a', lineHeight: 1.65, flex: 1 }}>
                                {applyInline(it, isDark)}
                            </span>
                        </div>
                    ))}
                </div>
            );
            continue;
        }

        // Bullet Lists with generous spacing
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
            const items = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || lines[i].startsWith('• '))) {
                items.push(lines[i].replace(/^[-*•]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} style={{ margin: '10px 0', paddingLeft: 4, listStyle: 'none' }}>
                    {items.map((it, idx) => (
                        <li key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14.5, color: isDark ? '#d4d4d8' : '#0f172a', lineHeight: 1.7, alignItems: 'flex-start' }}>
                            <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: '#f97316', marginTop: 8 }} />
                            <span>{applyInline(it, isDark)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Clear, readable paragraphs
        elements.push(
            <p key={`p-${i}`} style={{ fontSize: 15, lineHeight: 1.75, color: isDark ? '#e4e4e7' : '#0f172a', margin: '6px 0 10px' }}>
                {applyInline(line, isDark)}
            </p>
        );
        i++;
    }

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#EDE8E0]"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shrink-0">
                    <IoAlertCircle size={20} />
                </div>
                <p className="text-stone-900 font-bold text-sm leading-snug">{message}</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel}
                    className="flex-1 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 font-bold rounded-xl text-xs shadow-2xs transition-all cursor-pointer">
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer">
                    Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
);

const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-5 w-9 rounded-full transition-all flex-shrink-0 cursor-pointer"
        style={{ background: checked ? '#F97316' : '#E2DBD2' }}>
        <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
const StudentChatHistory = ({ embedded = false }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [selected, setSelected] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loadingSess, setLS]    = useState(false);
    const [activeSession, setActiveSession] = useState(null); // { sessionId, messages, title, lang }
    const [confirm, setConfirm]   = useState(null); // { type: 'one'|'all', sessionId? }
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast]       = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        api.get(`/admin/chat-history?showInactive=${showInactive}`)
            .then(r => {
                const fetched = r.data.students || [];
                setStudents(fetched);
                if (selected && !fetched.some(s => s._id === selected._id)) {
                    setSelected(null);
                    setSessions([]);
                    setActiveSession(null);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [showInactive]);

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
            await api.delete(`/admin/chat-history/${studentId}/${encodeURIComponent(sessionId)}`);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            if (activeSession?.sessionId === sessionId) setActiveSession(null);
            // Update count in students list
            setStudents(prev => prev.map(s => String(s._id) === String(studentId)
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
            setStudents(prev => prev.filter(s => String(s._id) !== String(studentId)));
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
        <div className={`flex overflow-hidden bg-[#FAF6F0] ${embedded ? 'h-[640px] rounded-2xl border border-[#EDE8E0] shadow-sm' : 'h-screen'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                .katex, .katex-display, .katex-html, .katex-rendered-math, .katex * {
                    font-family: KaTeX_Main, KaTeX_Math, 'Times New Roman', serif !important;
                }
                .katex-display {
                    margin: 0.5em 0 !important;
                    text-align: center !important;
                }
            `}</style>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border ${
                            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
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

            {/* ── LEFT PANEL: Student List (250px) ── */}
            <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-[#EDE8E0] h-full shadow-2xs">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-3 h-14 border-b border-[#EDE8E0] flex-shrink-0">
                    {!embedded && (
                        <Link to="/admin" className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#FAF6F0] border border-transparent hover:border-[#EDE8E0] transition-all">
                            <IoArrowBack size={16} />
                        </Link>
                    )}
                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                        <IoChatbubblesOutline size={14} />
                    </div>
                    <span className="text-stone-900 font-bold text-xs flex-1 truncate uppercase tracking-wider">Chat History</span>
                </div>
                {/* Search */}
                <div className="px-3 pt-3 pb-2 space-y-2">
                    <div className="relative">
                        <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search students…"
                            className="w-full bg-[#FAF6F0] border border-[#E2DBD2] text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 placeholder-stone-400 font-medium" />
                    </div>
                    {/* Show Inactive Toggle */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#FAF6F0] rounded-xl border border-[#EDE8E0]">
                        <span className="text-[10px] font-bold text-stone-600 select-none">Show Inactive</span>
                        <Toggle checked={showInactive} onChange={setShowInactive} />
                    </div>
                </div>
                {/* Student list */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {loading && <div className="flex justify-center pt-8"><div className="w-5 h-5 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" /></div>}
                    {!loading && filtered.length === 0 && <p className="text-center text-stone-400 text-xs py-8">No sessions recorded</p>}
                    {filtered.map(s => (
                        <button key={s._id} onClick={() => loadStudent(s)}
                            className={`w-full text-left px-2.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                                selected?._id === s._id
                                    ? 'bg-orange-50/90 border border-orange-200 shadow-2xs'
                                    : 'hover:bg-[#FAF6F0] border border-transparent'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-100/50 border border-orange-200/60 flex items-center justify-center text-orange-600 text-[10px] font-black overflow-hidden flex-shrink-0">
                                    <img
                                        src={(() => {
                                            const img = (!s.profileImage || s.profileImage === '/uploads/avatars/avatar1.svg')
                                                ? getDeterministicAvatar(s._id, s.gender)
                                                : s.profileImage;
                                            return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                        })()}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-stone-900 text-xs font-bold truncate flex items-center gap-1.5">
                                        <span className="truncate">{s.name}</span>
                                        {s.isActive === false && (
                                            <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0 uppercase">
                                                Inactive
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-stone-400 text-[10px] font-medium">{s.sessionCount} session{s.sessionCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            {/* ── MIDDLE PANEL: Session List ── */}
            <div className="w-68 flex-shrink-0 flex flex-col bg-white border-r border-[#EDE8E0] h-full shadow-2xs">
                {!selected ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center mb-3 text-orange-600">
                            <IoPersonOutline size={22} />
                        </div>
                        <p className="text-stone-800 font-bold text-sm">Select a student</p>
                        <p className="text-stone-400 text-xs mt-1">to view their chat sessions</p>
                    </div>
                ) : (
                    <>
                        {/* Student header */}
                        <div className="px-3.5 h-14 border-b border-[#EDE8E0] bg-[#FAF6F0] flex items-center gap-2.5 flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg bg-orange-100/60 border border-orange-200 flex items-center justify-center text-orange-600 text-[10px] font-black overflow-hidden flex-shrink-0">
                                <img
                                    src={(() => {
                                        const img = (!selected.profileImage || selected.profileImage === '/uploads/avatars/avatar1.svg')
                                            ? getDeterministicAvatar(selected._id, selected.gender)
                                            : selected.profileImage;
                                        return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                    })()}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-stone-900 text-xs font-bold truncate flex items-center gap-1.5">
                                    <span className="truncate">{selected.name}</span>
                                    {selected.isActive === false && (
                                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0 uppercase">
                                            Inactive
                                        </span>
                                    )}
                                </p>
                                <p className="text-stone-400 text-[10px] font-medium">{sessions.length} sessions</p>
                            </div>
                            {sessions.length > 0 && (
                                <button
                                    onClick={() => setConfirm({ type: 'all' })}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex-shrink-0 cursor-pointer"
                                    title="Delete all sessions"
                                    disabled={deleting}
                                >
                                    <IoTrashOutline size={15} />
                                </button>
                            )}
                        </div>
                        {/* Sessions */}
                        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-1.5">
                            {loadingSess && <div className="flex justify-center pt-8"><div className="w-5 h-5 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" /></div>}
                            {!loadingSess && sessions.length === 0 && (
                                <p className="text-center text-stone-400 text-xs py-8">No sessions found</p>
                            )}
                            {sessions.map(sess => (
                                <div key={sess.sessionId}
                                    className={`group relative rounded-xl border transition-all cursor-pointer ${
                                        activeSession?.sessionId === sess.sessionId
                                            ? 'bg-orange-50/90 border-orange-300 shadow-2xs'
                                            : 'bg-white border-[#EDE8E0] hover:border-orange-200 hover:bg-[#FAF6F0]'
                                    }`}>
                                    <button
                                        onClick={() => setActiveSession(sess)}
                                        className="w-full text-left px-3 py-2.5 cursor-pointer"
                                    >
                                        <div className="flex items-start gap-2">
                                            <IoSparkles size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-stone-900 text-xs font-bold truncate leading-snug">{sess.title || 'Untitled'}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <span className="text-stone-400 text-[9px] flex items-center gap-0.5 font-medium">
                                                        <IoTimeOutline size={9} />{fmt(sess.lastActive)}
                                                    </span>
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-orange-100/50 border border-orange-200/60 text-orange-700 font-bold">
                                                        {LANG_LABEL[sess.lang] || sess.lang}
                                                    </span>
                                                    <span className="text-stone-400 text-[9px] font-medium">{sess.messages?.length || 0} msg</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    {/* Delete button — appears on hover */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'one', sessionId: sess.sessionId }); }}
                                        className="absolute top-2 right-2 p-1 rounded-lg text-stone-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                        title="Delete session"
                                        disabled={deleting}
                                    >
                                        <IoClose size={14} />
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
                <div className="h-14 border-b border-[#EDE8E0] bg-white px-5 flex items-center gap-3 flex-shrink-0 shadow-2xs">
                    {activeSession ? (
                        <>
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                                <IoSparkles size={14} />
                            </div>
                            <span className="text-stone-900 font-bold text-sm flex-1 truncate">{activeSession.title || 'Untitled'}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold">
                                {LANG_LABEL[activeSession.lang] || activeSession.lang}
                            </span>
                            <span className="text-xs text-stone-400 font-medium">{activeSession.messages?.length || 0} messages</span>
                            <button
                                onClick={() => setConfirm({ type: 'one', sessionId: activeSession.sessionId })}
                                className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete this session"
                                disabled={deleting}
                            >
                                <IoTrashOutline size={16} />
                            </button>
                        </>
                    ) : (
                        <span className="text-stone-400 text-xs font-medium">Select a session to view the chat conversation</span>
                    )}
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.06) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}>
                    {!activeSession && !selected && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center mb-4 text-orange-600">
                                <IoChatbubblesOutline size={28} />
                            </div>
                            <p className="text-stone-800 font-bold text-base mb-1">AI Doubt Board — Admin View</p>
                            <p className="text-stone-400 text-xs">Select a student, then choose a session to inspect their AI conversation</p>
                        </div>
                    )}

                    {!activeSession && selected && !loadingSess && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center mb-3 text-orange-600">
                                <IoSparkles size={20} />
                            </div>
                            <p className="text-stone-800 font-bold text-sm">Pick a session</p>
                            <p className="text-stone-400 text-xs mt-1">from the list in the middle column</p>
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
                                        /* User bubble — right aligned, warm orange gradient */
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-2xl rounded-tr-xs px-4 py-3 text-sm text-white font-medium bg-gradient-to-r from-orange-500 to-amber-600 shadow-xs leading-relaxed">
                                                {applyInline(msg.text, false)}
                                            </div>
                                        </div>
                                    ) : msg.role === 'error' ? (
                                        /* Error bubble */
                                        <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                                            <IoWarningOutline size={16} className="flex-shrink-0 mt-0.5" />
                                            {msg.text}
                                        </div>
                                    ) : (
                                        /* AI answer bubble — warm card */
                                        <div className="rounded-2xl rounded-tl-xs px-5 py-4 border border-[#EDE8E0] bg-white shadow-xs">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-orange-50 border border-orange-200/60 text-orange-600">
                                                    <IoSparkles size={12} />
                                                </div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Groq AI Assistant</span>
                                            </div>
                                            <MarkdownRenderer text={msg.text} isDark={false} />
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
