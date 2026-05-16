import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparkles, IoSave, IoCog, IoChevronUp, IoChevronDown,
    IoEyeOutline, IoEyeOffOutline, IoRefresh, IoFlashOutline, IoPersonOutline,
    IoCheckmarkCircle, IoAlertCircle, IoSearchOutline, IoPencilOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const TABS = ['Quick Actions', 'Learning', 'Doubt Credits', 'Mock Test Credits'];

const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-5 w-9 rounded-full transition-all flex-shrink-0"
        style={{ background: checked ? '#6366f1' : '#e5e7eb' }}>
        <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
);

const CardRow = ({ card, index, total, onMove, onToggle, onToggleNew }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            card.visible ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-50'
        }`}>
        {/* Order buttons */}
        <div className="flex flex-col">
            <button onClick={() => onMove(index, -1)} disabled={index === 0}
                className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><IoChevronUp size={14} /></button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
                className="p-0.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"><IoChevronDown size={14} /></button>
        </div>
        {/* Label */}
        <span className="flex-1 text-sm font-semibold text-gray-800">{card.label}</span>
        {/* NEW badge toggle */}
        <button onClick={() => onToggleNew(index)}
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-all ${
                card.isNew
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600'
            }`}>
            NEW
        </button>
        {/* Visible toggle */}
        <Toggle checked={card.visible} onChange={(v) => onToggle(index, v)} />
    </motion.div>
);

const ManageCards = () => {
    const [activeTab, setTab]           = useState('Quick Actions');
    const [quickActions, setQA]         = useState([]);
    const [learning, setLearning]       = useState([]);
    const [aiConfig, setAiConfig]       = useState({ divisor: 10, defaultCredits: 10 });
    const [students, setStudents]       = useState([]);
    const [mockStudents, setMockStudents] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [toast, setToast]             = useState(null);
    const [search, setSearch]           = useState('');
    const [searchMock, setSearchMock]   = useState('');
    const [editingCredit, setEditing]   = useState(null);
    const [editingMockCredit, setEditingMock] = useState(null);
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

    const moveCard  = (list, setList, idx, dir) => { const arr = [...list]; const to = idx + dir; if (to < 0 || to >= arr.length) return; [arr[idx], arr[to]] = [arr[to], arr[idx]]; arr.forEach((c, i) => (c.order = i)); setList(arr); };
    const toggleCard   = (list, setList, idx, v) => { const a = [...list]; a[idx] = { ...a[idx], visible: v }; setList(a); };
    const toggleNew    = (list, setList, idx) => { const a = [...list]; a[idx] = { ...a[idx], isNew: !a[idx].isNew }; setList(a); };

    const saveSection = async (section, data) => {
        setSaving(true);
        try { await api.put('/admin/card-config', { section, cards: data }); showToast('Saved successfully'); }
        catch { showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const saveAiConfig = async () => {
        setSaving(true);
        try { await api.put('/admin/ai-credit-config', aiConfig); showToast('AI credit config saved'); }
        catch { showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const applyFormula = async () => {
        setSaving(true);
        try { const res = await api.post('/admin/ai-credits/apply-formula'); showToast(res.data.message); loadAll(); }
        catch { showToast('Apply failed', 'error'); }
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
        if (!window.confirm(`Reset ALL students to ${bulkMockValue} mock test credits?`)) return;
        setSaving(true);
        try { const res = await api.post('/admin/mock-test-credits/reset-all', { value: bulkMockValue }); showToast(res.data.message); loadAll(); }
        catch { showToast('Reset failed', 'error'); }
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

    const INPUT = 'w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border ${
                            toast.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        {toast.type === 'success' ? <IoCheckmarkCircle size={16} /> : <IoAlertCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                        <IoCog size={14} className="text-white" />
                    </div>
                    <h1 className="text-gray-900 font-bold text-base flex-1">Manage Cards</h1>
                    <span className="text-xs text-gray-500 font-medium">Student Dashboard Config</span>
                </div>
                {/* Section tabs */}
                <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all ${
                                activeTab === t
                                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* ── Quick Actions ─────────────────────────────────── */}
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
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25">
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Quick Actions'}
                        </button>
                    </div>
                )}

                {/* ── Learning ────────────────────────────────────── */}
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
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25">
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Learning Section'}
                        </button>
                    </div>
                )}

                {/* ── Doubt Credits ─────────────────────────────────── */}
                {activeTab === 'Doubt Credits' && (
                    <div className="space-y-6">
                        {/* Global config */}
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <IoSparkles size={14} className="text-amber-500" />
                                <h3 className="text-gray-900 font-bold text-sm">Credit Formula</h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-4">
                                Default credits per student = <span className="text-amber-600 font-bold">Negotiated Fee ÷ Divisor</span>.
                                If no fee, fallback default is used instead.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Divisor</label>
                                    <input type="number" min="1" value={aiConfig.divisor}
                                        onChange={e => setAiConfig(prev => ({ ...prev, divisor: Number(e.target.value) }))}
                                        className={INPUT} />
                                    <p className="text-[10px] text-gray-500 mt-1">e.g. Fee ₹5000 ÷ 10 = 500 credits</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Fallback Credits (no fee)</label>
                                    <input type="number" min="0" value={aiConfig.defaultCredits}
                                        onChange={e => setAiConfig(prev => ({ ...prev, defaultCredits: Number(e.target.value) }))}
                                        className={INPUT} />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={saveAiConfig} disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white transition-all disabled:opacity-50 shadow-md shadow-amber-500/25">
                                    <IoSave size={13} /> Save Config
                                </button>
                                <button onClick={applyFormula} disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-all">
                                    <IoFlashOutline size={13} /> Apply to All Students
                                </button>
                            </div>
                        </div>

                        {/* Per-student credits */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={14} className="text-gray-500" /> Per-Student Credits
                                </h3>
                                <span className="text-xs text-gray-500">{students.length} students</span>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white border border-gray-200 text-gray-900 text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-indigo-400 placeholder-gray-400 shadow-sm" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredStudents.map(s => {
                                    const isAuto = (s.creditMode || 'auto') === 'auto';
                                    return (
                                        <div key={s._id}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 text-xs font-semibold truncate">{s.name}</p>
                                                <p className="text-gray-500 text-[10px]">{s.studentId} · Fee &#8377;{s.negotiatedFee || 'N/A'} · Suggested: {s.suggestedCredits}</p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${isAuto ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-orange-50 text-orange-700 border-orange-300'}`}>
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

                                            {editingCredit?.id === s._id && !isAuto ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" min="0"
                                                        value={editingCredit.value}
                                                        onChange={e => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                        onKeyDown={e => { if (e.key === 'Enter') saveStudentCredit(s._id, Number(editingCredit.value), 'manual'); if (e.key === 'Escape') setEditing(null); }}
                                                        className="w-16 bg-gray-50 border border-indigo-300 text-gray-900 text-xs rounded-lg px-2 py-1 focus:outline-none text-center"
                                                        autoFocus />
                                                    <button onClick={() => saveStudentCredit(s._id, Number(editingCredit.value), 'manual')}
                                                        className="text-green-600 hover:text-green-700 transition-colors"><IoCheckmarkCircle size={16} /></button>
                                                    <button onClick={() => setEditing(null)}
                                                        className="text-gray-400 hover:text-gray-700 transition-colors text-xs">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm w-8 text-center ${isAuto ? 'text-gray-400' : 'text-indigo-600'}`}>{s.doubtCredits}</span>
                                                    {!isAuto && (
                                                        <button onClick={() => setEditing({ id: s._id, value: s.doubtCredits })}
                                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                                                            <IoPencilOutline size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-gray-500 text-xs py-8">No students found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Mock Test Credits ─────────────────────────────── */}
                {activeTab === 'Mock Test Credits' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <IoSparkles size={14} className="text-green-600" />
                                <h3 className="text-gray-900 font-bold text-sm">Daily Mock Test Allowance</h3>
                            </div>
                            <p className="text-xs text-gray-600">
                                This sets the total allowed tests a student can generate per day. It will automatically reset to 2 at midnight IST unless modified.
                            </p>
                            <div className="flex items-end gap-3 max-w-sm">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Bulk Reset To</label>
                                    <input type="number" min="0" value={bulkMockValue}
                                        onChange={e => setBulkMockValue(Number(e.target.value))}
                                        className={INPUT} />
                                </div>
                                <button onClick={resetAllMockCredits} disabled={saving}
                                    className="flex items-center justify-center gap-2 px-4 py-2 h-[38px] rounded-xl text-xs font-bold border border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-all">
                                    <IoFlashOutline size={13} /> Reset All Now
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={14} className="text-gray-500" /> Per-Student Credits
                                </h3>
                                <span className="text-xs text-gray-500">{mockStudents.length} students</span>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input value={searchMock} onChange={e => setSearchMock(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white border border-gray-200 text-gray-900 text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-green-400 placeholder-gray-400 shadow-sm" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredMockStudents.map(s => (
                                    <div key={s._id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 text-xs font-semibold truncate">{s.name}</p>
                                            <p className="text-gray-500 text-[10px]">{s.studentId} · Seat {s.seatNumber} · Last reset: {s.lastReset || 'Never'}</p>
                                        </div>

                                        {editingMockCredit?.id === s._id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="0"
                                                    value={editingMockCredit.value}
                                                    onChange={e => setEditingMock(prev => ({ ...prev, value: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveMockTestCredit(s._id, Number(editingMockCredit.value)); if (e.key === 'Escape') setEditingMock(null); }}
                                                    className="w-16 bg-gray-50 border border-green-300 text-gray-900 text-xs rounded-lg px-2 py-1 focus:outline-none text-center"
                                                    autoFocus />
                                                <button onClick={() => saveMockTestCredit(s._id, Number(editingMockCredit.value))}
                                                    className="text-green-600 hover:text-green-700 transition-colors"><IoCheckmarkCircle size={16} /></button>
                                                <button onClick={() => setEditingMock(null)}
                                                    className="text-gray-400 hover:text-gray-700 transition-colors text-xs">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm w-8 text-center text-green-600">{s.mockTestCredits}</span>
                                                <button onClick={() => setEditingMock({ id: s._id, value: s.mockTestCredits })}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                                                    <IoPencilOutline size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredMockStudents.length === 0 && (
                                    <p className="text-center text-gray-500 text-xs py-8">No students found</p>
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
