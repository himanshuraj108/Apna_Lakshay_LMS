import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoMailOutline,
    IoNotificationsOutline,
    IoTimeOutline,
    IoCheckmarkCircle,
    IoCloseCircleOutline,
    IoPeopleOutline,
    IoSendOutline,
    IoBedOutline,
    IoCheckbox,
    IoSquareOutline,
    IoSwapHorizontal
} from 'react-icons/io5';
import Modal from '../ui/Modal';
import api from '../../utils/api';

const NotifyShiftVacancyModal = ({
    isOpen,
    onClose,
    shift = null,
    availableCount = null,
    onSuccess = null
}) => {
    const [allShifts, setAllShifts] = useState([]);
    const [selectedShift, setSelectedShift] = useState(shift);
    const [vacantCountInput, setVacantCountInput] = useState(availableCount || '');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filterType, setFilterType] = useState('match'); // 'match' | 'all'
    const [customMessage, setCustomMessage] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [sendInApp, setSendInApp] = useState(true);
    const [showShiftPicker, setShowShiftPicker] = useState(false);

    // Sync selectedShift whenever shift prop or isOpen changes
    useEffect(() => {
        if (isOpen) {
            setSelectedShift(shift);
            setVacantCountInput(
                availableCount !== null && availableCount !== undefined
                    ? availableCount
                    : (shift?.vacant !== undefined ? shift.vacant : '')
            );
            setError('');
            setSuccessMsg('');
            setSending(false);
            setShowShiftPicker(!shift);

            // Also load all shifts so admin can switch if desired
            api.get('/admin/shifts')
                .then(res => {
                    if (res.data?.success && res.data.shifts) {
                        setAllShifts(res.data.shifts);
                        if (!shift && res.data.shifts.length > 0) {
                            setSelectedShift(res.data.shifts[0]);
                        }
                    }
                })
                .catch(err => console.error('Failed to load shifts:', err));
        }
    }, [isOpen, shift, availableCount]);

    const activeShiftId = selectedShift?._id || selectedShift?.shiftId || null;
    const activeShiftName = selectedShift?.name || selectedShift?.shiftName || 'Library Shift';
    const activeShiftTime = selectedShift?.shiftTime || (selectedShift?.startTime && selectedShift?.endTime ? `${selectedShift.startTime} – ${selectedShift.endTime}` : '');
    const activeStartTime = selectedShift?.startTime || '';
    const activeEndTime = selectedShift?.endTime || '';

    // Fetch waitlist candidates whenever active shift changes
    useEffect(() => {
        if (!isOpen) return;

        const fetchCandidates = async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                if (activeShiftId) params.append('shiftId', activeShiftId);
                if (activeShiftName) params.append('shiftName', activeShiftName);
                if (activeStartTime) params.append('startTime', activeStartTime);
                if (activeEndTime) params.append('endTime', activeEndTime);

                const res = await api.get(`/admin/shifts/waitlist-candidates?${params.toString()}`);
                if (res.data?.success) {
                    const list = res.data.students || [];
                    setCandidates(list);

                    // Pre-select shift matches if any, otherwise select all
                    const matching = list.filter(c => c.isShiftMatch);
                    if (matching.length > 0) {
                        setSelectedIds(new Set(matching.map(m => m._id)));
                        setFilterType('match');
                    } else {
                        setSelectedIds(new Set(list.map(c => c._id)));
                        setFilterType('all');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch waitlist candidates:', err);
                setError('Could not load waiting list scholars.');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [isOpen, activeShiftId, activeShiftName, activeStartTime, activeEndTime]);

    const matchingCandidates = useMemo(() => {
        return candidates.filter(c => c.isShiftMatch);
    }, [candidates]);

    const displayedCandidates = useMemo(() => {
        if (filterType === 'match') {
            return matchingCandidates.length > 0 ? matchingCandidates : candidates;
        }
        return candidates;
    }, [candidates, matchingCandidates, filterType]);

    const toggleSelectStudent = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAllDisplayed = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            displayedCandidates.forEach(c => next.add(c._id));
            return next;
        });
    };

    const handleDeselectAllDisplayed = () => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            displayedCandidates.forEach(c => next.delete(c._id));
            return next;
        });
    };

    const handleSendNotification = async () => {
        if (selectedIds.size === 0) {
            setError('Please select at least one waiting list student to notify.');
            return;
        }
        if (!sendEmail && !sendInApp) {
            setError('Please enable at least one channel (Email or In-App Notification).');
            return;
        }

        setSending(true);
        setError('');
        setSuccessMsg('');

        try {
            const payload = {
                shiftId: activeShiftId,
                shiftName: activeShiftName,
                startTime: activeStartTime,
                endTime: activeEndTime,
                shiftTime: activeShiftTime,
                availableCount: vacantCountInput ? Number(vacantCountInput) : null,
                customMessage: customMessage.trim() || undefined,
                studentIds: Array.from(selectedIds),
                sendEmail,
                sendInApp
            };

            const res = await api.post('/admin/shifts/notify-vacancy', payload);
            if (res.data?.success) {
                setSuccessMsg(res.data.message || `Alert sent successfully to ${selectedIds.size} scholar(s)!`);
                if (onSuccess) onSuccess(res.data);
            } else {
                setError(res.data?.message || 'Failed to dispatch vacancy emails.');
            }
        } catch (err) {
            console.error('Send vacancy notification error:', err);
            setError(err.response?.data?.message || 'Error occurred while sending vacancy emails.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Send Shift Vacancy Notification"
            theme="light"
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4">
                {/* Shift Details Banner & Switcher */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-orange-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-sm shadow-orange-500/25">
                                <IoTimeOutline size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-black text-stone-900 text-base">{activeShiftName}</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Vacancy Available
                                    </span>
                                </div>
                                <p className="text-xs text-stone-600 font-mono mt-0.5">
                                    {activeShiftTime || 'Standard Hours'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {allShifts.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setShowShiftPicker(!showShiftPicker)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-orange-200 rounded-xl text-[11px] font-bold text-orange-700 shadow-2xs transition-all cursor-pointer"
                                >
                                    <IoSwapHorizontal size={13} />
                                    <span>{showShiftPicker ? 'Hide Shifts' : 'Change Shift'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Shift Dropdown Selector if toggled or needed */}
                    {showShiftPicker && allShifts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-orange-200/60">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                                Select Target Shift:
                            </label>
                            <select
                                value={activeShiftId || ''}
                                onChange={(e) => {
                                    const match = allShifts.find(s => s._id === e.target.value);
                                    if (match) setSelectedShift(match);
                                }}
                                className="w-full bg-white border border-[#EDE8E0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] focus:border-orange-500 outline-none shadow-2xs"
                            >
                                {allShifts.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.name} ({s.startTime} – {s.endTime})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Available Desks Count Input */}
                    <div className="mt-3 pt-3 border-t border-orange-200/60 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <IoBedOutline size={15} className="text-orange-600" />
                            <span className="text-xs font-bold text-stone-700">Vacant Desks to Announce:</span>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            value={vacantCountInput}
                            onChange={(e) => setVacantCountInput(e.target.value)}
                            placeholder="Optional count"
                            className="w-32 bg-white border border-orange-200 rounded-xl px-2.5 py-1 text-xs font-bold text-center text-[#0F172A] outline-none focus:border-orange-500 shadow-2xs"
                        />
                    </div>
                </div>

                {/* Status Banners */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
                            <IoCloseCircleOutline size={18} className="shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                    {successMsg && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold">
                            <IoCheckmarkCircle size={18} className="shrink-0 text-emerald-600" />
                            <span>{successMsg}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Candidate Selector Header */}
                <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                            Target Scholars ({selectedIds.size} Selected)
                        </span>

                        <div className="flex items-center gap-2">
                            {matchingCandidates.length > 0 && (
                                <div className="flex rounded-xl bg-stone-100 p-0.5 border border-[#EDE8E0]">
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('match')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                            filterType === 'match'
                                                ? 'bg-white text-orange-600 shadow-2xs'
                                                : 'text-stone-600 hover:text-stone-900'
                                        }`}
                                    >
                                        Timing Matches ({matchingCandidates.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterType('all')}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                            filterType === 'all'
                                                ? 'bg-white text-stone-900 shadow-2xs'
                                                : 'text-stone-600 hover:text-stone-900'
                                        }`}
                                    >
                                        All Waitlist ({candidates.length})
                                    </button>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSelectAllDisplayed}
                                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                            >
                                Select All
                            </button>
                            <span className="text-stone-300">|</span>
                            <button
                                type="button"
                                onClick={handleDeselectAllDisplayed}
                                className="text-[11px] font-bold text-stone-500 hover:text-stone-700 cursor-pointer"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Students List Box */}
                    <div className="border border-[#EDE8E0] rounded-2xl bg-white max-h-52 overflow-y-auto divide-y divide-[#F5F0EA] shadow-2xs">
                        {loading ? (
                            <div className="py-10 text-center">
                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-xs font-medium text-stone-500">Finding waitlist scholars...</p>
                            </div>
                        ) : displayedCandidates.length === 0 ? (
                            <div className="py-8 text-center text-stone-500">
                                <IoPeopleOutline size={28} className="mx-auto text-stone-300 mb-2" />
                                <p className="text-xs font-bold text-stone-700">No waiting list scholars found</p>
                                <p className="text-[11px] text-stone-400 mt-0.5">There are currently no students registered in the waitlist.</p>
                            </div>
                        ) : (
                            displayedCandidates.map(student => {
                                const isChecked = selectedIds.has(student._id);
                                return (
                                    <div
                                        key={student._id}
                                        onClick={() => toggleSelectStudent(student._id)}
                                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors select-none ${
                                            isChecked ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-stone-50/70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="text-orange-600 shrink-0 text-lg">
                                                {isChecked ? <IoCheckbox /> : <IoSquareOutline className="text-stone-400" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[#0F172A] truncate">{student.name}</span>
                                                    {student.studentId && (
                                                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                                            #{student.studentId}
                                                        </span>
                                                    )}
                                                    {student.isShiftMatch && (
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                                            student.isPartialMatch
                                                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        }`}>
                                                            {student.matchLabel || (student.isPartialMatch ? 'Partial Match' : 'Shift Match')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                                                    <span className="truncate">{student.email || 'No email registered'}</span>
                                                    {student.mobile && <span>· {student.mobile}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 ml-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                                {student.requestedShift || 'Waitlist'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Custom Note Input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Admin Note / Special Instructions <span className="text-stone-400 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                        rows={2}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="e.g. Seats are available on first-floor study hall. Contact library desk to finalize allocation today."
                        className="w-full bg-white border border-[#E2DBD2] rounded-xl px-3.5 py-2 text-stone-800 text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder-stone-400 shadow-2xs"
                    />
                </div>

                {/* Notification Delivery Channels */}
                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
                    <span className="text-xs font-bold text-stone-700">Delivery Channels:</span>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-800">
                            <input
                                type="checkbox"
                                checked={sendEmail}
                                onChange={(e) => setSendEmail(e.target.checked)}
                                className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <IoMailOutline size={15} className="text-orange-600" />
                            Email Alert
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-stone-800">
                            <input
                                type="checkbox"
                                checked={sendInApp}
                                onChange={(e) => setSendInApp(e.target.checked)}
                                className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <IoNotificationsOutline size={15} className="text-orange-600" />
                            In-App Bell Notice
                        </label>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#EDE8E0]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        disabled={sending || selectedIds.size === 0 || (!sendEmail && !sendInApp)}
                        onClick={handleSendNotification}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {sending ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Sending Emails…</span>
                            </>
                        ) : (
                            <>
                                <IoSendOutline size={15} />
                                <span>Send Vacancy Mail ({selectedIds.size})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default NotifyShiftVacancyModal;
