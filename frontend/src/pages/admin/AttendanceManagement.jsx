import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoSave,
    IoTimeOutline, IoDocumentTextOutline, IoFlashOutline,
    IoBarChartOutline, IoRefresh, IoArrowForward, IoBedOutline,
    IoCalendarOutline, IoPeopleOutline, IoDownloadOutline,
    IoSparkles, IoTrashOutline, IoLockClosed
} from 'react-icons/io5';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import useBackPath from '../../hooks/useBackPath';
import { useAuth } from '../../context/AuthContext';

const PAGE_BG = { background: '#F8FAFC' };

const AttendanceManagement = () => {
    const backPath = useBackPath();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isSubAdmin = user?.role === 'subadmin';
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const getLocalDate = () => {
        const d = new Date(); const offset = d.getTimezoneOffset() * 60000;
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
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [lastLiveSync, setLastLiveSync] = useState(null);
    const [newSelfMarkDetected, setNewSelfMarkDetected] = useState(false);
    const pollRef = useRef(null);
    const autoSavingRef = useRef(false);

    useEffect(() => { fetchStudents(); fetchHolidays(); }, []);
    useEffect(() => { if (students.length > 0) loadAttendance(); }, [selectedDate, students]);
    useEffect(() => { fetchSeatView(); }, [selectedDate]);

    // ── Live polling: auto-refresh seat view every 20s for today's date ──────
    useEffect(() => {
        const todayStr = getLocalDate();
        if (selectedDate !== todayStr || viewTab !== 'mark') return; // only poll today

        pollRef.current = setInterval(async () => {
            if (autoSavingRef.current) return; // don't poll mid-save
            try {
                const res = await api.get(`/admin/attendance/seat-view/${selectedDate}`);
                // Re-check: if a save started while this GET was in-flight, discard stale data
                if (autoSavingRef.current) return;
                const fresh = res.data.students;
                setSeatStudents(prev => {
                    // Only update cards that changed (avoids re-rendering non-changed rows)
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
                    // Also add any new students not yet in list
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
            } catch (e) { /* silent fail */ }
        }, 10000); // every 10 seconds

        return () => clearInterval(pollRef.current);
    }, [selectedDate, viewTab]);

    // Flash the badge briefly then reset
    useEffect(() => {
        if (!newSelfMarkDetected) return;
        const t = setTimeout(() => setNewSelfMarkDetected(false), 3000);
        return () => clearTimeout(t);
    }, [newSelfMarkDetected]);


    // ── Seat color palette (same seat = same color highlight) ──────────────
    const PALETTES = [
        { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
        { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
        { bg: 'bg-teal-50',   border: 'border-teal-300',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700' },
        { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
        { bg: 'bg-pink-50',   border: 'border-pink-300',   text: 'text-pink-700',   badge: 'bg-pink-100 text-pink-700' },
        { bg: 'bg-cyan-50',   border: 'border-cyan-300',   text: 'text-cyan-700',   badge: 'bg-cyan-100 text-cyan-700' },
        { bg: 'bg-rose-50',   border: 'border-rose-300',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700' },
        { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
        { bg: 'bg-lime-50',   border: 'border-lime-300',   text: 'text-lime-700',   badge: 'bg-lime-100 text-lime-700' },
        { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
    ];

    const seatColorMap = (() => {
        const map = {}; let idx = 0;
        seatStudents.forEach(s => {
            if (s.seatNumber && !map[s.seatNumber]) { map[s.seatNumber] = PALETTES[idx % PALETTES.length]; idx++; }
        });
        return map;
    })();

    const fetchSeatView = async () => {
        try {
            const res = await api.get(`/admin/attendance/seat-view/${selectedDate}`);
            setSeatStudents(res.data.students);
        } catch (e) { console.error('Failed to load seat view', e); }
    };

    // Toggle a student's status in the seat-view list and auto-save immediately
    const toggleSeatStudent = async (studentId, currentStatus, isSelfMarked) => {
        // Sub-admins cannot toggle self-marked records
        if (isSubAdmin && isSelfMarked) return;

        const newStatus = currentStatus === 'present' ? 'absent' : 'present';
        // Optimistic update — clear selfMarked so super admin override reflects immediately
        setSeatStudents(prev => prev.map(s =>
            s._id.toString() === studentId.toString()
                ? { ...s, status: newStatus, selfMarked: false }
                : s
        ));
        // Auto-save to backend
        autoSavingRef.current = true;
        setAutoSaving(true);
        try {
            await api.post('/admin/attendance', {
                date: selectedDate,
                attendanceData: [{ studentId, status: newStatus }]
            });
            setLastSaved(new Date());
            // Immediately re-fetch confirmed state from DB (?t= busts browser cache)
            const confirm = await api.get(`/admin/attendance/seat-view/${selectedDate}?t=${Date.now()}`);
            if (confirm.data?.students) setSeatStudents(confirm.data.students);
        } catch (e) { console.error('Auto-save failed', e); }
        finally { setAutoSaving(false); autoSavingRef.current = false; }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            const active = res.data.students.filter(s => s.isActive);
            setStudents(active);
            const init = {};
            active.forEach(s => { init[s._id] = { status: 'present', entryTime: '', exitTime: '', notes: '' }; });
            setAttendance(init);
        } catch (e) { setError('Failed to load students'); }
        finally { setLoading(false); }
    };

    const loadAttendance = async () => {
        try {
            const res = await api.get(`/admin/attendance/${selectedDate}`);
            if (res.data.attendance.length > 0) {
                const map = {};
                students.forEach(s => { map[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' }; });
                res.data.attendance.forEach(r => {
                    if (map[r.student._id]) map[r.student._id] = { status: r.status, entryTime: r.entryTime || '', exitTime: r.exitTime || '', notes: r.notes || '' };
                });
                setAttendance(map);
            } else {
                const init = {};
                students.forEach(s => { init[s._id] = { status: 'absent', entryTime: '', exitTime: '', notes: '' }; });
                setAttendance(init);
            }
        } catch (e) { console.log('No attendance for this date'); }
    };

    const fetchHolidays = async () => {
        try {
            const res = await api.get('/admin/holidays');
            setHolidays(res.data.holidays || []);
        } catch (e) { console.error('Failed to load holidays'); }
    };

    const declareHoliday = async () => {
        if (!holidayName.trim()) { setError('Please enter a festival name'); return; }
        setSaving(true); setError(''); setSuccess('');
        try {
            await api.post('/admin/holidays', { date: selectedDate, name: holidayName.trim() });
            setSuccess(`Holiday "${holidayName.trim()}" declared for ${selectedDate}!`);
            setHolidayName('');
            setShowHolidayModal(false);
            setTimeout(() => setSuccess(''), 4000);
            fetchHolidays();
            loadAttendance();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to declare holiday');
            setTimeout(() => setError(''), 4000);
        } finally { setSaving(false); }
    };

    const removeHoliday = async (id, name) => {
        if (!window.confirm(`Remove holiday "${name}"? This will revert attendance for that date.`)) return;
        setSaving(true);
        try {
            await api.delete(`/admin/holidays/${id}`);
            setSuccess(`Holiday "${name}" removed.`);
            setTimeout(() => setSuccess(''), 4000);
            fetchHolidays();
            loadAttendance();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to remove holiday');
            setTimeout(() => setError(''), 4000);
        } finally { setSaving(false); }
    };

    const toggleStatus = (id) => {
        const s = students.find(s => s._id === id);
        if (!s?.seat) return;
        setAttendance(prev => {
            const cur = prev[id] || { status: 'absent', entryTime: '', exitTime: '', notes: '' };
            const next = cur.status === 'present' ? 'absent' : cur.status === 'holiday' ? 'present' : 'present';
            return { ...prev, [id]: { ...cur, status: next, entryTime: next === 'absent' ? '' : cur.entryTime, exitTime: next === 'absent' ? '' : cur.exitTime } };
        });
    };

    const updateField = (id, field, value) => setAttendance(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));

    const setNow = (id, field) => {
        const now = new Date();
        const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (field === 'entryTime') setAttendance(prev => ({ ...prev, [id]: { ...prev[id], status: 'present', entryTime: t } }));
        else updateField(id, field, t);
    };

    const markAllPresent = () => setAttendance(prev => {
        const u = { ...prev };
        Object.keys(u).forEach(id => { if (students.find(s => s._id === id)?.seat) u[id] = { ...u[id], status: 'present' }; });
        return u;
    });
    const markAllAbsent = () => setAttendance(prev => {
        const u = { ...prev };
        Object.keys(u).forEach(id => { u[id] = { ...u[id], status: 'absent', entryTime: '', exitTime: '' }; });
        return u;
    });

    const saveAttendance = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            const data = Object.entries(attendance).map(([studentId, d]) => ({ studentId, ...d }));
            await api.post('/admin/attendance', { date: selectedDate, attendanceData: data });
            setSuccess('Attendance saved!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setError(e.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["S.No", "Name", "Seat", "Shift", "Status", "Entry", "Exit", "Dist (m)"];
        const tableRows = [];

        filteredStudents.forEach((student, index) => {
            const data = attendance[student._id] || { status: 'absent' };

            let shiftStr = "N/A";
            if (student.seat && student.seat.assignments) {
                const activeAsgn = student.seat.assignments.find(a => a.student === student._id && a.status === 'active');
                if (activeAsgn) {
                    shiftStr = activeAsgn.shift ? activeAsgn.shift.name : (activeAsgn.legacyShift || 'N/A');
                }
            }

            const status = data.status === 'present' ? 'P' : data.status === 'holiday' ? 'H' : 'A';
            const entry = data.entryTime || '-';
            const exit = data.exitTime || '-';
            const distance = data.distanceMeters ? `${data.distanceMeters}m` : '-';

            const rowData = [
                index + 1,
                student.name,
                
                student.seat ? student.seat.number : 'Pending',
                shiftStr,
                status,
                entry,
                exit,
                distance
            ];
            tableRows.push(rowData);
        });

        const dateStr = new Date(selectedDate).toLocaleDateString('en-GB');
        doc.setFontSize(16);
        doc.text(`Daily Attendance Report - ${dateStr}`, 14, 15);

        // Add Current Attendance Dashboard summary
        doc.setFontSize(10);
        const totalSelected = presentCount + absentCount;
        const currentPercentage = totalSelected > 0 ? ((presentCount / totalSelected) * 100).toFixed(1) : 0;
        doc.text(`Total Present: ${presentCount}   |   Total Absent: ${absentCount}   |   Overall Attendance: ${currentPercentage}%`, 14, 22);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [63, 81, 181] },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw === 'P') {
                        data.cell.styles.textColor = [34, 197, 94]; // Green-500
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'H') {
                        data.cell.styles.textColor = [245, 158, 11]; // Amber-500
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.cell.raw === 'A') {
                        data.cell.styles.textColor = [239, 68, 68]; // Red-500
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        doc.save(`Attendance_Report_${selectedDate}.pdf`);
    };

    const generateMonthlyPDF = async () => {
        try {
            const dateObj = new Date(selectedDate);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;

            setSaving(true);
            const res = await api.get(`/admin/attendance/monthly/${year}/${month}`);
            const reportData = res.data.report;

            const doc = new jsPDF('landscape');
            const daysInMonth = new Date(year, month, 0).getDate();
            const daysColumns = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
            const tableColumn = ["S.No", "Name", ...daysColumns, "P", "A", "%"];
            const tableRows = [];

            reportData.forEach((data, index) => {
                const presentAmt = data.present || 0;
                const totalAmt = data.totalDays || 1;
                const percentage = ((presentAmt / totalAmt) * 100).toFixed(0) + '%';

                const row = [index + 1, data.student.name || 'Unknown'];
                for (let d = 1; d <= daysInMonth; d++) {
                    row.push(data.days?.[d] || '-');
                }
                row.push(data.present, data.absent, percentage);
                tableRows.push(row);
            });

            const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            doc.setFontSize(16);
            doc.text(`Monthly Attendance Report - ${monthName}`, 14, 15);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [63, 81, 181], halign: 'center' },
                columnStyles: { 0: { halign: 'center' }, 1: { minCellWidth: 20 } },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        if (data.column.index >= 2 && data.column.index < 2 + daysInMonth) {
                            if (data.cell.raw === 'P') { data.cell.styles.textColor = [34, 197, 94]; data.cell.styles.fontStyle = 'bold'; }
                            if (data.cell.raw === 'P') { data.cell.styles.textColor = [34, 197, 94]; data.cell.styles.fontStyle = 'bold'; }
                            if (data.cell.raw === 'H') { data.cell.styles.textColor = [245, 158, 11]; data.cell.styles.fontStyle = 'bold'; }
                            if (data.cell.raw === 'A') { data.cell.styles.textColor = [239, 68, 68]; data.cell.styles.fontStyle = 'bold'; }
                        }
                    }
                }
            });

            doc.save(`Monthly_Attendance_${monthName.replace(' ', '_')}.pdf`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate monthly report');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const generateYearlyPDF = async () => {
        try {
            const dateObj = new Date(selectedDate);
            const year = dateObj.getFullYear();

            setSaving(true);
            const res = await api.get(`/admin/attendance/yearly/${year}`);
            const reportData = res.data.report;

            const doc = new jsPDF('landscape');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const tableColumn = ["S.No", "Name", ...monthNames, "Total P", "Total A", "%"];
            const tableRows = [];

            reportData.forEach((data, index) => {
                const presentAmt = data.present || 0;
                const totalAmt = data.totalDays || 1;
                const percentage = ((presentAmt / totalAmt) * 100).toFixed(0) + '%';

                const row = [index + 1, data.student.name || 'Unknown'];
                for (let m = 0; m < 12; m++) {
                    const monthData = data.months?.[m];
                    row.push(monthData ? monthData.P : '-');
                }
                row.push(data.present, data.absent, percentage);
                tableRows.push(row);
            });

            doc.setFontSize(16);
            doc.text(`Yearly Attendance Report - ${year}`, 14, 15);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [63, 81, 181] }
            });

            doc.save(`Yearly_Attendance_${year}.pdf`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate yearly report');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s => {
        if (!s.createdAt) return true;
        const admission = new Date(s.createdAt); admission.setHours(0, 0, 0, 0);
        const sel = new Date(selectedDate); sel.setHours(0, 0, 0, 0);
        return sel >= admission;
    });
    const presentCount = Object.keys(attendance).filter(id => filteredStudents.find(s => s._id === id) && attendance[id]?.status === 'present').length;
    const holidayCount = Object.keys(attendance).filter(id => filteredStudents.find(s => s._id === id) && attendance[id]?.status === 'holiday').length;
    const absentCount = filteredStudents.length - presentCount - holidayCount;

    // Check if selected date is a declared holiday
    const selectedHoliday = holidays.find(h => {
        const hDate = new Date(h.date); hDate.setHours(0, 0, 0, 0);
        const selDate = new Date(selectedDate); selDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === selDate.getTime();
    });

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] right-[-8%] w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link to={backPath}>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                                <IoArrowBack size={16} /> <span className="hidden sm:inline">Back</span>
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                                    <IoCalendarOutline size={14} className="text-gray-900" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-orange-400">{isSubAdmin ? 'Sub Admin' : 'Admin'}</span>
                            </div>
                            <h1 className="text-xl sm:text-3xl font-black text-gray-900">Attendance</h1>
                        </div>
                    </div>
                    {/* Analytics button — only super admin can access analytics */}
                    {!isSubAdmin && (
                        <Link to="/admin/analytics">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">
                                <IoBarChartOutline size={16} /> View Analytics
                            </motion.button>
                        </Link>
                    )}
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* ── Tab Switcher ── */}
                <div className="flex items-center gap-2 mb-6 bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit">
                    <button onClick={() => setViewTab('mark')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            viewTab === 'mark' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                        Mark Attendance
                    </button>
                    {!isSubAdmin && (
                        <button onClick={() => setViewTab('reports')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                viewTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                            }`}>
                            Reports & History
                        </button>
                    )}
                </div>



                {/* ══ MARK ATTENDANCE TAB ══ */}
                {viewTab === 'mark' && (
                    <div>
                        {/* Controls bar */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm flex flex-wrap items-center gap-3">
                            {!isSubAdmin && (
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</label>
                                    <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); }}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm outline-none focus:border-indigo-400" />
                                </div>
                            )}
                            <button onClick={fetchSeatView}
                                className={`flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all ${!isSubAdmin ? 'mt-5' : ''}`}>
                                <IoRefresh size={15} /> Refresh
                            </button>
                            {/* Status indicators */}
                            <div className="ml-auto flex items-center gap-3 text-xs flex-wrap justify-end">
                                {/* Auto-save status */}
                                {autoSaving && <span className="text-indigo-500 font-semibold animate-pulse">Saving...</span>}
                                {!autoSaving && lastSaved && (
                                    <span className="text-green-600 font-semibold flex items-center gap-1">
                                        <IoCheckmarkCircle size={14} /> <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span><span className="sm:hidden">Saved</span>
                                    </span>
                                )}

                                {/* Live sync indicator — only shown for today */}
                                {selectedDate === getLocalDate() && (
                                    <AnimatePresence mode="wait">
                                        {newSelfMarkDetected ? (
                                            <motion.span
                                                key="updated"
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-full"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
                                                Student marked!
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="live"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-1.5 text-gray-400 font-medium"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                                <span className="hidden sm:inline">Live{lastLiveSync ? ` · ${lastLiveSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        {/* Summary Cards for Super Admin */}
                        {!isSubAdmin && (
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Students</span>
                                    <span className="text-xl font-black text-gray-900">{filteredStudents.length}</span>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest mb-1">Present</span>
                                    <span className="text-xl font-black text-green-600">{presentCount}</span>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">Absent</span>
                                    <span className="text-xl font-black text-red-500">{absentCount}</span>
                                </div>
                            </div>
                        )}

                        {/* Student Cards */}
                        {seatStudents.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center shadow-sm">
                                <IoPeopleOutline size={36} className="mx-auto mb-2 text-gray-300" />
                                <p className="font-medium text-gray-400 text-sm">No students found for this date</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {seatStudents.map((student, i) => {
                                    const palette = seatColorMap[student.seatNumber] || { badge: 'bg-gray-100 text-gray-600' };
                                    const isPresent = student.status === 'present';
                                    // selfMarked flag OR markedBy===student (fallback for old records)
                                    const isLocked = student.selfMarked ||
                                        (student.markedBy && student.markedBy.toString() === student._id.toString());

                                    // Initials from name
                                    const initials = student.name
                                        ? student.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                                        : '?';

                                    // Proper case name
                                    const displayName = student.name
                                        ? student.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                                        : 'Unknown';

                                    return (
                                        <motion.div
                                            key={student._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.01, duration: 0.2 }}
                                            className={`rounded-2xl overflow-hidden shadow-sm border flex items-stretch transition-all ${
                                                isLocked ? 'bg-gray-50 border-gray-200 opacity-75 grayscale-[0.5]' : 'bg-white border-gray-100'
                                            }`}
                                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                                        >
                                            {/* Left accent bar */}
                                            <div className={`w-1.5 shrink-0 ${
                                                isLocked ? 'bg-gray-400' :
                                                isPresent ? 'bg-emerald-400' : 'bg-rose-300'
                                            }`} />

                                            {/* Content */}
                                            <div className="flex items-center gap-4 flex-1 px-5 py-4">
                                                {/* Avatar */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                                                    isLocked ? 'bg-gray-200 text-gray-500' :
                                                    palette.badge
                                                }`}>
                                                    {student.seatNumber || initials}
                                                </div>

                                                {/* Name + shift */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-bold text-base leading-tight truncate ${isLocked ? 'text-gray-600' : 'text-gray-900'}`}>{displayName}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-xs text-gray-400 font-medium">{student.shiftName}</span>
                                                        {isLocked && (
                                                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                                                <IoLockClosed size={9} /> Self-marked
                                                            </span>
                                                        )}
                                                        {!student.hasSeat && (
                                                            <span className="text-[11px] font-semibold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">No seat</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status + Toggle */}
                                                <div className="shrink-0 flex items-center gap-3">
                                                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl ${
                                                        isLocked
                                                            ? 'bg-gray-200 text-gray-600'
                                                            : isPresent
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-rose-50 text-rose-500'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                            isLocked ? 'bg-gray-400' :
                                                            isPresent ? 'bg-emerald-400' : 'bg-rose-400'
                                                        }`} />
                                                        {isLocked ? 'Locked' : isPresent ? 'Present' : 'Absent'}
                                                    </span>

                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => toggleSeatStudent(student._id, student.status, student.selfMarked)}
                                                        disabled={isSubAdmin && isLocked}
                                                        title={(isSubAdmin && isLocked) ? 'Student self-marked — locked for admins' : `Mark as ${isPresent ? 'absent' : 'present'} (Override)`}
                                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shrink-0 ${
                                                            isSubAdmin && isLocked
                                                                ? 'bg-gray-300 cursor-not-allowed'
                                                                : isPresent
                                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                                    : 'bg-rose-400 hover:bg-rose-500'
                                                        }`}
                                                    >
                                                        {isSubAdmin && isLocked ? (
                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                <IoLockClosed size={14} className="text-gray-500" />
                                                            </span>
                                                        ) : (
                                                            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                                                isPresent ? 'translate-x-7' : 'translate-x-0'
                                                            }`} />
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

                {/* ══ REPORTS TAB ══ */}
                {viewTab === 'reports' && (
                <div>
                {/* Controls */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Select Date</label>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 text-sm focus:border-blue-500/50 outline-none transition-all" />
                        </div>
                        <button onClick={loadAttendance} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all mt-5"><IoRefresh size={15} /> Refresh</button>
                        <button onClick={markAllPresent} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium transition-all mt-5"><IoCheckmarkCircle size={15} /> All Present</button>
                        <button onClick={markAllAbsent} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all mt-5"><IoCloseCircle size={15} /> All Absent</button>
                    </div>
                    {selectedHoliday && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                            <IoSparkles size={18} /> Today is a declared holiday: {selectedHoliday.name}
                        </motion.div>
                    )}
                    <div className="flex gap-2 flex-wrap mb-4">
                        <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-medium transition-all"><IoDownloadOutline size={16} /> Daily Report</button>
                        <button onClick={generateMonthlyPDF} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"><IoDownloadOutline size={16} /> Monthly Report</button>
                        <button onClick={generateYearlyPDF} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-xl text-sm font-medium transition-all disabled:opacity-50"><IoDownloadOutline size={16} /> Yearly Report</button>
                        <button onClick={() => setShowHolidayModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-medium transition-all"><IoSparkles size={16} /> Declare Holiday</button>
                        <button onClick={() => { const link = `${window.location.origin}/office/attendance`; navigator.clipboard.writeText(link); setSuccess('Office Link copied!'); setTimeout(() => setSuccess(''), 3000); }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium transition-all ml-auto">
                            <IoDocumentTextOutline size={16} /> Office Link
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                            <div className="bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-2.5 flex items-center justify-between"><span className="text-xs text-gray-500 uppercase tracking-widest">Present</span><span className="text-2xl font-black text-green-400">{presentCount}</span></div>
                            <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5 flex items-center justify-between"><span className="text-xs text-gray-500 uppercase tracking-widest">Absent</span><span className="text-2xl font-black text-red-400">{absentCount}</span></div>
                        </div>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={saveAttendance} disabled={saving}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50">
                            <IoSave size={16} /> {saving ? 'Saving…' : 'Save'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Student Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-gray-100 rounded-2xl h-32 animate-pulse" />)}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                        <IoPeopleOutline size={40} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No active students found for this date</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredStudents.map(student => {
                            const data = attendance[student._id] || { status: 'absent' };
                            const isPresent = data.status === 'present';
                            const hasSeat = !!student.seat;
                            return (
                                <motion.div key={student._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${!hasSeat ? 'border-yellow-500/25 bg-yellow-500/5' : isPresent ? 'border-green-500/30 bg-green-500/5' : data.status === 'holiday' ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-200 bg-white'}`}>
                                    <div className={`p-4 flex items-start justify-between cursor-pointer`}
                                        onClick={() => !hasSeat ? navigate('/admin/students?tab=pending') : toggleStatus(student._id)}>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900">{student.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                                            <div className="flex gap-2 mt-2">
                                                {student.seat ? (
                                                    <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Seat: {student.seat.number}</span>
                                                ) : (
                                                    <span className="text-[10px] bg-yellow-50 border border-yellow-200 text-yellow-600 px-2 py-0.5 rounded-full font-semibold animate-pulse">Pending Allocation</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl ${!hasSeat ? 'bg-yellow-100 text-yellow-600' : isPresent ? 'bg-green-100 text-green-600' : data.status === 'holiday' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'}`}>
                                            {!hasSeat ? <IoBedOutline size={20} /> : isPresent ? <IoCheckmarkCircle size={20} /> : data.status === 'holiday' ? <IoSparkles size={20} /> : <IoCloseCircle size={20} />}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                </div>
                )}


            </div>

            {/* Holiday Declaration Modal */}
            <AnimatePresence>
                {showHolidayModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                        onClick={e => e.target === e.currentTarget && setShowHolidayModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md rounded-2xl border border-amber-500/20 overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0a0c1c 100%)' }}
                        >
                            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <IoSparkles size={16} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold text-sm">Declare Holiday</p>
                                            <p className="text-gray-500 text-xs">{selectedDate}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowHolidayModal(false); setHolidayName(''); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
                                        <IoCloseCircle size={20} />
                                    </button>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    All active students will be automatically marked <span className="text-green-400 font-semibold">Present</span> with this holiday name.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Festival Name</label>
                                    <input
                                        value={holidayName}
                                        onChange={e => setHolidayName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && declareHoliday()}
                                        placeholder="e.g. Holi, Diwali, Republic Day…"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm outline-none focus:border-amber-500/50 transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={declareHoliday} disabled={saving || !holidayName.trim()}
                                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                        {saving
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <><IoSparkles size={15} /> Declare Holiday</>}
                                    </button>
                                    <button onClick={() => { setShowHolidayModal(false); setHolidayName(''); }}
                                        className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceManagement;
