import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCash, IoCashOutline, IoCheckmarkCircle, IoCloseCircle,
    IoTimeOutline, IoAlertCircleOutline, IoFilterOutline, IoDownloadOutline,
    IoWalletOutline
} from 'react-icons/io5';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useBackPath from '../../hooks/useBackPath';
import { useAuth } from '../../context/AuthContext';

const PAGE_BG = { background: '#F8FAFC' };

const FeeManagement = () => {
    const backPath = useBackPath();
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'subadmin';
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
    const [filter, setFilter] = useState('all');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    // Partial payment modal state
    const [payModal, setPayModal] = useState(null); // { fee } or null
    const [payType, setPayType] = useState('full');  // 'full' | 'partial'
    const [partialAmt, setPartialAmt] = useState('');
    const [payLoading, setPayLoading] = useState(false);

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        try {
            const [feesRes, settingsRes] = await Promise.all([
                api.get('/admin/fees'),
                api.get('/admin/settings')
            ]);
            setFees(feesRes.data.fees);
            setOnlinePaymentEnabled(settingsRes.data.settings?.onlinePaymentEnabled !== false);
        } catch (e) { setError('Failed to load data'); }
        finally { setLoading(false); }
    };

    const toggleOnlinePayment = async () => {
        try {
            const newValue = !onlinePaymentEnabled;
            setOnlinePaymentEnabled(newValue);
            await api.put('/admin/settings', { onlinePaymentEnabled: newValue });
            setSuccess(`Online payments ${newValue ? 'enabled' : 'disabled'}!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setOnlinePaymentEnabled(!onlinePaymentEnabled); // Revert on failure
            setError('Failed to update settings');
            setTimeout(() => setError(''), 3000);
        }
    };

    const openPayModal = (fee) => {
        setPayModal(fee);
        setPayType('full');
        setPartialAmt('');
        setError('');
    };

    const closePayModal = () => {
        setPayModal(null);
        setPayType('full');
        setPartialAmt('');
        setError('');
    };

    const handleMarkPaid = async () => {
        if (!payModal) return;
        setPayLoading(true);
        try {
            if (payType === 'full') {
                await api.put(`/admin/fees/${payModal._id}/paid`);
                setSuccess('Fee marked as fully paid!');
            } else if (payType === 'cancel') {
                await api.put(`/admin/fees/${payModal._id}/cancelled`);
                setSuccess('Fee cancelled successfully!');
            } else {
                if (!partialAmt || isNaN(partialAmt) || Number(partialAmt) <= 0) {
                    setError('Please enter a valid partial amount.');
                    setPayLoading(false);
                    return;
                }
                const res = await api.put(`/admin/fees/${payModal._id}/partial`, { partialAmount: Number(partialAmt) });
                setSuccess(res.data.message || 'Partial payment recorded!');
            }
            closePayModal();
            fetchFees();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            setError(e.response?.data?.message || 'Operation failed.');
            setTimeout(() => setError(''), 4000);
        } finally {
            setPayLoading(false);
        }
    };


    // Base: exclude inactive unless showInactive is on
    const baseFees = showInactive ? fees : fees.filter(f => f.student?.isActive !== false);

    const filteredFees = filter === 'all' ? baseFees : 
                         filter === 'online' ? baseFees.filter(f => f.razorpayOrderId) :
                         filter === 'pending' ? baseFees.filter(f => f.status === 'pending' || f.status === 'partial') :
                         baseFees.filter(f => f.status === filter);
                         
    const totalCollected = baseFees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = baseFees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    const totalOverdue = baseFees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0);

    const TABS = [
        { key: 'all',     label: 'All',        count: baseFees.length },
        { key: 'paid',    label: 'Paid',        count: baseFees.filter(f => f.status === 'paid').length },
        ...(onlinePaymentEnabled ? [{ key: 'online', label: 'Online Paid', count: baseFees.filter(f => f.razorpayOrderId).length }] : []),
        { key: 'pending', label: 'Pending',     count: baseFees.filter(f => f.status === 'pending' || f.status === 'partial').length },
        { key: 'overdue', label: 'Overdue',     count: baseFees.filter(f => f.status === 'overdue').length },
        { key: 'cancelled', label: 'Cancelled', count: baseFees.filter(f => f.status === 'cancelled').length },
    ];

    useEffect(() => {
        if (!onlinePaymentEnabled && filter === 'online') {
            setFilter('all');
        }
    }, [onlinePaymentEnabled, filter]);

    const STATUS_COLORS = {
        paid:    'text-green-400 bg-green-500/10 border-green-500/20',
        pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        overdue: 'text-red-400 bg-red-500/10 border-red-500/20',
        partial: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        cancelled: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    };

    const generateFeeTablePDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text('Fee Management Report', 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
        doc.text(`Filter Applied: ${filter.toUpperCase()}`, 14, 36);
        doc.text(`Total Records: ${filteredFees.length}`, 14, 42);

        const tableColumn = ["Student Name", "Email", "Billing Cycle", "Amount", "Due Date", "Status", "Paid Date"];
        const tableRows = [];

        filteredFees.forEach(fee => {
            const cycleStart = new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const cycleEnd = new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

            const feeData = [
                fee.student?.name || 'Unknown',
                fee.student?.email || 'N/A',
                `${cycleStart} - ${cycleEnd}`,
                `Rs. ${fee.amount}`,
                new Date(fee.dueDate).toLocaleDateString('en-IN'),
                fee.status.toUpperCase(),
                fee.status === 'paid' && fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-IN') : '-'
            ];

            tableRows.push(feeData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' },
                5: { halign: 'center', fontStyle: 'bold' }
            }
        });

        doc.save(`Fee_Report_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-12%] right-[-6%] w-[500px] h-[500px] rounded-full bg-yellow-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-8%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8 flex-wrap">
                    <Link to={backPath}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> <span className="hidden sm:inline">Back</span>
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                                <IoCashOutline size={14} className="text-gray-900" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Fee Management</h1>
                    </div>
                    
                    {/* Toggle Switch */}
                    {!isSubAdmin && (
                        <div className="ml-auto flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-gray-900 leading-tight">Online Payments</span>
                                <span className="text-[10px] text-gray-600 font-medium">Allow students to pay via Razorpay</span>
                            </div>
                            <button
                                onClick={toggleOnlinePayment}
                                className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${onlinePaymentEnabled ? 'bg-purple-500' : 'bg-white/20'}`}
                            >
                                <motion.div
                                    animate={{ x: onlinePaymentEnabled ? 24 : 0 }}
                                    className="w-4 h-4 rounded-full bg-white shadow-md relative z-10"
                                />
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Summary Cards */}
                {isSubAdmin ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {loading ? (
                            [...Array(4)].map((_, i) => <div key={i} className="h-44 bg-white border border-gray-100 rounded-2xl animate-pulse" />)
                        ) : (() => {
                            const pendingFees = baseFees.filter(f => ['pending', 'partial', 'overdue'].includes(f.status));
                            if (pendingFees.length === 0) {
                                return <div className="col-span-full text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm font-semibold">No pending fees found 🎉</div>;
                            }
                            return pendingFees.map(fee => (
                                <motion.div 
                                    key={fee._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group"
                                >
                                    <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${fee.status === 'overdue' ? 'from-red-500 to-rose-500' : fee.status === 'partial' ? 'from-orange-400 to-amber-500' : 'from-yellow-400 to-orange-500'}`} />
                                    <div>
                                        <div className="flex justify-between items-start mb-3 mt-1">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base">{fee.student?.name || 'Unknown'}</h3>
                                                <p className="text-[11px] text-gray-500">{fee.student?.email}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${STATUS_COLORS[fee.status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                                {fee.status}
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-500 text-xs">Total Amount:</span>
                                                <span className="font-bold text-gray-900">₹{fee.amount}</span>
                                            </div>
                                            {fee.status === 'partial' && (
                                                <div className="flex justify-between text-xs mt-1 border-t border-gray-200 pt-1.5">
                                                    <span className="text-gray-500">Paid:</span>
                                                    <span className="font-bold text-green-600">₹{fee.partialPaid}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs mt-1 border-t border-gray-200 pt-1.5">
                                                <span className="text-gray-500 font-bold">Due:</span>
                                                <span className="font-bold text-orange-600">₹{fee.status === 'partial' ? fee.outstanding : fee.amount}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] mt-2 pt-2 border-t border-gray-200">
                                                <span className="text-gray-500 uppercase tracking-wider">Due:</span>
                                                <span className="font-bold text-gray-700">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openPayModal(fee)}
                                        className="w-full flex justify-center items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/20 transition-all"
                                    >
                                        <IoWalletOutline size={16} /> Action
                                    </button>
                                </motion.div>
                            ));
                        })()}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Collected', value: `₹${totalCollected}`, color: 'from-green-500 to-emerald-500', glow: 'rgba(16,185,129,0.3)', icon: IoCheckmarkCircle },
                        { label: 'Total Pending', value: `₹${totalPending}`, color: 'from-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.3)', icon: IoTimeOutline },
                        { label: 'Total Overdue', value: `₹${totalOverdue}`, color: 'from-red-500 to-rose-500', glow: 'rgba(239,68,68,0.3)', icon: IoAlertCircleOutline },
                    ].map(({ label, value, color, glow, icon: Icon }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="relative bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60`} />
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} w-fit mb-3`} style={{ boxShadow: `0 6px 20px -4px ${glow}` }}>
                                <Icon size={18} className="text-gray-900" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                            <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Filter Tabs and Actions */}
                <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
                    <div className="flex gap-2 flex-wrap">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setFilter(t.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === t.key
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600'}`}>
                                {t.label} <span className="opacity-70">({t.count})</span>
                            </button>
                        ))}
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateFeeTablePDF}
                        disabled={filteredFees.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoDownloadOutline size={18} /> Download PDF
                    </motion.button>

                    {/* Show Inactive Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={e => setShowInactive(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-8 h-4 rounded-full transition-colors ${showInactive ? 'bg-purple-500' : 'bg-white/15'}`} />
                            <motion.div
                                animate={{ x: showInactive ? 16 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow"
                            />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">Show Inactive</span>
                    </label>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-16 border-b border-gray-100 animate-pulse bg-white/2" />)}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        {['Student', 'Billing Cycle', 'Amount', 'Due Date', 'Status', 'Action'].map(h => (
                                            <th key={h} className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 ${h === 'Amount' || h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFees.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-500">No fee records found</td></tr>
                                    ) : filteredFees.map(fee => (
                                        <tr key={fee._id}
                                            className="border-b border-gray-100 transition-colors"
                                            style={{
                                                background: fee.status === 'partial' ? 'rgba(251,146,60,0.07)' : 'transparent',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = fee.status === 'partial' ? 'rgba(251,146,60,0.13)' : 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = fee.status === 'partial' ? 'rgba(251,146,60,0.07)' : 'transparent'}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900 text-sm">{fee.student?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{fee.student?.email}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-gray-900">₹{fee.amount}</td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[fee.status] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                                        {fee.status}
                                                    </span>
                                                    {fee.status === 'partial' && fee.partialPaid > 0 && (
                                                        <span className="text-[11px] font-semibold text-orange-400">
                                                            ₹{fee.partialPaid} paid · ₹{fee.outstanding} due
                                                        </span>
                                                    )}
                                                    {onlinePaymentEnabled && fee.razorpayOrderId && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                                                            style={{ 
                                                                color: fee.status === 'paid' && fee.razorpayPaymentId ? '#c084fc' : '#9ca3af',
                                                                background: fee.status === 'paid' && fee.razorpayPaymentId ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.05)',
                                                                borderColor: fee.status === 'paid' && fee.razorpayPaymentId ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.1)'
                                                            }}>
                                                            {fee.status === 'paid' && fee.razorpayPaymentId ? 'Online: Success' : 'Online: Attempted'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                {fee.status === 'paid' ? (
                                                    <span className="text-xs text-gray-500">Paid {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-IN') : ''}</span>
                                                ) : fee.status === 'cancelled' ? (
                                                    <span className="text-xs text-gray-500">Cancelled</span>
                                                ) : new Date() >= new Date(fee.cycleStart) || fee.student?.isActive === false ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        {fee.student?.isActive === false && (
                                                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">Inactive</span>
                                                        )}
                                                        <motion.button 
                                                            whileHover={{ scale: 1.05 }} 
                                                            whileTap={{ scale: 0.95 }} 
                                                            onClick={() => openPayModal(fee)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-400 rounded-xl text-xs font-semibold transition-all">
                                                            <IoCheckmarkCircle size={14} /> Action
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-blue-400/70 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full ml-auto block w-fit">Upcoming</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
                    </>
                )}
            </div>

            {/* ── Pay Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {payModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
                        onClick={closePayModal}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                                        <IoWalletOutline size={14} className="text-gray-900" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">Mark Fee Payment</h2>
                                </div>
                                <button onClick={closePayModal} className="text-gray-500 hover:text-gray-900 transition-colors">
                                    <IoCloseCircle size={22} />
                                </button>
                            </div>

                            {/* Student Info */}
                            <div className="bg-gray-50 border border-white/8 rounded-xl px-4 py-3 mb-5">
                                <p className="text-sm font-semibold text-gray-900">{payModal.student?.name}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{payModal.student?.email}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-gray-500">Total Amount:</span>
                                    <span className="text-sm font-bold text-gray-900">₹{payModal.amount}</span>
                                    {payModal.partialPaid > 0 && (
                                        <span className="text-xs text-orange-400">· ₹{payModal.partialPaid} already paid</span>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-xl mb-4 text-sm">
                                    <IoCloseCircle size={16} />{error}
                                </div>
                            )}

                            {/* Payment Type Select */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Payment Type</label>
                                <select
                                    value={payType}
                                    onChange={e => { setPayType(e.target.value); setPartialAmt(''); setError(''); }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-purple-500/50"
                                    style={{ colorScheme: 'light' }}
                                >
                                    <option value="full" className="bg-white text-gray-900">Full Paid</option>
                                    <option value="partial" className="bg-white text-gray-900">Partial Paid</option>
                                    <option value="cancel" className="bg-white text-gray-900">Cancel Payment (Inactive Period)</option>
                                </select>
                            </div>

                            {/* Partial Amount Input */}
                            <AnimatePresence>
                                {payType === 'partial' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden mb-4"
                                    >
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                                            Amount Paid (₹) <span className="text-orange-400">· Outstanding = ₹{payModal.amount} - entered amount</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={payModal.amount - 1}
                                            value={partialAmt}
                                            onChange={e => setPartialAmt(e.target.value)}
                                            placeholder={`Enter amount (max ₹${payModal.amount - 1})`}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600"
                                        />
                                        {partialAmt && !isNaN(partialAmt) && Number(partialAmt) > 0 && Number(partialAmt) < payModal.amount && (
                                            <div className="flex justify-between text-xs mt-2 px-1">
                                                <span className="text-green-400">Paid: ₹{Number(partialAmt)}</span>
                                                <span className="text-red-400">Outstanding: ₹{payModal.amount - Number(partialAmt)}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-2">
                                <button onClick={closePayModal} className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMarkPaid}
                                    disabled={payLoading || (payType === 'partial' && (!partialAmt || isNaN(partialAmt) || Number(partialAmt) <= 0))}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white ${payType === 'cancel' ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 shadow-red-500/25' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-green-500/25'}`}
                                >
                                    <IoCheckmarkCircle size={16} />
                                    {payLoading ? 'Processing...' : payType === 'full' ? 'Mark as Fully Paid' : payType === 'cancel' ? 'Cancel Payment' : 'Record Partial Payment'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FeeManagement;
