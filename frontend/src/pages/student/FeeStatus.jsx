import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SkeletonLoader, { FeeStatusSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCash, IoTimeOutline, IoAlertCircleOutline, IoReceiptOutline, IoInformationCircleOutline, IoCheckmarkCircle } from 'react-icons/io5';

const PageBg = () => (
    <>
        <div className="fixed inset-0 bg-[#050508] -z-10" />
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-green-700/8 blur-[100px] -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
    </>
);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatusBadge = ({ status }) => {
    const cfg = {
        paid: { text: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', label: 'Paid', icon: <IoCheckmarkCircle size={12} /> },
        pending: { text: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', label: 'Pending', icon: <IoTimeOutline size={12} /> },
        overdue: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Overdue', icon: <IoAlertCircleOutline size={12} /> },
    }[status] || { text: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10', label: status, icon: null };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

const FeeStatus = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        try {
            const response = await api.get('/student/fees');
            setFees(response.data.fees);
        } catch (error) { console.error('Error fetching fees:', error); }
        finally { setLoading(false); }
    };

    const totalPaid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);
    const paidCount = fees.filter(f => f.status === 'paid').length;

    return (
        <div className="min-h-screen text-white">
            <PageBg />
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-10">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white">Fee Status</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Payment history & dues</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Total Paid', value: `₹${totalPaid}`, sub: `${paidCount} months`, icon: IoCash, color: 'from-green-500 to-emerald-400', glow: 'rgba(34,197,94,0.4)' },
                        { label: 'Pending', value: `₹${totalPending}`, sub: `${fees.length - paidCount} months`, icon: IoTimeOutline, color: 'from-yellow-500 to-amber-400', glow: 'rgba(234,179,8,0.4)' },
                        { label: 'Total Records', value: fees.length, sub: 'all months', icon: IoReceiptOutline, color: 'from-blue-500 to-cyan-400', glow: 'rgba(59,130,246,0.4)' },
                    ].map(({ label, value, sub, icon: Icon, color, glow }, idx) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                            whileHover={{ scale: 1.03, boxShadow: `0 20px 50px -10px ${glow}` }}
                            className="relative group rounded-2xl p-5 border border-white/8 bg-white/3 backdrop-blur-xl overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-2xl transition-all`} />
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shrink-0`}><Icon size={22} className="text-white" /></div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest">{label}</p>
                                    <p className={`text-3xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent`}>{value}</p>
                                    <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {loading ? <FeeStatusSkeleton /> : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6 mb-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <IoReceiptOutline className="text-purple-400" /> Payment History
                        </h2>
                        {fees.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <IoCash size={48} className="mx-auto mb-3 text-gray-700" /><p>No fee records yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/8">
                                            {['Month/Year', 'Amount', 'Due Date', 'Paid Date', 'Status'].map(h => (
                                                <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-widest text-gray-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map((fee, idx) => (
                                            <motion.tr key={fee._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                                                className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="p-4 font-semibold text-gray-200">{monthNames[fee.month - 1]} {fee.year}</td>
                                                <td className="p-4 font-black text-white">₹{fee.amount}</td>
                                                <td className="p-4 text-sm text-gray-400">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</td>
                                                <td className="p-4 text-sm">
                                                    {fee.paidDate ? <span className="text-green-400 font-medium">{new Date(fee.paidDate).toLocaleDateString('en-IN')}</span> : <span className="text-gray-600">–</span>}
                                                </td>
                                                <td className="p-4"><StatusBadge status={fee.status} /></td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-6">
                    <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                        <IoInformationCircleOutline className="text-blue-400" size={22} /> Payment Instructions
                    </h3>
                    <div className="space-y-2.5">
                        {['Visit the library office during working hours (9:00 AM – 6:00 PM)', 'Make cash payment to the admin', 'Admin will mark your payment in the system', 'You\'ll receive a confirmation notification'].map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">{idx + 1}</span>
                                <p className="text-gray-300 text-sm">{step}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-4 bg-yellow-500/8 border border-yellow-500/25 rounded-xl flex items-start gap-3">
                        <IoAlertCircleOutline className="text-yellow-400 shrink-0 mt-0.5" size={20} />
                        <p className="text-yellow-200 text-sm"><strong>Important:</strong> Pay before the due date to avoid late fees or membership suspension.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FeeStatus;
