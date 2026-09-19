import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
    IoPeople, IoWallet, IoCheckmark, IoClose, IoDownload,
    IoSearch, IoRefreshOutline, IoAlert, IoTrendingUp, IoTrendingDown,
    IoInformationCircle, IoAddCircle, IoRemoveCircle, IoTrash, IoEye,
    IoArrowBack, IoChevronDown, IoChevronUp, IoArrowUp, IoArrowDown,
    IoGiftOutline
} from 'react-icons/io5';

/* ───── helpers ─────────────────────────────────────────── */
const fmt = n => (n || 0).toLocaleString('en-IN');
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const activityLabel = {
    referral: 'Referral Bonus', daily_quiz: 'Daily Quiz', streak: 'Streak Bonus',
    attendance: 'Attendance', mock_test: 'Mock Test', ai_tool: 'AI Tool',
    fee_discount: 'Fee Discount', mock_test_credit: 'Mock Credit',
    doubt_credit: 'Doubt Credit', study_planner: 'Study Planner',
    note_summarizer: 'Note Summarizer', manual: 'Manual Adjustment', expiry: 'Expired'
};

const statusBadge = {
    rewarded: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending:  'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border border-blue-200',
    rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const AdminReferralWallet = () => {
    const [tab, setTab] = useState('referrals');
    const [toast, setToast] = useState(null);

    // Referral state
    const [referrals, setReferrals] = useState([]);
    const [refStatus, setRefStatus] = useState('all');
    const [refSearch, setRefSearch] = useState('');
    const [refLoading, setRefLoading] = useState(true);
    const [refTotal, setRefTotal] = useState(0);
    const [refPage, setRefPage] = useState(1);

    // Wallet state
    const [wallets, setWallets] = useState([]);
    const [walletSearch, setWalletSearch] = useState('');
    const [walletLoading, setWalletLoading] = useState(true);
    const [walletTotal, setWalletTotal] = useState(0);
    const [walletPage, setWalletPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    // Action modals
    const [actionModal, setActionModal] = useState(null); // { type, studentId, studentName }
    const [actionCoins, setActionCoins] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch referrals ──
    const fetchReferrals = useCallback(async (page = 1) => {
        setRefLoading(true);
        try {
            const res = await api.get(`/admin/referrals?status=${refStatus}&page=${page}&limit=20&search=${refSearch}`);
            setReferrals(res.data.referrals || []);
            setRefTotal(res.data.total || 0);
        } catch { /* silent */ } finally { setRefLoading(false); }
    }, [refStatus, refSearch]);

    // ── Fetch wallets ──
    const fetchWallets = useCallback(async (page = 1) => {
        setWalletLoading(true);
        try {
            const res = await api.get(`/admin/wallet?page=${page}&limit=30&search=${walletSearch}`);
            setWallets(res.data.wallets || []);
            setWalletTotal(res.data.total || 0);
        } catch { /* silent */ } finally { setWalletLoading(false); }
    }, [walletSearch]);

    useEffect(() => { if (tab === 'referrals') fetchReferrals(1); }, [tab, fetchReferrals]);
    useEffect(() => { if (tab === 'wallets') fetchWallets(1); }, [tab, fetchWallets]);

    // ── Load student ledger ──
    const loadLedger = async (student) => {
        setSelectedStudent(student);
        setLedgerLoading(true);
        try {
            const res = await api.get(`/admin/wallet/${student._id}`);
            setLedger(res.data.transactions || []);
        } catch { /* silent */ } finally { setLedgerLoading(false); }
    };

    // ── Approve referral ──
    const approveReferral = async (id) => {
        try {
            await api.put(`/admin/referrals/${id}/approve`);
            showToast('Referral approved and coins awarded!');
            fetchReferrals(refPage);
        } catch (err) {
            showToast(err.response?.data?.message || 'Approval failed', 'error');
        }
    };

    // ── Reject referral ──
    const rejectReferral = async (id) => {
        try {
            await api.put(`/admin/referrals/${id}/reject`);
            showToast('Referral rejected');
            fetchReferrals(refPage);
        } catch (err) {
            showToast(err.response?.data?.message || 'Rejection failed', 'error');
        }
    };

    // ── Wallet action ──
    const handleWalletAction = async () => {
        if (!actionModal || !actionCoins || Number(actionCoins) <= 0) return;
        setActionLoading(true);
        try {
            await api.post(`/admin/wallet/${actionModal.studentId}/${actionModal.type}`, {
                coins: Number(actionCoins),
                adminNote: actionNote
            });
            showToast(`${actionModal.type === 'credit' ? 'Coins added' : actionModal.type === 'debit' ? 'Coins deducted' : actionModal.type === 'expire' ? 'Wallet expired' : 'Wallet reset'}!`);
            setActionModal(null);
            setActionCoins('');
            setActionNote('');
            fetchWallets(walletPage);
            if (selectedStudent?._id === actionModal.studentId) {
                loadLedger(selectedStudent);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally { setActionLoading(false); }
    };

    // ── Export CSV ──
    const exportCSV = () => {
        window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/admin/wallet/export`;
    };

    return (
        <div className="min-h-screen pb-20 relative" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
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
                    <motion.div initial={{ opacity: 0, y: -60, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -60, x: '-50%' }}
                        className={`fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl border ${
                            toast.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        {toast.type === 'error' ? <IoAlert size={16} /> : <IoCheckmark size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                                <IoArrowBack size={15} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-sm">
                                    <IoGiftOutline size={13} className="text-white" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">Rewards System</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Referral & Wallet Management</h1>
                            <p className="text-stone-500 text-xs mt-0.5 font-medium">Audit student referrals, coin wallets, incentives and transactions</p>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                        <IoDownload size={14} className="text-orange-600" /> Export CSV
                    </motion.button>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1.5 bg-white border border-[#EDE8E0] rounded-2xl w-fit shadow-2xs">
                    {[
                        { key: 'referrals', label: 'Referral Activity', icon: IoPeople },
                        { key: 'wallets', label: 'Wallet Ledgers', icon: IoWallet },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${tab === key
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                : 'text-stone-600 hover:text-stone-900'}`}>
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>

                {/* ════════════════ REFERRALS TAB ════════════════ */}
                <AnimatePresence mode="wait">
                {tab === 'referrals' && (
                    <motion.div key="referrals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <div className="relative flex-1">
                                <IoSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input type="text" placeholder="Search by student name or code..."
                                    value={refSearch} onChange={e => setRefSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2DBD2] rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs" />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'rewarded', 'rejected'].map(s => (
                                    <button key={s} onClick={() => setRefStatus(s)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${refStatus === s
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                            : 'bg-white border border-[#EDE8E0] text-stone-600 hover:bg-[#FAF6F0] shadow-2xs'}`}>
                                        {s}
                                    </button>
                                ))}
                                <button onClick={() => fetchReferrals(1)}
                                    className="p-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl transition-colors cursor-pointer shadow-2xs"
                                    title="Refresh referrals">
                                    <IoRefreshOutline size={16} className={`text-stone-600 ${refLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#EDE8E0] rounded-2xl shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-[#EDE8E0] bg-[#FAF6F0]/60">
                                            {['Referrer', 'Referred Student', 'Date', 'Status', 'Coins', 'Actions'].map(h => (
                                                <th key={h} className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-stone-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EDE8E0]/70">
                                        {refLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i}>
                                                    {[...Array(6)].map((_, j) => (
                                                        <td key={j} className="px-5 py-4"><div className="h-4 bg-[#FAF6F0] rounded-lg animate-pulse" /></td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : referrals.length === 0 ? (
                                            <tr><td colSpan={6} className="py-16 text-center text-stone-400 text-xs font-medium">No referrals found matching the filter</td></tr>
                                        ) : referrals.map(r => (
                                            <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="hover:bg-[#FAF6F0]/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-stone-900 text-xs">{r.referrer?.name}</p>
                                                    <p className="text-[11px] text-stone-400 font-medium">{r.referrer?.studentId}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-stone-800 text-xs">{r.referee?.name}</p>
                                                    <p className="text-[11px] text-stone-400 font-medium">{r.referee?.mobile}</p>
                                                </td>
                                                <td className="px-5 py-4 text-stone-500 text-xs font-medium">{fmtDate(r.createdAt)}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge[r.status] || 'bg-stone-100 text-stone-600'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 font-black text-xs">
                                                    {r.coinsAwarded > 0 ? (
                                                        <span className="flex items-center gap-1 text-emerald-600"><IoTrendingUp size={13}/> +{r.coinsAwarded}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {r.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => approveReferral(r._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs">
                                                                <IoCheckmark size={13} /> Approve
                                                            </motion.button>
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => rejectReferral(r._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs">
                                                                <IoClose size={13} /> Reject
                                                            </motion.button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-stone-400">—</span>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {refTotal > 20 && (
                                <div className="px-6 py-4 border-t border-[#EDE8E0] bg-[#FAF6F0]/40 flex items-center justify-between">
                                    <p className="text-xs text-stone-500 font-medium">{referrals.length} of {refTotal} records</p>
                                    <div className="flex gap-2">
                                        {refPage > 1 && <button onClick={() => { setRefPage(p => p-1); fetchReferrals(refPage-1); }} className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-white border border-[#EDE8E0] rounded-xl hover:bg-[#FAF6F0] cursor-pointer shadow-2xs">← Prev</button>}
                                        {refPage * 20 < refTotal && <button onClick={() => { setRefPage(p => p+1); fetchReferrals(refPage+1); }} className="px-3 py-1.5 text-xs font-bold text-orange-600 bg-white border border-[#EDE8E0] rounded-xl hover:bg-[#FAF6F0] cursor-pointer shadow-2xs">Next →</button>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ════════════════ WALLETS TAB ════════════════ */}
                {tab === 'wallets' && (
                    <motion.div key="wallets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="flex gap-3 mb-5">
                            <div className="relative flex-1">
                                <IoSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input type="text" placeholder="Search by student name, ID, mobile..."
                                    value={walletSearch} onChange={e => setWalletSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2DBD2] rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs" />
                            </div>
                            <button onClick={() => fetchWallets(1)}
                                className="p-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl transition-colors cursor-pointer shadow-2xs"
                                title="Refresh student wallets">
                                <IoRefreshOutline size={16} className={`text-stone-600 ${walletLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Left: student wallet list */}
                            <div className="lg:col-span-1 bg-white border border-[#EDE8E0] rounded-2xl shadow-xs overflow-hidden">
                                <div className="px-5 py-4 border-b border-[#EDE8E0] bg-[#FAF6F0]/60 flex items-center gap-2">
                                    <IoWallet size={15} className="text-orange-600" />
                                    <p className="font-bold text-stone-900 text-xs">Students ({walletTotal})</p>
                                </div>
                                {walletLoading ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl animate-pulse" />)}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#EDE8E0]/70 max-h-[600px] overflow-y-auto">
                                        {wallets.map(s => (
                                            <motion.div key={s._id}
                                                onClick={() => loadLedger(s)}
                                                className={`px-5 py-3.5 cursor-pointer hover:bg-[#FAF6F0]/60 transition-colors ${selectedStudent?._id === s._id ? 'bg-orange-50/70 border-r-3 border-orange-500' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-stone-900 text-xs truncate">{s.name}</p>
                                                        <p className="text-[11px] text-stone-400 font-medium">{s.studentId || s.mobile}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <p className="flex items-center gap-1 font-black text-orange-600 text-xs"><IoWallet size={13}/> {fmt(s.coinBalance)}</p>
                                                        {s.coinExpiresAt && (
                                                            <p className="text-[10px] text-amber-600 font-medium">Exp: {fmtDate(s.coinExpiresAt)}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: ledger panel */}
                            <div className="lg:col-span-2">
                                {!selectedStudent ? (
                                    <div className="h-full bg-white border border-[#EDE8E0] rounded-2xl flex items-center justify-center p-16 shadow-xs">
                                        <div className="text-center">
                                            <IoEye size={36} className="text-stone-300 mx-auto mb-2.5" />
                                            <p className="text-stone-500 text-xs font-semibold">Select a student from the list</p>
                                            <p className="text-stone-400 text-[11px] mt-0.5">Inspect full transaction ledger and adjust coin balance</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-[#EDE8E0] rounded-2xl shadow-xs overflow-hidden">
                                        {/* Student header */}
                                        <div className="px-6 py-5 border-b border-[#EDE8E0] bg-[#FAF6F0]/50">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-black text-stone-900 text-sm">{selectedStudent.name}</h3>
                                                    <p className="text-[11px] text-stone-500 font-medium">{selectedStudent.studentId || selectedStudent.mobile}</p>
                                                    <div className="flex gap-3 mt-2.5 text-xs">
                                                        <span className="flex items-center gap-1 font-black text-orange-600">
                                                            <IoWallet size={14} /> {fmt(selectedStudent.coinBalance)} balance
                                                        </span>
                                                        <span className="text-stone-300">|</span>
                                                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                            <IoTrendingUp size={13}/> {fmt(selectedStudent.totalCoinsEarned)} earned
                                                        </span>
                                                        <span className="text-stone-300">|</span>
                                                        <span className="flex items-center gap-1 text-rose-500 font-bold">
                                                            <IoTrendingDown size={13}/> {fmt(selectedStudent.totalCoinsSpent)} spent
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedStudent(null)}
                                                    className="p-1.5 hover:bg-stone-200/60 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer">
                                                    <IoClose size={18} />
                                                </button>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {[
                                                    { type: 'credit', label: 'Add Coins', icon: IoAddCircle, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' },
                                                    { type: 'debit',  label: 'Deduct',    icon: IoRemoveCircle, color: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' },
                                                    { type: 'expire', label: 'Expire',    icon: IoAlert, color: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' },
                                                    { type: 'reset',  label: 'Reset',     icon: IoTrash, color: 'bg-stone-100 text-stone-700 border border-[#EDE8E0] hover:bg-stone-200' },
                                                ].map(({ type, label, icon: Icon, color }) => (
                                                    <motion.button key={type} whileTap={{ scale: 0.96 }}
                                                        onClick={() => setActionModal({ type, studentId: selectedStudent._id, studentName: selectedStudent.name })}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${color}`}>
                                                        <Icon size={14} /> {label}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Ledger */}
                                        {ledgerLoading ? (
                                            <div className="p-4 space-y-2">
                                                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-[#FAF6F0] rounded-xl animate-pulse" />)}
                                            </div>
                                        ) : ledger.length === 0 ? (
                                            <div className="py-12 text-center text-stone-400 text-xs font-medium">No ledger transactions recorded yet</div>
                                        ) : (
                                            <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                                                {ledger.map((t, i) => {
                                                    const isEarn = t.coins > 0;
                                                    return (
                                                        <div key={t._id} className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-[#FAF6F0]/40 border-[#EDE8E0]">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                                isEarn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {isEarn
                                                                    ? <IoArrowUp size={14} />
                                                                    : <IoArrowDown size={14} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-stone-900 truncate">
                                                                    {activityLabel[t.activity] || t.activity}
                                                                    {t.adminNote && <span className="text-stone-400 font-normal ml-1 text-[11px]">— {t.adminNote}</span>}
                                                                </p>
                                                                <p className="text-[10px] text-stone-400 font-medium">{fmtDate(t.createdAt)}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className={`flex items-center gap-1 font-black text-xs justify-end ${isEarn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    <IoWallet size={12}/>
                                                                    {isEarn ? '+' : ''}{t.coins}
                                                                </div>
                                                                <p className="text-[10px] text-stone-400 font-mono">Bal: {fmt(t.balanceAfter)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* ═══════════ ACTION MODAL ═══════════ */}
            <AnimatePresence>
            {actionModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                    onClick={() => setActionModal(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[#EDE8E0]">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#EDE8E0]">
                            <div>
                                <h3 className="font-black text-stone-900 text-sm capitalize">
                                    {actionModal.type === 'credit' ? 'Add Coins' :
                                     actionModal.type === 'debit' ? 'Deduct Coins' :
                                     actionModal.type === 'expire' ? 'Expire Wallet' : 'Reset Wallet'}
                                </h3>
                                <p className="text-stone-400 text-xs font-medium">{actionModal.studentName}</p>
                            </div>
                            <button onClick={() => setActionModal(null)} className="p-1.5 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer">
                                <IoClose size={18} />
                            </button>
                        </div>

                        {(actionModal.type === 'credit' || actionModal.type === 'debit') && (
                            <div className="mb-4">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Coins Amount</label>
                                <input type="number" min="1" value={actionCoins} onChange={e => setActionCoins(e.target.value)}
                                    placeholder="Enter coins..."
                                    className="w-full px-4 py-2.5 bg-white border border-[#E2DBD2] rounded-xl text-xs font-bold text-stone-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs" />
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Reason / Admin Note</label>
                            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                                placeholder="Add a note (optional)..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white border border-[#E2DBD2] rounded-xl text-xs font-medium text-stone-900 resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs" />
                        </div>

                        {(actionModal.type === 'expire' || actionModal.type === 'reset') && (
                            <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                                <IoAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                <span>This action is <strong>irreversible</strong>. Balance will be zeroed out.</span>
                            </div>
                        )}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleWalletAction}
                            disabled={actionLoading || ((actionModal.type === 'credit' || actionModal.type === 'debit') && !actionCoins)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md disabled:opacity-50 text-white cursor-pointer transition-all
                                ${actionModal.type === 'credit' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20' :
                                  actionModal.type === 'debit'  ? 'bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-500/20' :
                                  actionModal.type === 'expire' ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/20' : 'bg-stone-800'}`}>
                            {actionLoading ? 'Processing...' : 'Confirm Action'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReferralWallet;
