import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';
import { 
    IoArrowBack, IoAdd, IoTrash, IoPencil, IoBedOutline, IoIdCard, IoDownload, 
    IoKey, IoRefresh, IoPeopleOutline, IoDownloadOutline, IoSwapHorizontal, 
    IoWarning, IoGitBranch, IoClose, IoCheckmark, IoSearchOutline, IoSparkles,
    IoCheckmarkCircle, IoTimeOutline, IoLocationOutline, IoLogoWhatsapp,
    IoFilterOutline, IoChevronDown, IoShieldCheckmarkOutline, IoAlertCircleOutline,
    IoCheckmarkDoneOutline, IoEyeOutline, IoMailOutline, IoCallOutline,
    IoWarningOutline, IoTrashOutline, IoGridOutline, IoListOutline,
    IoLockClosedOutline, IoPersonOutline, IoCalendarOutline, IoShuffleOutline,
    IoPhonePortraitOutline, IoReceiptOutline, IoCardOutline, IoCashOutline, IoArrowForwardOutline, IoCheckmarkCircleOutline
} from 'react-icons/io5';
import StudentIdCard from '../../components/admin/StudentIdCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useShifts from '../../hooks/useShifts';
import useBackPath from '../../hooks/useBackPath';
import { useAuth } from '../../context/AuthContext';
import { PrimaryLogoLoader } from '../../components/ui/SkeletonLoader';

const PAGE_BG = { background: '#FAF6F0' };
const INPUT = 'w-full bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder-slate-400 shadow-2xs';
const LABEL = 'block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5';
const BTN_PRIMARY = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-sm shadow-orange-500/25 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5';
const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5';
const BTN_DANGER = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-sm shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5';

const StudentManagement = () => {
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'subadmin';
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const backPath = useBackPath();
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
        fatherName: '',
        email: '',
        mobile: '',
        dob: '',
        aadharNo: '',
        lockerNo: '',
        registrationFee: 0,
        address: '',
        gender: 'male',
        password: '',
        confirmPassword: '',
        systemMode: mode,
        joinedAt: new Date().toISOString().split('T')[0], // Default to today
        sendMail: false
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
    const [activeTab, setActiveTab] = useState(tabParam || 'active'); // Always default to Active Students tab
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' (default) or 'table'

    // Archive States
    const [archivedStudents, setArchivedStudents] = useState([]);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedArchive, setSelectedArchive] = useState(null);

    // Session Modal States
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [selectedSessionStudent, setSelectedSessionStudent] = useState(null);

    // Credit History Modal States
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [selectedCreditStudent, setSelectedCreditStudent] = useState(null);
    const [creditHistory, setCreditHistory] = useState([]);
    const [creditLoading, setCreditLoading] = useState(false);

    // Swap Seats Modal States
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [swapStudentId1, setSwapStudentId1] = useState('');
    const [swapStudentId2, setSwapStudentId2] = useState('');
    const [swapLoading, setSwapLoading] = useState(false);

    // Sub-Admin Inactivation Modal States & Countdown
    const [showSubAdminInactiveModal, setShowSubAdminInactiveModal] = useState(false);
    const [subAdminInactiveStudent, setSubAdminInactiveStudent] = useState(null);
    const [subAdminInactiveLoading, setSubAdminInactiveLoading] = useState(false);
    const [inactiveCountdown, setInactiveCountdown] = useState(3);

    useEffect(() => {
        let timer;
        if (showSubAdminInactiveModal) {
            setInactiveCountdown(3);
            timer = setInterval(() => {
                setInactiveCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            setInactiveCountdown(3);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [showSubAdminInactiveModal]);

    // Bulk Fee Update States
    const [acFilter, setAcFilter] = useState('all');
    const [floorFilter, setFloorFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [showBulkFeeModal, setShowBulkFeeModal] = useState(false);
    const [bulkFeeAmount, setBulkFeeAmount] = useState('');
    const [bulkFeeOperation, setBulkFeeOperation] = useState('increase');
    const [bulkFeeLoading, setBulkFeeLoading] = useState(false);
    const [bulkFeeSendEmail, setBulkFeeSendEmail] = useState(false);
    const [bulkFeeResult, setBulkFeeResult] = useState(null);
    const [excludedFeeManagementIds, setExcludedFeeManagementIds] = useState([]);
    const [idCardSearchSeat, setIdCardSearchSeat] = useState('');

    // Settings gear dropdown
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // Bulk Reset Password to Mobile
    const [showBulkResetModal, setShowBulkResetModal] = useState(false);
    const [bulkResetLoading, setBulkResetLoading] = useState(false);
    const [bulkResetResult, setBulkResetResult] = useState(null);

    // Temporary Seat Assignment States
    const [showTempSeatModal, setShowTempSeatModal] = useState(false);
    const [tempSeatStudent, setTempSeatStudent] = useState(null);
    const [tempSeatList, setTempSeatList] = useState([]);
    const [tempSeatLoading, setTempSeatLoading] = useState(false);
    const [tempForm, setTempForm] = useState({ seatId: '', shiftId: '', originalOwnerId: '', note: '', endDate: '' });

    // Split Seat Assignment States
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitStudent, setSplitStudent] = useState(null);
    const [splitPairs, setSplitPairs] = useState([{ seatId: '', shiftId: '', price: '' }, { seatId: '', shiftId: '', price: '' }]);
    const [splitLoading, setSplitLoading] = useState(false);

    // Scholar Activity & Status History Modal States
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityStudent, setActivityStudent] = useState(null);
    const [activityTimeline, setActivityTimeline] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityCategoryFilter, setActivityCategoryFilter] = useState('all');

    const getStatusHistoryTooltip = (student) => {
        const effectiveAdmission = student.admissionDate || student.createdAt;
        const lines = [];
        lines.push(`Current Admission Date: ${effectiveAdmission ? new Date(effectiveAdmission).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`);

        if (!student.statusHistory || student.statusHistory.length === 0) {
            lines.push(`\n[First Joined] ${effectiveAdmission ? new Date(effectiveAdmission).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`);
        } else {
            lines.push('\nHistory:');
            student.statusHistory.forEach((hist, idx) => {
                const isFirst = idx === 0;
                const typeStr = isFirst ? '[Joined]' : hist.status === 'active' ? '[Reactivated]' : '[Deactivated]';
                const dateStr = new Date(hist.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const admStr = hist.admissionDate ? ` | Admission: ${new Date(hist.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : '';
                lines.push(`${typeStr} on ${dateStr}${admStr}`);
            });
        }
        return lines.join('\n');
    };

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

    const fetchCreditHistory = async (student) => {
        setSelectedCreditStudent(student);
        setShowCreditModal(true);
        setCreditLoading(true);
        try {
            const res = await api.get(`/admin/students/${student._id}/mock-tests`);
            setCreditHistory(res.data.attempts || []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load credit history');
            setCreditHistory([]);
        } finally {
            setCreditLoading(false);
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
                await api.put(`/admin/students/${student._id}`, { isActive: true, inactivationStatus: 'none' });
                setSuccess('Student reactivated successfully');
                fetchStudents();
            } catch (err) {
                setError('Failed to reactivate student');
            }
        }
    };

    const handleSubAdminInactivate = async () => {
        if (!subAdminInactiveStudent) return;
        setSubAdminInactiveLoading(true);
        setError('');
        try {
            const res = await api.post(`/admin/students/${subAdminInactiveStudent._id}/inactivate-request`);
            if (res.data.success) {
                setSuccess(res.data.message || 'Scholar marked inactive (awaited). Request routed to Super Admin.');
                setShowSubAdminInactiveModal(false);
                setSubAdminInactiveStudent(null);
                fetchStudents();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit student inactivation request');
        } finally {
            setSubAdminInactiveLoading(false);
        }
    };

    const handleBulkFeeUpdate = async (e) => {
        if (e) e.preventDefault();
        if (!bulkFeeAmount || selectedStudentIds.length === 0) return;

        setError('');
        setSuccess('');
        setBulkFeeLoading(true);
        try {
            const response = await api.put('/admin/students/bulk-fee-update', {
                studentIds: selectedStudentIds,
                amount: parseInt(bulkFeeAmount, 10),
                operation: bulkFeeOperation,
                sendEmail: bulkFeeSendEmail,
                excludedFromFeeManagementIds: excludedFeeManagementIds
            });
            setSuccess(response.data.message || 'Fees updated successfully!');
            setBulkFeeResult(response.data);
            await fetchStudents();
            await fetchFloors();
            setTimeout(() => setSuccess(''), 6000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update fees in bulk');
        } finally {
            setBulkFeeLoading(false);
        }
    };

    const handleBulkResetPasswordsToMobile = async () => {
        setBulkResetLoading(true);
        setBulkResetResult(null);
        setError('');
        try {
            const res = await api.post('/admin/students/bulk-reset-passwords-to-mobile');
            setBulkResetResult(res.data);
            setSuccess(res.data.message);
            setTimeout(() => setSuccess(''), 6000);
        } catch (err) {
            setError(err.response?.data?.message || 'Bulk password reset failed.');
        } finally {
            setBulkResetLoading(false);
            setShowBulkResetModal(false);
        }
    };

    const handleSwapSeats = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSwapLoading(true);
        try {
            const response = await api.post('/admin/seats/swap', {
                studentId1: swapStudentId1,
                studentId2: swapStudentId2
            });
            setSuccess(response.data.message || 'Seats swapped successfully!');
            setShowSwapModal(false);
            setSwapStudentId1('');
            setSwapStudentId2('');
            await fetchStudents();
            await fetchFloors();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to swap seats');
        } finally {
            setSwapLoading(false);
        }
    };

    const handleResetAllQrs = async () => {
        if (!window.confirm('CRITICAL WARNING:\n\nThis will INVALIDATE all existing Student QR Codes/Digital IDs immediately.\n\nStudents will need to refresh their profile to get new codes.\n\nAre you sure you want to RESET ALL QR TOKENS?')) {
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
                // Send all fields including negotiatedPrice — backend handles price update
                await api.put(`/admin/students/${selectedStudent._id}`, {
                    name: formData.name,
                    fatherName: formData.fatherName,
                    email: formData.email,
                    mobile: formData.mobile,
                    dob: formData.dob ? new Date(formData.dob) : undefined,
                    aadharNo: formData.aadharNo,
                    lockerNo: formData.lockerNo,
                    registrationFee: Number(formData.registrationFee) || 0,
                    address: formData.address,
                    gender: formData.gender,
                    joinedAt: formData.joinedAt,
                    password: formData.password,
                    negotiatedPrice: formData.negotiatedPrice !== '' ? formData.negotiatedPrice : undefined,
                    shift: formData.shift || undefined,
                    sendMail: formData.sendMail,
                    showInFeeManagement: formData.showInFeeManagement === true
                });
                setSuccess('Student updated successfully');
            } else {
                const response = await api.post('/admin/students', formData);
                setSuccess(`Student created! Temporary password: ${response.data.student.tempPassword}`);
            }

            fetchStudents();
            fetchFloors(); // refresh seat data so updated price shows immediately in table
            setShowModal(false);
            setFormData({
                name: '',
                fatherName: '',
                email: '',
                mobile: '',
                dob: '',
                aadharNo: '',
                lockerNo: '',
                registrationFee: 0,
                address: '',
                gender: 'male',
                password: '',
                joinedAt: new Date().toISOString().split('T')[0]
            });
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
            fatherName: '',
            email: '',
            mobile: '',
            dob: '',
            aadharNo: '',
            lockerNo: '',
            registrationFee: 0,
            address: '',
            gender: 'male',
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
                a.status === 'active' && String(a.student) === String(student._id)
            );
            if (assignment && assignment.shift) {
                shiftId = typeof assignment.shift === 'object' ? assignment.shift._id : assignment.shift;
            }
            // The backend stores the fee as 'price' on the assignment, not 'negotiatedPrice'
            if (assignment && assignment.price !== undefined && assignment.price !== null) {
                negotiatedPrice = assignment.price;
            }
        }

        setFormData({
            name: student.name,
            fatherName: student.fatherName || student.guardianName || '',
            email: student.email,
            mobile: student.mobile || '',
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            aadharNo: student.aadharNo || '',
            lockerNo: student.lockerNo || '',
            registrationFee: student.registrationFee || 0,
            address: student.address || '',
            gender: student.gender || 'male',
            joinedAt: (student.admissionDate || student.createdAt) ? new Date(student.admissionDate || student.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            shift: shiftId,
            negotiatedPrice: negotiatedPrice,
            seatId: getStudentSeat(student._id) ? student.seat._id : '', // Needed for assignSeat
            sendMail: false,
            showInFeeManagement: student.showInFeeManagement !== false
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

    // ─── Scholar Activity & Status History Handler ───────────────────────────
    const openActivityHistoryModal = async (student) => {
        setActivityStudent(student);
        setActivityCategoryFilter('all');
        setShowActivityModal(true);
        setActivityLoading(true);
        try {
            const res = await api.get(`/admin/students/${student._id}/activity-history`);
            if (res.data?.success) {
                setActivityTimeline(res.data.timeline || []);
                if (res.data.student) {
                    setActivityStudent(prev => ({ ...prev, ...res.data.student }));
                }
            }
        } catch (err) {
            console.error('Failed to load activity history:', err);
        } finally {
            setActivityLoading(false);
        }
    };

    // ─── Temp Seat Handlers ──────────────────────────────────────────────────
    const openTempSeatModal = async (student) => {
        setTempSeatStudent(student);
        setTempForm({ seatId: '', shiftId: '', originalOwnerId: '', note: '', endDate: '' });
        setTempSeatLoading(true);
        setShowTempSeatModal(true);
        try {
            const res = await api.get(`/admin/temp-seats/student/${student._id}`);
            setTempSeatList(res.data.assignments || []);
        } catch { setTempSeatList([]); }
        finally { setTempSeatLoading(false); }
    };

    const handleCreateTempSeat = async (e) => {
        e.preventDefault();
        setError('');
        setTempSeatLoading(true);
        try {
            await api.post('/admin/temp-seats', {
                borrowerStudentId: tempSeatStudent._id,
                seatId: tempForm.seatId,
                shiftId: tempForm.shiftId,
                originalOwnerId: tempForm.originalOwnerId || undefined,
                note: tempForm.note,
                endDate: tempForm.endDate || undefined
            });
            setSuccess('Temporary seat assigned!');
            const res = await api.get(`/admin/temp-seats/student/${tempSeatStudent._id}`);
            setTempSeatList(res.data.assignments || []);
            setTempForm({ seatId: '', shiftId: '', originalOwnerId: '', note: '', endDate: '' });
            fetchStudents();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign temp seat');
        } finally { setTempSeatLoading(false); }
    };

    const handleRevokeTempSeat = async (id) => {
        if (!window.confirm('Revoke this temporary seat assignment?')) return;
        setTempSeatLoading(true);
        try {
            await api.delete(`/admin/temp-seats/${id}`);
            const res = await api.get(`/admin/temp-seats/student/${tempSeatStudent._id}`);
            setTempSeatList(res.data.assignments || []);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to revoke');
        } finally { setTempSeatLoading(false); }
    };

    // ─── Split Seat Handlers ─────────────────────────────────────────────────
    const openSplitSeatModal = (student) => {
        setSplitStudent(student);
        setSplitPairs([{ seatId: '', shiftId: '', price: '' }, { seatId: '', shiftId: '', price: '' }]);
        setShowSplitModal(true);
    };

    const handleSplitAssign = async (e) => {
        e.preventDefault();
        setError('');
        setSplitLoading(true);
        try {
            await api.post('/admin/seats/split-assign', {
                studentId: splitStudent._id,
                assignments: splitPairs.map(p => ({
                    seatId: p.seatId,
                    shiftId: p.shiftId,
                    price: p.price ? Number(p.price) : 0
                }))
            });
            setSuccess(`Split seat assigned to ${splitStudent.name}!`);
            setShowSplitModal(false);
            fetchStudents(); fetchFloors();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create split assignment');
        } finally { setSplitLoading(false); }
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
            // --- Step 1: Capture the front face ---
            const frontCanvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
            });
            const frontImg = frontCanvas.toDataURL('image/png');

            // --- Step 2: Temporarily flip the card to capture back face ---
            const flipContainer = element.querySelector('[style*="rotateY"]') ||
                element.querySelector('[class*="motion"]');

            // Inject a temporary "back face only" container beside the main one
            const backWrapper = document.createElement('div');
            backWrapper.style.cssText = `
                position: fixed; top: -9999px; left: -9999px;
                width: 380px; height: 240px; overflow: hidden;
                background: white; z-index: -1;
            `;
            document.body.appendChild(backWrapper);

            // Clone the element and force the back face visible
            const cloned = element.cloneNode(true);
            cloned.style.cssText = 'width:380px;height:240px;position:relative;';

            // Find the motion div (flip container) and force it to show the back
            const motionDivs = cloned.querySelectorAll('div');
            motionDivs.forEach(div => {
                const s = div.getAttribute('style') || '';
                // Force backfaceVisibility:hidden divs to be visible for capture
                if (s.includes('backfaceVisibility') || s.includes('backface-visibility')) {
                    div.style.backfaceVisibility = 'visible';
                    div.style.webkitBackfaceVisibility = 'visible';
                }
                // Force the inner flipper to be rotated 180deg (shows back)
                if (s.includes('transformStyle') || s.includes('transform-style')) {
                    div.style.transform = 'rotateY(180deg)';
                }
            });

            backWrapper.appendChild(cloned);
            const backCanvas = await html2canvas(backWrapper, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 380,
                height: 240,
            });
            const backImg = backCanvas.toDataURL('image/png');
            document.body.removeChild(backWrapper);

            // --- Step 3: Build landscape A4 PDF — front left, back right ---
            const pdf = new jsPDF('l', 'mm', 'a4');   // landscape: 297mm × 210mm
            const pdfW = pdf.internal.pageSize.getWidth();   // 297
            const pdfH = pdf.internal.pageSize.getHeight();  // 210

            // Card physical: 85.6mm × 54mm (CR80); scale up slightly for clarity
            const cardW = 120;
            const cardH = (frontCanvas.height / frontCanvas.width) * cardW;
            const gap    = 14;   // mm gap between cards
            const totalW = cardW * 2 + gap;

            const startX = (pdfW - totalW) / 2;
            const startY = (pdfH - cardH) / 2;

            // White card backgrounds with subtle shadow line
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(startX - 2, startY - 2, cardW + 4, cardH + 4, 3, 3, 'F');
            pdf.roundedRect(startX + cardW + gap - 2, startY - 2, cardW + 4, cardH + 4, 3, 3, 'F');

            // Label: FRONT / BACK
            pdf.setFontSize(6);
            pdf.setTextColor(150, 150, 150);
            pdf.text('FRONT', startX + cardW / 2, startY - 4, { align: 'center' });
            pdf.text('BACK',  startX + cardW + gap + cardW / 2, startY - 4, { align: 'center' });

            // Card images
            pdf.addImage(frontImg, 'PNG', startX, startY, cardW, cardH);
            pdf.addImage(backImg,  'PNG', startX + cardW + gap, startY, cardW, cardH);

            // Footer line
            pdf.setFontSize(5);
            pdf.setTextColor(180, 180, 180);
            pdf.text('Apna Lakshay Library Management System — Official ID Card', pdfW / 2, pdfH - 6, { align: 'center' });

            pdf.save(`ID_Card_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF Download failed', err);
        }
    };

    const getStudentFee = (student) => {
        const studentId = student._id;

        // 1. First check student.seat.assignments (directly populated, always current)
        if (student.seat && student.seat.assignments && student.seat.assignments.length > 0) {
            const activeAssignment = student.seat.assignments.find(a =>
                a.status === 'active' &&
                String(typeof a.student === 'object' ? a.student._id : a.student) === String(studentId)
            );
            if (activeAssignment) {
                const displayPrice = activeAssignment.price || activeAssignment.negotiatedPrice;
                if (displayPrice) return `Rs. ${displayPrice}`;
                // Fall back to base price
                const seat = student.seat;
                if (activeAssignment.type === 'full_day' || activeAssignment.legacyShift === 'full') {
                    return `Rs. ${seat.basePrices?.full || 1200} (Base)`;
                } else {
                    return `Rs. ${seat.basePrices?.day || 800} (Base)`;
                }
            }
        }

        // 2. Fall back to floors data (in case seat is not populated on student object)
        if (floors && floors.length > 0) {
            for (const floor of floors) {
                if (!floor.rooms) continue;
                for (const room of floor.rooms) {
                    if (!room.seats) continue;
                    for (const seat of room.seats) {
                        if (seat.assignments && seat.assignments.length > 0) {
                            const activeAssignment = seat.assignments.find(a =>
                                a.status === 'active' &&
                                String(typeof a.student === 'object' ? a.student._id : a.student) === String(studentId)
                            );
                            if (activeAssignment) {
                                const displayPrice = activeAssignment.price || activeAssignment.negotiatedPrice;
                                if (displayPrice) return `Rs. ${displayPrice}`;
                                if (activeAssignment.type === 'full_day' || activeAssignment.legacyShift === 'full') {
                                    return `Rs. ${seat.basePrices?.full || 1200} (Base)`;
                                } else {
                                    return `Rs. ${seat.basePrices?.day || 800} (Base)`;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Last resort: use currentFee from fee records (may be stale)
        if (student.currentFee != null) {
            return `Rs. ${student.currentFee}`;
        }

        return 'N/A';
    };

    const getStudentNumericFee = (student) => {
        if (!student) return 0;
        const feeStr = getStudentFee(student);
        if (!feeStr || feeStr === 'N/A') return 0;
        const match = feeStr.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    const generateStudentTablePDF = () => {
        const doc = new jsPDF('landscape');
        const dateStr = new Date().toLocaleDateString('en-GB');

        let tabTitle = 'All Students';
        switch (activeTab) {
            case 'active': tabTitle = 'Active Students'; break;
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
        if (floors && floors.length > 0) {
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

                                return String(assignedStudentId) === String(studentId);
                            });

                            if (hasActiveAssignment) {
                                return seat.number;
                            }
                        }

                        // Fallback to legacy assignedTo field
                        if (seat.assignedTo) {
                            const assignedId = typeof seat.assignedTo === 'object' ? seat.assignedTo._id : seat.assignedTo;
                            if (String(assignedId) === String(studentId)) {
                                return seat.number;
                            }
                        }
                    }
                }
            }
        }

        // Fallback for temporary seat assignments or directly populated seatNumber
        const st = students?.find(s => String(s._id) === String(studentId));
        if (st) {
            if (st.tempAssignments?.length > 0 && st.tempAssignments[0]?.seat?.number) {
                return st.tempAssignments[0].seat.number;
            }
            if (st.seatNumber) return st.seatNumber;
            if (st.seat?.number) return st.seat.number;
        }

        return null;
    };

    // Helper to get seat, room, floor & AC details for a student
    const getStudentSeatDetails = (studentId) => {
        if (floors && floors.length > 0) {
            for (const floor of floors) {
                if (!floor.rooms) continue;
                for (const room of floor.rooms) {
                    if (!room.seats) continue;
                    for (const seat of room.seats) {
                        if (seat.assignments && seat.assignments.length > 0) {
                            const hasActiveAssignment = seat.assignments.some(assignment => {
                                if (assignment.status !== 'active') return false;
                                const assignedStudentId = typeof assignment.student === 'object'
                                    ? assignment.student._id
                                    : assignment.student;
                                return String(assignedStudentId) === String(studentId);
                            });

                            if (hasActiveAssignment) {
                                return {
                                    seatNumber: seat.number,
                                    roomName: room.name,
                                    roomId: room.roomId || room._id,
                                    hasAc: !!room.hasAc,
                                    floorName: floor.name,
                                    floorId: floor._id,
                                    isTemporary: false
                                };
                            }
                        }

                        if (seat.assignedTo) {
                            const assignedId = typeof seat.assignedTo === 'object' ? seat.assignedTo._id : seat.assignedTo;
                            if (String(assignedId) === String(studentId)) {
                                return {
                                    seatNumber: seat.number,
                                    roomName: room.name,
                                    roomId: room.roomId || room._id,
                                    hasAc: !!room.hasAc,
                                    floorName: floor.name,
                                    floorId: floor._id,
                                    isTemporary: false
                                };
                            }
                        }
                    }
                }
            }
        }

        // Fallback for temporary seat assignments or students populated directly with seat
        const st = students?.find(s => String(s._id) === String(studentId));
        if (st) {
            const isTemp = !!(st.isTemporary || st.isTemporarySeat || (st.tempAssignments && st.tempAssignments.length > 0));
            const tempAssign = st.tempAssignments && st.tempAssignments.length > 0 ? st.tempAssignments[0] : null;
            const seatNum = tempAssign?.seat?.number || st.seatNumber || st.seat?.number;
            if (seatNum) {
                const room = tempAssign?.seat?.room || st.seat?.room || st.room;
                const floor = tempAssign?.seat?.floor || st.seat?.floor || st.floor;
                return {
                    seatNumber: seatNum,
                    roomName: typeof room === 'object' ? room?.name : (room || 'Main Room'),
                    roomId: typeof room === 'object' ? (room?.roomId || room?._id) : (st.roomId || '101'),
                    hasAc: typeof room === 'object' ? !!room?.hasAc : false,
                    floorName: typeof floor === 'object' ? floor?.name : (floor || 'Ground Floor'),
                    floorId: typeof floor === 'object' ? floor?._id : null,
                    isTemporary: isTemp
                };
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

                        if (String(assignedStudentId) === String(studentId)) {
                            // Check if assignment has the matching shift
                            const assignmentShiftId = typeof assignment.shift === 'object'
                                ? assignment.shift._id
                                : assignment.shift;

                            if (String(assignmentShiftId) === String(shiftId)) {
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

                        if (String(assignedStudentId) === String(studentId)) {
                            // Only show admin-created custom shift names
                            if (assignment.shift && typeof assignment.shift === 'object' && assignment.shift.name) {
                                assignedShifts.push(assignment.shift.name);
                            } else if (assignment.shift && typeof assignment.shift === 'string') {
                                // Unpopulated ObjectId string — look up from shifts list
                                const found = shifts.find(s => s.id === assignment.shift || String(s._id) === assignment.shift);
                                if (found) assignedShifts.push(found.name);
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

    // Real-Time DB Operational Metrics (100% MongoDB)
    const metrics = useMemo(() => {
        const total = students.length;
        const active = students.filter(s => s.isActive !== false).length;
        const inactive = students.filter(s => s.isActive === false).length;
        const seated = students.filter(s => s.isActive !== false && getStudentSeat(s._id)).length;
        const pending = students.filter(s => s.isActive !== false && !getStudentSeat(s._id)).length;
        const acCount = students.filter(s => {
            if (s.isActive === false) return false;
            const details = getStudentSeatDetails(s._id);
            return details?.hasAc;
        }).length;
        const adminReg = students.filter(s => s.isActive !== false && (s.registrationSource === 'admin' || !s.registrationSource)).length;
        const selfReg = students.filter(s => s.isActive !== false && s.registrationSource === 'self').length;

        return {
            total,
            active,
            inactive,
            seated,
            pending,
            acCount,
            adminReg,
            selfReg
        };
    }, [students, floors]);

    // Filter students based on active tab
    const getFilteredStudents = () => {
        switch (activeTab) {
            case 'inactive':
                return students.filter(student => student.isActive === false);
            case 'active':
                return students.filter(student => student.isActive !== false);
            case 'admin':
                return students.filter(student => student.isActive !== false && (student.registrationSource === 'admin' || !student.registrationSource));
            case 'self':
                return students.filter(student => student.isActive !== false && student.registrationSource === 'self');
            case 'pending':
                return students.filter(student => student.isActive !== false && !getStudentSeat(student._id));
            case 'all':
            default:
                return students.filter(student => student.isActive !== false);
        }
    };

    const filteredStudents = useMemo(() => {
        let list = getFilteredStudents();

        // 1. Text Search across Name, Email, Mobile, Seat No, and Roll No
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(student => {
                const name = (student.name || '').toLowerCase();
                const email = (student.email || '').toLowerCase();
                const mobile = (student.mobile || '').toLowerCase();
                const seat = (getStudentSeat(student._id) || '').toLowerCase();
                const roll = (student.admissionNumber || student.rollNo || student._id || '').toLowerCase();
                return name.includes(q) || email.includes(q) || mobile.includes(q) || seat.includes(q) || roll.includes(q);
            });
        }

        // 2. Room AC Filter
        if (acFilter !== 'all') {
            list = list.filter(student => {
                const details = getStudentSeatDetails(student._id);
                const hasAc = details ? details.hasAc : !!student.seat?.room?.hasAc;
                if (acFilter === 'ac' && !hasAc) return false;
                if (acFilter === 'non-ac' && hasAc) return false;
                return true;
            });
        }

        // 3. Floor Filter
        if (floorFilter !== 'all') {
            list = list.filter(student => {
                const details = getStudentSeatDetails(student._id);
                if (!details) return false;
                return String(details.floorId) === String(floorFilter) || details.floorName === floorFilter;
            });
        }

        // 4. Shift Filter (if passed from URL or query)
        if (shiftFilter) {
            list = list.filter(s => hasShiftAssignment(s._id, shiftFilter));
        }

        // 5. Multi-field Sorting
        return [...list].sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.admissionDate || b.createdAt || 0) - new Date(a.admissionDate || a.createdAt || 0);
            }
            if (sortBy === 'oldest') {
                return new Date(a.admissionDate || a.createdAt || 0) - new Date(b.admissionDate || b.createdAt || 0);
            }
            if (sortBy === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortBy === 'name_desc') {
                return (b.name || '').localeCompare(a.name || '');
            }
            if (sortBy === 'seat') {
                const seatA = getStudentSeat(a._id) || 'ZZZ';
                const seatB = getStudentSeat(b._id) || 'ZZZ';
                return seatA.localeCompare(seatB, undefined, { numeric: true });
            }
            return 0;
        });
    }, [students, activeTab, searchQuery, acFilter, floorFilter, shiftFilter, sortBy, floors]);

    return (
        <>
            <div className="relative min-h-screen" style={PAGE_BG}>
                {/* Unified Warm 28px Dot Grid */}
                <div
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                        backgroundSize: '28px 28px'
                    }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6">

                    {/* ══════════════════════════════════════════════════════
                        TOP EXECUTIVE HEADER & ACTIONS
                    ══════════════════════════════════════════════════════ */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <Link to={backPath}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                    title="Go back"
                                >
                                    <IoArrowBack size={15} />
                                    <span>Back</span>
                                </motion.button>
                            </Link>
                            <div>
                                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold mb-1">
                                    <IoSparkles size={12} className="text-orange-500" />
                                    <span>Main Campus (Sitamarhi) · Enterprise Roster</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                                    Student Management
                                </h1>
                                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                                    Live student lifecycle, desk allocations, shift schedules, and presence tracking
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        {activeTab !== 'id-cards' && !isSubAdmin && (
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Settings & Operations Dropdown */}
                                <div className="relative">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowSettingsMenu(prev => !prev)}
                                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                        title="Operations Menu"
                                    >
                                        <IoFilterOutline size={15} className="text-stone-500" />
                                        <span>Tools & Operations</span>
                                        <IoChevronDown size={13} className={`text-stone-400 transition-transform duration-200 ${showSettingsMenu ? 'rotate-180' : ''}`} />
                                    </motion.button>

                                    <AnimatePresence>
                                        {showSettingsMenu && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setShowSettingsMenu(false)} />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 top-full mt-2 w-64 z-40 rounded-2xl overflow-hidden shadow-xl bg-white border border-[#EDE8E0] p-1.5"
                                                >
                                                    <div className="px-3 py-2 border-b border-[#EDE8E0]">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Roster Operations</span>
                                                    </div>
                                                    {[
                                                        {
                                                            label: 'Export Student Roster (PDF)',
                                                            icon: <IoDownloadOutline size={16} />,
                                                            color: 'text-orange-600',
                                                            action: () => { generateStudentTablePDF(); setShowSettingsMenu(false); }
                                                        },
                                                        {
                                                            label: 'Swap Desk Seats',
                                                            icon: <IoSwapHorizontal size={16} />,
                                                            color: 'text-amber-600',
                                                            action: () => { setShowSwapModal(true); setSwapStudentId1(''); setSwapStudentId2(''); setError(''); setShowSettingsMenu(false); }
                                                        },
                                                        {
                                                            label: 'Reset All Passwords to Mobile',
                                                            icon: <IoKey size={16} />,
                                                            color: 'text-orange-600',
                                                            action: () => { setBulkResetResult(null); setShowBulkResetModal(true); setShowSettingsMenu(false); }
                                                        },
                                                        {
                                                            label: 'Reset All Digital QR Tokens',
                                                            icon: <IoRefresh size={16} />,
                                                            color: 'text-rose-600',
                                                            action: () => { handleResetAllQrs(); setShowSettingsMenu(false); }
                                                        },
                                                    ].map((item, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={item.action}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-[#0F172A] hover:bg-[#FAF6F0] rounded-xl transition-colors text-left cursor-pointer"
                                                        >
                                                            <span className={item.color}>{item.icon}</span>
                                                            <span>{item.label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Primary Add Student CTA */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={openAddModal}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                                >
                                    <IoAdd size={17} />
                                    <span>Add Student</span>
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        EXECUTIVE KPI METRIC CARDS (6 CARDS - 100% REAL DB DATA)
                    ══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Total Enrolled */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-orange-300 hover:shadow-[0_4px_16px_rgba(180,120,60,0.1)] transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Roster</span>
                                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/70 text-orange-600 flex items-center justify-center shadow-2xs">
                                    <IoPeopleOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-[#0F172A] tabular-nums">{metrics.total}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Enrolled students</p>
                        </div>

                        {/* Active Scholars */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-emerald-300 hover:shadow-[0_4px_16px_rgba(16,185,129,0.1)] transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Active Members</span>
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center shadow-2xs">
                                    <IoCheckmarkCircle size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-emerald-600 tabular-nums">{metrics.active}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">
                                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% active roster
                            </p>
                        </div>

                        {/* Assigned & Seated */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-amber-300 hover:shadow-[0_4px_16px_rgba(245,158,11,0.1)] transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Seated Desks</span>
                                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shadow-2xs">
                                    <IoBedOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-[#0F172A] tabular-nums">{metrics.seated}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Seats allocated</p>
                        </div>

                        {/* Pending Desk Allocation */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-rose-300 hover:shadow-[0_4px_16px_rgba(244,63,94,0.1)] transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-red-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Pending Desk</span>
                                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center shadow-2xs">
                                    <IoWarningOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-rose-600 tabular-nums">{metrics.pending}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Awaiting assignment</p>
                        </div>

                        {/* AC Climate Study Halls */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-sky-300 hover:shadow-[0_4px_16px_rgba(14,165,233,0.1)] transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-sky-500 to-blue-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">AC Study Halls</span>
                                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/70 text-sky-600 flex items-center justify-center shadow-2xs">
                                    <IoSparkles size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-[#0F172A] tabular-nums">{metrics.acCount}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Climate controlled</p>
                        </div>

                        {/* Inactive / Left */}
                        <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-[0_2px_10px_rgba(180,120,60,0.05)] hover:border-stone-400 transition-all overflow-hidden">
                            <div className="h-[3px] absolute top-0 left-0 right-0 bg-gradient-to-r from-stone-400 to-stone-500" />
                            <div className="flex items-center justify-between mb-2 pt-0.5">
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Inactive / Left</span>
                                <div className="w-8 h-8 rounded-xl bg-stone-100 border border-[#EDE8E0] text-stone-500 flex items-center justify-center shadow-2xs">
                                    <IoTimeOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-stone-600 tabular-nums">{metrics.inactive}</p>
                            <p className="text-[11px] font-medium text-stone-400 mt-0.5">Archived or paused</p>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        UNIFIED ENTERPRISE SEARCH, TABS & MULTI-FILTER BAR
                    ══════════════════════════════════════════════════════ */}
                    <div className="relative bg-white border border-[#EDE8E0] rounded-2xl p-4 shadow-xs space-y-4 overflow-hidden">
                        <div className="h-[2px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 absolute top-0 left-0 right-0" />

                        {/* Row 1: Search Input & Multi-select Dropdowns */}
                        <div className="flex flex-col lg:flex-row items-center gap-3 pt-0.5">
                            {/* Instant Search Bar */}
                            <div className="relative flex-1 w-full">
                                <IoSearchOutline size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by student name, mobile, email, roll no, or seat number..."
                                    className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EDE8E0] focus:border-orange-500 rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#0F172A] placeholder-stone-400 outline-none transition-all shadow-2xs"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full cursor-pointer"
                                        title="Clear search"
                                    >
                                        <IoClose size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdowns Group */}
                            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                                {/* Room AC Filter */}
                                <select
                                    value={acFilter}
                                    onChange={(e) => setAcFilter(e.target.value)}
                                    className="flex-1 sm:flex-initial px-3 py-2.5 bg-[#FAF6F0] hover:bg-white border border-[#EDE8E0] focus:border-orange-500 rounded-xl text-xs font-bold text-stone-700 outline-none transition-colors shadow-2xs"
                                >
                                    <option value="all">All Room Types</option>
                                    <option value="ac">AC Rooms Only</option>
                                    <option value="non-ac">Non-AC Rooms Only</option>
                                </select>

                                {/* Floor Filter */}
                                <select
                                    value={floorFilter}
                                    onChange={(e) => setFloorFilter(e.target.value)}
                                    className="flex-1 sm:flex-initial px-3 py-2.5 bg-[#FAF6F0] hover:bg-white border border-[#EDE8E0] focus:border-orange-500 rounded-xl text-xs font-bold text-stone-700 outline-none transition-colors shadow-2xs"
                                >
                                    <option value="all">All Floors</option>
                                    {floors.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>

                                {/* Sort Order */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 sm:flex-initial px-3 py-2.5 bg-[#FAF6F0] hover:bg-white border border-[#EDE8E0] focus:border-orange-500 rounded-xl text-xs font-bold text-stone-700 outline-none transition-colors shadow-2xs"
                                >
                                    <option value="newest">Sort: Newest Joined</option>
                                    <option value="oldest">Sort: Oldest Joined</option>
                                    <option value="name_asc">Sort: Name (A-Z)</option>
                                    <option value="name_desc">Sort: Name (Z-A)</option>
                                    <option value="seat">Sort: Seat Number</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Status Tab Pills */}
                        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-2 border-t border-[#EDE8E0] custom-scrollbar">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                                {[
                                    { id: 'all', label: 'All Scholars', count: metrics.active },
                                    { id: 'active', label: 'Active', count: metrics.active },
                                    { id: 'pending', label: 'Pending Desk', count: metrics.pending },
                                    { id: 'admin', label: 'Admin Reg.', count: metrics.adminReg },
                                    { id: 'self', label: 'Self Reg.', count: metrics.selfReg },
                                    { id: 'inactive', label: 'Inactive', count: metrics.inactive },
                                    { id: 'id-cards', label: 'ID Cards Grid', icon: <IoIdCard size={13} />, count: metrics.active },
                                    { id: 'history', label: 'Deleted Archives', icon: <IoTrashOutline size={13} />, count: archivedStudents.length }
                                ].filter(tab => isSubAdmin ? tab.id === 'id-cards' : true).map(tab => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                                    : 'bg-[#FAF6F0] hover:bg-orange-50/70 text-stone-600 hover:text-stone-900 border border-[#EDE8E0]'
                                            }`}
                                        >
                                            {tab.icon}
                                            <span>{tab.label}</span>
                                            {tab.count !== undefined && (
                                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                    isActive ? 'bg-white/25 text-white' : 'bg-white text-stone-600 border border-[#EDE8E0]'
                                                }`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Actions: View Mode Switcher & History Purge */}
                            <div className="flex items-center gap-2 shrink-0">
                                {activeTab !== 'id-cards' && activeTab !== 'history' && (
                                    <div className="flex items-center bg-[#FAF6F0] p-0.5 rounded-xl border border-[#EDE8E0]">
                                        <button
                                            onClick={() => setViewMode('cards')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                viewMode === 'cards'
                                                    ? 'bg-white text-orange-600 shadow-2xs'
                                                    : 'text-stone-500 hover:text-stone-800'
                                            }`}
                                            title="Enterprise One-Card-Per-Student Grid"
                                        >
                                            <IoGridOutline size={13} />
                                            <span>Cards</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('table')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                viewMode === 'table'
                                                    ? 'bg-white text-orange-600 shadow-2xs'
                                                    : 'text-stone-500 hover:text-stone-800'
                                            }`}
                                            title="Compact Table View"
                                        >
                                            <IoListOutline size={13} />
                                            <span>Table</span>
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <button
                                        onClick={handleClearArchives}
                                        disabled={archivedStudents.length === 0}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shrink-0 cursor-pointer"
                                    >
                                        <IoTrashOutline size={14} />
                                        <span>Clear All Archives</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════
                        DYNAMIC BULK ACTIONS TOOLBAR
                    ══════════════════════════════════════════════════════ */}
                    {selectedStudentIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between bg-orange-50 border border-orange-200 px-5 py-3 rounded-2xl shadow-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                                    {selectedStudentIds.length}
                                </div>
                                <span className="text-xs font-bold text-orange-950">
                                    {selectedStudentIds.length} scholar{selectedStudentIds.length > 1 ? 's' : ''} selected
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedStudentIds([])}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setBulkFeeResult(null);
                                        setBulkFeeSendEmail(false);
                                        setBulkFeeAmount('');
                                        setBulkFeeOperation('increase');
                                        setExcludedFeeManagementIds([]);
                                        setShowBulkFeeModal(true);
                                    }}
                                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                                >
                                    <IoCashOutline size={14} />
                                    <span>Adjust Fees in Bulk</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Alert Notifications */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2"
                        >
                            <IoCheckmarkDoneOutline size={16} className="text-emerald-600 shrink-0" />
                            <span>{success}</span>
                        </motion.div>
                    )}
                    {error && !showDeleteModal && !showResetPasswordModal && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2"
                        >
                            <IoAlertCircleOutline size={16} className="text-rose-600 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════
                        TAB CONTENT: TABLE / ID CARDS / DELETED ARCHIVE
                    ══════════════════════════════════════════════════════ */}
                    {loading ? (
                        <PrimaryLogoLoader text="Querying Real Database Student Roster..." />
                    ) : (
                        <>
                            {activeTab === 'id-cards' ? (
                                /* ID Cards Tab */
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center gap-4 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                                        <div className="flex-1 min-w-[250px] relative">
                                            <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                            <input
                                                type="text"
                                                placeholder="Search ID cards by seat number (e.g. A 22)..."
                                                value={idCardSearchSeat}
                                                onChange={(e) => setIdCardSearchSeat(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(390px,1fr))] gap-6">
                                        {shiftFilter && (
                                            <div className="col-span-full bg-orange-50 border border-orange-200 rounded-2xl p-4 flex justify-between items-center">
                                                <p className="text-orange-950 text-xs font-semibold">
                                                    Showing ID cards for shift:{' '}
                                                    <span className="font-bold text-orange-600">
                                                        {shifts.find(s => s._id === shiftFilter)?.name || 'Selected Shift'}
                                                    </span>
                                                </p>
                                                <button
                                                    onClick={() => window.location.href = '/admin/students?tab=id-cards'}
                                                    className={BTN_SECONDARY}
                                                >
                                                    View All Shifts
                                                </button>
                                            </div>
                                        )}

                                        {(() => {
                                            const filtered = students.filter(s => {
                                                if (!s.isActive) return false;
                                                if (shiftFilter && !hasShiftAssignment(s._id, shiftFilter)) return false;

                                                if (acFilter !== 'all') {
                                                    const details = getStudentSeatDetails(s._id);
                                                    const hasAc = details ? details.hasAc : !!s.seat?.room?.hasAc;
                                                    if (acFilter === 'ac' && !hasAc) return false;
                                                    if (acFilter === 'non-ac' && hasAc) return false;
                                                }

                                                if (idCardSearchSeat) {
                                                    const searchStr = idCardSearchSeat.toLowerCase();
                                                    const seatNum = getStudentSeat(s._id)?.toLowerCase() || '';
                                                    let match = seatNum.includes(searchStr);

                                                    if (!match && s.tempAssignments && s.tempAssignments.length > 0) {
                                                        match = s.tempAssignments.some(ta => {
                                                            const tempSeatNum = (ta.seat?.number || ta.seatNumber || '') + '';
                                                            return tempSeatNum.toLowerCase().includes(searchStr);
                                                        });
                                                    }

                                                    if (!match) return false;
                                                }

                                                return true;
                                            });

                                            return filtered.length === 0 ? (
                                                <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-slate-200">
                                                    <IoIdCard size={36} className="mx-auto text-slate-300 mb-2" />
                                                    <p className="text-slate-500 text-xs font-medium">
                                                        {shiftFilter ? 'No students found for this shift.' : idCardSearchSeat ? 'No students match this seat number.' : 'No active student ID cards found.'}
                                                    </p>
                                                </div>
                                            ) : filtered.map(student => (
                                                <div key={student._id} className="flex justify-center p-2">
                                                    <StudentIdCard
                                                        student={{
                                                            ...student,
                                                            seatNumber: getStudentSeat(student._id),
                                                            roomId: student.roomId || getStudentSeatDetails(student._id)?.roomId,
                                                            isTemporary: !!(student.isTemporary || student.isTemporarySeat || student.tempAssignments?.length > 0 || getStudentSeatDetails(student._id)?.isTemporary),
                                                            isTemporarySeat: !!(student.isTemporary || student.isTemporarySeat || student.tempAssignments?.length > 0 || getStudentSeatDetails(student._id)?.isTemporary)
                                                        }}
                                                    />
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            ) : activeTab === 'history' ? (
                                /* Deleted & Archives Tab */
                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                                    {['Scholar Name', 'Email Address', 'Date Enrolled', 'Deletion Timestamp', 'Actions'].map((h, i) => (
                                                        <th
                                                            key={h}
                                                            className={`px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${i === 4 ? 'text-right' : 'text-left'}`}
                                                        >
                                                            {h}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {archivedStudents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                                                            <IoTrashOutline size={32} className="mx-auto text-slate-300 mb-2" />
                                                            <span>No deleted student records in database archives.</span>
                                                        </td>
                                                    </tr>
                                                ) : archivedStudents.map(student => (
                                                    <tr key={student._id} className="hover:bg-orange-50/20 transition-colors">
                                                        <td className="px-5 py-3.5 font-semibold text-xs text-slate-900">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-600 shrink-0 uppercase overflow-hidden">
                                                                    <img 
                                                                        src={(() => {
                                                                            const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
                                                                                ? getDeterministicAvatar(student._id, student.gender)
                                                                                : student.profileImage;
                                                                            return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                                                        })()} 
                                                                        alt={student.name} 
                                                                        className="w-full h-full object-cover" 
                                                                    />
                                                                </div>
                                                                <span className="truncate">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-xs text-slate-600">{student.email}</td>
                                                        <td className="px-5 py-3.5 text-xs text-slate-500">{new Date(student.joinedAt).toLocaleDateString()}</td>
                                                        <td className="px-5 py-3.5 text-xs text-rose-500 font-medium">{new Date(student.deletedAt).toLocaleDateString()}</td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <button
                                                                onClick={() => handleViewArchive(student._id)}
                                                                className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 rounded-xl text-xs font-semibold mr-2 transition-all"
                                                            >
                                                                View Report
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteArchive(student._id)}
                                                                className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                                                                title="Delete Permanently"
                                                            >
                                                                <IoTrashOutline size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : viewMode === 'cards' ? (
                                /* ══════════════════════════════════════════════════════
                                    ONE CARD PER STUDENT (ENTERPRISE EXECUTIVE GRID)
                                ══════════════════════════════════════════════════════ */
                                <div className="space-y-4">
                                    {/* Scholar Selection Bar & Count */}
                                    <div className="flex items-center justify-between px-1 text-xs text-slate-600 flex-wrap gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[#0F172A] bg-white border border-[#EDE8E0] px-3 py-1.5 rounded-xl shadow-2xs hover:border-orange-300 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                                onChange={(e) => setSelectedStudentIds(e.target.checked ? filteredStudents.map(s => s._id) : [])}
                                                className="rounded border-[#EDE8E0] text-orange-500 focus:ring-orange-500 cursor-pointer"
                                            />
                                            <span>Select All ({filteredStudents.length})</span>
                                        </label>

                                        <div className="text-stone-500 font-semibold text-xs flex items-center gap-2">
                                            <span>Showing <strong className="text-[#0F172A] font-black">{filteredStudents.length}</strong> of <strong className="text-[#0F172A] font-black">{students.length}</strong> scholars</span>
                                        </div>
                                    </div>

                                    {/* Cards Grid */}
                                    {filteredStudents.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl border border-[#EDE8E0] shadow-2xs">
                                            <IoPeopleOutline size={42} className="mx-auto text-stone-300 mb-2" />
                                            <p className="font-bold text-[#0F172A] text-sm">No scholars match current criteria</p>
                                            <p className="text-stone-400 text-xs mt-1">Try clearing or adjusting search and filters.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                            {filteredStudents.map((student, idx) => {
                                                const seatDetails = getStudentSeatDetails(student._id);
                                                const shiftsDisplay = getStudentShifts(student._id);
                                                const isSelected = selectedStudentIds.includes(student._id);
                                                const avatarSrc = (() => {
                                                    const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
                                                        ? getDeterministicAvatar(student._id, student.gender)
                                                        : student.profileImage;
                                                    return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                                })();

                                                return (
                                                    <div
                                                        key={student._id}
                                                        className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20'
                                                                : 'border-[#EDE8E0] hover:border-orange-300 shadow-[0_2px_12px_rgba(180,120,60,0.06)] hover:shadow-[0_8px_24px_rgba(180,120,60,0.12)] hover:-translate-y-0.5'
                                                        }`}
                                                    >
                                                        {/* Watermark Ghost Icon */}
                                                        <IoPersonOutline size={76} className="absolute -bottom-3 -right-3 opacity-[0.035] text-orange-600 pointer-events-none" />

                                                        {/* Status Accent Stripe */}
                                                        <div className={`h-[3px] w-full ${
                                                            !student.isActive
                                                                ? 'bg-stone-300'
                                                                : !seatDetails
                                                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                                                    : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600'
                                                        }`} />

                                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4 relative z-10">
                                                            {/* Header: Checkbox, Avatar, Name & Reg Source, Status */}
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) setSelectedStudentIds(prev => [...prev, student._id]);
                                                                            else setSelectedStudentIds(prev => prev.filter(id => id !== student._id));
                                                                        }}
                                                                        className="mt-1 rounded border-[#EDE8E0] text-orange-500 focus:ring-orange-500 cursor-pointer shrink-0"
                                                                    />

                                                                    <div className="relative w-12 h-12 rounded-2xl bg-[#FAF6F0] border border-[#EDE8E0] overflow-hidden shrink-0 shadow-2xs">
                                                                        <img
                                                                            src={avatarSrc}
                                                                            alt={student.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <span
                                                                            className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                                                                student.isOnline ? 'bg-emerald-500' : 'bg-stone-300'
                                                                            }`}
                                                                            title={student.isOnline ? 'Online now' : 'Offline'}
                                                                        />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <h3 className="font-black text-sm text-[#0F172A] truncate tracking-tight" title={student.name}>
                                                                                {student.name}
                                                                            </h3>
                                                                            {student.registrationSource === 'self' ? (
                                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                                                                                    Self
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FAF6F0] text-stone-600 border border-[#EDE8E0] uppercase tracking-wider">
                                                                                    Admin
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <p className="text-[11px] text-stone-500 truncate mt-0.5" title={student.email}>
                                                                            {student.email || 'No email registered'}
                                                                        </p>

                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            {student.mobile ? (
                                                                                <>
                                                                                    <a
                                                                                        href={`https://wa.me/91${student.mobile.replace(/\D/g, '')}`}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-colors"
                                                                                        title="Chat on WhatsApp"
                                                                                    >
                                                                                        <IoLogoWhatsapp size={12} />
                                                                                        <span>{student.mobile}</span>
                                                                                    </a>
                                                                                    <a
                                                                                        href={`tel:${student.mobile}`}
                                                                                        className="p-1 text-stone-500 hover:text-stone-800 bg-[#FAF6F0] hover:bg-stone-100 rounded-lg border border-[#EDE8E0] transition-colors"
                                                                                        title="Call mobile"
                                                                                    >
                                                                                        <IoCallOutline size={12} />
                                                                                    </a>
                                                                                </>
                                                                            ) : (
                                                                                <span className="text-[10px] text-stone-400 italic">No mobile</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Status & Sequence */}
                                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                                    {student.isActive ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                            <span>Active</span>
                                                                        </span>
                                                                    ) : student.inactivationStatus === 'awaited' ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-[11px] font-bold" title="Inactivation request pending Super Admin approval">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                            <span>Awaited</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-[#EDE8E0] text-stone-600 text-[11px] font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                                                                            <span>Inactive</span>
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-stone-400 font-bold">
                                                                        #{idx + 1}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Body: 2x2 Segmented Grid */}
                                                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                                                {/* Box 1: Desk Space */}
                                                                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-2.5 flex flex-col justify-between hover:border-orange-200/80 transition-colors">
                                                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                                        <span className="flex items-center gap-1">
                                                                            <IoBedOutline size={12} className="text-orange-500" />
                                                                            <span>Desk Space</span>
                                                                        </span>
                                                                        {seatDetails?.hasAc && (
                                                                            <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-700 font-black text-[9px] border border-sky-200">
                                                                                AC
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="mt-1.5">
                                                                        {seatDetails ? (
                                                                            <>
                                                                                <p className="font-black text-sm text-[#0F172A] flex items-center gap-1.5">
                                                                                    <span>Desk {seatDetails.seatNumber}</span>
                                                                                    {(seatDetails.isTemporary || student.isTemporarySeat || student.isTemporary || student.tempAssignments?.length > 0) && (
                                                                                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                                                                                            Temporary
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                                                                    {seatDetails.roomName} · {seatDetails.floorName}
                                                                                </p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="font-bold text-xs text-amber-700 flex items-center gap-1">
                                                                                    <IoWarningOutline size={12} />
                                                                                    <span>Unallocated</span>
                                                                                </p>
                                                                                <p className="text-[10px] text-amber-600/80 mt-0.5">
                                                                                    Pending desk
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Box 2: Shift */}
                                                                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-2.5 flex flex-col justify-between hover:border-orange-200/80 transition-colors">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                                                                        <IoTimeOutline size={12} className="text-orange-500" />
                                                                        <span>Shift</span>
                                                                    </div>
                                                                    <div className="mt-1.5">
                                                                        <p className="font-black text-xs text-[#0F172A] truncate" title={shiftsDisplay}>
                                                                            {shiftsDisplay || (student.isActive ? 'Awaiting Shift' : 'None')}
                                                                        </p>
                                                                        <p className="text-[10px] text-stone-500 mt-0.5">
                                                                            {student.isActive ? 'Active schedule' : 'Inactive'}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Box 3: Fee Rate */}
                                                                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-2.5 flex flex-col justify-between hover:border-orange-200/80 transition-colors">
                                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                                        <span>Fee Rate</span>
                                                                    </div>
                                                                    <div className="mt-1.5">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <p className="font-black text-sm text-emerald-600">
                                                                                {getStudentFee(student)}
                                                                            </p>
                                                                            {student.showInFeeManagement === false && (
                                                                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded" title="Hidden from Fee Management ledger">
                                                                                    Fees Hidden
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); openActivityHistoryModal(student); }}
                                                                            className="text-[10px] text-stone-500 hover:text-orange-600 truncate mt-0.5 flex items-center gap-1 group/hist transition-colors"
                                                                            title="Click to view full Activity & Status History"
                                                                        >
                                                                            <IoTimeOutline size={11} className="text-stone-400 group-hover/hist:text-orange-500 shrink-0" />
                                                                            <span>Joined {new Date(student.admissionDate || student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Box 4: Mock Test AI & Session */}
                                                                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-2.5 flex flex-col justify-between hover:border-orange-200/80 transition-colors">
                                                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                                                        <span className="flex items-center gap-1">
                                                                            <IoSparkles size={11} className="text-orange-500" />
                                                                            <span>Mock Test</span>
                                                                        </span>
                                                                        <button
                                                                            onClick={() => fetchCreditHistory(student)}
                                                                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700 underline"
                                                                        >
                                                                            Logs
                                                                        </button>
                                                                    </div>
                                                                    <div className="mt-1.5">
                                                                        <p className="font-black text-xs text-[#0F172A] flex items-center gap-1">
                                                                            <span>{Math.min(student.mockTestCredits ?? 2, 2)}</span>
                                                                            <span className="text-stone-400 font-normal text-[10px]">/ 2 Credits</span>
                                                                        </p>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedSessionStudent(student);
                                                                                setShowSessionModal(true);
                                                                            }}
                                                                            className="text-[10px] font-bold mt-0.5 flex items-center gap-1 text-stone-600 hover:text-stone-900"
                                                                        >
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${student.isLoggedIn ? 'bg-orange-500' : 'bg-stone-300'}`} />
                                                                            <span>{student.isLoggedIn ? 'Logged In' : 'Logged Out'}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Footer Actions */}
                                                            <div className="pt-2.5 border-t border-[#EDE8E0] flex items-center justify-between gap-1.5">
                                                                {isSubAdmin ? (
                                                                    student.isActive ? (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSubAdminInactiveStudent(student);
                                                                                setShowSubAdminInactiveModal(true);
                                                                            }}
                                                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                                                            title="Mark Student Inactive"
                                                                        >
                                                                            <IoTrashOutline size={14} />
                                                                            <span>Mark Inactive</span>
                                                                        </button>
                                                                    ) : student.inactivationStatus === 'awaited' ? (
                                                                        <div className="w-full text-center py-2 px-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1.5">
                                                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                                            <span>Inactivation Awaited</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full text-center py-2 px-3 bg-stone-100 border border-stone-200 rounded-xl text-[11px] font-bold text-stone-500 flex items-center justify-center gap-1.5">
                                                                            <span>Inactive Scholar</span>
                                                                        </div>
                                                                    )
                                                                ) : student.isActive ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openSeatAssignModal(student)}
                                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                                                                            title="Assign or change desk"
                                                                        >
                                                                            <IoBedOutline size={14} />
                                                                            <span>{seatDetails ? 'Change Desk' : 'Assign Desk'}</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openIdCardModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-orange-600 bg-[#FAF6F0] hover:bg-orange-50 border border-[#EDE8E0] hover:border-orange-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Digital ID Card & QR"
                                                                        >
                                                                            <IoIdCard size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openSplitSeatModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-orange-600 bg-[#FAF6F0] hover:bg-orange-50 border border-[#EDE8E0] hover:border-orange-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Split Shift Assignment"
                                                                        >
                                                                            <IoGitBranch size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openTempSeatModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-amber-600 bg-[#FAF6F0] hover:bg-amber-50 border border-[#EDE8E0] hover:border-amber-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Temporary Seat Allocation"
                                                                        >
                                                                            <IoWarningOutline size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openActivityHistoryModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-indigo-600 bg-[#FAF6F0] hover:bg-indigo-50 border border-[#EDE8E0] hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Scholar Activity & Status History"
                                                                        >
                                                                            <IoTimeOutline size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openResetPasswordModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-amber-600 bg-[#FAF6F0] hover:bg-amber-50 border border-[#EDE8E0] hover:border-amber-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Reset Password"
                                                                        >
                                                                            <IoKey size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openEditModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-[#0F172A] bg-[#FAF6F0] hover:bg-stone-100 border border-[#EDE8E0] hover:border-stone-300 rounded-xl transition-all cursor-pointer"
                                                                            title="Edit Profile"
                                                                        >
                                                                            <IoPencil size={15} />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => openDeleteModal(student)}
                                                                            className="p-2 text-stone-400 hover:text-rose-600 bg-[#FAF6F0] hover:bg-rose-50 border border-[#EDE8E0] hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Inactivate / Remove"
                                                                        >
                                                                            <IoTrashOutline size={15} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleReactivate(student)}
                                                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                                                        >
                                                                            <IoRefresh size={14} />
                                                                            <span>Reactivate Scholar</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openDeleteModal(student)}
                                                                            className="flex items-center justify-center gap-1 px-3 py-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                                                            title="Delete Scholar Permanently"
                                                                        >
                                                                            <IoTrashOutline size={14} />
                                                                            <span>Delete</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openActivityHistoryModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-indigo-600 bg-[#FAF6F0] hover:bg-indigo-50 border border-[#EDE8E0] hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
                                                                            title="Scholar Activity & Status History"
                                                                        >
                                                                            <IoTimeOutline size={15} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openEditModal(student)}
                                                                            className="p-2 text-stone-600 hover:text-[#0F172A] bg-[#FAF6F0] hover:bg-stone-100 border border-[#EDE8E0] hover:border-stone-300 rounded-xl transition-all cursor-pointer"
                                                                            title="Edit Profile"
                                                                        >
                                                                            <IoPencil size={15} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Main Active Scholars Table */
                                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                                    <th className="px-4 py-3 w-10 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                                            onChange={(e) => setSelectedStudentIds(e.target.checked ? filteredStudents.map(s => s._id) : [])}
                                                            className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                        />
                                                    </th>
                                                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-10">#</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Scholar</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Desk & Room</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Shift & Timing</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Presence</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Mock Tests</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Admission</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fee Rate</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredStudents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="11" className="text-center py-16 text-slate-500 text-xs">
                                                            <IoPeopleOutline size={36} className="mx-auto text-slate-300 mb-2" />
                                                            <p className="font-semibold text-slate-700">No students found matching current criteria</p>
                                                            <p className="text-slate-400 text-[11px] mt-0.5">Try clearing filters or search query.</p>
                                                        </td>
                                                    </tr>
                                                ) : filteredStudents.map((student, idx) => {
                                                    const seatDetails = getStudentSeatDetails(student._id);
                                                    const shiftsDisplay = getStudentShifts(student._id);
                                                    const isSelected = selectedStudentIds.includes(student._id);

                                                    return (
                                                        <tr
                                                            key={student._id}
                                                            className={`transition-colors ${isSelected ? 'bg-orange-50/40' : 'hover:bg-orange-50/20'}`}
                                                        >
                                                            {/* Checkbox */}
                                                            <td className="px-4 py-3.5 w-10 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedStudentIds(prev => [...prev, student._id]);
                                                                        else setSelectedStudentIds(prev => prev.filter(id => id !== student._id));
                                                                    }}
                                                                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                                                />
                                                            </td>

                                                            {/* Index */}
                                                            <td className="px-3 py-3.5 text-xs font-bold text-slate-400 tabular-nums">
                                                                {idx + 1}
                                                            </td>

                                                            {/* Student Scholar Identity */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                        <img 
                                                                            src={(() => {
                                                                                const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
                                                                                    ? getDeterministicAvatar(student._id, student.gender)
                                                                                    : student.profileImage;
                                                                                return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                                                            })()} 
                                                                            alt={student.name} 
                                                                            className="w-full h-full object-cover" 
                                                                        />
                                                                        {/* Online Dot */}
                                                                        <span
                                                                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                                                                student.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                                                            }`}
                                                                            title={student.isOnline ? 'Online now' : 'Offline'}
                                                                        />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-bold text-xs text-slate-900 truncate">
                                                                                {student.name}
                                                                            </span>
                                                                            {student.registrationSource === 'self' ? (
                                                                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                                                    Self
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                                    Admin
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                            {student.mobile && (
                                                                                <a
                                                                                    href={`https://wa.me/91${student.mobile.replace(/\D/g, '')}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                                                                                    title="Chat on WhatsApp"
                                                                                >
                                                                                    <IoLogoWhatsapp size={12} />
                                                                                    <span>{student.mobile}</span>
                                                                                </a>
                                                                            )}
                                                                            {student.email && (
                                                                                <span className="truncate max-w-[140px] text-slate-400">
                                                                                    {student.email}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Desk & Room */}
                                                            <td className="px-4 py-3.5">
                                                                {seatDetails ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 font-bold text-xs w-fit">
                                                                            <IoBedOutline size={13} className="text-orange-600" />
                                                                            <span>Desk {seatDetails.seatNumber}</span>
                                                                            {(seatDetails.isTemporary || student.isTemporarySeat || student.isTemporary || student.tempAssignments?.length > 0) && (
                                                                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                                                                                    Temp
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                            <span>{seatDetails.roomName}</span>
                                                                            <span>·</span>
                                                                            <span>{seatDetails.floorName}</span>
                                                                            {seatDetails.hasAc && (
                                                                                <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
                                                                                    AC
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px]">
                                                                        <IoWarningOutline size={12} />
                                                                        <span>Pending Desk</span>
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Shift & Timing */}
                                                            <td className="px-4 py-3.5 text-xs text-slate-700">
                                                                {shiftsDisplay ? (
                                                                    <span className="font-semibold text-slate-800">
                                                                        {shiftsDisplay}
                                                                    </span>
                                                                ) : student.isActive ? (
                                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                                        Awaiting Shift
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">—</span>
                                                                )}
                                                            </td>

                                                            {/* System Presence */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-2 h-2 rounded-full ${student.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${student.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                            {student.isOnline ? 'Online' : 'Offline'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-2 h-2 rounded-full ${student.isLoggedIn ? 'bg-orange-500' : 'bg-slate-300'}`} />
                                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${student.isLoggedIn ? 'text-orange-600' : 'text-slate-400'}`}>
                                                                            {student.isLoggedIn ? 'Logged In' : 'Logged Out'}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedSessionStudent(student);
                                                                            setShowSessionModal(true);
                                                                        }}
                                                                        className="mt-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors self-start"
                                                                    >
                                                                        Session Info
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Mock Test AI Credits */}
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                                                                        <span>{Math.min(student.mockTestCredits ?? 2, 2)}</span>
                                                                        <span className="text-amber-500 font-normal">/ 2</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => fetchCreditHistory(student)}
                                                                        className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                                                                    >
                                                                        History
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Admission Date */}
                                                            <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openActivityHistoryModal(student)}
                                                                    title="Click to view full Activity & Status History"
                                                                    className="hover:text-orange-600 cursor-pointer underline decoration-dotted decoration-slate-300 hover:decoration-orange-400 text-left transition-colors flex items-center gap-1 group/tblhist"
                                                                >
                                                                    <IoTimeOutline size={12} className="text-slate-400 group-hover/tblhist:text-orange-500 shrink-0" />
                                                                    <span>{new Date(student.admissionDate || student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                </button>
                                                            </td>

                                                            {/* Fee Rate */}
                                                            <td className="px-4 py-3.5 text-xs font-bold tabular-nums">
                                                                <div className="text-emerald-600">{getStudentFee(student)}</div>
                                                                {student.showInFeeManagement === false && (
                                                                    <span className="inline-flex items-center text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded mt-0.5" title="Hidden from Fee Management ledger">
                                                                        Fees Hidden
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-4 py-3.5">
                                                                {student.isActive ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                        <span>Active</span>
                                                                    </span>
                                                                ) : student.inactivationStatus === 'awaited' ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold" title="Inactivation request pending Super Admin approval">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                        <span>Awaited</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                                        <span>Inactive</span>
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Actions Matrix */}
                                                            <td className="px-4 py-3.5 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    {isSubAdmin ? (
                                                                        student.isActive ? (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSubAdminInactiveStudent(student);
                                                                                    setShowSubAdminInactiveModal(true);
                                                                                }}
                                                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                                                title="Mark Inactive"
                                                                            >
                                                                                <IoTrashOutline size={14} />
                                                                                <span>Mark Inactive</span>
                                                                            </button>
                                                                        ) : student.inactivationStatus === 'awaited' ? (
                                                                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-lg flex items-center gap-1">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                                <span>Awaited</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="px-2.5 py-1 bg-stone-100 text-stone-500 text-[11px] font-semibold rounded-lg">
                                                                                Inactive
                                                                            </span>
                                                                        )
                                                                    ) : student.isActive ? (
                                                                        <>
                                                                            <button
                                                                                onClick={() => openIdCardModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                                title="ID Card"
                                                                            >
                                                                                <IoIdCard size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openSeatAssignModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                                title="Assign Desk"
                                                                            >
                                                                                <IoBedOutline size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openSplitSeatModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                                title="Split Seat Assignment"
                                                                            >
                                                                                <IoGitBranch size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openTempSeatModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                                title="Temporary Seat Assignment"
                                                                            >
                                                                                <IoWarningOutline size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openActivityHistoryModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                                title="Scholar Activity & Status History"
                                                                            >
                                                                                <IoTimeOutline size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openResetPasswordModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                                title="Reset Password"
                                                                            >
                                                                                <IoKey size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openEditModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                                                title="Edit Details"
                                                                            >
                                                                                <IoPencil size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openDeleteModal(student)}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                                title="Delete or Deactivate"
                                                                            >
                                                                                <IoTrashOutline size={16} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleReactivate(student)}
                                                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                                title="Reactivate Scholar"
                                                                            >
                                                                                <IoRefresh size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openDeleteModal(student)}
                                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                                title="Delete Scholar Permanently"
                                                                            >
                                                                                <IoTrashOutline size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openActivityHistoryModal(student)}
                                                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                                title="Scholar Activity & Status History"
                                                                            >
                                                                                <IoTimeOutline size={16} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ─── Swap Seats Modal ───────────────────────────────────────── */}
                    <Modal theme="light"
                        isOpen={showSwapModal}
                        onClose={() => { setShowSwapModal(false); setError(''); }}
                        title="Swap Student Desk Allocations"
                    >
                        <form onSubmit={handleSwapSeats} className="space-y-5">
                            {/* Info banner */}
                            <div className="flex items-start gap-3 bg-orange-50/80 border border-orange-200 rounded-2xl p-4">
                                <IoSwapHorizontal size={20} className="text-orange-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-orange-950 leading-relaxed">
                                    <strong className="font-bold">Desk Exchange Operation:</strong> Only the assigned physical desk will swap between Scholar A and Scholar B. Shift schedules, billing cycle fees, and attendance history remain unchanged.
                                </div>
                            </div>

                            {/* Error inside modal */}
                            {error && showSwapModal && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <IoAlertCircleOutline size={16} className="text-rose-600 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Student 1 Selection */}
                            <div>
                                <label className={LABEL}>Scholar A (First Desk)</label>
                                <select
                                    id="swap-student-a"
                                    value={swapStudentId1}
                                    onChange={e => setSwapStudentId1(e.target.value)}
                                    className={INPUT}
                                    style={{ colorScheme: 'light' }}
                                    required
                                >
                                    <option value="">— Select Scholar A —</option>
                                    {students.filter(s => s.isActive && getStudentSeat(s._id)).map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} — Desk {getStudentSeat(s._id)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Visual Swap Preview */}
                            <div className="flex items-center justify-center gap-3 py-1">
                                <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-center shadow-2xs">
                                    {swapStudentId1 ? (() => {
                                        const s = students.find(x => x._id === swapStudentId1);
                                        return s ? (
                                            <>
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm mx-auto mb-2 shadow-xs shadow-orange-500/25">
                                                    {s.name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-slate-900 text-xs font-extrabold truncate">{s.name}</p>
                                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[11px]">
                                                    <IoBedOutline size={12} />
                                                    <span>Desk {getStudentSeat(s._id)}</span>
                                                </div>
                                            </>
                                        ) : null;
                                    })() : (
                                        <div className="py-3">
                                            <IoBedOutline size={22} className="mx-auto text-slate-300 mb-1" />
                                            <p className="text-slate-400 text-xs font-semibold">Select Scholar A</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <motion.div
                                        animate={swapStudentId1 && swapStudentId2 ? { rotate: [0, 180, 360] } : {}}
                                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                                        className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 shadow-2xs"
                                    >
                                        <IoSwapHorizontal size={22} />
                                    </motion.div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Exchange</span>
                                </div>

                                <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-center shadow-2xs">
                                    {swapStudentId2 ? (() => {
                                        const s = students.find(x => x._id === swapStudentId2);
                                        return s ? (
                                            <>
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-extrabold text-sm mx-auto mb-2 shadow-xs">
                                                    {s.name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="text-slate-900 text-xs font-extrabold truncate">{s.name}</p>
                                                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-bold text-[11px]">
                                                    <IoBedOutline size={12} />
                                                    <span>Desk {getStudentSeat(s._id)}</span>
                                                </div>
                                            </>
                                        ) : null;
                                    })() : (
                                        <div className="py-3">
                                            <IoBedOutline size={22} className="mx-auto text-slate-300 mb-1" />
                                            <p className="text-slate-400 text-xs font-semibold">Select Scholar B</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Student 2 Selection */}
                            <div>
                                <label className={LABEL}>Scholar B (Second Desk)</label>
                                <select
                                    id="swap-student-b"
                                    value={swapStudentId2}
                                    onChange={e => setSwapStudentId2(e.target.value)}
                                    className={INPUT}
                                    style={{ colorScheme: 'light' }}
                                    required
                                >
                                    <option value="">— Select Scholar B —</option>
                                    {students.filter(s => s.isActive && getStudentSeat(s._id) && s._id !== swapStudentId1).map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} — Desk {getStudentSeat(s._id)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Confirmation summary */}
                            {swapStudentId1 && swapStudentId2 && (() => {
                                const s1 = students.find(x => x._id === swapStudentId1);
                                const s2 = students.find(x => x._id === swapStudentId2);
                                if (!s1 || !s2) return null;
                                return (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Planned Desk Exchange Preview</p>
                                        <div className="flex items-center justify-between text-xs bg-white border border-slate-200/80 px-3 py-2 rounded-xl">
                                            <span className="font-bold text-slate-900">{s1.name}</span>
                                            <span className="text-slate-400 font-bold">takes</span>
                                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">Desk {getStudentSeat(s2._id)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs bg-white border border-slate-200/80 px-3 py-2 rounded-xl">
                                            <span className="font-bold text-slate-900">{s2.name}</span>
                                            <span className="text-slate-400 font-bold">takes</span>
                                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">Desk {getStudentSeat(s1._id)}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowSwapModal(false); setError(''); }} className={BTN_SECONDARY}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={swapLoading || !swapStudentId1 || !swapStudentId2 || swapStudentId1 === swapStudentId2}
                                    className={BTN_PRIMARY}
                                >
                                    <IoSwapHorizontal size={15} />
                                    <span>{swapLoading ? 'Exchanging...' : 'Confirm Desk Exchange'}</span>
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Session Details Modal */}
                    <Modal theme="light"
                        isOpen={showSessionModal}
                        onClose={() => setShowSessionModal(false)}
                        title="Scholar Live Session Diagnostics"
                    >
                        <div className="space-y-4">
                            {selectedSessionStudent && (
                                <>
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-extrabold text-lg shrink-0 shadow-sm shadow-orange-500/20">
                                            {selectedSessionStudent.name?.charAt(0).toUpperCase()}
                                            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${selectedSessionStudent.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-slate-900 font-extrabold text-sm truncate">{selectedSessionStudent.name}</h4>
                                            <p className="text-slate-500 text-xs truncate mt-0.5">{selectedSessionStudent.email || 'No email registered'}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                selectedSessionStudent.isOnline ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-slate-100 border border-slate-200 text-slate-600'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${selectedSessionStudent.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                <span>{selectedSessionStudent.isOnline ? 'Online Now' : 'Offline'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Session</span>
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${selectedSessionStudent.isLoggedIn ? 'bg-orange-500' : 'bg-slate-300'}`} />
                                                <span className="text-xs font-extrabold text-slate-900">
                                                    {selectedSessionStudent.isLoggedIn ? 'Active Token (Logged In)' : 'Logged Out'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocated Desk</span>
                                            <p className="mt-1 text-xs font-extrabold text-slate-900">
                                                {getStudentSeat(selectedSessionStudent._id) ? `Desk ${getStudentSeat(selectedSessionStudent._id)}` : 'Unassigned'}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last System Heartbeat</span>
                                            <p className="mt-1 text-xs font-bold text-slate-800 truncate">
                                                {selectedSessionStudent.lastActive ? new Date(selectedSessionStudent.lastActive).toLocaleString('en-IN') : 'No recorded activity'}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Successful Login</span>
                                            <p className="mt-1 text-xs font-bold text-slate-800 truncate">
                                                {selectedSessionStudent.lastLogin ? new Date(selectedSessionStudent.lastLogin).toLocaleString('en-IN') : 'No login timestamp'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => setShowSessionModal(false)} className={BTN_SECONDARY}>Close Window</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Modal>

                    {/* Credit Details Modal */}
                    <Modal theme="light"
                        isOpen={showCreditModal}
                        onClose={() => setShowCreditModal(false)}
                        title="AI Mock Test Analytics & Attempt Logs"
                    >
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto w-full pr-1">
                            {selectedCreditStudent && (
                                <>
                                    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-sm shadow-orange-500/20">
                                                {selectedCreditStudent.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-slate-900 font-extrabold text-sm truncate">{selectedCreditStudent.name}</h4>
                                                <p className="text-slate-500 text-xs truncate mt-0.5">{selectedCreditStudent.email || 'No email registered'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Available Credits</div>
                                            <div className="text-lg font-black text-orange-600">{Math.min(selectedCreditStudent.mockTestCredits ?? 2, 2)}<span className="text-xs text-slate-400 font-semibold"> / 2</span></div>
                                        </div>
                                    </div>

                                    {creditLoading ? (
                                        <div className="text-center py-10 text-slate-400 text-xs font-semibold">Querying mock test records...</div>
                                    ) : creditHistory.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 border border-slate-200 bg-slate-50/50 rounded-2xl border-dashed text-xs">
                                            No mock test attempts recorded for this student.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Historical Exam Logs ({creditHistory.length})</h4>
                                            {creditHistory.map(att => (
                                                <div key={att._id} className="bg-white border border-slate-200/90 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-2xs hover:border-orange-300 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-slate-900 font-extrabold text-xs tracking-tight">{att.patternName}</span>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${att.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{att.status}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-medium">Attempted on: {new Date(att.startedAt).toLocaleString('en-IN')}</div>
                                                    </div>

                                                    {att.status === 'completed' && (
                                                        <div className="flex gap-4 items-center bg-slate-50 rounded-xl p-2 px-3 border border-slate-200/80">
                                                            <div className="text-center">
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase">Score</div>
                                                                <div className="text-xs font-extrabold text-orange-600">{att.score} <span className="text-[10px] text-slate-400 font-medium">/{att.maxScore}</span></div>
                                                            </div>
                                                            <div className="w-px h-7 bg-slate-200" />
                                                            <div className="text-center">
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase">Accuracy</div>
                                                                <div className={`text-xs font-extrabold ${att.percentage >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>{att.percentage}%</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => setShowCreditModal(false)} className={BTN_SECONDARY}>Close Window</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Modal>

                    {/* View ID Card Modal */}
                    <Modal theme="light"
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
                                                seatNumber: getStudentSeat(selectedStudent._id),
                                                roomId: selectedStudent.roomId || getStudentSeatDetails(selectedStudent._id)?.roomId,
                                                isTemporary: !!(selectedStudent.isTemporary || selectedStudent.isTemporarySeat || selectedStudent.tempAssignments?.length > 0 || getStudentSeatDetails(selectedStudent._id)?.isTemporary),
                                                isTemporarySeat: !!(selectedStudent.isTemporary || selectedStudent.isTemporarySeat || selectedStudent.tempAssignments?.length > 0 || getStudentSeatDetails(selectedStudent._id)?.isTemporary)
                                            }}
                                        />
                                    </div>
                                    <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
                                        <button onClick={() => setShowIdCardModal(false)} className={BTN_SECONDARY + ' flex-1'}>Close</button>
                                        <button
                                            onClick={handleDownloadPNG}
                                            className={BTN_PRIMARY + ' flex-1'}
                                        >
                                            <IoDownload size={14} /> Download PNG
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className={BTN_PRIMARY + ' flex-1'}
                                            style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', boxShadow: '0 4px 16px rgba(249,115,22,0.25)' }}
                                        >
                                            <IoDownload size={14} /> Download PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Modal>

                    {/* Add/Edit Student Modal */}
                    <Modal theme="light"
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        title={editMode ? 'Edit Student Profile' : 'Register New Student'}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Profile Card Header if editMode */}
                            {editMode && selectedStudent && (
                                <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-orange-500/20">
                                        {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{selectedStudent.name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedStudent.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                {selectedStudent.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{selectedStudent.email || selectedStudent.mobile}</p>
                                    </div>
                                </div>
                            )}

                            {/* 2-Column Grid: Name & Mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className={LABEL}>
                                        <span className="flex items-center gap-1.5"><IoPersonOutline size={13} className="text-slate-500" /> Full Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={INPUT}
                                        placeholder="e.g. Rahul Sharma"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>
                                        <span className="flex items-center gap-1.5"><IoCallOutline size={13} className="text-slate-500" /> Mobile Number *</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setFormData({ ...formData, mobile: val });
                                        }}
                                        className={INPUT}
                                        placeholder="10-digit mobile"
                                        pattern="[0-9]{10}"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 2-Column Grid: Email & Gender */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className={LABEL}>
                                        <span className="flex items-center gap-1.5"><IoMailOutline size={13} className="text-slate-500" /> Email (Optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={INPUT}
                                        placeholder="student@example.com"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL}>Gender Preference</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className={INPUT + ' cursor-pointer capitalize'}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Full Address */}
                            <div>
                                <label className={LABEL}>Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className={INPUT + ' min-h-[70px] resize-y'}
                                    placeholder="Residential or permanent address"
                                    rows={2}
                                />
                            </div>

                            {/* Admission & Slip Details Section */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <IoReceiptOutline size={14} className="text-orange-500" />
                                        <span>Admission Slip & Official Receipt Parameters</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">Used for printed receipts</span>
                                </div>

                                {/* Father's Name & Date of Birth */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL}>Father's / Guardian Name</label>
                                        <input
                                            type="text"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                            className={INPUT}
                                            placeholder="Father's or Guardian name"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>
                                            <span className="flex items-center gap-1.5"><IoCalendarOutline size={13} className="text-slate-500" /> Date of Birth</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            className={INPUT}
                                            style={{ colorScheme: 'light' }}
                                        />
                                    </div>
                                </div>

                                {/* Aadhar No, Locker No, Registration Fee */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL}>
                                            <span className="flex items-center gap-1.5"><IoCardOutline size={13} className="text-slate-500" /> Aadhar Card No.</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.aadharNo}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 12) setFormData({ ...formData, aadharNo: val });
                                            }}
                                            className={INPUT}
                                            placeholder="12-digit UIDAI"
                                            maxLength={12}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Locker Number</label>
                                        <input
                                            type="text"
                                            value={formData.lockerNo}
                                            onChange={(e) => setFormData({ ...formData, lockerNo: e.target.value })}
                                            className={INPUT}
                                            placeholder="e.g. L-12 or None"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL}>
                                            <span className="flex items-center gap-1.5"><IoCashOutline size={13} className="text-slate-500" /> Reg. Fee (₹)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.registrationFee}
                                            onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                                            className={INPUT}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Security / Password Section */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <IoLockClosedOutline size={14} className="text-orange-500" />
                                        <span>{editMode ? 'Security Password (Optional)' : 'Initial Login Password'}</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">{editMode ? 'Leave blank to preserve current' : 'Default: Student Mobile'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={INPUT + ' flex-1 font-mono tracking-wider text-xs'}
                                        placeholder={editMode ? "Preserve current credentials" : "Generating..."}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, password: formData.mobile })}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl transition-all font-bold whitespace-nowrap shadow-xs flex items-center gap-1"
                                        title="Set password to registered mobile"
                                    >
                                        <IoPhonePortraitOutline size={13} /> Use Mobile
                                    </button>
                                    {!editMode && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                                let password = '';
                                                for (let i = 0; i < 8; i++) { password += charset.charAt(Math.floor(Math.random() * charset.length)); }
                                                setFormData({ ...formData, password: password });
                                            }}
                                            className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs rounded-xl transition-all font-bold whitespace-nowrap shadow-xs flex items-center gap-1"
                                        >
                                            <IoShuffleOutline size={13} /> Random
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Registration Date & Referral */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className={LABEL}>
                                        <span className="flex items-center gap-1.5"><IoCalendarOutline size={13} className="text-slate-500" /> Registration Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.joinedAt}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                                        className={INPUT}
                                        style={{ colorScheme: 'light' }}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Join date used for fee cycles & attendance</p>
                                </div>
                                {!editMode ? (
                                    <div>
                                        <label className={LABEL}>Referral Code <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="text"
                                            value={formData.referralCode || ''}
                                            onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                            className={INPUT}
                                            placeholder="e.g. REF123"
                                            maxLength={12}
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Awards reward coins to referring student</p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Shift and Negotiated Price if editMode and seatId */}
                            {editMode && formData.seatId && (
                                <div className="p-3.5 bg-orange-50/50 border border-orange-200/70 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                                        <IoBedOutline size={15} className="text-orange-600" />
                                        <span>Allocated Desk & Pricing Settings</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL}>Assigned Shift</label>
                                            <select
                                                value={formData.shift}
                                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                                className={INPUT}
                                            >
                                                <option value="">No shift assigned</option>
                                                {shifts.map(shift => (
                                                    <option key={shift.id} value={shift.id}>
                                                        {shift.name} ({getShiftTimeRange(shift)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={LABEL}>Negotiated Price (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.negotiatedPrice}
                                                onChange={(e) => setFormData({ ...formData, negotiatedPrice: e.target.value })}
                                                className={INPUT}
                                                placeholder="Base price default"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Notification Checkbox */}
                            {editMode && (
                                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="sendMail"
                                        checked={formData.sendMail}
                                        onChange={(e) => setFormData({ ...formData, sendMail: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                        Send update notification email with login credentials
                                    </span>
                                </label>
                            )}

                            {/* Show in Fee Management Toggle */}
                            {editMode && (
                                <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="showInFeeManagement"
                                        checked={formData.showInFeeManagement !== false}
                                        onChange={(e) => setFormData({ ...formData, showInFeeManagement: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer mt-0.5"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-800">
                                            Show in Fee Management
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {formData.showInFeeManagement !== false
                                                ? 'Active in Fee Management ledger, pending sync, and payment tracking.'
                                                : 'Hidden from Fee Management. This student will be excluded from the main fee ledger.'}
                                        </p>
                                    </div>
                                </label>
                            )}

                            {/* Status & Reactivation History */}
                            {editMode && selectedStudent?.statusHistory && selectedStudent.statusHistory.length > 0 && (
                                <div className="border-t border-slate-200 pt-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">Audit & Reactivation History</span>
                                        <span className="text-[11px] text-slate-500">
                                            Effective Admission: <strong className="text-orange-600 font-bold">{new Date(selectedStudent.admissionDate || selectedStudent.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                                        </span>
                                    </div>
                                    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[160px] overflow-y-auto">
                                        {selectedStudent.statusHistory.map((hist, idx) => {
                                            const isFirst = idx === 0;
                                            const isReactivation = hist.status === 'active' && !isFirst;
                                            let prevInactiveDate = null;
                                            if (isReactivation) {
                                                const prevEntries = selectedStudent.statusHistory.slice(0, idx).reverse();
                                                const lastInactive = prevEntries.find(e => e.status === 'inactive');
                                                if (lastInactive) {
                                                    prevInactiveDate = lastInactive.date;
                                                }
                                            }

                                            return (
                                                <div key={idx} className="flex items-start gap-2.5 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] mt-0.5 ${
                                                        isFirst ? 'bg-orange-500/10 text-orange-600 border border-orange-200' :
                                                        hist.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {isFirst ? 'Joined' : hist.status === 'active' ? 'Reactivated' : 'Deactivated'}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-slate-800 font-semibold text-xs">
                                                            {isFirst ? 'Initial admission on' : hist.status === 'active' ? 'Reactivated on' : 'Deactivated on'}{' '}
                                                            {new Date(hist.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {hist.admissionDate && (
                                                            <p className="text-slate-500 text-[10px] mt-0.5">
                                                                {hist.status === 'inactive' ? 'Previous Admission: ' : 'New Admission: '}
                                                                <span className="text-slate-700 font-medium">{new Date(hist.admissionDate).toLocaleDateString('en-IN')}</span>
                                                            </p>
                                                        )}
                                                        {prevInactiveDate && (
                                                            <p className="text-slate-400 text-[10px] mt-0.5">
                                                                Prior Inactivation: {new Date(prevInactiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} disabled={loading} className={BTN_SECONDARY + ' flex-1'}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className={BTN_PRIMARY + ' flex-1'}>
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {editMode ? 'Updating...' : 'Creating...'}
                                        </span>
                                    ) : (
                                        editMode ? 'Update Student' : 'Register Student'
                                    )}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Assign Seat Modal */}
                    <Modal theme="light"
                        isOpen={showSeatModal}
                        onClose={() => setShowSeatModal(false)}
                        title={`Assign Desk Seat: ${selectedStudent?.name || ''}`}
                    >
                        <form onSubmit={handleSeatAssignment} className="space-y-4">
                            {/* Selected Student Executive Profile Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-orange-500/20">
                                    {selectedStudent?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedStudent?.name}</h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                            Unallocated Desk
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{selectedStudent?.email || 'No email registered'}</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{selectedStudent?.mobile ? `+91 ${selectedStudent.mobile}` : ''}</p>
                                </div>
                            </div>

                            {/* Seat Selection */}
                            <div>
                                <label className={LABEL}>
                                    <span className="flex items-center gap-1.5"><IoBedOutline size={14} className="text-orange-500" /> Select Vacant Desk *</span>
                                </label>
                                <select
                                    value={seatFormData.seatId}
                                    onChange={(e) => setSeatFormData({ ...seatFormData, seatId: e.target.value })}
                                    className={INPUT}
                                    required
                                >
                                    <option value="">Choose a vacant desk...</option>
                                    {availableSeats.length === 0 ? (
                                        <option disabled>No available desks</option>
                                    ) : (
                                        availableSeats.map(seat => (
                                            <option key={seat._id} value={seat._id}>
                                                {seat.displayName}
                                                {seat.isFullyBooked ? ' (Fully Booked)' : seat.isPartiallyBooked ? ' (Partially Booked)' : ''}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {availableSeats.length === 0 && (
                                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                                        <IoAlertCircleOutline size={15} className="shrink-0" />
                                        <span>No vacant desks available across current floors.</span>
                                    </div>
                                )}
                            </div>

                            {/* Shift Selection */}
                            <div>
                                <label className={LABEL}>
                                    <span className="flex items-center gap-1.5"><IoTimeOutline size={14} className="text-orange-500" /> Shift Window *</span>
                                </label>
                                <select
                                    value={seatFormData.shift}
                                    onChange={(e) => setSeatFormData({ ...seatFormData, shift: e.target.value })}
                                    className={INPUT}
                                    required
                                >
                                    <option value="">Select shift window...</option>
                                    {(() => {
                                        const availableShifts = getAvailableShiftsForSeat(seatFormData.seatId);
                                        return availableShifts.map(shift => (
                                            <option key={shift.id} value={shift.id}>
                                                {shift.name} ({getShiftTimeRange(shift)})
                                            </option>
                                        ));
                                    })()}
                                    {!isCustom && !shifts.some(s => s.id === 'full') &&
                                        (!seatFormData.seatId || getAvailableShiftsForSeat(seatFormData.seatId).some(s => s.id !== 'full')) && (
                                            <option value="full">Full Day (9 AM - 9 PM)</option>
                                        )}
                                </select>
                                {seatFormData.seatId && getAvailableShiftsForSeat(seatFormData.seatId).length === 0 && (
                                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium">
                                        <IoWarningOutline size={15} className="shrink-0 text-amber-600" />
                                        <span>All shift slots for this desk are currently occupied.</span>
                                    </div>
                                )}
                            </div>

                            {/* Negotiated Price */}
                            <div>
                                <label className={LABEL}>Negotiated Price (Optional)</label>
                                <input
                                    type="number"
                                    value={seatFormData.negotiatedPrice}
                                    onChange={(e) => setSeatFormData({ ...seatFormData, negotiatedPrice: e.target.value })}
                                    className={INPUT}
                                    placeholder="Leave blank for standard catalog price"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Overrides default shift pricing for this student</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowSeatModal(false)} className={BTN_SECONDARY + ' flex-1'}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={availableSeats.length === 0 || assigningSeat}
                                    className={BTN_PRIMARY + ' flex-1'}
                                >
                                    {assigningSeat ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Allocating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IoBedOutline size={15} />
                                            <span>Confirm Desk Allocation</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Delete Confirmation Modal */}
                    <Modal theme="light"
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        title={selectedStudent?.isActive && !hardDelete ? "Deactivate Student Record" : "Permanent Record Purge"}
                    >
                        <form onSubmit={handleDelete} className="space-y-4">
                            {/* Student Profile Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                                    {selectedStudent?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedStudent?.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            selectedStudent?.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}>
                                            {selectedStudent?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{selectedStudent?.email || 'No email registered'}</p>
                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                        <span>Joined: {selectedStudent && new Date(selectedStudent.createdAt).toLocaleDateString('en-IN')}</span>
                                        {selectedStudent?.mobile && <span>Mobile: {selectedStudent.mobile}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Warning Alert Banner */}
                            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                                selectedStudent?.isActive && !hardDelete ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}>
                                {selectedStudent?.isActive && !hardDelete ? (
                                    <>
                                        <IoWarningOutline className="shrink-0 text-base text-amber-600 mt-0.5" />
                                        <div className="text-xs space-y-1">
                                            <p className="font-bold">Soft Deactivation (Recommended)</p>
                                            <p className="text-amber-800 leading-relaxed">
                                                This will mark the student as inactive, unallocate their assigned desk for other students, and preserve their payment and attendance history. They can be restored anytime.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <IoAlertCircleOutline className="shrink-0 text-base text-rose-600 mt-0.5" />
                                        <div className="text-xs space-y-1">
                                            <p className="font-bold text-rose-800">Irreversible Permanent Purge</p>
                                            <p className="text-rose-700 leading-relaxed">
                                                This action will permanently delete all data for this student from the database, including fees, attendance, and analytics. This operation cannot be undone.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Hard Delete Checkbox Option */}
                            {selectedStudent?.isActive && (
                                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                                    <input
                                        type="checkbox"
                                        id="hardDelete"
                                        checked={hardDelete}
                                        onChange={(e) => setHardDelete(e.target.checked)}
                                        className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300 cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-slate-700">
                                        Bypass soft deactivation and permanently purge record immediately
                                    </span>
                                </label>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <IoAlertCircleOutline size={15} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Password Input */}
                            <div>
                                <label className={LABEL}>
                                    <span className="flex items-center gap-1.5"><IoShieldCheckmarkOutline size={14} className="text-slate-600" /> Admin Master Password Authentication</span>
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className={INPUT + ' font-mono'}
                                    placeholder="Enter admin master password"
                                    required
                                    autoFocus
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Required for sensitive roster modifications</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading} className={BTN_SECONDARY + ' flex-1'}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteLoading || !deletePassword}
                                    className={(selectedStudent?.isActive && !hardDelete ? BTN_PRIMARY : BTN_DANGER) + ' flex-1'}
                                >
                                    {deleteLoading ? 'Authenticating...' : (selectedStudent?.isActive && !hardDelete ? 'Deactivate Student' : 'Purge Record')}
                                </button>
                            </div>
                        </form>
                    </Modal>

                    {/* Sub-Admin Inactivation Request Modal */}
                    <Modal
                        theme="light"
                        isOpen={showSubAdminInactiveModal}
                        onClose={() => {
                            if (!subAdminInactiveLoading) {
                                setShowSubAdminInactiveModal(false);
                                setSubAdminInactiveStudent(null);
                            }
                        }}
                        title="Confirm Scholar Inactivation"
                        maxWidth="max-w-lg"
                        accentColor="from-rose-500 via-red-500 to-rose-600"
                    >
                        {subAdminInactiveStudent && (
                            <div className="space-y-4">
                                {/* Scholar Context Card */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                                    {subAdminInactiveStudent.avatar ? (
                                        <img
                                            src={subAdminInactiveStudent.avatar}
                                            alt={subAdminInactiveStudent.name}
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-200 shadow-sm shrink-0"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-sm">
                                            {subAdminInactiveStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-base font-bold text-slate-900 truncate">
                                                {subAdminInactiveStudent.name}
                                            </h4>
                                            <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-full">
                                                Active → Awaited
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            {subAdminInactiveStudent.email || 'No email registered'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                                            {subAdminInactiveStudent.mobile && (
                                                <span className="font-medium">Mobile: {subAdminInactiveStudent.mobile}</span>
                                            )}
                                            {subAdminInactiveStudent.fatherName && (
                                                <span className="text-slate-400">Guardian: {subAdminInactiveStudent.fatherName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Desk & Schedule Details */}
                                <div className="space-y-2">
                                    {(() => {
                                        const seat = getStudentSeat(subAdminInactiveStudent._id);
                                        const flr = seat ? floors.find(f => f.rooms?.some(r => r.seats?.some(s => s._id === seat._id))) : null;
                                        return seat ? (
                                            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                                                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                                    <IoBedOutline size={16} className="text-amber-600" />
                                                    Assigned Desk: Seat #{seat.number} {flr ? `(${flr.name})` : ''}
                                                </span>
                                                <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 rounded-md text-[10px] font-extrabold">
                                                    Vacated Immediately
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500">
                                                No physical desk assigned
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const shiftsDisplay = getStudentShifts(subAdminInactiveStudent._id);
                                        return shiftsDisplay ? (
                                            <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-1.5">
                                                <IoTimeOutline size={14} className="text-stone-500" />
                                                <span>Shift Schedule: <strong className="text-stone-800">{shiftsDisplay}</strong></span>
                                            </div>
                                        ) : null;
                                    })()}

                                    {subAdminInactiveStudent.address && (
                                        <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-center gap-1.5">
                                            <IoLocationOutline size={14} className="text-stone-500" />
                                            <span>Address: <strong className="text-stone-800">{subAdminInactiveStudent.address}</strong></span>
                                        </div>
                                    )}
                                </div>

                                {/* High Warning & Policy Explainer */}
                                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-2.5">
                                    <IoAlertCircleOutline className="text-rose-600 shrink-0 mt-0.5" size={18} />
                                    <div className="text-xs text-rose-900 space-y-1">
                                        <p className="font-bold text-rose-950">Inactivation & Desk Vacation Notice</p>
                                        <p className="text-rose-800 leading-relaxed">
                                            Clicking Inactive will immediately free the assigned desk space for new enrollments. The scholar status will change to <strong>Awaited</strong>.
                                        </p>
                                        <p className="text-rose-700 text-[11px] leading-relaxed">
                                            A ticket will be sent to the Super Admin's Requests panel for final approval. No password is required to submit this request.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                        <IoAlertCircleOutline size={15} className="shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Action Buttons: Cancel and Highly Red Inactive Button */}
                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSubAdminInactiveModal(false);
                                            setSubAdminInactiveStudent(null);
                                        }}
                                        disabled={subAdminInactiveLoading}
                                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    {inactiveCountdown > 0 ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-400/80 cursor-not-allowed flex items-center gap-1.5 select-none"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                            <span>Inactive ({inactiveCountdown}s)</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleSubAdminInactivate}
                                            disabled={subAdminInactiveLoading}
                                            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
                                            style={{
                                                backgroundColor: '#dc2626',
                                                backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
                                                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)'
                                            }}
                                        >
                                            {subAdminInactiveLoading ? (
                                                <>
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IoTrashOutline size={15} />
                                                    <span>Inactive</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* Reset Password Modal */}
                    <Modal theme="light"
                        isOpen={showResetPasswordModal}
                        onClose={() => {
                            setShowResetPasswordModal(false);
                            setSelectedStudent(null);
                            setError('');
                        }}
                        title="Reset Student Password"
                    >
                        <div className="space-y-4">
                            {/* Student Context Chip */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm shadow-orange-500/20">
                                    {selectedStudent?.name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{selectedStudent?.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">{selectedStudent?.email || selectedStudent?.mobile}</p>
                                </div>
                            </div>

                            {/* Notification Box */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                                    <IoKey size={14} className="text-amber-600 shrink-0" />
                                    <span>Automated Credential Generation</span>
                                </div>
                                <p className="text-slate-700 leading-relaxed">
                                    A new secure password will be randomly generated and dispatched to:
                                </p>
                                <div className="p-2 bg-white/80 border border-amber-200/80 rounded-lg text-orange-600 font-bold font-mono text-xs">
                                    {selectedStudent?.email || 'Registered Contact'}
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    The student will also receive an in-app portal notification on their next login session.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                                    <IoAlertCircleOutline size={15} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    onClick={() => { setShowResetPasswordModal(false); setSelectedStudent(null); setError(''); }}
                                    className={BTN_SECONDARY + ' flex-1'}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetPasswordLoading}
                                    className={BTN_PRIMARY + ' flex-1'}
                                >
                                    {resetPasswordLoading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Dispatching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <IoKey size={14} />
                                            <span>Generate & Dispatch</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Archive View Modal */}
                    <Modal theme="light"
                        isOpen={showArchiveModal}
                        onClose={() => setShowArchiveModal(false)}
                        title={selectedArchive ? `Archived Record: ${selectedArchive.name}` : 'Archive Report'}
                    >
                        {selectedArchive && (
                            <div className="space-y-4">
                                {/* Header Info */}
                                <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    {selectedArchive.profileImage ? (
                                        <img
                                            src={selectedArchive.profileImage.startsWith('http') ? selectedArchive.profileImage : `${BASE_URL}${selectedArchive.profileImage}`}
                                            alt={selectedArchive.name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-sm shadow-orange-500/20">
                                            {selectedArchive.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{selectedArchive.name}</h3>
                                        <p className="text-xs text-slate-500 truncate">{selectedArchive.email}</p>
                                        <div className="flex flex-wrap gap-2 text-[10px] mt-1">
                                            <span className="text-slate-500">Joined: {new Date(selectedArchive.joinedAt).toLocaleDateString('en-IN')}</span>
                                            <span className="text-rose-600 font-semibold">Archived: {new Date(selectedArchive.deletedAt).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-200/70">
                                        <span className="text-xs font-bold uppercase tracking-wider text-orange-900">Total Fees</span>
                                        <p className="text-xl font-black text-slate-900 mt-1">₹{selectedArchive.fees.reduce((acc, f) => acc + f.amount, 0).toLocaleString('en-IN')}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{selectedArchive.fees.length} historical invoices</p>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Attendance</span>
                                        <p className="text-xl font-black text-slate-900 mt-1">{selectedArchive.attendance.filter(a => a.status === 'present').length} Days</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Out of {selectedArchive.attendance.length} logged sessions</p>
                                    </div>
                                </div>

                                {/* Fee History */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Historical Fee Ledger</h4>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                        {selectedArchive.fees.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">No payment records logged.</p>
                                        ) : (
                                            selectedArchive.fees.map((fee, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                                                    <span className="font-semibold text-slate-700">{new Date(fee.year, fee.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900">₹{fee.amount}</span>
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${fee.status === 'paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>{fee.status}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Attendance History */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Logged Attendance Records</h4>
                                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                        {selectedArchive.attendance.length === 0 ? (
                                            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-slate-100">No attendance entries recorded.</p>
                                        ) : (
                                            selectedArchive.attendance.slice(0, 20).map((att, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                                                    <span className="font-semibold text-slate-700">{new Date(att.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${att.status === 'present' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>{att.status}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button onClick={() => setShowArchiveModal(false)} className={BTN_SECONDARY}>Close Report</button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* Bulk Edit Fees Modal */}
                    <Modal
                        theme="light"
                        isOpen={showBulkFeeModal}
                        onClose={() => {
                            if (!bulkFeeLoading) {
                                setShowBulkFeeModal(false);
                                setBulkFeeResult(null);
                            }
                        }}
                        maxWidth="max-w-3xl"
                        title="Bulk Fee Rate Adjustment"
                    >
                        {bulkFeeResult ? (
                            /* ─── Result Summary Screen ─── */
                            <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                                        <IoCheckmarkDoneOutline size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-sm text-emerald-950">Bulk Fee Adjustment Complete!</h4>
                                        <p className="text-xs text-emerald-800 mt-0.5">
                                            Successfully updated active fee rates for <span className="font-bold">{bulkFeeResult.updateCount} scholars</span>. Pending fees are now synchronized in Fee Management.
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                        <span className="font-bold text-xs text-slate-800">Updated Scholars Summary</span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                            Pending Fees Synced Instantly
                                        </span>
                                    </div>

                                    <div className="max-h-64 overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2.5">Student Name</th>
                                                    <th className="px-3 py-2.5 text-right">Before Fee</th>
                                                    <th className="px-3 py-2.5 text-right">Updated Fee</th>
                                                    <th className="px-3 py-2.5 text-center">Fee Management</th>
                                                    <th className="px-3 py-2.5 text-center">Pending Fee Status</th>
                                                    <th className="px-3 py-2.5 text-center">Email Notification</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {(bulkFeeResult.students || []).map((item) => (
                                                    <tr key={item.studentId} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="px-4 py-2.5">
                                                            <div className="font-bold text-slate-900">{item.name}</div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {item.seatNumber ? `Desk ${item.seatNumber}` : 'Assigned Desk'}
                                                                {item.email ? ` · ${item.email}` : ''}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-slate-500 tabular-nums">
                                                            ₹{item.beforeFee}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-bold text-orange-600 tabular-nums">
                                                            ₹{item.newFee}
                                                            <span className="text-[10px] font-normal text-slate-400 ml-1">
                                                                ({item.diff >= 0 ? `+₹${item.diff}` : `-₹${Math.abs(item.diff)}`})
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {item.showInFeeManagement ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                                    <IoCheckmarkCircle size={12} className="text-emerald-600" />
                                                                    <span>Visible (Synced)</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                                    <span>Hidden from Fees</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                                <IoCheckmarkCircle size={12} className="text-emerald-600" />
                                                                <span>Live in Fee Management</span>
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {item.emailSent ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                                    <span>Email Sent</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                                                    <span>Not Sent (Default)</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    <Link
                                        to="/admin/fees"
                                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <span>Open Fee Management</span>
                                        <IoArrowForwardOutline size={14} />
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setShowBulkFeeModal(false);
                                            setSelectedStudentIds([]);
                                            setBulkFeeResult(null);
                                        }}
                                        className={BTN_PRIMARY + ' flex-1'}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ─── Adjustment Config & Live Preview Screen ─── */
                            <form onSubmit={handleBulkFeeUpdate} className="space-y-4">
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                            <IoPeopleOutline size={22} />
                                        </div>
                                        <div className="text-xs text-orange-950">
                                            <span className="font-bold text-sm text-orange-950">
                                                {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? 's' : ''} Selected
                                            </span>
                                            <p className="text-orange-800 mt-0.5">
                                                {bulkFeeOperation === 'increase'
                                                    ? 'Review before and increased fee rates for each scholar below.'
                                                    : bulkFeeOperation === 'decrease'
                                                    ? 'Review before and discounted fee rates for each scholar below.'
                                                    : 'Review before and fixed fee rates for each scholar below.'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-orange-500 text-white font-black text-xs rounded-xl shrink-0 shadow-xs">
                                        {selectedStudentIds.length} Selected
                                    </span>
                                </div>

                                {/* Controls: Adjustment Type & Amount */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className={LABEL}>Adjustment Type</label>
                                        <select
                                            value={bulkFeeOperation}
                                            onChange={(e) => setBulkFeeOperation(e.target.value)}
                                            className={INPUT}
                                        >
                                            <option value="increase">Increase Monthly Fee (+)</option>
                                            <option value="decrease">Decrease Monthly Fee (-)</option>
                                            <option value="set">Set Exact Fixed Fee (=)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={LABEL}>
                                            {bulkFeeOperation === 'increase'
                                                ? 'Amount to Add (₹) *'
                                                : bulkFeeOperation === 'decrease'
                                                ? 'Amount to Subtract (₹) *'
                                                : 'Exact Fixed Fee to Set (₹) *'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={bulkFeeAmount}
                                            onChange={(e) => setBulkFeeAmount(e.target.value)}
                                            className={INPUT}
                                            placeholder={bulkFeeOperation === 'set' ? 'e.g. 350' : 'e.g. 200'}
                                        />
                                    </div>
                                </div>

                                {/* Send Email Checkbox Option (Default: false / NOT sent) */}
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={bulkFeeSendEmail}
                                            onChange={(e) => setBulkFeeSendEmail(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                                        />
                                        <div className="flex-1 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">Send Email Notification to Students</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    bulkFeeSendEmail
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-slate-200/80 text-slate-600 border border-slate-300'
                                                }`}>
                                                    {bulkFeeSendEmail ? 'Email Will Be Sent' : 'Default: No Email'}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[11px] mt-0.5">
                                                {bulkFeeSendEmail
                                                    ? 'An email notice detailing the fee adjustment will be sent to students who have a registered email address.'
                                                    : 'Default is OFF. No emails will be sent to scholars unless you check this box.'}
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {/* Selected Scholars Table with Before Fee and Increased Fee */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-800">Selected Scholars & Fee Breakdown</span>
                                            <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">
                                                {selectedStudentIds.length} Total
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-500">
                                            {bulkFeeAmount
                                                ? (bulkFeeOperation === 'increase'
                                                    ? `Rate change: +₹${bulkFeeAmount}`
                                                    : bulkFeeOperation === 'decrease'
                                                    ? `Rate change: -₹${bulkFeeAmount}`
                                                    : `Fixed rate: ₹${bulkFeeAmount}`)
                                                : 'Enter amount above to preview new fee'}
                                        </span>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                                        {(() => {
                                            const selectedList = students.filter(s => selectedStudentIds.includes(s._id));
                                            if (selectedList.length === 0) {
                                                return (
                                                    <div className="p-6 text-center text-xs text-slate-400">
                                                        No scholars currently selected.
                                                    </div>
                                                );
                                            }

                                            return (
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-2.5">Student Name</th>
                                                            <th className="px-3 py-2.5">Desk / Shift</th>
                                                            <th className="px-3 py-2.5 text-right">Before Fee</th>
                                                            <th className="px-3 py-2.5 text-right">
                                                                {bulkFeeOperation === 'increase'
                                                                    ? 'Increased Fee'
                                                                    : bulkFeeOperation === 'decrease'
                                                                    ? 'Decreased Fee'
                                                                    : 'Fixed Fee'}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (excludedFeeManagementIds.length === selectedStudentIds.length) {
                                                                            setExcludedFeeManagementIds([]);
                                                                        } else {
                                                                            setExcludedFeeManagementIds([...selectedStudentIds]);
                                                                        }
                                                                    }}
                                                                    className="hover:text-orange-600 underline cursor-pointer"
                                                                    title="Click to toggle all in/out of Fee Management"
                                                                >
                                                                    In Fee Mgmt?
                                                                </button>
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">Email</th>
                                                            <th className="px-2 py-2.5 text-center"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 font-medium">
                                                        {selectedList.map((s) => {
                                                            const beforeFee = getStudentNumericFee(s);
                                                            const amountNum = parseInt(bulkFeeAmount, 10) || 0;
                                                            const newFee = bulkFeeOperation === 'increase'
                                                                ? beforeFee + amountNum
                                                                : bulkFeeOperation === 'decrease'
                                                                ? Math.max(0, beforeFee - amountNum)
                                                                : amountNum;
                                                            const seatDetails = getStudentSeatDetails(s._id);
                                                            const shiftsDisplay = getStudentShifts(s._id);
                                                            const isExcludedFromFees = excludedFeeManagementIds.includes(s._id);

                                                            return (
                                                                <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                                                                    <td className="px-4 py-2.5">
                                                                        <div className="font-bold text-slate-900">{s.name}</div>
                                                                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.email || 'No email'}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2.5">
                                                                        <div className="text-slate-700 font-semibold text-[11px]">
                                                                            {seatDetails ? `Desk ${seatDetails.seatNumber}` : 'No Desk'}
                                                                        </div>
                                                                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                                            {shiftsDisplay || '—'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right font-bold text-slate-700">
                                                                        ₹{beforeFee}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                                                                        {bulkFeeAmount ? (
                                                                            <span className={bulkFeeOperation === 'increase' ? 'text-orange-600' : bulkFeeOperation === 'decrease' ? 'text-blue-600' : 'text-emerald-700'}>
                                                                                ₹{newFee}
                                                                                <span className="text-[10px] font-normal text-slate-400 ml-1">
                                                                                    ({bulkFeeOperation === 'increase'
                                                                                        ? `+₹${amountNum}`
                                                                                        : bulkFeeOperation === 'decrease'
                                                                                        ? `-₹${amountNum}`
                                                                                        : 'fixed'})
                                                                                </span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-400 italic text-[11px]">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        <label className="inline-flex items-center justify-center gap-1 cursor-pointer" title="Include in Fee Management">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={!isExcludedFromFees}
                                                                                onChange={() => {
                                                                                    setExcludedFeeManagementIds(prev =>
                                                                                        prev.includes(s._id) ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                                                                    );
                                                                                }}
                                                                                className="w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                                            />
                                                                            <span className={`text-[10px] font-bold ${!isExcludedFromFees ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                                                {!isExcludedFromFees ? 'Show' : 'Hide'}
                                                                            </span>
                                                                        </label>
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        {bulkFeeSendEmail ? (
                                                                            s.email ? (
                                                                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                                                    Will Send
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                                                    No Email
                                                                                </span>
                                                                            )
                                                                        ) : (
                                                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                Not Sent (Default)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-2.5 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedStudentIds(prev => prev.filter(id => id !== s._id))}
                                                                            className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                                                            title="Remove student from bulk selection"
                                                                        >
                                                                            <IoClose size={14} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Instant Pending Fee Synchronization Notice */}
                                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
                                    <IoCheckmarkCircleOutline className="text-emerald-600 text-base shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Instant Pending Fee Sync in Fee Management:</span>
                                        <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                                            When applied, pending and overdue fee records for these students will instantly update to the new fee rate. If a student already paid and the fee is increased, only the increased due will display in Fee Management. If decreased, any overpayment is automatically cleared.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkFeeModal(false)}
                                        disabled={bulkFeeLoading}
                                        className={BTN_SECONDARY + ' flex-1'}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={bulkFeeLoading || !bulkFeeAmount || selectedStudentIds.length === 0}
                                        className={BTN_PRIMARY + ' flex-1'}
                                    >
                                        {bulkFeeLoading ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Applying Fee Adjustments...</span>
                                            </>
                                        ) : (
                                            `Apply ${bulkFeeOperation === 'increase' ? 'Increase' : bulkFeeOperation === 'decrease' ? 'Discount' : 'New Fee'} to ${selectedStudentIds.length} Scholar${selectedStudentIds.length !== 1 ? 's' : ''}`
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </Modal>

                    {/* Bulk Reset Passwords to Mobile Modal */}
                    <Modal
                        theme="light"
                        isOpen={showBulkResetModal}
                        onClose={() => !bulkResetLoading && setShowBulkResetModal(false)}
                        title="Bulk Credential Reset"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3.5 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-500/20">
                                    <IoLockClosedOutline size={22} />
                                </div>
                                <div className="text-xs min-w-0 flex-1">
                                    <h4 className="font-bold text-orange-950 text-sm">Reset Passwords to Mobile Number</h4>
                                    <p className="text-orange-800 mt-0.5">Applies system-wide to registered active students.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 flex items-start gap-2.5 font-medium">
                                <IoWarningOutline className="text-amber-600 text-base shrink-0 mt-0.5" />
                                <span>This action permanently overwrites student passwords. Students without registered 10-digit mobile numbers will be skipped automatically.</span>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-2">
                                <div className="flex items-center gap-2">
                                    <IoCheckmarkCircle size={14} className="text-emerald-600 shrink-0" />
                                    <span>Password resets to student's 10-digit registered mobile.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IoCheckmarkCircle size={14} className="text-emerald-600 shrink-0" />
                                    <span>Safe fallback: accounts without mobile numbers are left untouched.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IoCheckmarkCircle size={14} className="text-emerald-600 shrink-0" />
                                    <span>Students must sign in using their mobile number on their next session.</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowBulkResetModal(false)}
                                    disabled={bulkResetLoading}
                                    className={BTN_SECONDARY + ' flex-1'}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkResetPasswordsToMobile}
                                    disabled={bulkResetLoading}
                                    className={BTN_PRIMARY + ' flex-1'}
                                >
                                    {bulkResetLoading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Resetting Passwords...</span>
                                        </>
                                    ) : (
                                        'Confirm Bulk Reset'
                                    )}
                                </button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                TEMP SEAT ASSIGNMENT MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                theme="light"
                isOpen={showTempSeatModal && !!tempSeatStudent}
                onClose={() => { setShowTempSeatModal(false); setTempSeatList([]); setError(''); }}
                title="Temporary Desk Allocation"
            >
                {tempSeatStudent && (
                    <div className="space-y-4">
                        {/* Student Context Header */}
                        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-orange-500/20">
                                {tempSeatStudent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{tempSeatStudent.name}</h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        Temporary Desk
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{tempSeatStudent.email || tempSeatStudent.mobile}</p>
                            </div>
                        </div>

                        {/* Active Temporary Seats Section */}
                        <div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Active Temporary Allocations</span>
                            {tempSeatLoading ? (
                                <div className="text-center py-6 text-slate-400 text-xs font-medium">Checking active temp assignments...</div>
                            ) : tempSeatList.length > 0 ? (
                                <div className="space-y-2">
                                    {tempSeatList.map(ta => (
                                        <div key={ta._id} className="flex items-center justify-between gap-3 bg-amber-50/70 border border-amber-200 rounded-xl px-3.5 py-2.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <IoBedOutline size={18} className="text-amber-600 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 text-xs">
                                                        Desk {ta.seat?.number} — <span className="text-amber-800">{ta.shift?.name}</span>
                                                    </p>
                                                    <p className="text-slate-500 text-[10px]">{ta.shift?.startTime} – {ta.shift?.endTime} {ta.originalOwner ? `• Owner: ${ta.originalOwner.name}` : ''}</p>
                                                    {ta.note && <p className="text-slate-400 text-[10px] italic truncate">{ta.note}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeTempSeat(ta._id)}
                                                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg transition-all shadow-2xs hover:border-rose-300"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-xs font-medium">No temporary desks currently allocated to this student.</p>
                                </div>
                            )}
                        </div>

                        {/* Assign New Temp Seat Form */}
                        <form onSubmit={handleCreateTempSeat} className="space-y-3 bg-orange-50/40 border border-orange-200/70 rounded-xl p-3.5">
                            <span className="text-xs font-bold text-orange-950 uppercase tracking-wider block">Allocate New Temporary Desk</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>Desk *</label>
                                    <select
                                        required
                                        value={tempForm.seatId}
                                        onChange={e => setTempForm(p => ({ ...p, seatId: e.target.value }))}
                                        className={INPUT}
                                    >
                                        <option value="">Select desk...</option>
                                        {availableSeats.map(s => (
                                            <option key={s._id} value={s._id}>{s.displayName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL}>Shift Window *</label>
                                    <select
                                        required
                                        value={tempForm.shiftId}
                                        onChange={e => setTempForm(p => ({ ...p, shiftId: e.target.value }))}
                                        className={INPUT}
                                    >
                                        <option value="">Select shift...</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>Absent Owner (Optional)</label>
                                    <select
                                        value={tempForm.originalOwnerId}
                                        onChange={e => setTempForm(p => ({ ...p, originalOwnerId: e.target.value }))}
                                        className={INPUT}
                                    >
                                        <option value="">None / Unassigned</option>
                                        {students.filter(s => s.isActive && s._id !== tempSeatStudent._id).map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL}>Valid Until (Optional)</label>
                                    <input
                                        type="date"
                                        value={tempForm.endDate}
                                        onChange={e => setTempForm(p => ({ ...p, endDate: e.target.value }))}
                                        className={INPUT}
                                        style={{ colorScheme: 'light' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={LABEL}>Assignment Note</label>
                                <input
                                    type="text"
                                    value={tempForm.note}
                                    placeholder="e.g. Regular occupant on exam leave until Monday"
                                    onChange={e => setTempForm(p => ({ ...p, note: e.target.value }))}
                                    className={INPUT}
                                />
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                                    <IoAlertCircleOutline size={14} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={tempSeatLoading}
                                className={BTN_PRIMARY + ' w-full'}
                            >
                                {tempSeatLoading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Allocating...</span>
                                    </>
                                ) : (
                                    <>
                                        <IoBedOutline size={15} />
                                        <span>Assign Temporary Desk</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════
                SPLIT SEAT ASSIGNMENT MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                theme="light"
                isOpen={showSplitModal && !!splitStudent}
                onClose={() => { setShowSplitModal(false); setError(''); }}
                title="Split Desk Schedule Configuration"
            >
                {splitStudent && (
                    <form onSubmit={handleSplitAssign} className="space-y-4">
                        {/* Student Context Header */}
                        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-orange-500/20">
                                {splitStudent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{splitStudent.name}</h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                        Multi-Shift Desk Matrix
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{splitStudent.email || splitStudent.mobile}</p>
                            </div>
                        </div>

                        <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3 text-xs text-orange-900 font-medium">
                            Configure distinct desk numbers for each shift window. The student will occupy Desk A for Shift 1 and Desk B for Shift 2.
                        </div>

                        {/* Pair Rows */}
                        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                            {splitPairs.map((pair, i) => (
                                <div key={i} className="border border-slate-200 bg-slate-50/60 rounded-xl p-3 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Slot {i + 1} Assignment</span>
                                        {splitPairs.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setSplitPairs(p => p.filter((_, idx) => idx !== i))}
                                                className="text-rose-500 hover:text-rose-700 text-xs font-bold transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className={LABEL}>Desk *</label>
                                            <select
                                                required
                                                value={pair.seatId}
                                                onChange={e => setSplitPairs(p => p.map((x, idx) => idx === i ? { ...x, seatId: e.target.value } : x))}
                                                className={INPUT}
                                            >
                                                <option value="">Select desk...</option>
                                                {availableSeats.filter(s => !s.isFullyBooked).map(s => (
                                                    <option key={s._id} value={s._id}>{s.displayName || `${s.floorName} - ${s.roomName} - ${s.number}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={LABEL}>Shift *</label>
                                            <select
                                                required
                                                value={pair.shiftId}
                                                onChange={e => setSplitPairs(p => p.map((x, idx) => idx === i ? { ...x, shiftId: e.target.value } : x))}
                                                className={INPUT}
                                            >
                                                <option value="">Select shift...</option>
                                                {shifts.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={LABEL}>Rate (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={pair.price}
                                                placeholder="0"
                                                onChange={e => setSplitPairs(p => p.map((x, idx) => idx === i ? { ...x, price: e.target.value } : x))}
                                                className={INPUT}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add more pairs */}
                        {splitPairs.length < 4 && (
                            <button
                                type="button"
                                onClick={() => setSplitPairs(p => [...p, { seatId: '', shiftId: '', price: '' }])}
                                className="w-full py-2.5 border border-dashed border-orange-300 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50 text-orange-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                                <IoAdd size={16} />
                                <span>Add Additional Shift Window</span>
                            </button>
                        )}

                        {error && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                                <IoAlertCircleOutline size={14} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowSplitModal(false); setError(''); }}
                                className={BTN_SECONDARY + ' flex-1'}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={splitLoading}
                                className={BTN_PRIMARY + ' flex-1'}
                            >
                                {splitLoading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Configuring...</span>
                                    </>
                                ) : (
                                    <>
                                        <IoGitBranch size={15} />
                                        <span>Confirm Split Matrix</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ─── Scholar Activity & Status History Modal ─────────────────── */}
            <Modal
                theme="light"
                isOpen={showActivityModal}
                onClose={() => {
                    setShowActivityModal(false);
                    setActivityStudent(null);
                    setActivityTimeline([]);
                }}
                title="Scholar Activity & Status History"
                maxWidth="max-w-2xl"
                accentColor="from-orange-500 via-amber-500 to-indigo-600"
            >
                {activityStudent && (
                    <div className="space-y-4">
                        {/* Scholar Summary Card */}
                        <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200/90 rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                                        <img
                                            src={(() => {
                                                const img = (!activityStudent.profileImage || activityStudent.profileImage === '/uploads/avatars/avatar1.svg')
                                                    ? getDeterministicAvatar(activityStudent._id, activityStudent.gender)
                                                    : activityStudent.profileImage;
                                                return img.startsWith('http') ? img : `${BASE_URL}${img}`;
                                            })()}
                                            alt={activityStudent.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-extrabold text-base text-slate-900 truncate">
                                                {activityStudent.name}
                                            </h3>
                                            {activityStudent.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>Active Scholar</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                                    <span>Inactive Scholar</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                            <span>{activityStudent.email || 'No email registered'}</span>
                                            <span>•</span>
                                            <span>{activityStudent.mobile || 'No mobile number'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-xs">
                                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission</span>
                                    <span className="font-bold text-slate-800">
                                        {new Date(activityStudent.admissionDate || activityStudent.createdAt || activityStudent.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Desk Seat</span>
                                    <span className="font-bold text-slate-800">
                                        {getStudentSeatDetails(activityStudent._id)?.seatNumber ? `Desk ${getStudentSeatDetails(activityStudent._id).seatNumber}` : 'Unallocated'}
                                    </span>
                                </div>
                                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee Rate</span>
                                    <span className="font-bold text-emerald-600">
                                        {getStudentFee(activityStudent)}
                                    </span>
                                </div>
                                <div className="bg-white/90 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ledger Status</span>
                                    <span className={`font-bold ${activityStudent.showInFeeManagement !== false ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {activityStudent.showInFeeManagement !== false ? 'Ledger Visible' : 'Ledger Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Category Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { key: 'all', label: 'All History', count: activityTimeline.length },
                                { key: 'Status', label: 'Status & Lifecycle', count: activityTimeline.filter(t => t.category === 'Status' || t.category === 'Lifecycle').length },
                                { key: 'Payment', label: 'Fee Payments', count: activityTimeline.filter(t => t.category === 'Payment').length },
                                { key: 'Fee', label: 'Fee Adjustments', count: activityTimeline.filter(t => t.category === 'Fee').length },
                                { key: 'Desk', label: 'Desk Changes', count: activityTimeline.filter(t => t.category === 'Desk').length }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActivityCategoryFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        activityCategoryFilter === tab.key
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/80'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                        activityCategoryFilter === tab.key
                                            ? 'bg-white/25 text-white'
                                            : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Timeline Body */}
                        {activityLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-semibold">Loading scholar timeline records...</p>
                            </div>
                        ) : activityTimeline.length === 0 ? (
                            <div className="py-14 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                                    <IoTimeOutline size={24} />
                                </div>
                                <h4 className="font-bold text-sm text-slate-800">No Activity Recorded</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                    There are no activity logs or status transitions recorded for this scholar yet.
                                </p>
                            </div>
                        ) : (
                            <div className="relative pl-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-slate-200">
                                {activityTimeline
                                    .filter(item => {
                                        if (activityCategoryFilter === 'all') return true;
                                        if (activityCategoryFilter === 'Status') return item.category === 'Status' || item.category === 'Lifecycle';
                                        return item.category === activityCategoryFilter;
                                    })
                                    .map((item, idx) => (
                                        <div key={item.id || idx} className="relative group/timeline flex items-start gap-3">
                                            {/* Node Icon */}
                                            <div className={`relative z-10 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center shrink-0 mt-1 ${
                                                item.category === 'Status'
                                                    ? (item.action.includes('deactivated') || item.action.includes('deleted') ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white')
                                                    : item.category === 'Payment'
                                                        ? 'bg-emerald-500 text-white'
                                                        : item.category === 'Fee'
                                                            ? 'bg-amber-500 text-white'
                                                            : item.category === 'Desk'
                                                                ? 'bg-indigo-500 text-white'
                                                                : 'bg-blue-500 text-white'
                                            }`}>
                                                {item.category === 'Status' ? (
                                                    item.action.includes('deactivated') || item.action.includes('deleted') ? <IoTrashOutline size={12} /> : <IoCheckmarkCircle size={12} />
                                                ) : item.category === 'Payment' ? (
                                                    <IoCashOutline size={12} />
                                                ) : item.category === 'Fee' ? (
                                                    <IoReceiptOutline size={12} />
                                                ) : item.category === 'Desk' ? (
                                                    <IoBedOutline size={12} />
                                                ) : (
                                                    <IoTimeOutline size={12} />
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs group-hover/timeline:border-orange-300 transition-all">
                                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badge || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                            {item.category}
                                                        </span>
                                                        <h4 className="font-bold text-xs text-slate-900">
                                                            {item.title}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-400">
                                                        {new Date(item.timestamp).toLocaleString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </span>
                                                </div>

                                                {item.details && (
                                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 font-medium">
                                                        {item.details}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                                    <span>Admin: <strong className="text-slate-600">{item.adminName || 'Admin / System'}</strong></span>
                                                    <span className="text-slate-300 font-mono text-[9px] uppercase">{item.action}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowActivityModal(false);
                                    setActivityStudent(null);
                                    setActivityTimeline([]);
                                }}
                                className={BTN_SECONDARY}
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default StudentManagement;
