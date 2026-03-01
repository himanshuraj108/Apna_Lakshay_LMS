import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTrophyOutline, IoRefreshOutline } from 'react-icons/io5';
import api from '../../utils/api';

// ─── Exam Groups Data ─────────────────────────────────────────────────
const EXAM_GROUPS = [
    {
        id: 'ssc', name: 'SSC', color: '#1d4ed8', bg: '#eff6ff',
        exams: [
            { code: 'ssc_cgl', name: 'SSC CGL', desc: 'Combined Graduate Level', duration: 60, positive: 2, negative: 0.5 },
            { code: 'ssc_chsl', name: 'SSC CHSL', desc: 'Combined Higher Secondary Level (10+2)', duration: 60, positive: 2, negative: 0.5 },
            { code: 'ssc_gd', name: 'SSC GD Constable', desc: 'General Duty Constable', duration: 60, positive: 1, negative: 0.25 },
            { code: 'ssc_mts', name: 'SSC MTS', desc: 'Multi Tasking Staff', duration: 90, positive: 1, negative: 0 },
            { code: 'ssc_cpo', name: 'SSC CPO', desc: 'SI / ASI in CAPF (Paper-I)', duration: 120, positive: 2, negative: 0.5 },
        ],
    },
    {
        id: 'upsc', name: 'UPSC', color: '#b91c1c', bg: '#fef2f2',
        exams: [
            { code: 'upsc_cse', name: 'UPSC CSE Prelims', desc: 'Civil Services (IAS/IPS/IFS) GS Paper-1', duration: 120, positive: 2, negative: 0.66 },
            { code: 'upsc_cds', name: 'UPSC CDS', desc: 'Combined Defence Services', duration: 120, positive: 1, negative: 0.33 },
            { code: 'upsc_nda', name: 'UPSC NDA / NA', desc: 'National Defence Academy — GA Paper', duration: 150, positive: 2.5, negative: 0.83 },
        ],
    },
    {
        id: 'banking', name: 'Banking', color: '#15803d', bg: '#f0fdf4',
        exams: [
            { code: 'ibps_po', name: 'IBPS PO', desc: 'Probationary Officer Prelims', duration: 60, positive: 1, negative: 0.25 },
            { code: 'ibps_clerk', name: 'IBPS Clerk', desc: 'Clerk Prelims', duration: 60, positive: 1, negative: 0.25 },
            { code: 'sbi_po', name: 'SBI PO', desc: 'SBI Probationary Officer Prelims', duration: 60, positive: 1, negative: 0.25 },
            { code: 'sbi_clerk', name: 'SBI Clerk', desc: 'Junior Associates Prelims', duration: 60, positive: 1, negative: 0.25 },
        ],
    },
    {
        id: 'rrb', name: 'RRB / Railway', color: '#0369a1', bg: '#f0f9ff',
        exams: [
            { code: 'rrb_ntpc', name: 'RRB NTPC', desc: 'Non-Technical Popular Categories', duration: 90, positive: 1, negative: 0.33 },
            { code: 'rrb_gd', name: 'RRB Group D', desc: 'Level-1 Posts', duration: 90, positive: 1, negative: 0.33 },
            { code: 'rrb_alp', name: 'RRB ALP', desc: 'Assistant Loco Pilot & Technician', duration: 60, positive: 1, negative: 0.33 },
        ],
    },
    {
        id: 'nta', name: 'NTA / JEE / NEET', color: '#7c3aed', bg: '#faf5ff',
        exams: [
            { code: 'jee_main', name: 'JEE Main', desc: 'Joint Entrance Exam — PCM', duration: 180, positive: 4, negative: 1 },
            { code: 'neet_ug', name: 'NEET UG', desc: 'Medical Entrance — PCB', duration: 200, positive: 4, negative: 1 },
            { code: 'cuet', name: 'CUET UG', desc: 'Common University Entrance Test', duration: 60, positive: 5, negative: 1 },
        ],
    },
    {
        id: 'other', name: 'Other Exams', color: '#b45309', bg: '#fffbeb',
        exams: [
            { code: 'delhi_police', name: 'Delhi Police', desc: 'Constable / Head Constable Recruitment', duration: 90, positive: 1, negative: 0.25 },
            { code: 'ctet', name: 'CTET', desc: 'Central Teacher Eligibility Test P-1', duration: 150, positive: 1, negative: 0 },
        ],
    },
];

const QS = { not_visited: '#6b7280', not_answered: '#ef4444', answered: '#16a34a', marked: '#7c3aed', answered_marked: '#4338ca' };
const QS_LABEL = { not_visited: 'Not Visited', not_answered: 'Not Answered', answered: 'Answered', marked: 'Marked for Review', answered_marked: 'Answered & Marked' };

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ─── Exam Select ──────────────────────────────────────────────────────
const ExamSelect = ({ onProceed }) => {
    const [sel, setSel] = useState(null); // selected exam object
    const [count, setCount] = useState(10);
    const [difficulty, setDifficulty] = useState('medium');
    const [lang, setLang] = useState('en');

    const Chip = ({ options, val, onChange }) => (
        <div className="flex gap-2 flex-wrap">
            {options.map(o => (
                <button key={o.v} onClick={() => onChange(o.v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={val === o.v ? { background: '#1a3a6a', color: 'white', borderColor: '#1a3a6a' } : { background: 'white', color: '#374151', borderColor: '#d1d5db' }}
                >{o.l}</button>
            ))}
        </div>
    );

    return (
        <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
            {/* NTA-style header */}
            <div style={{ background: '#1a3a6a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'white' }}>
                    <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>Apna Lakshay</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>AI Mock Test Portal</div>
                </div>
                <Link to="/student">
                    <button style={{ color: 'white', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IoArrowBack size={14} /> Dashboard
                    </button>
                </Link>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6">
                <h2 style={{ color: '#1a3a6a', fontWeight: '800', fontSize: '20px', marginBottom: '6px' }}>Select Your Exam</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>Choose an exam, configure your practice test, and start immediately.</p>

                {/* Exam groups */}
                {EXAM_GROUPS.map(grp => (
                    <div key={grp.id} style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: grp.color, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{grp.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                            {grp.exams.map(exam => (
                                <button key={exam.code} onClick={() => setSel(exam)}
                                    style={{
                                        textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                                        border: sel?.code === exam.code ? `2px solid ${grp.color}` : '1px solid #e2e8f0',
                                        background: sel?.code === exam.code ? grp.bg : '#fafafa',
                                    }}
                                >
                                    <div style={{ fontWeight: '700', fontSize: '13px', color: grp.color }}>{exam.name}</div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{exam.desc}</div>
                                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                                        ✅ +{exam.positive} &nbsp;{exam.negative > 0 ? `❌ −${exam.negative}` : '✔ No Negative'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Config + start */}
                {sel && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginTop: '4px' }}
                    >
                        <div style={{ fontWeight: '700', color: '#1a3a6a', marginBottom: '16px', fontSize: '15px' }}>Configure: {sel.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Questions</p>
                                <Chip options={[{ v: 5, l: '5' }, { v: 10, l: '10' }, { v: 15, l: '15' }]} val={count} onChange={setCount} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Difficulty</p>
                                <Chip options={[{ v: 'easy', l: '🟢 Easy' }, { v: 'medium', l: '🟡 Medium' }, { v: 'hard', l: '🔴 Hard' }]} val={difficulty} onChange={setDifficulty} />
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Language</p>
                                <Chip options={[{ v: 'en', l: '🇬🇧 English' }, { v: 'hi', l: '🇮🇳 Hindi' }]} val={lang} onChange={setLang} />
                            </div>
                        </div>
                        <button onClick={() => onProceed(sel, { count, difficulty, lang })}
                            style={{ background: '#1a3a6a', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 32px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                        >Proceed to Instructions →</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// ─── Instructions Screen ──────────────────────────────────────────────
const InstructionsPage = ({ exam, config, onStart, loading, error }) => (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }}>
        <div style={{ background: '#1a3a6a', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>Apna Lakshay — AI Mock Test</div>
            <div style={{ color: 'white', fontSize: '13px', opacity: 0.8 }}>{exam.name} · {config.count} Questions · {exam.duration} min</div>
        </div>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                <h2 style={{ color: '#1a3a6a', fontWeight: '800', fontSize: '18px', marginBottom: '16px' }}>General Instructions</h2>
                {/* Color legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {Object.entries(QS).map(([k, c]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>1</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#374151' }}>{QS_LABEL[k]}</span>
                        </div>
                    ))}
                </div>
                <ul style={{ color: '#374151', fontSize: '13px', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '20px' }}>
                    <li>This test contains <b>{config.count} questions</b> of {config.difficulty} difficulty on <b>{exam.name}</b>.</li>
                    <li>Each correct answer carries <b>+{exam.positive} mark(s)</b>. {exam.negative > 0 ? <span>Wrong answer carries <b>−{exam.negative} mark(s)</b> (negative marking).</span> : <span>There is <b>no negative marking</b>.</span>}</li>
                    <li>Click <b>SAVE & NEXT</b> to save your answer and move to the next question.</li>
                    <li>Click <b>MARK FOR REVIEW & NEXT</b> to flag a question and revisit later.</li>
                    <li>Click <b>CLEAR RESPONSE</b> to remove a selected answer.</li>
                    <li>Use the <b>Question Palette</b> on the right to jump to any question.</li>
                    <li>Click <b>SUBMIT</b> when you are done. You cannot change answers after submitting.</li>
                    <li>The timer is displayed in the top bar. Submit before time runs out.</li>
                </ul>
                <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b', marginBottom: '20px', fontSize: '13px', color: '#92400e' }}>
                    <b>Marking Scheme:</b> Correct: +{exam.positive} &nbsp;|&nbsp; Wrong: {exam.negative > 0 ? `−${exam.negative}` : '0 (no deduction)'} &nbsp;|&nbsp; Not Attempted: 0
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
                <button onClick={onStart} disabled={loading}
                    style={{ background: '#1a3a6a', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 32px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Generating Questions…' : 'I am ready — Start Test ➜'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Test Session (NTA-Style) ─────────────────────────────────────────
const TestSession = ({ questionsEN, questionsHI, exam, config, onFinish }) => {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [statuses, setStatuses] = useState(() => Object.fromEntries(questionsEN.map((_, i) => [i, 'not_visited'])));
    const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
    const [displayLang, setDisplayLang] = useState(config.lang || 'en');
    const timerRef = useRef();

    const questions = displayLang === 'hi' ? questionsHI : questionsEN;
    const q = questions[current];
    const urgent = timeLeft < 300;

    useEffect(() => {
        timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; } return t - 1; }), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    const goTo = (idx) => {
        setStatuses(p => ({ ...p, [idx]: p[idx] === 'not_visited' ? 'not_answered' : p[idx] }));
        setCurrent(idx);
    };

    const saveAndNext = () => {
        if (answers[current] !== undefined) setStatuses(p => ({ ...p, [current]: 'answered' }));
        if (current < questions.length - 1) goTo(current + 1);
    };

    const markAndNext = () => {
        setStatuses(p => ({ ...p, [current]: answers[current] !== undefined ? 'answered_marked' : 'marked' }));
        if (current < questions.length - 1) goTo(current + 1);
    };

    const clearResponse = () => {
        setAnswers(p => { const n = { ...p }; delete n[current]; return n; });
        setStatuses(p => ({ ...p, [current]: 'not_answered' }));
    };

    const handleSubmit = () => {
        clearInterval(timerRef.current);
        // Pass both EN and HI results so result screen can show both
        const results = questionsEN.map((q, i) => ({
            ...q,
            questionHI: questionsHI[i]?.question,
            optionsHI: questionsHI[i]?.options,
            selected: answers[i] ?? null,
            status: statuses[i],
        }));
        onFinish(results);
    };

    const btnStyle = (bg) => ({ background: bg, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 14px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' });

    return (
        <div style={{ background: '#e8eaf0', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#1a3a6a', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ color: 'white' }}>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>Apna Lakshay</div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>{exam.name}</div>
                </div>
                <div style={{ color: urgent ? '#fca5a5' : '#86efac', fontWeight: '800', fontSize: '18px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: '8px' }}>
                    ⏱ {fmtTime(timeLeft)}
                </div>
                {/* Language toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '3px' }}>
                    {['en', 'hi'].map(l => (
                        <button key={l} onClick={() => setDisplayLang(l)}
                            style={{
                                padding: '5px 12px', borderRadius: '6px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                background: displayLang === l ? 'white' : 'transparent',
                                color: displayLang === l ? '#1a3a6a' : 'rgba(255,255,255,0.7)',
                                transition: 'all 0.2s'
                            }}
                        >{l === 'en' ? 'EN' : 'हिं'}</button>
                    ))}
                </div>
                <button onClick={() => { if (window.confirm('Submit the test now?')) handleSubmit(); }}
                    style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >SUBMIT</button>
            </div>

            {/* Candidate info bar */}
            <div style={{ background: '#f0f4ff', borderBottom: '1px solid #c7d2fe', padding: '6px 20px', display: 'flex', gap: '24px', fontSize: '12px', color: '#374151' }}>
                <span><b>Exam:</b> {exam.name}</span>
                <span><b>Difficulty:</b> {config.difficulty}</span>
                <span><b>Questions:</b> {questions.length}</span>
                <span><b>Marking:</b> +{exam.positive} / {exam.negative > 0 ? `−${exam.negative}` : 'No Negative'}</span>
            </div>

            <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '12px 12px', gap: '12px' }}>
                {/* Question Area */}
                <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden' }}>
                    <div style={{ background: '#e8f0fe', padding: '10px 16px', borderBottom: '1px solid #d1d5db' }}>
                        <span style={{ fontWeight: '700', color: '#1a3a6a', fontSize: '14px' }}>Question {current + 1} :</span>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <p style={{ color: '#111827', fontSize: '14px', lineHeight: '1.8', marginBottom: '20px', fontWeight: '500' }}>{q.question}</p>
                        <p style={{ color: '#374151', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>Options :</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(q.options || []).map((opt, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '6px', border: answers[current] === i ? '2px solid #1a3a6a' : '1px solid #e5e7eb', background: answers[current] === i ? '#eff6ff' : '#fafafa', transition: 'all 0.15s' }}>
                                    <input type="radio" name={`q${current}`} checked={answers[current] === i} onChange={() => setAnswers(p => ({ ...p, [current]: i }))}
                                        style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#1a3a6a' }} />
                                    <span style={{ fontSize: '13px', color: '#111827', lineHeight: '1.6' }}>
                                        <b style={{ color: '#1a3a6a' }}>{['A', 'B', 'C', 'D'][i]}.</b> {opt}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#f8fafc' }}>
                        <button onClick={saveAndNext} style={btnStyle('#1d4ed8')}>SAVE & NEXT</button>
                        <button onClick={clearResponse} style={btnStyle('#6b7280')}>CLEAR RESPONSE</button>
                        <button onClick={() => { setStatuses(p => ({ ...p, [current]: answers[current] !== undefined ? 'answered_marked' : 'marked' })); }}
                            style={btnStyle('#d97706')}>SAVE & MARK FOR REVIEW</button>
                        <button onClick={markAndNext} style={btnStyle('#7c3aed')}>MARK FOR REVIEW & NEXT</button>
                    </div>

                    {/* Nav footer */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}
                            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: '600', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }}>
                            &lt;&lt; BACK
                        </button>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{current + 1} / {questions.length}</span>
                        <button onClick={() => goTo(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
                            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 16px', fontSize: '12px', fontWeight: '600', cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: current === questions.length - 1 ? 0.5 : 1 }}>
                            NEXT &gt;&gt;
                        </button>
                    </div>
                </div>

                {/* Right Panel — Palette */}
                <div style={{ width: '240px', flexShrink: 0 }}>
                    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden' }}>
                        <div style={{ background: '#1a3a6a', padding: '10px 14px', color: 'white', fontWeight: '700', fontSize: '13px' }}>Question Palette</div>
                        {/* Legend */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                            {Object.entries(QS).map(([k, c]) => (
                                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, flexShrink: 0 }} />
                                    <span style={{ fontSize: '10px', color: '#374151' }}>{QS_LABEL[k]}</span>
                                </div>
                            ))}
                        </div>
                        {/* Numbers grid */}
                        <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {questions.map((_, i) => (
                                <button key={i} onClick={() => goTo(i)}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%', border: current === i ? '3px solid #111827' : '2px solid rgba(0,0,0,0.1)',
                                        background: QS[statuses[i]], color: 'white', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                        outline: current === i ? '2px solid #111827' : 'none', transform: current === i ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'all 0.15s',
                                    }}
                                >{i + 1}</button>
                            ))}
                        </div>
                        {/* Stats */}
                        <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', fontSize: '11px', color: '#374151' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span>Answered:</span><b style={{ color: '#16a34a' }}>{Object.values(statuses).filter(s => s === 'answered' || s === 'answered_marked').length}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span>Not Answered:</span><b style={{ color: '#ef4444' }}>{Object.values(statuses).filter(s => s === 'not_answered').length}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Not Visited:</span><b style={{ color: '#6b7280' }}>{Object.values(statuses).filter(s => s === 'not_visited').length}</b>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Result Screen ────────────────────────────────────────────────────
const BG = `
@keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-60px)}}
.shimmer-text{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:sh 4s linear infinite;}
@keyframes sh{0%{background-position:200% center}100%{background-position:-200% center}}
.card-g{background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);}
`;

const ResultScreen = ({ results, exam, config, onRetry }) => {
    const [expanded, setExpanded] = useState(null);
    const correct = results.filter(r => r.selected === r.correct).length;
    const wrong = results.filter(r => r.selected !== null && r.selected !== undefined && r.selected !== r.correct).length;
    const skipped = results.filter(r => r.selected === null || r.selected === undefined).length;
    const score = correct * exam.positive - wrong * exam.negative;
    const maxScore = results.length * exam.positive;
    const pct = Math.round((Math.max(0, score) / maxScore) * 100);
    const grade = pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
    const gradeColor = { A: '#4ade80', B: '#60a5fa', C: '#fbbf24', D: '#f87171' };

    return (
        <div style={{ background: '#050508', minHeight: '100vh', color: 'white' }}>
            <style>{BG}</style>
            <div style={{ animation: 'orb1 14s ease-in-out infinite', position: 'fixed', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,58,237,0.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ maxWidth: '750px', margin: '0 auto', padding: '32px 16px 80px' }}>
                {/* Score card */}
                <div className="card-g" style={{ borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
                    <div className="shimmer-text" style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px' }}>Test Complete!</div>
                    <div style={{ fontSize: '72px', fontWeight: '900', color: gradeColor[grade], lineHeight: 1 }}>{grade}</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', margin: '8px 0' }}>{pct}%</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px' }}>Score: {score.toFixed(2)} / {maxScore}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: '#4ade80', fontWeight: '800', fontSize: '24px' }}>{correct}</div><div style={{ color: 'rgba(255,255,255,0.5)' }}>Correct</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ color: '#f87171', fontWeight: '800', fontSize: '24px' }}>{wrong}</div><div style={{ color: 'rgba(255,255,255,0.5)' }}>Wrong</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ color: '#94a3b8', fontWeight: '800', fontSize: '24px' }}>{skipped}</div><div style={{ color: 'rgba(255,255,255,0.5)' }}>Skipped</div></div>
                    </div>
                </div>

                {/* Q review */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {results.map((r, i) => {
                        const isCorrect = r.selected === r.correct;
                        const isSkipped = r.selected === null || r.selected === undefined;
                        return (
                            <div key={i} className="card-g" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'white', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: isSkipped ? '#94a3b8' : isCorrect ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                                        {isSkipped ? '—' : isCorrect ? <IoCheckmarkCircle size={18} /> : <IoCloseCircle size={18} />}
                                    </span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{i + 1}. {r.question}</span>
                                </button>
                                {expanded === i && (
                                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        {(r.options || []).map((opt, j) => (
                                            <div key={j} style={{ padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '12px', border: '1px solid', borderColor: j === r.correct ? '#16a34a55' : j === r.selected && !isCorrect ? '#dc262655' : 'rgba(255,255,255,0.05)', background: j === r.correct ? 'rgba(22,163,74,0.12)' : j === r.selected && !isCorrect ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.02)', color: j === r.correct ? '#4ade80' : j === r.selected && !isCorrect ? '#f87171' : '#9ca3af' }}>
                                                <b>{['A', 'B', 'C', 'D'][j]}.</b> {opt}
                                                {j === r.correct && <span style={{ fontSize: '10px', marginLeft: '8px' }}>✓ Correct</span>}
                                                {j === r.selected && j !== r.correct && <span style={{ fontSize: '10px', marginLeft: '8px' }}>✗ Your Answer</span>}
                                            </div>
                                        ))}
                                        {r.explanation && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>💡 {r.explanation}</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/student" style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>← Dashboard</button>
                    </Link>
                    <button onClick={onRetry} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#7c3aed,#4338ca)', border: 'none', color: 'white', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <IoRefreshOutline size={16} /> Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────
const MockTestPage = () => {
    const [phase, setPhase] = useState('select');
    const [selectedExam, setSelectedExam] = useState(null);
    const [testConfig, setTestConfig] = useState(null);
    const [questionsEN, setQuestionsEN] = useState([]);
    const [questionsHI, setQuestionsHI] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleProceed = (exam, cfg) => {
        setSelectedExam(exam); setTestConfig(cfg);
        setPhase('instructions');
    };

    const handleStart = async () => {
        setLoading(true); setError(null);
        try {
            // Generate both languages in parallel for instant mid-test switching
            const [resEN, resHI] = await Promise.all([
                api.post('/student/mock-test/generate', { examCode: selectedExam.code, ...testConfig, lang: 'en' }),
                api.post('/student/mock-test/generate', { examCode: selectedExam.code, ...testConfig, lang: 'hi' }),
            ]);
            setQuestionsEN(resEN.data.questions);
            setQuestionsHI(resHI.data.questions);
            setPhase('test');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate. Please try again.');
        } finally { setLoading(false); }
    };

    const handleFinish = (res) => { setResults(res); setPhase('result'); };
    const handleRetry = () => { setPhase('select'); setResults(null); setQuestionsEN([]); setQuestionsHI([]); };

    return (
        <AnimatePresence mode="wait">
            {phase === 'select' && <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ExamSelect onProceed={handleProceed} /></motion.div>}
            {phase === 'instructions' && <motion.div key="instructions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><InstructionsPage exam={selectedExam} config={testConfig} onStart={handleStart} loading={loading} error={error} /></motion.div>}
            {phase === 'test' && questionsEN.length > 0 && <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TestSession questionsEN={questionsEN} questionsHI={questionsHI} exam={selectedExam} config={testConfig} onFinish={handleFinish} /></motion.div>}
            {phase === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResultScreen results={results} exam={selectedExam} config={testConfig} onRetry={handleRetry} /></motion.div>}
        </AnimatePresence>
    );
};

export default MockTestPage;
