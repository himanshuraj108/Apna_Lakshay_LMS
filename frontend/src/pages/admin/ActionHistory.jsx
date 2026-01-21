import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { FaHistory, FaSearch, FaFilter, FaCalendarAlt, FaUser, FaInfoCircle } from 'react-icons/fa';

const ActionHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        action: '',
        search: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.search) queryParams.append('search', filters.search);

            const response = await api.get(`/admin/action-history?${queryParams.toString()}`);
            if (response.data.success) {
                setLogs(response.data.logs);
            }
        } catch (error) {
            console.error('Error fetching action logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const getActionBadge = (action) => {
        const styles = {
            student_created: 'success',
            student_updated: 'warning',
            student_deleted_soft: 'warning',
            student_deleted_hard: 'danger',
            seat_assigned: 'purple',
            seat_freed: 'warning',
            fee_marked_paid: 'success',
            request_approved: 'success',
            request_rejected: 'danger',
            notification_sent: 'info',
            attendance_marked: 'primary'
        };

        const labels = {
            student_created: 'Student Created',
            student_updated: 'Student Updated',
            student_deleted_soft: 'Soft Deleted',
            student_deleted_hard: 'Hard Deleted',
            seat_assigned: 'Seat Assigned',
            seat_freed: 'Seat Freed',
            fee_marked_paid: 'Fee Paid',
            request_approved: 'Request Approved',
            request_rejected: 'Request Rejected',
            notification_sent: 'Notification Sent',
            attendance_marked: 'Attendance Marked'
        };

        return <Badge variant={styles[action] || 'default'}>{labels[action] || action}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Action History
                </h1>
                <div className="text-gray-400 text-sm">
                    Showing last 100 actions
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <FaSearch /> Search
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by name or details..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <FaFilter /> Action Type
                        </label>
                        <select
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                            <option value="">All Actions</option>
                            <option value="student_created">Student Created</option>
                            <option value="student_updated">Student Updated</option>
                            <option value="seat_assigned">Seat Assigned</option>
                            <option value="fee_marked_paid">Fee Paid</option>
                            <option value="request_approved">Request Approved</option>
                            <option value="notification_sent">Notification Sent</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <FaCalendarAlt /> Start Date
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 flex items-center gap-2">
                            <FaCalendarAlt /> End Date
                        </label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>
            </Card>

            {/* Logs Table */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <SkeletonLoader key={i} height="60px" />)}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="p-4 font-medium">Time</th>
                                <th className="p-4 font-medium">Admin</th>
                                <th className="p-4 font-medium">Action</th>
                                <th className="p-4 font-medium">Target</th>
                                <th className="p-4 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <motion.tr
                                        key={log._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4 text-sm text-gray-300">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-purple-300">
                                                <FaUser className="text-xs" />
                                                {log.adminName}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {log.targetName || '-'}
                                            {log.targetModel && (
                                                <span className="text-xs text-gray-500 block">
                                                    {log.targetModel}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            <div className="flex items-start gap-2 max-w-xs">
                                                <FaInfoCircle className="mt-1 flex-shrink-0 text-gray-500" />
                                                <span className="truncate hover:whitespace-normal transition-all duration-300">
                                                    {log.details}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colspan="5" className="p-8 text-center text-gray-400">
                                        No actions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ActionHistory;
