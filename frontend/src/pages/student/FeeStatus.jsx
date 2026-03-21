import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FeeStatusSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack, IoCashOutline, IoTimeOutline, IoAlertCircleOutline,
    IoReceiptOutline, IoInformationCircleOutline, IoCheckmarkCircle,
    IoCalendarOutline
} from 'react-icons/io5';

/* ─── Background ────────────────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#070a10' }} />
        <div className="fixed top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full -z-10 blur-[130px]"
            style={{ background: 'rgba(124,58,237,0.08)' }} />
        <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full -z-10 blur-[100px]"
            style={{ background: 'rgba(16,185,129,0.06)' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '52px 52px' }} />
    </>
);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ─── Status Badge ──────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const styles = {
        paid:    { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   color: '#4ade80', label: 'Paid',    icon: <IoCheckmarkCircle size={11} /> },
        pending: { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',   color: '#fbbf24', label: 'Pending', icon: <IoTimeOutline size={11} /> },
        overdue: { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   color: '#f87171', label: 'Overdue', icon: <IoAlertCircleOutline size={11} /> },
    }[status] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#9ca3af', label: status, icon: null };

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color }}>
            {styles.icon} {styles.label}
        </span>
    );
};

/* ─── Stat Chip ─────────────────────────────────────────────────────── */
const StatChip = ({ label, value, sub, accentColor, icon: Icon, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 120 }}
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl"
        style={{
            background: `linear-gradient(145deg, ${accentColor}0d, rgba(255,255,255,0.02))`,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '16px',
            minHeight: '105px',
        }}
    >
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <Icon size={46} className="absolute -bottom-1 -right-1 opacity-[0.06]"
            style={{ color: accentColor }} />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${accentColor}18` }}>
            <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: 'rgba(156,163,175,0.7)' }}>{label}</p>
            <p className="text-xl font-black text-white leading-none">{value}</p>
            {sub && <p className="text-[11px] mt-1" style={{ color: 'rgba(107,114,128,0.8)' }}>{sub}</p>}
        </div>
    </motion.div>
);

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
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

    const totalPaid    = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);
    const paidCount    = fees.filter(f => f.status === 'paid').length;

    return (
        <div className="min-h-screen text-white">
            <PageBg />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-7">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <IoArrowBack size={15} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">Fee Status</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Payment history & dues</p>
                    </div>
                </motion.div>

                {/* ── Stat Chips ─────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <StatChip label="Total Paid"    value={`₹${totalPaid}`}    sub={`${paidCount} months`}              accentColor="#22c55e" icon={IoCashOutline}    delay={0} />
                    <StatChip label="Pending"       value={`₹${totalPending}`} sub={`${fees.length - paidCount} months`} accentColor="#f59e0b" icon={IoTimeOutline}   delay={0.07} />
                    <StatChip label="Total Records" value={fees.length}        sub="all months"                           accentColor="#6366f1" icon={IoReceiptOutline} delay={0.13} />
                </div>

                {/* ── Payment History ────────────────────────────────── */}
                {loading ? <FeeStatusSkeleton /> : (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="rounded-2xl overflow-hidden mb-4"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>

                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.15)' }}>
                                <IoReceiptOutline size={13} className="text-indigo-400" />
                            </div>
                            <p className="text-white font-bold text-sm">Payment History</p>
                        </div>

                        {fees.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-4">
                                    <IoCashOutline size={24} className="text-gray-600" />
                                </div>
                                <p className="text-gray-600 text-sm">No fee records yet</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {fees.map((fee, idx) => (
                                    <motion.div key={fee._id}
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                        style={{
                                            background: fee.status === 'paid' ? 'rgba(34,197,94,0.03)' : fee.status === 'overdue' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${fee.status === 'paid' ? 'rgba(34,197,94,0.1)' : fee.status === 'overdue' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)'}`,
                                        }}>
                                        {/* Month icon */}
                                        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <span className="text-[9px] font-bold uppercase text-gray-500 leading-none">{monthNames[fee.month - 1]}</span>
                                            <span className="text-[13px] font-black text-white leading-none">{String(fee.year).slice(2)}</span>
                                        </div>

                                        {/* Amount */}
                                        <p className="font-black text-white text-base w-16 shrink-0">₹{fee.amount}</p>

                                        {/* Dates — stacked vertically */}
                                        <div className="flex flex-col gap-0.5 flex-1 min-w-0 text-[11px]">
                                            <div className="flex items-center gap-1">
                                                <IoCalendarOutline size={10} className="text-gray-600 shrink-0" />
                                                <span className="text-gray-600">Due</span>
                                                <span className="text-gray-400 font-medium">{new Date(fee.dueDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            {fee.paidDate && (
                                                <div className="flex items-center gap-1">
                                                    <IoCheckmarkCircle size={10} className="text-emerald-500 shrink-0" />
                                                    <span className="text-gray-600">Paid</span>
                                                    <span className="text-emerald-400 font-medium">{new Date(fee.paidDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status badge */}
                                        <div className="shrink-0"><StatusBadge status={fee.status} /></div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Payment Instructions ───────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>

                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.15)' }}>
                            <IoInformationCircleOutline size={14} className="text-blue-400" />
                        </div>
                        <p className="text-white font-bold text-sm">Payment Instructions</p>
                    </div>

                    <div className="p-4 space-y-2">
                        {[
                            'Visit the library office during working hours (9:00 AM – 6:00 PM)',
                            'Make cash payment to the admin',
                            'Admin will mark your payment in the system',
                            'You\'ll receive a confirmation notification',
                        ].map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>{idx + 1}</span>
                                <p className="text-gray-400 text-sm leading-relaxed">{step}</p>
                            </div>
                        ))}

                        {/* Warning note */}
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mt-1"
                            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <IoAlertCircleOutline size={15} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-amber-300/80 text-sm leading-relaxed">
                                <span className="font-bold text-amber-300">Important:</span> Pay before the due date to avoid late fees or membership suspension.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FeeStatus;
