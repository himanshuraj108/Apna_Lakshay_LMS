import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';
import {
    IoArrowBack,
    IoCashOutline,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoTimeOutline,
    IoAlertCircleOutline,
    IoFilterOutline,
    IoDownloadOutline,
    IoWalletOutline,
    IoGridOutline,
    IoListOutline,
    IoReceiptOutline,
    IoSearchOutline,
    IoSparkles,
    IoClose,
    IoCardOutline,
    IoCheckmark,
    IoPersonOutline,
    IoCallOutline,
    IoLocationOutline,
    IoLockClosedOutline,
    IoCalendarOutline,
    IoSaveOutline,
    IoCreateOutline,
    IoDocumentTextOutline,
    IoPrintOutline
} from 'react-icons/io5';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useBackPath from '../../hooks/useBackPath';
import { useAuth } from '../../context/AuthContext';
import { PrimaryLogoLoader } from '../../components/ui/SkeletonLoader';
import PaymentReceipt from '../../components/admin/PaymentReceipt';
import Modal from '../../components/ui/Modal';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getStudentAvatarSrc = (student) => {
    if (!student) return null;
    const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
        ? getDeterministicAvatar(student._id, student.gender)
        : student.profileImage;
    if (!img) return null;
    return img.startsWith('http') ? img : `${BASE_URL}${img}`;
};

const FeeManagement = () => {
    const backPath = useBackPath();
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'subadmin';

    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
    const [filter, setFilter] = useState(isSubAdmin ? 'pending_partial' : 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [sortBy, setSortBy] = useState('dueDate_asc');
    const [showInactive, setShowInactive] = useState(false);
    const [monthlyFilter, setMonthlyFilter] = useState(false); // true = show only this month's fees
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Advance Payment state
    const [advanceRoster, setAdvanceRoster] = useState([]);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [advanceModal, setAdvanceModal] = useState(null); // student object from roster
    const [advanceForm, setAdvanceForm] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: 0,
        dueDate: '',
        action: 'advance_paid',
        note: '',
        sendEmail: true
    });
    const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
    const [advanceSuccess, setAdvanceSuccess] = useState(null);

    // Payment modal state
    const [payModal, setPayModal] = useState(null); // { fee } or null
    const [payType, setPayType] = useState('full');  // 'full' | 'partial' | 'cancel'
    const [partialAmt, setPartialAmt] = useState('');
    const [payLoading, setPayLoading] = useState(false);

    // Official Receipt Studio Modal state
    const [receiptModal, setReceiptModal] = useState(null); // { fee, student, slNo } or null
    const [receiptForm, setReceiptForm] = useState({
        name: '',
        fatherName: '',
        dob: '',
        seatNo: '',
        shiftName: '',
        mobile: '',
        aadharNo: '',
        address: '',
        registrationFee: 0,
        lockerNo: '',
        monthlyFee: 0,
        due: 0,
        total: 0,
        slNo: 101,
        paidDate: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
    const [saveProfileError, setSaveProfileError] = useState('');

    // PDF Export Modal state
    const [pdfModalOpen, setPdfModalOpen] = useState(false);

    // Bulk Receipt Download Modal state
    const [bulkReceiptOpen, setBulkReceiptOpen] = useState(false);
    const [bulkFilter, setBulkFilter] = useState({
        mode: 'month', // 'month' | 'year' | 'range' | 'student'
        month: String(new Date().getMonth() + 1),
        year: String(new Date().getFullYear()),
        dateFrom: '',
        dateTo: '',
        studentId: 'all',
        statusFilter: 'paid', // 'paid' | 'partial' | 'both'
    });
    const [bulkGenerating, setBulkGenerating] = useState(false);
    const [bulkRenderList, setBulkRenderList] = useState([]); // receipts waiting to be html2canvas'd
    const bulkReceiptRefs = useRef([]);
    // Quick per-card download (PDF / PNG / Print) without opening modal
    const [quickDlFee, setQuickDlFee] = useState(null); // { fee, action:'pdf'|'png'|'print', customData }
    const quickDlRef = useRef(null);
    const [selectedColumns, setSelectedColumns] = useState({
        name: true,
        email: true,
        seat: true,
        cycle: true,
        amount: true,
        dueDate: true,
        status: true,
        paidDate: true
    });

    const [floors, setFloors] = useState([]);

    const floorSeatMap = useMemo(() => {
        const map = {};
        if (!floors || !floors.length) return map;
        floors.forEach(floor => {
            (floor.rooms || []).forEach(room => {
                (room.seats || []).forEach(seat => {
                    (seat.assignments || []).forEach(a => {
                        if (a.status === 'active' && a.student) {
                            const sid = String(typeof a.student === 'object' ? (a.student._id || a.student) : a.student);
                            if (!map[sid]) {
                                map[sid] = {
                                    seatNumber: seat.number,
                                    shiftName: a.shift?.name || a.legacyShift || (a.type === 'full_day' ? 'Full Day' : 'Full Shift'),
                                    roomName: room.name || ''
                                };
                            }
                        }
                    });
                    if (seat.assignedTo) {
                        const sid = String(typeof seat.assignedTo === 'object' ? (seat.assignedTo._id || seat.assignedTo) : seat.assignedTo);
                        if (!map[sid]) {
                            map[sid] = {
                                seatNumber: seat.number,
                                shiftName: 'Standard Shift',
                                roomName: room.name || ''
                            };
                        }
                    }
                });
            });
        });
        return map;
    }, [floors]);

    const getStudentSeatInfo = (student) => {
        if (!student) return { seatNumber: '', shiftName: 'Standard Shift', roomName: '' };
        const sid = student._id ? String(student._id) : '';
        const fromFloor = floorSeatMap[sid];

        const seatNumber = student.seatNumber ||
            (typeof student.seat === 'object' && student.seat ? (student.seat.number || student.seat.seatNumber) : '') ||
            fromFloor?.seatNumber ||
            '';

        const shiftName = student.shiftName ||
            (typeof student.shift === 'object' && student.shift?.name ? student.shift.name : (typeof student.shift === 'string' ? student.shift : '')) ||
            fromFloor?.shiftName ||
            'Standard Shift';

        const roomName = student.roomName ||
            (typeof student.seat === 'object' && student.seat?.room?.name ? student.seat.room.name : '') ||
            fromFloor?.roomName ||
            '';

        return { seatNumber, shiftName, roomName };
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const [feesRes, settingsRes, floorsRes, advanceRes] = await Promise.all([
                api.get('/admin/fees'),
                api.get('/admin/settings'),
                api.get('/admin/floors').catch(() => ({ data: { floors: [] } })),
                api.get('/admin/fees/advance-roster').catch(() => ({ data: { roster: [] } }))
            ]);
            setFees(feesRes.data?.fees || []);
            setOnlinePaymentEnabled(settingsRes.data?.settings?.onlinePaymentEnabled !== false);
            setFloors(floorsRes.data?.floors || []);
            setAdvanceRoster(advanceRes.data?.roster || []);
        } catch (e) {
            setError('Failed to load fee ledger records.');
        } finally {
            setLoading(false);
        }
    };

    const openAdvanceModal = (studentItem) => {
        const next = studentItem.nextUpcoming || {};
        const defaultMonth = next.month || (new Date().getMonth() + 1);
        const defaultYear = next.year || new Date().getFullYear();
        const defaultAmount = next.suggestedAmount || studentItem.suggestedAmount || 0;

        let defaultDueDateStr = '';
        if (next.dueDate) {
            const d = new Date(next.dueDate);
            defaultDueDateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
        }

        setAdvanceForm({
            month: defaultMonth,
            year: defaultYear,
            amount: defaultAmount,
            dueDate: defaultDueDateStr,
            action: 'advance_paid',
            note: '',
            sendEmail: true
        });
        setAdvanceSuccess(null);
        setError('');
        setAdvanceModal(studentItem);
    };

    const handleAdvancePeriodChange = (newMonth, newYear) => {
        const m = Number(newMonth);
        const y = Number(newYear);
        const billingDay = advanceModal?.billingDay || 1;
        const cycleEnd = new Date(y, m, billingDay - 1);
        const dueDateStr = !isNaN(cycleEnd.getTime()) ? cycleEnd.toISOString().split('T')[0] : '';

        setAdvanceForm(prev => ({
            ...prev,
            month: m,
            year: y,
            dueDate: dueDateStr
        }));
    };

    const handleRecordAdvance = async (e) => {
        if (e) e.preventDefault();
        if (!advanceModal) return;
        if (!advanceForm.amount || Number(advanceForm.amount) <= 0) {
            setError('Please enter a valid fee amount.');
            return;
        }

        setAdvanceSubmitting(true);
        setError('');
        try {
            const payload = {
                studentId: advanceModal._id,
                month: Number(advanceForm.month),
                year: Number(advanceForm.year),
                amount: Number(advanceForm.amount),
                dueDate: advanceForm.dueDate || undefined,
                action: advanceForm.action,
                note: advanceForm.note,
                sendEmail: advanceForm.sendEmail
            };

            const res = await api.post('/admin/fees/advance-due', payload);
            const savedFee = res.data?.fee;
            setSuccess(res.data?.message || 'Advance transaction processed successfully.');
            setAdvanceSuccess({
                message: res.data?.message,
                fee: savedFee,
                student: advanceModal,
                action: advanceForm.action
            });

            await fetchFees();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process advance due.');
        } finally {
            setAdvanceSubmitting(false);
        }
    };

    const toggleOnlinePayment = async () => {
        try {
            const newValue = !onlinePaymentEnabled;
            setOnlinePaymentEnabled(newValue);
            await api.put('/admin/settings', { onlinePaymentEnabled: newValue });
            setSuccess(`Online gateway payments ${newValue ? 'activated' : 'deactivated'}!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setOnlinePaymentEnabled(!onlinePaymentEnabled);
            setError('Failed to update payment settings');
            setTimeout(() => setError(''), 3000);
        }
    };

    const openPayModal = (fee) => {
        setPayModal(fee);
        setPayType('full');
        setPartialAmt('');
        setError('');
    };

    const closePayModal = () => {
        setPayModal(null);
        setPayType('full');
        setPartialAmt('');
        setError('');
    };

    const handleMarkPaid = async () => {
        if (!payModal) return;
        setPayLoading(true);
        try {
            if (payType === 'full') {
                await api.put(`/admin/fees/${payModal._id}/paid`);
                setSuccess('Fee marked as fully settled!');
            } else if (payType === 'cancel') {
                await api.put(`/admin/fees/${payModal._id}/cancelled`);
                setSuccess('Fee invoice cancelled successfully.');
            } else {
                if (!partialAmt || isNaN(partialAmt) || Number(partialAmt) <= 0) {
                    setError('Please enter a valid partial amount.');
                    setPayLoading(false);
                    return;
                }
                const res = await api.put(`/admin/fees/${payModal._id}/partial`, { partialAmount: Number(partialAmt) });
                setSuccess(res.data?.message || 'Partial payment installment recorded!');
            }
            closePayModal();
            fetchFees();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            setError(e.response?.data?.message || 'Payment operation failed.');
            setTimeout(() => setError(''), 4000);
        } finally {
            setPayLoading(false);
        }
    };

    const openReceiptModal = (fee, student, slNo) => {
        const defaultDate = fee.paidDate 
            ? new Date(fee.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

        const defaultDob = student?.dob
            ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '';

        const regFee = fee.registrationFee || student?.registrationFee || 0;
        const dueAmt = fee.due || (fee.status === 'partial' ? (fee.outstanding || (fee.amount - (fee.partialPaid || 0))) : 0);
        const monthly = fee.amount || 0;
        const seatInfo = getStudentSeatInfo(student);

        setReceiptForm({
            name: student?.name || '',
            fatherName: student?.fatherName || student?.guardianName || '',
            dob: defaultDob,
            seatNo: seatInfo.seatNumber,
            shiftName: seatInfo.shiftName,
            mobile: student?.mobile || '',
            aadharNo: student?.aadharNo || student?.idNumber || '',
            address: student?.address || '',
            registrationFee: regFee,
            lockerNo: fee.lockerNo || student?.lockerNo || '',
            monthlyFee: monthly,
            due: dueAmt,
            total: monthly + regFee - dueAmt,
            slNo: slNo || 101,
            paidDate: defaultDate
        });
        setSaveSuccessMsg('');
        setSaveProfileError('');
        setReceiptModal({ fee, student, slNo });
    };

    const handleSaveReceiptProfile = async () => {
        if (!receiptModal?.student?._id) return;
        setSavingProfile(true);
        setSaveSuccessMsg('');
        setSaveProfileError('');
        try {
            await api.put(`/admin/students/${receiptModal.student._id}`, {
                name: receiptForm.name,
                fatherName: receiptForm.fatherName,
                dob: receiptForm.dob ? new Date(receiptForm.dob) : undefined,
                aadharNo: receiptForm.aadharNo,
                mobile: receiptForm.mobile,
                address: receiptForm.address,
                lockerNo: receiptForm.lockerNo,
                registrationFee: Number(receiptForm.registrationFee) || 0
            });

            // Update in local fees array
            setFees(prev => prev.map(f => {
                if (f.student?._id === receiptModal.student._id) {
                    return {
                        ...f,
                        student: {
                            ...f.student,
                            name: receiptForm.name,
                            fatherName: receiptForm.fatherName,
                            dob: receiptForm.dob,
                            aadharNo: receiptForm.aadharNo,
                            mobile: receiptForm.mobile,
                            address: receiptForm.address,
                            lockerNo: receiptForm.lockerNo,
                            registrationFee: Number(receiptForm.registrationFee) || 0
                        }
                    };
                }
                return f;
            }));

            setSaveSuccessMsg('Saved permanently to student profile!');
            setTimeout(() => setSaveSuccessMsg(''), 4000);
        } catch (err) {
            setSaveProfileError(err.response?.data?.message || 'Failed to save to student profile.');
            setTimeout(() => setSaveProfileError(''), 4000);
        } finally {
            setSavingProfile(false);
        }
    };

    // Active enrolled students
    const activeStudentFees = useMemo(() => {
        return fees.filter(f => f.student && f.student.isActive !== false);
    }, [fees]);

    // Fees visible in normal ledger (showInFeeManagement !== false)
    const visibleFees = useMemo(() => {
        return activeStudentFees.filter(f => f.student?.showInFeeManagement !== false);
    }, [activeStudentFees]);

    // Base roster currently under display in Fee Management
    const baseFees = visibleFees;

    // Financial KPI Metrics calculated across visible ledger roster
    const metrics = useMemo(() => {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Start of current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Month name for subtext
        const monthName = now.toLocaleString('en-IN', { month: 'long' });

        const totalRevenue = visibleFees.reduce((sum, f) => {
            if (f.status === 'paid') return sum + (f.amount || 0);
            if (f.status === 'partial') return sum + (f.partialPaid || 0);
            return sum;
        }, 0);

        const todayRevenue = visibleFees.reduce((sum, f) => {
            if (!f.paidDate) return sum;
            const pd = new Date(f.paidDate);
            if (pd < today) return sum;
            if (f.status === 'paid') return sum + (f.amount || 0);
            if (f.status === 'partial') return sum + (f.partialPaid || 0);
            return sum;
        }, 0);

        const monthlyRevenue = visibleFees.reduce((sum, f) => {
            if (!f.paidDate) return sum;
            const pd = new Date(f.paidDate);
            if (pd < startOfMonth) return sum;
            if (f.status === 'paid') return sum + (f.amount || 0);
            if (f.status === 'partial') return sum + (f.partialPaid || 0);
            return sum;
        }, 0);

        const totalPending = visibleFees.reduce((sum, f) => {
            if (f.status === 'pending') return sum + (f.amount || 0);
            if (f.status === 'partial') return sum + (f.outstanding || (f.amount - (f.partialPaid || 0)));
            return sum;
        }, 0);

        const totalOverdue = visibleFees
            .filter(f => f.status === 'overdue')
            .reduce((sum, f) => sum + (f.amount || 0), 0);

        const onlineVolume = visibleFees
            .filter(f => f.razorpayPaymentId && f.status === 'paid')
            .reduce((sum, f) => sum + (f.amount || 0), 0);

        const counts = {
            all: visibleFees.length,
            paid: visibleFees.filter(f => f.status === 'paid').length,
            online: visibleFees.filter(f => f.razorpayOrderId).length,
            pending: visibleFees.filter(f => f.status === 'pending').length,
            partial: visibleFees.filter(f => f.status === 'partial').length,
            pending_partial: visibleFees.filter(f => f.status === 'pending' || f.status === 'partial').length,
            overdue: visibleFees.filter(f => f.status === 'overdue').length,
            cancelled: visibleFees.filter(f => f.status === 'cancelled').length
        };

        return { totalRevenue, todayRevenue, monthlyRevenue, monthName, totalPending, totalOverdue, onlineVolume, counts };
    }, [visibleFees]);


    // Filtered & Searched & Sorted records
    const processedFees = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return baseFees
            .filter(fee => {
                if (monthlyFilter) {
                    if (!fee.paidDate) return false;
                    const pd = new Date(fee.paidDate);
                    return pd >= startOfMonth && (fee.status === 'paid' || fee.status === 'partial');
                }
                if (filter === 'paid') return fee.status === 'paid';
                if (filter === 'online') return !!fee.razorpayOrderId;
                if (filter === 'partial') return fee.status === 'partial';
                if (filter === 'pending') return fee.status === 'pending';
                if (filter === 'pending_partial') return fee.status === 'pending' || fee.status === 'partial';
                if (filter === 'overdue') return fee.status === 'overdue';
                if (filter === 'cancelled') return fee.status === 'cancelled';
                return true;
            })
            .filter(fee => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                const name = fee.student?.name?.toLowerCase() || '';
                const email = fee.student?.email?.toLowerCase() || '';
                const mobile = fee.student?.mobile?.toLowerCase() || '';
                const seatInfo = getStudentSeatInfo(fee.student);
                const seat = (seatInfo.seatNumber || '').toString().toLowerCase();
                const rzp = fee.razorpayOrderId?.toLowerCase() || '';
                return name.includes(q) || email.includes(q) || mobile.includes(q) || seat.includes(q) || rzp.includes(q);
            })
            .sort((a, b) => {
                if (sortBy === 'dueDate_asc') return new Date(a.dueDate) - new Date(b.dueDate);
                if (sortBy === 'dueDate_desc') return new Date(b.dueDate) - new Date(a.dueDate);
                if (sortBy === 'amount_desc') return (b.amount || 0) - (a.amount || 0);
                if (sortBy === 'amount_asc') return (a.amount || 0) - (b.amount || 0);
                if (sortBy === 'name_asc') return (a.student?.name || '').localeCompare(b.student?.name || '');
                return 0;
            });
    }, [baseFees, filter, monthlyFilter, searchQuery, sortBy]);

    // Filtered Advance Roster for Advance Payment tab
    const filteredAdvanceRoster = useMemo(() => {
        if (!searchQuery.trim()) return advanceRoster;
        const q = searchQuery.toLowerCase().trim();
        return advanceRoster.filter(item => {
            const name = (item.name || '').toLowerCase();
            const email = (item.email || '').toLowerCase();
            const mobile = (item.mobile || '').toLowerCase();
            const stuId = (item.studentId || '').toLowerCase();
            const seat = (item.seatNumber || '').toString().toLowerCase();
            const room = (item.roomName || '').toLowerCase();
            return name.includes(q) || email.includes(q) || mobile.includes(q) || stuId.includes(q) || seat.includes(q) || room.includes(q);
        });
    }, [advanceRoster, searchQuery]);

    const TABS = isSubAdmin ? [
        { key: 'pending_partial', label: 'Unpaid Dues', count: metrics.counts.pending_partial },
        { key: 'advance',         label: 'Advance Payment', count: advanceRoster.length, isLocked: true },
    ] : [
        { key: 'all',       label: 'All Invoices',  count: metrics.counts.all },
        { key: 'paid',      label: 'Settled Paid',  count: metrics.counts.paid },
        ...(onlinePaymentEnabled ? [{ key: 'online', label: 'Online Gateway', count: metrics.counts.online }] : []),
        { key: 'advance',   label: 'Advance Payment', count: advanceRoster.length },
        { key: 'pending',   label: 'Pending Dues',  count: metrics.counts.pending },
        { key: 'partial',   label: 'Partial Pay',   count: metrics.counts.partial },
        { key: 'overdue',   label: 'Overdue Risk',  count: metrics.counts.overdue },
        { key: 'cancelled', label: 'Void Cancelled', count: metrics.counts.cancelled }
    ];

    useEffect(() => {
        if (isSubAdmin && filter !== 'pending_partial') {
            setFilter('pending_partial');
        } else if (!onlinePaymentEnabled && filter === 'online') {
            setFilter('all');
        }
    }, [onlinePaymentEnabled, filter, isSubAdmin]);

    const getStatusTheme = (status) => {
        switch (status) {
            case 'paid':
                return {
                    badge: 'text-emerald-700 bg-emerald-50 border-emerald-200/90',
                    bar: 'bg-emerald-500',
                    label: 'Paid'
                };
            case 'partial':
                return {
                    badge: 'text-amber-700 bg-amber-50 border-amber-200/90',
                    bar: 'bg-amber-500',
                    label: 'Partial'
                };
            case 'overdue':
                return {
                    badge: 'text-rose-700 bg-rose-50 border-rose-200/90',
                    bar: 'bg-rose-500',
                    label: 'Overdue'
                };
            case 'cancelled':
                return {
                    badge: 'text-slate-600 bg-slate-100 border-slate-200/90',
                    bar: 'bg-slate-400',
                    label: 'Cancelled'
                };
            default:
                return {
                    badge: 'text-orange-700 bg-orange-50 border-orange-200/90',
                    bar: 'bg-orange-500',
                    label: 'Pending'
                };
        }
    };

    const generateFeeTablePDF = () => {
        const doc = new jsPDF('landscape');

        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text('Apna Lakshya LMS - Fee Ledger Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Main Campus (Sitamarhi) · Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 27);
        doc.text(`Filter: ${filter.toUpperCase()} · Records: ${processedFees.length}`, 14, 33);

        const cols = [];
        if (selectedColumns.name) cols.push({ header: 'Student Name', index: 0 });
        if (selectedColumns.email) cols.push({ header: 'Email', index: 1 });
        if (selectedColumns.seat) cols.push({ header: 'Desk Seat', index: 2 });
        if (selectedColumns.cycle) cols.push({ header: 'Billing Cycle', index: 3 });
        if (selectedColumns.amount) cols.push({ header: 'Amount (Rs)', index: 4 });
        if (selectedColumns.dueDate) cols.push({ header: 'Due Date', index: 5 });
        if (selectedColumns.status) cols.push({ header: 'Status', index: 6 });
        if (selectedColumns.paidDate) cols.push({ header: 'Paid Date', index: 7 });

        const tableColumn = cols.map(c => c.header);
        const tableRows = [];

        processedFees.forEach(fee => {
            const cycleStart = new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const cycleEnd = new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
            const seatInfo = getStudentSeatInfo(fee.student);
            const seatNumber = seatInfo.seatNumber || 'N/A';

            const fullRow = [
                fee.student?.name || 'Unknown',
                fee.student?.email || 'N/A',
                seatNumber !== 'N/A' ? `Desk #${seatNumber}` : 'Unassigned',
                `${cycleStart} - ${cycleEnd}`,
                `Rs. ${fee.amount}`,
                new Date(fee.dueDate).toLocaleDateString('en-IN'),
                fee.status.toUpperCase(),
                fee.status === 'paid' && fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-IN') : '-'
            ];

            tableRows.push(cols.map(c => fullRow[c.index]));
        });

        const columnStyles = {};
        cols.forEach((col, visualIndex) => {
            if (col.index === 4) columnStyles[visualIndex] = { halign: 'right', fontStyle: 'bold' };
            if (col.index === 6) columnStyles[visualIndex] = { halign: 'center', fontStyle: 'bold' };
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 3.5 },
            headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles
        });

        doc.save(`Fee_Ledger_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // ── Bulk Receipt Download — filter & prepare render list ──────────
    const generateBulkReceiptsPDF = () => {
        // 1. Filter fees by status
        let toDownload = fees.filter(f => f.student && f.student.isActive !== false);
        if (bulkFilter.statusFilter === 'paid') toDownload = toDownload.filter(f => f.status === 'paid');
        else if (bulkFilter.statusFilter === 'partial') toDownload = toDownload.filter(f => f.status === 'partial');
        else toDownload = toDownload.filter(f => f.status === 'paid' || f.status === 'partial');

        // 2. Date/student filter
        if (bulkFilter.mode === 'month') {
            toDownload = toDownload.filter(f => String(f.month) === String(bulkFilter.month) && String(f.year) === String(bulkFilter.year));
        } else if (bulkFilter.mode === 'year') {
            toDownload = toDownload.filter(f => String(f.year) === String(bulkFilter.year));
        } else if (bulkFilter.mode === 'range') {
            const from = bulkFilter.dateFrom ? new Date(bulkFilter.dateFrom) : null;
            const to = bulkFilter.dateTo ? new Date(bulkFilter.dateTo + 'T23:59:59') : null;
            toDownload = toDownload.filter(f => {
                const pd = new Date(f.paidDate || f.updatedAt);
                if (from && pd < from) return false;
                if (to && pd > to) return false;
                return true;
            });
        }
        if (bulkFilter.studentId !== 'all') {
            toDownload = toDownload.filter(f => f.student?._id === bulkFilter.studentId);
        }

        if (toDownload.length === 0) { alert('No receipts match the selected filters.'); return; }

        // 3. Build customData for each receipt (same logic as openReceiptModal)
        const list = toDownload.map((fee, idx) => {
            const student = fee.student || {};
            const seatInfo = getStudentSeatInfo(student);
            const defaultDate = fee.paidDate
                ? new Date(fee.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const defaultDob = student.dob
                ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '';
            const regFee = fee.registrationFee || student.registrationFee || 0;
            const dueAmt = fee.due || (fee.status === 'partial' ? (fee.outstanding || (fee.amount - (fee.partialPaid || 0))) : 0);
            const monthly = fee.amount || 0;
            return {
                fee,
                student,
                slNo: 101 + idx,
                customData: {
                    name: student.name || '',
                    fatherName: student.fatherName || student.guardianName || '',
                    dob: defaultDob,
                    seatNo: seatInfo.seatNumber,
                    shiftName: seatInfo.shiftName,
                    mobile: student.mobile || '',
                    aadharNo: student.aadharNo || student.idNumber || '',
                    address: student.address || '',
                    registrationFee: regFee,
                    lockerNo: fee.lockerNo || student.lockerNo || '',
                    monthlyFee: monthly,
                    due: dueAmt,
                    total: monthly + regFee - dueAmt,
                    slNo: 101 + idx,
                    paidDate: defaultDate,
                },
            };
        });

        bulkReceiptRefs.current = [];
        setBulkRenderList(list);   // triggers useEffect below
        setBulkGenerating(true);
    };

    // ── useEffect: capture rendered PaymentReceipt nodes → combine into PDF
    useEffect(() => {
        if (bulkRenderList.length === 0) return;

        const captureAll = async () => {
            try {
                // Wait a tick for React to paint the off-screen receipts
                await new Promise(r => setTimeout(r, 600));

                const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                // Receipt is portrait ~ 90x150mm; use A5 portrait so it fits nicely
                const doc = new jsPDF('portrait', 'mm', [104, 148]);
                const PW = 104, PH = 148;

                for (let i = 0; i < bulkRenderList.length; i++) {
                    const el = bulkReceiptRefs.current[i];
                    if (!el) continue;
                    if (i > 0) doc.addPage([104, 148], 'portrait');

                    const canvas = await html2canvas(el, {
                        scale: 3,
                        useCORS: true,
                        backgroundColor: '#fef9f0',
                        logging: false,
                    });
                    const imgData = canvas.toDataURL('image/png');
                    // Fit image to page maintaining aspect ratio
                    const ratio = canvas.height / canvas.width;
                    const imgW = PW;
                    const imgH = imgW * ratio;
                    const yOffset = Math.max(0, (PH - imgH) / 2);
                    doc.addImage(imgData, 'PNG', 0, yOffset, imgW, Math.min(imgH, PH));
                }

                const filterTag = bulkFilter.mode === 'month'
                    ? `${MONTHS[Number(bulkFilter.month)]}_${bulkFilter.year}`
                    : bulkFilter.mode === 'year' ? bulkFilter.year
                    : bulkFilter.mode === 'range' ? `${bulkFilter.dateFrom}_to_${bulkFilter.dateTo}`
                    : 'student';

                doc.save(`Apna_Lakshya_Receipts_${filterTag}_${new Date().toISOString().split('T')[0]}.pdf`);
                setBulkReceiptOpen(false);
            } catch (err) {
                console.error('Bulk PDF error:', err);
                alert('Failed to generate PDF. Please try again.');
            } finally {
                setBulkRenderList([]);
                setBulkGenerating(false);
            }
        };

        captureAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bulkRenderList]);

    // ── Helper: build receipt customData for a fee (mirrors openReceiptModal) ─
    const buildCustomData = (fee, index) => {
        const student = fee.student || {};
        const seatInfo = getStudentSeatInfo(student);
        const defaultDate = fee.paidDate
            ? new Date(fee.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const regFee = fee.registrationFee || student.registrationFee || 0;
        const dueAmt = fee.due || (fee.status === 'partial' ? (fee.outstanding || (fee.amount - (fee.partialPaid || 0))) : 0);
        const monthly = fee.amount || 0;
        return {
            name: student.name || '',
            fatherName: student.fatherName || student.guardianName || '',
            dob: student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '',
            seatNo: seatInfo.seatNumber,
            shiftName: seatInfo.shiftName,
            mobile: student.mobile || '',
            aadharNo: student.aadharNo || student.idNumber || '',
            address: student.address || '',
            registrationFee: regFee,
            lockerNo: fee.lockerNo || student.lockerNo || '',
            monthlyFee: monthly,
            due: dueAmt,
            total: monthly + regFee - dueAmt,
            slNo: 101 + (index || 0),
            paidDate: defaultDate,
        };
    };

    // ── Quick per-card download useEffect ────────────────────────────
    useEffect(() => {
        if (!quickDlFee) return;
        const { action, customData: cd } = quickDlFee;
        const capture = async () => {
            try {
                await new Promise(r => setTimeout(r, 400));
                const el = quickDlRef.current;
                if (!el) return;
                if (action === 'print') {
                    const win = window.open('', '', 'width=700,height=520');
                    win.document.write(`<html><head><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;background:#fef9f0;padding:8px;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head><body>${el.innerHTML}</body></html>`);
                    win.document.close(); win.focus();
                    setTimeout(() => { win.print(); win.close(); }, 350);
                } else {
                    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#fef9f0', logging: false });
                    const safeName = (cd?.name || 'Receipt').replace(/\s+/g, '_');
                    const slNo = cd?.slNo || 101;
                    if (action === 'pdf') {
                        const doc = new jsPDF('landscape', 'mm', [90, 56]);
                        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 90, 56);
                        doc.save(`Receipt_${slNo}_${safeName}.pdf`);
                    } else {
                        const link = document.createElement('a');
                        link.download = `Receipt_${slNo}_${safeName}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    }
                }
            } catch (err) {
                console.error('Quick download error:', err);
            } finally {
                setQuickDlFee(null);
            }
        };
        capture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quickDlFee]);

    return (
        <div className="min-h-screen relative text-[#0F172A] pb-20" style={{ background: '#FAF6F0' }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />
            {/* Top Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                
                {/* ═════════════════════════════════════════════════════════
                    EXECUTIVE HEADER BAR
                ═════════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-[#EDE8E0] rounded-2xl p-5 shadow-2xs"
                >
                    <div className="flex items-center gap-3.5">
                        <Link to={backPath}>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-4 py-2.5 bg-white hover:bg-[#FAF6F0] text-stone-700 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-[#EDE8E0] text-xs font-bold shadow-2xs cursor-pointer"
                                title="Back"
                            >
                                <IoArrowBack size={15} /> Back
                            </motion.button>
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[11px] font-bold mb-1">
                                <IoCashOutline size={13} />
                                <span>Main Campus (Sitamarhi) · Enterprise Financial Ledger</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                Fee Management
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {isSubAdmin ? 'Fee collection, dues reconciliation and instant payment recording' : 'Automated billing cycles, dues reconciliation, instant settlement, physical receipts & online gateway'}
                            </p>
                        </div>
                    </div>

                    {/* Right Header Operations */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Razorpay Online Payment Gateway Switch (Admin Only) */}
                        {!isSubAdmin && (
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-xl">
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900 leading-tight">Online Payments</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Razorpay Gateway</div>
                                </div>
                                <button
                                    onClick={toggleOnlinePayment}
                                    className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${onlinePaymentEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}
                                    title="Toggle student online payment gateway"
                                >
                                    <motion.div
                                        animate={{ x: onlinePaymentEnabled ? 20 : 0 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="w-5 h-5 rounded-full bg-white shadow-sm"
                                    />
                                </button>
                            </div>
                        )}

                        {/* View Switcher: Cards vs Table */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'cards'
                                        ? 'bg-white text-orange-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="One Card for One Student"
                            >
                                <IoGridOutline size={14} />
                                <span className="hidden sm:inline">Cards</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white text-orange-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title="Ledger Table"
                            >
                                <IoListOutline size={14} />
                                <span className="hidden sm:inline">Table</span>
                            </button>
                        </div>

                        {/* PDF Export + Bulk Receipts Buttons (Super Admin Only) */}
                        {!isSubAdmin && (
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPdfModalOpen(true)}
                                    disabled={processedFees.length === 0}
                                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <IoDownloadOutline size={16} />
                                    <span>Export PDF</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setBulkReceiptOpen(true)}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                                    style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', color: '#EA580C', boxShadow: '0 2px 8px rgba(180,120,60,0.08)' }}
                                    title="Download all receipts as PDF"
                                >
                                    <IoDocumentTextOutline size={16} />
                                    <span className="hidden sm:inline">Bulk Receipts</span>
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Notifications & Feedback */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold shadow-2xs"
                        >
                            <IoCheckmarkCircle size={18} className="text-emerald-600 shrink-0" />
                            <span>{success}</span>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-bold shadow-2xs"
                        >
                            <IoCloseCircle size={18} className="text-rose-600 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═════════════════════════════════════════════════════════
                    FINANCIAL KPI METRICS (PENDING ONLY FOR SUBADMIN)
                ═════════════════════════════════════════════════════════ */}
                {isSubAdmin ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl">
                        {/* This Month (Read-only for sub-admin) */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                                    <IoCalendarOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-blue-600 tabular-nums">₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium mt-0.5 text-slate-400">
                                1–{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} {metrics.monthName}
                            </p>
                        </div>

                        {/* Pending Dues */}
                        <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pending Dues</span>
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                                    <IoTimeOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-amber-600 tabular-nums">₹{metrics.totalPending.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{metrics.counts.pending} invoices awaiting payment</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                        {/* Total Collected */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                                    <IoCheckmarkCircle size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-emerald-600 tabular-nums">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                {metrics.todayRevenue > 0
                                    ? `₹${metrics.todayRevenue.toLocaleString('en-IN')} collected today`
                                    : 'Full paid + partial installments'}
                            </p>
                        </div>

                        {/* This Month */}
                        <div
                            onClick={() => setMonthlyFilter(f => !f)}
                            className={`rounded-2xl p-4 shadow-2xs transition-all cursor-pointer select-none
                                ${monthlyFilter
                                    ? 'bg-blue-50 border-2 border-blue-500 shadow-blue-100'
                                    : 'bg-white border border-slate-200/90 hover:shadow-xs hover:border-blue-300'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${monthlyFilter ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                    <IoCalendarOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-blue-600 tabular-nums">₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium mt-0.5 text-blue-400">
                                {monthlyFilter ? 'Filtered — click to clear' : `1–${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()} ${metrics.monthName}`}
                            </p>
                        </div>

                        {/* Pending Dues */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Dues</span>
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                                    <IoTimeOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-amber-600 tabular-nums">₹{metrics.totalPending.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{metrics.counts.pending} invoices awaiting payment</p>
                        </div>

                        {/* Overdue Risk */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue Risk</span>
                                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                                    <IoAlertCircleOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-rose-600 tabular-nums">₹{metrics.totalOverdue.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{metrics.counts.overdue} overdue past deadline</p>
                        </div>

                        {/* Online Gateway Volume */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Gateway</span>
                                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                                    <IoCardOutline size={16} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-orange-600 tabular-nums">₹{metrics.onlineVolume.toLocaleString('en-IN')}</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{metrics.counts.online} Razorpay transactions</p>
                        </div>
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════
                    SEARCH & FILTER TOOLBAR
                ═════════════════════════════════════════════════════════ */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
                    {/* Monthly filter active banner */}
                    {monthlyFilter && (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 shadow-2xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-blue-800">
                                    Showing {processedFees.length} fee collection{processedFees.length === 1 ? '' : 's'} for {metrics.monthName} (Total: ₹{metrics.monthlyRevenue.toLocaleString('en-IN')})
                                </span>
                            </div>
                            <button
                                onClick={() => setMonthlyFilter(false)}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                                <IoClose size={14} /> Clear Filter
                            </button>
                        </div>
                    )}
                    {/* Row 1: Search & Sorting (Admin Only) */}
                    {!isSubAdmin && (
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 w-full">
                                <IoSearchOutline size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by student name, email, mobile, seat number, or payment ID..."
                                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                        title="Clear search"
                                    >
                                        <IoClose size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Sort Selector */}
                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 md:flex-initial px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-colors"
                                >
                                    <option value="dueDate_asc">Sort: Due Date (Earliest)</option>
                                    <option value="dueDate_desc">Sort: Due Date (Latest)</option>
                                    <option value="amount_desc">Sort: Amount (Highest)</option>
                                    <option value="amount_asc">Sort: Amount (Lowest)</option>
                                    <option value="name_asc">Sort: Student Name (A-Z)</option>
                                </select>

                                {/* Show Inactive Toggle */}
                                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600"
                                    />
                                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Include Inactive</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Row 2: Segmented Status Tabs */}
                    <div className={`flex items-center justify-between gap-2 overflow-x-auto pb-1 custom-scrollbar ${!isSubAdmin ? 'pt-1 border-t border-slate-100' : ''}`}>
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            {TABS.map(tab => {
                                const isLocked = !!tab.isLocked;
                                const isActive = !isLocked && !monthlyFilter && filter === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => {
                                            if (isLocked) return;
                                            setFilter(tab.key);
                                            setMonthlyFilter(false);
                                        }}
                                        title={isLocked ? 'Advance Payment is restricted to Main Admin' : ''}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                            isLocked
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200/90 cursor-not-allowed opacity-65 select-none'
                                                : isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/20 cursor-pointer'
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 cursor-pointer'
                                        }`}
                                    >
                                        {isLocked && (
                                            <IoLockClosedOutline size={13} className="text-slate-400 shrink-0" />
                                        )}
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                            isLocked
                                                ? 'bg-slate-200/80 text-slate-500'
                                                : isActive
                                                ? 'bg-white/25 text-white'
                                                : 'bg-slate-200/70 text-slate-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ═════════════════════════════════════════════════════════
                    RECORDS LISTING: DUAL VIEW MODES
                ═════════════════════════════════════════════════════════ */}
                {loading ? (
                    <PrimaryLogoLoader text="Loading Enterprise Fee Ledger..." />
                ) : filter === 'advance' ? (
                    <div className="space-y-4">
                        {/* Advance Header Info Card */}
                        <div className="bg-white border border-[#EDE8E0] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <IoCashOutline size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                                        Advance Payment & Upcoming Billing Roster
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                                        Select any student to collect upcoming monthly dues in advance or mark future billing cycles before due date. Advance paid dues are marked as settled and will not appear in the pending dues list.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-200">
                                    {filteredAdvanceRoster.length} Student{filteredAdvanceRoster.length === 1 ? '' : 's'} Available
                                </span>
                            </div>
                        </div>

                        {/* Empty state for search */}
                        {filteredAdvanceRoster.length === 0 ? (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
                                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3">
                                    <IoSearchOutline size={24} />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">No students found</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    {searchQuery ? 'No student matches your current search keywords.' : 'No active students found in the advance billing roster.'}
                                </p>
                            </div>
                        ) : viewMode === 'cards' ? (
                            /* Cards View */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                                {filteredAdvanceRoster.map((studentItem, index) => {
                                    const hasAdvance = studentItem.hasAdvancePaid;
                                    const next = studentItem.nextUpcoming || {};
                                    const nextCycleStartStr = next.cycleStart ? new Date(next.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                                    const nextCycleEndStr = next.cycleEnd ? new Date(next.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '';

                                    return (
                                        <motion.div
                                            key={studentItem._id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group"
                                        >
                                            {/* Top Status Border Accent */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${hasAdvance ? 'bg-emerald-500' : 'bg-orange-500'}`} />

                                            <div>
                                                {/* Card Top: Avatar + Name + Badges */}
                                                <div className="flex items-start justify-between gap-3 mb-4 mt-1">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="relative w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                                            {getStudentAvatarSrc(studentItem) ? (
                                                                <img
                                                                    src={getStudentAvatarSrc(studentItem)}
                                                                    alt={studentItem.name || 'Student'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 items-center justify-center font-black text-sm uppercase"
                                                                style={{ display: getStudentAvatarSrc(studentItem) ? 'none' : 'flex' }}
                                                            >
                                                                {(studentItem.name || 'U').slice(0, 2)}
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-slate-900 text-sm truncate" title={studentItem.name}>
                                                                {studentItem.name || 'Unknown Student'}
                                                            </h3>
                                                            <p className="text-[11px] text-slate-500 truncate" title={studentItem.mobile || studentItem.email}>
                                                                {studentItem.mobile ? `${studentItem.mobile} · ` : ''}{studentItem.email || 'No email'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                                    {studentItem.seatNumber ? `Desk #${studentItem.seatNumber}` : 'Unassigned Desk'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 truncate">
                                                                    {studentItem.shiftName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                                            hasAdvance
                                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200/90'
                                                                : 'text-amber-700 bg-amber-50 border-amber-200/90'
                                                        }`}>
                                                            {hasAdvance ? 'Advance Active' : 'Regular Cycle'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Middle: 4 Data Quadrants */}
                                                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2.5 mb-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Cycle</span>
                                                            <span className="text-xs font-semibold text-slate-800">
                                                                Day {studentItem.billingDay} of month
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Fee</span>
                                                            <span className="text-xs font-black text-slate-900">
                                                                ₹{studentItem.suggestedAmount}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Paid Period</span>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {studentItem.lastPaidFee
                                                                    ? `${studentItem.lastPaidFee.monthName} ${studentItem.lastPaidFee.year}`
                                                                    : 'No prior payments'}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Due Cycle</span>
                                                            <span className="text-xs font-bold text-orange-600">
                                                                {next.monthName ? `${next.monthName} ${next.year}` : 'Next Cycle'}
                                                            </span>
                                                            {nextCycleStartStr && (
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    {nextCycleStartStr} – {nextCycleEndStr}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Bottom CTA */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => openAdvanceModal(studentItem)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                                                >
                                                    <IoCashOutline size={15} />
                                                    <span>Record Advance Payment</span>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Table View */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs"
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/90 bg-slate-50/80">
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Desk & Shift</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Cycle Day</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Monthly Rate</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Last Paid</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Next Upcoming Due</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAdvanceRoster.map((studentItem) => {
                                                const hasAdvance = studentItem.hasAdvancePaid;
                                                const next = studentItem.nextUpcoming || {};
                                                return (
                                                    <tr key={studentItem._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                                                    {getStudentAvatarSrc(studentItem) ? (
                                                                        <img src={getStudentAvatarSrc(studentItem)} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs uppercase">
                                                                            {(studentItem.name || 'U').slice(0, 2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-slate-900 text-xs block">{studentItem.name}</span>
                                                                    <span className="text-[11px] text-slate-500 block">{studentItem.mobile || studentItem.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-semibold text-slate-800 block">
                                                                {studentItem.seatNumber ? `Desk #${studentItem.seatNumber}` : 'Unassigned'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 block">{studentItem.shiftName}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                                                            Day {studentItem.billingDay}
                                                        </td>
                                                        <td className="px-5 py-4 text-xs font-black text-slate-900">
                                                            ₹{studentItem.suggestedAmount}
                                                        </td>
                                                        <td className="px-5 py-4 text-xs text-slate-600">
                                                            {studentItem.lastPaidFee ? `${studentItem.lastPaidFee.monthName} ${studentItem.lastPaidFee.year}` : '-'}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-bold text-orange-600 block">
                                                                {next.monthName ? `${next.monthName} ${next.year}` : '-'}
                                                            </span>
                                                            {next.cycleStart && (
                                                                <span className="text-[10px] text-slate-400 block">
                                                                    {new Date(next.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(next.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                                                hasAdvance
                                                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200/90'
                                                                    : 'text-amber-700 bg-amber-50 border-amber-200/90'
                                                            }`}>
                                                                {hasAdvance ? 'Advance Active' : 'Regular'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                onClick={() => openAdvanceModal(studentItem)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                                                            >
                                                                <IoCashOutline size={14} />
                                                                <span>Record Advance</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </div>
                ) : processedFees.length === 0 ? (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3">
                            <IoCashOutline size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">No fee records found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchQuery ? 'Try adjusting your search criteria or filters.' : 'There are currently no invoices matching the selected status.'}
                        </p>
                    </div>
                ) : viewMode === 'cards' ? (
                    /* ─────────────────────────────────────────────────────────────
                       VIEW 1: EXECUTIVE CARDS GRID ("One Card for One Student")
                    ───────────────────────────────────────────────────────────── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                        {processedFees.map((fee, index) => {
                            const student = fee.student;
                            const { seatNumber, shiftName } = getStudentSeatInfo(student);
                            const cycleStart = new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const cycleEnd = new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
                            const dueDate = new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            const theme = getStatusTheme(fee.status);
                            const outstanding = fee.status === 'partial' ? (fee.outstanding || (fee.amount - fee.partialPaid)) : fee.amount;
                            const percentPaid = fee.status === 'paid' ? 100 : fee.status === 'partial' ? Math.round(((fee.partialPaid || 0) / (fee.amount || 1)) * 100) : 0;

                            return (
                                <motion.div
                                    key={fee._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group"
                                >
                                    {/* Top Status Border Accent */}
                                    <div className={`absolute top-0 left-0 w-full h-1 ${theme.bar}`} />

                                    <div>
                                        {/* Card Top: Student Avatar + Info + Status */}
                                        <div className="flex items-start justify-between gap-3 mb-4 mt-1">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="relative w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                                    {getStudentAvatarSrc(student) ? (
                                                        <img
                                                            src={getStudentAvatarSrc(student)}
                                                            alt={student?.name || 'Student'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                if (e.currentTarget.nextElementSibling) {
                                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 items-center justify-center font-black text-sm uppercase"
                                                        style={{ display: getStudentAvatarSrc(student) ? 'none' : 'flex' }}
                                                    >
                                                        {(student?.name || 'U').slice(0, 2)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 text-sm truncate" title={student?.name}>
                                                        {student?.name || 'Unknown Student'}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 truncate" title={student?.email || student?.mobile}>
                                                        {student?.mobile ? `${student.mobile} · ` : ''}{student?.email || 'No contact'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                            {seatNumber ? `Desk #${seatNumber}` : 'Unassigned Desk'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 truncate">
                                                            {shiftName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badge}`}>
                                                    {theme.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Middle: 4 Data Quadrants */}
                                        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2.5 mb-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Period</span>
                                                    <span className="text-xs font-semibold text-slate-800">
                                                        {cycleStart} – {cycleEnd}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        {fee.status === 'partial' ? 'Increased Due' : 'Invoice Total'}
                                                    </span>
                                                    <span className={`text-sm font-black ${fee.status === 'partial' ? 'text-amber-900' : 'text-slate-900'}`}>
                                                        ₹{fee.status === 'partial' ? outstanding : fee.amount}
                                                    </span>
                                                    {fee.status === 'partial' && (
                                                        <span className="block text-[10px] text-slate-500 font-medium">
                                                            Total ₹{fee.amount} · ₹{fee.partialPaid || 0} Paid
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        {fee.status === 'paid' ? 'Settled Date' : 'Due Deadline'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {fee.status === 'paid' && fee.paidDate
                                                            ? new Date(fee.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                            : dueDate}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Channel</span>
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {fee.razorpayPaymentId ? 'Razorpay Online' : fee.status === 'paid' ? 'Cash / Direct' : 'Pending'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Partial Payment Progress bar if applicable */}
                                            {fee.status === 'partial' && (
                                                <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Paid</span>
                                                            <span className="text-xs font-black text-emerald-800 tabular-nums">₹{fee.partialPaid || 0}</span>
                                                        </div>
                                                        <div className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Increased Due</span>
                                                            <span className="text-xs font-black text-amber-900 tabular-nums">₹{outstanding}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                                            <span>Payment Progress</span>
                                                            <span className="text-amber-700 font-extrabold">{percentPaid}% Paid</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-200/90 rounded-full overflow-hidden p-0.5">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-300"
                                                                style={{ width: `${percentPaid}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Seat Upgrade Note Banner */}
                                            {fee.note && fee.seatChangeDetails && (
                                                <div className="mt-2.5 px-3 py-2.5 rounded-xl border text-[10.5px] leading-relaxed font-medium" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#7c2d12' }}>
                                                    <span className="font-extrabold uppercase tracking-wider block mb-0.5" style={{ color: '#c2410c', fontSize: '9px' }}>Seat Upgrade — Balance Due</span>
                                                    {fee.seatChangeDetails.fromSeat && (
                                                        <span className="block">
                                                            Desk {fee.seatChangeDetails.fromSeat} (Rs.{fee.seatChangeDetails.fromPrice}) &rarr; Desk {fee.seatChangeDetails.toSeat} (Rs.{fee.seatChangeDetails.toPrice})
                                                        </span>
                                                    )}
                                                    <span className="block mt-0.5" style={{ color: '#92400e' }}>
                                                        Changed: {fee.seatChangeDetails.changeDate ? new Date(fee.seatChangeDetails.changeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Online payment badge indicator */}
                                            {fee.razorpayOrderId && (
                                                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-400">Razorpay Order:</span>
                                                    <span className="font-mono text-slate-600 truncate max-w-[150px]">{fee.razorpayOrderId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer: Action Buttons */}
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                        {/* Physical Receipt Button (Admin Only) */}
                                        {/* Inline Download Row (Admin Only) */}
                                        {!isSubAdmin && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <button
                                                    onClick={() => openReceiptModal(fee, student, index + 101)}
                                                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                                    title="View / Edit Receipt"
                                                >
                                                    <IoReceiptOutline size={13} />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => setQuickDlFee({ fee, action: 'pdf', customData: buildCustomData(fee, index) })}
                                                    disabled={!!quickDlFee}
                                                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                                    style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}
                                                    title="Download Receipt PDF"
                                                >
                                                    <IoDocumentTextOutline size={13} />
                                                    <span>PDF</span>
                                                </button>
                                                <button
                                                    onClick={() => setQuickDlFee({ fee, action: 'png', customData: buildCustomData(fee, index) })}
                                                    disabled={!!quickDlFee}
                                                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                                    style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#1D4ED8' }}
                                                    title="Download Receipt Image"
                                                >
                                                    <IoDownloadOutline size={13} />
                                                    <span>Image</span>
                                                </button>
                                                <button
                                                    onClick={() => setQuickDlFee({ fee, action: 'print', customData: buildCustomData(fee, index) })}
                                                    disabled={!!quickDlFee}
                                                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                                                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#374151' }}
                                                    title="Print Receipt"
                                                >
                                                    <IoPrintOutline size={13} />
                                                    <span>Print</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Pay / Settle Button */}
                                        {fee.status === 'paid' ? (
                                            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                                                <IoCheckmark size={15} />
                                                <span>Settled</span>
                                            </div>
                                        ) : fee.status === 'cancelled' ? (
                                            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold">
                                                <span>Cancelled Invoice</span>
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => openPayModal(fee)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all"
                                            >
                                                <IoWalletOutline size={15} />
                                                <span>{fee.status === 'partial' ? `Pay Increased Fee (₹${outstanding})` : 'Collect Fee'}</span>
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    /* ─────────────────────────────────────────────────────────────
                       VIEW 2: HIGH-DENSITY LEDGER TABLE
                    ───────────────────────────────────────────────────────────── */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200/90 bg-slate-50/80">
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student & Desk</th>
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Billing Cycle</th>
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Total Amount</th>
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Due Date</th>
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status & Gateway</th>
                                        <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {processedFees.map((fee, index) => {
                                        const student = fee.student;
                                        const { seatNumber } = getStudentSeatInfo(student);
                                        const theme = getStatusTheme(fee.status);
                                        const cycleStart = new Date(fee.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                        const cycleEnd = new Date(fee.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

                                        return (
                                            <tr key={fee._id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Student & Desk */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                                            {getStudentAvatarSrc(student) ? (
                                                                <img
                                                                    src={getStudentAvatarSrc(student)}
                                                                    alt={student?.name || 'Student'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 items-center justify-center font-bold text-xs uppercase"
                                                                style={{ display: getStudentAvatarSrc(student) ? 'none' : 'flex' }}
                                                            >
                                                                {(student?.name || 'U').slice(0, 2)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs">{student?.name || 'Unknown'}</div>
                                                            <div className="text-[11px] text-slate-500">{student?.mobile ? `${student.mobile} · ` : ''}{student?.email}</div>
                                                            {seatNumber && (
                                                                <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                                                                    Desk #{seatNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Billing Cycle */}
                                                <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                                    {cycleStart} – {cycleEnd}
                                                </td>

                                                {/* Amount */}
                                                <td className="px-5 py-4 text-right">
                                                    {fee.status === 'partial' ? (
                                                        <div>
                                                            <div className="font-black text-amber-900 text-sm">₹{fee.outstanding}</div>
                                                            <div className="text-[10px] font-bold text-amber-700">Increased Due</div>
                                                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold tabular-nums">
                                                                    ₹{fee.partialPaid} Paid
                                                                </span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold tabular-nums">
                                                                    Total ₹{fee.amount}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="font-black text-slate-900 text-sm">₹{fee.amount}</div>
                                                    )}
                                                </td>

                                                {/* Due Date */}
                                                <td className="px-5 py-4 text-xs text-slate-600 font-medium">
                                                    {new Date(fee.dueDate).toLocaleDateString('en-IN')}
                                                </td>

                                                {/* Status & Gateway */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                            {theme.label}
                                                        </span>
                                                        {fee.razorpayOrderId && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                                {fee.status === 'paid' && fee.razorpayPaymentId ? 'Online Settled' : 'Online Order'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isSubAdmin && (
                                                            <button
                                                                onClick={() => openReceiptModal(fee, student, index + 101)}
                                                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                                                                title="Print / Download Receipt Slip"
                                                            >
                                                                <IoReceiptOutline size={15} />
                                                            </button>
                                                        )}

                                                        {fee.status === 'paid' ? (
                                                            <span className="text-[11px] font-bold text-emerald-600 px-2 py-1">
                                                                Paid
                                                            </span>
                                                        ) : fee.status === 'cancelled' ? (
                                                            <span className="text-[11px] font-bold text-slate-400 px-2 py-1">
                                                                Cancelled
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => openPayModal(fee)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                                                            >
                                                                <IoWalletOutline size={14} />
                                                                <span>{fee.status === 'partial' ? `Pay ₹${fee.outstanding}` : 'Collect Fee'}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ═════════════════════════════════════════════════════════
                MODAL 1: SETTLE FEE / RECORD PAYMENT MODAL
            ═════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={!!payModal}
                onClose={closePayModal}
                title="Settle Fee & Record Payment"
                maxWidth="max-w-md"
                theme="light"
            >
                {payModal && (
                    <div className="space-y-4">
                        {/* Student Bill Overview Card */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                        {getStudentAvatarSrc(payModal.student) ? (
                                            <img
                                                src={getStudentAvatarSrc(payModal.student)}
                                                alt={payModal.student?.name || 'Student'}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 items-center justify-center font-bold text-xs uppercase"
                                            style={{ display: getStudentAvatarSrc(payModal.student) ? 'none' : 'flex' }}
                                        >
                                            {(payModal.student?.name || 'U').slice(0, 2)}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{payModal.student?.name}</h4>
                                        <p className="text-[11px] text-slate-500 truncate">{payModal.student?.email || payModal.student?.mobile}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 block">
                                        {payModal.status === 'partial'
                                            ? `Increased Due: ₹${payModal.outstanding || (payModal.amount - (payModal.partialPaid || 0))}`
                                            : `Total ₹${payModal.amount}`}
                                    </span>
                                    {payModal.status === 'partial' && (
                                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                            Total ₹{payModal.amount} · ₹{payModal.partialPaid || 0} Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                            {payModal.partialPaid > 0 && (
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        Already Paid: ₹{payModal.partialPaid}
                                    </span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300">
                                        Remaining Due: ₹{payModal.outstanding || (payModal.amount - payModal.partialPaid)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold">
                                <IoCloseCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Mode Selector Tabs */}
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Settlement Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'full', label: 'Full Settlement', desc: '100% Paid' },
                                    { id: 'partial', label: 'Partial Payment', desc: 'Installment' },
                                    { id: 'cancel', label: 'Void / Cancel', desc: 'Inactive Period' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => { setPayType(tab.id); setPartialAmt(''); setError(''); }}
                                        className={`p-2.5 rounded-xl border text-center transition-all ${
                                            payType === tab.id
                                                ? 'border-orange-500 bg-orange-50/60 text-orange-950 font-bold shadow-2xs'
                                                : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                                        }`}
                                    >
                                        <div className="text-xs">{tab.label}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{tab.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Partial Amount Input if partial mode selected */}
                        {payType === 'partial' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1.5"
                            >
                                <label className="block text-xs font-bold text-slate-700">
                                    Partial Amount Collected (₹)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={payModal.amount - 1}
                                    value={partialAmt}
                                    onChange={(e) => setPartialAmt(e.target.value)}
                                    placeholder={`Enter amount (Max: ₹${payModal.amount - 1})`}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                                />
                                {partialAmt && !isNaN(partialAmt) && Number(partialAmt) > 0 && Number(partialAmt) < payModal.amount && (
                                    <div className="flex justify-between text-xs font-bold px-1 text-slate-600">
                                        <span className="text-emerald-600">Recorded: ₹{Number(partialAmt)}</span>
                                        <span className="text-amber-600">Remaining Balance: ₹{payModal.amount - Number(partialAmt)}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Submit Actions */}
                        <div className="flex gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={closePayModal}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleMarkPaid}
                                disabled={payLoading || (payType === 'partial' && (!partialAmt || isNaN(partialAmt) || Number(partialAmt) <= 0))}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    payType === 'cancel'
                                        ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
                                        : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20'
                                }`}
                            >
                                <IoCheckmarkCircle size={16} />
                                <span>
                                    {payLoading
                                        ? 'Recording...'
                                        : payType === 'full'
                                        ? (payModal.status === 'partial'
                                            ? `Pay Increased Fee (₹${payModal.outstanding || (payModal.amount - (payModal.partialPaid || 0))})`
                                            : 'Mark 100% Paid')
                                        : payType === 'cancel'
                                        ? 'Confirm Void'
                                        : 'Record Installment'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ═════════════════════════════════════════════════════════
                MODAL 2: OFFICIAL PHYSICAL PAYMENT RECEIPT & STUDIO
            ═════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={!!receiptModal}
                onClose={() => setReceiptModal(null)}
                title="Official Payment Receipt Studio"
                maxWidth="max-w-5xl"
                theme="light"
            >
                {receiptModal && (
                    <div className="space-y-4">
                        {/* Notifications */}
                        <AnimatePresence>
                            {saveSuccessMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold"
                                >
                                    <IoCheckmarkCircle size={16} className="text-emerald-600 shrink-0" />
                                    <span>{saveSuccessMsg}</span>
                                </motion.div>
                            )}
                            {saveProfileError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2 rounded-xl text-xs font-bold"
                                >
                                    <IoCloseCircle size={16} className="text-rose-600 shrink-0" />
                                    <span>{saveProfileError}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Invoice Quick-Details Banner */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {[
                                { label: 'Student', value: receiptModal.student?.name || '—' },
                                { label: 'Amount', value: `₹${receiptModal.fee?.amount || 0}` },
                                { label: 'Status', value: (receiptModal.fee?.status || '').toUpperCase() },
                                { label: 'Period', value: (() => {
                                    const f = receiptModal.fee;
                                    if (!f) return '—';
                                    return f.cycleStart
                                        ? `${new Date(f.cycleStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(f.cycleEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}`
                                        : `${f.month}/${f.year}`;
                                })() },
                                { label: 'Paid On', value: receiptModal.fee?.paidDate ? new Date(receiptModal.fee.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                                { label: 'Seat', value: (() => { const si = getStudentSeatInfo(receiptModal.student); return si.seatNumber ? `#${si.seatNumber}` : '—'; })() },
                            ].map(({ label, value }) => (
                                <div key={label} className="px-3 py-2 rounded-xl text-center" style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0' }}>
                                    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#786D62' }}>{label}</p>
                                    <p className="text-xs font-black truncate" style={{ color: '#0F172A' }} title={value}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Studio Grid: Live Form Inputs on Left, Physical Slip Preview on Right */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                            {/* Left Column: Live Slip Details Form */}
                            <div className="lg:col-span-6 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <IoCreateOutline size={16} className="text-orange-600" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                            Student & Slip Details (Live Sync)
                                        </h4>
                                    </div>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                        Live Preview
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Student Name
                                        </label>
                                        <div className="relative">
                                            <IoPersonOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.name}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, name: e.target.value })}
                                                placeholder="e.g. Harshit Kumar"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Father's Name */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center justify-between">
                                            <span>Father's Name</span>
                                            <span className="text-[9px] lowercase font-normal bg-orange-100 text-orange-700 px-1.5 rounded">required on slip</span>
                                        </label>
                                        <div className="relative">
                                            <IoPersonOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500" />
                                            <input
                                                type="text"
                                                value={receiptForm.fatherName}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, fatherName: e.target.value })}
                                                placeholder="e.g. Shri Rajesh Kumar"
                                                className="w-full bg-white border border-orange-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Mobile */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Mobile Number
                                        </label>
                                        <div className="relative">
                                            <IoCallOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.mobile}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, mobile: e.target.value })}
                                                placeholder="10-digit mobile"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* DOB */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Date of Birth (DOB)
                                        </label>
                                        <div className="relative">
                                            <IoCalendarOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.dob}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, dob: e.target.value })}
                                                placeholder="DD/MM/YY"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Seat No */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Desk / Seat Number
                                        </label>
                                        <div className="relative">
                                            <IoGridOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.seatNo}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, seatNo: e.target.value })}
                                                placeholder="e.g. 12"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Shift */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Shift Title
                                        </label>
                                        <div className="relative">
                                            <IoTimeOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.shiftName}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, shiftName: e.target.value })}
                                                placeholder="e.g. Morning / Full Shift"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Aadhar No */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center justify-between">
                                            <span>Aadhar Number</span>
                                            <span className="text-[9px] lowercase font-normal bg-orange-100 text-orange-700 px-1.5 rounded">on slip</span>
                                        </label>
                                        <div className="relative">
                                            <IoCardOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500" />
                                            <input
                                                type="text"
                                                value={receiptForm.aadharNo}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, aadharNo: e.target.value })}
                                                placeholder="12-digit Aadhar"
                                                className="w-full bg-white border border-orange-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Locker No */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Locker Number
                                        </label>
                                        <div className="relative">
                                            <IoLockClosedOutline size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={receiptForm.lockerNo}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, lockerNo: e.target.value })}
                                                placeholder="e.g. L-04"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Residential Address
                                        </label>
                                        <div className="relative">
                                            <IoLocationOutline size={14} className="absolute left-2.5 top-3 text-slate-400" />
                                            <textarea
                                                rows={2}
                                                value={receiptForm.address}
                                                onChange={(e) => setReceiptForm({ ...receiptForm, address: e.target.value })}
                                                placeholder="Village / Ward, Sitamarhi"
                                                className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Registration Fee & Monthly Fee & Due */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Registration Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={receiptForm.registrationFee}
                                            onChange={(e) => {
                                                const val = Number(e.target.value) || 0;
                                                setReceiptForm({
                                                    ...receiptForm,
                                                    registrationFee: val,
                                                    total: (Number(receiptForm.monthlyFee) || 0) + val - (Number(receiptForm.due) || 0)
                                                });
                                            }}
                                            className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Monthly Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={receiptForm.monthlyFee}
                                            onChange={(e) => {
                                                const val = Number(e.target.value) || 0;
                                                setReceiptForm({
                                                    ...receiptForm,
                                                    monthlyFee: val,
                                                    total: val + (Number(receiptForm.registrationFee) || 0) - (Number(receiptForm.due) || 0)
                                                });
                                            }}
                                            className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Due Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={receiptForm.due}
                                            onChange={(e) => {
                                                const val = Number(e.target.value) || 0;
                                                setReceiptForm({
                                                    ...receiptForm,
                                                    due: val,
                                                    total: (Number(receiptForm.monthlyFee) || 0) + (Number(receiptForm.registrationFee) || 0) - val
                                                });
                                            }}
                                            className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                            Sl. No.
                                        </label>
                                        <input
                                            type="text"
                                            value={receiptForm.slNo}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, slNo: e.target.value })}
                                            className="w-full bg-white border border-slate-200 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none font-bold text-orange-600"
                                        />
                                    </div>
                                </div>

                                {/* Save to Student Profile Button */}
                                <div className="pt-2 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleSaveReceiptProfile}
                                        disabled={savingProfile}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                                    >
                                        <IoSaveOutline size={15} />
                                        <span>{savingProfile ? 'Saving...' : 'Save to Student Profile (Permanent)'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Physical Receipt Slip Preview */}
                            <div className="lg:col-span-6 flex flex-col items-center justify-start bg-slate-100/70 border border-slate-200/90 rounded-2xl p-4 overflow-x-auto">
                                <PaymentReceipt
                                    student={receiptModal.student}
                                    fee={receiptModal.fee}
                                    slNo={receiptForm.slNo}
                                    customData={receiptForm}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ═════════════════════════════════════════════════════════
                MODAL 3: PDF EXPORT COLUMN CONFIGURATION MODAL
            ═════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={pdfModalOpen}
                onClose={() => setPdfModalOpen(false)}
                title="Configure PDF Ledger Export"
                maxWidth="max-w-md"
                theme="light"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Customize columns for the Sitamarhi Campus fee report. Select which financial parameters to include in the generated document.
                    </p>

                    {/* Column Checkboxes */}
                    <div className="space-y-2">
                        {[
                            { id: 'name', label: 'Student Name' },
                            { id: 'email', label: 'Email Address' },
                            { id: 'seat', label: 'Desk Seat Number' },
                            { id: 'cycle', label: 'Billing Cycle' },
                            { id: 'amount', label: 'Invoice Amount (₹)' },
                            { id: 'dueDate', label: 'Due Deadline' },
                            { id: 'status', label: 'Payment Status' },
                            { id: 'paidDate', label: 'Settlement Date' }
                        ].map(col => (
                            <label
                                key={col.id}
                                className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedColumns[col.id]}
                                    onChange={() => setSelectedColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                                    className="w-4 h-4 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600"
                                />
                                <span className="text-xs font-bold text-slate-700">{col.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Quick Selection Helpers */}
                    <div className="flex justify-between items-center px-1">
                        <button
                            type="button"
                            onClick={() => setSelectedColumns({ name: true, email: true, seat: true, cycle: true, amount: true, dueDate: true, status: true, paidDate: true })}
                            className="text-xs font-bold text-orange-600 hover:underline"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedColumns({ name: false, email: false, seat: false, cycle: false, amount: false, dueDate: false, status: false, paidDate: false })}
                            className="text-xs font-bold text-slate-400 hover:underline"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setPdfModalOpen(false)}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPdfModalOpen(false);
                                generateFeeTablePDF();
                            }}
                            disabled={!Object.values(selectedColumns).some(Boolean)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <IoDownloadOutline size={16} />
                            <span>Export PDF</span>
                        </button>
                    </div>
                </div>
            </Modal>
            {/* ── Hidden quick per-card receipt renderer ── */}
            {quickDlFee && (
                <div
                    aria-hidden="true"
                    style={{ position: 'fixed', top: -99999, left: -99999, zIndex: -1, width: 480, pointerEvents: 'none' }}
                >
                    <div ref={el => { quickDlRef.current = el; }}>
                        <PaymentReceipt
                            student={quickDlFee.fee.student}
                            fee={quickDlFee.fee}
                            slNo={quickDlFee.customData.slNo}
                            customData={quickDlFee.customData}
                            showActions={false}
                        />
                    </div>
                </div>
            )}

            {/* ── Hidden off-screen bulk receipt render area (for html2canvas) ── */}
            {bulkRenderList.length > 0 && (
                <div
                    aria-hidden="true"
                    style={{ position: 'fixed', top: -99999, left: -99999, zIndex: -1, width: 480, pointerEvents: 'none' }}
                >
                    {bulkRenderList.map((item, i) => (
                        <div
                            key={i}
                            ref={el => { bulkReceiptRefs.current[i] = el; }}
                            style={{ marginBottom: 8 }}
                        >
                            <PaymentReceipt
                                student={item.student}
                                fee={item.fee}
                                slNo={item.customData.slNo}
                                customData={item.customData}
                                showActions={false}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                MODAL 4: BULK RECEIPT DOWNLOAD MODAL
            ═════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={bulkReceiptOpen}
                onClose={() => setBulkReceiptOpen(false)}
                title="Bulk Receipt Download"
                maxWidth="max-w-lg"
                theme="light"
            >
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Download all payment receipts as a single PDF. Filter by month, year, date range, or individual student.
                    </p>

                    {/* Status Filter */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#574E45' }}>Include Receipts</p>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { val: 'paid', label: '✓ Paid Only' },
                                { val: 'partial', label: '◑ Partial Only' },
                                { val: 'both', label: 'Both' },
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => setBulkFilter(p => ({ ...p, statusFilter: opt.val }))}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background: bulkFilter.statusFilter === opt.val ? 'linear-gradient(135deg,#F97316,#EA580C)' : '#FAF6F0',
                                        color: bulkFilter.statusFilter === opt.val ? '#fff' : '#574E45',
                                        border: bulkFilter.statusFilter === opt.val ? 'none' : '1.5px solid #EDE8E0',
                                    }}
                                >{opt.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#574E45' }}>Filter By</p>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { val: 'month', label: 'Month' },
                                { val: 'year',  label: 'Year' },
                                { val: 'range', label: 'Date Range' },
                                { val: 'student', label: 'Student' },
                            ].map(m => (
                                <button
                                    key={m.val}
                                    onClick={() => setBulkFilter(p => ({ ...p, mode: m.val }))}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background: bulkFilter.mode === m.val ? '#0F172A' : '#FAF6F0',
                                        color: bulkFilter.mode === m.val ? '#fff' : '#574E45',
                                        border: bulkFilter.mode === m.val ? 'none' : '1.5px solid #EDE8E0',
                                    }}
                                >{m.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Month + Year */}
                    {bulkFilter.mode === 'month' && (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>Month</label>
                                <select
                                    value={bulkFilter.month}
                                    onChange={e => setBulkFilter(p => ({ ...p, month: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                                >
                                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
                                        <option key={i+1} value={String(i+1)}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>Year</label>
                                <select
                                    value={bulkFilter.year}
                                    onChange={e => setBulkFilter(p => ({ ...p, year: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                                >
                                    {[2023,2024,2025,2026,2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Year Only */}
                    {bulkFilter.mode === 'year' && (
                        <div>
                            <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>Year</label>
                            <select
                                value={bulkFilter.year}
                                onChange={e => setBulkFilter(p => ({ ...p, year: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                            >
                                {[2023,2024,2025,2026,2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Date Range */}
                    {bulkFilter.mode === 'range' && (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>From Date</label>
                                <input
                                    type="date"
                                    value={bulkFilter.dateFrom}
                                    onChange={e => setBulkFilter(p => ({ ...p, dateFrom: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>To Date</label>
                                <input
                                    type="date"
                                    value={bulkFilter.dateTo}
                                    onChange={e => setBulkFilter(p => ({ ...p, dateTo: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Student Picker */}
                    {bulkFilter.mode === 'student' && (
                        <div>
                            <label className="block text-[11px] font-bold mb-1" style={{ color: '#574E45' }}>Select Student</label>
                            <select
                                value={bulkFilter.studentId}
                                onChange={e => setBulkFilter(p => ({ ...p, studentId: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-orange-400"
                                style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#0F172A' }}
                            >
                                <option value="all">All Students</option>
                                {[...new Map(fees.filter(f => f.student?._id).map(f => [f.student._id, f.student])).values()]
                                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                    .map(s => <option key={s._id} value={s._id}>{s.name} — {s.mobile || s.email || ''}</option>)
                                }
                            </select>
                        </div>
                    )}

                    {/* Preview count */}
                    {(() => {
                        let preview = fees.filter(f => f.student && f.student.isActive !== false);
                        if (bulkFilter.statusFilter === 'paid') preview = preview.filter(f => f.status === 'paid');
                        else if (bulkFilter.statusFilter === 'partial') preview = preview.filter(f => f.status === 'partial');
                        else preview = preview.filter(f => f.status === 'paid' || f.status === 'partial');

                        if (bulkFilter.mode === 'month') preview = preview.filter(f => String(f.month) === String(bulkFilter.month) && String(f.year) === String(bulkFilter.year));
                        else if (bulkFilter.mode === 'year') preview = preview.filter(f => String(f.year) === String(bulkFilter.year));
                        else if (bulkFilter.mode === 'range') {
                            const from = bulkFilter.dateFrom ? new Date(bulkFilter.dateFrom) : null;
                            const to = bulkFilter.dateTo ? new Date(bulkFilter.dateTo + 'T23:59:59') : null;
                            preview = preview.filter(f => {
                                const pd = new Date(f.paidDate || f.updatedAt);
                                if (from && pd < from) return false;
                                if (to && pd > to) return false;
                                return true;
                            });
                        }
                        if (bulkFilter.studentId !== 'all') preview = preview.filter(f => f.student?._id === bulkFilter.studentId);

                        return (
                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: preview.length > 0 ? '#F0FDF4' : '#FEF2F2', border: `1.5px solid ${preview.length > 0 ? '#BBF7D0' : '#FECACA'}` }}>
                                <span className="text-xs font-bold" style={{ color: preview.length > 0 ? '#15803D' : '#B91C1C' }}>
                                    {preview.length > 0 ? `${preview.length} receipt${preview.length !== 1 ? 's' : ''} will be included in the PDF` : 'No receipts match this filter — adjust selection'}
                                </span>
                            </div>
                        );
                    })()}

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={() => setBulkReceiptOpen(false)}
                            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                            style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0', color: '#574E45' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={generateBulkReceiptsPDF}
                            disabled={bulkGenerating}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.30)' }}
                        >
                            {bulkGenerating ? (
                                <>
                                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <IoDownloadOutline size={15} />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ═════════════════════════════════════════════════════════
                ADVANCE FEE BILLING & SETTLEMENT MODAL
            ═════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={!!advanceModal}
                onClose={() => { if (!advanceSubmitting) { setAdvanceModal(null); setAdvanceSuccess(null); setError(''); } }}
                title="Advance Fee Billing & Upcoming Due"
                maxWidth="max-w-lg"
                theme="light"
            >
                {advanceModal && (
                    <div className="space-y-4">
                        {advanceSuccess ? (
                            /* Success Screen */
                            <div className="space-y-4 py-2 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                                    <IoCheckmarkCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {advanceSuccess.action === 'advance_paid' ? 'Advance Payment Recorded' : 'Upcoming Due Scheduled'}
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-1">
                                        {advanceSuccess.message}
                                    </p>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Student:</span>
                                        <span className="font-bold text-slate-900">{advanceModal.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Billing Period:</span>
                                        <span className="font-bold text-slate-900">{MONTH_NAMES[advanceForm.month - 1]} {advanceForm.year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Amount:</span>
                                        <span className="font-black text-emerald-700">₹{advanceForm.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium">Status:</span>
                                        <span className="font-bold uppercase text-emerald-600">{advanceSuccess.action === 'advance_paid' ? 'Settled (Paid in Advance)' : 'Scheduled (Pending)'}</span>
                                    </div>
                                    {advanceSuccess.action === 'advance_paid' && (
                                        <div className="text-[11px] text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-2 border border-emerald-200">
                                            This fee will not appear in the pending list because it has already been settled in advance.
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5 pt-2">
                                    {advanceSuccess.action === 'advance_paid' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const feeObj = advanceSuccess.fee || {
                                                    _id: 'ADV-' + Date.now(),
                                                    amount: advanceForm.amount,
                                                    month: advanceForm.month,
                                                    year: advanceForm.year,
                                                    status: 'paid',
                                                    paidDate: new Date()
                                                };
                                                openReceiptModal(feeObj, advanceModal);
                                                setAdvanceModal(null);
                                                setAdvanceSuccess(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-white shadow-sm cursor-pointer"
                                            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
                                        >
                                            <IoReceiptOutline size={16} />
                                            <span>Official Receipt</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => { setAdvanceModal(null); setAdvanceSuccess(null); }}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Form Screen */
                            <form onSubmit={handleRecordAdvance} className="space-y-4">
                                {/* Student Info Card */}
                                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                            {getStudentAvatarSrc(advanceModal) ? (
                                                <img src={getStudentAvatarSrc(advanceModal)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs uppercase">
                                                    {(advanceModal.name || 'U').slice(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{advanceModal.name}</h4>
                                            <p className="text-[11px] text-slate-500 truncate">{advanceModal.mobile || advanceModal.email}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                                    {advanceModal.seatNumber ? `Desk #${advanceModal.seatNumber}` : 'Unassigned'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {advanceModal.shiftName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rate</span>
                                        <span className="text-sm font-black text-slate-900">₹{advanceModal.suggestedAmount}/mo</span>
                                        <span className="text-[10px] text-slate-500 block">Day {advanceModal.billingDay}</span>
                                    </div>
                                </div>

                                {/* Existing Recent Billed Periods */}
                                {advanceModal.feeHistorySummary && advanceModal.feeHistorySummary.length > 0 && (
                                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5">
                                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1.5">
                                            Existing Billed Periods:
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {advanceModal.feeHistorySummary.slice(-4).map((fh, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                        fh.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                            : fh.status === 'partial'
                                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                            : 'bg-orange-50 text-orange-800 border-orange-200'
                                                    }`}
                                                >
                                                    {fh.monthName} {fh.year}: {fh.isAdvancePayment ? 'Advance Paid' : fh.status.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error Banner */}
                                {error && (
                                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold">
                                        <IoCloseCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Period Selector (Month & Year) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Billing Month
                                        </label>
                                        <select
                                            value={advanceForm.month}
                                            onChange={(e) => handleAdvancePeriodChange(e.target.value, advanceForm.year)}
                                            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                        >
                                            {MONTH_NAMES.map((name, index) => (
                                                <option key={index + 1} value={index + 1}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Billing Year
                                        </label>
                                        <select
                                            value={advanceForm.year}
                                            onChange={(e) => handleAdvancePeriodChange(advanceForm.month, e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-800 outline-none"
                                        >
                                            {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Calculated Cycle Information */}
                                {(() => {
                                    const m = Number(advanceForm.month);
                                    const y = Number(advanceForm.year);
                                    const bDay = advanceModal.billingDay || 1;
                                    const cStart = new Date(y, m - 1, bDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const cEnd = new Date(y, m, bDay - 1).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    return (
                                        <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cycle Coverage</span>
                                                <span className="font-bold text-slate-700">{cStart} – {cEnd}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Due Date</span>
                                                <span className="font-bold text-slate-700">{cEnd}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Fee Amount & Due Date Override */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Fee Amount (₹)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={advanceForm.amount}
                                                onChange={(e) => setAdvanceForm(p => ({ ...p, amount: e.target.value }))}
                                                className="w-full pl-7 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={advanceForm.dueDate}
                                            onChange={(e) => setAdvanceForm(p => ({ ...p, dueDate: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Action Selector: Collect Advance vs Mark as Pending */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                                        Select Billing Action
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setAdvanceForm(p => ({ ...p, action: 'advance_paid' }))}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                advanceForm.action === 'advance_paid'
                                                    ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-xs'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black text-emerald-800">Collect Advance</span>
                                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                                    advanceForm.action === 'advance_paid' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                                }`}>
                                                    {advanceForm.action === 'advance_paid' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-600 leading-tight">
                                                Settles fee now. Will NOT appear in Pending Dues list.
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAdvanceForm(p => ({ ...p, action: 'pending' }))}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                advanceForm.action === 'pending'
                                                    ? 'bg-amber-50/90 border-2 border-amber-500 shadow-xs'
                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black text-amber-800">Mark Upcoming Due</span>
                                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                                    advanceForm.action === 'pending' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                                                }`}>
                                                    {advanceForm.action === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-600 leading-tight">
                                                Generates invoice early. Will appear in Pending Dues list.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Email Checkbox (Only for advance_paid) */}
                                {advanceForm.action === 'advance_paid' && (
                                    <label className="flex items-start gap-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={advanceForm.sendEmail}
                                            onChange={(e) => setAdvanceForm(p => ({ ...p, sendEmail: e.target.checked }))}
                                            className="w-4 h-4 mt-0.5 rounded text-orange-600 border-slate-300 focus:ring-orange-500 accent-orange-600 shrink-0"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">
                                                Send payment confirmation email
                                            </span>
                                            <span className="text-[11px] text-slate-500 block">
                                                Dispatches standard fee confirmation receipt email to {advanceModal.name} ({advanceModal.email || 'student email'}).
                                            </span>
                                        </div>
                                    </label>
                                )}

                                {/* Note Input */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                        Admin Note (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={advanceForm.note}
                                        onChange={(e) => setAdvanceForm(p => ({ ...p, note: e.target.value }))}
                                        placeholder="e.g. Paid advance for upcoming quarter via cash"
                                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs text-slate-800 outline-none"
                                    />
                                </div>

                                {/* Modal Buttons */}
                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdvanceModal(null)}
                                        disabled={advanceSubmitting}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={advanceSubmitting}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                                            advanceForm.action === 'advance_paid'
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-500/20'
                                                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/20'
                                        }`}
                                    >
                                        {advanceSubmitting ? (
                                            <>
                                                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                                <span>Processing...</span>
                                            </>
                                        ) : advanceForm.action === 'advance_paid' ? (
                                            <>
                                                <IoCheckmark size={16} />
                                                <span>Confirm Advance Payment (₹{advanceForm.amount})</span>
                                            </>
                                        ) : (
                                            <>
                                                <IoCalendarOutline size={16} />
                                                <span>Schedule Upcoming Due (₹{advanceForm.amount})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FeeManagement;
