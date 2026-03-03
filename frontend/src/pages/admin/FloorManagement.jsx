import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useShifts from '../../hooks/useShifts';
import Modal from '../../components/ui/Modal';
import RoomGrid from '../../components/admin/RoomGrid';
import AddSeatModal from '../../components/admin/AddSeatModal';
import EditSeatModal from '../../components/admin/EditSeatModal';
import RoomLayoutModal from '../../components/admin/RoomLayoutModal';
import UpdateRoomPricesModal from '../../components/admin/UpdateRoomPricesModal';
import UpdateFloorPricesModal from '../../components/admin/UpdateFloorPricesModal';
import api from '../../utils/api';
import { IoArrowBack, IoSaveOutline, IoSettingsOutline, IoDownload, IoRefresh, IoAdd, IoTrash, IoLayersOutline } from 'react-icons/io5';
import StudentIdCard from '../../components/admin/StudentIdCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PAGE_BG = { background: '#050508' };
const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-gray-700';

// Add Room Modal Component
const AddRoomModal = ({ isOpen, onClose, floorId, onAdd }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/rooms', {
                name,
                floorId,
                width: 4,
                height: 4
            });
            onAdd();
            onClose();
            setName('');
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white/4 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="h-px w-full bg-gradient-to-r from-blue-500 to-cyan-500 mb-5 -mt-1 -mx-0 rounded-t-2xl" />
                <h3 className="text-lg font-black text-white mb-5">Add New Room</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">Room Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="e.g. Study Hall A" required />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all">{loading ? 'Creating…' : 'Create Room'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Add Floor Modal
const AddFloorModal = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/floors', { name, level: parseInt(level) });
            onAdd();
            onClose();
            setName('');
            setLevel('');
        } catch (error) {
            console.error('Failed to create floor:', error);
            alert('Failed to create floor');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white/4 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="h-px w-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-5 -mt-1 rounded-t-2xl" />
                <h3 className="text-lg font-black text-white mb-5">Add New Floor</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">Floor Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} placeholder="e.g. Ground Floor" required />
                    </div>
                    <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">Floor Level (Number)</label>
                        <input type="number" value={level} onChange={(e) => setLevel(e.target.value)} className={INPUT} placeholder="e.g. 0 for Ground, 1 for First" required />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all">{loading ? 'Creating…' : 'Create Floor'}</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const FloorManagement = () => {
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const [selectedShiftFilter, setSelectedShiftFilter] = useState(''); // '' means no filter (overview)
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState(0);
    const [addFloorModal, setAddFloorModal] = useState(false);
    const [addRoomModal, setAddRoomModal] = useState({ isOpen: false, floorId: null });
    const [addSeatModal, setAddSeatModal] = useState({ isOpen: false, wall: '', roomId: '', floorId: '' });
    const [editSeatModal, setEditSeatModal] = useState({ isOpen: false, seat: null });
    const [roomLayoutModal, setRoomLayoutModal] = useState({ isOpen: false, room: null });
    const [updateRoomPricesModal, setUpdateRoomPricesModal] = useState({ isOpen: false, room: null });
    const [updateFloorPricesModal, setUpdateFloorPricesModal] = useState({ isOpen: false, floor: null });
    const [bulkPrices, setBulkPrices] = useState({ day: 800, night: 800, full: 1200 });
    const [updating, setUpdating] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, floorName: '', seatCount: 0 });

    useEffect(() => {
        fetchFloors();
    }, [selectedShiftFilter]); // Refetch when shift filter changes

    const fetchFloors = async () => {
        setLoading(true);
        try {
            // Pass shiftId to backend
            const response = await api.get(`/admin/floors${selectedShiftFilter ? `?shiftId=${selectedShiftFilter}` : ''}`);
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

    const handleDeleteFloor = async (floorId) => {
        if (!confirm('Are you sure you want to delete this floor? DO NOT DO THIS unless you are sure. It will delete all rooms and seats inside it!')) return;
        try {
            await api.delete(`/admin/floors/${floorId}`);
            fetchFloors();
            setSelectedFloor(0);
        } catch (error) {
            console.error('Failed to delete floor:', error);
            alert(error.response?.data?.message || 'Failed to delete floor');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!confirm('Are you sure you want to delete this room? It will delete all seats inside it!')) return;
        try {
            await api.delete(`/admin/rooms/${roomId}`);
            fetchFloors();
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert(error.response?.data?.message || 'Failed to delete room');
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

            // Separate legacy and dynamic prices
            const shiftPrices = {};
            const legacyBasePrices = {
                day: bulkPrices.day || 0,
                night: bulkPrices.night || 0,
                full: bulkPrices.full || 0
            };

            // Collect dynamic shift prices
            shifts.forEach(shift => {
                if (bulkPrices[shift.id]) {
                    shiftPrices[shift.id] = bulkPrices[shift.id];
                }
            });

            const response = await api.put(`/admin/floors/${floorId}/prices`, {
                basePrices: legacyBasePrices, // Send legacy structure for backward compat
                shiftPrices: shiftPrices     // Send dynamic map
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


        // Get all active assignments from the new system
        const activeAssignments = seat.assignments?.filter(a => a.status === 'active') || [];


        if (activeAssignments.length === 0) {

            // Fallback to legacy field if no assignments
            if (seat.assignedTo) {

                const student = {
                    ...seat.assignedTo,
                    seatNumber: seat.number,
                    shift: seat.shift || 'N/A'
                };
                setSelectedStudents([student]);
                setShowIdCardModal(true);
            }
            return;
        }

        // Build student objects from assignments

        const students = activeAssignments.map(assignment => {

            const studentData = typeof assignment.student === 'object' ? assignment.student : {};
            const shiftName = assignment.shift && typeof assignment.shift === 'object'
                ? assignment.shift.name
                : (assignment.type === 'full_day' || assignment.legacyShift === 'full' ? 'Full Day' : 'N/A');

            return {
                ...studentData,
                seatNumber: seat.number,
                shift: shiftName,
                shiftDetails: assignment.shift
            };
        });

        setSelectedStudents(students);
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
            link.download = `ID_Card_${selectedStudents[0]?.name?.replace(/\s+/g, '_') || 'Student'}.png`;
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
            pdf.save(`ID_Card_${selectedStudents[0]?.name?.replace(/\s+/g, '_') || 'Student'}.pdf`);
        } catch (err) {
            console.error('PDF Download failed', err);
        }
    };

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
                <div className="absolute bottom-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg"><IoLayersOutline size={14} className="text-white" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Floor & Seat Management</h1>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={fetchFloors}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                        <IoRefresh size={16} /> Refresh Data
                    </motion.button>
                </motion.div>

                {loading ? (
                    <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/3 rounded-2xl animate-pulse" />)}</div>
                ) : (
                    <>
                        {/* Bulk Price Update */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 mb-5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Bulk Price Update</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
                                {shifts.map(shift => (
                                    <div key={shift.id}>
                                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">{shift.name} (₹)</label>
                                        <input type="number" value={bulkPrices[shift.id] || ''}
                                            onChange={(e) => setBulkPrices({ ...bulkPrices, [shift.id]: parseInt(e.target.value) || 0 })}
                                            className={INPUT} placeholder="Price" />
                                    </div>
                                ))}
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={handleBulkPriceUpdate} disabled={updating || shifts.length === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-40 transition-all">
                                    <IoSaveOutline size={15} /> Update All
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Shift Filter & Floor Selector */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                                <span className="text-xs text-gray-500 whitespace-nowrap">Shift:</span>
                                <select value={selectedShiftFilter} onChange={(e) => setSelectedShiftFilter(e.target.value)}
                                    className="bg-transparent border-none text-sm text-white outline-none">
                                    <option value="">All / Overview</option>
                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({getShiftTimeRange(s)})</option>)}
                                    <option value="full">Full Day Only</option>
                                </select>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 justify-end">
                                {floors.map((floor, index) => (
                                    <button key={floor._id} onClick={() => setSelectedFloor(index)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${selectedFloor === index ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                        {floor.name}
                                    </button>
                                ))}
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setAddFloorModal(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg whitespace-nowrap">
                                <IoAdd size={16} /> Floor
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleDeleteFloor(floors[selectedFloor]._id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all" title="Delete Floor">
                                <IoTrash size={18} />
                            </motion.button>
                        </div>

                        {/* Floor Details */}
                        {floors[selectedFloor] && (
                            <div className="space-y-5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rooms</h3>
                                    <motion.button whileHover={{ scale: 1.05 }}
                                        onClick={() => setAddRoomModal({ isOpen: true, floorId: floors[selectedFloor]._id })}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-400 rounded-xl text-sm font-semibold transition-all">
                                        <IoAdd size={16} /> Add Room
                                    </motion.button>
                                </div>

                                {floors[selectedFloor].rooms.map((room) => (
                                    <div key={room._id} className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                                        <div className="h-px bg-gradient-to-r from-blue-500/60 to-indigo-500/60" />
                                        <div className="p-5">
                                            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                                                <h2 className="text-lg font-black text-white">{room.name}</h2>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1 rounded-full font-bold">{room.seats.length} Seats</span>
                                                    <button onClick={() => setUpdateRoomPricesModal({ isOpen: true, room })}
                                                        className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl text-xs font-semibold transition-all">Update Prices</button>
                                                    <button onClick={() => setRoomLayoutModal({ isOpen: true, room })}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-xl text-xs transition-all">
                                                        <IoSettingsOutline size={13} /> Configure
                                                    </button>
                                                    <button onClick={() => handleDeleteRoom(room._id)}
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all" title="Delete Room">
                                                        <IoTrash size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <RoomGrid
                                                room={room}
                                                onAddSeat={(wall) => handleAddSeat(wall, room._id, floors[selectedFloor]._id)}
                                                onEditSeat={handleEditSeat}
                                                onDeleteSeat={handleDeleteSeat}
                                                onSeatClick={handleSeatClick}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Summary */}
                                <div className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Floor Summary</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Total Seats', value: floors[selectedFloor].rooms.reduce((a, r) => a + r.seats.length, 0), color: 'text-white' },
                                            { label: 'Occupied', value: floors[selectedFloor].rooms.reduce((a, r) => a + r.seats.filter(s => s.isOccupied).length, 0), color: 'text-red-400' },
                                            { label: 'Available', value: floors[selectedFloor].rooms.reduce((a, r) => a + r.seats.filter(s => !s.isOccupied).length, 0), color: 'text-green-400' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="bg-white/5 rounded-xl p-4">
                                                <p className="text-xs text-gray-500 mb-1">{label}</p>
                                                <p className={`text-3xl font-black ${color}`}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                {shifts.map(shift => (
                                    bulkPrices[shift.id] ? (
                                        <li key={shift.id}>{shift.name}: ₹{bulkPrices[shift.id]}</li>
                                    ) : null
                                ))}

                            </ul>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} disabled={updating}
                                className="px-4 py-2 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={executeBulkUpdate} disabled={updating}
                                className="px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all">
                                {updating ? 'Updating…' : 'Confirm Update'}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Modals */}
                {/* Modals */}
                <AddRoomModal
                    isOpen={addRoomModal.isOpen}
                    onClose={() => setAddRoomModal({ isOpen: false, floorId: null })}
                    floorId={addRoomModal.floorId}
                    onAdd={fetchFloors}
                />

                <AddFloorModal
                    isOpen={addFloorModal}
                    onClose={() => setAddFloorModal(false)}
                    onAdd={fetchFloors}
                />

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
                    title={selectedStudents.length > 1 ? `Student ID Cards (${selectedStudents.length} Students)` : "Student ID Card"}
                    maxWidth="max-w-7xl"
                >
                    <div className="p-4">
                        {selectedStudents.length > 0 && (
                            <>
                                {/* Grid layout for multiple cards */}
                                <div className="grid grid-cols-1 gap-6 mb-6">
                                    {selectedStudents.map((student, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            {/* Student Info Header */}
                                            <div className="mb-3 text-center">
                                                <p className="font-bold text-xl text-white">{student.name || 'Unknown'}</p>
                                                <p className="text-sm text-gray-400">Seat: {student.seatNumber} | Shift: {student.shift || 'N/A'}</p>
                                            </div>
                                            {/* ID Card */}
                                            <div id={index === 0 ? 'seat-id-card-preview' : undefined} className="bg-white rounded-xl p-4">
                                                <StudentIdCard student={student} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Download buttons (only for first card) */}
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    <button onClick={() => setShowIdCardModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all">
                                        Close
                                    </button>
                                    <button onClick={handleDownloadPNG}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                                        <IoDownload size={15} /> Download PNG
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2">
                                        <IoDownload size={15} /> Download PDF
                                    </button>
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
