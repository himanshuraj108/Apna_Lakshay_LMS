import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCash, IoCashOutline, IoCheckmarkCircle, IoCloseCircle,
    IoTimeOutline, IoAlertCircleOutline, IoFilterOutline, IoDownloadOutline
} from 'react-icons/io5';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_BG = { background: '#050508' };

const FeeManagement = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        try {
            const res = await api.get('/admin/fees');
            setFees(res.data.fees);
        } catch (e) { setError('Failed to load fees'); }
        finally { setLoading(false); }
    };

    const markAsPaid = async (feeId) => {
        try {
            await api.put(`/admin/fees/${feeId}/paid`);
            setSuccess('Fee marked as paid!');
            fetchFees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to mark fee as paid');
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredFees = filter === 'all' ? fees : fees.filter(f => f.status === filter);
    const totalCollected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
    const totalOverdue = fees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0);

    const TABS = [
        { key: 'all', label: 'All', count: fees.length },
        { key: 'paid', label: 'Paid', count: fees.filter(f => f.status === 'paid').length },
        { key: 'pending', label: 'Pending', count: fees.filter(f => f.status === 'pending').length },
        { key: 'overdue', label: 'Overdue', count: fees.filter(f => f.status === 'overdue').length },
    ];

    const STATUS_COLORS = {
        paid: 'text-green-400 bg-green-500/10 border-green-500/20',
        pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        overdue: 'text-red-400 bg-red-500/10 border-red-500/20',
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
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/admin">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                                <IoCashOutline size={14} className="text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">Fee Management</h1>
                    </div>
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Summary Cards */}
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
                                <Icon size={18} className="text-white" />
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
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'}`}>
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
                </div>

                {/* Table */}
                {loading ? (
                    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-16 border-b border-white/5 animate-pulse bg-white/2" />)}
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
                                        <tr key={fee._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-white text-sm">{fee.student?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{fee.student?.email}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-300">
                                                {new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-white">₹{fee.amount}</td>
                                            <td className="px-5 py-4 text-sm text-gray-400">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[fee.status] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {fee.status === 'paid' ? (
                                                    <span className="text-xs text-gray-500">Paid {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-IN') : ''}</span>
                                                ) : new Date() >= new Date(fee.cycleStart) ? (
                                                    <motion.button 
                                                        whileHover={{ scale: 1.05 }} 
                                                        whileTap={{ scale: 0.95 }} 
                                                        onClick={() => markAsPaid(fee._id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-400 rounded-xl text-xs font-semibold transition-all ml-auto">
                                                        <IoCheckmarkCircle size={14} /> Mark Paid
                                                    </motion.button>
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
            </div>
        </div>
    );
};

export default FeeManagement;
