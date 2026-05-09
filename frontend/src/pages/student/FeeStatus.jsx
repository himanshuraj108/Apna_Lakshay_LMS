import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FeeStatusSkeleton } from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack, IoCashOutline, IoTimeOutline, IoAlertCircleOutline,
    IoReceiptOutline, IoInformationCircleOutline, IoCheckmarkCircle,
    IoCalendarOutline, IoDownloadOutline, IoClose, IoCloseCircle
} from 'react-icons/io5';
import PaymentReceipt from '../../components/admin/PaymentReceipt';

/* ─── Background ────────────────────────────────────────────────────── */
const PageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: '#F8FAFC' }} />
        <div className="fixed inset-0 -z-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </>
);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ─── Status Badge ──────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const styles = {
        paid:    { bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)',    color: '#4ade80', label: 'Paid',    icon: <IoCheckmarkCircle size={11} /> },
        pending: { bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)',    color: '#fbbf24', label: 'Pending', icon: <IoTimeOutline size={11} /> },
        overdue: { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',    color: '#f87171', label: 'Overdue', icon: <IoAlertCircleOutline size={11} /> },
        partial: { bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)',   color: '#fb923c', label: 'Partial', icon: <IoTimeOutline size={11} /> },
        cancelled: { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)', color: '#9ca3af', label: 'Cancelled', icon: <IoCloseCircle size={11} /> },
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
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-gray-200"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '16px', minHeight: '105px' }}
    >
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80"
            style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <Icon size={46} className="absolute -bottom-1 -right-1 opacity-5" style={{ color: accentColor }} />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accentColor}18` }}>
            <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-gray-500">{label}</p>
            <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
            {sub && <p className="text-[11px] mt-1 text-gray-400">{sub}</p>}
        </div>
    </motion.div>
);

/* PDF generator removed — using PaymentReceipt component instead */

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════ */
const FeeStatus = () => {
    const [fees, setFees] = useState([]);
    const [profile, setProfile] = useState(null);
    const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const autoPayAttempted = useRef(false);

    // new receipt modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        try {
            const [feeRes, profRes] = await Promise.all([
                api.get('/student/fees'),
                api.get('/auth/me')
            ]);
            setFees(feeRes.data.fees);
            setOnlinePaymentEnabled(feeRes.data.onlinePaymentEnabled !== false);
            setProfile(profRes.data.user);
        } catch (error) { console.error('Error fetching data:', error); }
        finally { setLoading(false); }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDownloadReceipt = async (fee) => {
        setSelectedFee(fee);
        setShowReceiptModal(true);
    };

    const handlePayment = async (fee) => {
        try {
            // 1. Create order on backend
            const { data } = await api.post(`/student/fees/${fee._id}/create-order`);
            
            // 2. Setup Razorpay options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SeyCQ3mGQ4m7AH', // fallback strictly for demo
                amount: data.amount,
                currency: data.currency,
                name: 'Library Management System',
                description: `Fee Payment - ${monthNamesFull[fee.month - 1]} ${fee.year}`,
                order_id: data.orderId,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post(`/student/fees/${fee._id}/verify-payment`, {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        if(verifyRes.data.success){
                            showToast('Payment successful!');
                            fetchFees(); // refresh data
                        }
                    } catch (err) {
                        showToast(err.response?.data?.message || 'Payment verification failed', 'error');
                    }
                },
                prefill: {
                    name: profile?.name,
                    email: profile?.email,
                    contact: profile?.mobile
                },
                theme: {
                    color: '#6366f1' // indigo
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response){
                showToast(response.error.description || 'Payment Failed', 'error');
            });
            rzp1.open();
            
        } catch (error) {
            showToast(error.response?.data?.message || 'Server failed to create order', 'error');
        }
    };

    // Auto-Pay Logic via Query Params
    useEffect(() => {
        if (!loading && fees.length > 0 && profile && !autoPayAttempted.current) {
            const shouldAutoPay = searchParams.get('pay') === 'now';
            if (shouldAutoPay) {
                autoPayAttempted.current = true;
                const pendingFee = fees.find(f => f.status !== 'paid');
                if (pendingFee) {
                    setSearchParams({}); // Clean up URL immediately
                    handlePayment(pendingFee);
                }
            }
        }
    }, [loading, fees, profile, searchParams, setSearchParams]);

    const totalPaid    = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
                        + fees.filter(f => f.status === 'partial').reduce((s, f) => s + (f.partialPaid || 0), 0);
    const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((s, f) => s + f.amount, 0)
                        + fees.filter(f => f.status === 'partial').reduce((s, f) => s + (f.outstanding || 0), 0);
    const paidCount    = fees.filter(f => f.status === 'paid').length;

    return (
        <div className="min-h-screen text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            <PageBg />

            {/* ── Toast ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -60, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -60, x: '-50%' }}
                        className="fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
                        style={{
                            background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                            border: toast.type === 'error' ? '1px solid #fca5a5' : '1px solid #86efac',
                            color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        }}
                    >
                        {toast.type === 'error' ? <IoAlertCircleOutline size={17} /> : <IoCheckmarkCircle size={17} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-7">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 transition-all bg-white border border-gray-200">
                            <IoArrowBack size={15} />
                            <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Fee Status</h1>
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
                        className="rounded-2xl overflow-hidden mb-4 bg-white border border-gray-200 shadow-sm">

                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-indigo-50">
                                <IoReceiptOutline size={13} className="text-indigo-500" />
                            </div>
                            <p className="text-gray-900 font-bold text-sm">Payment History</p>
                        </div>

                        {fees.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <IoCashOutline size={24} className="text-gray-400" />
                                </div>
                                <p className="text-gray-400 text-sm">No fee records yet</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {fees.map((fee, idx) => (
                                    <motion.div key={fee._id}
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                        style={{
                                            background: fee.status === 'paid' ? 'rgba(34,197,94,0.04)' : fee.status === 'overdue' ? 'rgba(239,68,68,0.04)' : fee.status === 'partial' ? 'rgba(251,146,60,0.04)' : '#f8fafc',
                                            border: `1px solid ${fee.status === 'paid' ? 'rgba(34,197,94,0.15)' : fee.status === 'overdue' ? 'rgba(239,68,68,0.15)' : fee.status === 'partial' ? 'rgba(251,146,60,0.2)' : '#e2e8f0'}`,
                                        }}>

                                        {/* Month icon */}
                                        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 bg-gray-100 border border-gray-200">
                                            <span className="text-[9px] font-bold uppercase text-gray-400 leading-none">{monthNames[fee.month - 1]}</span>
                                            <span className="text-[13px] font-black text-gray-900 leading-none">{String(fee.year).slice(2)}</span>
                                        </div>

                                        {/* Amount */}
                                        <p className="font-black text-gray-900 text-base w-16 shrink-0">₹{fee.amount}</p>

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
                                                    <span className="text-gray-600">{fee.status === 'partial' ? 'Part.Paid' : 'Paid'}</span>
                                                    <span className="text-emerald-400 font-medium">{new Date(fee.paidDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            )}
                                            {fee.status === 'partial' && fee.partialPaid > 0 && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-green-400 font-bold">₹{fee.partialPaid} paid</span>
                                                    <span className="text-gray-600">·</span>
                                                    <span className="text-red-400 font-bold">₹{fee.outstanding} due</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right side */}
                                        <div className="shrink-0">
                                            {fee.status === 'paid' ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.06 }}
                                                    whileTap={{ scale: 0.93 }}
                                                    onClick={() => handleDownloadReceipt(fee)}
                                                    disabled={downloadingId === fee._id}
                                                    title="Download Receipt"
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all disabled:opacity-60"
                                                    style={{ background: '#FACC15', border: 'none', color: '#000000' }}
                                                >
                                                    {downloadingId === fee._id ? (
                                                        <><svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg><span>Wait...</span></>
                                                    ) : (
                                                        <><IoDownloadOutline size={11} /><span>Receipt</span></>
                                                    )}
                                                </motion.button>
                                            ) : fee.status === 'partial' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <StatusBadge status="partial" />
                                                    {onlinePaymentEnabled && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.04 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            onClick={() => handlePayment(fee)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-orange-500/20"
                                                        >
                                                            Pay ₹{fee.outstanding}
                                                        </motion.button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-2">
                                                    <StatusBadge status={fee.status} />
                                                    {onlinePaymentEnabled && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.04 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            onClick={() => handlePayment(fee)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-blue-500/20"
                                                        >
                                                            Pay Online
                                                        </motion.button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Payment Instructions ───────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">

                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-50">
                            <IoInformationCircleOutline size={14} className="text-blue-500" />
                        </div>
                        <p className="text-gray-900 font-bold text-sm">Payment Instructions</p>
                    </div>

                    <div className="p-4 space-y-2">
                        {[
                            'Visit the library office during working hours (9:00 AM – 6:00 PM)',
                            'Make cash payment to the admin',
                            'Admin will mark your payment in the system',
                            'You\'ll receive a confirmation notification & email with your receipt',
                        ].map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5"
                                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>{idx + 1}</span>
                                <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                            </div>
                        ))}

                        {/* Warning note */}
                        <div className="flex items-start gap-3 px-4 py-3 rounded-xl mt-1 bg-amber-50 border border-amber-200">
                            <IoAlertCircleOutline size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-amber-700 text-sm leading-relaxed">
                                <span className="font-bold text-amber-800">Important:</span> Pay before the due date to avoid late fees or membership suspension.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Receipt Modal ── */}
            <AnimatePresence>
                {showReceiptModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowReceiptModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-2xl my-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-rose-600 to-red-600 rounded-xl">
                                        <IoReceiptOutline size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Payment Receipt</h3>
                                        <p className="text-xs text-gray-400">Apna Lakshya Library</p>
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowReceiptModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <IoClose size={18} />
                                </motion.button>
                            </div>
                            <div className="overflow-x-auto flex justify-center">
                                {selectedFee && profile && (
                                    <PaymentReceipt student={profile} fee={selectedFee} slNo={fees.length - fees.indexOf(selectedFee)} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FeeStatus;
