import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import Badge from '../../components/ui/Badge';
import api from '../../utils/api';
import { IoArrowBack, IoAdd, IoTrash, IoPencil, IoBedOutline } from 'react-icons/io5';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSeatModal, setShowSeatModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [seatFormData, setSeatFormData] = useState({
        seatId: '',
        shift: 'full',
        negotiatedPrice: ''
    });
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'inactive'
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStudents();
        fetchFloors();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/admin/students');
            setStudents(response.data.students);
        } catch (error) {
            console.error('Error fetching students:', error);
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const fetchFloors = async () => {
        try {
            const response = await api.get('/admin/floors');
            setFloors(response.data.floors);
        } catch (error) {
            console.error('Error fetching floors:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editMode) {
                await api.put(`/admin/students/${selectedStudent._id}`, formData);
                setSuccess('Student updated successfully');
            } else {
                const response = await api.post('/admin/students', formData);
                setSuccess(`Student created! Temporary password: ${response.data.student.tempPassword}`);
            }

            fetchStudents();
            setShowModal(false);
            setFormData({ name: '', email: '' });
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleSeatAssignment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.post('/admin/seats/assign', {
                seatId: seatFormData.seatId,
                studentId: selectedStudent._id,
                shift: seatFormData.shift,
                negotiatedPrice: seatFormData.negotiatedPrice ? Number(seatFormData.negotiatedPrice) : undefined
            });

            setSuccess(`Seat assigned to ${selectedStudent.name} successfully!`);
            fetchStudents();
            fetchFloors();
            setShowSeatModal(false);
            setSeatFormData({ seatId: '', shift: 'full', negotiatedPrice: '' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to assign seat');
        }
    };

    const openDeleteModal = (student) => {
        setSelectedStudent(student);
        setDeletePassword('');
        setError('');
        setShowDeleteModal(true);
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        setError('');
        setDeleteLoading(true);

        try {
            // Call delete endpoint with password verification
            await api.delete(`/admin/students/${selectedStudent._id}`, {
                data: { password: deletePassword }
            });

            setSuccess(`Student ${selectedStudent.name} deleted successfully`);

            // Close modal first
            setShowDeleteModal(false);
            setDeletePassword('');
            setSelectedStudent(null);

            // Force refetch to ensure UI updates
            await fetchStudents();
            await fetchFloors();

            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete student');
        } finally {
            setDeleteLoading(false);
        }
    };

    const openAddModal = () => {
        setEditMode(false);
        setSelectedStudent(null);
        setFormData({ name: '', email: '' });
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setEditMode(true);
        setSelectedStudent(student);
        setFormData({ name: student.name, email: student.email });
        setShowModal(true);
    };

    const openSeatAssignModal = (student) => {
        setSelectedStudent(student);
        setSeatFormData({ seatId: '', shift: 'full', negotiatedPrice: '' });
        setShowSeatModal(true);
    };

    // Get all available seats from floors
    const getAvailableSeats = () => {
        const seats = [];
        floors.forEach(floor => {
            floor.rooms.forEach(room => {
                room.seats.forEach(seat => {
                    if (!seat.isOccupied) {
                        seats.push({
                            ...seat,
                            displayName: `${floor.name} - ${room.name} - ${seat.number}`,
                            floorName: floor.name,
                            roomName: room.name
                        });
                    }
                });
            });
        });
        return seats;
    };

    const availableSeats = getAvailableSeats();

    // Filter students based on active tab
    const getFilteredStudents = () => {
        switch (activeTab) {
            case 'active':
                return students.filter(student => student.isActive);
            case 'inactive':
                return students.filter(student => !student.isActive);
            case 'all':
            default:
                return students;
        }
    };

    const filteredStudents = getFilteredStudents();

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link to="/admin">
                            <Button variant="secondary">
                                <IoArrowBack className="inline mr-2" /> Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                    <Button variant="primary" onClick={openAddModal}>
                        <IoAdd className="inline mr-2" size={20} /> Add Student
                    </Button>
                </div>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Student Management
                </h1>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'all'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        All Students ({students.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'active'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        Active ({students.filter(s => s.isActive).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('inactive')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'inactive'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        Inactive ({students.filter(s => !s.isActive).length})
                    </button>
                </div>

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

                {loading ? (
                    <SkeletonLoader type="table" count={1} />
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-4">Name</th>
                                        <th className="text-left p-4">Email</th>
                                        <th className="text-left p-4">Status</th>
                                        <th className="text-left p-4">Created</th>
                                        <th className="text-right p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center p-8 text-gray-400">
                                                {activeTab === 'all' && 'No students found. Click "Add Student" to create one.'}
                                                {activeTab === 'active' && 'No active students found.'}
                                                {activeTab === 'inactive' && 'No inactive students found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr key={student._id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-4">{student.name}</td>
                                                <td className="p-4">{student.email}</td>
                                                <td className="p-4">
                                                    <Badge variant={student.isActive ? 'green' : 'red'}>
                                                        {student.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    {new Date(student.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    {student.isActive ? (
                                                        <>
                                                            <button
                                                                onClick={() => openSeatAssignModal(student)}
                                                                className="text-green-400 hover:text-green-300 transition-colors"
                                                                title="Assign Seat"
                                                            >
                                                                <IoBedOutline size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(student)}
                                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <IoPencil size={20} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs mr-2">Inactive</span>
                                                    )}
                                                    <button
                                                        onClick={() => openDeleteModal(student)}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        title={student.isActive ? "Remove Student" : "Delete Permanently"}
                                                    >
                                                        <IoTrash size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Add/Edit Student Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={editMode ? 'Edit Student' : 'Add New Student'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" variant="primary" className="flex-1">
                                {editMode ? 'Update Student' : 'Create Student'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                        {!editMode && (
                            <p className="text-sm text-gray-400">
                                Note: A random password will be generated and shown after creation (email disabled)
                            </p>
                        )}
                    </form>
                </Modal>

                {/* Assign Seat Modal */}
                <Modal
                    isOpen={showSeatModal}
                    onClose={() => setShowSeatModal(false)}
                    title={`Assign Seat to ${selectedStudent?.name}`}
                >
                    <form onSubmit={handleSeatAssignment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Seat</label>
                            <select
                                value={seatFormData.seatId}
                                onChange={(e) => setSeatFormData({ ...seatFormData, seatId: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">Choose a seat...</option>
                                {availableSeats.length === 0 ? (
                                    <option disabled>No available seats</option>
                                ) : (
                                    availableSeats.map(seat => (
                                        <option key={seat._id} value={seat._id}>
                                            {seat.displayName} - ₹{seat.basePrices?.full || 1200}
                                        </option>
                                    ))
                                )}
                            </select>
                            {availableSeats.length === 0 && (
                                <p className="text-sm text-red-400 mt-2">
                                    No available seats. All seats are currently occupied.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Shift</label>
                            <select
                                value={seatFormData.shift}
                                onChange={(e) => setSeatFormData({ ...seatFormData, shift: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="day">Day (9 AM - 3 PM) - ₹800</option>
                                <option value="night">Night (3 PM - 9 PM) - ₹800</option>
                                <option value="full">Full Day (9 AM - 9 PM) - ₹1200</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Negotiated Price (Optional)
                            </label>
                            <input
                                type="number"
                                value={seatFormData.negotiatedPrice}
                                onChange={(e) => setSeatFormData({ ...seatFormData, negotiatedPrice: e.target.value })}
                                className="input"
                                placeholder="Leave empty for base price"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                If left empty, base price for selected shift will be used
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                variant="success"
                                className="flex-1"
                                disabled={availableSeats.length === 0}
                            >
                                <IoBedOutline className="inline mr-2" /> Assign Seat
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowSeatModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title={selectedStudent?.isActive ? "⚠️ Remove Student" : "🗑️ Delete Permanently"}
                >
                    <form onSubmit={handleDelete} className="space-y-4">
                        {/* Student Details */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                            <h3 className="text-lg font-semibold text-red-400 mb-3">Student Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Name:</span>
                                    <span className="font-medium">{selectedStudent?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="font-medium">{selectedStudent?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Status:</span>
                                    <Badge variant={selectedStudent?.isActive ? 'green' : 'red'}>
                                        {selectedStudent?.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Joined:</span>
                                    <span className="font-medium">
                                        {selectedStudent && new Date(selectedStudent.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Warning Message */}
                        <div className={`border rounded-lg p-3 ${selectedStudent?.isActive
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <p className={`text-sm ${selectedStudent?.isActive ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {selectedStudent?.isActive ? (
                                    <>⚠️ This will mark the student as inactive and free up their assigned seat. They can be restored later.</>
                                ) : (
                                    <>🗑️ This will PERMANENTLY delete this student from the database. This action CANNOT be undone!</>
                                )}
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Enter Your Admin Password to Confirm
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="input"
                                placeholder="Admin password"
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                For security, please enter your admin password
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                disabled={deleteLoading || !deletePassword}
                            >
                                {deleteLoading ? 'Processing...' : (
                                    selectedStudent?.isActive ? 'Remove Student' : 'Delete Permanently'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default StudentManagement;
