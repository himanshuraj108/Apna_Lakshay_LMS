import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { IoArrowBack, IoAdd, IoTrash, IoPencil, IoBedOutline, IoIdCard, IoDownload, IoKey, IoRefresh, IoPeopleOutline, IoDownloadOutline } from 'react-icons/io5';
import StudentIdCard from '../../components/admin/StudentIdCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useShifts from '../../hooks/useShifts';

const PAGE_BG = { background: '#050508' };
const INPUT = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-gray-700';
const BTN_PRIMARY = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all';
const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl text-sm text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 font-medium transition-all disabled:opacity-50';
const BTN_DANGER = 'px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 transition-all';

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
        systemMode: mode,
        joinedAt: new Date().toISOString().split('T')[0] // Default to today
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
        setLoading(true);

        try {
            if (editMode) {
                await api.put(`/admin/students/${selectedStudent._id}`, formData);

                // If shift was changed, and they have a seat, attempt to assign the new shift
                if (formData.shift && formData.seatId) {
                    try {
                        await api.post('/admin/seats/assign', {
                            seatId: formData.seatId,
                            studentId: selectedStudent._id,
                            shift: formData.shift,
                            negotiatedPrice: formData.negotiatedPrice ? Number(formData.negotiatedPrice) : undefined
                        });
                    } catch (seatErr) {
                        console.error('Failed to update seat shift during edit', seatErr);
                        setError('Student info updated, but ' + (seatErr.response?.data?.message || 'failed to update shift automatically. Please use the Assign Seat button.'));
                    }
                }

                if (!error) setSuccess('Student updated successfully');
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
        } finally {
            setLoading(false);
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
            password: password,
            joinedAt: new Date().toISOString().split('T')[0] // Default to today
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

        let shiftId = '';
        let negotiatedPrice = '';
        if (student.seat && student.seat.assignments) {
            const assignment = student.seat.assignments.find(a =>
                a.status === 'active' && a.student === student._id
            );
            if (assignment && assignment.shift) {
                shiftId = typeof assignment.shift === 'object' ? assignment.shift._id : assignment.shift;
            } else if (assignment && assignment.legacyShift === 'full' || assignment?.type === 'full_day') {
                shiftId = 'full';
            }
            if (assignment && assignment.negotiatedPrice !== undefined) {
                negotiatedPrice = assignment.negotiatedPrice;
            }
        }

        setFormData({
            name: student.name,
            email: student.email,
            mobile: student.mobile || '',
            address: student.address || '',
            joinedAt: student.createdAt ? new Date(student.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            shift: shiftId,
            negotiatedPrice: negotiatedPrice,
            seatId: getStudentSeat(student._id) ? student.seat._id : '' // Needed for assignSeat
        });
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

    const getStudentFee = (student) => {
        if (student.currentFee != null) {
            return `Rs. ${student.currentFee}`;
        }

        const studentId = student._id;
        if (!floors || floors.length === 0) return 'N/A';
        for (const floor of floors) {
            if (!floor.rooms) continue;
            for (const room of floor.rooms) {
                if (!room.seats) continue;
                for (const seat of room.seats) {
                    if (seat.assignments && seat.assignments.length > 0) {
                        const activeAssignment = seat.assignments.find(a =>
                            a.status === 'active' &&
                            (typeof a.student === 'object' ? a.student._id : a.student) === studentId
                        );
                        if (activeAssignment) {
                            if (activeAssignment.negotiatedPrice) {
                                return `Rs. ${activeAssignment.negotiatedPrice}`;
                            } else {
                                // Find base price based on shift type
                                const shiftId = typeof activeAssignment.shift === 'object' ? activeAssignment.shift._id : activeAssignment.shift;
                                if (shiftId === 'full_day' || activeAssignment.type === 'full_day' || activeAssignment.legacyShift === 'full') {
                                    return `Rs. ${seat.basePrices?.full || 1200} (Base)`;
                                } else {
                                    return `Rs. ${seat.basePrices?.half || 700} (Base)`;
                                }
                            }
                        }
                    }
                }
            }
        }
        return 'N/A';
    };

    const generateStudentTablePDF = () => {
        const doc = new jsPDF('landscape');
        const dateStr = new Date().toLocaleDateString('en-GB');

        let tabTitle = 'All Students';
        switch (activeTab) {
            case 'active': tabTitle = 'Active Students'; break;
            case 'inactive': tabTitle = 'Inactive Students'; break;
            case 'pending': tabTitle = 'Pending Seat Assignment'; break;
            case 'admin': tabTitle = 'Admin Registered Students'; break;
            case 'self': tabTitle = 'Self Registered Students'; break;
            case 'history': tabTitle = 'Deleted Student Archives'; break;
        }

        doc.setFontSize(16);
        doc.text(`${tabTitle} Report - ${dateStr}`, 14, 15);

        if (activeTab === 'history') {
            const tableColumn = ["Name", "Email", "Joined Date", "Deleted Date"];
            const tableRows = [];

            archivedStudents.forEach(student => {
                tableRows.push([
                    student.name,
                    student.email || 'N/A',
                    new Date(student.joinedAt).toLocaleDateString('en-GB'),
                    new Date(student.deletedAt).toLocaleDateString('en-GB')
                ]);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [63, 81, 181] }
            });
            doc.save(`Archived_Students_${dateStr}.pdf`);
            return;
        }

        const tableColumn = ["S.No", "Name", "Mobile", "Email", "Status", "Presence", "Seat", "Shift", "Fee", "Joined", "Address"];
        const tableRows = [];

        filteredStudents.forEach((student, index) => {
            const hasSeat = getStudentSeat(student._id);
            const hasShifts = getStudentShifts(student._id);
            let statusStr = student.isActive ? 'Active' : 'Inactive';
            if (student.isActive && (!hasSeat || !hasShifts)) {
                statusStr = 'Pending';
            }

            tableRows.push([
                index + 1,
                student.name,
                student.mobile ? String(student.mobile) : 'N/A',
                student.email || 'N/A',
                statusStr,
                `${student.isOnline ? 'Online' : 'Offline'} / ${student.isLoggedIn ? 'In' : 'Out'}`,
                hasSeat || 'N/A',
                hasShifts || 'N/A',
                getStudentFee(student),
                new Date(student.createdAt).toLocaleDateString('en-GB'),
                student.address || 'N/A'
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [63, 81, 181] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw === 'Active') {
                        data.cell.styles.textColor = [34, 197, 94]; // Green
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'Inactive') {
                        data.cell.styles.textColor = [239, 68, 68]; // Red
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'Pending') {
                        data.cell.styles.textColor = [234, 179, 8]; // Yellow
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        doc.save(`Student_Report_${tabTitle.replace(/\s+/g, '_')}_${dateStr}.pdf`);
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

    // Helper function to check if two time ranges overlap
    const doTimeRangesOverlap = (start1, end1, start2, end2) => {
        // Convert time strings (HH:MM) to minutes since midnight
        const toMinutes = (time) => {
            if (!time) return 0;
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const s1 = toMinutes(start1);
        const e1 = toMinutes(end1);
        const s2 = toMinutes(start2);
        const e2 = toMinutes(end2);

        // Two ranges overlap if: start1 < end2 AND start2 < end1
        return s1 < e2 && s2 < e1;
    };

    // Get available shifts for a specific seat
    const getAvailableShiftsForSeat = (seatId) => {
        if (!seatId) return shifts; // If no seat selected, show all shifts

        const selectedSeat = availableSeats.find(s => s._id === seatId);
        if (!selectedSeat) return shifts;

        // Get active assignments with shift details for this seat
        const activeAssignments = selectedSeat.assignments?.filter(a => a.status === 'active') || [];

        // Filter out shifts that overlap with existing assignments
        const available = shifts.filter(candidateShift => {
            // Check if this shift overlaps with any existing assignment
            for (const assignment of activeAssignments) {
                const assignedShift = assignment.shift;

                // Skip if no shift object
                if (!assignedShift || typeof assignedShift !== 'object') continue;

                // Check for time overlap
                if (candidateShift.startTime && candidateShift.endTime &&
                    assignedShift.startTime && assignedShift.endTime) {
                    const hasOverlap = doTimeRangesOverlap(
                        candidateShift.startTime,
                        candidateShift.endTime,
                        assignedShift.startTime,
                        assignedShift.endTime
                    );

                    if (hasOverlap) {
                        return false; // Exclude this shift - it overlaps
                    }
                }

                // Also check for exact ID match (fallback)
                const candidateId = candidateShift._id || candidateShift.id;
                const assignedId = assignedShift._id || assignedShift.id;
                if (candidateId && assignedId && candidateId === assignedId) {
                    return false;
                }
            }

            return true; // No overlap found, include this shift
        });

        // Special: If ANY shift is taken, remove 'full' shift option too
        if (selectedSeat.takenShiftIds.length > 0 || activeAssignments.length > 0) {
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

    const getShiftPriceForSeat = (seatId, shiftId) => {
        if (!seatId || !floors || floors.length === 0) return shiftId === 'full' ? 1200 : 800;

        let foundSeat = null;
        for (const floor of floors) {
            for (const room of floor.rooms || []) {
                const seat = room.seats?.find(s => s._id === seatId);
                if (seat) {
                    foundSeat = seat;
                    break;
                }
            }
            if (foundSeat) break;
        }

        if (!foundSeat) return shiftId === 'full' ? 1200 : 800;

        if (shiftId === 'full' || shiftId === 'full_day') {
            return foundSeat.basePrices?.full || 1200;
        }

        if (foundSeat.shiftPrices && foundSeat.shiftPrices[shiftId]) {
            return foundSeat.shiftPrices[shiftId];
        }

        return foundSeat.basePrices?.day || foundSeat.basePrices?.half || 800;
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
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-3xl" />
                <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
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
                                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg"><IoPeopleOutline size={14} className="text-white" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">Student Management</h1>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <motion.button whileHover={{ scale: 1.03 }} onClick={generateStudentTablePDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-semibold transition-all">
                            <IoDownloadOutline size={16} /> Export PDF
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} onClick={handleResetAllQrs}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-all">
                            <IoRefresh size={16} /> Reset All QRs
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.03 }} onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25">
                            <IoAdd size={16} /> Add Student
                        </motion.button>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
                    {[
                        { id: 'all', label: `All (${students.length})` },
                        { id: 'admin', label: `Admin Reg. (${students.filter(s => ((s.registrationSource === 'admin' || !s.registrationSource) && s.isActive)).length})` },
                        { id: 'self', label: `Self Reg. (${students.filter(s => s.registrationSource === 'self' && s.isActive).length})` },
                        { id: 'active', label: `Active (${students.filter(s => s.isActive).length})` },
                        { id: 'pending', label: `Pending (${students.filter(s => !getStudentSeat(s._id) && s.isActive).length})` },
                        { id: 'inactive', label: `Inactive (${students.filter(s => !s.isActive).length})` },
                        { id: 'id-cards', label: 'ID Cards', icon: <IoIdCard size={13} /> },
                        { id: 'history', label: 'Deleted', icon: <IoTrash size={13} /> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                    {activeTab === 'history' && (
                        <motion.button whileHover={{ scale: 1.03 }} onClick={handleClearArchives}
                            disabled={archivedStudents.length === 0}
                            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-all disabled:opacity-40">
                            <IoTrash size={13} /> Clear All
                        </motion.button>
                    )}
                </div>

                {/* Alerts */}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/10 border border-green-500/25 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm">
                        {success}
                    </motion.div>
                )}
                {error && !showDeleteModal && !showResetPasswordModal && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                        {error}
                    </motion.div>
                )}

                {loading ? (
                    <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/3 rounded-xl animate-pulse" />)}</div>
                ) : (
                    <>
                        {activeTab === 'id-cards' ? (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8">
                                {shiftFilter && (
                                    <div className="col-span-full bg-purple-500/10 border border-purple-500/25 rounded-xl p-4 mb-2 flex justify-between items-center">
                                        <p className="text-purple-300 text-sm font-medium">
                                            Showing students for: <span className="text-white font-bold">
                                                {shifts.find(s => s._id === shiftFilter)?.name || 'Selected Shift'}
                                            </span>
                                        </p>
                                        <button onClick={() => window.location.href = '/admin/students?tab=id-cards'}
                                            className={BTN_SECONDARY}>View All</button>
                                    </div>
                                )}
                                {(() => {
                                    const filtered = students.filter(s => {
                                        if (!s.isActive) return false;
                                        if (shiftFilter && !hasShiftAssignment(s._id, shiftFilter)) return false;
                                        return true;
                                    });
                                    return filtered.length === 0 ? (
                                        <div className="col-span-full text-center p-12 bg-white/3 rounded-2xl border border-white/8">
                                            <p className="text-gray-500">{shiftFilter ? 'No students found for this shift.' : 'No active students found.'}</p>
                                        </div>
                                    ) : filtered.map(student => (
                                        <div key={student._id} className="flex justify-center p-4">
                                            <StudentIdCard student={{ ...student, seatNumber: getStudentSeat(student._id) }} />
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : activeTab === 'history' ? (
                            <div className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                                <div className="h-px bg-gradient-to-r from-red-500/60 to-orange-500/60" />
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/8">
                                                {['Name', 'Email', 'Joined', 'Deleted At', 'Actions'].map((h, i) => (
                                                    <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {archivedStudents.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center p-8 text-gray-600 text-sm">No deleted students found.</td></tr>
                                            ) : archivedStudents.map(student => (
                                                <tr key={student._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                    <td className="px-5 py-3.5 font-medium text-sm text-white">{student.name}</td>
                                                    <td className="px-5 py-3.5 text-sm text-gray-400">{student.email}</td>
                                                    <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(student.joinedAt).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3.5 text-xs text-red-400">{new Date(student.deletedAt).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <button onClick={() => handleViewArchive(student._id)}
                                                            className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-medium mr-2 hover:bg-blue-500/20 transition-all">View Report</button>
                                                        <button onClick={() => handleDeleteArchive(student._id)}
                                                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"><IoTrash size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                                <div className="h-px bg-gradient-to-r from-blue-500/60 to-indigo-500/60" />
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/8">
                                                {['Name', 'Email', 'Shift', 'Status', 'Presence', 'Created', 'Fee', 'Actions'].map((h, i) => (
                                                    <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${i === 7 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.length === 0 ? (
                                                <tr><td colSpan="8" className="text-center p-10 text-gray-600 text-sm">
                                                    {activeTab === 'all' && 'No students found. Click "Add Student" to create one.'}
                                                    {activeTab === 'active' && 'No active students found.'}
                                                    {activeTab === 'inactive' && 'No inactive students found.'}
                                                    {activeTab === 'pending' && 'No students pending allocation.'}
                                                </td></tr>
                                            ) : filteredStudents.map(student => (
                                                <tr key={student._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                    <td className="px-5 py-3.5 font-semibold text-sm text-white">{student.name}</td>
                                                    <td className="px-5 py-3.5 text-sm text-gray-400">{student.email}</td>
                                                    <td className="px-5 py-3.5 text-sm">
                                                        {(() => {
                                                            const s = getStudentShifts(student._id);
                                                            if (!s && student.isActive) return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">Pending</span>;
                                                            return <span className="text-gray-400 text-xs">{s || 'N/A'}</span>;
                                                        })()}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {(() => {
                                                            const hasSeat = getStudentSeat(student._id);
                                                            const hasShifts = getStudentShifts(student._id);
                                                            if (student.isActive && (!hasSeat || !hasShifts)) return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">Pending</span>;
                                                            return <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${student.isActive ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{student.isActive ? 'Active' : 'Inactive'}</span>;
                                                        })()}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-1.5" title={student.lastActive ? `Last Active: ${new Date(student.lastActive).toLocaleString()}` : 'Online status'}>
                                                                <span className={`w-2 h-2 rounded-full ${student.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`} />
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${student.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                                                    {student.isOnline ? 'Online' : 'Offline'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5" title={student.lastLogin ? `Last Login: ${new Date(student.lastLogin).toLocaleString()}` : 'Login status'}>
                                                                <span className={`w-2 h-2 rounded-full ${student.isLoggedIn ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-600'}`} />
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${student.isLoggedIn ? 'text-blue-400' : 'text-gray-500'}`}>
                                                                    {student.isLoggedIn ? 'Logged In' : 'Logged Out'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-gray-600">{new Date(student.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-400">{getStudentFee(student)}</td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {student.isActive ? (
                                                                <>
                                                                    <button onClick={() => openIdCardModal(student)} className="text-purple-400 hover:text-purple-300 transition-colors" title="Show ID Card"><IoIdCard size={18} /></button>
                                                                    <button onClick={() => openSeatAssignModal(student)} className="text-green-400 hover:text-green-300 transition-colors" title="Assign Seat"><IoBedOutline size={18} /></button>
                                                                    <button onClick={() => openResetPasswordModal(student)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Reset Password"><IoKey size={18} /></button>
                                                                    <button onClick={() => openEditModal(student)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Edit"><IoPencil size={18} /></button>
                                                                </>
                                                            ) : (
                                                                <button onClick={() => handleReactivate(student)} className="text-green-400 hover:text-green-300 transition-colors" title="Reactivate"><IoRefresh size={18} /></button>
                                                            )}
                                                            <button onClick={() => openDeleteModal(student)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete"><IoTrash size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
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
                                <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
                                    <button onClick={() => setShowIdCardModal(false)} className={BTN_SECONDARY + ' flex-1'}>Close</button>
                                    <button onClick={handleDownloadPNG} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/20">
                                        <IoDownload size={14} /> PNG
                                    </button>
                                    <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold shadow-lg shadow-red-500/20">
                                        <IoDownload size={14} /> PDF
                                    </button>
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
                                className={INPUT}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={INPUT}
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
                                className={INPUT}
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
                                className={INPUT + ' min-h-[80px]'}
                                placeholder="Enter student address"
                            />
                        </div>

                        {!editMode && (
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Generated Password</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.password} readOnly
                                        className={INPUT + ' flex-1 cursor-not-allowed font-mono text-center tracking-wider opacity-70'}
                                        placeholder="Generating..." />
                                    <button type="button" onClick={() => {
                                        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                        let password = '';
                                        for (let i = 0; i < 8; i++) { password += charset.charAt(Math.floor(Math.random() * charset.length)); }
                                        setFormData({ ...formData, password: password });
                                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-colors font-medium">
                                        Regenerate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">This password will be sent to the student via email.</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Registration Date</label>
                            <input type="date" value={formData.joinedAt}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                                className={INPUT}
                                style={{ colorScheme: 'dark' }}
                            />
                            <p className="text-xs text-gray-600 mt-1">Override the join date (used for attendance & fee cycle calculations).</p>
                        </div>
                        {editMode && formData.seatId && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Shift</label>
                                    <select
                                        value={formData.shift}
                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                        className={INPUT}
                                    >
                                        <option value="" className="bg-[#050508]">No shift assigned</option>
                                        {shifts.map(shift => (
                                            <option key={shift.id} value={shift.id} className="bg-[#050508]">
                                                {shift.name} ({getShiftTimeRange(shift)})
                                            </option>
                                        ))}
                                        {!isCustom && !shifts.some(s => s.id === 'full') && (
                                            <option value="full" className="bg-[#050508]">Full Day (9 AM - 9 PM)</option>
                                        )}
                                    </select>
                                    <p className="text-xs text-gray-600 mt-1">Change the shift for the student's currently assigned seat. If they don't have a seat yet, use the Assign Seat button instead.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Negotiated Price (Optional)</label>
                                    <input
                                        type="number"
                                        value={formData.negotiatedPrice}
                                        onChange={(e) => setFormData({ ...formData, negotiatedPrice: e.target.value })}
                                        className={INPUT}
                                        placeholder="Leave empty for base price"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Override the base price for this shift. Leave empty to use default pricing.</p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button type="submit" disabled={loading} className={BTN_PRIMARY + ' flex-1'}>
                                {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Student' : 'Create Student')}
                            </button>
                            <button type="button" onClick={() => setShowModal(false)} disabled={loading} className={BTN_SECONDARY + ' flex-1'}>Cancel</button>
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
                        {/* Selected Student Details */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                                {selectedStudent?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-white font-bold truncate">{selectedStudent?.name}</h4>
                                <p className="text-gray-400 text-sm truncate">{selectedStudent?.email}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Select Seat</label>
                            <select
                                value={seatFormData.seatId}
                                onChange={(e) => setSeatFormData({ ...seatFormData, seatId: e.target.value })}
                                className={INPUT}
                            >
                                <option value="" className="bg-[#050508]">Choose a seat...</option>
                                {availableSeats.length === 0 ? (
                                    <option disabled className="bg-[#050508]">No available seats</option>
                                ) : (
                                    availableSeats.map(seat => (
                                        <option key={seat._id} value={seat._id} className="bg-[#050508]">
                                            {seat.displayName}
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
                                className={INPUT}
                            >
                                <option value="" className="bg-[#050508]">Select shift...</option>
                                {(() => {
                                    const availableShifts = getAvailableShiftsForSeat(seatFormData.seatId);
                                    return availableShifts.map(shift => (
                                        <option key={shift.id} value={shift.id} className="bg-[#050508]">
                                            {shift.name} ({getShiftTimeRange(shift)})
                                        </option>
                                    ));
                                })()}
                                {!isCustom && !shifts.some(s => s.id === 'full') &&
                                    (!seatFormData.seatId || getAvailableShiftsForSeat(seatFormData.seatId).some(s => s.id !== 'full')) && (
                                        <option value="full" className="bg-[#050508]">Full Day (9 AM - 9 PM)</option>
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
                                className={INPUT}
                                placeholder="Leave empty for base price"
                            />
                            <p className="text-sm text-gray-400 mt-1">
                                If left empty, base price for selected shift will be used
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={availableSeats.length === 0 || assigningSeat}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg shadow-green-500/20 disabled:opacity-50">
                                {assigningSeat ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning...</>) : (<><IoBedOutline size={15} /> Assign Seat</>)}
                            </button>
                            <button type="button" onClick={() => setShowSeatModal(false)} className={BTN_SECONDARY + ' flex-1'}>Cancel</button>
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
                                className={INPUT}
                                placeholder="Admin password"
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                For security, please enter your admin password
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button type="submit" disabled={deleteLoading || !deletePassword} className={BTN_DANGER + ' flex-1'}>
                                {deleteLoading ? 'Processing...' : (selectedStudent?.isActive && !hardDelete ? 'Remove Student' : 'Delete Permanently')}
                            </button>
                            <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading} className={BTN_SECONDARY + ' flex-1'}>Cancel</button>
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
                            <button onClick={() => { setShowResetPasswordModal(false); setSelectedStudent(null); setError(''); }} className={BTN_SECONDARY + ' flex-1'}>Cancel</button>
                            <button onClick={handleResetPassword} disabled={resetPasswordLoading} className={BTN_PRIMARY + ' flex-1'}>
                                {resetPasswordLoading ? 'Resetting...' : 'Reset & Send Email'}
                            </button>
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
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fee.status === 'paid' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>{fee.status}</span>
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
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${att.status === 'present' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{att.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={() => setShowArchiveModal(false)} className={BTN_SECONDARY}>Close Report</button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default StudentManagement;
