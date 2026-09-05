import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSparkles, IoArrowUp, IoMic, IoClose, IoAdd, IoMenu,
    IoLanguageOutline, IoCopyOutline, IoRefreshOutline, IoTrashOutline,
    IoSunnyOutline, IoMoonOutline, IoPinOutline, IoChatbubbleOutline,
    IoSearchOutline, IoEllipsisVertical, IoArrowBackOutline, IoCheckmarkOutline,
    IoPlayCircleOutline, IoFlashOutline, IoLockClosed, IoLockClosedOutline,
    IoScan, IoCameraOutline, IoKeypadOutline, IoLogInOutline, IoLogOutOutline,
    IoInformationCircleOutline, IoTimerOutline, IoCloseOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import AttendanceScanner from '../../components/student/AttendanceScanner';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const STORAGE_KEY = 'doubtboard_v2_sessions';
const MAX_SESSIONS = 40;

const PROMPT_DEMOS = {
    en: [
        { tag: 'Science', q: "Explain Newton's third law with everyday examples", hint: 'Physics concepts & real-world applications' },
        { tag: 'Mathematics', q: 'How do I solve quadratic equations using the discriminant formula?', hint: 'Step-by-step mathematical proofs & formulas' },
        { tag: 'History & Polity', q: 'Summarize the primary causes and consequences of the 1857 Indian Revolt', hint: 'Historical events, key personalities & dates' },
        { tag: 'Economics', q: 'What is Gross Domestic Product (GDP) and how is it measured in India?', hint: 'Current affairs, economy & government policies' },
        { tag: 'Chemistry', q: 'How to balance chemical equations with easy tricks?', hint: 'Equations, periodic table & reactions' },
    ],
    hi: [
        { tag: 'विज्ञान', q: 'न्यूटन के तीसरे नियम को दैनिक जीवन के उदाहरणों से समझाएं', hint: 'भौतिक विज्ञान के सिद्धांत एवं अनुप्रयोग' },
        { tag: 'गणित', q: 'द्विघात समीकरण को विविक्तकर सूत्र से कैसे हल करें?', hint: 'चरणबद्ध गणितीय सूत्र एवं प्रमाण' },
        { tag: 'इतिहास', q: '1857 के प्रथम स्वतंत्रता संग्राम के मुख्य कारण और परिणाम बताएं', hint: 'ऐतिहासिक घटनाएं, तिथियां एवं व्यक्तित्व' },
        { tag: 'अर्थव्यवस्था', q: 'सकल घरेलू उत्पाद (GDP) क्या है और भारत में इसकी गणना कैसे होती है?', hint: 'समसामयिकी, अर्थव्यवस्था एवं नीतियां' },
        { tag: 'रसायन विज्ञान', q: 'रासायनिक समीकरणों को संतुलित करने की आसान ट्रिक क्या है?', hint: 'समीकरण, आवर्त सारणी एवं अभिक्रियाएं' },
    ],
    hinglish: [
        { tag: 'Science', q: "Newton ke third law ko daily life examples ke sath explain karo", hint: 'Physics concepts aur practical applications' },
        { tag: 'Mathematics', q: 'Quadratic equations ko discriminant formula se kaise solve karte hain?', hint: 'Step-by-step mathematical tricks aur formulas' },
        { tag: 'History & Polity', q: '1857 Revolt ke main causes aur consequences kya the?', hint: 'Historic events, dates aur freedom movement' },
        { tag: 'Economics', q: 'GDP kya hota hai aur India me iski calculation kaise ki jaati hai?', hint: 'Current affairs aur Indian economy insights' },
        { tag: 'Chemistry', q: 'Chemical equations ko balance karne ki best short trick batao', hint: 'Reactions, formulas aur periodic table' },
    ],
};

const TYPEWRITER_PROMPTS = {
    en: [
        'Ask anything...',
        "Ask: Explain Newton's laws of motion...",
        'Ask: How to solve quadratic equations easily...',
        'Ask: Key causes of the 1857 Indian Revolt...',
        'Ask: What is GDP and how is it calculated...',
        'Ask: How to balance chemical equations...',
        'Ask any doubt in Science, Maths, or History...'
    ],
    hi: [
        'कुछ भी पूछें...',
        'पूछें: न्यूटन के गति के नियम क्या हैं...',
        'पूछें: द्विघात समीकरण हल करने की आसान विधि...',
        'पूछें: 1857 की क्रांति के मुख्य कारण क्या थे...',
        'पूछें: GDP की गणना कैसे की जाती है...',
        'पूछें: रासायनिक समीकरण कैसे संतुलित करें...',
        'कोई भी प्रश्न, सिद्धांत या फ़ॉर्मूला पूछें...'
    ],
    hinglish: [
        'Kuch bhi pucho...',
        'Pucho: Newton ke 3 laws simple example ke sath...',
        'Pucho: Quadratic equation solve karne ka formula...',
        'Pucho: 1857 Revolt ke main reasons kya the...',
        'Pucho: GDP kya hota hai aur kaise calculate hota hai...',
        'Pucho: Chemical equations balance karne ki easy trick...',
        'Kisi bhi subject ka formula ya concept pucho...'
    ]
};

const T = {
    en: {
        greetingPrefix: 'Hello, ',
        tagline: 'What would you like to explore today?',
        placeholderLimit: 'Daily credit limit reached. Resets at midnight.',
        credits: 'credits left',
        noCreditsTitle: 'No Credits Remaining',
        noCreditsSub: 'Your daily credits are finished. Chat and voice queries are locked until midnight.',
        chatLocked: 'Chat locked · No credits left',
        voiceLocked: 'Voice search is locked (0 credits left)',
        newChat: 'New chat',
        history: 'Chat history',
        search: 'Search chats',
        noChats: 'No chats yet',
        thinking: 'Apna Lakshay AI is generating answer...',
        copy: 'Copy',
        copied: 'Copied',
        regenerate: 'Retry',
        listening: 'Listening to your voice...',
        voiceTap: 'Tap to send',
        cancel: 'Cancel',
        selectLang: 'Choose language',
        langSub: 'Responses will match your selection',
        demoHeader: 'Interactive Demo: See how to ask',
        demoSub: 'Watch how you can ask any question, formula or concept',
        tryThis: 'Try this question',
    },
    hi: {
        greetingPrefix: 'नमस्ते, ',
        tagline: 'आज आप क्या समझना चाहते हैं?',
        placeholderLimit: 'आज की दैनिक सीमा समाप्त। कल पुनः आएं।',
        credits: 'क्रेडिट शेष',
        noCreditsTitle: 'क्रेडिट समाप्त हो गया',
        noCreditsSub: 'आपके आज के सभी क्रेडिट समाप्त हो चुके हैं। चैट और वॉइस लॉक हैं (रात 12 बजे रीसेट होगा)।',
        chatLocked: 'चैट लॉक है · क्रेडिट समाप्त',
        voiceLocked: 'वॉइस सर्च लॉक है (0 क्रेडिट शेष)',
        newChat: 'नई बातचीत',
        history: 'इतिहास',
        search: 'खोजें',
        noChats: 'कोई चैट नहीं',
        thinking: 'उत्तर तैयार किया जा रहा है...',
        copy: 'कॉपी',
        copied: 'कॉपी हुआ',
        regenerate: 'फिर से',
        listening: 'आपकी आवाज़ सुनी जा रही है...',
        voiceTap: 'भेजने के लिए टैप करें',
        cancel: 'रद्द करें',
        selectLang: 'भाषा चुनें',
        langSub: 'सभी उत्तर आपकी भाषा में मिलेंगे',
        demoHeader: 'डेमो: पूछने का सरल तरीका देखें',
        demoSub: 'देखें कि आप कोई भी प्रश्न या फ़ॉर्मूला कैसे पूछ सकते हैं',
        tryThis: 'यह प्रश्न पूछें',
    },
    hinglish: {
        greetingPrefix: 'Hello, ',
        tagline: 'Aaj kaun sa topic samajhna chahte ho?',
        placeholderLimit: 'Daily limit over ho gaya. Kal try karein.',
        credits: 'credits bache hain',
        noCreditsTitle: 'No Credits Left',
        noCreditsSub: 'Aaj ke credits khatam ho gaye hain. Chat aur voice dono locked hain (midnight ko reset hoga).',
        chatLocked: 'Chat locked · No credits left',
        voiceLocked: 'Voice locked hai (0 credits bache hain)',
        newChat: 'Nayi chat',
        history: 'Chat history',
        search: 'Search chats',
        noChats: 'Koi chat nahi hai',
        thinking: 'AI analyze kar raha hai...',
        copy: 'Copy',
        copied: 'Copied',
        regenerate: 'Retry',
        listening: 'Sun raha hoon...',
        voiceTap: 'Send karne ke liye tap karein',
        cancel: 'Cancel',
        selectLang: 'Language choose karein',
        langSub: 'Responses aapki bhasha me aayenge',
        demoHeader: 'Live Demo: Kaise puchen doubt',
        demoSub: 'Kisi bhi subject ka formula ya concept asani se pucho',
        tryThis: 'Yeh question pucho',
    },
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const loadSessions = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const saveSessions = s => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
const autoTitle = q => { const t = q.trim().replace(/\s+/g, ' '); return t.length <= 32 ? t : t.slice(0, 30) + '...'; };
const isToday = ts => new Date(ts).toDateString() === new Date().toDateString();

// Dynamic Credit Color Gauge: High (Green) -> Moderate (Amber) -> Low (Red)
const getCreditGauge = (credits, max = 10) => {
    const ratio = Math.max(0, Math.min(1, credits / max));
    if (ratio >= 0.7) {
        return {
            color: '#16a34a',
            bg: '#ecfdf5',
            border: '#bbf7d0',
            dot: '#22c55e',
            label: 'Healthy quota',
        };
    }
    if (ratio >= 0.4) {
        return {
            color: '#d97706',
            bg: '#fffbeb',
            border: '#fde68a',
            dot: '#f59e0b',
            label: 'Moderate',
        };
    }
    return {
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        dot: '#ef4444',
        label: 'Low quota',
    };
};

// Infinite Left-to-Right Animated Typewriter Hook
const useTypewriter = (prompts, typingSpeed = 50, deletingSpeed = 25, pauseTime = 1600) => {
    const [displayedText, setDisplayedText] = useState('');
    const [promptIndex, setPromptIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentFull = prompts[promptIndex % prompts.length];

        let timeout;
        if (!isDeleting) {
            if (displayedText.length < currentFull.length) {
                timeout = setTimeout(() => {
                    setDisplayedText(currentFull.slice(0, displayedText.length + 1));
                }, typingSpeed);
            } else {
                timeout = setTimeout(() => {
                    setIsDeleting(true);
                }, pauseTime);
            }
        } else {
            if (displayedText.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayedText(currentFull.slice(0, displayedText.length - 1));
                }, deletingSpeed);
            } else {
                setIsDeleting(false);
                setPromptIndex(prev => (prev + 1) % prompts.length);
            }
        }

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, promptIndex, prompts, typingSpeed, deletingSpeed, pauseTime]);

    return displayedText;
};

// Mathematical LaTeX & Formula Renderer with KaTeX & Robust Universal Fallback
function renderMath(rawExpr, isBlock = false) {
    if (!rawExpr) return null;
    let expr = String(rawExpr).trim();
    // Strip wrapping $, $$, \[, \], \(, \), or `
    if (expr.startsWith('`') && expr.endsWith('`')) expr = expr.slice(1, -1).trim();
    if (expr.startsWith('$$') && expr.endsWith('$$')) expr = expr.slice(2, -2).trim();
    else if (expr.startsWith('$') && expr.endsWith('$')) expr = expr.slice(1, -1).trim();
    else if (expr.startsWith('\\[') && expr.endsWith('\\]')) expr = expr.slice(2, -2).trim();
    else if (expr.startsWith('\\(') && expr.endsWith('\\)')) expr = expr.slice(2, -2).trim();

    try {
        const html = katex.renderToString(expr, {
            displayMode: isBlock,
            throwOnError: false,
        });
        return <span className="katex-rendered-math" dangerouslySetInnerHTML={{ __html: html }} />;
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

        return <span style={{ fontFamily: 'KaTeX_Main, "Cambria Math", "Times New Roman", serif', fontWeight: 600, letterSpacing: '0.02em' }} dangerouslySetInnerHTML={{ __html: cleaned }} />;
    }
}

function applyInline(text, isDark) {
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
            // If the code block contains LaTeX math (like $\mathbf{F}...$, \mathbf, \frac, \sqrt, _, ^, \vec, etc.), render as KaTeX math!
            const isMath = inner.startsWith('$') || inner.includes('\\') || /[_^]\{/.test(inner) || /\\(mathbf|mathit|mathrm|frac|sqrt|cdot|vec|times|pm|alpha|beta|gamma|theta|pi|le|ge|neq|approx|sum|int)/.test(inner);
            if (isMath) {
                parts.push(<span key={m.index}>{renderMath(inner, false)}</span>);
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
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false)}</span>);
        } else if (s.startsWith('\\[') && s.endsWith('\\]')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false)}</span>);
        } else if (s.startsWith('\\(')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(2, -2), false)}</span>);
        } else if (s.startsWith('$') && s.endsWith('$')) {
            parts.push(<span key={m.index}>{renderMath(s.slice(1, -1), false)}</span>);
        }
        last = m.index + s.length;
    }
    if (last < text.length) {
        parts.push(text.slice(last));
    }
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

const MarkdownRenderer = ({ text, isDark }) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }

        // Multi-line LaTeX Math Block: \[ ... \] or $$ ... $$
        if (line.trim() === '\\[' || line.trim() === '$$') {
            const endToken = line.trim() === '\\[' ? '\\]' : '$$';
            const mathLines = [];
            i++;
            while (i < lines.length && lines[i].trim() !== endToken) {
                mathLines.push(lines[i]);
                i++;
            }
            elements.push(
                <div key={`m-${i}`} style={{ margin: '16px 0', padding: '16px 20px', borderRadius: 14, background: isDark ? '#141419' : '#fffaf5', border: isDark ? '1px solid rgba(249,115,22,0.25)' : '1px solid #fed7aa', overflowX: 'auto', textAlign: 'center', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(249,115,22,0.06)' }}>
                    {renderMath(mathLines.join('\n'), true)}
                </div>
            );
            i++;
            continue;
        }

        // Single-line Math Block: \[ eq \] or $$ eq $$
        if (/^\\\[[\s\S]+?\\\]$/.test(line.trim())) {
            const mathContent = line.trim().slice(2, -2);
            elements.push(
                <div key={`m-s-${i}`} style={{ margin: '14px 0', padding: '14px 18px', borderRadius: 14, background: isDark ? '#141419' : '#fffaf5', border: isDark ? '1px solid rgba(249,115,22,0.25)' : '1px solid #fed7aa', overflowX: 'auto', textAlign: 'center' }}>
                    {renderMath(mathContent, true)}
                </div>
            );
            i++;
            continue;
        }
        if (/^\$\$[\s\S]+?\$\$$/.test(line.trim())) {
            const mathContent = line.trim().slice(2, -2);
            elements.push(
                <div key={`m-d-${i}`} style={{ margin: '14px 0', padding: '14px 18px', borderRadius: 14, background: isDark ? '#141419' : '#fffaf5', border: isDark ? '1px solid rgba(249,115,22,0.25)' : '1px solid #fed7aa', overflowX: 'auto', textAlign: 'center' }}>
                    {renderMath(mathContent, true)}
                </div>
            );
            i++;
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
                    <div key={`t-${i}`} style={{ margin: '16px 0', borderRadius: 14, overflow: 'hidden', border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', maxWidth: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: isDark ? '#18181b' : '#f8fafc', borderBottom: isDark ? '1px solid #27272a' : '1px solid #e2e8f0' }}>
                                    {header.map((h, hIdx) => (
                                        <th key={hIdx} style={{ padding: '10px 14px', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                                            {applyInline(h, isDark)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bodyRows.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? (isDark ? '#121215' : '#fafafa') : 'transparent', borderBottom: rIdx < bodyRows.length - 1 ? (isDark ? '1px solid #27272a' : '1px solid #f1f5f9') : 'none' }}>
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
                        <div key={idx} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 12, background: isDark ? '#18181b' : '#f8fafc', border: isDark ? '1px solid #27272a' : '1px solid #eef2f6', alignItems: 'flex-start' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: isDark ? '#27272a' : '#ffffff', border: '1.5px solid #f97316', color: '#ea580c', fontWeight: 800, fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                {idx + 1}
                            </span>
                            <span style={{ fontSize: 14.5, color: isDark ? '#e4e4e7' : '#1e293b', lineHeight: 1.65, flex: 1 }}>
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
                        <li key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14.5, color: isDark ? '#d4d4d8' : '#334155', lineHeight: 1.7, alignItems: 'flex-start' }}>
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
            <p key={`p-${i}`} style={{ fontSize: 15, lineHeight: 1.75, color: isDark ? '#e4e4e7' : '#334155', margin: '6px 0 10px' }}>
                {applyInline(line, isDark)}
            </p>
        );
        i++;
    }

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{elements}</div>;
};

// Gemini-style Live Audio Overlay
const GeminiAudioOverlay = ({ transcript, onStop, onCancel, t, isDark }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: isDark ? 'rgba(9, 9, 11, 0.82)' : 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '48px 24px 60px',
            }}
        >
            <style>{`
                @keyframes geminiWave {
                    0%, 100% { height: 16px; transform: scaleY(0.7); }
                    50% { height: 72px; transform: scaleY(1.3); }
                }
                @keyframes geminiPulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.16); opacity: 1; }
                }
            `}</style>

            <div style={{ width: '100%', maxWidth: 520, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onCancel}
                    style={{ width: 42, height: 42, borderRadius: '50%', background: isDark ? '#27272a' : '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#fff' : '#0f172a' }}
                >
                    <IoClose size={22} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 520, width: '100%', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                    <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.4), rgba(239,68,68,0.2), transparent 70%)', filter: 'blur(16px)', animation: 'geminiPulse 2.5s infinite ease-in-out' }} />
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b2b, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 36px rgba(255,107,43,0.4)' }}>
                        <IoMic size={42} color="#ffffff" />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 80, marginBottom: 28 }}>
                    {[0.1, 0.4, 0.2, 0.6, 0.35, 0.7, 0.25, 0.5, 0.15].map((delay, idx) => (
                        <span
                            key={idx}
                            style={{
                                width: 5,
                                borderRadius: 6,
                                background: 'linear-gradient(180deg, #ff6b2b, #f43f5e)',
                                animation: `geminiWave 1.2s ease-in-out ${delay}s infinite`,
                            }}
                        />
                    ))}
                </div>

                <p style={{ fontSize: 14, fontWeight: 600, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
                    {t.listening}
                </p>

                <p style={{ fontSize: 18, fontWeight: 500, color: isDark ? '#ffffff' : '#0f172a', minHeight: 64, lineHeight: 1.5, margin: 0, padding: '0 16px' }}>
                    {transcript || 'Speak naturally in Hindi or English...'}
                </p>
            </div>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                disabled={!transcript.trim()}
                style={{
                    padding: '16px 36px',
                    borderRadius: 36,
                    background: transcript.trim() ? '#0f172a' : (isDark ? '#27272a' : '#e2e8f0'),
                    color: transcript.trim() ? '#ffffff' : (isDark ? '#71717a' : '#94a3b8'),
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: transcript.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: transcript.trim() ? '0 12px 32px rgba(0,0,0,0.2)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <IoArrowUp size={18} />
                {t.voiceTap}
            </motion.button>
        </motion.div>
    );
};

// Animated Interactive Prompt Showcase
const AnimatedPromptShowcase = ({ onSelectPrompt, isDark, t, lang }) => {
    const [index, setIndex] = useState(0);
    const demos = PROMPT_DEMOS[lang] || PROMPT_DEMOS.en;

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % demos.length);
        }, 4200);
        return () => clearInterval(timer);
    }, [demos.length]);

    const activeDemo = demos[index % demos.length];

    return (
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f97316' }}>
                    <IoFlashOutline size={16} />
                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.demoHeader}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {demos.map((_, i) => (
                        <span
                            key={i}
                            onClick={() => setIndex(i)}
                            style={{
                                width: (i === (index % demos.length)) ? 18 : 6,
                                height: 6,
                                borderRadius: 3,
                                background: (i === (index % demos.length)) ? '#f97316' : (isDark ? '#3f3f46' : '#cbd5e1'),
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                            }}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        padding: '20px 22px',
                        borderRadius: 20,
                        background: isDark ? '#18181b' : '#ffffff',
                        border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                        boxShadow: isDark ? 'none' : '0 8px 30px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'rgba(249,115,22,0.1)', color: '#ea580c' }}>
                            {activeDemo.tag}
                        </span>
                        <span style={{ fontSize: 12, color: isDark ? '#71717a' : '#94a3b8' }}>
                            {activeDemo.hint}
                        </span>
                    </div>

                    <p style={{ fontSize: 16, fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.5, margin: 0 }}>
                        "{activeDemo.q}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <button
                            onClick={() => onSelectPrompt(activeDemo.q)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 14px',
                                borderRadius: 10,
                                background: '#0f172a',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <IoPlayCircleOutline size={16} />
                            {t.tryThis}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// Sidebar
const DrawerSidebar = ({ sessions, activeId, onSelect, onNew, onDelete, onRename, onPin, isDark, t }) => {
    const [search, setSearch] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [editVal, setEditVal] = useState('');

    const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    const pinned = filtered.filter(s => s.pinned);
    const today = filtered.filter(s => !s.pinned && isToday(s.createdAt));
    const older = filtered.filter(s => !s.pinned && !isToday(s.createdAt));

    const SectionLabel = ({ label }) => (
        <p style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#71717a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 14px 4px', margin: 0 }}>
            {label}
        </p>
    );

    const Item = ({ s }) => (
        <div style={{ position: 'relative' }} onMouseLeave={() => setMenuId(null)}>
            <button
                onClick={() => onSelect(s.id)}
                style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: 12,
                    background: activeId === s.id ? (isDark ? '#27272a' : '#f1f5f9') : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                {s.pinned ? (
                    <IoPinOutline size={14} color="#f97316" style={{ flexShrink: 0 }} />
                ) : (
                    <IoChatbubbleOutline size={14} color={isDark ? '#71717a' : '#94a3b8'} style={{ flexShrink: 0 }} />
                )}
                {editId === s.id ? (
                    <input
                        autoFocus
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={() => { onRename(s.id, editVal || s.title); setEditId(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { onRename(s.id, editVal || s.title); setEditId(null); } }}
                        style={{ flex: 1, fontSize: 13, background: 'transparent', outline: 'none', border: 'none', color: isDark ? '#fff' : '#0f172a' }}
                    />
                ) : (
                    <span style={{ flex: 1, fontSize: 13, fontWeight: activeId === s.id ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#e4e4e7' : '#1e293b' }}>
                        {s.title}
                    </span>
                )}
                <button
                    onClick={e => { e.stopPropagation(); setMenuId(menuId === s.id ? null : s.id); }}
                    style={{ opacity: menuId === s.id ? 1 : 0.4, padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#a1a1aa' : '#64748b' }}
                >
                    <IoEllipsisVertical size={14} />
                </button>
            </button>

            <AnimatePresence>
                {menuId === s.id && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 40,
                            zIndex: 100,
                            borderRadius: 14,
                            background: isDark ? '#18181b' : '#ffffff',
                            border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                            width: 136,
                            overflow: 'hidden',
                        }}
                    >
                        {[
                            { icon: IoPinOutline, label: s.pinned ? 'Unpin' : 'Pin', fn: () => { onPin(s.id); setMenuId(null); } },
                            { icon: IoTrashOutline, label: 'Delete', fn: () => { onDelete(s.id); setMenuId(null); }, danger: true },
                        ].map(it => (
                            <button
                                key={it.label}
                                onClick={it.fn}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: it.danger ? '#ef4444' : (isDark ? '#e4e4e7' : '#0f172a'), background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                            >
                                <it.icon size={14} />{it.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isDark ? '#121215' : '#fafafa', borderRight: isDark ? '1px solid #27272a' : '1px solid #f1f5f9' }}>
            <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #27272a' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>{t.history}</span>
                <button
                    onClick={onNew}
                    title={t.newChat}
                    style={{ width: 34, height: 34, borderRadius: 10, background: '#0f172a', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <IoAdd size={20} />
                </button>
            </div>

            <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? '#18181b' : '#ffffff', border: isDark ? '1px solid #27272a' : '1px solid #e2e8f0', borderRadius: 12, padding: '8px 12px' }}>
                    <IoSearchOutline size={15} color={isDark ? '#71717a' : '#94a3b8'} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t.search}
                        style={{ flex: 1, fontSize: 13, background: 'transparent', border: 'none', outline: 'none', color: isDark ? '#fff' : '#0f172a' }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
                {pinned.length > 0 && <><SectionLabel label={t.pinned} />{pinned.map(s => <Item key={s.id} s={s} />)}</>}
                {today.length > 0 && <><SectionLabel label="Today" />{today.map(s => <Item key={s.id} s={s} />)}</>}
                {older.length > 0 && <><SectionLabel label="Previous" />{older.map(s => <Item key={s.id} s={s} />)}</>}
                {filtered.length === 0 && (
                    <p style={{ fontSize: 13, color: isDark ? '#71717a' : '#94a3b8', textAlign: 'center', marginTop: 40 }}>{t.noChats}</p>
                )}
            </div>
        </div>
    );
};

// Clean Minimalist Language Selection Screen shown firstly
const LanguageSelectionScreen = ({ onSelect, onClose, forceMode, isDark }) => {
    const bg = isDark ? '#09090b' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#0f172a';
    const textSecondary = isDark ? '#a1a1aa' : '#64748b';
    const cardBg = isDark ? '#18181b' : '#f8fafc';
    const cardBorder = isDark ? '#27272a' : '#e2e8f0';

    const langs = [
        { code: 'en', title: 'English', desc: 'Step-by-step solutions & explanations in English' },
        { code: 'hi', title: 'हिंदी (Hindi)', desc: 'सरल, स्पष्ट एवं शुद्ध हिंदी माध्यम में समाधान' },
        { code: 'hinglish', title: 'Hinglish', desc: 'Bilingual conversational Hindi in Roman script' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', background: bg, position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {/* Highly Visible Red Cross Button on top right */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.45)',
                    color: '#ffffff',
                    zIndex: 20,
                    transition: 'transform 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#ef4444'; }}
                title="Close"
            >
                <IoClose size={20} color="#ffffff" />
            </button>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #ff6b2b, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 24px rgba(255,107,43,0.3)' }}>
                    <IoSparkles size={26} color="#ffffff" />
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: textPrimary, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Apna Lakshay AI</h2>
                <p style={{ fontSize: 14.5, color: textSecondary, margin: '0 0 32px' }}>Choose your language to get started</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {langs.map(l => (
                        <button
                            key={l.code}
                            onClick={() => onSelect(l.code)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                borderRadius: 16,
                                background: cardBg,
                                border: `1px solid ${cardBorder}`,
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: textPrimary, margin: '0 0 3px' }}>{l.title}</p>
                                <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>{l.desc}</p>
                            </div>
                            <span style={{ fontSize: 18, color: '#f97316', fontWeight: 700, marginLeft: 12 }}>→</span>
                        </button>
                    ))}
                </div>
                <p style={{ fontSize: 11.5, color: textSecondary, marginTop: 28 }}>AI Doubt Assistant · Web retrieval enabled</p>
            </motion.div>
        </div>
    );
};

// Attendance Result Popup Card (High z-index to overlay nicely)
const AttendanceResultCard = ({ result, onClose }) => {
    const isEntry = result.type === 'entry';
    const isAlreadyMarked = result.type === 'already_marked';
    const att = result.attendance || {};
    const theme = isEntry
        ? { bg: '#ffffff', border: '#a7f3d0', bar: 'linear-gradient(90deg, #34d399, #2dd4bf)', iconBg: 'linear-gradient(135deg,#10b981,#14b8a6)', text: '#059669' }
        : isAlreadyMarked
            ? { bg: '#ffffff', border: '#fde68a', bar: 'linear-gradient(90deg, #fbbf24, #fb923c)', iconBg: 'linear-gradient(135deg,#f59e0b,#ea580c)', text: '#d97706' }
            : { bg: '#ffffff', border: '#c7d2fe', bar: 'linear-gradient(90deg, #818cf8, #60a5fa)', iconBg: 'linear-gradient(135deg,#6366f1,#3b82f6)', text: '#4f46e5' };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{ position: 'relative', width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', background: theme.bg, border: `1.5px solid ${theme.border}` }}
            >
                <div style={{ height: 4, width: '100%', background: theme.bar }} />
                <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                        <div style={{ width: 54, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', flexShrink: 0, background: theme.iconBg, color: '#ffffff' }}>
                            {isEntry ? <IoLogInOutline size={28} /> : isAlreadyMarked ? <IoInformationCircleOutline size={28} /> : <IoLogOutOutline size={28} />}
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px', color: theme.text }}>
                                {isEntry ? 'Entry Marked' : isAlreadyMarked ? 'Already Marked' : 'Exit Marked'}
                            </p>
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>
                                {isEntry ? 'Welcome In' : isAlreadyMarked ? 'Attendance Complete' : 'See You Next Time'}
                            </h3>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        {isAlreadyMarked && (
                            <p style={{ fontSize: 13.5, color: '#4b5563', margin: '0 0 6px', lineHeight: 1.5 }}>
                                You have already completed your attendance for today.
                            </p>
                        )}
                        {att.entryTime && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 12, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Entry</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>{att.entryTime}</span>
                            </div>
                        )}
                        {(isAlreadyMarked || result.type === 'exit') && att.exitTime && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 12, padding: '10px 14px', border: '1px solid #f3f4f6' }}>
                                <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Exit</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>{att.exitTime}</span>
                            </div>
                        )}
                        {(isAlreadyMarked || result.type === 'exit') && att.duration > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: '10px 14px', background: '#e0e7ff', border: '1px solid #c7d2fe' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', fontWeight: 800 }}>
                                    <IoTimerOutline size={14} />Duration
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 900, color: '#4338ca' }}>
                                    {Math.floor(att.duration / 60)}h {att.duration % 60}m
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        style={{ width: '100%', padding: '13px 0', borderRadius: 14, fontWeight: 800, color: '#ffffff', fontSize: 14, border: 'none', cursor: 'pointer', background: theme.iconBg, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'opacity 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        Dismiss
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Main Component
const DoubtBoard = ({ forceMode = false, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleClose = onClose || (() => navigate('/student'));
    const studentName = user?.name ? user.name.trim().split(' ')[0] : 'Student';

    const [isDark, setIsDark] = useState(() => localStorage.getItem('doubt_dark') === '1');
    // Start with null so language selection is shown firstly
    const [selectedLang, setSelectedLang] = useState(null);
    const [lang, setLang] = useState('en');
    const [sessions, setSessions] = useState(() => loadSessions());
    const [activeId, setActiveId] = useState(null);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [creditsLeft, setCredits] = useState(10);
    const [maxCredits, setMaxCredits] = useState(10);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);

    // Attendance state on DoubtBoard (to mark directly and hide when marked)
    const [attendanceMarkedToday, setAttendanceMarkedToday] = useState(false);
    const [attendanceResult, setAttendanceResult] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinValue, setPinValue] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinLoading, setPinLoading] = useState(false);
    const [directMarkLoading, setDirectMarkLoading] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);

    // Voice recording modal
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const recognitionRef = useRef(null);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    const t = T[lang] || T.en;
    const maxLimit = Math.max(Number(maxCredits) || 10, Number(creditsLeft) || 0);
    const displayCredits = Math.max(0, Number(creditsLeft) || 0);
    const creditGauge = getCreditGauge(displayCredits, maxLimit);

    // Animated Infinite Left-to-Right Typewriter Placeholder
    const currentPrompts = TYPEWRITER_PROMPTS[lang] || TYPEWRITER_PROMPTS.en;
    const animatedPlaceholder = useTypewriter(currentPrompts, 55, 30, 1800);

    useEffect(() => {
        api.get('/student/dashboard').then(r => {
            if (r.data?.data?.doubtCredits != null) {
                const c = Number(r.data.data.doubtCredits);
                const m = Number(r.data.data.maxDoubtCredits) || Math.max(c, 10);
                setCredits(c);
                setMaxCredits(m);
            }
            if (r.data?.data?.attendance) {
                const isMarked = !!r.data.data.attendance.markedToday;
                setAttendanceMarkedToday(isMarked);
                if (isMarked) {
                    localStorage.setItem('attendance_marked_date', new Date().toDateString());
                } else {
                    localStorage.removeItem('attendance_marked_date');
                }
            }
        }).catch(() => {});

        api.get('/public/settings').then(r => {
            if (r.data?.settings?.pinAttendanceEnabled) {
                setPinEnabled(true);
            }
        }).catch(() => {});
    }, []);

    useEffect(() => { saveSessions(sessions); }, [sessions]);
    useEffect(() => { if (lang) localStorage.setItem('doubt_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('doubt_dark', isDark ? '1' : '0'); }, [isDark]);
    useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [sessions, loading, activeId]);

    const activeSession = sessions.find(s => s.id === activeId) || null;
    const messages = activeSession?.messages || [];

    const createNewSession = useCallback((chosenLang = lang) => {
        const s = { id: uid(), title: 'New chat', lang: chosenLang || 'en', messages: [], createdAt: Date.now(), pinned: false };
        setSessions(prev => [s, ...prev].slice(0, MAX_SESSIONS));
        setActiveId(s.id);
        setQuestion('');
        return s.id;
    }, [lang]);

    const updateSession = useCallback((id, updater) => {
        setSessions(prev => {
            const next = prev.map(s => s.id === id ? { ...s, ...updater(s) } : s);
            const updated = next.find(x => x.id === id);
            if (updated?.messages?.length > 0) {
                api.post('/student/doubt/sync-session', { sessionId: updated.id, title: updated.title, lang: updated.lang, pinned: updated.pinned, messages: updated.messages }).catch(() => {});
            }
            return next;
        });
    }, []);

    const startSpeechRecognition = () => {
        if (displayCredits <= 0) return;
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return;

        setVoiceText('');
        setIsVoiceActive(true);
        const rec = new SpeechRec();
        rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = e => {
            let full = '';
            for (let i = 0; i < e.results.length; i++) {
                full += e.results[i][0].transcript + ' ';
            }
            setVoiceText(full.trim());
        };

        rec.start();
        recognitionRef.current = rec;
    };

    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    const handleVoiceDone = () => {
        stopSpeechRecognition();
        setIsVoiceActive(false);
        if (displayCredits <= 0) return;
        if (voiceText.trim()) {
            handleAsk(voiceText.trim());
        }
    };

    const handleVoiceCancel = () => {
        stopSpeechRecognition();
        setIsVoiceActive(false);
        setVoiceText('');
    };

    const handleAsk = async (explicitText) => {
        if (displayCredits <= 0) return;
        const q = (explicitText || question).trim();
        if (!q || loading) return;
        setQuestion('');

        let sid = activeId;
        if (!sid) sid = createNewSession();
        const isFirst = (sessions.find(s => s.id === sid)?.messages || []).length === 0;

        updateSession(sid, s => ({
            messages: [...s.messages, { role: 'user', text: q }],
            title: isFirst ? autoTitle(q) : s.title,
        }));

        setLoading(true);
        try {
            const res = await api.post('/student/doubt/ask', {
                question: q,
                subject: 'general',
                lang: activeSession?.lang || lang || 'en',
            });
            updateSession(sid, s => ({ messages: [...s.messages, { role: 'ai', text: res.data.answer }] }));
            if (res.data?.creditsLeft != null) {
                setCredits(Number(res.data.creditsLeft));
            }
            if (res.data?.maxCredits != null) {
                setMaxCredits(Number(res.data.maxCredits));
            }
        } catch (e) {
            const msg = e.response?.data?.message || 'Unable to load solution. Please try again.';
            if (e.response?.data?.creditsLeft != null) {
                setCredits(Number(e.response.data.creditsLeft));
            }
            if (e.response?.data?.maxCredits != null) {
                setMaxCredits(Number(e.response.data.maxCredits));
            }
            updateSession(sid, s => ({ messages: [...s.messages, { role: 'error', text: msg }] }));
        } finally {
            setLoading(false);
        }
    };

    // Attendance mark handler on DoubtBoard
    const markAttendanceSuccess = (data) => {
        const isNew = data.type !== 'already_marked';
        if (isNew) {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(3800, ctx.currentTime);
                gain.gain.setValueAtTime(3.0, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
            } catch (_) {}
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        }
        localStorage.setItem('attendance_marked_date', new Date().toDateString());
        setAttendanceMarkedToday(true); // Automatically hides the mark attendance button
        setAttendanceResult({
            type: data.type,
            attendance: data.attendance,
            message: data.message
        });
    };

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            let coords = {};
            try {
                if (navigator.geolocation) {
                    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
                    coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                }
            } catch (_) {}
            const res = await api.post('/student/attendance/qr-scan', { qrToken: token, ...coords });
            if (res.data?.success) {
                markAttendanceSuccess(res.data);
            }
        } catch (e) {
            alert(e.response?.data?.message || 'Attendance scan failed');
        }
    };

    const handlePinAttendance = async () => {
        const trimmed = pinValue.trim();
        if (!trimmed) { setPinError('Please enter your PIN.'); return; }
        setPinLoading(true); setPinError('');
        try {
            const res = await api.post('/student/attendance/mark-pin', { pin: trimmed });
            if (res.data?.success) {
                setShowPinModal(false);
                setPinValue('');
                markAttendanceSuccess(res.data);
            }
        } catch (e) {
            setPinError(e.response?.data?.message || 'PIN incorrect or attendance failed.');
        } finally { setPinLoading(false); }
    };

    const handleDirectMark = async () => {
        setDirectMarkLoading(true);
        try {
            const res = await api.post('/student/attendance/mark-direct');
            if (res.data?.success) {
                setShowPinModal(false);
                markAttendanceSuccess(res.data);
            }
        } catch (e) {
            setPinError(e.response?.data?.message || 'Could not mark attendance. Please try again.');
        } finally { setDirectMarkLoading(false); }
    };

    const handleRegenerate = () => {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        if (lastUser) {
            updateSession(activeId, s => ({ messages: s.messages.slice(0, -1) }));
            setTimeout(() => handleAsk(lastUser.text), 80);
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 1800);
        });
    };

    const pageBg = isDark ? '#09090b' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#0f172a';
    const textSecondary = isDark ? '#a1a1aa' : '#64748b';
    const inputBg = isDark ? '#18181b' : '#f4f4f5';
    const borderColor = isDark ? '#27272a' : '#f1f5f9';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: pageBg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <style>{`
                @keyframes blinkC {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>

            {!selectedLang ? (
                <LanguageSelectionScreen
                    onSelect={code => {
                        setSelectedLang(code);
                        setLang(code);
                    }}
                    onClose={handleClose}
                    forceMode={forceMode}
                    isDark={isDark}
                />
            ) : (
                <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: pageBg }}>

            {/* Gemini-style Audio Overlay */}
            <AnimatePresence>
                {isVoiceActive && (
                    <GeminiAudioOverlay
                        transcript={voiceText}
                        onStop={handleVoiceDone}
                        onCancel={handleVoiceCancel}
                        t={t}
                        isDark={isDark}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                        className="md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Side Drawer Navigation */}
            <motion.div
                style={{ position: 'fixed', zIndex: 50, height: '100%', width: 268, flexShrink: 0 }}
                className="md:relative md:z-auto"
                initial={false}
                animate={{ x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 768) ? 0 : -268 }}
                transition={{ type: 'tween', duration: 0.2 }}
            >
                <DrawerSidebar
                    sessions={sessions}
                    activeId={activeId}
                    isDark={isDark}
                    t={t}
                    onSelect={id => { setActiveId(id); setSidebarOpen(false); }}
                    onNew={() => { createNewSession(); setSidebarOpen(false); }}
                    onDelete={id => { setSessions(p => p.filter(s => s.id !== id)); if (activeId === id) setActiveId(null); }}
                    onRename={(id, title) => updateSession(id, () => ({ title }))}
                    onPin={id => updateSession(id, s => ({ pinned: !s.pinned }))}
                />
            </motion.div>

            {/* Main Interactive Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: pageBg, position: 'relative' }}>
                {/* Top Header */}
                <header style={{ height: 58, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}`, background: pageBg, flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden" style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: textPrimary }}>
                            <IoMenu size={22} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary, letterSpacing: '-0.01em' }}>Apna Lakshay</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Dynamic Color Gauge Credit Badge: Green -> Amber -> Red */}
                        <div
                            title={creditGauge.label}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 16,
                                background: creditGauge.bg,
                                border: `1px solid ${creditGauge.border}`,
                                color: creditGauge.color,
                                fontSize: 12,
                                fontWeight: 700,
                                lineHeight: 1,
                            }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: creditGauge.dot, display: 'inline-block' }} />
                            <span>{displayCredits} / {maxLimit}</span>
                        </div>

                        {/* Language Selector */}
                        <button
                            onClick={() => setSelectedLang(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 10, background: isDark ? '#27272a' : '#f1f5f9', border: 'none', color: textPrimary, cursor: 'pointer' }}
                            title="Change language"
                        >
                            <IoLanguageOutline size={14} />
                            {lang === 'hi' ? 'हिंदी' : lang === 'hinglish' ? 'Hinglish' : 'EN'}
                        </button>

                        {/* Theme Switcher */}
                        <button
                            onClick={() => setIsDark(d => !d)}
                            style={{ padding: 8, borderRadius: 10, background: isDark ? '#27272a' : '#f1f5f9', border: 'none', cursor: 'pointer', color: textSecondary }}
                        >
                            {isDark ? <IoSunnyOutline size={16} color="#f59e0b" /> : <IoMoonOutline size={16} />}
                        </button>

                        {/* Highly Visible Red Cross Close Button */}
                        <button
                            onClick={handleClose}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 10px rgba(239, 68, 68, 0.45)',
                                color: '#ffffff',
                                flexShrink: 0,
                                transition: 'transform 0.15s ease, background 0.15s ease',
                                marginLeft: 2,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#ef4444'; }}
                            title="Close"
                        >
                            <IoClose size={18} color="#ffffff" />
                        </button>
                    </div>
                </header>

                {/* Conversation Stream */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
                    {/* Empty State Hero */}
                    {messages.length === 0 && (
                        <div style={{ maxWidth: 760, width: '100%', margin: 'auto', padding: '24px 0' }}>
                            <div style={{ marginBottom: 28, textAlign: 'left' }}>
                                <h1 style={{ fontSize: 32, fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                                    {t.greetingPrefix}{studentName}
                                </h1>
                                <p style={{ fontSize: 16, color: textSecondary, margin: 0 }}>
                                    {t.tagline}
                                </p>
                            </div>

                            {/* No Credit Locked Banner or Animated Demo Showcase */}
                            {creditsLeft <= 0 ? (
                                <div
                                    style={{
                                        maxWidth: 640,
                                        width: '100%',
                                        margin: '0 auto',
                                        padding: '24px 20px',
                                        borderRadius: 20,
                                        background: isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2',
                                        border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #fecaca',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            background: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
                                        }}
                                    >
                                        <IoLockClosed size={26} />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#ffffff' : '#991b1b', margin: 0 }}>
                                        {t.noCreditsTitle}
                                    </h3>
                                    <p style={{ fontSize: 14.5, color: isDark ? '#fca5a5' : '#b91c1c', maxWidth: 460, margin: 0, lineHeight: 1.6 }}>
                                        {t.noCreditsSub}
                                    </p>
                                </div>
                            ) : (
                                <AnimatedPromptShowcase
                                    onSelectPrompt={q => {
                                        setQuestion(q);
                                        textareaRef.current?.focus();
                                    }}
                                    isDark={isDark}
                                    t={t}
                                    lang={lang}
                                />
                            )}
                        </div>
                    )}

                    {/* Messages List */}
                    <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {messages.map((m, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                                {m.role === 'user' ? (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <div
                                            style={{
                                                maxWidth: '85%',
                                                padding: '12px 18px',
                                                borderRadius: '20px 20px 4px 20px',
                                                background: isDark ? '#27272a' : '#f1f5f9',
                                                color: textPrimary,
                                                fontSize: 15,
                                                lineHeight: 1.6,
                                                fontWeight: 500,
                                            }}
                                        >
                                            {m.text}
                                        </div>
                                    </div>
                                ) : m.role === 'error' ? (
                                    <div style={{ padding: '14px 18px', borderRadius: 14, background: '#fef2f2', color: '#dc2626', fontSize: 14 }}>
                                        {m.text}
                                    </div>
                                ) : (
                                    <div style={{ padding: '4px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #ff6b2b, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <IoSparkles size={12} color="#fff" />
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: textPrimary }}>Apna Lakshay AI</span>
                                        </div>

                                        <MarkdownRenderer text={m.text} isDark={isDark} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                                            <button
                                                onClick={() => handleCopy(m.text, idx)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: isDark ? '#27272a' : '#f1f5f9', border: 'none', color: textSecondary, cursor: 'pointer' }}
                                            >
                                                {copiedIdx === idx ? <><IoCheckmarkOutline size={14} color="#16a34a" /> {t.copied}</> : <><IoCopyOutline size={14} /> {t.copy}</>}
                                            </button>
                                            {idx === messages.length - 1 && (
                                                <button
                                                    onClick={handleRegenerate}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 8, background: isDark ? '#27272a' : '#f1f5f9', border: 'none', color: textSecondary, cursor: 'pointer' }}
                                                >
                                                    <IoRefreshOutline size={14} /> {t.regenerate}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', color: textSecondary, fontSize: 14 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #ff6b2b, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IoSparkles size={12} color="#fff" />
                                </div>
                                <span style={{ fontWeight: 600 }}>{t.thinking}</span>
                            </motion.div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Gemini-style Fluid Pill Input Bar with Left-to-Right Animated Typewriter Placeholder */}
                <footer style={{ padding: '12px 16px 20px', background: pageBg, flexShrink: 0 }}>
                    <div style={{ maxWidth: 760, margin: '0 auto' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: creditsLeft <= 0 ? (isDark ? '#18181b' : '#f8fafc') : inputBg,
                                borderRadius: 32,
                                padding: '8px 14px 8px 18px',
                                boxShadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                                border: creditsLeft <= 0 ? (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca') : (isDark ? '1px solid #27272a' : '1px solid #e2e8f0'),
                                position: 'relative',
                                opacity: creditsLeft <= 0 ? 0.92 : 1,
                            }}
                        >
                            {/* Lock Icon indicator when 0 credits left */}
                            {creditsLeft <= 0 && (
                                <div
                                    title={t.chatLocked}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <IoLockClosed size={15} />
                                </div>
                            )}

                            <div style={{ flex: 1, position: 'relative', minHeight: 32, display: 'flex', alignItems: 'center' }}>
                                {/* Animated Typewriter Placeholder overlay or Locked text */}
                                {!question && (
                                    <div
                                        onClick={() => { if (creditsLeft > 0) textareaRef.current?.focus(); }}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            pointerEvents: 'none',
                                            fontSize: 14.5,
                                            color: creditsLeft <= 0 ? '#ef4444' : textSecondary,
                                            fontWeight: creditsLeft <= 0 ? 600 : 400,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span>{creditsLeft <= 0 ? t.chatLocked : animatedPlaceholder}</span>
                                        {creditsLeft > 0 && (
                                            <span style={{ width: 2, height: 16, background: '#f97316', marginLeft: 2, display: 'inline-block', animation: 'blinkC 0.9s infinite' }} />
                                        )}
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    value={question}
                                    onChange={e => {
                                        if (creditsLeft <= 0) return;
                                        setQuestion(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (creditsLeft > 0) handleAsk();
                                        }
                                    }}
                                    rows={1}
                                    disabled={loading || creditsLeft <= 0}
                                    style={{
                                        width: '100%',
                                        resize: 'none',
                                        fontSize: 15,
                                        background: 'transparent',
                                        color: creditsLeft <= 0 ? '#ef4444' : textPrimary,
                                        outline: 'none',
                                        border: 'none',
                                        padding: '6px 0',
                                        maxHeight: 120,
                                        lineHeight: 1.4,
                                        position: 'relative',
                                        zIndex: 2,
                                        cursor: creditsLeft <= 0 ? 'not-allowed' : 'text',
                                    }}
                                />
                            </div>

                            {/* Voice Query Button — locked when 0 credits */}
                            <button
                                onClick={creditsLeft <= 0 ? undefined : startSpeechRecognition}
                                title={creditsLeft <= 0 ? t.voiceLocked : "Voice search"}
                                disabled={creditsLeft <= 0}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: creditsLeft <= 0 ? (isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2') : 'transparent',
                                    border: 'none',
                                    cursor: creditsLeft <= 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: creditsLeft <= 0 ? '#ef4444' : textSecondary,
                                    zIndex: 3,
                                    opacity: creditsLeft <= 0 ? 0.7 : 1,
                                }}
                            >
                                <IoMic size={20} />
                            </button>

                            {/* Send Query Button */}
                            <button
                                onClick={() => handleAsk()}
                                disabled={!question.trim() || loading || creditsLeft <= 0}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: question.trim() && !loading && creditsLeft > 0 ? '#0f172a' : (isDark ? '#27272a' : '#e2e8f0'),
                                    border: 'none',
                                    cursor: question.trim() && !loading && creditsLeft > 0 ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: question.trim() && !loading && creditsLeft > 0 ? '#ffffff' : (isDark ? '#71717a' : '#94a3b8'),
                                    transition: 'all 0.15s ease',
                                    zIndex: 3,
                                }}
                            >
                                {creditsLeft <= 0 ? <IoLockClosed size={16} color={isDark ? '#71717a' : '#94a3b8'} /> : <IoArrowUp size={18} />}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
        )}

        {/* ── Attendance Scanner Modal (Camera) ── */}
        {showScanner && (
            <AttendanceScanner
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleQrScan}
            />
        )}

        {/* ── Manual / PIN Attendance Modal ── */}
        <AnimatePresence>
            {showPinModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{ width: '100%', maxWidth: 360, background: '#ffffff', borderRadius: 20, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                    <IoKeypadOutline size={22} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>Manual Attendance</h3>
                                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Mark without scanning QR</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPinModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                                <IoCloseOutline size={22} />
                            </button>
                        </div>

                        {pinEnabled ? (
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Enter Your Security PIN</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    placeholder="Enter PIN"
                                    value={pinValue}
                                    onChange={e => setPinValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handlePinAttendance(); }}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 18, letterSpacing: 4, textAlign: 'center', outline: 'none', marginBottom: 12 }}
                                    autoFocus
                                />
                                {pinError && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px', fontWeight: 600 }}>{pinError}</p>}
                                <button
                                    onClick={handlePinAttendance}
                                    disabled={pinLoading}
                                    style={{ width: '100%', padding: 12, borderRadius: 12, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#ffffff', fontWeight: 800, border: 'none', cursor: pinLoading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                                >
                                    {pinLoading ? 'Verifying PIN...' : 'Submit Attendance'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 16, lineHeight: 1.5 }}>
                                    Tap below to record your attendance directly for today.
                                </p>
                                {pinError && <p style={{ color: '#ef4444', fontSize: 12, margin: '0 0 12px', fontWeight: 600 }}>{pinError}</p>}
                                <button
                                    onClick={handleDirectMark}
                                    disabled={directMarkLoading}
                                    style={{ width: '100%', padding: 12, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#ffffff', fontWeight: 800, border: 'none', cursor: directMarkLoading ? 'not-allowed' : 'pointer', fontSize: 14 }}
                                >
                                    {directMarkLoading ? 'Marking Attendance...' : 'Mark Attendance Now'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ── Attendance Result Popup Overlay ── */}
        <AnimatePresence>
            {attendanceResult && (
                <AttendanceResultCard
                    result={attendanceResult}
                    onClose={() => setAttendanceResult(null)}
                />
            )}
        </AnimatePresence>

        {/* ── Floating Mark Attendance Button (hidden once marked today) ── */}
        {!attendanceMarkedToday && (
            <>
                {/* Clean backdrop without any blur */}
                <AnimatePresence>
                    {fabOpen && (
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0, 0, 0, 0.15)' }}
                            onClick={() => setFabOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Sub-buttons */}
                <AnimatePresence>
                    {fabOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            style={{
                                position: 'fixed',
                                bottom: 84,
                                right: 20,
                                zIndex: 130,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                alignItems: 'flex-end',
                            }}
                        >
                            <button
                                onClick={() => { setFabOpen(false); setShowPinModal(true); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 16px',
                                    borderRadius: 14,
                                    background: '#ffffff',
                                    color: '#ef4444',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    border: '1.5px solid rgba(239,68,68,0.25)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    cursor: 'pointer',
                                }}
                            >
                                <IoKeypadOutline size={20} color="#ef4444" />
                                <span>Without Camera</span>
                            </button>

                            <button
                                onClick={() => { setFabOpen(false); setShowScanner(true); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 16px',
                                    borderRadius: 14,
                                    background: '#ffffff',
                                    color: '#10b981',
                                    fontWeight: 800,
                                    fontSize: 13,
                                    border: '1.5px solid rgba(16,185,129,0.25)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    cursor: 'pointer',
                                }}
                            >
                                <IoCameraOutline size={20} color="#10b981" />
                                <span>With Camera</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 130 }}>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFabOpen(o => !o)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: fabOpen ? '12px' : '10px 18px',
                            borderRadius: fabOpen ? '50%' : 100,
                            background: fabOpen
                                ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
                                : 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 13,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(249,115,22,0.45)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {fabOpen ? (
                            <IoCloseOutline size={22} />
                        ) : (
                            <>
                                <IoScan size={18} />
                                <span>Mark Attendance</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </>
        )}
    </div>
    );
};

export default DoubtBoard;
