import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import api from '../../utils/api';
import { IoArrowBack, IoBedOutline } from 'react-icons/io5';

const FloorManagement = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);

    useEffect(() => {
        fetchFloors();
    }, []);

    const fetchFloors = async () => {
        try {
            const response = await api.get('/admin/floors');
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching floors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Floor & Seat Management
                </h1>

                {loading ? (
                    <SkeletonLoader type="card" count={3} />
                ) : (
                    <>
                        {/* Floor Selector */}
                        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                            {floors.map((floor, index) => (
                                <button
                                    key={floor._id}
                                    onClick={() => setSelectedFloor(index)}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${selectedFloor === index
                                            ? 'bg-gradient-primary shadow-lg'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {floor.name}
                                </button>
                            ))}
                        </div>

                        {/* Floor Details */}
                        {floors[selectedFloor] && (
                            <div className="space-y-6">
                                {floors[selectedFloor].rooms.map((room) => (
                                    <Card key={room._id}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">{room.name}</h2>
                                            <Badge variant="green">{room.seats.length} Seats</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {room.seats.map((seat) => (
                                                <motion.div
                                                    key={seat._id}
                                                    whileHover={{ scale: 1.05 }}
                                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${seat.isOccupied
                                                            ? 'bg-red-500/10 border-red-500/50'
                                                            : 'bg-green-500/10 border-green-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <IoBedOutline size={20} />
                                                        <span className="font-bold">{seat.number}</span>
                                                    </div>

                                                    <Badge variant={seat.isOccupied ? 'red' : 'green'}>
                                                        {seat.isOccupied ? 'Occupied' : 'Available'}
                                                    </Badge>

                                                    {seat.isOccupied && seat.assignedTo && (
                                                        <div className="mt-2 text-xs">
                                                            <p className="text-gray-400">Assigned to:</p>
                                                            <p className="font-semibold truncate">{seat.assignedTo.name}</p>
                                                            {seat.shift && (
                                                                <p className="text-gray-400 capitalize">{seat.shift} shift</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!seat.isOccupied && (
                                                        <div className="mt-2 text-xs text-gray-400">
                                                            <p>Day: ₹{seat.basePrices?.day || 800}</p>
                                                            <p>Night: ₹{seat.basePrices?.night || 800}</p>
                                                            <p>Full: ₹{seat.basePrices?.full || 1200}</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}

                                {/* Summary */}
                                <Card>
                                    <h3 className="text-xl font-bold mb-4">Floor Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Total Seats</p>
                                            <p className="text-3xl font-bold">{floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.length, 0)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Occupied</p>
                                            <p className="text-3xl font-bold text-red-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm">Available</p>
                                            <p className="text-3xl font-bold text-green-400">
                                                {floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.filter(s => !s.isOccupied).length, 0)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default FloorManagement;
