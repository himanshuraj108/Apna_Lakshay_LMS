import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoDocumentTextOutline,
    IoChatbubbleOutline, IoSwapHorizontalOutline, IoHelpCircleOutline,
    IoTimeOutline
} from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const PAGE_BG = { background: '#050508' };

const TYPE_META = {
    seat: { label: 'Seat Change', icon: IoSwapHorizontalOutline, color: 'from-blue-500 to-indigo-500' },
    seat_change: { label: 'Seat Change', icon: IoSwapHorizontalOutline, color: 'from-blue-500 to-indigo-500' },
    shift: { label: 'Shift Change', icon: IoTimeOutline, color: 'from-purple-500 to-violet-500' },
    support: { label: 'Support Ticket', icon: IoHelpCircleOutline, color: 'from-amber-500 to-orange-500' },
};

const STATUS_COLORS = {
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    approved: 'text-green-400 bg-green-500/10 border-green-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const RequestManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const { getShiftName } = useShifts();

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/requests');
            setRequests(res.data.requests);
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
        if (!selectedRequest) return;
        setProcessing(true); setError('');
        try {
            await api.put(`/admin/requests/${selectedRequest._id}`, { 
                status: actionType, 
                adminResponse,
                updatedFee: actionType === 'approved' && !useBaseFee ? updatedFee : undefined,
                useBaseFee: actionType === 'approved' ? useBaseFee : false
            });
            setSuccess(`Request ${actionType} successfully!`);
            fetchRequests(); setShowModal(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setError(e.response?.data?.message || `Failed to ${actionType} request`); }
        finally { setProcessing(false); }
    };

    const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);
    const TABS = [
        { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
        { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
        { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
        { key: 'all', label: 'All', count: requests.length },
    ];

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-6%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
                <div className="absolute bottom-[5%] right-[-8%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24">
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
                            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                                <IoDocumentTextOutline size={14} className="text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">Student Requests</h1>
                    </div>
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === t.key
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400'}`}>
                            {t.label} <span className="opacity-70">({t.count})</span>
                        </button>
                    ))}
                </div>

                {/* Request Cards */}
                {loading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white/3 border border-white/8 rounded-2xl h-40 animate-pulse" />)}</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-10 text-center">
                        <IoDocumentTextOutline size={40} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No requests found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredRequests.map((req, i) => {
                            const meta = TYPE_META[req.type] || { label: req.type, icon: IoDocumentTextOutline, color: 'from-gray-500 to-slate-500' };
                            const MetaIcon = meta.icon;
                            return (
                                <motion.div key={req._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                                    <div className={`h-px w-full bg-gradient-to-r ${meta.color} opacity-60`} />
                                    <div className="p-5">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${meta.color}`}><MetaIcon size={14} className="text-white" /></div>
                                                    <h3 className="font-bold text-white">{req.student?.name}</h3>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[req.status] || ''}`}>
                                                        {req.status === 'approved' && req.type === 'support' ? 'Solved' : req.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{meta.label}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-3">{req.student?.email}</p>
                                                {req.description && (
                                                    <p className="text-sm text-gray-300 bg-white/5 border border-white/8 px-3 py-2 rounded-xl italic mb-3">"{req.description}"</p>
                                                )}
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    {[
                                                        { title: 'Current', data: req.currentData, color: 'text-gray-300' },
                                                        { title: 'Requested', data: req.requestedData, color: 'text-green-400' },
                                                    ].map(({ title, data, color }) => (
                                                        <div key={title} className="bg-white/5 border border-white/8 rounded-xl p-3">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                                                            {req.type === 'seat_change' && <p className={`text-sm font-semibold ${color}`}>{data?.seatNumber || 'N/A'}<br /><span className="text-xs text-gray-500">{data?.floor} – {data?.room}</span></p>}
                                                            {(req.type === 'seat' || req.type === 'shift') && <p className={`text-sm font-semibold ${color}`}>Seat: {data?.seatNumber || 'N/A'}<br />Shift: {getShiftName(data?.shift || data?.requestedShift)}</p>}
                                                            {req.type === 'support' && (title === 'Current' ? <p className="text-xs text-gray-500 italic">New Ticket</p> : <div><p className={`text-xs font-semibold ${color} capitalize mb-1`}>{data?.category}</p><p className="text-xs text-gray-300">{data?.message}</p></div>)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-600">Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</p>
                                                {req.adminResponse && (
                                                    <div className="mt-3 p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Admin Response</p>
                                                        <p className="text-sm text-gray-300">{req.adminResponse}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex sm:flex-col gap-2 shrink-0">
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => openReviewModal(req, 'approved')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-400 rounded-xl text-sm font-semibold transition-all">
                                                        <IoCheckmarkCircle size={16} /> {req.type === 'support' ? 'Solve' : 'Approve'}
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => openReviewModal(req, 'rejected')}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/25 text-red-400 rounded-xl text-sm font-semibold transition-all">
                                                        <IoCloseCircle size={16} /> Reject
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
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-gray-950 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                <div className={`h-px w-full bg-gradient-to-r ${actionType === 'approved' ? 'from-green-500 to-teal-500' : 'from-red-500 to-rose-500'} mb-5`} />
                                <h2 className="text-xl font-bold text-white mb-4">{actionType === 'approved' ? 'Approve' : 'Reject'} Request</h2>
                                <div className="bg-white/5 border border-white/8 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-400">Student: <span className="text-white font-medium">{selectedRequest?.student?.name}</span></p>
                                    <p className="text-sm text-gray-400 mt-1">Type: <span className="text-white font-medium capitalize">{selectedRequest?.type}</span></p>
                                    
                                    {(selectedRequest?.type === 'seat_change' || selectedRequest?.type === 'shift') && actionType === 'approved' && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-sm font-semibold text-white mb-3">Fee Management</p>
                                            <p className="text-xs text-gray-400 mb-3 bg-white/5 p-2 rounded">
                                                By default, the student's original fee is maintained during a change.
                                            </p>
                                            
                                            <p className="text-sm text-gray-400 mb-3">Original Fee: <span className="text-white font-medium">₹{selectedRequest?.studentPrice ?? 'Unknown'}</span></p>

                                            <label className="flex items-center gap-2 text-sm text-gray-300 mb-4 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={useBaseFee} 
                                                    onChange={e => { 
                                                        setUseBaseFee(e.target.checked); 
                                                        if(e.target.checked) setUpdatedFee(''); 
                                                    }} 
                                                    className="w-4 h-4 rounded bg-gray-900 border-white/20 text-indigo-500 focus:ring-indigo-500/50" 
                                                />
                                                Update to new Base Fee
                                            </label>

                                            {!useBaseFee && (
                                                <div className="mb-2">
                                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                                                        Custom Fee Override (Leave blank for original fee)
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={updatedFee} 
                                                            onChange={e => setUpdatedFee(e.target.value)} 
                                                            placeholder="e.g. 1500" 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:border-indigo-500/50 outline-none transition-all" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Admin Response {actionType === 'rejected' && <span className="text-red-400">(Required)</span>}
                                </label>
                                <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)} rows={3}
                                    placeholder={actionType === 'approved' ? 'Optional message…' : 'Reason for rejection…'}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500/50 outline-none resize-none mb-4 transition-all" />
                                <div className="flex gap-3">
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={handleAction} disabled={processing || (actionType === 'rejected' && !adminResponse.trim())}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${actionType === 'approved' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : 'bg-red-500 text-white shadow-lg shadow-red-500/25'}`}>
                                        {processing ? 'Processing…' : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
                                    </motion.button>
                                    <button onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                        Cancel
                                    </button>
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
