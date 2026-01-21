import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCash, IoCheckmarkCircle } from 'react-icons/io5';

const FeeManagement = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, paid, pending, overdue
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const response = await api.get('/admin/fees');
            setFees(response.data.fees);
        } catch (error) {
            console.error('Error fetching fees:', error);
            setError('Failed to load fees');
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (feeId) => {
        try {
            await api.put(`/admin/fees/${feeId}/paid`);
            setSuccess('Fee marked as paid successfully!');
            fetchFees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to mark fee as paid');
            setTimeout(() => setError(''), 3000);
        }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getFilteredFees = () => {
        if (filter === 'all') return fees;
        return fees.filter(fee => fee.status === filter);
    };

    const filteredFees = getFilteredFees();
    const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
    const totalOverdue = fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Fee Management
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

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <IoCash size={32} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Collected</p>
                                <p className="text-3xl font-bold text-green-400">₹{totalCollected}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <IoCash size={32} className="text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Pending</p>
                                <p className="text-3xl font-bold text-yellow-400">₹{totalPending}</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-lg">
                                <IoCash size={32} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Overdue</p>
                                <p className="text-3xl font-bold text-red-400">₹{totalOverdue}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('all')}
                        >
                            All ({fees.length})
                        </Button>
                        <Button
                            variant={filter === 'paid' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('paid')}
                        >
                            Paid ({fees.filter(f => f.status === 'paid').length})
                        </Button>
                        <Button
                            variant={filter === 'pending' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('pending')}
                        >
                            Pending ({fees.filter(f => f.status === 'pending').length})
                        </Button>
                        <Button
                            variant={filter === 'overdue' ? 'primary' : 'secondary'}
                            onClick={() => setFilter('overdue')}
                        >
                            Overdue ({fees.filter(f => f.status === 'overdue').length})
                        </Button>
                    </div>
                </Card>

                {/* Fee Table */}
                {loading ? (
                    <SkeletonLoader type="table" count={1} />
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4">Student</th>
                                        <th className="text-left p-4">Month/Year</th>
                                        <th className="text-right p-4">Amount</th>
                                        <th className="text-left p-4">Due Date</th>
                                        <th className="text-left p-4">Status</th>
                                        <th className="text-right p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFees.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center p-8 text-gray-400">
                                                No fee records found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFees.map((fee) => (
                                            <tr key={fee._id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-semibold">{fee.student?.name || 'Unknown'}</p>
                                                        <p className="text-sm text-gray-400">{fee.student?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {monthNames[fee.month - 1]} {fee.year}
                                                </td>
                                                <td className="p-4 text-right font-bold">₹{fee.amount}</td>
                                                <td className="p-4">
                                                    {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="p-4">
                                                    <Badge
                                                        variant={
                                                            fee.status === 'paid' ? 'green' :
                                                                fee.status === 'overdue' ? 'red' : 'yellow'
                                                        }
                                                    >
                                                        {fee.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {fee.status !== 'paid' && (
                                                        <Button
                                                            variant="success"
                                                            onClick={() => markAsPaid(fee._id)}
                                                            className="text-sm"
                                                        >
                                                            <IoCheckmarkCircle className="inline mr-1" /> Mark Paid
                                                        </Button>
                                                    )}
                                                    {fee.status === 'paid' && (
                                                        <span className="text-sm text-gray-400">
                                                            Paid on {new Date(fee.paidDate).toLocaleDateString('en-IN')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default FeeManagement;
