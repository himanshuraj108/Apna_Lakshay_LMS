import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoCloseCircle,
    IoTimeOutline,
    IoDocumentTextOutline,
    IoBarChartOutline,
    IoRefresh,
    IoCalendarOutline,
    IoPeopleOutline,
    IoDownloadOutline,
    IoSparkles,
    IoTrashOutline,
    IoLockClosed,
    IoSearchOutline,
    IoCheckmark,
    IoClose,
    IoSaveOutline,
    IoCopyOutline,
    IoChevronBack,
    IoChevronForward
} from 'react-icons/io5';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useBackPath from '../../hooks/useBackPath';
import { useAuth } from '../../context/AuthContext';
import { PrimaryLogoLoader } from '../../components/ui/SkeletonLoader';
import Modal from '../../components/ui/Modal';

// Seat color palette for vibrant desk badges
const PALETTES = [
    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700 border border-purple-200' },
    { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-50 text-teal-700 border border-teal-200' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
    { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   badge: 'bg-pink-50 text-pink-700 border border-pink-200' },
    { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-700',   badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
    { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-50 text-rose-700 border border-rose-200' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
    { bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
];

const AttendanceManagement = () => {
    const backPath = useBackPath();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'subadmin';

    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    
    const getLocalDate = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [holidayName, setHolidayName] = useState('');
    const [viewTab, setViewTab] = useState('mark'); // 'mark' | 'reports'
    const [seatStudents, setSeatStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [lastLiveSync, setLastLiveSync] = useState(null);
    const [newSelfMarkDetected, setNewSelfMarkDetected] = useState(false);
    
    const pollRef = useRef(null);
    const autoSavingRef = useRef(false);

    useEffect(() => {
        fetchStudents();
        fetchHolidays();
    }, []);

    useEffect(() => {
        if (students.length > 0) loadAttendance();
    }, [selectedDate, students, viewTab]);

    useEffect(() => {
        fetchSeatView();
    }, [selectedDate]);

    // Live polling: auto-refresh seat view every 10s for today
    useEffect(() => {
        const todayStr = getLocalDate();
        if (selectedDate !== todayStr || viewTab !== 'mark') return;

        pollRef.current = setInterval(async () => {
            if (autoSavingRef.current) return;
            try {
                const res = await api.get('/admin/attendance/seat-view/' + selectedDate);
                if (autoSavingRef.current) return;
                const fresh = res.data.students;
                setSeatStudents(prev => {
                    let hasChange = false;
                    const merged = prev.map(old => {
                        const updated = fresh.find(f => f._id.toString() === old._id.toString());
                        if (!updated) return old;
                        const changed =
                            old.status !== updated.status ||
                            old.selfMarked !== updated.selfMarked;
                        if (changed) hasChange = true;
                        return changed ? updated : old;
                    });
                    fresh.forEach(f => {
                        if (!prev.find(p => p._id.toString() === f._id.toString())) {
                            merged.push(f);
                            hasChange = true;
                        }
                    });
                    if (hasChange) setNewSelfMarkDetected(true);
                    return hasChange ? [...merged] : prev;
                });
                setLastLiveSync(new Date());
            } catch (e) {
                // silent
            }
        }, 10000);

        return () => clearInterval(pollRef.current);
    }, [selectedDate, viewTab]);

    useEffect(() => {
        if (!newSelfMarkDetected) return;
        const t = setTimeout(() => setNewSelfMarkDetected(false), 3000);
        return () => clearTimeout(t);
    }, [newSelfMarkDetected]);

    const seatColorMap = useMemo(() => {
        const map = {};
        let idx = 0;
        seatStudents.forEach(s => {
            if (s.seatNumber && !map[s.seatNumber]) {
                map[s.seatNumber] = PALETTES[idx % PALETTES.length];
                idx++;
            }
        });
        return map;
    }, [seatStudents]);

    const fetchSeatView = async () => {
        try {
            const res = await api.get('/admin/attendance/seat-view/' + selectedDate);
            setSeatStudents(res.data.students || []);
        } catch (e) {
            console.error('Failed to load seat view', e);
        }
    };

    // 1-Click Toggle for individual student
    const toggleSeatStudent = async (studentId, currentStatus, isSelfMarked) => {
        if (isSubAdmin && isSelfMarked) return;

        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        
        // Instant Optimistic Update
        setSeatStudents(prev => prev.map(s =>
            s._id.toString() === studentId.toString()
                ? { ...s, status: newStatus, selfMarked: false }
                : s
        ));

        autoSavingRef.current = true;
        setAutoSaving(true);
        try {
            await api.post('/admin/attendance', {
                date: selectedDate,
                attendanceData: [{ studentId, status: newStatus }]
            });
            setLastSaved(new Date());
            const confirm = await api.get('/admin/attendance/seat-view/' + selectedDate + '?t=' + Date.now());
            if (confirm.data?.students) {
                setSeatStudents(confirm.data.students);
            }
        } catch (e) {
            console.error('Auto-save failed', e);
        } finally {
            setAutoSaving(false);
            autoSavingRef.current = false;
        }
    };

    // Bulk actions
    const markAllSeatsPresent = async () => {
        const unpresent = seatStudents.filter(s => s.status !== 'present' && !(isSubAdmin && s.selfMarked));
        if (unpresent.length === 0) return;

        setSeatStudents(prev => prev.map(s => (isSubAdmin && s.selfMarked ? s : { ...s, status: 'present' })));
        autoSavingRef.current = true;
        setAutoSaving(true);
        try {
            const attendanceData = unpresent.map(s => ({ studentId: s._id, status: 'present' }));
            await api.post('/admin/attendance', { date: selectedDate, attendanceData });
            setLastSaved(new Date());
            const confirm = await api.get('/admin/attendance/seat-view/' + selectedDate + '?t=' + Date.now());
            if (confirm.data?.students) setSeatStudents(confirm.data.students);
        } catch (e) {
            console.error('Bulk present failed', e);
        } finally {
            setAutoSaving(false);
            autoSavingRef.current = false;
        }
    };

    const markAllSeatsAbsent = async () => {
        const unabsent = seatStudents.filter(s => s.status !== 'absent' && !(isSubAdmin && s.selfMarked));
        if (unabsent.length === 0) return;

        setSeatStudents(prev => prev.map(s => (isSubAdmin && s.selfMarked ? s : { ...s, status: 'absent' })));
        autoSavingRef.current = true;
        setAutoSaving(true);
        try {
            const attendanceData = unabsent.map(s => ({ studentId: s._id, status: 'absent' }));
            await api.post('/admin/attendance', { date: selectedDate, attendanceData });
            setLastSaved(new Date());
            const confirm = await api.get('/admin/attendance/seat-view/' + selectedDate + '?t=' + Date.now());
            if (confirm.data?.students) setSeatStudents(confirm.data.students);
        } catch (e) {
            console.error('Bulk absent failed', e);
        } finally {
            setAutoSaving(false);
            autoSavingRef.current = false;
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            const active = (res.data.students || []).filter(s => s.isActive);
            setStudents(active);
            const init = {};
            active.forEach(s => {
                init[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            });
            setAttendance(init);
        } catch (e) {
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async () => {
        try {
            const res = await api.get('/admin/attendance/' + selectedDate);
            const map = {};
            students.forEach(s => {
                map[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            });
            if (res.data.attendance && res.data.attendance.length > 0) {
                res.data.attendance.forEach(r => {
                    if (map[r.student._id]) {
                        map[r.student._id] = {
                            status: r.status,
                            entryTime: r.entryTime || '',
                            exitTime: r.exitTime || '',
                            notes: r.notes || ''
                        };
                    }
                });
            }
            setAttendance(map);
        } catch (e) {
            console.log('No attendance for this date');
        }
    };

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/admin/holidays');
            setHolidays(res.data.holidays || []);
        } catch (e) {
            console.error('Failed to load holidays');
        }
    };

    const declareHoliday = async () => {
        if (!holidayName.trim()) {
            setError('Please enter a festival or holiday name');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/admin/holidays', { date: selectedDate, name: holidayName.trim() });
            setSuccess('Holiday declared for ' + selectedDate + '!');
            setHolidayName('');
            setShowHolidayModal(false);
            setTimeout(() => setSuccess(''), 4000);
            fetchHolidays();
            loadAttendance();
            fetchSeatView();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to declare holiday');
            setTimeout(() => setError(''), 4000);
        } finally {
            setSaving(false);
        }
    };

    const removeHoliday = async (id, name) => {
        if (!window.confirm('Remove holiday "' + name + '"? This will revert attendance for that date.')) return;
        setSaving(true);
        try {
            await api.delete('/admin/holidays/' + id);
            setSuccess('Holiday removed');
            setTimeout(() => setSuccess(''), 3000);
            fetchHolidays();
            loadAttendance();
            fetchSeatView();
        } catch (e) {
            setError('Failed to remove holiday');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = (studentId) => {
        setAttendance(prev => {
            const current = prev[studentId]?.status || 'absent';
            const next = current === 'present' ? 'absent' : current === 'absent' ? 'holiday' : 'present';
            return {
                ...prev,
                [studentId]: { ...prev[studentId], status: next }
            };
        });
    };

    const updateField = (studentId, field, value) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value }
        }));
    };

    const setNow = (studentId, field) => {
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        updateField(studentId, field, now);
    };

    const markAllPresent = () => {
        const updated = {};
        students.forEach(s => {
            updated[s._id] = { ...attendance[s._id], status: 'present' };
        });
        setAttendance(updated);
    };

    const markAllAbsent = () => {
        const updated = {};
        students.forEach(s => {
            updated[s._id] = { ...attendance[s._id], status: 'absent' };
        });
        setAttendance(updated);
    };

    const saveAttendance = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const attendanceData = Object.keys(attendance).map(studentId => ({
                studentId,
                status: attendance[studentId].status,
                entryTime: attendance[studentId].entryTime,
                exitTime: attendance[studentId].exitTime,
                notes: attendance[studentId].notes
            }));
            await api.post('/admin/attendance', { date: selectedDate, attendanceData });
            setSuccess('Attendance saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
            fetchSeatView();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    // PDF Reports
    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Daily Attendance Report - ' + selectedDate, 14, 15);
        doc.setFontSize(10);
        doc.text('Present: ' + presentCount + ' | Absent: ' + absentCount, 14, 22);

        const tableColumn = ['Student Name', 'Email', 'Seat', 'Status', 'Entry Time', 'Exit Time'];
        const tableRows = [];

        filteredStudents.forEach(student => {
            const data = attendance[student._id] || { status: 'absent' };
            const seatNumber = student.seat ? 'Seat ' + student.seat.number : 'Unassigned';
            tableRows.push([
                student.name,
                student.email,
                seatNumber,
                data.status.toUpperCase(),
                data.entryTime || '-',
                data.exitTime || '-'
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            headStyles: { fillColor: [234, 88, 12] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    if (data.cell.raw === 'PRESENT') {
                        data.cell.styles.textColor = [34, 197, 94];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'ABSENT') {
                        data.cell.styles.textColor = [239, 68, 68];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        doc.save('Attendance_' + selectedDate + '.pdf');
    };

    const generateMonthlyPDF = async () => {
        setSaving(true);
        try {
            const dateObj = new Date(selectedDate);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const res = await api.get('/admin/attendance/monthly?year=' + year + '&month=' + month);
            const records = res.data.attendance;
            const daysInMonth = new Date(year, month, 0).getDate();

            const doc = new jsPDF('landscape');
            const tableColumn = ['Name', 'Seat'];
            for (let i = 1; i <= daysInMonth; i++) {
                tableColumn.push(i.toString());
            }
            tableColumn.push('%');

            const tableRows = [];
            filteredStudents.forEach(student => {
                const row = [student.name, student.seat ? student.seat.number.toString() : '-'];
                let presents = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                    const rec = records.find(r => {
                        const rDate = new Date(r.date).toISOString().split('T')[0];
                        return rDate === dateStr && r.student._id.toString() === student._id.toString();
                    });
                    if (rec) {
                        if (rec.status === 'present') {
                            row.push('P');
                            presents++;
                        } else if (rec.status === 'holiday') {
                            row.push('H');
                            presents++;
                        } else {
                            row.push('A');
                        }
                    } else {
                        row.push('-');
                    }
                }
                const pct = Math.round((presents / daysInMonth) * 100);
                row.push(pct + '%');
                tableRows.push(row);
            });

            const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            doc.setFontSize(16);
            doc.text('Monthly Attendance Matrix Report - ' + monthName, 14, 15);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [234, 88, 12], halign: 'center' },
                columnStyles: { 0: { halign: 'left', minCellWidth: 25 }, 1: { halign: 'center' } },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        if (data.column.index === tableColumn.length - 1) {
                            const pct = parseInt(data.cell.raw);
                            if (!isNaN(pct)) {
                                if (pct >= 75) data.cell.styles.textColor = [34, 197, 94];
                                else if (pct >= 50) data.cell.styles.textColor = [245, 158, 11];
                                else data.cell.styles.textColor = [239, 68, 68];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        } else if (data.column.index >= 2 && data.column.index < 2 + daysInMonth) {
                            if (data.cell.raw === 'P') {
                                data.cell.styles.textColor = [34, 197, 94];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (data.cell.raw === 'A') {
                                data.cell.styles.textColor = [239, 68, 68];
                                data.cell.styles.fontStyle = 'bold';
                            } else if (data.cell.raw === 'H') {
                                data.cell.styles.textColor = [245, 158, 11];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                }
            });

            doc.save('Monthly_Attendance_' + monthName.replace(' ', '_') + '.pdf');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate monthly report');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const generateYearlyPDF = async () => {
        setSaving(true);
        try {
            const year = new Date(selectedDate).getFullYear();
            const res = await api.get('/admin/attendance/yearly?year=' + year);
            const records = res.data.attendance;

            const doc = new jsPDF('landscape');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const tableColumn = ['Name', 'Seat', ...months, 'Avg %'];
            const tableRows = [];

            filteredStudents.forEach(student => {
                const row = [student.name, student.seat ? student.seat.number.toString() : '-'];
                let totalPct = 0;
                let activeMonths = 0;

                months.forEach((m, mIdx) => {
                    const monthRecs = records.filter(r => {
                        const rDate = new Date(r.date);
                        return rDate.getMonth() === mIdx && r.student._id.toString() === student._id.toString();
                    });
                    if (monthRecs.length > 0) {
                        const presents = monthRecs.filter(r => r.status === 'present' || r.status === 'holiday').length;
                        const pct = Math.round((presents / monthRecs.length) * 100);
                        row.push(pct + '%');
                        totalPct += pct;
                        activeMonths++;
                    } else {
                        row.push('-');
                    }
                });

                const avg = activeMonths > 0 ? Math.round(totalPct / activeMonths) : 0;
                row.push(avg + '%');
                tableRows.push(row);
            });

            doc.setFontSize(16);
            doc.text('Yearly Attendance Summary - ' + year, 14, 15);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [234, 88, 12] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === tableColumn.length - 1) {
                        const pct = parseInt(data.cell.raw);
                        if (!isNaN(pct)) {
                            if (pct >= 75) data.cell.styles.textColor = [34, 197, 94];
                            else if (pct >= 50) data.cell.styles.textColor = [245, 158, 11];
                            else data.cell.styles.textColor = [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            });

            doc.save('Yearly_Attendance_' + year + '.pdf');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate yearly report');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    // Filter calculations
    const filteredStudents = students.filter(s => {
        if (!s.createdAt) return true;
        const admission = new Date(s.createdAt);
        admission.setHours(0, 0, 0, 0);
        const sel = new Date(selectedDate);
        sel.setHours(0, 0, 0, 0);
        return sel >= admission;
    });

    const presentCount = Object.keys(attendance).filter(id => filteredStudents.find(s => s._id === id) && attendance[id]?.status === 'present').length;
    const holidayCount = Object.keys(attendance).filter(id => filteredStudents.find(s => s._id === id) && attendance[id]?.status === 'holiday').length;
    const absentCount = filteredStudents.length - presentCount - holidayCount;

    // Real-time seat counts
    const presentSeatCount = seatStudents.filter(s => s.status === 'present').length;
    const absentSeatCount = seatStudents.filter(s => s.status === 'absent').length;
    const appSelfMarkedCount = seatStudents.filter(s => s.selfMarked).length;

    const selectedHoliday = holidays.find(h => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        const selDate = new Date(selectedDate);
        selDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === selDate.getTime();
    });

    // Search filter for seatStudents
    const searchedSeatStudents = useMemo(() => {
        if (!searchQuery.trim()) return seatStudents;
        const q = searchQuery.toLowerCase().trim();
        return seatStudents.filter(s => {
            const name = (s.name || '').toLowerCase();
            const seat = (s.seatNumber || '').toString().toLowerCase();
            const shift = (s.shiftName || '').toLowerCase();
            return name.includes(q) || seat.includes(q) || shift.includes(q);
        });
    }, [seatStudents, searchQuery]);

    const changeDateBy = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const nextStr = d.toISOString().split('T')[0];
        const todayStr = getLocalDate();
        if (nextStr <= todayStr) {
            setSelectedDate(nextStr);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-24" style={{ backgroundColor: '#f8fafc' }}>
            {/* Top Subtle Brand Gradient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* ═════════════════════════════════════════════════════════
                    EXECUTIVE HEADER
                ═════════════════════════════════════════════════════════ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <Link to={backPath}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl transition-all flex items-center justify-center border border-slate-200/80"
                                title="Back to Dashboard"
                            >
                                <IoArrowBack size={18} />
                            </motion.button>
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold mb-1">
                                <IoSparkles size={12} className="text-orange-500" />
                                <span>{isSubAdmin ? 'Sub Admin Roster' : 'Main Campus · Live Desk Roster'}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                Attendance Management
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Easy 1-click attendance marking, real-time sync & institutional reports
                            </p>
                        </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {!isSubAdmin && (
                            <button
                                onClick={() => setShowHolidayModal(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                            >
                                <IoSparkles size={14} className="text-amber-500" />
                                <span>Declare Holiday</span>
                            </button>
                        )}
                        {!isSubAdmin && (
                            <Link to="/admin/analytics">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all"
                                >
                                    <IoBarChartOutline size={15} />
                                    <span>View Analytics</span>
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Toasts */}
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

                {/* ── Tab Switcher ── */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 p-1.5 rounded-2xl shadow-xs w-fit">
                    <button
                        onClick={() => setViewTab('mark')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            viewTab === 'mark'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <IoCalendarOutline size={14} />
                        <span>Mark Attendance</span>
                    </button>
                    {!isSubAdmin && (
                        <button
                            onClick={() => setViewTab('reports')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                viewTab === 'reports'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <IoDocumentTextOutline size={14} />
                            <span>Reports & History</span>
                        </button>
                    )}
                </div>

                {/* ═════════════════════════════════════════════════════════
                    TAB 1: MARK ATTENDANCE (DESK VIEW)
                ═════════════════════════════════════════════════════════ */}
                {viewTab === 'mark' && (
                    <div className="space-y-6">
                        {/* 4 Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {/* Total In Roster */}
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                        <IoPeopleOutline size={16} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-slate-900 tabular-nums">
                                    {seatStudents.length || filteredStudents.length}
                                </p>
                            </div>

                            {/* Present */}
                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Present</span>
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <IoCheckmarkCircle size={16} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-emerald-600 tabular-nums">
                                        {presentSeatCount}
                                    </p>
                                    <span className="text-xs font-bold text-emerald-700">
                                        {seatStudents.length > 0 ? Math.round((presentSeatCount / seatStudents.length) * 100) : 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Absent */}
                            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Absent</span>
                                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                                        <IoCloseCircle size={16} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-rose-600 tabular-nums">
                                    {absentSeatCount}
                                </p>
                            </div>

                            {/* App Self-Marked */}
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">App / QR Punches</span>
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                        <IoTimeOutline size={16} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-amber-600 tabular-nums">
                                    {appSelfMarkedCount}
                                </p>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {/* Date Navigation */}
                                <div className="flex items-center gap-2">
                                    {!isSubAdmin && (
                                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                                            <button
                                                onClick={() => changeDateBy(-1)}
                                                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
                                                title="Previous Day"
                                            >
                                                <IoChevronBack size={15} />
                                            </button>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={e => setSelectedDate(e.target.value)}
                                                max={getLocalDate()}
                                                className="bg-transparent border-none text-slate-900 text-xs font-bold outline-none px-2 py-1 cursor-pointer"
                                            />
                                            <button
                                                onClick={() => changeDateBy(1)}
                                                disabled={selectedDate >= getLocalDate()}
                                                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Next Day"
                                            >
                                                <IoChevronForward size={15} />
                                            </button>
                                        </div>
                                    )}

                                    {selectedDate !== getLocalDate() && (
                                        <button
                                            onClick={() => setSelectedDate(getLocalDate())}
                                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Today
                                        </button>
                                    )}

                                    <button
                                        onClick={fetchSeatView}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                        title="Refresh roster"
                                    >
                                        <IoRefresh size={14} />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </button>
                                </div>

                                {/* Live Sync Status */}
                                <div className="flex items-center gap-3 text-xs">
                                    {autoSaving && (
                                        <span className="text-orange-600 font-bold animate-pulse flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                            Saving...
                                        </span>
                                    )}
                                    {!autoSaving && lastSaved && (
                                        <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                            <IoCheckmarkCircle size={13} className="text-emerald-600" />
                                            <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </span>
                                    )}

                                    {selectedDate === getLocalDate() && (
                                        <AnimatePresence mode="wait">
                                            {newSelfMarkDetected ? (
                                                <motion.span
                                                    key="updated"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-orange-700 font-bold bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                                                    Punch detected!
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="live"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-slate-500 font-semibold"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>Live Active</span>
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>

                            {/* Search & Bulk Quick Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                <div className="relative flex-1 max-w-md">
                                    <IoSearchOutline size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by student name, desk number, or shift..."
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <IoClose size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        onClick={markAllSeatsPresent}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                                    >
                                        <IoCheckmarkCircle size={14} />
                                        <span>Mark All Present</span>
                                    </button>
                                    <button
                                        onClick={markAllSeatsAbsent}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                                    >
                                        <IoCloseCircle size={14} />
                                        <span>Mark All Absent</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Student Cards List */}
                        {loading ? (
                            <PrimaryLogoLoader text="Loading Attendance Desk Roster..." />
                        ) : searchedSeatStudents.length === 0 ? (
                            <div className="bg-white border border-slate-200/90 rounded-2xl py-16 text-center shadow-xs">
                                <IoPeopleOutline size={38} className="mx-auto mb-2 text-slate-300" />
                                <p className="font-bold text-slate-600 text-sm">No students found</p>
                                <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or desk number</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {searchedSeatStudents.map((student, i) => {
                                    const palette = seatColorMap[student.seatNumber] || { badge: 'bg-slate-100 text-slate-700 border border-slate-200' };
                                    const isPresent = student.status === 'present';
                                    const isLocked = student.selfMarked || (student.markedBy && student.markedBy.toString() === student._id.toString());

                                    const initials = student.name
                                        ? student.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                                        : '?';

                                    const displayName = student.name
                                        ? student.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                                        : 'Unknown';

                                    return (
                                        <motion.div
                                            key={student._id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(i * 0.015, 0.2), duration: 0.2 }}
                                            className={`bg-white rounded-2xl overflow-hidden border transition-all flex items-stretch ${
                                                isLocked
                                                    ? 'border-slate-200/90 opacity-80'
                                                    : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                                            }`}
                                        >
                                            {/* Left Accent Bar */}
                                            <div className={`w-1.5 shrink-0 ${
                                                isLocked
                                                    ? 'bg-slate-400'
                                                    : isPresent
                                                        ? 'bg-emerald-500'
                                                        : 'bg-rose-400'
                                            }`} />

                                            {/* Row Content */}
                                            <div className="flex items-center gap-3.5 flex-1 px-4 py-3 sm:py-3.5">
                                                {/* Seat / Avatar Box */}
                                                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                                                    isLocked ? 'bg-slate-100 text-slate-500 border border-slate-200' : palette.badge
                                                }`}>
                                                    <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-75">DESK</span>
                                                    <span className="text-base leading-none font-black">{student.seatNumber || initials}</span>
                                                </div>

                                                {/* Name + Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
                                                            {displayName}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-xs text-slate-500 font-semibold">
                                                            {student.shiftName || 'Standard Shift'}
                                                        </span>
                                                        {isPresent && (student.entryTime || student.exitTime) && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                                                                <IoTimeOutline size={11} />
                                                                <span>In: {student.entryTime || '--'} | Out: {student.exitTime || '--'}</span>
                                                            </span>
                                                        )}
                                                        {isLocked && (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                                                <IoLockClosed size={10} />
                                                                <span>Self-marked</span>
                                                            </span>
                                                        )}
                                                        {!student.hasSeat && (
                                                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                                No Seat
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Pill & 1-Click Toggle */}
                                                <div className="shrink-0 flex items-center gap-3">
                                                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                                                        isLocked
                                                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                            : isPresent
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                            isLocked ? 'bg-slate-400' : isPresent ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                                        }`} />
                                                        <span>{isLocked ? 'Locked' : isPresent ? 'Present' : 'Absent'}</span>
                                                    </span>

                                                    {/* Smooth 1-Click Toggle Switch */}
                                                    <button
                                                        onClick={() => toggleSeatStudent(student._id, student.status, student.selfMarked)}
                                                        disabled={isSubAdmin && isLocked}
                                                        title={(isSubAdmin && isLocked) ? 'Student self-marked — locked for sub-admins' : `Click to mark ${isPresent ? 'Absent' : 'Present'}`}
                                                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none shrink-0 cursor-pointer shadow-2xs ${
                                                            isSubAdmin && isLocked
                                                                ? 'bg-slate-300 cursor-not-allowed'
                                                                : isPresent
                                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                                    : 'bg-rose-500 hover:bg-rose-600'
                                                        }`}
                                                    >
                                                        {isSubAdmin && isLocked ? (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <IoLockClosed size={13} className="text-white" />
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-200 text-xs font-bold ${
                                                                    isPresent ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-rose-500'
                                                                }`}
                                                            >
                                                                {isPresent ? <IoCheckmark size={14} /> : <IoClose size={14} />}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════
                    TAB 2: REPORTS & HISTORY
                ═════════════════════════════════════════════════════════ */}
                {viewTab === 'reports' && (
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4"
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Select Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        max={getLocalDate()}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-bold focus:border-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={loadAttendance}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all sm:mt-5"
                                >
                                    <IoRefresh size={14} /> Refresh
                                </button>
                                <button
                                    onClick={markAllPresent}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all sm:mt-5"
                                >
                                    <IoCheckmarkCircle size={14} /> All Present
                                </button>
                                <button
                                    onClick={markAllAbsent}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all sm:mt-5"
                                >
                                    <IoCloseCircle size={14} /> All Absent
                                </button>
                            </div>

                            {selectedHoliday && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-bold"
                                >
                                    <IoSparkles size={16} className="text-amber-500" />
                                    <span>Declared Holiday: {selectedHoliday.name}</span>
                                    <button
                                        onClick={() => removeHoliday(selectedHoliday._id, selectedHoliday.name)}
                                        className="ml-auto text-xs text-rose-600 hover:text-rose-800 underline font-bold"
                                    >
                                        Remove
                                    </button>
                                </motion.div>
                            )}

                            {/* Export Buttons */}
                            <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                                <button
                                    onClick={generatePDF}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold transition-all"
                                >
                                    <IoDownloadOutline size={15} /> Daily Report
                                </button>
                                <button
                                    onClick={generateMonthlyPDF}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    <IoDownloadOutline size={15} /> Monthly Matrix
                                </button>
                                <button
                                    onClick={generateYearlyPDF}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    <IoDownloadOutline size={15} /> Yearly Summary
                                </button>
                                <button
                                    onClick={() => setShowHolidayModal(true)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-all"
                                >
                                    <IoSparkles size={15} /> Declare Holiday
                                </button>
                                <button
                                    onClick={() => {
                                        const link = window.location.origin + '/office/attendance';
                                        navigator.clipboard.writeText(link);
                                        setSuccess('Public Office Link copied to clipboard!');
                                        setTimeout(() => setSuccess(''), 3000);
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all ml-auto"
                                >
                                    <IoCopyOutline size={15} /> Copy Office Link
                                </button>
                            </div>

                            {/* Summary & Save Row */}
                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Present:</span>
                                        <span className="text-base font-black text-emerald-700">{presentCount}</span>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Absent:</span>
                                        <span className="text-base font-black text-rose-700">{absentCount}</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={saveAttendance}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 disabled:opacity-50"
                                >
                                    <IoSaveOutline size={16} />
                                    <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Student Grid for Manual Editing */}
                        {loading ? (
                            <PrimaryLogoLoader text="Loading Attendance Matrix..." />
                        ) : filteredStudents.length === 0 ? (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-xs">
                                <IoPeopleOutline size={38} className="text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-600 text-sm">No active students found for this date</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                {filteredStudents.map(student => {
                                    const data = attendance[student._id] || { status: 'absent' };
                                    const isPresent = data.status === 'present';
                                    const isHoliday = data.status === 'holiday';
                                    const hasSeat = !!student.seat;

                                    return (
                                        <motion.div
                                            key={student._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`rounded-2xl border transition-all p-4 bg-white ${
                                                !hasSeat
                                                    ? 'border-amber-200/80'
                                                    : isPresent
                                                        ? 'border-emerald-200/90'
                                                        : isHoliday
                                                            ? 'border-amber-200/90'
                                                            : 'border-slate-200/90'
                                            } shadow-2xs`}
                                        >
                                            <div
                                                className="flex items-start justify-between cursor-pointer"
                                                onClick={() => !hasSeat ? navigate('/admin/students?tab=pending') : toggleStatus(student._id)}
                                            >
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h3 className="font-bold text-sm text-slate-900 truncate">{student.name}</h3>
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{student.email}</p>
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {student.seat ? (
                                                            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                                                                Desk #{student.seat.number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                                                                Unallocated
                                                            </span>
                                                        )}
                                                        {isPresent && (data.entryTime || data.exitTime) && (
                                                            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                                                <IoTimeOutline size={10} />
                                                                <span>{data.entryTime || '--'} - {data.exitTime || '--'}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStatus(student._id);
                                                    }}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                                        isPresent
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : isHoliday
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}
                                                >
                                                    {isPresent ? 'Present' : isHoliday ? 'Holiday' : 'Absent'}
                                                </button>
                                            </div>

                                            {/* Time Inputs */}
                                            {isPresent && (
                                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Entry</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNow(student._id, 'entryTime')}
                                                                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold"
                                                            >
                                                                Now
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="time"
                                                            value={data.entryTime || ''}
                                                            onChange={e => updateField(student._id, 'entryTime', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none focus:border-orange-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Exit</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNow(student._id, 'exitTime')}
                                                                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold"
                                                            >
                                                                Now
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="time"
                                                            value={data.exitTime || ''}
                                                            onChange={e => updateField(student._id, 'exitTime', e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 outline-none focus:border-orange-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Holiday Declaration Modal ── */}
            <Modal
                isOpen={showHolidayModal}
                onClose={() => {
                    setShowHolidayModal(false);
                    setHolidayName('');
                }}
                title="Declare Institutional Holiday"
            >
                <div className="space-y-4 pt-1">
                    <p className="text-xs text-slate-500">
                        All active students will automatically be credited with attendance on this date ({selectedDate}).
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Holiday / Festival Title
                        </label>
                        <input
                            type="text"
                            value={holidayName}
                            onChange={e => setHolidayName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && declareHoliday()}
                            placeholder="e.g. Holi, Diwali, Independence Day"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowHolidayModal(false);
                                setHolidayName('');
                            }}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={declareHoliday}
                            disabled={saving || !holidayName.trim()}
                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <IoSparkles size={14} />
                            <span>{saving ? 'Declaring...' : 'Declare Holiday'}</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AttendanceManagement;
