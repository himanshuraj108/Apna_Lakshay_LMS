import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
    IoArrowBack, IoAddOutline, IoTrashOutline, IoPencil,
    IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTimeOutline,
    IoMoonOutline, IoSunnyOutline, IoDesktopOutline, IoLayersOutline,
    IoRefreshOutline, IoPeopleOutline, IoCashOutline, IoSearchOutline,
    IoCheckmark
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

// ─── Warm design constants ────────────────────────────────────────────────────
const CARD  = 'bg-white rounded-2xl border border-[#EDE8E0] shadow-[0_4px_20px_rgba(180,120,60,0.07)]';
const INPUT = 'w-full bg-[#FFFAF5] border border-[#EDE8E0] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[rgba(249,115,22,0.12)] transition-all';
const LABEL = 'block text-xs font-bold text-[#9B7B5A] uppercase tracking-wide mb-1';
const BADGE = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold';

const TABS = [
    { id: 'slots',    label: 'Walkin Slots',    icon: IoLayersOutline },
    { id: 'absences', label: "Today's Absences", icon: IoMoonOutline },
    { id: 'requests', label: 'Requests',          icon: IoPeopleOutline },
    { id: 'revenue',  label: 'Revenue',            icon: IoCashOutline },
];

// ─── WalkinManagement ─────────────────────────────────────────────────────────
export default function WalkinManagement() {
    const backPath = useBackPath();
    const [tab, setTab] = useState('slots');

    // ─── Slots state ──────────────────────────────────────────────────────────
    const [slots, setSlots]               = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [editingSlot, setEditingSlot]     = useState(null);
    const [slotForm, setSlotForm] = useState({
        name: '', startTime: '', endTime: '', feePerSession: 0,
        isActive: true, eligibleSeats: []
    });
    const [slotSaving, setSlotSaving] = useState(false);

    // ─── Seat picker state (inside modal) ────────────────────────────────────
    const [allSeats, setAllSeats]         = useState([]);
    const [seatsLoading, setSeatsLoading] = useState(false);
    const [seatSearch, setSeatSearch]     = useState('');

    // ─── Absences state ───────────────────────────────────────────────────────
    const [absences, setAbsences]               = useState([]);
    const [absencesLoading, setAbsencesLoading] = useState(false);
    const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);

    // ─── Requests state ───────────────────────────────────────────────────────
    const [requests, setRequests]               = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [reqFilter, setReqFilter]             = useState('pending');
    const [approveModal, setApproveModal]       = useState(null); // { req, fee }

    // ─── Revenue state ────────────────────────────────────────────────────────
    const [revenue, setRevenue]               = useState([]);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revDateFrom, setRevDateFrom] = useState('');
    const [revDateTo,   setRevDateTo]   = useState('');

    // ─── Fetch helpers ────────────────────────────────────────────────────────
    const fetchSlots = useCallback(async () => {
        setSlotsLoading(true);
        try {
            const r = await api.get('/walkin/slots');
            setSlots(r.data.slots || []);
        } catch { /* ignore */ }
        finally { setSlotsLoading(false); }
    }, []);

    const fetchAllSeats = useCallback(async () => {
        setSeatsLoading(true);
        try {
            const r = await api.get('/walkin/all-seats');
            setAllSeats(r.data.seats || []);
        } catch { /* ignore */ }
        finally { setSeatsLoading(false); }
    }, []);

    const fetchAbsences = useCallback(async (date) => {
        setAbsencesLoading(true);
        try {
            const r = await api.get(`/walkin/absence?date=${date}`);
            setAbsences(r.data.absences || []);
        } catch { /* ignore */ }
        finally { setAbsencesLoading(false); }
    }, []);

    const fetchRequests = useCallback(async (status) => {
        setRequestsLoading(true);
        try {
            const r = await api.get(`/walkin/requests?status=${status}`);
            setRequests(r.data.requests || []);
        } catch { /* ignore */ }
        finally { setRequestsLoading(false); }
    }, []);

    const fetchRevenue = useCallback(async () => {
        setRevenueLoading(true);
        try {
            const r = await api.get('/walkin/requests?status=completed');
            setRevenue(r.data.requests || []);
        } catch { /* ignore */ }
        finally { setRevenueLoading(false); }
    }, []);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);
    useEffect(() => { if (tab === 'absences') fetchAbsences(absenceDate); }, [tab, absenceDate, fetchAbsences]);
    useEffect(() => { if (tab === 'requests') fetchRequests(reqFilter); }, [tab, reqFilter, fetchRequests]);
    useEffect(() => { if (tab === 'revenue')  fetchRevenue(); }, [tab, fetchRevenue]);

    // ─── Slot CRUD ────────────────────────────────────────────────────────────
    const openNewSlot = () => {
        setEditingSlot(null);
        setSlotForm({ name: '', startTime: '', endTime: '', feePerSession: 0, isActive: true, eligibleSeats: [] });
        setSeatSearch('');
        setShowSlotModal(true);
        fetchAllSeats();
    };

    const openEditSlot = (slot) => {
        setEditingSlot(slot);
        // eligibleSeats may be array of objects (populated) or plain IDs
        const ids = (slot.eligibleSeats || []).map(s => typeof s === 'object' ? String(s._id) : String(s));
        setSlotForm({
            name: slot.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            feePerSession: slot.feePerSession || 0,
            isActive: slot.isActive !== false,
            eligibleSeats: ids
        });
        setSeatSearch('');
        setShowSlotModal(true);
        fetchAllSeats();
    };

    const toggleSeat = (seatId) => {
        const id = String(seatId);
        setSlotForm(prev => ({
            ...prev,
            eligibleSeats: prev.eligibleSeats.includes(id)
                ? prev.eligibleSeats.filter(s => s !== id)
                : [...prev.eligibleSeats, id]
        }));
    };

    const toggleAllFiltered = () => {
        const filtered = filteredSeats.map(s => String(s._id));
        const allSelected = filtered.every(id => slotForm.eligibleSeats.includes(id));
        if (allSelected) {
            setSlotForm(prev => ({ ...prev, eligibleSeats: prev.eligibleSeats.filter(id => !filtered.includes(id)) }));
        } else {
            const merged = Array.from(new Set([...slotForm.eligibleSeats, ...filtered]));
            setSlotForm(prev => ({ ...prev, eligibleSeats: merged }));
        }
    };

    const saveSlot = async () => {
        if (!slotForm.name || !slotForm.startTime || !slotForm.endTime) return;
        setSlotSaving(true);
        try {
            const body = { ...slotForm };
            if (editingSlot) {
                await api.put(`/walkin/slots/${editingSlot._id}`, body);
            } else {
                await api.post('/walkin/slots', body);
            }
            setShowSlotModal(false);
            fetchSlots();
        } catch (err) {
            alert(err?.response?.data?.message || 'Save failed');
        } finally {
            setSlotSaving(false);
        }
    };

    const deleteSlot = async (slot) => {
        if (!window.confirm(`Delete "${slot.name}"?`)) return;
        try {
            await api.delete(`/walkin/slots/${slot._id}`);
            setSlots(prev => prev.filter(s => s._id !== slot._id));
        } catch { alert('Delete failed'); }
    };

    // ─── Request approve / reject ─────────────────────────────────────────────
    const openApproveModal = (req) => {
        // Pre-fill with slot's default fee
        const defaultFee = req.walkinSlot?.feePerSession ?? 0;
        setApproveModal({ req, fee: String(defaultFee) });
    };

    const confirmApprove = async () => {
        if (!approveModal) return;
        try {
            await api.patch(`/walkin/requests/${approveModal.req._id}/approve`, {
                feeCharged: approveModal.fee === '' ? 0 : Number(approveModal.fee)
            });
            setApproveModal(null);
            fetchRequests(reqFilter);
        } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    };

    const rejectRequest = async (req) => {
        const reason = window.prompt('Rejection reason (optional):') ?? '';
        if (reason === null) return;
        try {
            await api.patch(`/walkin/requests/${req._id}/reject`, { rejectionReason: reason });
            fetchRequests(reqFilter);
        } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const fmtTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    const statusColor = (s) => {
        if (s === 'pending')   return 'bg-amber-100 text-amber-700';
        if (s === 'approved')  return 'bg-emerald-100 text-emerald-700';
        if (s === 'rejected')  return 'bg-rose-100 text-rose-700';
        if (s === 'completed') return 'bg-blue-100 text-blue-700';
        return 'bg-stone-100 text-stone-600';
    };

    // Filtered seats for modal search
    const filteredSeats = seatSearch.trim()
        ? allSeats.filter(s =>
            String(s.number).includes(seatSearch) ||
            (s.room || '').toLowerCase().includes(seatSearch.toLowerCase()) ||
            (s.floor || '').toLowerCase().includes(seatSearch.toLowerCase())
          )
        : allSeats;

    const allFilteredSelected = filteredSeats.length > 0 &&
        filteredSeats.every(s => slotForm.eligibleSeats.includes(String(s._id)));

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
                <div>
                    <h1 className="text-base font-black text-[#1A1A1A]">Walkin Management</h1>
                    <p className="text-[11px] text-[#9B7B5A]">Slots, absences, and flexible seat requests</p>
                </div>
            </header>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-5 space-y-5">

                {/* Tab Pills */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5F0EA' }}>
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const active = tab === t.id;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all"
                                    style={active
                                        ? { background: '#fff', color: '#EA580C', border: '1.5px solid #FDDCAE', boxShadow: '0 2px 8px rgba(249,115,22,0.10)' }
                                        : { color: '#9B7B5A' }}>
                                <Icon size={13} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── SLOTS TAB ─────────────────────────────────────────────── */}
                {tab === 'slots' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[#1A1A1A]">Walkin Time Slots</h2>
                            <button onClick={openNewSlot}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all"
                                    style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                <IoAddOutline size={14} />
                                New Slot
                            </button>
                        </div>

                        {slotsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : slots.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoLayersOutline size={36} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No walkin slots yet</p>
                                <p className="text-xs text-[#9B7B5A] mt-1">Create a slot so students can request flexible seating</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {slots.map(slot => (
                                    <div key={slot._id} className={`${CARD} p-4 flex items-start gap-3`}>
                                        <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                                             style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(234,88,12,0.1))' }}>
                                            <IoTimeOutline size={20} className="text-[#F97316]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-black text-[#1A1A1A] truncate">{slot.name}</p>
                                                <span className={`${BADGE} ${slot.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                                    {slot.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#9B7B5A] mt-0.5">
                                                {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {slot.feePerSession > 0 && (
                                                    <p className="text-xs text-emerald-600 font-bold">
                                                        ₹{slot.feePerSession}/session
                                                    </p>
                                                )}
                                                <p className="text-xs text-[#9B7B5A]">
                                                    <span className="font-bold text-[#EA580C]">{slot.eligibleSeats?.length || 0}</span> eligible seat{slot.eligibleSeats?.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => openEditSlot(slot)}
                                                    className="p-2 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0] text-[#9B7B5A] hover:text-[#EA580C] hover:border-[#FDDCAE] transition-all">
                                                <IoPencil size={13} />
                                            </button>
                                            <button onClick={() => deleteSlot(slot)}
                                                    className="p-2 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0] text-[#9B7B5A] hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all">
                                                <IoTrashOutline size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ABSENCES TAB ──────────────────────────────────────────── */}
                {tab === 'absences' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-sm font-bold text-[#1A1A1A]">Absent Students</h2>
                            <input type="date" value={absenceDate}
                                   onChange={e => setAbsenceDate(e.target.value)}
                                   className="text-xs bg-white border border-[#EDE8E0] rounded-xl px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#F97316] transition-all" />
                            <button onClick={() => fetchAbsences(absenceDate)}
                                    className="p-2 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] hover:text-[#EA580C] transition-all">
                                <IoRefreshOutline size={14} />
                            </button>
                        </div>

                        {absencesLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : absences.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoSunnyOutline size={36} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No absences for {absenceDate}</p>
                                <p className="text-xs text-[#9B7B5A] mt-1">All students are present, or none have been marked absent</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-[#9B7B5A]">{absences.length} student{absences.length !== 1 ? 's' : ''} marked absent</p>
                                {absences.map(a => (
                                    <div key={a._id} className={`${CARD} px-4 py-3 flex items-center gap-3`}>
                                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                                            <IoMoonOutline size={16} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#1A1A1A] truncate">{a.student?.name}</p>
                                            <p className="text-xs text-[#9B7B5A]">
                                                {a.student?.mobile || 'No phone'}
                                                {a.note ? ` • ${a.note}` : ''}
                                            </p>
                                        </div>
                                        {a.markedBy && (
                                            <p className="text-[10px] text-[#9B7B5A] text-right">by {a.markedBy?.name}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── REQUESTS TAB ──────────────────────────────────────────── */}
                {tab === 'requests' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-sm font-bold text-[#1A1A1A]">Walkin Requests</h2>
                            <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5F0EA' }}>
                                {['pending','approved','rejected','completed'].map(s => (
                                    <button key={s} onClick={() => setReqFilter(s)}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all"
                                            style={reqFilter === s
                                                ? { background: '#fff', color: '#EA580C', border: '1.5px solid #FDDCAE' }
                                                : { color: '#9B7B5A' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => fetchRequests(reqFilter)}
                                    className="p-2 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] hover:text-[#EA580C] transition-all">
                                <IoRefreshOutline size={14} />
                            </button>
                        </div>

                        {requestsLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoPeopleOutline size={36} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No {reqFilter} requests</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req._id} className={`${CARD} p-4`}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#EDE8E0] flex items-center justify-center flex-shrink-0">
                                                <IoDesktopOutline size={18} className="text-[#F97316]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-black text-[#1A1A1A]">{req.student?.name || 'Unknown'}</p>
                                                    <span className={`${BADGE} ${statusColor(req.status)}`}>{req.status}</span>
                                                </div>
                                                <p className="text-xs text-[#9B7B5A] mt-0.5">
                                                    Seat {req.seat?.number || '?'} &bull; {req.date} &bull; {fmtTime(req.startTime)} – {fmtTime(req.endTime)}
                                                </p>
                                                {req.walkinSlot?.name && (
                                                    <p className="text-xs text-[#9B7B5A]">Slot: {req.walkinSlot.name}</p>
                                                )}
                                                {req.note && <p className="text-xs text-[#9B7B5A] italic mt-0.5">"{req.note}"</p>}
                                                {req.feeCharged > 0 && (
                                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                                        <IoCashOutline size={11} /> ₹{req.feeCharged}
                                                    </p>
                                                )}
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button onClick={() => openApproveModal(req)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all">
                                                        <IoCheckmarkCircleOutline size={13} />
                                                        Approve
                                                    </button>
                                                    <button onClick={() => rejectRequest(req)}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all">
                                                        <IoCloseCircleOutline size={13} />
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Approve Fee Modal ───────────────────────────────────────── */}
            {approveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                     style={{ background: 'rgba(0,0,0,0.45)' }}
                     onClick={() => setApproveModal(null)}>
                    <div className={`${CARD} w-full max-w-sm`}
                         onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-5 pt-5 pb-3 border-b border-[#EDE8E0]">
                            <h3 className="text-base font-black text-[#1A1A1A]">Approve Request</h3>
                            <p className="text-xs text-[#9B7B5A] mt-0.5">
                                {approveModal.req.student?.name} &middot; Seat {approveModal.req.seat?.number || '?'}
                                {approveModal.req.walkinSlot?.name ? ` · ${approveModal.req.walkinSlot.name}` : ''}
                            </p>
                        </div>

                        {/* Fee input */}
                        <div className="px-5 py-5 space-y-4">
                            <div>
                                <label className={LABEL}>Fee to Charge (₹)</label>
                                <p className="text-[10px] text-[#9B7B5A] mb-1.5">
                                    Slot default: ₹{approveModal.req.walkinSlot?.feePerSession ?? 0}. Change to set a negotiated fee.
                                </p>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className={INPUT}
                                    placeholder="Enter fee amount"
                                    value={approveModal.fee}
                                    onChange={e => setApproveModal(prev => ({ ...prev, fee: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setApproveModal(null)}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#9B7B5A] bg-white border border-[#EDE8E0] hover:border-[#FDDCAE] transition-all">
                                    Cancel
                                </button>
                                <button onClick={confirmApprove}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                                    Approve &amp; Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Slot Modal (with eligible seats picker) ───────────────────── */}
            {showSlotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                     style={{ background: 'rgba(0,0,0,0.45)' }}
                     onClick={() => setShowSlotModal(false)}>
                    <div className={`${CARD} w-full max-w-lg flex flex-col`}
                         style={{ maxHeight: '90vh' }}
                         onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="px-6 pt-5 pb-3 border-b border-[#EDE8E0]">
                            <h3 className="text-base font-black text-[#1A1A1A]">
                                {editingSlot ? 'Edit Slot' : 'New Walkin Slot'}
                            </h3>
                            <p className="text-xs text-[#9B7B5A] mt-0.5">Configure slot details and which seats are available for walkin</p>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                            {/* Basic fields */}
                            <div>
                                <label className={LABEL}>Slot Name</label>
                                <input className={INPUT} placeholder="e.g. Morning Slot"
                                       value={slotForm.name}
                                       onChange={e => setSlotForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>Start Time</label>
                                    <input type="time" className={INPUT}
                                           value={slotForm.startTime}
                                           onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} />
                                </div>
                                <div>
                                    <label className={LABEL}>End Time</label>
                                    <input type="time" className={INPUT}
                                           value={slotForm.endTime}
                                           onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className={LABEL}>Fee per Session (₹)</label>
                                <input type="number" min="0" className={INPUT}
                                       value={slotForm.feePerSession}
                                       onChange={e => setSlotForm(p => ({ ...p, feePerSession: Number(e.target.value) }))} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="slotActive" checked={slotForm.isActive}
                                       onChange={e => setSlotForm(p => ({ ...p, isActive: e.target.checked }))}
                                       className="accent-orange-500" />
                                <label htmlFor="slotActive" className="text-xs font-bold text-[#9B7B5A] uppercase tracking-wide">
                                    Active (visible to students)
                                </label>
                            </div>

                            {/* ── Eligible Seats Picker ────────────────────── */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={LABEL + ' mb-0'}>Eligible Seats for Walkin</label>
                                    <span className="text-[11px] font-bold text-[#EA580C]">
                                        {slotForm.eligibleSeats.length} selected
                                    </span>
                                </div>

                                {/* Search bar */}
                                <div className="relative mb-2">
                                    <IoSearchOutline size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B7B5A]" />
                                    <input
                                        className="w-full pl-8 pr-3 py-2 bg-[#FFFAF5] border border-[#EDE8E0] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#F97316] transition-all"
                                        placeholder="Search by seat number or room..."
                                        value={seatSearch}
                                        onChange={e => setSeatSearch(e.target.value)}
                                    />
                                </div>

                                {/* Select all toggle */}
                                {filteredSeats.length > 0 && (
                                    <button onClick={toggleAllFiltered}
                                            className="mb-2 text-[11px] font-bold text-[#EA580C] underline underline-offset-2">
                                        {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredSeats.length})
                                    </button>
                                )}

                                {/* Seat grid */}
                                {seatsLoading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="w-6 h-6 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                                    </div>
                                ) : filteredSeats.length === 0 ? (
                                    <p className="text-xs text-[#9B7B5A] py-4 text-center">No seats found</p>
                                ) : (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1">
                                        {filteredSeats.map(seat => {
                                            const sid = String(seat._id);
                                            const selected = slotForm.eligibleSeats.includes(sid);
                                            return (
                                                <button key={sid} onClick={() => toggleSeat(sid)}
                                                        className="relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all"
                                                        style={selected
                                                            ? { background: 'rgba(249,115,22,0.08)', border: '1.5px solid #FDDCAE', color: '#EA580C' }
                                                            : { background: '#FFFAF5', border: '1px solid #EDE8E0', color: '#9B7B5A' }}>
                                                    {selected && (
                                                        <IoCheckmark size={9}
                                                            className="absolute top-0.5 right-0.5 text-[#EA580C]" />
                                                    )}
                                                    <IoDesktopOutline size={14} className="mb-0.5" />
                                                    <span className="text-[10px] font-black leading-tight">{seat.number}</span>
                                                    {seat.room && (
                                                        <span className="text-[8px] leading-tight truncate w-full text-center opacity-70">{seat.room}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="px-6 pb-5 pt-3 border-t border-[#EDE8E0] flex gap-3">
                            <button onClick={() => setShowSlotModal(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] text-sm font-bold">
                                Cancel
                            </button>
                            <button onClick={saveSlot} disabled={slotSaving}
                                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}>
                                {slotSaving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REVENUE TAB ─────────────────────────────────────────────── */}
            {tab === 'revenue' && (() => {
                const filtered = revenue.filter(r => {
                    if (revDateFrom && r.date < revDateFrom) return false;
                    if (revDateTo   && r.date > revDateTo)   return false;
                    return true;
                });
                const totalRev = filtered.reduce((s, r) => s + (r.feeCharged || 0), 0);
                const avgFee   = filtered.length ? Math.round(totalRev / filtered.length) : 0;
                const fmtDT = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

                return (
                    <div className="space-y-4">
                        {/* Date filter */}
                        <div className={`${CARD} px-4 py-3 flex items-center gap-3 flex-wrap`}>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-[#9B7B5A]">From</label>
                                <input type="date" value={revDateFrom} onChange={e => setRevDateFrom(e.target.value)}
                                       className={INPUT} style={{ width: 145 }} />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-[#9B7B5A]">To</label>
                                <input type="date" value={revDateTo} onChange={e => setRevDateTo(e.target.value)}
                                       className={INPUT} style={{ width: 145 }} />
                            </div>
                            {(revDateFrom || revDateTo) && (
                                <button onClick={() => { setRevDateFrom(''); setRevDateTo(''); }}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
                                    Clear
                                </button>
                            )}
                            <button onClick={fetchRevenue}
                                    className="ml-auto p-2 rounded-xl bg-white border border-[#EDE8E0] text-[#9B7B5A] hover:text-[#EA580C] transition-all">
                                <IoRefreshOutline size={14} />
                            </button>
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Total Sessions',    value: filtered.length,               color: '#F97316' },
                                { label: 'Total Revenue',     value: `\u20B9${totalRev}`,            color: '#10B981' },
                                { label: 'Avg Fee / Session', value: avgFee > 0 ? `\u20B9${avgFee}` : '\u2014', color: '#3B82F6' },
                            ].map(stat => (
                                <div key={stat.label} className={`${CARD} p-3 text-center`}
                                     style={{ borderTop: `3px solid ${stat.color}` }}>
                                    <p className="text-xs font-bold text-[#9B7B5A] leading-tight">{stat.label}</p>
                                    <p className="text-xl font-black mt-1" style={{ color: stat.color }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {revenueLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 rounded-full border-4 border-[#FDDCAE] border-t-[#F97316] animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={`${CARD} p-10 text-center`}>
                                <IoCashOutline size={34} className="mx-auto text-[#FDDCAE] mb-2" />
                                <p className="text-sm font-bold text-[#9B7B5A]">No completed sessions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filtered.map(req => (
                                    <div key={req._id} className={`${CARD} px-4 py-3`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                 style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid #a7f3d0' }}>
                                                <IoDesktopOutline size={15} className="text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-black text-[#1A1A1A]">{req.student?.name || 'Student'}</p>
                                                    <span className={`${BADGE} bg-[#FFF5EE] text-[#EA580C]`}>Seat {req.seat?.number || '?'}</span>
                                                    {req.seat?.room && <span className={`${BADGE} bg-gray-100 text-[#9B7B5A]`}>{req.seat.room}</span>}
                                                </div>
                                                <p className="text-xs text-[#9B7B5A] mt-0.5">
                                                    {req.date}
                                                    {req.walkinSlot?.name && ` · ${req.walkinSlot.name}`}
                                                    {req.checkedInAt  && ` · In: ${fmtDT(req.checkedInAt)}`}
                                                    {req.checkedOutAt && ` · Out: ${fmtDT(req.checkedOutAt)}`}
                                                </p>
                                            </div>
                                            {req.feeCharged > 0 ? (
                                                <span className="text-base font-black text-emerald-600 flex-shrink-0">\u20B9{req.feeCharged}</span>
                                            ) : (
                                                <span className="text-xs font-bold text-[#9B7B5A] flex-shrink-0">Free</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

        </div>
    );
}
