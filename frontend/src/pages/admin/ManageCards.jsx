import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparkles, IoSave, IoCog, IoChevronUp, IoChevronDown,
    IoEyeOutline, IoEyeOffOutline, IoRefresh, IoFlashOutline, IoPersonOutline,
    IoCheckmarkCircle, IoAlertCircle, IoSearchOutline, IoPencilOutline
} from 'react-icons/io5';
import api from '../../utils/api';

// ── Card section tabs ─────────────────────────────────────────────────────────
const TABS = ['Quick Actions', 'Learning', 'Doubt Credits', 'Mock Test Credits'];

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-5 w-9 rounded-full transition-all flex-shrink-0"
        style={{ background: checked ? '#FACC15' : 'rgba(255,255,255,0.12)' }}>
        <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
);

// ── Card row with up/down reorder ─────────────────────────────────────────────
const CardRow = ({ card, index, total, onMove, onToggle, onToggleNew }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl border border-white/6 transition-all"
        style={{ background: card.visible ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', opacity: card.visible ? 1 : 0.45 }}>
        {/* Order buttons */}
        <div className="flex flex-col">
            <button onClick={() => onMove(index, -1)} disabled={index === 0}
                className="p-0.5 rounded text-gray-600 hover:text-white disabled:opacity-20 transition-colors"><IoChevronUp size={14} /></button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
                className="p-0.5 rounded text-gray-600 hover:text-white disabled:opacity-20 transition-colors"><IoChevronDown size={14} /></button>
        </div>
        {/* Label */}
        <span className="flex-1 text-sm font-medium text-white">{card.label}</span>
        {/* NEW badge toggle */}
        <button onClick={() => onToggleNew(index)}
            className="text-[10px] font-black px-2 py-0.5 rounded-full transition-all"
            style={{
                background: card.isNew ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.05)',
                border: card.isNew ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: card.isNew ? '#FACC15' : 'rgba(255,255,255,0.3)',
            }}>
            NEW
        </button>
        {/* Visible toggle */}
        <Toggle checked={card.visible} onChange={(v) => onToggle(index, v)} />
    </motion.div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const ManageCards = () => {
    const [activeTab, setTab]           = useState('Quick Actions');
    const [quickActions, setQA]         = useState([]);
    const [learning, setLearning]       = useState([]);
    const [aiConfig, setAiConfig]       = useState({ divisor: 10, defaultCredits: 10 });
    const [students, setStudents]       = useState([]);
    const [mockStudents, setMockStudents] = useState([]); // Students for Mock Test Credits
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [toast, setToast]             = useState(null);
    const [search, setSearch]           = useState('');
    const [searchMock, setSearchMock]   = useState('');
    const [editingCredit, setEditing]   = useState(null); // { id, value }
    const [editingMockCredit, setEditingMock] = useState(null); // { id, value }
    const [bulkMockValue, setBulkMockValue] = useState(2);

    useEffect(() => { loadAll(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAll = async () => {
        setLoading(true);
        try {
            const [cfg, cred, sts, mockSts] = await Promise.all([
                api.get('/admin/card-config'),
                api.get('/admin/ai-credit-config'),
                api.get('/admin/ai-credits/students'),
                api.get('/admin/mock-test-credits/students'),
            ]);
            setQA(cfg.data.quickActions);
            setLearning(cfg.data.learning);
            setAiConfig(cred.data.config);
            setStudents(sts.data.students);
            setMockStudents(mockSts.data.students);
        } catch { showToast('Failed to load config', 'error'); }
        finally { setLoading(false); }
    };

    // ── card manipulation helpers ─────────────────────────────────────────────
    const moveCard = (list, setList, idx, dir) => {
        const arr = [...list];
        const to = idx + dir;
        if (to < 0 || to >= arr.length) return;
        [arr[idx], arr[to]] = [arr[to], arr[idx]];
        arr.forEach((c, i) => (c.order = i));
        setList(arr);
    };
    const toggleCard   = (list, setList, idx, v) => { const a = [...list]; a[idx] = { ...a[idx], visible: v }; setList(a); };
    const toggleNew    = (list, setList, idx) => { const a = [...list]; a[idx] = { ...a[idx], isNew: !a[idx].isNew }; setList(a); };

    const saveSection = async (section, data) => {
        setSaving(true);
        try {
            await api.put('/admin/card-config', { section, cards: data });
            showToast('Saved successfully');
        } catch { showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const saveAiConfig = async () => {
        setSaving(true);
        try {
            await api.put('/admin/ai-credit-config', aiConfig);
            showToast('AI credit config saved');
        } catch { showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const applyFormula = async () => {
        setSaving(true);
        try {
            const res = await api.post('/admin/ai-credits/apply-formula');
            showToast(res.data.message);
            loadAll();
        } catch { showToast('Apply failed', 'error'); }
        finally { setSaving(false); }
    };

    const saveStudentCredit = async (id, val, creditMode) => {
        try {
            const payload = {};
            if (val != null) payload.doubtCredits = val;
            if (creditMode) payload.creditMode = creditMode;
            const res = await api.patch(`/admin/ai-credits/students/${id}`, payload);
            setStudents(prev => prev.map(s => s._id === id
                ? { ...s, doubtCredits: res.data.student?.doubtCredits ?? val, creditMode: res.data.student?.creditMode ?? creditMode ?? s.creditMode }
                : s));
            setEditing(null);
            showToast('Updated Doubt Credits');
        } catch { showToast('Update failed', 'error'); }
    };

    const saveMockTestCredit = async (id, credits) => {
        try {
            const res = await api.patch(`/admin/mock-test-credits/students/${id}`, { credits });
            setMockStudents(prev => prev.map(s => s._id === id
                ? { ...s, mockTestCredits: res.data.student?.mockTestCredits ?? credits }
                : s));
            setEditingMock(null);
            showToast('Updated Mock Test Credits');
        } catch { showToast('Update failed', 'error'); }
    };

    const resetAllMockCredits = async () => {
        if (!window.confirm(`Are you sure you want to reset ALL students to ${bulkMockValue} mock test credits?`)) return;
        setSaving(true);
        try {
            const res = await api.post('/admin/mock-test-credits/reset-all', { value: bulkMockValue });
            showToast(res.data.message);
            loadAll();
        } catch { showToast('Reset failed', 'error'); }
        finally { setSaving(false); }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredMockStudents = mockStudents.filter(s =>
        s.name.toLowerCase().includes(searchMock.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(searchMock.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#070a10' }}>
                <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#070a10' }}>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl"
                        style={{ background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: toast.type === 'success' ? '#4ade80' : '#f87171' }}>
                        {toast.type === 'success' ? <IoCheckmarkCircle size={16} /> : <IoAlertCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-white/5"
                style={{ background: 'rgba(7,10,16,0.96)', backdropFilter: 'blur(16px)' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <IoCog size={15} className="text-yellow-400" />
                    <h1 className="text-white font-bold text-base flex-1">Manage Cards</h1>
                    <span className="text-xs text-gray-500">Student Dashboard Config</span>
                </div>
                {/* Section tabs */}
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className="text-xs font-bold px-4 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeTab === t ? '#FACC15' : 'rgba(255,255,255,0.05)',
                                color: activeTab === t ? '#000' : 'rgba(255,255,255,0.45)',
                                border: activeTab === t ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            }}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* ── Quick Actions ─────────────────────────────────────────── */}
                {activeTab === 'Quick Actions' && (
                    <div>
                        <p className="text-xs text-gray-500 mb-4">Toggle visibility, mark as NEW (will blink on student dashboard), and reorder with ▲▼ arrows.</p>
                        <div className="space-y-2 mb-6">
                            {quickActions.map((card, i) => (
                                <CardRow key={card.id} card={card} index={i} total={quickActions.length}
                                    onMove={(idx, dir) => moveCard(quickActions, setQA, idx, dir)}
                                    onToggle={(idx, v) => toggleCard(quickActions, setQA, idx, v)}
                                    onToggleNew={(idx) => toggleNew(quickActions, setQA, idx)} />
                            ))}
                        </div>
                        <button onClick={() => saveSection('quickActions', quickActions)} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: '#FACC15', color: '#000' }}>
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Quick Actions'}
                        </button>
                    </div>
                )}

                {/* ── Learning ──────────────────────────────────────────────── */}
                {activeTab === 'Learning' && (
                    <div>
                        <p className="text-xs text-gray-500 mb-4">Control which learning cards are visible and their order in the Learning section.</p>
                        <div className="space-y-2 mb-6">
                            {learning.map((card, i) => (
                                <CardRow key={card.id} card={card} index={i} total={learning.length}
                                    onMove={(idx, dir) => moveCard(learning, setLearning, idx, dir)}
                                    onToggle={(idx, v) => toggleCard(learning, setLearning, idx, v)}
                                    onToggleNew={(idx) => toggleNew(learning, setLearning, idx)} />
                            ))}
                        </div>
                        <button onClick={() => saveSection('learning', learning)} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            style={{ background: '#FACC15', color: '#000' }}>
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Learning Section'}
                        </button>
                    </div>
                )}

                {/* ── Doubt Credits ────────────────────────────────────────────── */}
                {activeTab === 'Doubt Credits' && (
                    <div className="space-y-6">
                        {/* Global config */}
                        <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(250,204,21,0.04)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <IoSparkles size={14} className="text-yellow-400" />
                                <h3 className="text-white font-bold text-sm">Credit Formula</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Default credits per student = <span className="text-yellow-400 font-bold">Negotiated Fee ÷ Divisor</span>.
                                If no fee, fallback default is used instead.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Divisor</label>
                                    <input type="number" min="1" value={aiConfig.divisor}
                                        onChange={e => setAiConfig(prev => ({ ...prev, divisor: Number(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-400/30"
                                    />
                                    <p className="text-[10px] text-gray-600 mt-1">e.g. Fee ₹5000 ÷ 10 = 500 credits</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Fallback Credits (no fee)</label>
                                    <input type="number" min="0" value={aiConfig.defaultCredits}
                                        onChange={e => setAiConfig(prev => ({ ...prev, defaultCredits: Number(e.target.value) }))}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-400/30"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={saveAiConfig} disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    style={{ background: '#FACC15', color: '#000' }}>
                                    <IoSave size={13} /> Save Config
                                </button>
                                <button onClick={applyFormula} disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/5 disabled:opacity-50">
                                    <IoFlashOutline size={13} /> Apply to All Students
                                </button>
                            </div>
                        </div>

                        {/* Per-student credits */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={14} className="text-gray-400" /> Per-Student Credits
                                </h3>
                                <span className="text-xs text-gray-600">{students.length} students</span>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white/5 border border-white/8 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-yellow-400/30 placeholder-gray-600" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredStudents.map(s => {
                                    const isAuto = (s.creditMode || 'auto') === 'auto';
                                    return (
                                        <div key={s._id}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6"
                                            style={{ background: 'rgba(255,255,255,0.025)' }}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-semibold truncate">{s.name}</p>
                                                <p className="text-gray-600 text-[10px]">{s.studentId} · Fee &#8377;{s.negotiatedFee || 'N/A'} · Suggested: {s.suggestedCredits}</p>
                                            </div>

                                            {/* Auto / Manual toggle */}
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isAuto ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'}`}>
                                                    {isAuto ? 'AUTO' : 'MANUAL'}
                                                </span>
                                                <Toggle
                                                    checked={isAuto}
                                                    onChange={async (val) => {
                                                        const newMode = val ? 'auto' : 'manual';
                                                        await saveStudentCredit(s._id, s.doubtCredits, newMode);
                                                    }}
                                                />
                                            </div>

                                            {/* Credit display / edit (only editable in manual mode) */}
                                            {editingCredit?.id === s._id && !isAuto ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" min="0"
                                                        value={editingCredit.value}
                                                        onChange={e => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                        onKeyDown={e => { if (e.key === 'Enter') saveStudentCredit(s._id, Number(editingCredit.value), 'manual'); if (e.key === 'Escape') setEditing(null); }}
                                                        className="w-16 bg-white/10 border border-yellow-400/30 text-white text-xs rounded-lg px-2 py-1 focus:outline-none text-center"
                                                        autoFocus />
                                                    <button onClick={() => saveStudentCredit(s._id, Number(editingCredit.value), 'manual')}
                                                        className="text-green-400 hover:text-green-300 transition-colors"><IoCheckmarkCircle size={16} /></button>
                                                    <button onClick={() => setEditing(null)}
                                                        className="text-gray-500 hover:text-white transition-colors text-xs">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm w-8 text-center ${isAuto ? 'text-gray-500' : 'text-yellow-400'}`}>{s.doubtCredits}</span>
                                                    {!isAuto && (
                                                        <button onClick={() => setEditing({ id: s._id, value: s.doubtCredits })}
                                                            className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all">
                                                            <IoPencilOutline size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-gray-700 text-xs py-8">No students found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Mock Test Credits ────────────────────────────────────────────── */}
                {activeTab === 'Mock Test Credits' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/8 p-5 flex flex-col gap-4" style={{ background: 'rgba(34,197,94,0.04)' }}>
                            <div className="flex items-center gap-2">
                                <IoSparkles size={14} className="text-green-400" />
                                <h3 className="text-white font-bold text-sm">Daily Mock Test Allowance</h3>
                            </div>
                            <p className="text-xs text-gray-500">
                                This sets the total allowed tests a student can generate per day. It will automatically reset to 2 at midnight IST unless modified.
                            </p>
                            <div className="flex items-end gap-3 max-w-sm">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 mb-1 block">Bulk Reset To</label>
                                    <input type="number" min="0" value={bulkMockValue}
                                        onChange={e => setBulkMockValue(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-green-400/30"
                                    />
                                </div>
                                <button onClick={resetAllMockCredits} disabled={saving}
                                    className="flex items-center justify-center gap-2 px-4 py-2 h-[38px] rounded-xl text-xs font-bold transition-all border border-green-400/20 text-green-400 hover:bg-green-400/5 disabled:opacity-50">
                                    <IoFlashOutline size={13} /> Reset All Now
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={14} className="text-gray-400" /> Per-Student Credits
                                </h3>
                                <span className="text-xs text-gray-600">{mockStudents.length} students</span>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input value={searchMock} onChange={e => setSearchMock(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white/5 border border-white/8 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-green-400/30 placeholder-gray-600" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredMockStudents.map(s => {
                                    return (
                                        <div key={s._id}
                                            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/6"
                                            style={{ background: 'rgba(255,255,255,0.025)' }}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-semibold truncate">{s.name}</p>
                                                <p className="text-gray-600 text-[10px]">{s.studentId} · Seat {s.seatNumber} · Last reset: {s.lastReset || 'Never'}</p>
                                            </div>

                                            {editingMockCredit?.id === s._id ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" min="0"
                                                        value={editingMockCredit.value}
                                                        onChange={e => setEditingMock(prev => ({ ...prev, value: e.target.value }))}
                                                        onKeyDown={e => { if (e.key === 'Enter') saveMockTestCredit(s._id, Number(editingMockCredit.value)); if (e.key === 'Escape') setEditingMock(null); }}
                                                        className="w-16 bg-white/10 border border-green-400/30 text-white text-xs rounded-lg px-2 py-1 focus:outline-none text-center"
                                                        autoFocus />
                                                    <button onClick={() => saveMockTestCredit(s._id, Number(editingMockCredit.value))}
                                                        className="text-green-400 hover:text-green-300 transition-colors"><IoCheckmarkCircle size={16} /></button>
                                                    <button onClick={() => setEditingMock(null)}
                                                        className="text-gray-500 hover:text-white transition-colors text-xs">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm w-8 text-center text-green-400">{s.mockTestCredits}</span>
                                                    <button onClick={() => setEditingMock({ id: s._id, value: s.mockTestCredits })}
                                                        className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-all">
                                                        <IoPencilOutline size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredMockStudents.length === 0 && (
                                    <p className="text-center text-gray-700 text-xs py-8">No students found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageCards;
