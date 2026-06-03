import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoPeople, IoWallet, IoCheckmark, IoClose, IoDownload,
    IoSearch, IoRefreshOutline, IoAlert, IoTrendingUp, IoTrendingDown,
    IoInformationCircle, IoAddCircle, IoRemoveCircle, IoTrash, IoEye,
    IoArrowBack, IoChevronDown, IoChevronUp, IoArrowUp, IoArrowDown
} from 'react-icons/io5';

/* ───── helpers ─────────────────────────────────────────── */
const fmt = n => (n || 0).toLocaleString('en-IN');
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const activityLabel = {
    referral: 'Referral', daily_quiz: 'Daily Quiz', streak: 'Streak',
    attendance: 'Attendance', mock_test: 'Mock Test', ai_tool: 'AI Tool',
    fee_discount: 'Fee Discount', mock_test_credit: 'Mock Credit',
    doubt_credit: 'Doubt Credit', study_planner: 'Study Planner',
    note_summarizer: 'Note Summarizer', manual: 'Manual', expiry: 'Expired'
};

const statusBadge = {
    rewarded: 'bg-emerald-100 text-emerald-700',
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
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
        <div className="min-h-screen pb-20" style={{ background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(0,0,0,0.04) 1px,transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -60, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -60, x: '-50%' }}
                        className="fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
                        style={{
                            background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                            border: toast.type === 'error' ? '1px solid #fca5a5' : '1px solid #86efac',
                            color: toast.type === 'error' ? '#dc2626' : '#16a34a'
                        }}>
                        {toast.type === 'error' ? <IoAlert size={17} /> : <IoCheckmark size={17} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-7">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Referral & Wallet</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Manage referrals, coin wallets & transactions</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md">
                        <IoDownload size={15} /> Export CSV
                    </motion.button>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-white border border-gray-200 rounded-2xl w-fit shadow-sm">
                    {[
                        { key: 'referrals', label: 'Referral Activity', icon: IoPeople },
                        { key: 'wallets', label: 'Wallet Activity', icon: IoWallet },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === key
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-800'}`}>
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
                                <IoSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search by name or code..."
                                    value={refSearch} onChange={e => setRefSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'pending', 'rewarded', 'rejected'].map(s => (
                                    <button key={s} onClick={() => setRefStatus(s)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize ${refStatus === s
                                            ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>
                                        {s}
                                    </button>
                                ))}
                                <button onClick={() => fetchReferrals(1)}
                                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                    <IoRefreshOutline size={15} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {['Referrer', 'Referred Student', 'Date', 'Status', 'Coins', 'Actions'].map(h => (
                                                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="border-b border-gray-50">
                                                    {[...Array(6)].map((_, j) => (
                                                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : referrals.length === 0 ? (
                                            <tr><td colSpan={6} className="py-16 text-center text-gray-400">No referrals found</td></tr>
                                        ) : referrals.map(r => (
                                            <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-gray-900">{r.referrer?.name}</p>
                                                    <p className="text-xs text-gray-400">{r.referrer?.studentId}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-gray-800">{r.referee?.name}</p>
                                                    <p className="text-xs text-gray-400">{r.referee?.mobile}</p>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(r.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${statusBadge[r.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-black text-sm">
                                                    {r.coinsAwarded > 0 ? (
                                                        <span className="flex items-center gap-1 text-emerald-600"><IoTrendingUp size={12}/> {r.coinsAwarded}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {r.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => approveReferral(r._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                                                                <IoCheckmark size={12} /> Approve
                                                            </motion.button>
                                                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => rejectReferral(r._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold">
                                                                <IoClose size={12} /> Reject
                                                            </motion.button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {refTotal > 20 && (
                                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-xs text-gray-400">{referrals.length} of {refTotal}</p>
                                    <div className="flex gap-2">
                                        {refPage > 1 && <button onClick={() => { setRefPage(p => p-1); fetchReferrals(refPage-1); }} className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg">← Prev</button>}
                                        {refPage * 20 < refTotal && <button onClick={() => { setRefPage(p => p+1); fetchReferrals(refPage+1); }} className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg">Next →</button>}
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
                                <IoSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search by name, ID, mobile..."
                                    value={walletSearch} onChange={e => setWalletSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                            </div>
                            <button onClick={() => fetchWallets(1)}
                                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                <IoRefreshOutline size={15} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Left: student wallet list */}
                            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
                                    <IoWallet size={14} className="text-indigo-500" />
                                    <p className="font-bold text-gray-900 text-sm">Students ({walletTotal})</p>
                                </div>
                                {walletLoading ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                                        {wallets.map(s => (
                                            <motion.div key={s._id}
                                                onClick={() => loadLedger(s)}
                                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedStudent?._id === s._id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                                                        <p className="text-xs text-gray-400">{s.studentId || s.mobile}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <p className="flex items-center gap-1 font-black text-indigo-600 text-sm"><IoWallet size={12}/> {fmt(s.coinBalance)}</p>
                                                        {s.coinExpiresAt && (
                                                            <p className="text-[10px] text-amber-500">Exp: {fmtDate(s.coinExpiresAt)}</p>
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
                                    <div className="h-full bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-16 shadow-sm">
                                        <div className="text-center">
                                            <IoEye size={32} className="text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-400 text-sm">Select a student to view their wallet ledger</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                        {/* Student header */}
                                        <div className="px-5 py-4 border-b border-gray-100">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-black text-gray-900">{selectedStudent.name}</h3>
                                                    <p className="text-xs text-gray-400">{selectedStudent.studentId || selectedStudent.mobile}</p>
                                                    <div className="flex gap-3 mt-2 text-sm">
                                                        <span className="flex items-center gap-1 font-black text-indigo-600">
                                                            <IoWallet size={13} /> {fmt(selectedStudent.coinBalance)}
                                                        </span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                            <IoTrendingUp size={12}/> {fmt(selectedStudent.totalCoinsEarned)} earned
                                                        </span>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="flex items-center gap-1 text-red-500 font-bold">
                                                            <IoTrendingDown size={12}/> {fmt(selectedStudent.totalCoinsSpent)} spent
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedStudent(null)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400">
                                                    <IoClose size={16} />
                                                </button>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {[
                                                    { type: 'credit', label: 'Add Coins', icon: IoAddCircle, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                                                    { type: 'debit',  label: 'Deduct',    icon: IoRemoveCircle, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                                                    { type: 'expire', label: 'Expire',    icon: IoAlert, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                                                    { type: 'reset',  label: 'Reset',     icon: IoTrash, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                                                ].map(({ type, label, icon: Icon, color }) => (
                                                    <motion.button key={type} whileTap={{ scale: 0.96 }}
                                                        onClick={() => setActionModal({ type, studentId: selectedStudent._id, studentName: selectedStudent.name })}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${color}`}>
                                                        <Icon size={13} /> {label}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Ledger */}
                                        {ledgerLoading ? (
                                            <div className="p-4 space-y-2">
                                                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                                            </div>
                                        ) : ledger.length === 0 ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">No transactions yet</div>
                                        ) : (
                                            <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                                                {ledger.map((t, i) => {
                                                    const isEarn = t.coins > 0;
                                                    return (
                                                        <div key={t._id} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                                                            style={{
                                                                background: isEarn ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                                                                borderColor: isEarn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
                                                            }}>
                                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                                style={{ background: isEarn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                                                                {isEarn
                                                                    ? <IoArrowUp size={15} className="text-emerald-600" />
                                                                    : <IoArrowDown size={15} className="text-red-500" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                                    {activityLabel[t.activity] || t.activity}
                                                                    {t.adminNote && <span className="text-gray-400 font-normal ml-1 text-xs">— {t.adminNote}</span>}
                                                                </p>
                                                                <p className="text-[11px] text-gray-400">{fmtDate(t.createdAt)}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className={`flex items-center gap-1 font-black justify-end ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                <IoWallet size={12}/>
                                                                {isEarn ? '+' : ''}{t.coins}
                                                            </div>
                                                                <p className="text-[11px] text-gray-400">Bal: {fmt(t.balanceAfter)}</p>
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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setActionModal(null)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-black text-gray-900 capitalize">
                                    {actionModal.type === 'credit' ? 'Add Coins' :
                                     actionModal.type === 'debit' ? 'Deduct Coins' :
                                     actionModal.type === 'expire' ? 'Expire Wallet' : 'Reset Wallet'}
                                </h3>
                                <p className="text-gray-400 text-sm">{actionModal.studentName}</p>
                            </div>
                            <button onClick={() => setActionModal(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                                <IoClose size={18} />
                            </button>
                        </div>

                        {(actionModal.type === 'credit' || actionModal.type === 'debit') && (
                            <div className="mb-4">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Coins Amount</label>
                                <input type="number" min="1" value={actionCoins} onChange={e => setActionCoins(e.target.value)}
                                    placeholder="Enter coins..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold focus:border-indigo-400 focus:outline-none" />
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Reason / Note</label>
                            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                                placeholder="Add a note (optional)..."
                                rows={2}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm resize-none focus:border-indigo-400 focus:outline-none" />
                        </div>

                        {(actionModal.type === 'expire' || actionModal.type === 'reset') && (
                            <div className="mb-4 flex items-start gap-2 px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                                <IoAlert size={16} className="shrink-0 mt-0.5" />
                                <span>This action is <strong>irreversible</strong>. Balance will be zeroed out.</span>
                            </div>
                        )}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleWalletAction}
                            disabled={actionLoading || ((actionModal.type === 'credit' || actionModal.type === 'debit') && !actionCoins)}
                            className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg disabled:opacity-50 text-white
                                ${actionModal.type === 'credit' ? 'bg-emerald-600' :
                                  actionModal.type === 'debit'  ? 'bg-red-500' :
                                  actionModal.type === 'expire' ? 'bg-amber-500' : 'bg-gray-700'}`}>
                            {actionLoading ? 'Processing...' : 'Confirm'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReferralWallet;
