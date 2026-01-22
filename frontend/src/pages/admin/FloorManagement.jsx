import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import RoomGrid from '../../components/admin/RoomGrid';
import AddSeatModal from '../../components/admin/AddSeatModal';
import EditSeatModal from '../../components/admin/EditSeatModal';
import RoomLayoutModal from '../../components/admin/RoomLayoutModal';
import UpdateRoomPricesModal from '../../components/admin/UpdateRoomPricesModal';
import UpdateFloorPricesModal from '../../components/admin/UpdateFloorPricesModal';
import api from '../../utils/api';
import { IoArrowBack, IoSaveOutline, IoSettingsOutline, IoDownload, IoBedOutline } from 'react-icons/io5';
import StudentIdCard from '../../components/admin/StudentIdCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Modal from '../../components/ui/Modal';

const FloorManagement = () => {
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [addSeatModal, setAddSeatModal] = useState({ isOpen: false, wall: '', roomId: '', floorId: '' });
    const [editSeatModal, setEditSeatModal] = useState({ isOpen: false, seat: null });
    const [roomLayoutModal, setRoomLayoutModal] = useState({ isOpen: false, room: null });
    const [updateRoomPricesModal, setUpdateRoomPricesModal] = useState({ isOpen: false, room: null });
    const [updateFloorPricesModal, setUpdateFloorPricesModal] = useState({ isOpen: false, floor: null });
    const [bulkPrices, setBulkPrices] = useState({ day: 800, night: 800, full: 1200 });
    const [updating, setUpdating] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, floorName: '', seatCount: 0 });

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

    const handleAddSeat = (wall, roomId, floorId) => {
        setAddSeatModal({ isOpen: true, wall, roomId, floorId });
    };

    const handleEditSeat = (seat) => {
        setEditSeatModal({ isOpen: true, seat });
    };

    const handleDeleteSeat = async (seat) => {
        if (!confirm(`Are you sure you want to delete seat ${seat.number}?`)) return;

        try {
            const response = await api.delete(`/admin/seats/${seat._id}`);
            if (response.data.success) {
                fetchFloors();
                alert('Seat deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting seat:', error);
            alert(error.response?.data?.message || 'Failed to delete seat');
        }
    };

    const handleBulkPriceUpdate = () => {
        if (!floors[selectedFloor]) {
            alert('Please select a valid floor first.');
            return;
        }

        const seatCount = floors[selectedFloor].rooms.reduce((acc, room) => acc + room.seats.length, 0);

        setConfirmModal({
            isOpen: true,
            floorName: floors[selectedFloor].name,
            seatCount
        });
    };

    const executeBulkUpdate = async () => {
        setUpdating(true);
        try {
            const floorId = floors[selectedFloor]._id;
            const response = await api.put(`/admin/floors/${floorId}/prices`, {
                basePrices: {
                    day: bulkPrices.day,
                    night: bulkPrices.night,
                    full: bulkPrices.full
                }
            });

            if (response.data.success) {
                fetchFloors();
                alert(`Updated ${response.data.updatedCount} seats successfully`);
                setConfirmModal({ isOpen: false, floorName: '', seatCount: 0 });
            }
        } catch (error) {
            console.error('Error updating prices:', error);
            alert(error.response?.data?.message || 'Failed to update prices. Please check the console.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSeatClick = (seat) => {
        if (!seat.assignedTo) return;

        // Seat.assignedTo is now a populated object with name, email, profileImage etc.
        // We also need to ensure we pass the seat number
        const student = {
            ...seat.assignedTo,
            seatNumber: seat.number, // Use the seat's number
            shift: seat.shift
        };
        setSelectedStudent(student);
        setShowIdCardModal(true);
    };

    const handleDownloadPNG = async () => {
        const element = document.getElementById('seat-id-card-preview');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: null
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `ID_Card_${selectedStudent.name.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('PNG Download failed', err);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('seat-id-card-preview');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const componentWidth = canvas.width;
            const componentHeight = canvas.height;

            const targetWidth = 80;
            const targetHeight = (componentHeight * targetWidth) / componentWidth;

            const x = (pdfWidth - targetWidth) / 2;
            const y = 20;

            pdf.addImage(imgData, 'PNG', x, y, targetWidth, targetHeight);
            pdf.save(`ID_Card_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF Download failed', err);
        }
    };

    return (
        <div className="min-h-screen p-6 min-w-[1024px]">
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
                        {/* Bulk Price Update */}
                        <Card className="mb-6">
                            <h3 className="text-xl font-bold mb-4">Bulk Price Update</h3>
                            <div className="grid grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Morning Shift (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={bulkPrices.day}
                                        onChange={(e) => setBulkPrices({ ...bulkPrices, day: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Evening Shift (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={bulkPrices.night}
                                        onChange={(e) => setBulkPrices({ ...bulkPrices, night: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Full Day (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={bulkPrices.full}
                                        onChange={(e) => setBulkPrices({ ...bulkPrices, full: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <Button
                                    onClick={handleBulkPriceUpdate}
                                    disabled={updating}
                                    className="w-full"
                                >
                                    <IoSaveOutline className="inline mr-2" />
                                    {updating ? 'Updating...' : 'Update All Seats'}
                                </Button>
                            </div>
                        </Card>

                        {/* Floor Selector with Update Button */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-4 overflow-x-auto pb-2">
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
                            {floors[selectedFloor] && (
                                <button
                                    onClick={() => setUpdateFloorPricesModal({ isOpen: true, floor: floors[selectedFloor] })}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                                >
                                    Update Floor Prices
                                </button>
                            )}
                        </div>

                        {/* Floor Details */}
                        {floors[selectedFloor] && (
                            <div className="space-y-6">
                                {floors[selectedFloor].rooms.map((room) => (
                                    <Card key={room._id}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">{room.name}</h2>
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={() => setUpdateRoomPricesModal({ isOpen: true, room })}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm font-semibold"
                                                >
                                                    Update Room Prices
                                                </button>
                                                <button
                                                    onClick={() => setRoomLayoutModal({ isOpen: true, room })}
                                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm flex items-center gap-2"
                                                >
                                                    <IoSettingsOutline size={16} />
                                                    Configure
                                                </button>
                                                <Badge variant="green">{room.seats.length} Seats</Badge>
                                            </div>
                                        </div>

                                        <RoomGrid
                                            room={room}
                                            onAddSeat={(wall) => handleAddSeat(wall, room._id, floors[selectedFloor]._id)}
                                            onEditSeat={handleEditSeat}
                                            onDeleteSeat={handleDeleteSeat}
                                            onSeatClick={handleSeatClick}
                                        />
                                    </Card>
                                ))}

                                {/* Summary */}
                                <Card>
                                    <h3 className="text-xl font-bold mb-4">Floor Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
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

                {/* Confirm Modal */}
                <Modal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    title="Confirm Price Update"
                >
                    <div className="p-4">
                        <p className="mb-4 text-gray-300">
                            Are you sure you want to update prices for all <strong>{confirmModal.seatCount}</strong> seats in <strong>{confirmModal.floorName}</strong>?
                        </p>
                        <div className="bg-white/5 p-4 rounded-lg mb-6 text-sm">
                            <p className="font-semibold mb-2">New Prices:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                                <li>Morning: ₹{bulkPrices.day}</li>
                                <li>Evening: ₹{bulkPrices.night}</li>
                                <li>Full Day: ₹{bulkPrices.full}</li>
                            </ul>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                disabled={updating}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={executeBulkUpdate}
                                disabled={updating}
                            >
                                {updating ? 'Updating...' : 'Confirm Update'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modals */}
                <AddSeatModal
                    isOpen={addSeatModal.isOpen}
                    onClose={() => setAddSeatModal({ isOpen: false, wall: '', roomId: '', floorId: '' })}
                    wall={addSeatModal.wall}
                    roomId={addSeatModal.roomId}
                    floorId={addSeatModal.floorId}
                    onSuccess={fetchFloors}
                />

                <EditSeatModal
                    isOpen={editSeatModal.isOpen}
                    onClose={() => setEditSeatModal({ isOpen: false, seat: null })}
                    seat={editSeatModal.seat}
                    onSuccess={fetchFloors}
                />

                <RoomLayoutModal
                    isOpen={roomLayoutModal.isOpen}
                    onClose={() => setRoomLayoutModal({ isOpen: false, room: null })}
                    room={roomLayoutModal.room}
                    onSuccess={fetchFloors}
                />

                <UpdateRoomPricesModal
                    isOpen={updateRoomPricesModal.isOpen}
                    onClose={() => setUpdateRoomPricesModal({ isOpen: false, room: null })}
                    room={updateRoomPricesModal.room}
                    onSuccess={fetchFloors}
                />

                <UpdateFloorPricesModal
                    isOpen={updateFloorPricesModal.isOpen}
                    onClose={() => setUpdateFloorPricesModal({ isOpen: false, floor: null })}
                    floor={updateFloorPricesModal.floor}
                    onSuccess={fetchFloors}
                />

                {/* View ID Card Modal */}
                <Modal
                    isOpen={showIdCardModal}
                    onClose={() => setShowIdCardModal(false)}
                    title="Student ID Card"
                >
                    <div className="flex flex-col items-center justify-center p-4">
                        {selectedStudent && (
                            <>
                                <div id="seat-id-card-preview" className="p-4 bg-white rounded-xl">
                                    <StudentIdCard student={selectedStudent} />
                                </div>
                                <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowIdCardModal(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        onClick={handleDownloadPNG}
                                    >
                                        <IoDownload className="inline mr-2" /> PNG
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                        onClick={handleDownloadPDF}
                                    >
                                        <IoDownload className="inline mr-2" /> PDF
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default FloorManagement;
