import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
    IoArrowBack, IoDesktopOutline, IoTimeOutline, IoLayersOutline,
    IoRefreshOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline,
    IoCheckmarkDoneOutline, IoHourglassOutline, IoCashOutline,
    IoPersonOutline, IoAlertCircleOutline, IoLogInOutline, IoLogOutOutline
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

// ─── Design constants ─────────────────────────────────────────────────────────
const CARD  = 'bg-white rounded-2xl border border-[#EDE8E0] shadow-[0_4px_20px_rgba(180,120,60,0.07)]';
const BADGE = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold';

// Convert 'HH:MM' to readable AM/PM
const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Seat status colors ───────────────────────────────────────────────────────
const SEAT_STATUS = {
    available:      { bg: 'rgba(16,185,129,0.08)', border: '#6ee7b7', text: '#047857', label: 'Available' },
    partial_vacant: { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#b45309', label: 'Partial Vacancy' },
    absent:         { bg: 'rgba(249,115,22,0.08)', border: '#FDDCAE', text: '#EA580C', label: 'Absent today' },
    absent_today:   { bg: 'rgba(249,115,22,0.08)', border: '#FDDCAE', text: '#EA580C', label: 'Absent today' },
    occupied:       { bg: 'rgba(239,68,68,0.07)',  border: '#fca5a5', text: '#b91c1c', label: 'Occupied' },
    requested:      { bg: 'rgba(245,158,11,0.08)', border: '#fcd34d', text: '#92400E', label: 'Requested' },
};

const reqStatusColor = (s) => {
    if (s === 'pending')   return 'bg-amber-100 text-amber-700';
    if (s === 'approved')  return 'bg-emerald-100 text-emerald-700';
    if (s === 'rejected')  return 'bg-rose-100 text-rose-700';
    if (s === 'completed') return 'bg-blue-100 text-blue-700';
    return 'bg-stone-100 text-stone-600';
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function FindASeat() {
    const { user } = useAuth();
    const backPath = useBackPath();

    const [slots, setSlots]             = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayStr());

    const [availSeats, setAvailSeats]     = useState([]);
    const [seatsLoading, setSeatsLoading] = useState(false);

    const [selectedSeat, setSelectedSeat] = useState(null); // { seat, status }
    const [requesting, setRequesting]     = useState(false);
    const [note, setNote]                 = useState('');

    const [myRequests, setMyRequests]     = useState([]);
    const [reqLoading, setReqLoading]     = useState(false);

    const [pageTab, setPageTab]           = useState('book'); // 'book' | 'history'

    // ─── Fetch slots ──────────────────────────────────────────────────────────
    const fetchSlots = useCallback(async () => {
        setSlotsLoading(true);
        try {
            const r = await api.get('/walkin/slots');
            const active = (r.data.slots || []).filter(s => s.isActive);

            // Prepend student's assigned flexShift if exists
            const userFlex = (user?.flexShift?.startTime && user?.flexShift?.endTime) ? {
                _id: 'flex-shift',
                name: user.flexShift.label || `Assigned Shift (${fmtTime(user.flexShift.startTime)} – ${fmtTime(user.flexShift.endTime)})`,
                startTime: user.flexShift.startTime,
                endTime: user.flexShift.endTime,
                feePerSession: 0,
                isFlexShift: true,
                monthlyFee: user.flexShift.monthlyFee || 0
            } : null;

            const allSlots = userFlex ? [userFlex, ...active] : active;
            setSlots(allSlots);
            if (allSlots.length > 0) {
                setSelectedSlot(allSlots[0]);
            }
        } catch { /* ignore */ }
        finally { setSlotsLoading(false); }
    }, [user]);

    // ─── Fetch available seats when slot or date changes ──────────────────────
    const fetchAvailSeats = useCallback(async () => {
        if (!selectedSlot) return;
        setSeatsLoading(true);
        setSelectedSeat(null);
        try {
            const slotParam = selectedSlot._id === 'flex-shift'
                ? `startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}`
                : `slotId=${selectedSlot._id}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}`;
            const r = await api.get(`/walkin/available-seats?${slotParam}&date=${selectedDate}`);
            setAvailSeats(r.data.seats || []);
        } catch { setAvailSeats([]); }
        finally { setSeatsLoading(false); }
    }, [selectedSlot, selectedDate]);

    // ─── Fetch my requests ────────────────────────────────────────────────────
    const fetchMyRequests = useCallback(async () => {
        setReqLoading(true);
        try {
            const r = await api.get('/walkin/my-requests');
            setMyRequests(r.data.requests || []);
        } catch { /* ignore */ }
        finally { setReqLoading(false); }
    }, []);

    useEffect(() => { fetchSlots(); fetchMyRequests(); }, [fetchSlots, fetchMyRequests]);
    useEffect(() => { fetchAvailSeats(); }, [fetchAvailSeats]);

    // ─── Check In ─────────────────────────────────────────────────────────
    const handleCheckIn = async (reqId) => {
        try {
            await api.patch(`/walkin/requests/${reqId}/checkin`, {});
            fetchMyRequests();
        } catch (err) {
            alert(err?.response?.data?.message || 'Check-in failed');
        }
    };

    // ─── Check Out ────────────────────────────────────────────────────────
    const handleCheckOut = async (reqId) => {
        if (!window.confirm('Check out and complete this session?')) return;
        try {
            await api.patch(`/walkin/requests/${reqId}/checkout`, {});
            fetchMyRequests();
        } catch (err) {
            alert(err?.response?.data?.message || 'Check-out failed');
        }
    };

    // ─── Submit request ───────────────────────────────────────────────────────
    const submitRequest = async () => {
        if (!selectedSeat || !selectedSlot) return;
        setRequesting(true);
        try {
            const seatId = selectedSeat.seat?._id || selectedSeat.seatId;
            const slotId = selectedSlot._id === 'flex-shift' ? undefined : selectedSlot._id;

            const reqStartTime = (selectedSeat.isPartial && selectedSeat.partialStartTime)
                ? selectedSeat.partialStartTime
                : selectedSlot.startTime;
            const reqEndTime = (selectedSeat.isPartial && selectedSeat.partialEndTime)
                ? selectedSeat.partialEndTime
                : selectedSlot.endTime;

            await api.post('/walkin/request', {
                seatId,
                slotId,
                date: selectedDate,
                startTime: reqStartTime,
                endTime: reqEndTime,
                note
            });
            setSelectedSeat(null);
            setNote('');
            fetchAvailSeats();
            fetchMyRequests();
        } catch (err) {
            alert(err?.response?.data?.message || 'Request failed');
        } finally {
            setRequesting(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ fontFamily: "'DM Sans','Inter',sans-serif" }}
             className="min-h-screen bg-[#F7F3EC] relative">
            {/* Dot grid */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(180,120,60,0.07) 1px,transparent 0)',
                backgroundSize: '28px 28px', zIndex: 0
            }} />

            {/* Header */}
            <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8E0' }}>
                <Link to={backPath}
                      className="p-2 rounded-xl bg-white border border-[#EDE8E0] text-[#78350F] hover:bg-[#FFF7ED] transition-all">
                    <IoArrowBack size={18} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-black text-[#1A1A1A]">Find a Seat</h1>
                    <p className="text-[11px] text-[#9B7B5A]">Pick a slot and request a flexible seat for the day</p>
                </div>
                <button onClick={() => { fetchAvailSeats(); fetchMyRequests(); }}
                        className="p-2 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] hover:text-[#EA580C] transition-all">
                    <IoRefreshOutline size={16} />
                </button>
            </header>

            {/* Page tabs */}
            <div className="sticky top-[57px] z-20 px-4 py-2"
                 style={{ background: 'rgba(247,243,236,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #EDE8E0' }}>
                <div className="max-w-3xl mx-auto flex gap-1 p-1 rounded-xl" style={{ background: '#F5F0EA' }}>
                    {[
                        { id: 'book',    label: 'Book a Seat' },
                        { id: 'history', label: 'My History'  },
                    ].map(t => (
                        <button key={t.id} onClick={() => setPageTab(t.id)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all"
                                style={pageTab === t.id
                                    ? { background: '#fff', color: '#EA580C', border: '1.5px solid #FDDCAE', boxShadow: '0 2px 8px rgba(249,115,22,0.08)' }
                                    : { background: 'transparent', color: '#9B7B5A', border: '1.5px solid transparent' }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 py-5 space-y-5">

            {/* ── HISTORY TAB ─────────────────────────────────────────────────── */}
            {pageTab === 'history' && (() => {
                const completed = myRequests.filter(r => r.status === 'completed');
                const totalFee  = completed.reduce((s, r) => s + (r.feeCharged || 0), 0);
                const fmtDT = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

                return (
                    <div className="space-y-4">
                        {/* Summary card */}
                        <div className={`${CARD} p-4 flex items-center gap-4`}
                             style={{ borderTop: '3px solid #F97316' }}>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide">Total Sessions</p>
                                <p className="text-2xl font-black text-[#1A1A1A]">{completed.length}</p>
                            </div>
                            <div className="w-px h-10 bg-[#EDE8E0]" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide">Total Fee Paid</p>
                                <p className="text-2xl font-black text-emerald-600">
                                    {totalFee > 0 ? `₹${totalFee}` : '—'}
                                </p>
                            </div>
                        </div>

                        {reqLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : completed.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoCheckmarkDoneOutline size={34} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No completed sessions yet</p>
                                <p className="text-xs text-[#9B7B5A] mt-1">Your finished walkin sessions will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {completed.map(req => (
                                    <div key={req._id} className={`${CARD} px-4 py-3`}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                 style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid #bfdbfe' }}>
                                                <IoDesktopOutline size={15} className="text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-black text-[#1A1A1A]">Seat {req.seat?.number || '?'}</p>
                                                    {req.seat?.room && <span className="text-xs text-[#9B7B5A]">{req.seat.room}</span>}
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">completed</span>
                                                </div>
                                                <p className="text-xs text-[#9B7B5A] mt-0.5">
                                                    {req.date}
                                                    {req.walkinSlot?.name && ` · ${req.walkinSlot.name}`}
                                                    {` · ${fmtTime(req.startTime)} – ${fmtTime(req.endTime)}`}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    {req.checkedInAt && (
                                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                            <IoLogInOutline size={10} /> In: {fmtDT(req.checkedInAt)}
                                                        </span>
                                                    )}
                                                    {req.checkedOutAt && (
                                                        <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                                                            <IoLogOutOutline size={10} /> Out: {fmtDT(req.checkedOutAt)}
                                                        </span>
                                                    )}
                                                    {req.feeCharged > 0 && (
                                                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                                            <IoCashOutline size={9} /> ₹{req.feeCharged}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ── BOOK TAB ────────────────────────────────────────────────────── */}
            {pageTab === 'book' && <>

                <div className={`${CARD} px-4 py-3 flex items-center gap-3`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(234,88,12,0.1))' }}>
                        <IoTimeOutline size={18} className="text-[#F97316]" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide">Visiting Date</p>
                        <input type="date"
                               value={selectedDate}
                               min={todayStr()}
                               onChange={e => setSelectedDate(e.target.value)}
                               className="mt-0.5 text-sm font-black text-[#1A1A1A] bg-transparent focus:outline-none" />
                    </div>
                </div>

                {/* Slot selector */}
                <div>
                    <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide mb-2">
                        Select a Time Slot
                    </p>
                    {slotsLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-7 h-7 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                        </div>
                    ) : slots.length === 0 ? (
                        <div className={`${CARD} p-8 text-center`}>
                            <IoLayersOutline size={32} className="mx-auto text-[#FDDCAE] mb-2" />
                            <p className="text-sm font-bold text-[#9B7B5A]">No active walkin slots</p>
                            <p className="text-xs text-[#9B7B5A] mt-1">Ask the library admin to set up walkin slots</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {slots.map(slot => {
                                const active = selectedSlot?._id === slot._id;
                                return (
                                    <button key={slot._id}
                                            onClick={() => setSelectedSlot(slot)}
                                            className="text-left rounded-2xl p-4 border transition-all"
                                            style={active
                                                ? { background: 'rgba(249,115,22,0.06)', border: '2px solid #F97316', boxShadow: '0 4px 16px rgba(249,115,22,0.12)' }
                                                : { background: '#fff', border: '1.5px solid #EDE8E0', boxShadow: '0 2px 8px rgba(180,120,60,0.05)' }}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-black text-[#1A1A1A]">{slot.name}</p>
                                            {active && (
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                      style={{ background: '#F97316', color: '#fff' }}>
                                                    SELECTED
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#9B7B5A]">{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</p>
                                        {slot.isFlexShift ? (
                                            <p className="text-xs font-bold text-orange-600 mt-1 flex items-center gap-1">
                                                <IoCheckmarkDoneOutline size={13} /> Included in Monthly Fee (₹0 / session)
                                            </p>
                                        ) : slot.feePerSession > 0 ? (
                                            <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                                <IoCashOutline size={11} /> ₹{slot.feePerSession}/session
                                            </p>
                                        ) : (
                                            <p className="text-xs font-bold text-stone-500 mt-1">Free Session</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Seat grid */}
                {selectedSlot && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide">Available Seats</p>
                            <div className="flex items-center gap-3">
                                {/* Legend */}
                                {Object.entries(SEAT_STATUS).filter(([k]) => k !== 'absent_today').map(([key, val]) => (
                                    <span key={key} className="flex items-center gap-1 text-[9px] font-bold"
                                          style={{ color: val.text }}>
                                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: val.text }} />
                                        {val.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {seatsLoading ? (
                            <div className={`${CARD} flex justify-center py-10`}>
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : availSeats.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoDesktopOutline size={36} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No eligible seats for this slot</p>
                                <p className="text-xs text-[#9B7B5A] mt-1">The admin has not added eligible seats for this slot yet</p>
                            </div>
                        ) : (
                            <div className={`${CARD} p-4`}>
                                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                                    {availSeats.map(item => {
                                        const s = SEAT_STATUS[item.status] || SEAT_STATUS.occupied;
                                        const isClickable = item.status === 'available' || item.status === 'absent' || item.status === 'absent_today' || item.status === 'partial_vacant' || item.isAvailable;
                                        const isSelected = selectedSeat?.seat?._id === item.seat._id;
                                        return (
                                            <button key={item.seat._id}
                                                    disabled={!isClickable}
                                                    onClick={() => isClickable && setSelectedSeat(isSelected ? null : item)}
                                                    className="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all"
                                                    style={isSelected
                                                        ? { background: 'rgba(249,115,22,0.12)', border: '2px solid #F97316', color: '#EA580C' }
                                                        : { background: s.bg, border: `1.5px solid ${s.border}`, color: s.text, opacity: isClickable ? 1 : 0.65, cursor: isClickable ? 'pointer' : 'not-allowed' }}>
                                                <IoDesktopOutline size={16} className="mb-0.5" />
                                                <span className="text-[10px] font-black leading-tight">{item.seat.number}</span>
                                                {(item.isPartial || item.status === 'partial_vacant') && item.partialTiming ? (
                                                    <span className="text-[7.5px] font-black leading-tight text-amber-800 bg-amber-100/90 px-1 py-0.5 rounded mt-0.5 max-w-full truncate">
                                                        {item.partialTiming}
                                                    </span>
                                                ) : item.seat.room ? (
                                                    <span className="text-[7px] leading-tight opacity-70 truncate w-full text-center">{item.seat.room}</span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Seat count summary */}
                                <div className="mt-3 pt-3 border-t border-[#EDE8E0] flex items-center gap-4 flex-wrap">
                                    {Object.entries(SEAT_STATUS).filter(([k]) => k !== 'absent_today').map(([key, val]) => {
                                        const count = availSeats.filter(s => s.status === key || (key === 'absent' && s.status === 'absent_today')).length;
                                        if (count === 0) return null;
                                        return (
                                            <span key={key} className="text-[11px] font-bold" style={{ color: val.text }}>
                                                {count} {val.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Request panel */}
                {selectedSeat && (
                    <div className={`${CARD} p-5`}
                         style={{ border: '2px solid #FDDCAE', boxShadow: '0 8px 32px rgba(249,115,22,0.12)' }}>
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                <IoDesktopOutline size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-black text-[#1A1A1A]">
                                        Seat {selectedSeat.seat.number}
                                        {selectedSeat.seat.room && <span className="text-[#9B7B5A] font-medium"> – {selectedSeat.seat.room}</span>}
                                    </p>
                                    {(selectedSeat.isPartial || selectedSeat.status === 'partial_vacant') && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                            Partial Vacancy
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[#9B7B5A] mt-0.5">
                                    {selectedSlot?.name} &bull; {fmtTime(selectedSlot?.startTime)} – {fmtTime(selectedSlot?.endTime)}
                                </p>
                                {(selectedSeat.isPartial || selectedSeat.status === 'partial_vacant') && (
                                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                        <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                            <IoAlertCircleOutline size={15} className="text-amber-600 shrink-0" />
                                            Partial Vacancy Available
                                        </p>
                                        <p className="text-[11px] text-amber-800 mt-1">
                                            <strong>Free Window:</strong> {selectedSeat.partialTiming}
                                            {selectedSeat.freeMinutes && ` (${Math.round((selectedSeat.freeMinutes / 60) * 10) / 10} hours free)`}
                                        </p>
                                        {selectedSeat.occupiedTiming && (
                                            <p className="text-[10px] text-stone-500 mt-0.5">
                                                Occupied during: {selectedSeat.occupiedTiming}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                                            Your booking request will be scheduled specifically for the free window ({selectedSeat.partialTiming}).
                                        </p>
                                    </div>
                                )}
                                {(selectedSeat.status === 'absent' || selectedSeat.status === 'absent_today') && (
                                    <p className="text-[11px] font-bold text-orange-600 mt-1 flex items-center gap-1">
                                        <IoAlertCircleOutline size={11} /> Permanent holder is absent today
                                    </p>
                                )}
                                {selectedSlot?.isFlexShift ? (
                                    <p className="text-[11px] text-orange-600 font-bold flex items-center gap-1 mt-1">
                                        <IoCheckmarkDoneOutline size={12} /> Fee: ₹0 (Covered by Monthly Flex Plan)
                                    </p>
                                ) : selectedSlot?.feePerSession > 0 ? (
                                    <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                                        <IoCashOutline size={11} /> Fee: ₹{selectedSlot.feePerSession}
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-stone-500 font-bold flex items-center gap-1 mt-1">
                                        Fee: Free
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-[#9B7B5A] uppercase tracking-wide mb-1">
                                Note (optional)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Any message for the admin..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full bg-[#FFFAF5] border border-[#EDE8E0] rounded-xl px-3 py-2 text-sm text-[#1A1A1A] resize-none focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[rgba(249,115,22,0.12)] transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedSeat(null)}
                                    className="flex-1 py-2.5 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] text-sm font-bold">
                                Cancel
                            </button>
                            <button onClick={submitRequest} disabled={requesting}
                                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all"
                                    style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                {requesting ? 'Requesting...' : 'Request This Seat'}
                            </button>
                        </div>
                    </div>
                )}

                {/* My Requests */}
                <div>
                    <p className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide mb-2">My Requests</p>
                    {reqLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-7 h-7 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                        </div>
                    ) : myRequests.length === 0 ? (
                        <div className={`${CARD} p-8 text-center`}>
                            <IoPersonOutline size={30} className="mx-auto text-[#FDDCAE] mb-2" />
                            <p className="text-xs text-[#9B7B5A]">No requests yet. Request a seat above to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {myRequests.map(req => {
                                const isToday = req.date === todayStr();
                                const canCheckIn  = req.status === 'approved' && !req.checkedInAt && isToday;
                                const canCheckOut = req.status === 'approved' && !!req.checkedInAt && !req.checkedOutAt && isToday;

                                const fmtDateTime = (dt) => {
                                    if (!dt) return null;
                                    const d = new Date(dt);
                                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                };

                                return (
                                    <div key={req._id} className={`${CARD} px-4 py-3`}
                                         style={canCheckIn || canCheckOut ? { borderColor: '#FDDCAE', boxShadow: '0 4px 16px rgba(249,115,22,0.10)' } : {}}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                 style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid #FDDCAE' }}>
                                                <IoDesktopOutline size={15} className="text-[#F97316]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-black text-[#1A1A1A]">
                                                        Seat {req.seat?.number || '?'}
                                                    </p>
                                                    <span className={`${BADGE} ${reqStatusColor(req.status)}`}>{req.status}</span>
                                                    {req.checkedInAt && !req.checkedOutAt && (
                                                        <span className={`${BADGE} bg-emerald-100 text-emerald-700 animate-pulse`}>In Session</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#9B7B5A] mt-0.5">
                                                    {req.date} &bull; {fmtTime(req.startTime)} – {fmtTime(req.endTime)}
                                                    {req.walkinSlot?.name && ` · ${req.walkinSlot.name}`}
                                                </p>
                                                {/* Timestamps */}
                                                {(req.checkedInAt || req.checkedOutAt) && (
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        {req.checkedInAt && (
                                                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                                <IoLogInOutline size={10} /> In: {fmtDateTime(req.checkedInAt)}
                                                            </span>
                                                        )}
                                                        {req.checkedOutAt && (
                                                            <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1">
                                                                <IoLogOutOutline size={10} /> Out: {fmtDateTime(req.checkedOutAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {req.feeCharged > 0 && req.status === 'completed' && (
                                                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                                                        <IoCashOutline size={9} /> Fee: ₹{req.feeCharged}
                                                    </p>
                                                )}
                                                {req.rejectionReason && (
                                                    <p className="text-xs text-rose-500 mt-0.5">Reason: {req.rejectionReason}</p>
                                                )}
                                            </div>

                                            {/* Right side — action buttons or status icon */}
                                            <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                                                {canCheckIn && (
                                                    <button onClick={() => handleCheckIn(req._id)}
                                                            className="text-[11px] font-black px-3 py-1.5 rounded-xl text-white transition-all"
                                                            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                                                        Check In
                                                    </button>
                                                )}
                                                {canCheckOut && (
                                                    <button onClick={() => handleCheckOut(req._id)}
                                                            className="text-[11px] font-black px-3 py-1.5 rounded-xl text-white transition-all"
                                                            style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                                                        Check Out
                                                    </button>
                                                )}
                                                {!canCheckIn && !canCheckOut && (
                                                    <>
                                                        {req.status === 'approved'  && <IoCheckmarkCircleOutline size={18} className="text-emerald-500" />}
                                                        {req.status === 'rejected'  && <IoCloseCircleOutline size={18} className="text-rose-500" />}
                                                        {req.status === 'pending'   && <IoHourglassOutline size={18} className="text-amber-500" />}
                                                        {req.status === 'completed' && <IoCheckmarkDoneOutline size={18} className="text-blue-500" />}
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
            </>}

            </div>
        </div>
    );
}
