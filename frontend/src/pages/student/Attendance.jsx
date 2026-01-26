import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import {
    IoArrowBack,
    IoCalendar,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoTimeOutline,
    IoHourglassOutline,
    IoDocumentTextOutline,
    IoAnalytics,
    IoScan
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import AttendanceScanner from '../../components/student/AttendanceScanner';

const Attendance = () => {
    const { user } = useAuth();
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);

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

    const handleQrScan = async (token) => {
        setShowScanner(false);
        try {
            const response = await api.post('/student/attendance/qr-scan', { qrToken: token });
            if (response.data.success) {
                setScanMessage({ type: 'success', text: response.data.message });
                fetchAttendance();
                setTimeout(() => setScanMessage(null), 5000);
            }
        } catch (error) {
            setScanMessage({
                type: 'error',
                text: error.response?.data?.message || 'Scan failed'
            });
            setTimeout(() => setScanMessage(null), 5000);
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

    // Calculate total hours
    const totalMinutes = myAttendance.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalHoursBytes = Math.floor(totalMinutes / 60);
    const totalMinutesRemainder = totalMinutes % 60;
    const totalDurationStr = `${totalHoursBytes}h ${totalMinutesRemainder}m`;

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/student">
                            <Button variant="secondary">
                                <IoArrowBack className="inline mr-2" /> Back
                            </Button>
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            Attendance
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {user?.seat && (
                            <Button
                                variant="primary"
                                onClick={() => setShowScanner(true)}
                            >
                                <IoScan className="mr-2" /> Scan Entry/Exit
                            </Button>
                        )}
                        <Button
                            variant={showAnalytics ? "primary" : "secondary"}
                            onClick={() => setShowAnalytics(!showAnalytics)}
                        >
                            <IoAnalytics className="mr-2" /> {showAnalytics ? 'Show Logs' : 'Analytics'}
                        </Button>
                    </div>
                </div>

                {scanMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${scanMessage.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                    >
                        {scanMessage.type === 'success' ? <IoCheckmarkCircle size={24} /> : <IoCloseCircle size={24} />}
                        <p className="font-bold">{scanMessage.text}</p>
                    </motion.div>
                )}

                {showScanner && (
                    <AttendanceScanner
                        onScanSuccess={handleQrScan}
                        onClose={() => setShowScanner(false)}
                    />
                )}

                {/* Monthly Summary - Always Visible */}
                <Card className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">Monthly Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white/5 rounded-lg p-6 border border-white/5">
                            <p className="text-gray-400 text-sm mb-2">Days Logged</p>
                            <p className="text-4xl font-bold">{summary.total || 0}</p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
                            <p className="text-green-400 text-sm mb-2">Present</p>
                            <p className="text-4xl font-bold text-green-400">{summary.present || 0}</p>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/20">
                            <p className="text-blue-400 text-sm mb-2">Attendance %</p>
                            <p className="text-4xl font-bold text-blue-400">{summary.percentage || 0}%</p>
                        </div>
                        <div className="bg-purple-500/10 rounded-lg p-6 border border-purple-500/20">
                            <p className="text-purple-400 text-sm mb-2">Study Hours</p>
                            <p className="text-4xl font-bold text-purple-400">{totalDurationStr}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Attendance Progress</span>
                            <span className={`font-bold ${(summary.percentage || 0) >= 76 ? 'text-green-400' :
                                (summary.percentage || 0) >= 61 ? 'text-blue-400' :
                                    (summary.percentage || 0) >= 41 ? 'text-orange-400' :
                                        'text-red-400'
                                }`}>
                                {summary.percentage || 0}%
                            </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                            <div
                                className={`h-4 rounded-full transition-all duration-500 ${(summary.percentage || 0) >= 76 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                    (summary.percentage || 0) >= 61 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                        (summary.percentage || 0) >= 41 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                            'bg-gradient-to-r from-red-500 to-red-400'
                                    }`}
                                style={{ width: `${summary.percentage || 0}%` }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Main Content Area */}
                {showAnalytics ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Chart matched to Current Month */}
                        <Card className="mb-6">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <IoAnalytics className="text-purple-400" /> Monthly Trends (This Month)
                            </h2>

                            <div className="h-64 flex items-stretch gap-2 md:gap-3 px-2 overflow-x-auto custom-scrollbar pb-2">
                                {(() => {
                                    // Generate ALL days of current month
                                    const data = [];
                                    const now = new Date();
                                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

                                    // Calculate maxVal safely
                                    const durations = myAttendance.map(r => (r.duration || 0) / 60);
                                    const maxVal = Math.max(5, ...durations);

                                    for (let i = 1; i <= daysInMonth; i++) {
                                        const d = new Date(now.getFullYear(), now.getMonth(), i);
                                        if (d > now && d.getDate() !== now.getDate()) break;

                                        const dateStr = d.toDateString();
                                        const dayRecords = myAttendance.filter(r =>
                                            new Date(r.date).toDateString() === dateStr
                                        );

                                        const totalDuration = dayRecords.reduce((acc, curr) => acc + (curr.duration || 0), 0);

                                        data.push({
                                            label: d.getDate(),
                                            day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
                                            value: totalDuration / 60
                                        });
                                    }

                                    return data.map((item, index) => (
                                        <div key={index} className="flex-1 min-w-[20px] h-full flex flex-col justify-end items-center gap-2 group relative">
                                            <div className="absolute -top-10 bg-gray-800 text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 border border-white/10">
                                                Day {item.label}: {item.value.toFixed(1)} hrs
                                            </div>
                                            <div
                                                className={`w-full rounded-t-md transition-all duration-500 ${item.value > 8 ? 'bg-green-500' :
                                                    item.value > 4 ? 'bg-blue-500' :
                                                        item.value > 0 ? 'bg-purple-500' :
                                                            'bg-white/5'
                                                    }`}
                                                style={{ height: `${(item.value / maxVal) * 100}%` }}
                                            />
                                            <span className="text-[10px] text-gray-500">{item.label}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    // Default View: Log + Rankings (Stacked)
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Daily Log */}
                        <Card>
                            <h2 className="text-2xl font-bold mb-6">Daily Log</h2>
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {myAttendance.slice().reverse().map((record) => (
                                    <div
                                        key={record._id}
                                        className={`p-4 rounded-xl border transition-all ${record.status === 'present'
                                            ? 'bg-white/5 border-white/10 hover:border-green-500/30'
                                            : 'bg-red-500/5 border-red-500/10'
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Date */}
                                            <div className="flex items-center gap-4 min-w-[180px]">
                                                <div className={`p-3 rounded-full ${record.status === 'present'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {record.status === 'present'
                                                        ? <IoCheckmarkCircle size={24} />
                                                        : <IoCloseCircle size={24} />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">
                                                        {new Date(record.date).toLocaleDateString('en-IN', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Timings */}
                                            {record.status === 'present' && (
                                                <div className="flex flex-wrap gap-4 text-sm flex-1 justify-center md:justify-start">
                                                    <div className="flex items-center gap-2 text-gray-300 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <IoTimeOutline className="text-green-400" />
                                                        <span className="text-gray-500 text-xs uppercase">Entry</span>
                                                        <span className="font-mono font-bold">{record.entryTime || '--:--'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-gray-300 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <IoTimeOutline className="text-red-400" />
                                                        <span className="text-gray-500 text-xs uppercase">Exit</span>
                                                        <span className="font-mono font-bold">{record.exitTime || '--:--'}</span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-gray-300 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <IoHourglassOutline className="text-yellow-400" />
                                                        <span className="text-gray-500 text-xs uppercase">Duration</span>
                                                        <span className="font-mono font-bold">
                                                            {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Badge */}
                                            <div className="ml-auto flex items-center gap-4">
                                                {record.notes && (
                                                    <div className="hidden md:flex items-start gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-lg">
                                                        <IoDocumentTextOutline className="mt-1" />
                                                        <p className="italic max-w-[150px] truncate">"{record.notes}"</p>
                                                    </div>
                                                )}
                                                <Badge variant={record.status === 'present' ? 'green' : 'red'} className="text-sm px-3 py-1">
                                                    {record.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Rankings */}
                        <Card>
                            <h2 className="text-2xl font-bold mb-4">
                                <IoAnalytics className="inline mr-2" />
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
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
