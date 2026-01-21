import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCash, IoCalendar } from 'react-icons/io5';

const FeeStatus = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const response = await api.get('/student/fees');
            setFees(response.data.fees);
        } catch (error) {
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0);
    const paidCount = fees.filter(f => f.status === 'paid').length;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Fee Status
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <IoCash size={32} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Paid</p>
                                <p className="text-3xl font-bold text-green-400">₹{totalPaid}</p>
                                <p className="text-xs text-gray-400 mt-1">{paidCount} months</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <IoCash size={32} className="text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Pending</p>
                                <p className="text-3xl font-bold text-yellow-400">₹{totalPending}</p>
                                <p className="text-xs text-gray-400 mt-1">{fees.length - paidCount} months</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <IoCalendar size={32} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Records</p>
                                <p className="text-3xl font-bold">{fees.length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Fee History */}
                {loading ? (
                    <SkeletonLoader type="table" count={1} />
                ) : (
                    <Card>
                        <h2 className="text-2xl font-bold mb-6">Payment History</h2>
                        {fees.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No fee records yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-4">Month/Year</th>
                                            <th className="text-right p-4">Amount</th>
                                            <th className="text-left p-4">Due Date</th>
                                            <th className="text-left p-4">Paid Date</th>
                                            <th className="text-left p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fees.map((fee) => (
                                            <tr key={fee._id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4 font-semibold">
                                                    {monthNames[fee.month - 1]} {fee.year}
                                                </td>
                                                <td className="p-4 text-right font-bold">₹{fee.amount}</td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    {fee.paidDate ? (
                                                        <span className="text-green-400">
                                                            {new Date(fee.paidDate).toLocaleDateString('en-IN')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}

                {/* Payment Instructions */}
                <Card className="mt-6">
                    <h3 className="text-xl font-bold mb-4">💵 Payment Instructions</h3>
                    <div className="space-y-3 text-gray-300">
                        <p>1. Visit the library office during working hours (9:00 AM - 6:00 PM)</p>
                        <p>2. Make cash payment to the admin</p>
                        <p>3. Admin will mark your payment in the system</p>
                        <p>4. You'll receive a confirmation notification</p>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm">
                            ⚠️ <strong>Important:</strong> Pay before the due date to avoid late fees.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FeeStatus;
