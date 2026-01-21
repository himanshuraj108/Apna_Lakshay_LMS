import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { IoBedOutline, IoTimeOutline, IoCashOutline, IoDownload, IoGlobe } from 'react-icons/io5';

const PublicSeatView = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(0);

    useEffect(() => {
        fetchSeats();
        checkMobileDevice();

        // Add resize listener to check device size on window resize
        const handleResize = () => {
            const isMobileOrTablet = window.innerWidth < 1024;
            if (isMobileOrTablet && !showMobileModal) {
                setShowMobileModal(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showMobileModal]);

    const checkMobileDevice = () => {
        // Check for mobile or tablet devices (below 1024px)
        const isMobileOrTablet = window.innerWidth < 1024;
        const hasModalBeenShown = sessionStorage.getItem('mobileModalShown');

        if (isMobileOrTablet && !hasModalBeenShown) {
            setShowMobileModal(true);
        }
    };

    const fetchSeats = async () => {
        try {
            const response = await api.get('/public/seats');
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching seats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShiftTimings = (shift) => {
        const timings = {
            day: '9:00 AM - 3:00 PM',
            night: '3:00 PM - 9:00 PM',
            full: '9:00 AM - 9:00 PM'
        };
        return timings[shift] || '';
    };

    const downloadApp = () => {
        const apkUrl = import.meta.env.VITE_APK_DOWNLOAD_URL || '#';
        window.open(apkUrl, '_blank');
    };

    const handleContinueInBrowser = () => {
        sessionStorage.setItem('mobileModalShown', 'true');
        setShowMobileModal(false);
    };

    return (
        <div className="min-h-screen p-6">
            {/* Mobile/Tablet Modal */}
            <Modal
                isOpen={showMobileModal}
                onClose={handleContinueInBrowser}
                title="Welcome to Hamara Lakshay"
            >
                <div className="space-y-4">
                    <p className="text-gray-300 mb-4">Choose how you want to continue:</p>
                    <Button variant="primary" onClick={downloadApp} className="w-full">
                        <IoDownload className="inline mr-2" size={20} />
                        Download Android App
                    </Button>
                    <Button variant="secondary" onClick={handleContinueInBrowser} className="w-full">
                        <IoGlobe className="inline mr-2" size={20} />
                        Continue in Browser
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-4">
                        This modal shows only once per session
                    </p>
                </div>
            </Modal>

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                        📚 Hamara Lakshay
                    </h1>
                    <p className="text-gray-400 text-lg">Library Seat Availability</p>
                    <Link to="/login">
                        <Button variant="secondary" className="mt-4">Login</Button>
                    </Link>
                </div>

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

                        {/* Rooms and Seats */}
                        {floors[selectedFloor] && (
                            <div className="space-y-6">
                                {floors[selectedFloor].rooms.map((room) => (
                                    <Card key={room._id}>
                                        <h2 className="text-2xl font-bold mb-6">{room.name}</h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {room.seats.map((seat) => (
                                                <motion.div
                                                    key={seat._id}
                                                    whileHover={{ scale: 1.05 }}
                                                    className={`p-4 rounded-xl border-2 transition-all ${seat.isOccupied
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

                                                    {seat.shift && (
                                                        <div className="mt-3 text-sm">
                                                            <div className="flex items-center gap-1 text-gray-400">
                                                                <IoTimeOutline size={16} />
                                                                <span className="text-xs">{getShiftTimings(seat.shift)}</span>
                                                            </div>

                                                            {/* Only show prices for AVAILABLE seats */}
                                                            {!seat.isOccupied && (
                                                                <div className="mt-2 space-y-1">
                                                                    {seat.dayPrice && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <IoCashOutline size={14} className="text-yellow-400" />
                                                                            <span>Day: ₹{seat.dayPrice}</span>
                                                                        </div>
                                                                    )}
                                                                    {seat.nightPrice && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <IoCashOutline size={14} className="text-yellow-400" />
                                                                            <span>Night: ₹{seat.nightPrice}</span>
                                                                        </div>
                                                                    )}
                                                                    {seat.fullPrice && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <IoCashOutline size={14} className="text-yellow-400" />
                                                                            <span>Full: ₹{seat.fullPrice}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PublicSeatView;
