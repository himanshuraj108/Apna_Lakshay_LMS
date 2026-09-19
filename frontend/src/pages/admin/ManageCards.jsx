import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoSparkles, IoSave, IoCog, IoChevronUp, IoChevronDown,
    IoEyeOutline, IoEyeOffOutline, IoRefresh, IoFlashOutline, IoPersonOutline,
    IoCheckmarkCircle, IoAlertCircle, IoSearchOutline, IoPencilOutline, IoChatbubblesOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import StudentChatHistory from './StudentChatHistory';


const TABS = ['Quick Actions', 'Learning', 'AI Study Suite', 'Doubt Credits', 'Mock Test Credits', 'AI Chat History'];

const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center h-5 w-9 rounded-full transition-all flex-shrink-0 cursor-pointer"
        style={{ background: checked ? '#F97316' : '#E2DBD2' }}>
        <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
    </button>
);

const CardRow = ({ card, index, total, onMove, onToggle, onToggleNew }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
            card.visible ? 'bg-white border-[#EDE8E0] shadow-xs hover:border-orange-200' : 'bg-[#FAF6F0] border-[#EDE8E0] opacity-55'
        }`}>
        {/* Order buttons */}
        <div className="flex flex-col">
            <button onClick={() => onMove(index, -1)} disabled={index === 0}
                className="p-0.5 rounded text-stone-400 hover:text-orange-600 disabled:opacity-20 transition-colors cursor-pointer"><IoChevronUp size={14} /></button>
            <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
                className="p-0.5 rounded text-stone-400 hover:text-orange-600 disabled:opacity-20 transition-colors cursor-pointer"><IoChevronDown size={14} /></button>
        </div>
        {/* Label */}
        <span className="flex-1 text-xs font-bold text-stone-800">{card.label}</span>
        {/* NEW badge toggle */}
        <button onClick={() => onToggleNew(index)}
            className={`text-[10px] font-black px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                card.isNew
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-[#FAF6F0] border-[#EDE8E0] text-stone-400 hover:text-stone-600'
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
    const [aiStudySuite, setAiStudySuite] = useState([]);
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
    const [bulkAiValue, setBulkAiValue] = useState(10);
    const [bulkMockValue, setBulkMockValue] = useState(2);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => { loadAll(); }, [showInactive]);

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
                api.get(`/admin/ai-credits/students?showInactive=${showInactive}`),
                api.get(`/admin/mock-test-credits/students?showInactive=${showInactive}`),
            ]);
            setQA(cfg.data.quickActions);
            setLearning(cfg.data.learning);
            setAiStudySuite(cfg.data.aiStudySuite || []);
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

    const resetAllAiCredits = async () => {
        if (!window.confirm(`Set ALL active students to ${bulkAiValue} AI Doubt credits?`)) return;
        setSaving(true);
        try {
            const res = await api.post('/admin/ai-credits/reset-all', { value: bulkAiValue });
            showToast(res.data.message);
            loadAll();
        } catch {
            showToast('Bulk update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveStudentCredit = async (id, val, creditMode) => {
        try {
            const payload = {};
            if (val != null) {
                payload.doubtCredits = val;
                payload.maxDoubtCredits = val;
            }
            if (creditMode) payload.creditMode = creditMode;
            const res = await api.patch(`/admin/ai-credits/students/${id}`, payload);
            setStudents(prev => prev.map(s => s._id === id
                ? { ...s, doubtCredits: res.data.student?.doubtCredits ?? val, maxDoubtCredits: res.data.student?.maxDoubtCredits ?? val, creditMode: res.data.student?.creditMode ?? creditMode ?? s.creditMode }
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

    const INPUT = 'w-full bg-white border border-[#E2DBD2] text-stone-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 shadow-2xs font-medium';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6F0' }}>
            <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen relative" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border ${
                            toast.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                        {toast.type === 'success' ? <IoCheckmarkCircle size={16} /> : <IoAlertCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-[#EDE8E0] shadow-2xs">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
                    <Link to="/admin" className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-[#FAF6F0] border border-transparent hover:border-[#EDE8E0] transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                        <IoCog size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-stone-900 font-bold text-base">Dashboard Cards & AI Suite</h1>
                        <span className="text-[11px] text-stone-400 font-medium">Student Dashboard Layout & Credit Configuration</span>
                    </div>
                </div>
                {/* Section tabs */}
                <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === t
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                    : 'bg-white text-stone-600 border border-[#EDE8E0] hover:bg-[#FAF6F0]'
                            }`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

                {/* ── Quick Actions ─────────────────────────────────── */}
                {activeTab === 'Quick Actions' && (
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-4">Toggle visibility, mark as NEW (blinks on student dashboard), and reorder with ▲▼ arrows.</p>
                        <div className="space-y-2 mb-6">
                            {quickActions.map((card, i) => (
                                <CardRow key={card.id} card={card} index={i} total={quickActions.length}
                                    onMove={(idx, dir) => moveCard(quickActions, setQA, idx, dir)}
                                    onToggle={(idx, v) => toggleCard(quickActions, setQA, idx, v)}
                                    onToggleNew={(idx) => toggleNew(quickActions, setQA, idx)} />
                            ))}
                        </div>
                        <button onClick={() => saveSection('quickActions', quickActions)} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer">
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Quick Actions'}
                        </button>
                    </div>
                )}

                {/* ── Learning ────────────────────────────────────── */}
                {activeTab === 'Learning' && (
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-4">Control which learning cards are visible and their order in the Learning section.</p>
                        <div className="space-y-2 mb-6">
                            {learning.map((card, i) => (
                                <CardRow key={card.id} card={card} index={i} total={learning.length}
                                    onMove={(idx, dir) => moveCard(learning, setLearning, idx, dir)}
                                    onToggle={(idx, v) => toggleCard(learning, setLearning, idx, v)}
                                    onToggleNew={(idx) => toggleNew(learning, setLearning, idx)} />
                            ))}
                        </div>
                        <button onClick={() => saveSection('learning', learning)} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer">
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save Learning Section'}
                        </button>
                    </div>
                )}

                {/* ── AI Study Suite ──────────────────────────────── */}
                {activeTab === 'AI Study Suite' && (
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-4">Control which AI Study Suite tools are visible, their order, and whether they show a NEW tag.</p>
                        <div className="space-y-2 mb-6">
                            {aiStudySuite.map((card, i) => (
                                <CardRow key={card.id} card={card} index={i} total={aiStudySuite.length}
                                    onMove={(idx, dir) => moveCard(aiStudySuite, setAiStudySuite, idx, dir)}
                                    onToggle={(idx, v) => toggleCard(aiStudySuite, setAiStudySuite, idx, v)}
                                    onToggleNew={(idx) => toggleNew(aiStudySuite, setAiStudySuite, idx)} />
                            ))}
                        </div>
                        <button onClick={() => saveSection('aiStudySuite', aiStudySuite)} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer">
                            <IoSave size={15} /> {saving ? 'Saving…' : 'Save AI Study Suite'}
                        </button>
                    </div>
                )}

                {/* ── Doubt Credits ─────────────────────────────────── */}
                {activeTab === 'Doubt Credits' && (
                    <div className="space-y-6">
                        {/* Global config */}
                        <div className="rounded-2xl border border-[#EDE8E0] bg-white p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
                                    <IoSparkles size={14} />
                                </div>
                                <h3 className="text-stone-900 font-bold text-sm">Credit Formula</h3>
                            </div>
                            <p className="text-xs text-stone-500 font-medium mb-4">
                                Default credits per student = <span className="text-orange-600 font-bold">Negotiated Fee ÷ Divisor</span>.
                                If no fee, fallback default is used instead.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-700 mb-1 block">Divisor</label>
                                    <input type="number" min="1" value={aiConfig.divisor}
                                        onChange={e => setAiConfig(prev => ({ ...prev, divisor: Number(e.target.value) }))}
                                        className={INPUT} />
                                    <p className="text-[10px] text-stone-400 font-medium mt-1">e.g. Fee ₹5000 ÷ 10 = 500 credits</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-700 mb-1 block">Fallback Credits (no fee)</label>
                                    <input type="number" min="0" value={aiConfig.defaultCredits}
                                        onChange={e => setAiConfig(prev => ({ ...prev, defaultCredits: Number(e.target.value) }))}
                                        className={INPUT} />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2.5 items-center">
                                <button onClick={saveAiConfig} disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer">
                                    <IoSave size={13} /> Save Config
                                </button>
                                <button onClick={applyFormula} disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-orange-200/80 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-all cursor-pointer">
                                    <IoFlashOutline size={13} /> Apply Formula to All
                                </button>
                            </div>

                            <div className="pt-4 mt-4 border-t border-[#EDE8E0]">
                                <label className="text-xs font-bold text-stone-700 mb-1.5 block">Bulk Set Credits For All Students</label>
                                <div className="flex items-center gap-3 max-w-sm">
                                    <input type="number" min="0" value={bulkAiValue}
                                        onChange={e => setBulkAiValue(Number(e.target.value))}
                                        className={INPUT} />
                                    <button onClick={resetAllAiCredits} disabled={saving}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2 h-[42px] rounded-xl text-xs font-bold border border-orange-500 bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 shrink-0 cursor-pointer">
                                        <IoFlashOutline size={13} /> Set All Now
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Per-student credits */}
                        <div>
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <h3 className="text-stone-900 font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={15} className="text-orange-600" /> Per-Student Credits
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white border border-[#EDE8E0] px-3 py-1.5 rounded-xl shadow-2xs">
                                        <span className="text-xs font-bold text-stone-700">Show Inactive</span>
                                        <Toggle checked={showInactive} onChange={setShowInactive} />
                                    </div>
                                    <span className="text-xs text-stone-400 font-medium">{students.length} students</span>
                                </div>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white border border-[#E2DBD2] text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-orange-500 placeholder-stone-400 shadow-2xs font-medium" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredStudents.map(s => {
                                    const isAuto = (s.creditMode || 'auto') === 'auto';
                                    return (
                                        <div key={s._id}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#EDE8E0] bg-white shadow-2xs hover:border-orange-200 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-stone-900 text-xs font-bold truncate flex items-center gap-1.5">
                                                    {s.name}
                                                    {s.isActive === false && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                                            INACTIVE
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-stone-400 text-[10px] font-medium">{s.studentId} · Fee &#8377;{s.negotiatedFee || 'N/A'} · Suggested: {s.suggestedCredits}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isAuto ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-orange-50 text-orange-700 border-orange-300'}`}>
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
                                                        className="w-16 bg-[#FAF6F0] border border-orange-300 text-stone-900 text-xs rounded-xl px-2 py-1 focus:outline-none text-center font-bold"
                                                        autoFocus />
                                                    <button onClick={() => saveStudentCredit(s._id, Number(editingCredit.value), 'manual')}
                                                        className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"><IoCheckmarkCircle size={18} /></button>
                                                    <button onClick={() => setEditing(null)}
                                                        className="text-stone-400 hover:text-stone-700 transition-colors text-xs cursor-pointer">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-xs text-center px-1 ${isAuto ? 'text-stone-400' : 'text-orange-600'}`} title="Current Credits / Total Quota">
                                                        {s.doubtCredits}{s.maxDoubtCredits && s.maxDoubtCredits !== s.doubtCredits ? ` / ${s.maxDoubtCredits}` : ''}
                                                    </span>
                                                    {!isAuto && (
                                                        <button onClick={() => setEditing({ id: s._id, value: s.maxDoubtCredits ?? s.doubtCredits })}
                                                            className="p-1 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-[#FAF6F0] transition-all cursor-pointer"
                                                            title="Edit Credits">
                                                            <IoPencilOutline size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredStudents.length === 0 && (
                                    <p className="text-center text-stone-400 text-xs py-8">No students found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Mock Test Credits ─────────────────────────────── */}
                {activeTab === 'Mock Test Credits' && (
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-[#EDE8E0] bg-white p-5 shadow-xs flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
                                    <IoSparkles size={14} />
                                </div>
                                <h3 className="text-stone-900 font-bold text-sm">Daily Mock Test Allowance</h3>
                            </div>
                            <p className="text-xs text-stone-500 font-medium">
                                This sets the total allowed tests a student can generate per day. It will automatically reset to 2 at midnight IST unless modified.
                            </p>
                            <div className="flex items-end gap-3 max-w-sm">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-stone-700 mb-1 block">Bulk Reset To</label>
                                    <input type="number" min="0" value={bulkMockValue}
                                        onChange={e => setBulkMockValue(Number(e.target.value))}
                                        className={INPUT} />
                                </div>
                                <button onClick={resetAllMockCredits} disabled={saving}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 h-[42px] rounded-xl text-xs font-bold border border-orange-200/80 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-all cursor-pointer">
                                    <IoFlashOutline size={13} /> Reset All Now
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <h3 className="text-stone-900 font-bold text-sm flex items-center gap-2">
                                    <IoPersonOutline size={15} className="text-orange-600" /> Per-Student Credits
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white border border-[#EDE8E0] px-3 py-1.5 rounded-xl shadow-2xs">
                                        <span className="text-xs font-bold text-stone-700">Show Inactive</span>
                                        <Toggle checked={showInactive} onChange={setShowInactive} />
                                    </div>
                                    <span className="text-xs text-stone-400 font-medium">{mockStudents.length} students</span>
                                </div>
                            </div>
                            <div className="relative mb-3">
                                <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input value={searchMock} onChange={e => setSearchMock(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="w-full bg-white border border-[#E2DBD2] text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-orange-500 placeholder-stone-400 shadow-2xs font-medium" />
                            </div>
                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredMockStudents.map(s => (
                                    <div key={s._id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-[#EDE8E0] bg-white shadow-2xs hover:border-orange-200 transition-all">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-stone-900 text-xs font-bold truncate flex items-center gap-1.5">
                                                {s.name}
                                                {s.isActive === false && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-stone-400 text-[10px] font-medium">{s.studentId} · Seat {s.seatNumber} · Last reset: {s.lastReset || 'Never'}</p>
                                        </div>

                                        {editingMockCredit?.id === s._id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="number" min="0"
                                                    value={editingMockCredit.value}
                                                    onChange={e => setEditingMock(prev => ({ ...prev, value: e.target.value }))}
                                                    onKeyDown={e => { if (e.key === 'Enter') saveMockTestCredit(s._id, Number(editingMockCredit.value)); if (e.key === 'Escape') setEditingMock(null); }}
                                                    className="w-16 bg-[#FAF6F0] border border-orange-300 text-stone-900 text-xs rounded-xl px-2 py-1 focus:outline-none text-center font-bold"
                                                    autoFocus />
                                                <button onClick={() => saveMockTestCredit(s._id, Number(editingMockCredit.value))}
                                                    className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"><IoCheckmarkCircle size={18} /></button>
                                                <button onClick={() => setEditingMock(null)}
                                                    className="text-stone-400 hover:text-stone-700 transition-colors text-xs cursor-pointer">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs w-8 text-center text-orange-600">{s.mockTestCredits}</span>
                                                <button onClick={() => setEditingMock({ id: s._id, value: s.mockTestCredits })}
                                                    className="p-1 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-[#FAF6F0] transition-all cursor-pointer">
                                                    <IoPencilOutline size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredMockStudents.length === 0 && (
                                    <p className="text-center text-stone-400 text-xs py-8">No students found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── AI Chat History ─────────────────────────────── */}
                {activeTab === 'AI Chat History' && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
                                <IoChatbubblesOutline size={14} />
                            </div>
                            <p className="text-sm font-bold text-stone-800">Student AI Doubt Session History</p>
                        </div>
                        <StudentChatHistory embedded />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageCards;
