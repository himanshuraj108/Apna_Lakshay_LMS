import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoTimeOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoAlertCircleOutline } from 'react-icons/io5';
import api from '../../utils/api';
import Badge from '../ui/Badge';

const RequestHistoryModal = ({ isOpen, onClose }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student/request');
            setRequests(response.data.requests);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, type) => {
        switch (status) {
            case 'approved':
                return <Badge variant="green">{type === 'support' ? 'Solved' : 'Approved'}</Badge>;
            case 'rejected': return <Badge variant="red">Rejected</Badge>;
            case 'withdrawn': return <Badge variant="gray">Withdrawn</Badge>;
            default: return <Badge variant="yellow">Pending</Badge>;
        }
    };

    const getIcon = (status) => {
        switch (status) {
            case 'approved': return <IoCheckmarkCircleOutline className="text-green-500 text-xl" />;
            case 'rejected': return <IoCloseCircleOutline className="text-red-500 text-xl" />;
            case 'withdrawn': return <IoCloseCircleOutline className="text-gray-500 text-xl" />;
            default: return <IoTimeOutline className="text-yellow-500 text-xl" />;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <IoClose size={24} />
                    </button>

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <IoTimeOutline className="text-blue-500" />
                            Request History
                        </h2>
                        <p className="text-sm text-gray-400">Track the status of your submitted requests</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading requests...</div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20 flex flex-col items-center">
                                <IoAlertCircleOutline className="text-gray-600 text-4xl mb-4" />
                                <p className="text-gray-400">No requests found</p>
                            </div>
                        ) : (
                            requests.map((request) => (
                                <div key={request._id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            {getIcon(request.status)}
                                            <div>
                                                <h3 className="font-semibold text-white capitalize flex items-center gap-2">
                                                    {request.type === 'seat_change' ? 'Seat Change' : request.type} Request
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status, request.type)}
                                    </div>

                                    <div className="ml-8 space-y-2">
                                        {request.requestedData?.category && (
                                            <p className="text-sm text-gray-300">
                                                <span className="text-gray-500 mr-2">Category:</span>
                                                <span className="capitalize">{request.requestedData.category}</span>
                                            </p>
                                        )}
                                        {request.requestedData?.message && (
                                            <div className="bg-black/30 p-3 rounded-lg text-sm text-gray-300">
                                                {request.requestedData.message}
                                            </div>
                                        )}
                                        {/* Seat Change Specifics */}
                                        {request.type === 'seat_change' && (
                                            <div className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg">
                                                <p>Reason: {request.requestedData.reason}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Requested: Seat {request.requestedData.seatNumber} ({request.requestedData.room})
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Withdraw Button for Pending Requests */}
                                    {request.status === 'pending' && (
                                        <div className="mt-3 ml-8">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/student/request/${request._id}/withdraw`);
                                                        fetchRequests(); // Refresh list
                                                    } catch (err) {
                                                        console.error('Failed to withdraw request', err);
                                                        alert('Failed to withdraw request');
                                                    }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 flex items-center gap-1"
                                            >
                                                <IoCloseCircleOutline /> Withdraw Ticket
                                            </button>
                                        </div>
                                    )}

                                    {request.adminResponse && (
                                        <div className="mt-4 ml-8 border-l-2 border-blue-500 pl-4 py-2 bg-blue-500/10 rounded-r-lg">
                                            <p className="text-xs text-blue-400 font-bold mb-1">ADMIN RESPONSE</p>
                                            <p className="text-sm text-white">{request.adminResponse}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default RequestHistoryModal;
