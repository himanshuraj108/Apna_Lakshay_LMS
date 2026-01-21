import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoCalendar, IoCheckmark, IoClose } from 'react-icons/io5';

const Attendance = () => {
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const response = await api.get('/student/attendance');
            setAttendanceData(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-6xl mx-auto">
                    <SkeletonLoader type="card" count={3} />
                </div>
            </div>
        );
    }

    const { myAttendance = [], summary = {}, rankings = [] } = attendanceData || {};

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Attendance & Ranking
                </h1>

                {/* Monthly Summary */}
                <Card className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">Monthly Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 rounded-lg p-6">
                            <p className="text-gray-400 text-sm mb-2">Total Days</p>
                            <p className="text-4xl font-bold">{summary.total || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-6">
                            <p className="text-gray-400 text-sm mb-2">Present</p>
                            <p className="text-4xl font-bold text-green-400">{summary.present || 0}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-6">
                            <p className="text-gray-400 text-sm mb-2">Percentage</p>
                            <p className="text-4xl font-bold text-blue-400">{summary.percentage || 0}%</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Attendance Progress</span>
                            <span>{summary.percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4">
                            <div
                                className="bg-gradient-primary h-4 rounded-full transition-all duration-500"
                                style={{ width: `${summary.percentage || 0}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Daily Attendance */}
                <Card className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">Daily Attendance</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {myAttendance.slice(0, 21).map((record) => (
                            <div
                                key={record._id}
                                className={`p-4 rounded-lg border-2 ${record.status === 'present'
                                        ? 'bg-green-500/10 border-green-500/50'
                                        : 'bg-red-500/10 border-red-500/50'
                                    }`}
                            >
                                <div className="flex items-center justify-center mb-2">
                                    {record.status === 'present' ? (
                                        <IoCheckmark size={24} className="text-green-400" />
                                    ) : (
                                        <IoClose size={24} className="text-red-400" />
                                    )}
                                </div>
                                <p className="text-xs text-center text-gray-400">
                                    {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-xs text-center capitalize mt-1">
                                    {record.status}
                                </p>
                            </div>
                        ))}
                    </div>
                    {myAttendance.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No attendance records yet</p>
                    )}
                </Card>

                {/* Rankings */}
                <Card>
                    <h2 className="text-2xl font-bold mb-4">
                        <IoCalendar className="inline mr-2" />
                        Attendance Rankings
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4">Rank</th>
                                    <th className="text-left p-4">Student Name</th>
                                    <th className="text-right p-4">Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankings.map((student, index) => (
                                    <tr
                                        key={student.studentId}
                                        className={`border-b border-white/5 ${student.isMe ? 'bg-primary-500/20 font-bold' : ''
                                            }`}
                                    >
                                        <td className="p-4">
                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${student.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    student.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                        student.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-white/5'
                                                }`}>
                                                {student.rank}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {student.name}
                                            {student.isMe && <Badge variant="green" className="ml-2">You</Badge>}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`text-lg font-bold ${student.percentage >= 90 ? 'text-green-400' :
                                                    student.percentage >= 75 ? 'text-yellow-400' :
                                                        'text-red-400'
                                                }`}>
                                                {student.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {rankings.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No rankings available yet</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Attendance;
