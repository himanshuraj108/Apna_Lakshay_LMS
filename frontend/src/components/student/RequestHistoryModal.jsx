import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoClose, IoTimeOutline, IoCheckmarkCircle, IoCloseCircle,
    IoAlertCircleOutline, IoDocumentTextOutline, IoTrashOutline
} from 'react-icons/io5';
import api from '../../utils/api';

const STATUS_MAP = {
    approved: { label: 'Approved', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    withdrawn: { label: 'Withdrawn', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const StatusPill = ({ status, type }) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    const label = status === 'approved' && type === 'support' ? 'Solved' : s.label;
    return (
        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${s.color}`}>
            {label}
        </span>
    );
};

const StatusIcon = ({ status }) => {
    if (status === 'approved') return <IoCheckmarkCircle size={18} className="text-green-400 shrink-0" />;
    if (status === 'rejected' || status === 'withdrawn') return <IoCloseCircle size={18} className="text-red-400 shrink-0" />;
    return <IoTimeOutline size={18} className="text-amber-400 shrink-0" />;
};

const RequestHistoryModal = ({ isOpen, onClose }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) fetchRequests();
    }, [isOpen]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/student/request');
            setRequests(res.data.requests);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const withdraw = async (id) => {
        try {
            await api.put(`/student/request/${id}/withdraw`);
            fetchRequests();
        } catch { alert('Failed to withdraw request'); }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-2xl h-[78vh] flex flex-col rounded-2xl border border-gray-100 shadow-2xl overflow-hidden bg-white"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-orange-400 to-orange-600" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <IoDocumentTextOutline size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Request History</h2>
                                <p className="text-xs text-gray-500">Track your submitted requests</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-gray-200 mb-1 shrink-0" />

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
                                <p className="text-sm text-gray-500">Loading requests…</p>
                            </div>
                        )}

                        {!loading && requests.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <IoAlertCircleOutline size={32} className="text-gray-400" />
                                <p className="text-gray-500 text-sm">No requests found</p>
                            </div>
                        )}

                        {!loading && requests.map((req, i) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all"
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <StatusIcon status={req.status} />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 capitalize">
                                                {req.type === 'seat_change' ? 'Seat Change' : req.type} Request
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusPill status={req.status} type={req.type} />
                                </div>

                                {/* Details */}
                                <div className="ml-7 space-y-2">
                                    {req.requestedData?.category && (
                                        <p className="text-xs text-gray-500">
                                            <span className="text-gray-400 mr-1">Category:</span>
                                            <span className="text-gray-700 capitalize">{req.requestedData.category}</span>
                                        </p>
                                    )}
                                    {req.requestedData?.message && (
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
                                            {req.requestedData.message}
                                        </div>
                                    )}
                                    {req.type === 'seat_change' && (
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
                                            <p><span className="text-gray-400">Reason:</span> <span className="text-gray-700">{req.requestedData?.reason || 'No reason provided'}</span></p>
                                            <p className="text-gray-500 mt-0.5">Seat {req.requestedData?.seatNumber} · {req.requestedData?.room}</p>
                                        </div>
                                    )}
                                    {req.adminResponse && (
                                        <div className="border-l-2 border-orange-400 pl-3 py-1.5 bg-orange-50 rounded-r-lg">
                                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Admin Response</p>
                                            <p className="text-xs text-gray-700">{req.adminResponse}</p>
                                        </div>
                                    )}
                                    {req.status === 'pending' && (
                                        <button
                                            onClick={() => withdraw(req._id)}
                                            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-1 -ml-2 transition-colors mt-1"
                                        >
                                            <IoTrashOutline size={13} /> Withdraw Ticket
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RequestHistoryModal;
