import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoBedOutline, IoCalendar, IoCash, IoTime } from 'react-icons/io5';
import StudentRoomGrid from '../../components/student/StudentRoomGrid';

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

    const { seat } = seatData;
    const { floor, room } = seat;
    const shiftTimes = {
        day: '9:00 AM - 3:00 PM',
        night: '3:00 PM - 9:00 PM',
        full: '9:00 AM - 9:00 PM'
    };

    return (
        <div className="min-h-screen p-6 overflow-x-auto">
            <div className="min-w-[1024px] max-w-7xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    My Seat
                </h1>

                <div className="grid grid-cols-3 gap-8">
                    {/* Left Column: Details & Pricing */}
                    <div className="col-span-1 space-y-6">
                        {/* Seat Details Card */}
                        <Card>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-gradient-primary rounded-xl">
                                    <IoBedOutline size={48} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold">{seat.number}</h2>
                                    <p className="text-gray-400">Your assigned seat</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                            <IoCalendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Location</p>
                                            <p className="font-semibold">{floor?.name}, {room?.name}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                                            <IoTime size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Shift</p>
                                            <p className="font-semibold capitalize">{seat.shift}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">{shiftTimes[seat.shift]}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                                            <IoCash size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Monthly Fee</p>
                                            <p className="font-bold text-lg">₹{seat.price || seat.currentPrice}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center mt-2">
                                    <Badge variant="green" className="text-sm px-6 py-1 w-full justify-center">
                                        Active Membership
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {/* Pricing Information */}
                        <Card>
                            <h3 className="text-lg font-bold mb-4">Pricing Plan</h3>
                            <div className="space-y-3">
                                <div className={`flex justify-between items-center p-3 rounded-lg border ${seat.shift === 'day' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                                    <span className="text-sm text-gray-400">Morning</span>
                                    <span className="font-bold">₹{seat.basePrices?.day || 800}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg border ${seat.shift === 'night' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                                    <span className="text-sm text-gray-400">Evening</span>
                                    <span className="font-bold">₹{seat.basePrices?.night || 800}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg border ${seat.shift === 'full' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                                    <span className="text-sm text-gray-400">Full</span>
                                    <span className="font-bold">₹{seat.basePrices?.full || 1200}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Map */}
                    <div className="col-span-2">
                        {room && room.seats && (
                            <Card className="h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">Seat Location Map</h3>
                                    <Badge variant="blue">Room View</Badge>
                                </div>
                                <StudentRoomGrid
                                    room={room}
                                    highlightSeatId={seat._id}
                                    onSeatClick={() => { }}
                                />
                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-center text-blue-200">
                                    Your seat <strong>{seat.number}</strong> is highlighted on the map.
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MySeat;
