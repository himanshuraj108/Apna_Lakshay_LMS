import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTrophyOutline, IoRefreshOutline, IoBookOutline, IoTimeOutline, IoInformationCircleOutline, IoPersonOutline, IoScan, IoAlertCircleOutline, IoArrowForwardOutline } from 'react-icons/io5';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ─── Global Mobile CSS ───────────────────────────────────────────────
const MOBILE_CSS = `
@media (max-width: 640px) {
  .exam-header { flex-direction: column !important; gap: 10px !important; padding: 10px 14px !important; }
  .exam-header-right { flex-wrap: wrap !important; gap: 8px !important; justify-content: space-between; width: 100%; }
  .exam-credits-label { font-size: 12px !important; }
  .exam-grid { grid-template-columns: 1fr 1fr !important; }
  .info-grid { grid-template-columns: 1fr !important; }
  .info-stats { gap: 10px !important; }
  .info-stat-card { padding: 10px 14px !important; flex: 1 1 140px !important; }
  .session-layout { flex-direction: column !important; height: auto !important; min-height: 100vh; }
  .palette-panel { width: 100% !important; }
  .palette-toggle-btn { display: flex !important; }
  .palette-hidden { display: none !important; }
  .result-kpi-grid { grid-template-columns: 1fr !important; }
  .result-stats-grid { grid-template-columns: 1fr 1fr !important; }
  .result-header { flex-direction: column !important; gap: 10px !important; align-items: flex-start !important; }
  .result-header-btns { width: 100%; display: flex; gap: 8px; }
  .result-header-btns button { flex: 1; font-size: 12px !important; padding: 8px 10px !important; }
  .q-action-bar { gap: 6px !important; }
  .q-action-bar button { font-size: 11px !important; padding: 8px 10px !important; }
  .test-topbar { flex-wrap: wrap !important; gap: 8px !important; padding: 8px 12px !important; }
  .test-topbar-left { font-size: 13px !important; }
  .test-topbar-left .exam-title { font-size: 12px !important; }
  .test-topbar-right { gap: 10px !important; }
  .submit-btn { padding: 6px 14px !important; font-size: 12px !important; }
  .modal-content { padding: 16px !important; }
  .modal-footer { padding: 12px 16px !important; flex-direction: column !important; gap: 8px !important; }
  .modal-footer button { width: 100% !important; }
}
@media (min-width: 641px) {
  .palette-panel { display: flex !important; }
  .palette-toggle-btn { display: none !important; }
}
`;

// ─── Exam Groups Data (Selector Only) ─────────────────────────────────
const EXAM_GROUPS = [
    {
        id: 'ssc', name: 'SSC Exams', color: '#1d4ed8', bg: '#eff6ff',
        exams: [
            { code: 'ssc_cgl', name: 'SSC CGL' },
            { code: 'ssc_chsl', name: 'SSC CHSL' },
            { code: 'ssc_gd', name: 'SSC GD Constable' },
            { code: 'ssc_mts', name: 'SSC MTS' },
            { code: 'ssc_cpo', name: 'SSC CPO' },
        ],
    },
    {
        id: 'upsc', name: 'UPSC Exams', color: '#b91c1c', bg: '#fef2f2',
        exams: [
            { code: 'upsc_cse', name: 'UPSC CSE Prelims' },
            { code: 'upsc_cds', name: 'UPSC CDS' },
        ],
    },
    {
        id: 'banking', name: 'Banking Exams', color: '#15803d', bg: '#f0fdf4',
        exams: [
            { code: 'ibps_po', name: 'IBPS PO' },
            { code: 'ibps_clerk', name: 'IBPS Clerk' },
            { code: 'sbi_po', name: 'SBI PO' },
            { code: 'sbi_clerk', name: 'SBI Clerk' },
        ],
    },
    {
        id: 'rrb', name: 'Railway Exams', color: '#0369a1', bg: '#f0f9ff',
        exams: [
            { code: 'rrb_ntpc', name: 'RRB NTPC' },
            { code: 'rrb_gd', name: 'RRB Group D' },
        ],
    },
    {
        id: 'nta', name: 'NTA Exams', color: '#7c3aed', bg: '#faf5ff',
        exams: [
            { code: 'jee_main', name: 'JEE Main' },
            { code: 'neet_ug', name: 'NEET UG' },
        ],
    },
    {
        id: 'generic', name: 'Other Exams', color: '#b45309', bg: '#fffbeb',
        exams: [
            { code: 'generic', name: 'General Mock Test' },
        ],
    },
];

const QS = { not_visited: '#6b7280', not_answered: '#ef4444', answered: '#16a34a', marked: '#7c3aed', answered_marked: '#4338ca' };
const QS_LABEL = { not_visited: 'Not Visited', not_answered: 'Not Answered', answered: 'Answered', marked: 'Marked for Review', answered_marked: 'Answered & Marked' };

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ─── Reusable Instructions Modal ──────────────────────────────────────
const InstructionsModal = ({ isOpen, onClose, requireCheckbox = false, onAccept, type = 'general' }) => {
    const [lang, setLang] = useState('en');
    const [isChecked, setIsChecked] = useState(false);

    // Reset checkbox when modal opens
    useEffect(() => {
        if (isOpen) setIsChecked(false);
    }, [isOpen]);

    const content = {
        en: {
            title: "Exam Instructions",
            disclaimer: "This mock exam is only for mock purposes. We do not risk or guarantee that these exact questions will come in the real exam.",
            points: [
                "The clock will be set at the server. The countdown timer in the top right corner will display the remaining time available for you to complete the examination.",
                "The Question Palette displayed on the right side of screen will show the status of each question using color codes.",
                "You can navigate between sections (if applicable) using the tabs provided above the question area.",
                "Click on Save & Next to save your answer for the current question and then go to the next question.",
                "Click on Mark for Review & Next to save your answer for the current question, mark it for review, and then go to the next question.",
                "CREDIT SYSTEM: You are allowed a maximum of 2 Mock Tests per day. Your credits will automatically reset to 2 every night at 12:00 AM IST."
            ],
            checkbox_label: "I have read and understood all the instructions. I agree this is only for practice.",
            btn: requireCheckbox ? "Proceed to Exam" : "I Understand"
        },
        hi: {
            title: "परीक्षा निर्देश",
            disclaimer: "यह मॉक परीक्षा केवल अभ्यास के उद्देश्य से है। हम इस बात की कोई गारंटी नहीं देते कि असली परीक्षा में यही प्रश्न आएंगे।",
            points: [
                "सर्वर पर घड़ी सेट की जाएगी। स्क्रीन के ऊपरी दाएं कोने में उलटी गिनती टाइमर आपको परीक्षा पूरी करने के लिए शेष समय दिखाएगा।",
                "स्क्रीन के दाईं ओर प्रदर्शित प्रश्न पैलेट रंग कोड का उपयोग करके प्रत्येक प्रश्न की स्थिति दिखाएगा।",
                "आप प्रश्न क्षेत्र के ऊपर दिए गए टैब का उपयोग करके अनुभागों (यदि लागू हो) के बीच नेविगेट कर सकते हैं।",
                "वर्तमान प्रश्न के लिए अपना उत्तर सहेजने के लिए 'सहेजें और अगला' पर क्लिक करें और फिर अगले प्रश्न पर जाएं।",
                "वर्तमान प्रश्न के लिए अपना उत्तर सहेजने के लिए 'समीक्षा के लिए चिह्नित करें और अगला' पर क्लिक करें, इसे समीक्षा के लिए चिह्नित करें, और फिर अगले प्रश्न पर जाएं।",
                "क्रेडिट सिस्टम: आपको प्रतिदिन अधिकतम 2 मॉक टेस्ट देने की अनुमति है। आपके क्रेडिट हर रात 12:00 बजे (IST) स्वतः 2 पर रीसेट हो जाएंगे।"
            ],
            checkbox_label: "मैंने सभी निर्देश पढ़ और समझ लिए हैं। मैं सहमत हूँ कि यह केवल अभ्यास के लिए है।",
            btn: requireCheckbox ? "शुरू करें" : "मैं समझता हूँ"
        }
    };

    const creditsContent = {
        en: {
            title: "Mock Test Credit System",
            disclaimer: "Please note that Mock Test Credits are limited to ensure fair usage of AI resources.",
            points: [
                "You are allowed a maximum of 2 Premium AI Mock Tests per day.",
                "Your credits will automatically reset to 2 every night at exactly 12:00 AM IST (Midnight).",
                "If you run out of credits, exams will be locked. A timer will display the remaining time until the next reset.",
                "Credits do not carry over. If you don't use them, they are reset to 2 the next day."
            ],
            checkbox_label: "I understand the credit system rules.",
            btn: "Got It"
        },
        hi: {
            title: "मॉक टेस्ट क्रेडिट सिस्टम",
            disclaimer: "एआई संसाधनों का उचित उपयोग सुनिश्चित करने के लिए मॉक टेस्ट क्रेडिट सीमित हैं।",
            points: [
                "आपको प्रतिदिन अधिकतम 2 प्रीमियम एआई मॉक टेस्ट की अनुमति है।",
                "आपके क्रेडिट हर रात ठीक 12:00 बजे (IST) (मध्यरात्रि) 2 पर स्वतः रीसेट हो जाएंगे।",
                "यदि आपके क्रेडिट समाप्त हो जाते हैं, तो परीक्षाएं लॉक हो जाएंगी। एक टाइमर अगले रीसेट तक का शेष समय दिखाएगा।",
                "क्रेडिट आगे नहीं बढ़ते। यदि आप उनका उपयोग नहीं करते हैं, तो वे अगले दिन 2 पर रीसेट हो जाते हैं।"
            ],
            checkbox_label: "मैं क्रेडिट सिस्टम के नियमों को समझता हूँ।",
            btn: "समझ गया"
        }
    };

    const text = type === 'credits' ? creditsContent[lang] : content[lang];
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ background: '#1e293b', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <IoInformationCircleOutline size={20} /> {text.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                                    <option value="en" style={{ color: 'black' }}>English</option>
                                    <option value="hi" style={{ color: 'black' }}>हिंदी (Hindi)</option>
                                </select>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><IoCloseCircle size={24} /></button>
                            </div>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <p style={{ color: '#dc2626', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                                <IoAlertCircleOutline size={24} style={{ flexShrink: 0, marginTop: '-2px' }} />
                                {text.disclaimer}
                            </p>
                            <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                                {text.points.map((pt, idx) => (
                                    <li key={idx}>{pt}</li>
                                ))}
                            </ul>

                            {requireCheckbox && (
                                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => setIsChecked(e.target.checked)}
                                            style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#1a3a6a' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', lineHeight: '1.5' }}>
                                            {text.checkbox_label}
                                        </span>
                                    </label>
                                </div>
                            )}

                        </div>
                        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {requireCheckbox && (
                                <button onClick={onClose} style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 24px', fontWeight: '700', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={requireCheckbox ? onAccept : onClose}
                                disabled={requireCheckbox && !isChecked}
                                style={{
                                    background: (requireCheckbox && !isChecked) ? '#94a3b8' : '#1a3a6a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 24px',
                                    fontWeight: '700',
                                    cursor: (requireCheckbox && !isChecked) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {text.btn}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── 1. Exam Select Screen ────────────────────────────────────────────
const ExamSelect = ({ onSelect }) => {
    const { user } = useAuth();
    const credits = Math.min(user?.mockTestCredits ?? 2, 2);
    const isLocked = credits <= 0;

    const [timeLeftToReset, setTimeLeftToReset] = useState('');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);

    useEffect(() => {
        if (!isLocked) return;
        const interval = setInterval(() => {
            const now = new Date();
            // Calculate next midnight IST
            // IST is UTC +5:30. At 18:30 UTC it is midnight next day in IST.
            const nextReset = new Date();
            nextReset.setUTCHours(18, 30, 0, 0);
            if (now > nextReset) {
                nextReset.setDate(nextReset.getDate() + 1);
            }
            const diffSecs = Math.floor((nextReset - now) / 1000);
            if (diffSecs <= 0) {
                setTimeLeftToReset('Refreshing Credits...');
                window.location.reload(); // Hard reload to fetch new credits on 00:00
            } else {
                const h = Math.floor(diffSecs / 3600);
                const m = Math.floor((diffSecs % 3600) / 60);
                const s = diffSecs % 60;
                setTimeLeftToReset(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isLocked]);

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
            <style>{MOBILE_CSS}</style>
            <InstructionsModal isOpen={showInstructionsModal} onClose={() => setShowInstructionsModal(false)} type="credits" />

            <div className="exam-header" style={{ background: '#1a3a6a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'white', flexShrink: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>Apna Lakshay</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>Advanced AI Mock Test Portal</div>
                </div>
                <div className="exam-header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="exam-credits-label" style={{ color: isLocked ? '#fca5a5' : '#93c5fd', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', flexWrap: 'wrap' }}>
                        <span>Credits: <span style={{ color: 'white' }}>{credits}/2</span></span>
                        {isLocked && <span style={{ fontSize: '11px', background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Unlocks in {timeLeftToReset}</span>}
                        <button onClick={() => setShowInstructionsModal(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', display: 'flex', padding: 0 }} title="Instructions">
                            <IoInformationCircleOutline size={18} />
                        </button>
                    </div>
                    <Link to="/student">
                        <button style={{ color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <IoArrowBack size={14} /> Dashboard
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Exam Grid */}
                <div style={{ width: '100%' }}>
                    <h2 style={{ color: '#1a3a6a', fontWeight: '800', fontSize: '24px', marginBottom: '8px' }}>Target Your Exam</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>Select the specific exam you are preparing for to view syllabus, marking scheme, and start a section-wise valid mock test.</p>

                    <div style={isLocked ? { opacity: 0.6, pointerEvents: 'none', filter: 'grayscale(100%)' } : {}}>
                        {EXAM_GROUPS.map(grp => (
                            <div key={grp.id} style={{ marginBottom: '24px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: '800', fontSize: '14px', color: grp.color, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>{grp.name}</div>
                                <div className="exam-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                    {grp.exams.map(exam => (
                                        <button key={exam.code} onClick={() => onSelect(exam.code)}
                                            style={{
                                                textAlign: 'left', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                                border: '1px solid #e2e8f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.borderColor = grp.color; e.currentTarget.style.background = grp.bg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937' }}>{exam.name}</span>
                                            <span style={{ color: grp.color, fontSize: '18px' }}>→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// ─── 2. Exam Info & Setup Screen ──────────────────────────────────────
const ExamInfoPage = ({ examCode, onStart, onBack }) => {
    const { checkAuth } = useAuth();
    const [pattern, setPattern] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sectionId, setSectionId] = useState('all'); // 'all' or specific ID
    const [lang, setLang] = useState('en');
    const [genLoading, setGenLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [pendingExamStart, setPendingExamStart] = useState(null); // Stores the fully generated payload until instructions are accepted

    useEffect(() => {
        api.get(`/student/mock-test/pattern/${examCode}`)
            .then(res => setPattern(res.data.pattern))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [examCode]);

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Exam Pattern...</div>;
    if (!pattern) return <div>Error loading pattern.</div>;

    const Chip = ({ options, val, onChange }) => (
        <div className="flex gap-2 flex-wrap">
            {options.map(o => (
                <button key={o.v} onClick={() => onChange(o.v)}
                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                    style={val === o.v ? { background: '#1a3a6a', color: 'white', borderColor: '#1a3a6a', boxShadow: '0 4px 12px rgba(26,58,106,0.3)' } : { background: 'white', color: '#4b5563', borderColor: '#d1d5db' }}
                >{o.l}</button>
            ))}
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
            <style>{MOBILE_CSS}</style>
            {/* Header */}
            <div style={{ background: '#1a3a6a', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                        <IoArrowBack /> Back to Exams
                    </button>
                    <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>{pattern.name}</h1>
                    <div style={{ color: '#93c5fd', fontSize: '15px', fontWeight: '500', marginBottom: '24px' }}>{pattern.type} — {pattern.desc}</div>

                    <div className="info-stats" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="info-stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div><div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', fontWeight: '700' }}>Real Exam Duration</div><div style={{ fontWeight: '700', fontSize: '15px' }}>{pattern.duration} Minutes</div></div>
                        </div>
                        <div className="info-stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div><div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', fontWeight: '700' }}>Real Marking Scheme</div><div style={{ fontWeight: '700', fontSize: '15px' }}>+{pattern.positive} Correct / {pattern.negative > 0 ? `−${pattern.negative} Incorrect` : 'No Ngtv'}</div></div>
                        </div>
                        <div className="info-stat-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div><div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', fontWeight: '700' }}>Questions</div><div style={{ fontWeight: '700', fontSize: '15px' }}>{pattern.totalQuestions} Questions</div></div>
                        </div>
                        <button onClick={() => setShowInstructions(true)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}>
                            <IoInformationCircleOutline size={22} />
                            View Instructions
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4" style={{ marginTop: '-20px', position: 'relative', zIndex: 20 }}>
                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>

                    {/* Left Col: Syllabus & Sections */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoBookOutline color="#3b82f6" /> Syllabus & Sections
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {pattern.sections.map((sec, idx) => (
                                <div key={sec.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>{idx + 1}</div>
                                    <div>
                                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', marginBottom: '4px' }}>{sec.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>Weightage: {sec.weight}% of Exam</div>
                                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}><b>Topics:</b> {sec.topics}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Col: Mock Test Setup */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1a3a6a', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>Setup Mock Test</h2>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Test Type</label>
                            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px', fontWeight: '600', color: '#1e293b', outline: 'none' }}>
                                <option value="all">🏆 Full Mock Test (All Sections)</option>
                                {pattern.sections.map(s => <option key={s.id} value={s.id}>📖 Section: {s.name}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Simulation Engine Profile</label>
                            <div style={{ padding: '12px 16px', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '10px', fontSize: '13px', color: '#3730a3', lineHeight: '1.6' }}>
                                <b>Auto-Configured:</b> The AI will automatically map exact difficulty algorithms, sub-topic spread, and question counts mirroring the real {pattern.name} standard. {sectionId === 'all' ? `(${pattern.totalQuestions} Questions total across ${pattern.sections.length} sections)` : `(Focusing only on ${pattern.sections.find(s => s.id === sectionId)?.name})`}
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Language Medium</label>
                            <Chip options={[{ v: 'en', l: 'English' }, { v: 'hi', l: 'Hindi' }]} val={lang} onChange={setLang} />
                        </div>

                        {error && <div style={{ color: '#ef4444', fontSize: '13px', background: '#fee2e2', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

                        <button
                            onClick={async () => {
                                setGenLoading(true); setError(null);
                                try {
                                    const cfg = { sectionId, lang };
                                    // Generate ONLY the selected language
                                    const res = await api.post('/student/mock-test/generate', { examCode, mode: 'mcq', ...cfg, lang });

                                    // Force Refresh User Credits from DB
                                    try { await checkAuth(); } catch (e) { console.error('Failed to update credits', e); }

                                    // Pause for Mandatory Instructions Check
                                    setPendingExamStart(() => () => onStart(pattern, cfg, res.data.questions));
                                } catch (e) {
                                    setError(e.response?.data?.message || 'Failed to generate test. Try again.');
                                } finally { setGenLoading(false); }
                            }}
                            disabled={genLoading}
                            style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: '800', fontSize: '15px', cursor: genLoading ? 'not-allowed' : 'pointer', opacity: genLoading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                        >
                            {genLoading ? 'Building Test Engine...' : 'START EXAM SESSION →'}
                        </button>
                    </div>

                </div>
            </div>

            {/* General Info Modal (No Checkbox) */}
            <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />

            {/* Mandatory Pre-Start Modal (Requires Checkbox) */}
            <InstructionsModal
                isOpen={!!pendingExamStart}
                onClose={() => setPendingExamStart(null)}
                requireCheckbox={true}
                onAccept={() => {
                    if (pendingExamStart) {
                        pendingExamStart();
                        setPendingExamStart(null);
                    }
                }}
            />
        </div>
    );
};

// ─── 3. Test Session (NTA-Style with Section Tabs & Browser Translate) ──
const TestSession = ({ initialQuestions, pattern, config, onFinish }) => {
    const { user } = useAuth();
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [statuses, setStatuses] = useState(() => Object.fromEntries(initialQuestions.map((_, i) => [i, 'not_visited'])));
    const [showPalette, setShowPalette] = useState(false); // mobile palette toggle

    // Timer is real exam duration if all sections, or scaled by weight if single section
    const isFull = config.sectionId === 'all';
    let sessionTime = pattern.duration;
    if (!isFull) {
        const secWeight = pattern.sections.find(s => s.id === config.sectionId)?.weight || 100;
        sessionTime = Math.max(5, Math.floor(pattern.duration * (secWeight / 100)));
    }

    const [timeLeft, setTimeLeft] = useState(sessionTime * 60);
    const [displayLang, setDisplayLang] = useState(config.lang || 'en');
    const [translatedQuestions, setTranslatedQuestions] = useState({}); // Cache translated questions
    const [translating, setTranslating] = useState(false);
    const [showAdmitCard, setShowAdmitCard] = useState(false); // Admit Card Modal state
    const [showInfo, setShowInfo] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false); // Submit Confirmation Modal
    const [realSeat, setRealSeat] = useState(null); // Actual student library seat

    // Anti-Cheat State
    const [fullscreenViolations, setFullscreenViolations] = useState(0);
    const [showCheatWarning, setShowCheatWarning] = useState(false);
    const isSubmittingRef = useRef(false);

    const timerRef = useRef();

    // The active question object (either original or translated)
    const q = displayLang === config.lang ? initialQuestions[current] : (translatedQuestions[current] || initialQuestions[current]);
    const urgent = timeLeft < 300;

    // Derived sections for tabs based on questions generated
    const sectionIdsPresent = [...new Set(initialQuestions.map(qt => qt.sectionId))];
    const [activeTab, setActiveTab] = useState(sectionIdsPresent[0] || 'all');

    // Free Browser Google Translate Helper
    const translateText = async (text, from, to) => {
        if (!text) return text;
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            return data[0].map(x => x[0]).join('');
        } catch (e) { return text; } // Fallback to original
    };

    // Auto-translate current question if needed
    useEffect(() => {
        const translateCurrent = async () => {
            if (displayLang === config.lang) return; // No translation needed
            if (translatedQuestions[current]) return; // Already cached

            setTranslating(true);
            const qObj = initialQuestions[current];
            const from = config.lang;
            const to = displayLang;

            try {
                // Translate Question
                const tQ = await translateText(qObj.question, from, to);
                // Translate Options
                const tOpts = await Promise.all(qObj.options.map(o => translateText(o, from, to)));
                // Translate Explanation
                const tExp = qObj.explanation ? await translateText(qObj.explanation, from, to) : '';

                setTranslatedQuestions(prev => ({
                    ...prev,
                    [current]: { ...qObj, question: tQ, options: tOpts, explanation: tExp }
                }));
            } catch (e) {
                console.error('Translation error', e);
            } finally {
                setTranslating(false);
            }
        };
        translateCurrent();
    }, [current, displayLang, config.lang, initialQuestions, translatedQuestions]);

    useEffect(() => {
        // Fetch real seat mapping on mount
        api.get('/student/seat')
            .then(res => setRealSeat(res.data.seat))
            .catch(err => console.log('No seat assigned for mock test display'));

        // Request Full Screen automatically
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen rejected by browser:', err));
            }
        } catch (e) { console.log('Fullscreen error:', e); }

        // Anti-Cheat: Listen for Fullscreen Exits
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !isSubmittingRef.current) {
                setFullscreenViolations(prev => {
                    const next = prev + 1;
                    setShowCheatWarning(true);
                    if (next >= 5) {
                        setTimeout(() => handleSubmit(true), 3000); // Wait 3s so they read it, then auto-submit as cheat
                    }
                    return next;
                });
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; } return t - 1; }), 1000);
        return () => {
            clearInterval(timerRef.current);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Sync tab when current question changes
    useEffect(() => {
        if (q && q.sectionId !== activeTab) setActiveTab(q.sectionId);
    }, [current, q]);

    const goTo = (idx) => {
        setStatuses(p => ({ ...p, [idx]: p[idx] === 'not_visited' ? 'not_answered' : p[idx] }));
        setCurrent(idx);
    };

    const saveAndNext = () => {
        if (answers[current] !== undefined) setStatuses(p => ({ ...p, [current]: 'answered' }));
        if (current < initialQuestions.length - 1) goTo(current + 1);
    };

    const markAndNext = () => {
        setStatuses(p => ({ ...p, [current]: answers[current] !== undefined ? 'answered_marked' : 'marked' }));
        if (current < initialQuestions.length - 1) goTo(current + 1);
    };

    const clearResponse = () => {
        setAnswers(p => { const n = { ...p }; delete n[current]; return n; });
        setStatuses(p => ({ ...p, [current]: 'not_answered' }));
    };

    const handleSubmit = (isCheating = false) => {
        isSubmittingRef.current = true;
        clearInterval(timerRef.current);

        // Exit full screen
        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.log(err));
            }
        } catch (e) { console.log('Exit fullscreen error:', e); }

        const results = initialQuestions.map((qt, i) => {
            const trans = translatedQuestions[i];
            return {
                ...qt,
                questionTranslated: trans?.question,
                optionsTranslated: trans?.options,
                explanationTranslated: trans?.explanation,
                selected: answers[i] ?? null,
                status: statuses[i],
            };
        });
        onFinish({ results, timeLeft: sessionTime * 60 - timeLeft, maxTime: sessionTime * 60, isCheating: isCheating === true });
    };

    const btnStyle = (bg, c = 'white') => ({ background: bg, color: c, border: `1px solid ${bg === 'white' ? '#cbd5e1' : bg}`, borderRadius: '6px', padding: '10px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' });

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <style>{MOBILE_CSS}</style>
            {/* Top Bar */}
            <div className="test-topbar" style={{ background: '#1a3a6a', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div className="test-topbar-left" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontWeight: '900', fontSize: '20px', letterSpacing: '1px', textTransform: 'uppercase', borderRight: '2px solid rgba(255,255,255,0.3)', paddingRight: '16px' }}>
                        APNA LAKSHAY
                    </div>
                    <div>
                        <div className="exam-title" style={{ fontWeight: '800', fontSize: '15px' }}>{pattern.name} | CBT</div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>Candidate Mock Session</div>
                    </div>
                </div>

                <div className="test-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => setShowInfo(true)} title="Instructions" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <IoInformationCircleOutline size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '4px' }}>
                        {['en', 'hi'].map(l => (
                            <button key={l} onClick={() => setDisplayLang(l)}
                                style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', background: displayLang === l ? 'white' : 'transparent', color: displayLang === l ? '#1a3a6a' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}
                            >{l === 'en' ? 'EN' : 'हिं'}</button>
                        ))}
                    </div>
                    <div style={{ color: urgent ? '#fca5a5' : '#86efac', fontWeight: '800', fontSize: '18px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: '8px', border: urgent ? '1px solid #dc2626' : '1px solid transparent' }}>
                        ⏱ {fmtTime(timeLeft)}
                    </div>
                    <button className="submit-btn" onClick={() => setShowSubmitModal(true)}
                        style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 24px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.4)', transition: 'all 0.2s', textTransform: 'uppercase' }}
                    >SUBMIT EXAM</button>
                </div>
            </div>

            {/* Section Tabs */}
            {sectionIdsPresent.length > 1 && (
                <div style={{ background: 'white', borderBottom: '1px solid #cbd5e1', padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
                    {sectionIdsPresent.map(sId => {
                        const secName = initialQuestions.find(x => x.sectionId === sId)?.sectionName || sId;
                        return (
                            <button key={sId} onClick={() => {
                                setActiveTab(sId);
                                const firstQInSet = initialQuestions.findIndex(x => x.sectionId === sId);
                                if (firstQInSet !== -1) goTo(firstQInSet);
                            }}
                                style={{ padding: '14px 20px', background: 'none', border: 'none', borderBottom: activeTab === sId ? '3px solid #1d4ed8' : '3px solid transparent', color: activeTab === sId ? '#1d4ed8' : '#64748b', fontWeight: activeTab === sId ? '800' : '600', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >{secName}</button>
                        );
                    })}
                </div>
            )}

            <div className="session-layout" style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '16px', gap: '16px', height: sectionIdsPresent.length > 1 ? 'calc(100vh - 120px)' : 'calc(100vh - 70px)' }}>
                {/* Left: Question Area */}
                <div style={{ flex: 1, minWidth: 0, background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Question {current + 1}
                            {sectionIdsPresent.length === 1 && <span style={{ color: '#64748b', fontWeight: '600', fontSize: '12px' }}>({q.sectionName})</span>}
                            {translating && <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px' }}>Translating...</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Marks: +{pattern.positive} / {pattern.negative > 0 ? `-${pattern.negative}` : '0'}</div>
                    </div>

                    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                        <p style={{ color: '#0f172a', fontSize: '16px', lineHeight: '1.8', marginBottom: '32px', fontWeight: '500' }}>{q.question}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(q.options || []).map((opt, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', padding: '14px 16px', borderRadius: '8px', border: answers[current] === i ? '2px solid #2563eb' : '1px solid #e2e8f0', background: answers[current] === i ? '#eff6ff' : 'white', transition: 'all 0.15s' }}>
                                    <input type="radio" name={`q${current}`} checked={answers[current] === i} onChange={() => setAnswers(p => ({ ...p, [current]: i }))}
                                        style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: '#2563eb' }} />
                                    <span style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6' }}>
                                        <b style={{ color: '#2563eb', marginRight: '8px' }}>{['A', 'B', 'C', 'D'][i]}</b> {opt}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="q-action-bar" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#f8fafc' }}>
                        <button onClick={saveAndNext} style={btnStyle('#16a34a')}>SAVE & NEXT</button>
                        <button onClick={clearResponse} style={btnStyle('white', '#475569')}>CLEAR RESPONSE</button>
                        <button onClick={() => { setStatuses(p => ({ ...p, [current]: answers[current] !== undefined ? 'answered_marked' : 'marked' })); }} style={btnStyle('#ea580c')}>SAVE & MARK FOR REVIEW</button>
                        <button onClick={markAndNext} style={btnStyle('#7c3aed')}>MARK FOR REVIEW & NEXT</button>
                    </div>

                    <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                        <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0} style={{ ...btnStyle('white', '#475569'), opacity: current === 0 ? 0.5 : 1 }}>&lt;&lt; BACK</button>
                        {/* Mobile palette toggle */}
                        <button
                            className="palette-toggle-btn"
                            onClick={() => setShowPalette(p => !p)}
                            style={{ display: 'none', background: '#1a3a6a', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        >{showPalette ? 'Hide Panel' : 'Question Palette'}</button>
                        <button onClick={() => goTo(Math.max(initialQuestions.length - 1, current + 1))} disabled={current === initialQuestions.length - 1} style={{ ...btnStyle('white', '#475569'), opacity: current === initialQuestions.length - 1 ? 0.5 : 1 }}>NEXT &gt;&gt;</button>
                    </div>
                </div>

                {/* Right: Palette */}
                <div className={`palette-panel${showPalette ? '' : ' palette-hidden'}`} style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Real User Profile */}
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                            ) : (
                                <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#e2e8f0', backgroundImage: `url('https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Candidate'}')` }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Candidate'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{pattern?.name || 'Mock Exam'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                            <div><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Seat No.</span><b style={{ color: '#0f172a' }}>{realSeat?.number ? `Seat: ${realSeat.number}` : 'Unassigned'}</b></div>
                            <div><span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Shift</span><b style={{ color: '#0f172a' }}>{realSeat?.shift || 'Any'}</b></div>
                        </div>

                        <button onClick={() => setShowAdmitCard(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <IoPersonOutline size={14} /> View ID / Admit Card
                        </button>
                    </div>

                    {/* Palette */}
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div style={{ background: '#1a3a6a', padding: '12px 16px', color: 'white', fontWeight: '800', fontSize: '14px' }}>Question Palette {sectionIdsPresent.length > 1 && `(${activeTab})`}</div>

                        <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {Object.entries(QS).map(([k, c]) => (
                                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, flexShrink: 0, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                            {Object.values(statuses).filter(s => s === k).length}
                                        </div>
                                        <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600', lineHeight: '1.1' }}>{QS_LABEL[k]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexWrap: 'wrap', gap: '10px', alignContent: 'flex-start' }}>
                            {initialQuestions.map((qItem, i) => {
                                // Subtly hide questions not in active tab if showing multiple sections
                                if (sectionIdsPresent.length > 1 && qItem.sectionId !== activeTab) return null;
                                return (
                                    <button key={i} onClick={() => goTo(i)}
                                        style={{
                                            width: '38px', height: '38px', borderRadius: '50%', border: current === i ? '3px solid #0f172a' : '2px solid rgba(0,0,0,0.1)',
                                            background: QS[statuses[i]], color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                                            transform: current === i ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s',
                                            boxShadow: current === i ? '0 4px 10px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >{i + 1}</button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admit Card Modal */}
            <AnimatePresence>
                {showAdmitCard && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdmitCard(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }} />

                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '24px', background: '#fff', position: 'relative' }}>

                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '18px', letterSpacing: '-0.5px' }}>ADMIT CARD</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Provisional E-Admit Card</div>
                                    </div>
                                    <IoScan size={32} color="#94a3b8" />
                                </div>

                                {/* Profile Row */}
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="Profile" style={{ width: '80px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1', background: '#f8fafc' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '90px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IoPersonOutline size={32} color="#cbd5e1" />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Candidate Name</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.2' }}>{user?.name || 'GUEST USER'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Phone Number</div>
                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>+91 {user?.phone || 'XXXXXXXXXX'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Examination</div>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{pattern?.name || 'Mock Assessment'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Seat Number</div>
                                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#2563eb' }}>{realSeat?.number ? `S-${realSeat.number}` : 'UNASSIGNED'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Shift Details</div>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{user?.shift?.name || 'Open Shift'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Valid For</div>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{sessionTime} Minutes</div>
                                    </div>
                                </div>

                                {/* Exam Guidelines Footer */}
                                <div style={{ marginTop: '20px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <IoAlertCircleOutline color="#d97706" size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div style={{ fontSize: '10px', color: '#b45309', lineHeight: '1.4' }}>
                                        <strong>Important:</strong> This is a computer-verified mock admit card. Do not close the browser during the active examination session.
                                    </div>
                                </div>

                                <button onClick={() => setShowAdmitCard(false)} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px', fontSize: '13px' }}>
                                    Close Admit Card
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubmitModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)' }} />

                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ background: '#1e293b', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <IoAlertCircleOutline size={28} color="#facc15" />
                                <div style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>Submit Test Confirmation</div>
                            </div>

                            <div style={{ padding: '24px' }}>
                                <div style={{ marginBottom: '20px', color: '#475569', fontSize: '15px', lineHeight: '1.6' }}>
                                    Are you sure you want to submit the exam? You will not be able to change your answers once submitted.
                                </div>

                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '4px' }}>Test Statistics Overview</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>Total Questions:</span>
                                            <span style={{ fontWeight: '800', color: '#0f172a' }}>{initialQuestions.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>Answered:</span>
                                            <span style={{ fontWeight: '800', color: '#16a34a' }}>{Object.values(statuses).filter(s => s === 'answered' || s === 'answered_marked').length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>Marked for Review:</span>
                                            <span style={{ fontWeight: '800', color: '#7c3aed' }}>{Object.values(statuses).filter(s => s === 'marked' || s === 'answered_marked').length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>Not Visited:</span>
                                            <span style={{ fontWeight: '800', color: '#6b7280' }}>{Object.values(statuses).filter(s => s === 'not_visited').length}</span>
                                        </div>
                                    </div>
                                    <div style={{ background: '#fef2f2', border: '1px dashed #fca5a5', padding: '10px', borderRadius: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '14px' }}>Questions Left (Unanswered):</span>
                                        <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '16px' }}>{initialQuestions.length - Object.values(statuses).filter(s => s === 'answered' || s === 'answered_marked').length}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setShowSubmitModal(false)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    Go Back
                                </button>
                                <button onClick={handleSubmit} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(220,38,38,0.3)', transition: 'all 0.2s' }}>
                                    Confirm Submit <IoArrowForwardOutline />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Anti-Cheat Warning Modal */}
            <AnimatePresence>
                {showCheatWarning && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(10px)' }} />

                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} style={{ position: 'relative', width: '100%', maxWidth: '450px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ background: '#fef2f2', padding: '32px 24px', textAlign: 'center' }}>
                                <IoAlertCircleOutline size={64} color="#dc2626" style={{ margin: '0 auto 16px' }} />
                                <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '900', marginBottom: '12px' }}>WARNING: Full Screen Required</h2>
                                <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
                                    You have exited full-screen mode. Leaving the test environment is considered suspicious activity.
                                </p>
                                <div style={{ background: 'white', border: '2px solid #fca5a5', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                                    <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '800' }}>Warning {fullscreenViolations} of 5</div>
                                    <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: '600' }}>
                                        {fullscreenViolations >= 5 ? 'Maximum violations reached. Test is auto-submitting as INVALID.' : 'Return to full screen immediately to continue.'}
                                    </div>
                                </div>
                                {fullscreenViolations < 5 && (
                                    <button onClick={() => {
                                        setShowCheatWarning(false);
                                        try { document.documentElement.requestFullscreen(); } catch (e) { }
                                    }} style={{ width: '100%', padding: '14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)', transition: 'all 0.2s', textTransform: 'uppercase' }}>
                                        RETURN TO EXAM
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Instructions Modal */}
            <InstructionsModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
        </div >
    );
};

// ─── 4. Advanced Result Dashboard ───────────────────────────────────────
const DashboardCSS = `
.gl-card { background: rgba(25, 30, 48, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; }
.g-text { background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.circ-prog { width: 140px; height: 140px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
.circ-prog::before { content: ""; position: absolute; inset: 10px; border-radius: 50%; background: #0b0f19; }
.circ-val { position: relative; z-index: 10; font-size: 36px; font-weight: 900; color: white; }
`;

const ResultDashboard = ({ data, pattern, onRetry }) => {
    const { results, timeLeft, maxTime, isCheating } = data;
    const [expandedQ, setExpandedQ] = useState(null);

    // Global Stats
    const correct = results.filter(r => r.selected === r.correct).length;
    const wrong = results.filter(r => r.selected !== null && r.selected !== undefined && r.selected !== r.correct).length;
    const skipped = results.length - correct - wrong;

    let totalScore = 0;

    // Section-wise Analysis
    const sectionsObj = {};
    results.forEach(r => {
        if (!sectionsObj[r.sectionId]) {
            sectionsObj[r.sectionId] = { name: r.sectionName, correct: 0, wrong: 0, skipped: 0, total: 0 };
        }
        sectionsObj[r.sectionId].total++;
        if (r.selected === r.correct) sectionsObj[r.sectionId].correct++;
        else if (r.selected !== null && r.selected !== undefined) sectionsObj[r.sectionId].wrong++;
        else sectionsObj[r.sectionId].skipped++;
    });

    const sectionStats = Object.values(sectionsObj).map(sec => {
        const secScore = sec.correct * pattern.positive - sec.wrong * pattern.negative;
        const maxSecScore = sec.total * pattern.positive;
        totalScore += secScore;
        return { ...sec, score: secScore, maxScore: maxSecScore, pct: Math.round((Math.max(0, secScore) / maxSecScore) * 100) || 0 };
    });

    const globalMaxScore = results.length * pattern.positive;
    totalScore = Math.max(0, totalScore);
    const globalPct = Math.round((totalScore / globalMaxScore) * 100);
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;
    const gradeColor = globalPct >= 80 ? '#4ade80' : globalPct >= 60 ? '#60a5fa' : globalPct >= 40 ? '#fbbf24' : '#f87171';

    if (isCheating) {
        return (
            <div style={{ background: '#0b0f19', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px' }}>
                <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '24px', padding: '48px 32px', maxWidth: '600px', textAlign: 'center', backdropFilter: 'blur(16px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                    <div style={{ width: '100px', height: '100px', background: 'rgba(220,38,38,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <IoAlertCircleOutline size={64} color="#ef4444" />
                    </div>
                    <h1 style={{ color: '#fef2f2', fontSize: '36px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>Test Terminated</h1>
                    <p style={{ color: '#fca5a5', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
                        Your mock exam was automatically submitted due to repeated exits from the full-screen environment. This violates the examination protocol and your session is deemed incomplete.
                    </p>
                    <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '900', fontSize: '20px', letterSpacing: '4px', textTransform: 'uppercase', boxShadow: '0 10px 25px rgba(220,38,38,0.4)', marginBottom: '40px' }}>
                        RESULT: INVALID / CHEATING
                    </div>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button onClick={onRetry} style={{ padding: '14px 28px', background: 'transparent', color: '#fca5a5', border: '2px solid #dc2626', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', transition: 'all 0.2s' }}>ATTEMPT AGAIN</button>
                        <Link to="/student"><button style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}>DASHBOARD</button></Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0b0f19', minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
            <style>{DashboardCSS}</style>
            <style>{MOBILE_CSS}</style>

            {/* Header */}
            <div className="result-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}><span className="g-text">Analytics Report</span></h1>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{pattern.name}</div>
                </div>
                <div className="result-header-btns" style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onRetry} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Start New Test</button>
                    <Link to="/student"><button style={{ padding: '10px 20px', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Exit to Dashboard</button></Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Top KPI Cards */}
                <div className="result-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '24px', marginBottom: '24px' }}>

                    {/* Overall Score Circle */}
                    <div className="gl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="circ-prog" style={{ background: `conic-gradient(${gradeColor} ${globalPct}%, rgba(255,255,255,0.05) 0)` }}>
                            <div className="circ-val" style={{ color: gradeColor }}>{globalPct}<span style={{ fontSize: '18px' }}>%</span></div>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '20px', marginBottom: '4px' }}>Normalized Score</h2>
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>{totalScore.toFixed(2)} out of {globalMaxScore} Marks</div>
                    </div>

                    {/* Stats Grid */}
                    <div className="gl-card result-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#4ade80', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{correct}</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Correct</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#f87171', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{wrong}</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Incorrect</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#a78bfa', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{accuracy}%</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Accuracy</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#60a5fa', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{Math.floor(timeLeft / 60)}m</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Time Taken</div>
                        </div>
                    </div>
                </div>

                {/* Section-Wise Analysis Bars */}
                {sectionStats.length > 1 && (
                    <div className="gl-card" style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '4px', height: '18px', background: '#3b82f6', borderRadius: '4px' }}></div>
                            Section-Wise Performance Radar
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            {sectionStats.map((sec, idx) => (
                                <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <b style={{ fontSize: '14px', color: '#e2e8f0' }}>{sec.name}</b>
                                        <b style={{ fontSize: '14px', color: sec.pct >= 60 ? '#4ade80' : sec.pct >= 40 ? '#fbbf24' : '#f87171' }}>{sec.pct}%</b>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                                        <div style={{ height: '100%', width: `${sec.pct}%`, background: sec.pct >= 60 ? '#4ade80' : sec.pct >= 40 ? '#fbbf24' : '#f87171', borderRadius: '4px' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                                        <span>Score: {sec.score.toFixed(1)} / {sec.maxScore}</span>
                                        <span>{sec.correct} C / {sec.wrong} W</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Detailed Q&A Review */}
                <div className="gl-card">
                    <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '18px', background: '#a78bfa', borderRadius: '4px' }}></div>
                        Detailed Question Review
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {results.map((r, i) => {
                            const isCorrect = r.selected === r.correct;
                            const isSkipped = r.selected === null || r.selected === undefined;

                            return (
                                <div key={i} style={{ background: expandedQ === i ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    <button onClick={() => setExpandedQ(expandedQ === i ? null : i)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '16px', color: 'white' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSkipped ? '#475569' : isCorrect ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)', color: isSkipped ? 'white' : isCorrect ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                            {isSkipped ? '—' : isCorrect ? <IoCheckmarkCircle size={18} /> : <IoCloseCircle size={18} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{r.sectionName} — Q{r.id}</div>
                                            <div style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '500', color: '#e2e8f0' }}>{r.question}</div>
                                        </div>
                                    </button>

                                    {expandedQ === i && (
                                        <div style={{ padding: '0 20px 20px 64px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                                {(r.options || []).map((opt, j) => {
                                                    const isSelected = j === r.selected;
                                                    const isActualCorrect = j === r.correct;

                                                    let bg = 'rgba(255,255,255,0.02)';
                                                    let brd = 'rgba(255,255,255,0.05)';
                                                    let txt = '#94a3b8';

                                                    if (isActualCorrect) { bg = 'rgba(74,222,128,0.1)'; brd = 'rgba(74,222,128,0.3)'; txt = '#4ade80'; }
                                                    else if (isSelected) { bg = 'rgba(248,113,113,0.1)'; brd = 'rgba(248,113,113,0.3)'; txt = '#f87171'; }

                                                    return (
                                                        <div key={j} style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${brd}`, background: bg, color: txt, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span><b style={{ opacity: 0.7, marginRight: '8px' }}>{['A', 'B', 'C', 'D'][j]}.</b> {opt}</span>
                                                            {isActualCorrect && <span style={{ fontSize: '10px', background: 'rgba(74,222,128,0.2)', padding: '2px 8px', borderRadius: '4px' }}>✓ Correct Option</span>}
                                                            {isSelected && !isActualCorrect && <span style={{ fontSize: '10px', background: 'rgba(248,113,113,0.2)', padding: '2px 8px', borderRadius: '4px' }}>✗ Your Choice</span>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {r.explanation && (
                                                <div style={{ background: 'rgba(59,130,246,0.1)', borderLeft: '3px solid #3b82f6', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                                                    <b style={{ color: '#60a5fa', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Solution / Explanation:</b>
                                                    <span style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>{r.explanation}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

// ─── Main Controller Component ────────────────────────────────────────
const MockTestPage = () => {
    // phase: select -> info -> test -> result
    const [phase, setPhase] = useState('select');
    const [examCode, setExamCode] = useState(null);
    const [testData, setTestData] = useState(null); // { pattern, config, qs }
    const [resultsData, setResultsData] = useState(null);

    const handleExamSelect = (code) => {
        setExamCode(code);
        setPhase('info');
    };

    const handleStartTest = (pattern, config, qs) => {
        setTestData({ pattern, config, qs });
        setPhase('test');
    };

    const handleFinishTest = (resData) => {
        setResultsData(resData);
        setPhase('result');
    };

    const handleRetry = () => {
        setPhase('select');
        setExamCode(null);
        setTestData(null);
        setResultsData(null);
    };

    return (
        <AnimatePresence mode="wait">
            {phase === 'select' && <motion.div key="p-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ExamSelect onSelect={handleExamSelect} /></motion.div>}

            {phase === 'info' && <motion.div key="p-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><ExamInfoPage examCode={examCode} onStart={handleStartTest} onBack={() => setPhase('select')} /></motion.div>}

            {phase === 'test' && testData && <motion.div key="p-test" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <TestSession initialQuestions={testData.qs} pattern={testData.pattern} config={testData.config} onFinish={handleFinishTest} />
            </motion.div>}

            {phase === 'result' && resultsData && <motion.div key="p-res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ResultDashboard data={resultsData} pattern={testData.pattern} onRetry={handleRetry} />
            </motion.div>}
        </AnimatePresence>
    );
};

export default MockTestPage;
