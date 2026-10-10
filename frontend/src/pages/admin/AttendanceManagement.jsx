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
    const [holidayDescription, setHolidayDescription] = useState('');
    const [holidaySelectionMode, setHolidaySelectionMode] = useState('single'); // 'single' | 'weekdays' | 'range' | 'custom'
    const [holidaySingleDate, setHolidaySingleDate] = useState(getLocalDate());
    const [holidayStartDate, setHolidayStartDate] = useState(getLocalDate());
    const [holidayEndDate, setHolidayEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 6);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    });
    const [holidayWeekdays, setHolidayWeekdays] = useState([]); // e.g. [2, 4, 5] for Tue, Thu, Fri
    const [holidayCustomDates, setHolidayCustomDates] = useState([getLocalDate()]);
    const [holidayDatePickerInput, setHolidayDatePickerInput] = useState(getLocalDate());
    const [holidayIsPartial, setHolidayIsPartial] = useState(false);
    const [holidayStartTime, setHolidayStartTime] = useState('16:00');
    const [holidayEndTime, setHolidayEndTime] = useState('21:00');
    const [holidaySendEmail, setHolidaySendEmail] = useState(false);
    const [viewTab, setViewTab] = useState('mark'); // 'mark' | 'reports'
    const [seatStudents, setSeatStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [lastLiveSync, setLastLiveSync] = useState(null);
    const [newSelfMarkDetected, setNewSelfMarkDetected] = useState(false);
    const [highlight75, setHighlight75] = useState(false);
    
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

    const formatTime12h = (t) => {
        if (!t || !t.includes(':')) return t || '';
        const [hS, mS] = t.split(':');
        let h = parseInt(hS, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${String(h).padStart(2, '0')}:${mS} ${ampm}`;
    };

    const resolvedHolidayDates = useMemo(() => {
        const toIso = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        if (holidaySelectionMode === 'single') {
            return holidaySingleDate ? [holidaySingleDate] : [];
        }
        if (holidaySelectionMode === 'custom') {
            return [...new Set(holidayCustomDates.filter(Boolean))].sort();
        }
        if (holidaySelectionMode === 'weekdays') {
            if (!holidayWeekdays.length) return [];
            const base = new Date(holidayStartDate || getLocalDate());
            base.setHours(0, 0, 0, 0);
            const end = new Date(holidayEndDate || base);
            end.setHours(0, 0, 0, 0);
            if (end < base) return [];
            const setW = new Set(holidayWeekdays);
            const out = [];
            const cur = new Date(base);
            let safety = 0;
            while (cur <= end && safety < 90) {
                if (setW.has(cur.getDay())) {
                    out.push(toIso(cur));
                }
                cur.setDate(cur.getDate() + 1);
                safety++;
            }
            return out;
        }
        if (holidaySelectionMode === 'range') {
            if (!holidayStartDate || !holidayEndDate) return [];
            const s = new Date(holidayStartDate);
            const e = new Date(holidayEndDate);
            s.setHours(0, 0, 0, 0);
            e.setHours(0, 0, 0, 0);
            if (e < s) return [];
            const setW = holidayWeekdays.length > 0 ? new Set(holidayWeekdays) : null;
            const out = [];
            const cur = new Date(s);
            let safety = 0;
            while (cur <= e && safety < 90) {
                if (!setW || setW.has(cur.getDay())) {
                    out.push(toIso(cur));
                }
                cur.setDate(cur.getDate() + 1);
                safety++;
            }
            return out;
        }
        return [];
    }, [holidaySelectionMode, holidaySingleDate, holidayCustomDates, holidayWeekdays, holidayStartDate, holidayEndDate]);

    const [generatingHolidayAi, setGeneratingHolidayAi] = useState(false);

    const openHolidayModal = () => {
        setHolidaySingleDate(selectedDate || getLocalDate());
        setHolidayStartDate(selectedDate || getLocalDate());
        const d = new Date(selectedDate || getLocalDate());
        d.setDate(d.getDate() + 6);
        const offset = d.getTimezoneOffset() * 60000;
        setHolidayEndDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
        setHolidayCustomDates([selectedDate || getLocalDate()]);
        setHolidayDatePickerInput(selectedDate || getLocalDate());
        setHolidaySendEmail(false); // Always default to NOT sent
        setShowHolidayModal(true);
    };

    const generateAiHolidayNotice = async () => {
        if (!holidayName.trim()) {
            setError('Please enter a Holiday / Occasion Title first so AI can structure the notice');
            setTimeout(() => setError(''), 3500);
            return;
        }
        setGeneratingHolidayAi(true);
        setError('');
        try {
            const res = await api.post('/admin/holidays/generate-notice', {
                name: holidayName.trim(),
                dates: resolvedHolidayDates,
                isPartial: holidayIsPartial,
                startTime: holidayIsPartial ? holidayStartTime : null,
                endTime: holidayIsPartial ? holidayEndTime : null,
                rawNotes: holidayDescription.trim()
            });
            if (res.data?.success && res.data?.notice) {
                setHolidayDescription(res.data.notice);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate AI notice');
            setTimeout(() => setError(''), 3500);
        } finally {
            setGeneratingHolidayAi(false);
        }
    };

    const declareHoliday = async () => {
        if (!holidayName.trim()) {
            setError('Please enter a festival or holiday title');
            return;
        }
        if (resolvedHolidayDates.length === 0) {
            setError('Please select at least one date or matching weekday for the holiday');
            return;
        }
        if (holidayIsPartial && (!holidayStartTime || !holidayEndTime)) {
            setError('Please specify both start time and end time for partial closure');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                dates: resolvedHolidayDates,
                date: resolvedHolidayDates[0],
                name: holidayName.trim(),
                description: holidayDescription.trim(),
                isPartial: holidayIsPartial,
                startTime: holidayIsPartial ? holidayStartTime : null,
                endTime: holidayIsPartial ? holidayEndTime : null,
                sendEmail: holidaySendEmail
            };
            const res = await api.post('/admin/holidays', payload);
            setSuccess(res.data?.message || `Holiday declared for ${resolvedHolidayDates.length} day(s)!`);
            setHolidayName('');
            setHolidayDescription('');
            setHolidayIsPartial(false);
            setHolidaySendEmail(false);
            setShowHolidayModal(false);
            setTimeout(() => setSuccess(''), 5000);
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

    const removeHoliday = async (id, name, deleteBatch = false) => {
        const msg = deleteBatch
            ? `Remove entire multi-day holiday batch for "${name}"? Unattended holiday records will be cleared.`
            : `Remove holiday "${name}"? Unattended holiday records for that date will be cleared.`;
        if (!window.confirm(msg)) return;
        setSaving(true);
        try {
            await api.delete(`/admin/holidays/${id}${deleteBatch ? '?deleteBatch=true' : ''}`);
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
            const dateObj     = new Date(selectedDate);
            const year        = dateObj.getFullYear();
            const month       = dateObj.getMonth() + 1;
            const monthName   = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            const daysInMonth = new Date(year, month, 0).getDate();

            const res        = await api.get(`/admin/attendance/monthly/${year}/${month}`);
            const records    = res.data.attendance || [];
            const seatMap    = res.data.seatMap    || {};
            const overallMap = res.data.overallMap || {};

            // Build per-student summary (Neutral Holiday Rule: unattended holiday = 'H', excluded from denominator)
            const summaryMap = {};
            records.forEach(r => {
                if (!r.student || !r.student.isActive) return;
                const sid = r.student._id.toString();
                if (!summaryMap[sid]) summaryMap[sid] = { student: r.student, days: {}, presents: 0, holidays: 0 };
                const day = new Date(r.date).getDate();
                const isPresent = r.status === 'present' || (r.status === 'holiday' && !!r.entryTime);
                const isNeutralHoliday = r.status === 'holiday' && !r.entryTime;
                summaryMap[sid].days[day] = isPresent ? 'P' : isNeutralHoliday ? 'H' : 'A';
                if (isPresent) summaryMap[sid].presents++;
                if (isNeutralHoliday) summaryMap[sid].holidays++;
            });

            // Compute attendance % and sort descending
            const rows = Object.values(summaryMap).map(s => {
                const effectiveDays = Math.max(1, daysInMonth - (s.holidays || 0));
                return {
                    ...s,
                    pct: Math.min(100, Math.round((s.presents / effectiveDays) * 100))
                };
            }).sort((a, b) => b.pct - a.pct);

            const totalStudents = rows.length;
            const avgPct        = totalStudents > 0 ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / totalStudents) : 0;
            const above75Count  = rows.filter(r => r.pct >= 75).length;
            const below50Count  = rows.filter(r => r.pct < 50).length;
            const between50_74  = rows.filter(r => r.pct >= 50 && r.pct < 75).length;

            // Load logo as base64 for watermark + header
            let logoBase64 = null;
            try {
                const imgRes = await fetch('/app-icon-192.png');
                const blob   = await imgRes.blob();
                logoBase64   = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (_) { /* watermark optional */ }

            const doc   = new jsPDF('landscape');
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();

            // ── Helper: draw header + watermark on every page ──────────────
            const drawPageDecor = () => {
                // Dim logo tiled as watermark
                if (logoBase64) {
                    const wmSize = 55, gapX = 85, gapY = 70;
                    for (let wx = 10; wx < pageW - wmSize; wx += gapX) {
                        for (let wy = 10; wy < pageH - wmSize; wy += gapY) {
                            try {
                                doc.saveGraphicsState();
                                doc.setGState(new doc.GState({ opacity: 0.05 }));
                                doc.addImage(logoBase64, 'PNG', wx, wy, wmSize, wmSize);
                                doc.restoreGraphicsState();
                            } catch (_) {}
                        }
                    }
                }
                // Orange top bar
                doc.setFillColor(249, 115, 22);
                doc.rect(0, 0, pageW, 12, 'F');
                // Logo in bar
                if (logoBase64) {
                    try { doc.addImage(logoBase64, 'PNG', 3, 1, 10, 10); } catch (_) {}
                }
                // Name
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('Apna Lakshay Library', 15, 7.5);
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'normal');
                doc.text('Attendance Management System', 15, 11);
                // Bottom bar
                doc.setFillColor(249, 115, 22);
                doc.rect(0, pageH - 5, pageW, 5, 'F');
                doc.setFontSize(6);
                doc.setTextColor(255, 255, 255);
                doc.text('Apna Lakshay Library  |  Monthly Attendance Report', pageW / 2, pageH - 1.5, { align: 'center' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'normal');
            };

            // ── Page 1 ──────────────────────────────────────────────────────
            drawPageDecor();

            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 30, 30);
            doc.text('Monthly Attendance Report — ' + monthName, 14, 20);

            // Stat pills
            const statY = 25;
            const pills = [
                { label: 'Students', value: String(totalStudents), bg: [59, 130, 246] },
                { label: 'Avg',      value: avgPct + '%',          bg: avgPct >= 75 ? [22, 163, 74] : avgPct >= 50 ? [245, 158, 11] : [239, 68, 68] },
                { label: '>= 75%',   value: String(above75Count),  bg: [22, 163, 74] },
                { label: '50–74%',   value: String(between50_74),  bg: [245, 158, 11] },
                { label: '< 50%',    value: String(below50Count),  bg: [239, 68, 68] },
            ];
            let px = 14;
            pills.forEach(p => {
                const pw = 42, ph = 10;
                doc.setFillColor(...p.bg);
                doc.roundedRect(px, statY, pw, ph, 1.5, 1.5, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(p.value, px + pw / 2, statY + 5.5, { align: 'center' });
                doc.setFontSize(5.5);
                doc.setFont('helvetica', 'normal');
                doc.text(p.label, px + pw / 2, statY + 9, { align: 'center' });
                px += pw + 3;
            });

            if (highlight75) {
                doc.setFontSize(6.5);
                doc.setTextColor(22, 163, 74);
                doc.text('Students with >= 75% monthly attendance highlighted in green', 14, statY + 13);
                doc.setTextColor(0);
            }

            // ── Build table ─────────────────────────────────────────────────
            const tableColumn = ['#', 'Name', 'Seat', 'Shift'];
            for (let i = 1; i <= daysInMonth; i++) tableColumn.push(String(i));
            tableColumn.push('Att %');
            tableColumn.push('Overall Att %');

            const attColIdx     = tableColumn.length - 2;
            const overallColIdx = tableColumn.length - 1;

            const tableRows = rows.map((s, idx) => {
                const sid        = s.student._id.toString();
                const info       = seatMap[sid] || {};
                const overallVal = overallMap[sid] !== undefined ? overallMap[sid] : s.pct;
                const row  = [
                    String(idx + 1),
                    s.student.name,
                    info.seatNumber ? String(info.seatNumber) : '-',
                    info.shifts?.length ? info.shifts.join('+') : '-'
                ];
                for (let d = 1; d <= daysInMonth; d++) row.push(s.days[d] || '-');
                row.push(s.pct + '%');
                row.push(overallVal + '%');
                return row;
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY      : statY + (highlight75 ? 15 : 12),
                styles      : { fontSize: 5.5, cellPadding: 0.8, halign: 'center' },
                headStyles  : { fillColor: [234, 88, 12], halign: 'center', fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'center', minCellWidth: 5 },
                    1: { halign: 'left',   minCellWidth: 26 },
                    2: { halign: 'center', minCellWidth: 8 },
                    3: { halign: 'center', minCellWidth: 14 },
                    [attColIdx]:     { halign: 'center', minCellWidth: 12 },
                    [overallColIdx]: { halign: 'center', minCellWidth: 18 },
                },
                margin: { bottom: 8 },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    const rowIdx     = data.row.index;
                    const rowPct     = rows[rowIdx]?.pct ?? 0;
                    const attCol     = data.column.index === attColIdx;
                    const overallCol = data.column.index === overallColIdx;
                    const dayCol     = data.column.index >= 4 && data.column.index < 4 + daysInMonth;

                    // >= 75% rows get green background only when toggle is ON (filtered by monthly attendance)
                    if (highlight75 && rowPct >= 75) data.cell.styles.fillColor = [220, 252, 231];

                    if (attCol || overallCol) {
                        data.cell.styles.halign = 'center';
                        const pct = parseInt(data.cell.raw);
                        if (!isNaN(pct)) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.textColor = pct >= 75 ? [22, 163, 74] : pct >= 50 ? [245, 158, 11] : [239, 68, 68];
                        }
                    } else if (dayCol) {
                        data.cell.styles.halign = 'center';
                        if (data.cell.raw === 'P') data.cell.styles.textColor = [22, 163, 74];
                        else if (data.cell.raw === 'A') data.cell.styles.textColor = [239, 68, 68];
                    }
                },
                didDrawPage: () => { drawPageDecor(); }
            });

            // ── LAST PAGE: Overall Attendance >= 75% (Admission to Date) ─────
            const overall75Students = rows
                .map(s => {
                    const sid = s.student._id.toString();
                    const overallVal = overallMap[sid] !== undefined ? overallMap[sid] : s.pct;
                    return { ...s, overallVal };
                })
                .filter(s => s.overallVal >= 75)
                .sort((a, b) => b.overallVal - a.overallVal);

            doc.addPage();
            drawPageDecor();

            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74);
            doc.text('Overall Attendance >= 75% (Admission to Date)', 14, 20);

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80);
            doc.text(
                `Total ${overall75Students.length} student${overall75Students.length === 1 ? '' : 's'} have maintained >= 75% overall attendance from admission to today.`,
                14,
                25
            );
            doc.setTextColor(0);

            // Stat pill
            const oStatY = 29;
            const oBoxW = 56, oBoxH = 11;
            doc.setFillColor(22, 163, 74);
            doc.roundedRect(14, oStatY, oBoxW, oBoxH, 1.5, 1.5, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(String(overall75Students.length) + ' Students', 14 + oBoxW / 2, oStatY + 5.5, { align: 'center' });
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'normal');
            doc.text('Overall Attendance >= 75%', 14 + oBoxW / 2, oStatY + 9, { align: 'center' });
            doc.setTextColor(0);

            const overallCols = ['#', 'Name', 'Seat', 'Shift', 'Monthly Att %', 'Overall Att %'];
            const overallRows = overall75Students.length > 0
                ? overall75Students.map((s, idx) => {
                    const sid  = s.student._id.toString();
                    const info = seatMap[sid] || {};
                    return [
                        String(idx + 1),
                        s.student.name,
                        info.seatNumber ? String(info.seatNumber) : '-',
                        info.shifts?.length ? info.shifts.join('+') : '-',
                        s.pct + '%',
                        s.overallVal + '%'
                    ];
                })
                : [['-', 'No students with overall >= 75%', '-', '-', '-', '-']];

            autoTable(doc, {
                head: [overallCols],
                body: overallRows,
                startY: oStatY + oBoxH + 4,
                styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
                headStyles: { fillColor: [22, 163, 74], halign: 'center', fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [240, 253, 244] },
                columnStyles: {
                    0: { halign: 'center', minCellWidth: 10 },
                    1: { halign: 'left',   minCellWidth: 45 },
                    2: { halign: 'center', minCellWidth: 16 },
                    3: { halign: 'center', minCellWidth: 25 },
                    4: { halign: 'center', minCellWidth: 25 },
                    5: { halign: 'center', minCellWidth: 25 },
                },
                margin: { bottom: 8 },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    if (data.column.index === 4 || data.column.index === 5) {
                        data.cell.styles.fontStyle = 'bold';
                        const pct = parseInt(data.cell.raw);
                        if (!isNaN(pct)) {
                            data.cell.styles.textColor = pct >= 75 ? [22, 163, 74] : pct >= 50 ? [245, 158, 11] : [239, 68, 68];
                        }
                    }
                },
                didDrawPage: () => { drawPageDecor(); }
            });

            // ── Footer note: Mistake in seat/shift contact link ─────────────
            const contactUrl = (typeof window !== 'undefined' && window.location?.origin)
                ? `${window.location.origin}/contact`
                : 'https://apnalakshay.com/contact';

            const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;
            let noteY = lastY + 6;
            if (noteY + 14 > pageH - 8) {
                doc.addPage();
                drawPageDecor();
                noteY = 22;
            }

            const noteBoxW = pageW - 28;
            const noteBoxH = 11;
            doc.setFillColor(255, 247, 237);
            doc.setDrawColor(253, 186, 116);
            doc.roundedRect(14, noteY, noteBoxW, noteBoxH, 2, 2, 'FD');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(154, 52, 18);
            const prefix = 'Any mistake in seat and shift? ';
            doc.text(prefix, 20, noteY + 7);

            const prefixW = doc.getTextWidth(prefix);
            const clickText = 'Click here';
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(234, 88, 12);
            doc.textWithLink(clickText, 20 + prefixW, noteY + 7, { url: contactUrl });

            const clickW = doc.getTextWidth(clickText);
            doc.setDrawColor(234, 88, 12);
            doc.setLineWidth(0.3);
            doc.line(20 + prefixW, noteY + 8, 20 + prefixW + clickW, noteY + 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(154, 52, 18);
            const suffix = ' to contact administration or report corrections.';
            doc.text(suffix, 20 + prefixW + clickW + 1.5, noteY + 7);

            doc.save('Monthly_Attendance_' + monthName.replace(' ', '_') + '.pdf');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate monthly report');
            setTimeout(() => setError(''), 4000);
        } finally {
            setSaving(false);
        }
    };


    const generateYearlyPDF = async () => {
        setSaving(true);
        try {
            const year = new Date(selectedDate).getFullYear();

            // Fix: use path params as backend route expects
            const res     = await api.get(`/admin/attendance/yearly/${year}`);
            const records = res.data.attendance || [];
            const seatMap = res.data.seatMap    || {};

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Build per-student monthly summary (Neutral Holiday Rule)
            const summaryMap = {};
            records.forEach(r => {
                if (!r.student || !r.student.isActive) return;
                const sid  = r.student._id.toString();
                const mIdx = new Date(r.date).getMonth();
                if (!summaryMap[sid]) summaryMap[sid] = { student: r.student, months: {} };
                if (!summaryMap[sid].months[mIdx]) summaryMap[sid].months[mIdx] = { P: 0, total: 0 };
                const isPresent = r.status === 'present' || (r.status === 'holiday' && !!r.entryTime);
                const isNeutralHoliday = r.status === 'holiday' && !r.entryTime;
                if (!isNeutralHoliday) {
                    summaryMap[sid].months[mIdx].total++;
                    if (isPresent) summaryMap[sid].months[mIdx].P++;
                }
            });

            const rows = Object.values(summaryMap).map(s => {
                let totalPct = 0, activeMonths = 0;
                const monthPcts = months.map((_, mIdx) => {
                    const m = s.months[mIdx];
                    if (!m || m.total === 0) return '-';
                    const pct = Math.round((m.P / m.total) * 100);
                    totalPct += pct;
                    activeMonths++;
                    return pct + '%';
                });
                const avg = activeMonths > 0 ? Math.round(totalPct / activeMonths) : 0;
                return { student: s.student, monthPcts, avg };
            }).sort((a, b) => b.avg - a.avg);

            const top5Ids = new Set(rows.slice(0, 5).map(r => r.student._id.toString()));

            const doc = new jsPDF('landscape');
            doc.setFontSize(16);
            doc.text('Yearly Attendance Summary — ' + year, 14, 14);
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text('Apna Lakshay Library Management System', 14, 20);
            if (highlight75) {
                doc.setTextColor(22, 163, 74);
                doc.text('Students with >= 75% attendance highlighted in green', 14, 26);
            }
            doc.setTextColor(0);

            const tableColumn = ['#', 'Name', 'Seat', 'Shift', ...months, 'Avg %'];
            const tableRows = rows.map((s, idx) => {
                const sid  = s.student._id.toString();
                const info = seatMap[sid] || {};
                return [
                    String(idx + 1),
                    s.student.name,
                    info.seatNumber ? String(info.seatNumber) : '-',
                    info.shifts?.length ? info.shifts.join('+') : '-',
                    ...s.monthPcts,
                    s.avg + '%'
                ];
            });

            autoTable(doc, {
                head        : [tableColumn],
                body        : tableRows,
                startY      : highlight75 ? 30 : 24,
                styles      : { fontSize: 7, cellPadding: 2 },
                headStyles  : { fillColor: [234, 88, 12], fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'center', minCellWidth: 6 },
                    1: { halign: 'left',   minCellWidth: 28 },
                    2: { halign: 'center', minCellWidth: 10 },
                    3: { halign: 'center', minCellWidth: 18 },
                },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    const rowIdx = data.row.index;
                    const isAbove75 = highlight75 && rows[rowIdx]?.avg >= 75;
                    const lastCol = data.column.index === tableColumn.length - 1;

                    if (isAbove75) data.cell.styles.fillColor = [220, 252, 231];
                    if (lastCol || data.column.index >= 4) {
                        const pct = parseInt(data.cell.raw);
                        if (!isNaN(pct)) {
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.textColor = pct >= 75 ? [22, 163, 74] : pct >= 50 ? [245, 158, 11] : [239, 68, 68];
                        }
                    }
                }
            });

            // ── Footer note: Mistake in seat/shift contact link ─────────────
            const contactUrl = (typeof window !== 'undefined' && window.location?.origin)
                ? `${window.location.origin}/contact`
                : 'https://apnalakshay.com/contact';

            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;
            let noteY = lastY + 6;
            if (noteY + 14 > pageH - 8) {
                doc.addPage();
                noteY = 22;
            }

            const noteBoxW = pageW - 28;
            const noteBoxH = 11;
            doc.setFillColor(255, 247, 237);
            doc.setDrawColor(253, 186, 116);
            doc.roundedRect(14, noteY, noteBoxW, noteBoxH, 2, 2, 'FD');

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(154, 52, 18);
            const prefix = 'Any mistake in seat and shift? ';
            doc.text(prefix, 20, noteY + 7);

            const prefixW = doc.getTextWidth(prefix);
            const clickText = 'Click here';
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(234, 88, 12);
            doc.textWithLink(clickText, 20 + prefixW, noteY + 7, { url: contactUrl });

            const clickW = doc.getTextWidth(clickText);
            doc.setDrawColor(234, 88, 12);
            doc.setLineWidth(0.3);
            doc.line(20 + prefixW, noteY + 8, 20 + prefixW + clickW, noteY + 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(154, 52, 18);
            const suffix = ' to contact administration or report corrections.';
            doc.text(suffix, 20 + prefixW + clickW + 1.5, noteY + 7);

            doc.save('Yearly_Attendance_' + year + '.pdf');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to generate yearly report');
            setTimeout(() => setError(''), 4000);
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
        <div className="min-h-screen relative text-slate-900 font-sans pb-24" style={{ background: '#FAF6F0' }}>
            {/* Top Subtle Brand Gradient */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* ═════════════════════════════════════════════════════════
                    EXECUTIVE HEADER
                ═════════════════════════════════════════════════════════ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#EDE8E0] rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <Link to={backPath}>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-4 py-2.5 bg-white hover:bg-[#FAF6F0] text-stone-700 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-[#EDE8E0] text-xs font-bold shadow-2xs cursor-pointer"
                                title="Back to Dashboard"
                            >
                                <IoArrowBack size={15} /> Back
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
                                onClick={openHolidayModal}
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

                            {selectedHoliday && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/90 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs"
                                >
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                                            <IoSparkles size={14} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-amber-900">Declared Holiday: {selectedHoliday.name}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-amber-300 text-amber-800">
                                                    {selectedHoliday.isPartial
                                                        ? `Partial Closure: ${formatTime12h(selectedHoliday.startTime)} – ${formatTime12h(selectedHoliday.endTime)}`
                                                        : 'Full Day Closure'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                                                {selectedHoliday.description ? `${selectedHoliday.description} · ` : ''}
                                                Unattended students remain at their current attendance % (neutral). Students who attend are marked Present normally.
                                            </p>
                                        </div>
                                    </div>
                                    {!isSubAdmin && (
                                        <div className="flex items-center gap-2">
                                            {selectedHoliday.batchId && (
                                                <button
                                                    onClick={() => removeHoliday(selectedHoliday._id, selectedHoliday.name, true)}
                                                    className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors"
                                                >
                                                    Remove Batch
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeHoliday(selectedHoliday._id, selectedHoliday.name, false)}
                                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors"
                                            >
                                                Remove Day
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
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
                                    const isHolidayStatus = student.status === 'holiday';
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
                                                        : isHolidayStatus
                                                            ? 'bg-amber-400'
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
                                                                : isHolidayStatus
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                            isLocked ? 'bg-slate-400' : isPresent ? 'bg-emerald-500 animate-pulse' : isHolidayStatus ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`} />
                                                        <span>{isLocked ? 'Locked' : isPresent ? 'Present' : isHolidayStatus ? 'Holiday (Neutral)' : 'Absent'}</span>
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
                                                                    : isHolidayStatus
                                                                        ? 'bg-amber-400 hover:bg-amber-500'
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
                                    className="flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-bold"
                                >
                                    <IoSparkles size={16} className="text-amber-500 shrink-0" />
                                    <span>Declared Holiday: {selectedHoliday.name}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-amber-300 text-amber-800">
                                        {selectedHoliday.isPartial
                                            ? `Partial: ${formatTime12h(selectedHoliday.startTime)} – ${formatTime12h(selectedHoliday.endTime)}`
                                            : 'Full Day'}
                                    </span>
                                    {selectedHoliday.description && (
                                        <span className="text-amber-700 font-medium">({selectedHoliday.description})</span>
                                    )}
                                    <div className="ml-auto flex items-center gap-3">
                                        {selectedHoliday.batchId && (
                                            <button
                                                onClick={() => removeHoliday(selectedHoliday._id, selectedHoliday.name, true)}
                                                className="text-xs text-rose-700 hover:text-rose-900 underline font-bold"
                                            >
                                                Remove Batch
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removeHoliday(selectedHoliday._id, selectedHoliday.name, false)}
                                            className="text-xs text-rose-600 hover:text-rose-800 underline font-bold"
                                        >
                                            Remove Day
                                        </button>
                                    </div>
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
                                    <IoDownloadOutline size={15} /> Monthly Report
                                </button>
                                <button
                                    onClick={generateYearlyPDF}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    <IoDownloadOutline size={15} /> Yearly Summary
                                </button>
                                {/* Top 75% highlight toggle */}
                                <button
                                    onClick={() => setHighlight75(h => !h)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                        highlight75
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-300'
                                            : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                    title="Highlight students with >= 75% attendance in green in PDF exports"
                                >
                                    <IoCheckmark size={14} className={highlight75 ? 'text-emerald-600' : 'text-slate-400'} />
                                    Top 75% Highlight {highlight75 ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    onClick={openHolidayModal}
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
                }}
                title="Declare Institutional Holiday"
            >
                <div className="space-y-4 pt-1 max-h-[78vh] overflow-y-auto pr-1">
                    {/* Neutral Attendance Policy Banner */}
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                        <IoSparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-900 leading-relaxed">
                            <span className="font-bold">Neutral Attendance Policy:</span> Students absent due to a declared holiday keep their <span className="font-bold">exact current attendance percentage</span> (neither reduced nor increased). Students who attend and mark attendance (by self or admin) are counted as <span className="font-bold text-emerald-700">Present</span> normally.
                        </div>
                    </div>

                    {/* 1. Holiday / Festival Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Holiday / Occasion Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={holidayName}
                            onChange={e => setHolidayName(e.target.value)}
                            placeholder="e.g. Diwali Break, Electrical Maintenance, Weekly Off"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* 2. Date Selection Mode Tabs */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Select Holiday Days / Schedule Mode
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                            {[
                                { id: 'single', label: 'Single Day' },
                                { id: 'weekdays', label: 'Weekdays (Tue/Thu/Fri)' },
                                { id: 'range', label: 'Date Range' },
                                { id: 'custom', label: 'Pick Multiple' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setHolidaySelectionMode(mode.id)}
                                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                                        holidaySelectionMode === mode.id
                                            ? 'bg-white text-orange-700 shadow-2xs border border-orange-200'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        {/* Mode A: Single Date */}
                        {holidaySelectionMode === 'single' && (
                            <div className="mt-3">
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                    Holiday Date
                                </label>
                                <input
                                    type="date"
                                    value={holidaySingleDate}
                                    onChange={e => setHolidaySingleDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                                />
                            </div>
                        )}

                        {/* Mode B: Specific Weekdays (e.g. Tue, Thu, Fri) */}
                        {holidaySelectionMode === 'weekdays' && (
                            <div className="mt-3 space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-bold text-slate-700">
                                            Tap Days of the Week (e.g. Tue, Thu, Fri)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setHolidayWeekdays([2, 4, 5])}
                                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 underline"
                                        >
                                            Preset: Tue + Thu + Fri
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {[
                                            { d: 1, label: 'Mon' },
                                            { d: 2, label: 'Tue' },
                                            { d: 3, label: 'Wed' },
                                            { d: 4, label: 'Thu' },
                                            { d: 5, label: 'Fri' },
                                            { d: 6, label: 'Sat' },
                                            { d: 0, label: 'Sun' }
                                        ].map(w => {
                                            const active = holidayWeekdays.includes(w.d);
                                            return (
                                                <button
                                                    key={w.d}
                                                    type="button"
                                                    onClick={() => {
                                                        setHolidayWeekdays(prev =>
                                                            prev.includes(w.d) ? prev.filter(x => x !== w.d) : [...prev, w.d]
                                                        );
                                                    }}
                                                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                                        active
                                                            ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    {w.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
                                        <input
                                            type="date"
                                            value={holidayStartDate}
                                            onChange={e => setHolidayStartDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
                                        <input
                                            type="date"
                                            value={holidayEndDate}
                                            min={holidayStartDate}
                                            onChange={e => setHolidayEndDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mode C: Date Range (with optional weekday filter) */}
                        {holidaySelectionMode === 'range' && (
                            <div className="mt-3 space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={holidayStartDate}
                                            onChange={e => setHolidayStartDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={holidayEndDate}
                                            min={holidayStartDate}
                                            onChange={e => setHolidayEndDate(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            Optional Weekday Filter ({holidayWeekdays.length === 0 ? 'All Days Included' : `${holidayWeekdays.length} selected`})
                                        </span>
                                        {holidayWeekdays.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setHolidayWeekdays([])}
                                                className="text-[10px] font-bold text-rose-600 hover:underline"
                                            >
                                                Include All Days
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {[
                                            { d: 1, label: 'Mon' },
                                            { d: 2, label: 'Tue' },
                                            { d: 3, label: 'Wed' },
                                            { d: 4, label: 'Thu' },
                                            { d: 5, label: 'Fri' },
                                            { d: 6, label: 'Sat' },
                                            { d: 0, label: 'Sun' }
                                        ].map(w => {
                                            const active = holidayWeekdays.includes(w.d);
                                            return (
                                                <button
                                                    key={w.d}
                                                    type="button"
                                                    onClick={() => {
                                                        setHolidayWeekdays(prev =>
                                                            prev.includes(w.d) ? prev.filter(x => x !== w.d) : [...prev, w.d]
                                                        );
                                                    }}
                                                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                                        active
                                                            ? 'bg-orange-500 text-white border-orange-600'
                                                            : 'bg-white text-slate-600 border-slate-200'
                                                    }`}
                                                >
                                                    {w.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mode D: Pick Multiple Custom Dates */}
                        {holidaySelectionMode === 'custom' && (
                            <div className="mt-3 space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={holidayDatePickerInput}
                                        onChange={e => setHolidayDatePickerInput(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (holidayDatePickerInput && !holidayCustomDates.includes(holidayDatePickerInput)) {
                                                setHolidayCustomDates(prev => [...prev, holidayDatePickerInput].sort());
                                            }
                                        }}
                                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        + Add Date
                                    </button>
                                </div>
                                {holidayCustomDates.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {holidayCustomDates.map(dStr => (
                                            <span
                                                key={dStr}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-orange-800 text-[11px] font-bold"
                                            >
                                                <span>{new Date(dStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setHolidayCustomDates(prev => prev.filter(x => x !== dStr))}
                                                    className="text-rose-500 hover:text-rose-700"
                                                >
                                                    <IoClose size={13} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Resolved Dates Preview Chip Bar */}
                        <div className="mt-2.5 flex items-center justify-between bg-orange-50/70 border border-orange-200/80 rounded-xl px-3 py-2 text-[11px]">
                            <span className="font-bold text-orange-900">
                                Selected Schedule ({resolvedHolidayDates.length} {resolvedHolidayDates.length === 1 ? 'Day' : 'Days'}):
                            </span>
                            <span className="font-semibold text-orange-700 truncate max-w-[62%] text-right">
                                {resolvedHolidayDates.length === 0
                                    ? 'None selected'
                                    : resolvedHolidayDates
                                        .slice(0, 4)
                                        .map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }))
                                        .join(' · ') + (resolvedHolidayDates.length > 4 ? ` +${resolvedHolidayDates.length - 4} more` : '')}
                            </span>
                        </div>
                    </div>

                    {/* 3. Operational Timing System: Full Day vs Partial Timing (e.g. 4:00 PM to 9:00 PM) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Operational Closure Timing
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setHolidayIsPartial(false)}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                    !holidayIsPartial
                                        ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-2xs'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <IoCalendarOutline size={15} />
                                <span>Full Day Closure</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHolidayIsPartial(true)}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                    holidayIsPartial
                                        ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-2xs'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <IoTimeOutline size={15} />
                                <span>Partial Timing (e.g. 4–9 PM)</span>
                            </button>
                        </div>

                        {holidayIsPartial && (
                            <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                    <span className="text-[11px] font-bold text-slate-700">Non-Functional Hours</span>
                                    <div className="flex items-center gap-1.5">
                                        {[
                                            { label: '4 PM – 9 PM', s: '16:00', e: '21:00' },
                                            { label: '6 AM – 2 PM', s: '06:00', e: '14:00' },
                                            { label: '2 PM – 10 PM', s: '14:00', e: '22:00' }
                                        ].map(p => (
                                            <button
                                                key={p.label}
                                                type="button"
                                                onClick={() => { setHolidayStartTime(p.s); setHolidayEndTime(p.e); }}
                                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-orange-300 text-[10px] font-bold text-slate-700"
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Closed From</label>
                                        <input
                                            type="time"
                                            value={holidayStartTime}
                                            onChange={e => setHolidayStartTime(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Closed Until</label>
                                        <input
                                            type="time"
                                            value={holidayEndTime}
                                            onChange={e => setHolidayEndTime(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] font-semibold text-orange-800 bg-orange-50 border border-orange-200/70 rounded-lg px-2.5 py-1.5">
                                    Student Notice Preview: &ldquo;Library will remain non-functional from {formatTime12h(holidayStartTime)} to {formatTime12h(holidayEndTime)}.&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 4. Additional Notice / Instructions for Students (AI Structured Generator) */}
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700">
                                    Student Notice Details / Reason (Optional)
                                </label>
                                <p className="text-[10px] text-slate-500">
                                    Click AI Generate (or leave blank) to auto-create a professional structured notice
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={generateAiHolidayNotice}
                                disabled={generatingHolidayAi || !holidayName.trim()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                                }}
                                title="Generate a professional structured student notice using AI"
                            >
                                <IoSparkles size={13} className={generatingHolidayAi ? 'animate-spin' : ''} />
                                <span>
                                    {generatingHolidayAi
                                        ? 'Generating...'
                                        : holidayDescription.trim() && !holidayDescription.includes('•')
                                            ? 'Structure with AI'
                                            : 'AI Generate Notice'}
                                </span>
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            value={holidayDescription}
                            onChange={e => setHolidayDescription(e.target.value)}
                            placeholder="Type a short reason (e.g. 'AC maintenance in Hall 1' or 'Festival closure') and click 'AI Generate Notice', or leave blank for AI to auto-generate on submit..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all leading-relaxed"
                        />
                    </div>

                    {/* 5. Optional Email Notification Toggle (Default OFF) */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                        <div>
                            <p className="text-xs font-bold text-slate-800">Send Email Notification to Students</p>
                            <p className="text-[11px] text-slate-500">
                                {holidaySendEmail
                                    ? 'Enabled — Active students will receive an email alert'
                                    : 'Default: Not Sent — Only in-app dashboard notice will be shown'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setHolidaySendEmail(prev => !prev)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 cursor-pointer ${
                                holidaySendEmail ? 'bg-orange-500' : 'bg-slate-300'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                    holidaySendEmail ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowHolidayModal(false)}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={declareHoliday}
                            disabled={saving || !holidayName.trim() || resolvedHolidayDates.length === 0}
                            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <IoSparkles size={14} />
                            <span>
                                {saving
                                    ? 'Declaring...'
                                    : `Declare Holiday (${resolvedHolidayDates.length} ${resolvedHolidayDates.length === 1 ? 'Day' : 'Days'})`}
                            </span>
                        </button>
                    </div>

                    {/* Recent / Upcoming Declared Holidays List */}
                    {holidays.length > 0 && (
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Declared Holidays ({holidays.length})
                            </p>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {holidays.slice(0, 12).map(h => (
                                    <div
                                        key={h._id}
                                        className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-slate-800 truncate">{h.name}</span>
                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                    {h.isPartial ? `${formatTime12h(h.startTime)}–${formatTime12h(h.endTime)}` : 'Full Day'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeHoliday(h._id, h.name, false)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                            title="Remove Holiday"
                                        >
                                            <IoTrashOutline size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AttendanceManagement;
