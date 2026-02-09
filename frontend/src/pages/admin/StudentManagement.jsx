import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import Badge from '../../components/ui/Badge';
import api from '../../utils/api';
import { IoArrowBack, IoAdd, IoTrash, IoPencil, IoBedOutline, IoIdCard, IoDownload, IoKey, IoRefresh } from 'react-icons/io5';
import StudentIdCard from '../../components/admin/StudentIdCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import useShifts from '../../hooks/useShifts';

import { useSearchParams } from 'react-router-dom';

const StudentManagement = () => {
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'custom';
    const shiftFilter = searchParams.get('shift'); // Shift ID from URL
    const tabParam = searchParams.get('tab'); // Tab from URL

    const [students, setStudents] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSeatModal, setShowSeatModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: '',
        password: '',
        confirmPassword: '',
        systemMode: mode
    });
    const [seatFormData, setSeatFormData] = useState({
        seatId: '',
        shift: 'full',
        negotiatedPrice: ''
    });
    const [assigningSeat, setAssigningSeat] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [hardDelete, setHardDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(tabParam || 'all'); // Initialize from URL or default
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

    // Archive States
    const [archivedStudents, setArchivedStudents] = useState([]);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState(null);

    useEffect(() => {
        fetchStudents();
        fetchFloors();
    }, [mode]); // Refetch when mode changes

    useEffect(() => {
        // Update form data default if mode changes
        setFormData(prev => ({ ...prev, systemMode: mode }));
    }, [mode]);

    // Update active tab when URL param changes
    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

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



    const fetchArchivedStudents = async () => {
        try {
            const response = await api.get('/admin/archives');
            setArchivedStudents(response.data.archives);
        } catch (error) {
            console.error('Error fetching archives:', error);
            setError('Failed to load archived students');
        }
    };

    const handleReactivate = async (student) => {
        if (window.confirm(`Are you sure you want to reactivate ${student.name}?`)) {
            try {
                await api.put(`/admin/students/${student._id}`, { isActive: true });
                setSuccess('Student reactivated successfully');
                fetchStudents();
            } catch (err) {
                setError('Failed to reactivate student');
            }
        }
    };

    const handleResetAllQrs = async () => {
        if (!window.confirm('⚠️ CRITICAL WARNING ⚠️\n\nThis will INVALIDATE all existing Student QR Codes/Digital IDs immediately.\n\nStudents will need to refresh their profile to get new codes.\n\nAre you sure you want to RESET ALL QR TOKENS?')) {
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/admin/reset-student-qrs');
            setSuccess(response.data.message);
            fetchStudents();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset QRs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchArchivedStudents();
        }
    }, [activeTab]);

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
            setFormData({ name: '', email: '', mobile: '' });
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleSeatAssignment = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setAssigningSeat(true);

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
        } finally {
            setAssigningSeat(false);
        }
    };

    const openDeleteModal = (student) => {
        setSelectedStudent(student);
        setDeletePassword('');
        setHardDelete(false);
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
                data: {
                    password: deletePassword,
                    forceDelete: hardDelete
                }
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

        // Generate initial random password
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        setFormData({
            name: '',
            email: '',
            mobile: '',
            address: '',
            password: password
        });
        setShowModal(true);
    };

    const openResetPasswordModal = (student) => {
        setSelectedStudent(student);
        setError('');
        setShowResetPasswordModal(true);
    };

    const handleResetPassword = async () => {
        setError('');
        setResetPasswordLoading(true);

        try {
            const response = await api.post(`/admin/students/${selectedStudent._id}/reset-password`);
            setSuccess(response.data.message || 'Password reset successfully! New credentials sent to student.');
            setShowResetPasswordModal(false);
            setSelectedStudent(null);
            await fetchStudents();
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetPasswordLoading(false);
        }
    };

    const openEditModal = (student) => {
        setEditMode(true);
        setSelectedStudent(student);
        setFormData({ name: student.name, email: student.email, mobile: student.mobile || '', address: student.address || '' });
        setShowModal(true);
    };

    const openSeatAssignModal = (student) => {
        setSelectedStudent(student);
        setSeatFormData({ seatId: '', shift: 'full', negotiatedPrice: '' });
        setShowSeatModal(true);
    };

    const openIdCardModal = (student) => {
        setSelectedStudent(student);
        setShowIdCardModal(true);
    };

    const handleDownloadPNG = async () => {
        const element = document.getElementById('student-id-card-preview');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher resolution
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
        const element = document.getElementById('student-id-card-preview');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');

            // card dimensions (portrait)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const componentWidth = canvas.width;
            const componentHeight = canvas.height;

            // Calculate width to fit PDF cleanly (e.g., 80mm wide card)
            const targetWidth = 80;
            const targetHeight = (componentHeight * targetWidth) / componentWidth;

            // Center in A4
            const x = (pdfWidth - targetWidth) / 2;
            const y = 20;

            pdf.addImage(imgData, 'PNG', x, y, targetWidth, targetHeight);
            pdf.save(`ID_Card_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF Download failed', err);
        }
    };

    const handleViewArchive = async (archiveId) => {
        try {
            const response = await api.get(`/admin/archives/${archiveId}`);
            setSelectedArchive(response.data.archive);
            setShowArchiveModal(true);
        } catch (error) {
            console.error('Error fetching archive details:', error);
            setError('Failed to load archive details');
        }
    };

    const handleDeleteArchive = async (archiveId) => {
        if (window.confirm('Are you sure you want to permanently delete this archived record? This cannot be undone.')) {
            try {
                const response = await api.delete(`/admin/archives/${archiveId}`);
                if (response.data.success) {
                    setArchivedStudents(prev => prev.filter(student => student._id !== archiveId));
                    setSuccess('Archived record deleted permanently');
                    setTimeout(() => setSuccess(''), 3000);
                }
            } catch (error) {
                console.error('Error deleting archive:', error);
                setError('Failed to delete archived record');
            }
        }
    };

    const handleClearArchives = async () => {
        if (window.confirm('WARNING: Are you sure you want to PERMANENTLY DELETE ALL archived students? This action cannot be undone and all records will be lost.')) {
            try {
                const response = await api.delete('/admin/archives/clear');
                if (response.data.success) {
                    setArchivedStudents([]);
                    setSuccess('All archives cleared successfully');
                    setTimeout(() => setSuccess(''), 3000);
                }
            } catch (error) {
                console.error('Error clearing archives:', error);
                setError('Failed to clear archives');
            }
        }
    };

    // Get all available seats from floors (including fully and partially booked)
    const getAvailableSeats = () => {
        const seats = [];
        floors.forEach(floor => {
            floor.rooms.forEach(room => {
                room.seats.forEach(seat => {
                    // Get active assignments for this seat
                    const activeAssignments = seat.assignments?.filter(a => a.status === 'active') || [];

                    // Get list of taken shift IDs
                    const takenShiftIds = activeAssignments.map(a => {
                        return typeof a.shift === 'object' ? a.shift._id : a.shift;
                    }).filter(Boolean);

                    // Check if seat has full day booking
                    const hasFullDay = activeAssignments.some(a => {
                        if (a.type === 'full_day' || a.legacyShift === 'full') return true;
                        if (a.shift && typeof a.shift === 'object') {
                            return a.shift.name?.toLowerCase().includes('full');
                        }
                        return false;
                    });

                    // Include ALL seats - shift dropdown will filter based on availability
                    seats.push({
                        ...seat,
                        displayName: `${floor.name} - ${room.name} - ${seat.number}`,
                        floorName: floor.name,
                        roomName: room.name,
                        takenShiftIds: takenShiftIds,
                        isPartiallyBooked: activeAssignments.length > 0 && !hasFullDay,
                        isFullyBooked: hasFullDay || takenShiftIds.length >= shifts.length
                    });
                });
            });
        });
        return seats;
    };

    const availableSeats = getAvailableSeats();

    // Get available shifts for a specific seat
    const getAvailableShiftsForSeat = (seatId) => {
        if (!seatId) return shifts; // If no seat selected, show all shifts

        const selectedSeat = availableSeats.find(s => s._id === seatId);
        if (!selectedSeat) return shifts;

        // Filter out shifts that are already taken on this seat
        const available = shifts.filter(shift => {
            return !selectedSeat.takenShiftIds.includes(shift._id || shift.id);
        });

        // Special: If ANY shift is taken, remove 'full' shift option too
        if (selectedSeat.takenShiftIds.length > 0) {
            return available.filter(s => {
                const isFull = s.id === 'full' || s.id === 'full_day' || (s.name && s.name.toLowerCase().includes('full'));
                return !isFull;
            });
        }

        return available;
    };


    // Helper to get seat number for a student
    const getStudentSeat = (studentId) => {
        if (!floors || floors.length === 0) return null;

        for (const floor of floors) {
            if (!floor.rooms) continue;
            for (const room of floor.rooms) {
                if (!room.seats) continue;
                for (const seat of room.seats) {
                    // Check assignments array for active assignments
                    if (seat.assignments && seat.assignments.length > 0) {
                        const hasActiveAssignment = seat.assignments.some(assignment => {
                            if (assignment.status !== 'active') return false;

                            const assignedStudentId = typeof assignment.student === 'object'
                                ? assignment.student._id
                                : assignment.student;

                            return assignedStudentId === studentId;
                        });

                        if (hasActiveAssignment) {
                            return seat.number;
                        }
                    }

                    // Fallback to legacy assignedTo field
                    if (seat.assignedTo) {
                        const assignedId = typeof seat.assignedTo === 'object' ? seat.assignedTo._id : seat.assignedTo;
                        if (assignedId === studentId) {
                            return seat.number;
                        }
                    }
                }
            }
        }
        return null;
    };

    // Helper to check if student has a seat with the given shift
    const hasShiftAssignment = (studentId, shiftId) => {
        if (!floors || floors.length === 0) return false;

        for (const floor of floors) {
            if (!floor.rooms) continue;
            for (const room of floor.rooms) {
                if (!room.seats) continue;
                for (const seat of room.seats) {
                    if (!seat.assignments) continue;

                    // Check active assignments
                    const activeAssignments = seat.assignments.filter(a => a.status === 'active');
                    for (const assignment of activeAssignments) {
                        // Check if this assignment belongs to our student
                        const assignedStudentId = typeof assignment.student === 'object'
                            ? assignment.student._id
                            : assignment.student;

                        if (assignedStudentId === studentId) {
                            // Check if assignment has the matching shift
                            const assignmentShiftId = typeof assignment.shift === 'object'
                                ? assignment.shift._id
                                : assignment.shift;

                            if (assignmentShiftId === shiftId) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    };

    // Helper to get student's assigned shifts as a display string
    const getStudentShifts = (studentId) => {
        if (!floors || floors.length === 0) return null;

        const assignedShifts = [];
        for (const floor of floors) {
            if (!floor.rooms) continue;
            for (const room of floor.rooms) {
                if (!room.seats) continue;
                for (const seat of room.seats) {
                    if (!seat.assignments) continue;

                    // Check active assignments
                    const activeAssignments = seat.assignments.filter(a => a.status === 'active');
                    for (const assignment of activeAssignments) {
                        // Check if this assignment belongs to our student
                        const assignedStudentId = typeof assignment.student === 'object'
                            ? assignment.student._id
                            : assignment.student;

                        if (assignedStudentId === studentId) {
                            // Get shift name
                            if (assignment.shift && typeof assignment.shift === 'object') {
                                assignedShifts.push(assignment.shift.name);
                            } else if (assignment.type === 'full_day' || assignment.legacyShift === 'full') {
                                assignedShifts.push('Full Day');
                            }
                        }
                    }
                }
            }
        }

        return assignedShifts.length > 0 ? assignedShifts.join(', ') : null;
    };

    // Filter students based on active tab
    const getFilteredStudents = () => {
        switch (activeTab) {
            case 'active':
                return students.filter(student => student.isActive);
            case 'inactive':
                return students.filter(student => !student.isActive);
            case 'admin':
                return students.filter(student => (student.registrationSource === 'admin' || !student.registrationSource) && student.isActive);
            case 'self':
                return students.filter(student => student.registrationSource === 'self' && student.isActive);
            case 'pending':
                return students.filter(student =>
                    !getStudentSeat(student._id) &&
                    student.isActive
                );
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
                    <div className="flex gap-3">
                        <Button
                            variant="danger"
                            onClick={handleResetAllQrs}
                            className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-sm"
                        >
                            <IoRefresh size={18} /> Reset All QRs
                        </Button>
                        <Button variant="primary" onClick={openAddModal}>
                            <IoAdd className="inline mr-2" size={20} /> Add Student
                        </Button>
                    </div>
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
                        onClick={() => setActiveTab('admin')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'admin'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        Admin Registered ({students.filter(s => ((s.registrationSource === 'admin' || !s.registrationSource) && s.isActive)).length})
                    </button>
                    <button
                        onClick={() => setActiveTab('self')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'self'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        Self Registered ({students.filter(s => (s.registrationSource === 'self' && s.isActive)).length})
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
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'pending'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        Pending Allocation ({students.filter(s => (!getStudentSeat(s._id) && s.isActive)).length})
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
                    <button
                        onClick={() => setActiveTab('id-cards')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'id-cards'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        <IoIdCard className="inline mr-2" size={18} />
                        ID Cards
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-gradient-primary shadow-lg'
                            : 'bg-white/10 hover:bg-white/20'
                            }`}
                    >
                        <IoTrash className="inline mr-2" size={18} />
                        Deleted History
                    </button>
                    {activeTab === 'history' && (
                        <div className="ml-auto">
                            <Button
                                variant="danger"
                                onClick={handleClearArchives}
                                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-sm px-4 py-2"
                                disabled={archivedStudents.length === 0}
                            >
                                <IoTrash size={16} /> Clear All Archives
                            </Button>
                        </div>
                    )}
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
                    <>
                        {activeTab === 'id-cards' ? (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8">
                                {/* Shift filter header */}
                                {shiftFilter && (
                                    <div className="col-span-full bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 flex justify-between items-center">
                                        <p className="text-purple-300 font-medium">
                                            Showing students for: <span className="text-white font-bold">
                                                {shifts.find(s => s._id === shiftFilter)?.name || 'Selected Shift'}
                                            </span>
                                        </p>
                                        <Button
                                            variant="secondary"
                                            onClick={() => window.location.href = '/admin/students?tab=id-cards'}
                                            className="bg-white/10 hover:bg-white/20"
                                        >
                                            View All Students
                                        </Button>
                                    </div>
                                )}
                                {(() => {
                                    // Filter students: active and optionally by shift
                                    const filteredStudents = students.filter(s => {
                                        if (!s.isActive) return false;
                                        if (shiftFilter && !hasShiftAssignment(s._id, shiftFilter)) return false;
                                        return true;
                                    });

                                    return filteredStudents.length === 0 ? (
                                        <div className="col-span-full text-center p-12 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-gray-400 text-lg">
                                                {shiftFilter
                                                    ? 'No students found for this shift.'
                                                    : 'No active students found to generate ID cards.'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <div key={student._id} className="flex justify-center p-4">
                                                <StudentIdCard
                                                    student={{
                                                        ...student,
                                                        seatNumber: getStudentSeat(student._id)
                                                    }}
                                                />
                                            </div>
                                        ))
                                    );
                                })()}
                            </div>
                        ) : activeTab === 'history' ? (
                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left p-4">Name</th>
                                                <th className="text-left p-4">Email</th>
                                                <th className="text-left p-4">Joined</th>
                                                <th className="text-left p-4">Deleted At</th>
                                                <th className="text-right p-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {archivedStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center p-8 text-gray-400">
                                                        No deleted students found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                archivedStudents.map((student) => (
                                                    <tr key={student._id} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="p-4">{student.name}</td>
                                                        <td className="p-4">{student.email}</td>
                                                        <td className="p-4">
                                                            {new Date(student.joinedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-red-400">
                                                            {new Date(student.deletedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => handleViewArchive(student._id)}
                                                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition shadow-sm mr-2"
                                                                title="View Report"
                                                            >
                                                                View Report
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteArchive(student._id)}
                                                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition shadow-sm"
                                                                title="Delete Permanently"
                                                            >
                                                                <IoTrash size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left p-4">Name</th>
                                                <th className="text-left p-4">Email</th>
                                                <th className="text-left p-4">Shift</th>
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
                                                            {(() => {
                                                                const shifts = getStudentShifts(student._id);
                                                                if (!shifts && student.isActive) {
                                                                    return <Badge variant="yellow">Pending Allocation</Badge>;
                                                                }
                                                                return shifts || 'N/A';
                                                            })()}
                                                        </td>
                                                        <td className="p-4">
                                                            {(() => {
                                                                const hasSeat = getStudentSeat(student._id);
                                                                const hasShifts = getStudentShifts(student._id);

                                                                if (student.isActive && (!hasSeat || !hasShifts)) {
                                                                    return <Badge variant="yellow">Pending Allocation</Badge>;
                                                                }

                                                                return (
                                                                    <Badge variant={student.isActive ? 'green' : 'red'}>
                                                                        {student.isActive ? 'Active' : 'Inactive'}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="p-4">
                                                            {new Date(student.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-4 text-right space-x-2">
                                                            {student.isActive ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => openIdCardModal(student)}
                                                                        className="text-purple-400 hover:text-purple-300 transition-colors"
                                                                        title="Show ID Card"
                                                                    >
                                                                        <IoIdCard size={20} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openSeatAssignModal(student)}
                                                                        className="text-green-400 hover:text-green-300 transition-colors"
                                                                        title="Assign Seat"
                                                                    >
                                                                        <IoBedOutline size={20} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openResetPasswordModal(student)}
                                                                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                                                                        title="Reset Password"
                                                                    >
                                                                        <IoKey size={20} />
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
                                                                <button
                                                                    onClick={() => handleReactivate(student)}
                                                                    className="text-green-400 hover:text-green-300 transition-colors mr-2"
                                                                    title="Reactivate Student"
                                                                >
                                                                    <IoRefresh size={20} />
                                                                </button>
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
                    </>
                )}

                {/* View ID Card Modal */}
                <Modal
                    isOpen={showIdCardModal}
                    onClose={() => setShowIdCardModal(false)}
                    title="Student ID Card"
                >
                    <div className="flex flex-col items-center justify-center p-4">
                        {selectedStudent && (
                            <>
                                <div id="student-id-card-preview" className="p-4 bg-white rounded-xl">
                                    <StudentIdCard
                                        student={{
                                            ...selectedStudent,
                                            seatNumber: getStudentSeat(selectedStudent._id)
                                        }}
                                    />
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
                        <div>
                            <label className="block text-sm font-medium mb-2">Mobile Number</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setFormData({ ...formData, mobile: val });
                                }}
                                className="input"
                                placeholder="Enter 10-digit mobile number"
                                pattern="[0-9]{10}"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="input min-h-[80px]"
                                placeholder="Enter student address"
                            />
                        </div>

                        {!editMode && (
                            <div className="space-y-1">
                                <label className="block text-sm font-medium mb-1">Generated Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.password}
                                        readOnly
                                        className="input flex-1 bg-gray-700/50 cursor-not-allowed font-mono text-center tracking-wider"
                                        placeholder="Generating..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                            let password = '';
                                            for (let i = 0; i < 8; i++) {
                                                password += charset.charAt(Math.floor(Math.random() * charset.length));
                                            }
                                            setFormData({ ...formData, password: password });
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    This password will be sent to the student via email.
                                </p>
                            </div>
                        )}
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
                        {!editMode && !formData.password && (
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
                            >
                                <option value="">Choose a seat...</option>
                                {availableSeats.length === 0 ? (
                                    <option disabled>No available seats</option>
                                ) : (
                                    availableSeats.map(seat => (
                                        <option key={seat._id} value={seat._id}>
                                            {seat.displayName} - ₹{seat.basePrices?.full || 1200}
                                            {seat.isFullyBooked ? ' (Fully Booked)' : seat.isPartiallyBooked ? ' (Partially Booked)' : ''}
                                        </option>
                                    ))
                                )}
                            </select>
                            {availableSeats.length === 0 && (
                                <p className="text-sm text-red-400 mt-2">
                                    No available seats. All seats are currently fully occupied.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Shift</label>
                            <select
                                value={seatFormData.shift}
                                onChange={(e) => setSeatFormData({ ...seatFormData, shift: e.target.value })}
                                className="input"
                            >
                                <option value="">Select shift...</option>
                                {(() => {
                                    const availableShifts = getAvailableShiftsForSeat(seatFormData.seatId);
                                    return availableShifts.map(shift => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.name} ({getShiftTimeRange(shift)}) - ₹{shift.id === 'full' ? '1200' : '800'}
                                        </option>
                                    ));
                                })()}
                                {!isCustom && !shifts.some(s => s.id === 'full') &&
                                    (!seatFormData.seatId || getAvailableShiftsForSeat(seatFormData.seatId).some(s => s.id !== 'full')) && (
                                        <option value="full">Full Day (9 AM - 9 PM) - ₹1200</option>
                                    )}
                            </select>
                            {seatFormData.seatId && getAvailableShiftsForSeat(seatFormData.seatId).length === 0 && (
                                <p className="text-sm text-yellow-400 mt-2">
                                    No available shifts for this seat. All shifts are taken.
                                </p>
                            )}
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
                                disabled={availableSeats.length === 0 || assigningSeat}
                            >
                                {assigningSeat ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <IoBedOutline className="inline mr-2" /> Assign Seat
                                    </>
                                )}
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
                    title={selectedStudent?.isActive && !hardDelete ? "⚠️ Remove Student" : "🗑️ Delete Permanently"}
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
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-gray-400">Status</span>
                                    {selectedStudent?.registrationSource === 'self' && !selectedStudent?.seat ? (
                                        <span className="text-yellow-400 font-medium">Pending Allocation</span>
                                    ) : (
                                        <span className={selectedStudent?.isActive ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                                            {selectedStudent?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    )}
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
                        <div className={`border rounded-lg p-3 ${selectedStudent?.isActive && !hardDelete
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <p className={`text-sm ${selectedStudent?.isActive && !hardDelete ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                {selectedStudent?.isActive && !hardDelete ? (
                                    <>⚠️ This will mark the student as inactive and free up their assigned seat. They can be restored later.</>
                                ) : (
                                    <>🗑️ This will PERMANENTLY delete this student from the database. This action CANNOT be undone!</>
                                )}
                            </p>
                        </div>

                        {/* Hard Delete Checkbox (Only for active students) */}
                        {selectedStudent?.isActive && (
                            <div className="flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="hardDelete"
                                    checked={hardDelete}
                                    onChange={(e) => setHardDelete(e.target.checked)}
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 bg-gray-700 border-gray-600"
                                />
                                <label htmlFor="hardDelete" className="text-sm text-gray-300 select-none cursor-pointer">
                                    Permanently delete from database (Skip inactive state)
                                </label>
                            </div>
                        )}

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
                                    selectedStudent?.isActive && !hardDelete ? 'Remove Student' : 'Delete Permanently'
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

                {/* Reset Password Modal */}
                <Modal
                    isOpen={showResetPasswordModal}
                    onClose={() => {
                        setShowResetPasswordModal(false);
                        setSelectedStudent(null);
                        setError('');
                    }}
                    title="Reset Student Password"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-yellow-400 font-semibold mb-2">⚠️ Reset Password Confirmation</p>
                            <p className="text-sm text-gray-300">
                                This will generate a new random password for <strong>{selectedStudent?.name}</strong> and send it to their email:
                                <br />
                                <span className="text-blue-400">{selectedStudent?.email}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                The student will also receive an in-app notification.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowResetPasswordModal(false);
                                    setSelectedStudent(null);
                                    setError('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleResetPassword}
                                disabled={resetPasswordLoading}
                                className="flex-1"
                            >
                                {resetPasswordLoading ? 'Resetting...' : 'Reset & Send Email'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Archive View Modal */}
                <Modal
                    isOpen={showArchiveModal}
                    onClose={() => setShowArchiveModal(false)}
                    title={selectedArchive ? `Archive Report: ${selectedArchive.name}` : 'Archive Report'}
                >
                    {selectedArchive && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                                {selectedArchive.profileImage ? (
                                    <img
                                        src={selectedArchive.profileImage.startsWith('http') ? selectedArchive.profileImage : `${BASE_URL}${selectedArchive.profileImage}`}
                                        alt={selectedArchive.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold">
                                        {selectedArchive.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">{selectedArchive.name}</h3>
                                    <p className="text-gray-400">{selectedArchive.email}</p>
                                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                        <span>Joined: {new Date(selectedArchive.joinedAt).toLocaleDateString()}</span>
                                        <span className="text-red-400">Deleted: {new Date(selectedArchive.deletedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                    <h4 className="text-blue-400 text-sm font-semibold mb-2">Total Fees Recorded</h4>
                                    <p className="text-2xl font-bold">₹{selectedArchive.fees.reduce((acc, f) => acc + f.amount, 0)}</p>
                                    <p className="text-xs text-gray-400">{selectedArchive.fees.length} transactions</p>
                                </div>
                                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                                    <h4 className="text-purple-400 text-sm font-semibold mb-2">Attendance Days</h4>
                                    <p className="text-2xl font-bold">{selectedArchive.attendance.filter(a => a.status === 'present').length}</p>
                                    <p className="text-xs text-gray-400">Out of {selectedArchive.attendance.length} recorded days</p>
                                </div>
                            </div>

                            {/* Fee History */}
                            <div>
                                <h4 className="font-semibold mb-3 border-b border-white/10 pb-2">Fee History</h4>
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                    {selectedArchive.fees.length === 0 ? (
                                        <p className="text-sm text-gray-500">No fee records found.</p>
                                    ) : (
                                        selectedArchive.fees.map((fee, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded text-sm">
                                                <span>{new Date(fee.year, fee.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono">₹{fee.amount}</span>
                                                    <Badge variant={fee.status === 'paid' ? 'green' : 'yellow'}>{fee.status}</Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Attendance History */}
                            <div>
                                <h4 className="font-semibold mb-3 border-b border-white/10 pb-2">Recent Attendance</h4>
                                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                    {selectedArchive.attendance.length === 0 ? (
                                        <p className="text-sm text-gray-500">No attendance records found.</p>
                                    ) : (
                                        selectedArchive.attendance.slice(0, 20).map((att, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded text-sm">
                                                <span>{new Date(att.date).toLocaleDateString()}</span>
                                                <Badge variant={att.status === 'present' ? 'green' : 'red'}>{att.status}</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button variant="secondary" onClick={() => setShowArchiveModal(false)}>Close Report</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div >
    );
};

export default StudentManagement;
