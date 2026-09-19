import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoDocumentTextOutline,
    IoChatbubbleOutline, IoSwapHorizontalOutline, IoHelpCircleOutline,
    IoTimeOutline, IoStar, IoAlertCircleOutline, IoPersonOutline,
    IoShieldCheckmarkOutline, IoRefreshOutline, IoWarningOutline, IoBusinessOutline
} from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';
import useBackPath from '../../hooks/useBackPath';
import { PrimaryLogoLoader } from '../../components/ui/SkeletonLoader';

const PAGE_BG = { background: '#FAF6F0' };

const TYPE_META = {
    seat: { label: 'Seat Change', icon: IoSwapHorizontalOutline, color: 'from-orange-500 to-amber-500' },
    seat_change: { label: 'Seat Change', icon: IoSwapHorizontalOutline, color: 'from-orange-500 to-amber-500' },
    shift: { label: 'Shift Change', icon: IoTimeOutline, color: 'from-amber-500 to-orange-500' },
    support: { label: 'Support Ticket', icon: IoHelpCircleOutline, color: 'from-stone-700 to-stone-900' },
    inactivation: { label: 'Scholar Inactivation', icon: IoAlertCircleOutline, color: 'from-rose-500 to-red-600' },
};

const STATUS_COLORS = {
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rejected: 'text-rose-700 bg-rose-50 border-rose-200',
};

const RequestManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('students'); // 'students' | 'subadmins'
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [actionType, setActionType] = useState('');
    const [updatedFee, setUpdatedFee] = useState('');
    const [useBaseFee, setUseBaseFee] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const submittingRef = useRef(false);
    const { getShiftName } = useShifts();
    const backPath = useBackPath();

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/requests');
            setRequests(res.data.requests || []);
        } catch (e) { setError('Failed to load requests'); }
        finally { setLoading(false); }
    };

    const openReviewModal = (request, type) => {
        setSelectedRequest(request); 
        setActionType(type); 
        setAdminResponse(''); 
        setUpdatedFee(''); 
        setUseBaseFee(false);
        setShowModal(true);
    };

    const handleAction = async () => {
        if (!selectedRequest || submittingRef.current || processing) return;
        submittingRef.current = true;
        setProcessing(true);
        setError('');
        const reqId = selectedRequest._id;
        const isDisapproval = selectedRequest.type === 'inactivation' && actionType === 'rejected';

        try {
            await api.put(`/admin/requests/${reqId}`, { 
                status: actionType, 
                adminResponse,
                updatedFee: actionType === 'approved' && !useBaseFee ? updatedFee : undefined,
                useBaseFee: actionType === 'approved' ? useBaseFee : false
            });
            setShowModal(false);
            setSuccess(
                isDisapproval
                    ? 'Inactivation request disapproved. Scholar reactivated and restored to desk.'
                    : `Request ${actionType} successfully.`
            );
            // Optimistic update so card immediately reflects the action
            setRequests(prev => prev.map(r => r._id === reqId ? { ...r, status: actionType, adminResponse } : r));
            fetchRequests();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            const errMsg = e.response?.data?.message || `Failed to ${actionType} request`;
            if (errMsg.includes('already been')) {
                // If already processed, close modal and sync list gracefully
                setShowModal(false);
                setRequests(prev => prev.map(r => r._id === reqId ? { ...r, status: actionType, adminResponse } : r));
                fetchRequests();
                setSuccess(errMsg);
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(errMsg);
            }
        } finally {
            setProcessing(false);
            submittingRef.current = false;
        }
    };

    const studentRequests = requests.filter(r => r.type !== 'inactivation');
    const subAdminRequests = requests.filter(r => r.type === 'inactivation');

    const pendingStudentCount = studentRequests.filter(r => r.status === 'pending').length;
    const pendingSubAdminCount = subAdminRequests.filter(r => r.status === 'pending').length;

    const currentList = activeCategory === 'students' ? studentRequests : subAdminRequests;
    const filteredRequests = filter === 'all' ? currentList : currentList.filter(r => r.status === filter);

    const TABS = [
        { key: 'pending', label: 'Pending', count: currentList.filter(r => r.status === 'pending').length },
        { key: 'approved', label: activeCategory === 'subadmins' ? 'Approved (Inactivated)' : 'Approved', count: currentList.filter(r => r.status === 'approved').length },
        { key: 'rejected', label: activeCategory === 'subadmins' ? 'Disapproved (Reinstated)' : 'Rejected', count: currentList.filter(r => r.status === 'rejected').length },
        { key: 'all', label: 'All', count: currentList.length },
    ];

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6 flex-wrap">
                    <Link to={backPath}>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                            <IoArrowBack size={15} /> <span>Back</span>
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                <IoDocumentTextOutline size={14} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Admin Operations</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">Request Management</h1>
                    </div>
                </motion.div>

                {/* Top Category Switcher: Student Requests vs Sub-Admin Requests */}
                <div className="grid grid-cols-2 gap-3 mb-6 bg-white p-1.5 rounded-2xl border border-[#EDE8E0] shadow-xs">
                    <button
                        onClick={() => { setActiveCategory('students'); setFilter('pending'); }}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                            activeCategory === 'students'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF6F0]'
                        }`}
                    >
                        <IoPersonOutline size={17} />
                        <span>Student Requests</span>
                        {pendingStudentCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeCategory === 'students'
                                    ? 'bg-white text-orange-600'
                                    : 'bg-orange-500 text-white'
                            }`}>
                                {pendingStudentCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveCategory('subadmins'); setFilter('pending'); }}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                            activeCategory === 'subadmins'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF6F0]'
                        }`}
                    >
                        <IoShieldCheckmarkOutline size={17} />
                        <span>Sub-Admin Requests</span>
                        {pendingSubAdminCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeCategory === 'subadmins'
                                    ? 'bg-white text-orange-600'
                                    : 'bg-rose-500 text-white'
                            }`}>
                                {pendingSubAdminCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-5 text-xs font-bold shadow-2xs"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-5 text-xs font-bold shadow-2xs"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === t.key
                                ? 'bg-gradient-to-r from-stone-800 to-stone-900 text-white shadow-md shadow-stone-800/20'
                                : 'bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700'}`}>
                            {t.label} <span className="opacity-70">({t.count})</span>
                        </button>
                    ))}
                </div>

                {/* Request Cards */}
                {loading ? (
                    <PrimaryLogoLoader text="Loading Requests..." />
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white border border-[#EDE8E0] rounded-2xl p-10 text-center shadow-xs">
                        <IoDocumentTextOutline size={40} className="text-stone-400 mx-auto mb-3" />
                        <p className="text-stone-600 font-bold text-sm">
                            {activeCategory === 'students' ? 'No student requests found' : 'No sub-admin requests found'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map((req, i) => {
                            const meta = TYPE_META[req.type] || { label: req.type, icon: IoDocumentTextOutline, color: 'from-orange-500 to-amber-500' };
                            const MetaIcon = meta.icon;

                            // Custom rendering for Sub-Admin Inactivation Requests
                            if (req.type === 'inactivation') {
                                return (
                                    <motion.div key={req._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        className="bg-white border border-[#EDE8E0] hover:border-[#E2B08A] rounded-2xl overflow-hidden shadow-xs transition-all">
                                        <div className="h-[2.5px] w-full bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500" />
                                        <div className="p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 flex-wrap mb-1">
                                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white">
                                                            <IoAlertCircleOutline size={15} />
                                                        </div>
                                                        <h3 className="font-bold text-[#0F172A]">{req.student?.name}</h3>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || ''}`}>
                                                            {req.status === 'pending' ? 'Pending Review' : req.status === 'approved' ? 'Inactivated' : 'Disapproved & Restored'}
                                                        </span>
                                                        <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                                                            Sub-Admin Inactivation Request
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-stone-500 mb-3 font-mono">{req.student?.email}</p>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-3">
                                                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">Scholar & Desk Details</p>
                                                            <p className="text-xs font-bold text-stone-800">
                                                                Original Desk: <span className="text-rose-600 font-black">{req.currentData?.vacatedSeat || 'No desk assigned'}</span>
                                                            </p>
                                                            <p className="text-[11px] text-stone-600 mt-1">
                                                                Mobile: <span className="font-semibold">{req.currentData?.mobile || req.student?.mobile || req.student?.phoneNumber || 'N/A'}</span>
                                                            </p>
                                                            <p className="text-[11px] text-stone-600 mt-0.5">
                                                                Status: <span className="font-semibold">{req.student?.isActive ? 'Active' : 'Inactive'}</span>
                                                            </p>
                                                        </div>

                                                        <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-3">
                                                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">Sub-Admin Submission</p>
                                                            <p className="text-xs font-bold text-stone-900">
                                                                Requested by: <span className="text-orange-700">{req.requestedData?.subAdminName || 'Staff Sub-Admin'}</span>
                                                            </p>
                                                            <p className="text-[11px] text-stone-500 mt-0.5">
                                                                Email: {req.requestedData?.subAdminEmail || 'N/A'}
                                                            </p>
                                                            <p className="text-[11px] text-stone-700 mt-1 italic bg-white p-2 rounded-lg border border-[#EDE8E0]">
                                                                "{req.requestedData?.reason || 'Sub-admin requested scholar inactivation'}"
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-stone-500">Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</p>

                                                    {req.adminResponse && (
                                                        <div className="mt-3 p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                                                            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider mb-1">Super Admin Response</p>
                                                            <p className="text-xs text-stone-700">{req.adminResponse}</p>
                                                            {req.reviewedBy && (
                                                                <p className="text-[10px] text-stone-500 mt-1">Reviewed by: {req.reviewedBy.name || req.reviewedBy}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {req.status === 'pending' && (
                                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                            onClick={() => openReviewModal(req, 'approved')}
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer">
                                                            <IoCheckmarkCircle size={15} /> Approve Inactivation
                                                        </motion.button>
                                                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                            onClick={() => openReviewModal(req, 'rejected')}
                                                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer">
                                                            <IoRefreshOutline size={15} /> Disapprove & Restore Desk
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            // Standard Student Requests
                            return (
                                <motion.div key={req._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white border border-[#EDE8E0] hover:border-[#E2B08A] rounded-2xl overflow-hidden shadow-xs transition-all">
                                    <div className={`h-[2px] w-full bg-gradient-to-r ${meta.color}`} />
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${meta.color} text-white`}><MetaIcon size={14} /></div>
                                                    <h3 className="font-bold text-[#0F172A]">{req.student?.name}</h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || ''}`}>
                                                        {req.status === 'approved' && req.type === 'support' ? 'Solved' : req.status}
                                                    </span>
                                                    <span className="text-xs text-stone-500 font-medium">{meta.label}</span>
                                                </div>
                                                <p className="text-xs text-stone-500 mb-3 font-mono">{req.student?.email}</p>
                                                {req.description && (
                                                    <p className="text-xs text-stone-700 bg-[#FAF6F0] border border-[#EDE8E0] px-3 py-2 rounded-xl italic mb-3">"{req.description}"</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    {[
                                                        { title: 'Current', data: req.currentData, color: 'text-stone-700' },
                                                        { title: 'Requested', data: req.requestedData, color: 'text-orange-600' },
                                                    ].map(({ title, data, color }) => (
                                                        <div key={title} className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-3">
                                                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">{title}</p>
                                                            {req.type === 'seat_change' && <p className={`text-xs font-bold ${color}`}>{data?.seatNumber || 'N/A'}<br /><span className="text-[11px] text-stone-500 font-normal">{data?.floor} – {data?.room}</span></p>}
                                                            {(req.type === 'seat' || req.type === 'shift') && <p className={`text-xs font-bold ${color}`}>Seat: {data?.seatNumber || 'N/A'}<br /><span className="text-[11px] text-stone-500 font-normal">Shift: {getShiftName(data?.shift || data?.requestedShift)}</span></p>}
                                                            {req.type === 'support' && (title === 'Current' ? <p className="text-xs text-stone-500 italic">New Ticket</p> : <div><p className={`text-xs font-bold ${color} capitalize mb-1`}>{data?.category}</p><p className="text-xs text-stone-700">{data?.message}</p></div>)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-stone-500">Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</p>
                                                {req.adminResponse && (
                                                    <div className="mt-3 p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                                                        <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider mb-1">Admin Response</p>
                                                        <p className="text-xs text-stone-700">{req.adminResponse}</p>
                                                    </div>
                                                )}
                                                {req.rating && (
                                                    <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Student Feedback</p>
                                                            <div className="flex gap-0.5">
                                                                {[...Array(5)].map((_, idx) => <IoStar key={idx} size={11} className={idx < req.rating ? "text-amber-500" : "text-stone-300"} />)}
                                                            </div>
                                                        </div>
                                                        {req.ratingFeedback && <p className="text-xs text-stone-700 italic">"{req.ratingFeedback}"</p>}
                                                    </div>
                                                )}
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex sm:flex-col gap-2 shrink-0">
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => openReviewModal(req, 'approved')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                                        <IoCheckmarkCircle size={15} /> {req.type === 'support' ? 'Solve' : 'Approve'}
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => openReviewModal(req, 'rejected')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                                        <IoCloseCircle size={15} /> Reject
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Review Modal */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white border border-[#EDE8E0] rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
                                <div className={`h-[3px] w-full bg-gradient-to-r ${actionType === 'approved' ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-red-500'} -mt-6 -mx-6 mb-5`} />
                                
                                <h2 className="text-xl font-black text-[#0F172A] mb-3">
                                    {selectedRequest?.type === 'inactivation'
                                        ? (actionType === 'approved' ? 'Approve Scholar Inactivation' : 'Disapprove & Restore Desk')
                                        : `${actionType === 'approved' ? 'Approve' : 'Reject'} Request`
                                    }
                                </h2>

                                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl p-4 mb-4">
                                    <p className="text-xs text-stone-600">Scholar: <span className="text-[#0F172A] font-bold">{selectedRequest?.student?.name}</span></p>
                                    <p className="text-xs text-stone-600 mt-1">Type: <span className="text-[#0F172A] font-bold capitalize">{selectedRequest?.type}</span></p>
                                    
                                    {/* Inactivation Specific Guidance */}
                                    {selectedRequest?.type === 'inactivation' && actionType === 'rejected' && (
                                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 text-xs leading-relaxed">
                                            <div className="flex items-center gap-1.5 font-bold mb-1 text-rose-800">
                                                <IoWarningOutline size={16} /> Forceful Desk Restoration:
                                            </div>
                                            Disapproving will immediately restore <strong>{selectedRequest?.student?.name}</strong> to active status and forcefully reassign them back to <strong>{selectedRequest?.currentData?.vacatedSeat || 'their previous desk'}</strong>. If that desk is currently occupied, the occupant will be moved to a vacant desk shift-wise, or given temporary borrower status.
                                        </div>
                                    )}

                                    {selectedRequest?.type === 'inactivation' && actionType === 'approved' && (
                                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs leading-relaxed">
                                            <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800">
                                                <IoCheckmarkCircle size={16} /> Confirm Inactivation:
                                            </div>
                                            Confirming will finalize the scholar as inactive. All desk allocations and temporary reservations remain vacated.
                                        </div>
                                    )}

                                    {(selectedRequest?.type === 'seat_change' || selectedRequest?.type === 'shift') && actionType === 'approved' && (
                                        <div className="mt-4 pt-4 border-t border-[#EDE8E0]">
                                            <p className="text-xs font-bold text-[#0F172A] mb-2 uppercase tracking-wider">Fee Management</p>
                                            <p className="text-[11px] text-stone-500 mb-3 bg-white border border-[#EDE8E0] p-2 rounded-xl">
                                                By default, the student's original fee is maintained during a change.
                                            </p>
                                            
                                            <p className="text-xs text-stone-600 mb-3">Original Fee: <span className="text-[#0F172A] font-bold">₹{selectedRequest?.studentPrice ?? 'Unknown'}</span></p>

                                            <label className="flex items-center gap-2 text-xs text-stone-700 font-medium mb-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={useBaseFee} 
                                                    onChange={e => { 
                                                        setUseBaseFee(e.target.checked); 
                                                        if(e.target.checked) setUpdatedFee(''); 
                                                    }} 
                                                    className="w-4 h-4 rounded border-[#E2DBD2] text-orange-500 focus:ring-orange-500/20" 
                                                />
                                                Update to new Base Fee
                                            </label>

                                            {!useBaseFee && (
                                                <div className="mb-2">
                                                    <label className="block text-[11px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">
                                                        Custom Fee Override (Leave blank for original fee)
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={updatedFee} 
                                                            onChange={e => setUpdatedFee(e.target.value)} 
                                                            placeholder="e.g. 1500" 
                                                            className="w-full bg-white border border-[#E2DBD2] rounded-xl pl-8 pr-4 py-2.5 text-[#0F172A] text-xs font-bold focus:border-orange-500 outline-none transition-all" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <label className="block text-[11px] text-stone-500 font-bold uppercase tracking-wider mb-1.5">
                                    {selectedRequest?.type === 'inactivation'
                                        ? (actionType === 'rejected' ? 'Reason for Disapproval' : 'Super Admin Note (Optional)')
                                        : `Admin Response ${actionType === 'rejected' ? '(Required)' : ''}`
                                    }
                                </label>
                                <textarea 
                                    value={adminResponse} 
                                    onChange={e => setAdminResponse(e.target.value)} 
                                    rows={3}
                                    placeholder={
                                        selectedRequest?.type === 'inactivation'
                                            ? (actionType === 'rejected' ? 'e.g., False alarm / fees cleared by student...' : 'Optional confirmation note...')
                                            : (actionType === 'approved' ? 'Optional message...' : 'Reason for rejection...')
                                    }
                                    className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-[#0F172A] text-xs focus:border-orange-500 outline-none resize-none mb-4 transition-all" 
                                />

                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)}
                                        className="flex-1 py-2.5 bg-[#FAF6F0] hover:bg-stone-100 border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                        Cancel
                                    </button>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={handleAction} 
                                        disabled={processing || (actionType === 'rejected' && selectedRequest?.type !== 'inactivation' && !adminResponse.trim())}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer ${
                                            actionType === 'approved' 
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25' 
                                                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25'
                                        }`}>
                                        {processing 
                                            ? 'Processing...' 
                                            : selectedRequest?.type === 'inactivation'
                                                ? (actionType === 'approved' ? 'Confirm Inactivation' : 'Confirm Disapproval & Restore')
                                                : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`
                                        }
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RequestManagement;
