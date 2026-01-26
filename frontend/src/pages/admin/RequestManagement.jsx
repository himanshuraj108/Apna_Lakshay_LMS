import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const RequestManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [actionType, setActionType] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await api.get('/admin/requests');
            setRequests(response.data.requests);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setAdminResponse('');
        setShowModal(true);
    };

    const handleAction = async () => {
        if (!selectedRequest) return;

        setProcessing(true);
        setError('');

        try {
            await api.put(`/admin/requests/${selectedRequest._id}`, {
                status: actionType,
                adminResponse
            });

            setSuccess(`Request ${actionType} successfully!`);
            fetchRequests();
            setShowModal(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || `Failed to ${actionType} request`);
        } finally {
            setProcessing(false);
        }
    };

    const getFilteredRequests = () => {
        if (filter === 'all') return requests;
        return requests.filter(r => r.status === filter);
    };

    const filteredRequests = getFilteredRequests();

    const { getShiftName } = useShifts();

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Student Requests
                </h1>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6"
                    >
                        {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        <Button
                            variant={filter === 'pending' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('pending')}
                        >
                            Pending ({requests.filter(r => r.status === 'pending').length})
                        </Button>
                        <Button
                            variant={filter === 'approved' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('approved')}
                        >
                            Approved ({requests.filter(r => r.status === 'approved').length})
                        </Button>
                        <Button
                            variant={filter === 'rejected' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('rejected')}
                        >
                            Rejected ({requests.filter(r => r.status === 'rejected').length})
                        </Button>
                        <Button
                            variant={filter === 'all' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('all')}
                        >
                            All ({requests.length})
                        </Button>
                    </div>
                </Card>

                {/* Requests List */}
                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.length === 0 ? (
                            <Card>
                                <p className="text-center text-gray-400 py-8">No requests found</p>
                            </Card>
                        ) : (
                            filteredRequests.map((request) => (
                                <Card key={request._id}>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold">{request.student?.name}</h3>
                                                <Badge
                                                    variant={
                                                        request.status === 'pending' ? 'yellow' :
                                                            request.status === 'approved' ? 'green' : 'red'
                                                    }
                                                >
                                                    {request.status === 'approved' && request.type === 'support' ? 'Solved' : request.status}
                                                </Badge>
                                                <span className="text-sm text-gray-400 capitalize">
                                                    {request.type === 'seat_change' ? 'Seat' : request.type} Change
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-400 mb-3">{request.student?.email}</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div className="bg-white/5 rounded-lg p-3">
                                                    <p className="text-xs text-gray-400 mb-1">Current Data</p>
                                                    {request.type === 'seat_change' ? (
                                                        <div>
                                                            <p className="text-sm font-semibold">{request.currentData?.seatNumber || 'N/A'}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {request.currentData?.floor || 'N/A'} - {request.currentData?.room || 'N/A'}
                                                            </p>
                                                        </div>
                                                    ) : request.type === 'shift' ? (
                                                        <div>
                                                            <p className="text-sm font-semibold">Seat: {request.currentData?.seatNumber || 'N/A'}</p>
                                                            <p className="text-sm text-gray-300">Shift: <span className="font-medium">{getShiftName(request.currentData?.shift)}</span></p>
                                                        </div>
                                                    ) : request.type === 'support' ? (
                                                        <p className="text-sm text-gray-500 italic">New Ticket</p>
                                                    ) : (
                                                        <p className="text-sm">{JSON.stringify(request.currentData)}</p>
                                                    )}
                                                </div>
                                                <div className="bg-white/5 rounded-lg p-3">
                                                    <p className="text-xs text-gray-400 mb-1">Requested Data</p>
                                                    {request.type === 'seat_change' ? (
                                                        <div>
                                                            <p className="text-sm font-semibold text-green-400">{request.requestedData?.seatNumber || 'N/A'}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {request.requestedData?.floor || 'N/A'} - {request.requestedData?.room || 'N/A'}
                                                            </p>
                                                            {request.requestedData.reason && (
                                                                <p className="text-xs text-gray-500 mt-2 italic">
                                                                    Reason: {request.requestedData.reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : request.type === 'shift' ? (
                                                        <div>
                                                            <p className="text-sm text-green-400 font-semibold">
                                                                Target Shift: <span>{getShiftName(request.requestedData?.shift)}</span>
                                                            </p>
                                                        </div>
                                                    ) : request.type === 'support' ? (
                                                        <div>
                                                            <p className="text-sm text-yellow-400 font-semibold capitalize">
                                                                Category: {request.requestedData?.category}
                                                            </p>
                                                            <div className="mt-2 text-sm text-gray-300 bg-white/5 p-2 rounded">
                                                                {request.requestedData?.message}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm">{JSON.stringify(request.requestedData)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-400">
                                                Submitted: {new Date(request.createdAt).toLocaleString('en-IN')}
                                            </p>

                                            {request.adminResponse && (
                                                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <p className="text-xs text-gray-400 mb-1">Admin Response:</p>
                                                    <p className="text-sm">{request.adminResponse}</p>
                                                </div>
                                            )}
                                        </div>

                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="success"
                                                    onClick={() => openReviewModal(request, 'approved')}
                                                >
                                                    <IoCheckmarkCircle className="inline mr-2" />
                                                    {request.type === 'support' ? 'Mark Solved' : 'Approve'}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => openReviewModal(request, 'rejected')}
                                                >
                                                    <IoCloseCircle className="inline mr-2" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Review Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={`${actionType === 'approved' ? 'Approve' : 'Reject'} Request`}
                >
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-2">Student: {selectedRequest?.student?.name}</p>
                            <p className="text-sm text-gray-400">Request Type: {selectedRequest?.type}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Admin Response {actionType === 'rejected' && '(Required)'}
                            </label>
                            <textarea
                                value={adminResponse}
                                onChange={(e) => setAdminResponse(e.target.value)}
                                className="input min-h-[100px]"
                                placeholder={
                                    actionType === 'approved'
                                        ? 'Optional approval message...'
                                        : 'Please provide a reason for rejection...'
                                }
                                required={actionType === 'rejected'}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant={actionType === 'approved' ? 'success' : 'danger'}
                                onClick={handleAction}
                                disabled={processing || (actionType === 'rejected' && !adminResponse.trim())}
                                className="flex-1"
                            >
                                {processing ? 'Processing...' : `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default RequestManagement;
