import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoBedOutline, IoCalendar, IoCash, IoTime } from 'react-icons/io5';

const MySeat = () => {
    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSeatData();
    }, []);

    const fetchSeatData = async () => {
        try {
            const response = await api.get('/student/seat');
            setSeatData(response.data);
        } catch (error) {
            console.error('Error fetching seat:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <SkeletonLoader type="card" count={1} />
                </div>
            </div>
        );
    }

    if (!seatData?.seat) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <Link to="/student">
                        <Button variant="secondary" className="mb-6">
                            <IoArrowBack className="inline mr-2" /> Back to Dashboard
                        </Button>
                    </Link>

                    <Card>
                        <div className="text-center py-12">
                            <IoBedOutline size={64} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-2xl font-bold mb-2">No Seat Assigned</h2>
                            <p className="text-gray-400">Contact admin to get a seat assigned.</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    const { seat, floor, room } = seatData;
    const shiftTimes = {
        day: '9:00 AM - 3:00 PM',
        night: '3:00 PM - 9:00 PM',
        full: '9:00 AM - 9:00 PM'
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    My Seat
                </h1>

                {/* Seat Details Card */}
                <Card className="mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-primary rounded-xl">
                            <IoBedOutline size={48} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">{seat.number}</h2>
                            <p className="text-gray-400">Your assigned seat</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <IoCalendar className="text-blue-400" size={24} />
                                <p className="text-sm text-gray-400">Location</p>
                            </div>
                            <p className="text-xl font-semibold">{floor?.name}</p>
                            <p className="text-gray-400">{room?.name}</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <IoTime className="text-green-400" size={24} />
                                <p className="text-sm text-gray-400">Shift</p>
                            </div>
                            <p className="text-xl font-semibold capitalize">{seat.shift}</p>
                            <p className="text-gray-400">{shiftTimes[seat.shift]}</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <IoCash className="text-yellow-400" size={24} />
                                <p className="text-sm text-gray-400">Monthly Fee</p>
                            </div>
                            <p className="text-3xl font-bold">₹{seat.currentPrice}</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <IoBedOutline className="text-purple-400" size={24} />
                                <p className="text-sm text-gray-400">Status</p>
                            </div>
                            <Badge variant="green" className="text-lg px-4 py-2">
                                Active
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Pricing Information */}
                <Card>
                    <h3 className="text-xl font-bold mb-4">Shift Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${seat.shift === 'day' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'
                            }`}>
                            <p className="text-sm text-gray-400 mb-1">Morning Shift</p>
                            <p className="text-2xl font-bold">₹{seat.basePrices?.day || 800}</p>
                            <p className="text-xs text-gray-400 mt-1">9:00 AM - 3:00 PM</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${seat.shift === 'night' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'
                            }`}>
                            <p className="text-sm text-gray-400 mb-1">Evening Shift</p>
                            <p className="text-2xl font-bold">₹{seat.basePrices?.night || 800}</p>
                            <p className="text-xs text-gray-400 mt-1">3:00 PM - 9:00 PM</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${seat.shift === 'full' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'
                            }`}>
                            <p className="text-sm text-gray-400 mb-1">Full Day</p>
                            <p className="text-2xl font-bold">₹{seat.basePrices?.full || 1200}</p>
                            <p className="text-xs text-gray-400 mt-1">9:00 AM - 9:00 PM</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm">
                            💡 <strong>Want to change your shift?</strong> Submit a request from your profile page.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MySeat;
