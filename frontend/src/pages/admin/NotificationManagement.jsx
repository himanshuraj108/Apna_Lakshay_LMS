import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoSend, IoPeopleOutline, IoPersonOutline,
    IoNotificationsOutline, IoCheckmarkCircle, IoCloseCircle,
    IoMegaphoneOutline, IoCreateOutline, IoTrashOutline, IoAdd, IoClose,
    IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTimeOutline, IoRefreshOutline
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

const PAGE_BG = { background: '#FAF6F0' };

const INPUT = "w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-[#0F172A] text-sm placeholder-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all shadow-2xs";
const TEXTAREA = "w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-[#0F172A] text-sm placeholder-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all resize-y shadow-2xs";

const NotificationManagement = () => {
    const backPath = useBackPath();
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'updates'
    
    // In-app notifications state
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({ title: '', message: '', sendToAll: true, recipientId: '' });
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'broadcast' | 'direct'
    
    // Updates ticker state
    const [updates, setUpdates] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState(null);
    const [updateForm, setUpdateForm] = useState({
        tickerEn: '',
        tickerHi: '',
        titleEn: '',
        titleHi: '',
        contentEn: '',
        contentHi: '',
        isActive: true
    });
    
    // Status states
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudents();
        fetchUpdates();
        fetchHistory();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            setStudents(res.data.students.filter(s => s.isActive));
        } catch (e) { console.error(e); }
    };

    const fetchUpdates = async () => {
        try {
            const res = await api.get('/admin/updates');
            setUpdates(res.data.updates);
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/admin/notifications');
            if (res.data?.success) {
                setHistory(res.data.notifications || []);
            }
        } catch (e) {
            console.error('Failed to fetch notification history:', e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSending(true); setError(''); setSuccess('');
        try {
            await api.post('/admin/notifications', formData);
            setSuccess(formData.sendToAll ? `Announcement sent to all ${students.length} students!` : 'Notification sent successfully!');
            setFormData({ title: '', message: '', sendToAll: true, recipientId: '' });
            fetchHistory();
            setTimeout(() => setSuccess(''), 5000);
        } catch (e) { setError(e.response?.data?.message || 'Failed to send'); }
        finally { setSending(false); }
    };

    const handleDeleteNotification = async (notif) => {
        if (!window.confirm('Are you sure you want to delete this notification from history?')) return;
        try {
            await api.delete(`/admin/notifications/${notif._id}`, {
                data: { ids: notif.ids }
            });
            setSuccess('Notification deleted from history');
            fetchHistory();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete notification');
            setTimeout(() => setError(''), 4000);
        }
    };

    // System updates handlers
    const startCreateUpdate = () => {
        setEditingUpdate(null);
        setUpdateForm({
            tickerEn: '',
            tickerHi: '',
            titleEn: '',
            titleHi: '',
            contentEn: '',
            contentHi: '',
            isActive: true
        });
        setShowUpdateModal(true);
    };

    const startEditUpdate = (update) => {
        setEditingUpdate(update);
        setUpdateForm({
            tickerEn: update.tickerEn,
            tickerHi: update.tickerHi,
            titleEn: update.titleEn,
            titleHi: update.titleHi,
            contentEn: update.contentEn,
            contentHi: update.contentHi,
            isActive: update.isActive
        });
        setShowUpdateModal(true);
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (editingUpdate) {
                await api.put(`/admin/updates/${editingUpdate._id}`, updateForm);
                setSuccess('Dashboard update updated successfully!');
            } else {
                await api.post('/admin/updates', updateForm);
                setSuccess('Dashboard update created successfully!');
            }
            setShowUpdateModal(false);
            fetchUpdates();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save update');
        }
    };

    const handleToggleActive = async (id) => {
        try {
            const res = await api.put(`/admin/updates/${id}/toggle`);
            setSuccess(res.data.message);
            fetchUpdates();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleDeleteUpdate = async (id) => {
        if (!window.confirm('Are you sure you want to delete this update?')) return;
        try {
            await api.delete(`/admin/updates/${id}`);
            setSuccess('Update deleted successfully');
            fetchUpdates();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete update');
        }
    };

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 mb-8 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link to={backPath}>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
                                <IoArrowBack size={15} /> <span>Back</span>
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                    <IoNotificationsOutline size={14} />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Communication</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">Notifications & Updates</h1>
                        </div>
                    </div>

                    {activeTab === 'updates' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startCreateUpdate}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                        >
                            <IoAdd size={18} />
                            Add New Update
                        </motion.button>
                    )}
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex bg-white p-1.5 rounded-2xl mb-6 border border-[#EDE8E0] shadow-xs">
                    <button
                        onClick={() => { setActiveTab('notifications'); setError(''); setSuccess(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            activeTab === 'notifications'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF6F0]'
                        }`}
                    >
                        <IoNotificationsOutline size={16} />
                        In-App Notifications
                    </button>
                    <button
                        onClick={() => { setActiveTab('updates'); setError(''); setSuccess(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            activeTab === 'updates'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF6F0]'
                        }`}
                    >
                        <IoMegaphoneOutline size={16} />
                        Dashboard Updates Ticker
                    </button>
                </div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-5 text-xs font-bold shadow-2xs"><IoCheckmarkCircle size={18} className="text-emerald-600" />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-5 text-xs font-bold shadow-2xs"><IoCloseCircle size={18} className="text-rose-600" />{error}</motion.div>}
                </AnimatePresence>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                    {activeTab === 'notifications' ? (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Send Notification Card */}
                            <div className="bg-white border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-xs">
                                <div className="h-[2px] bg-gradient-to-r from-orange-500 to-amber-500" />
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    {/* Send To */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2 font-bold">Send To</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: `All Students (${students.length})`, icon: IoPeopleOutline, val: true },
                                                { label: 'Individual Student', icon: IoPersonOutline, val: false },
                                            ].map(({ label, icon: Icon, val }) => (
                                                <button key={String(val)} type="button" onClick={() => setFormData({ ...formData, sendToAll: val, recipientId: '' })}
                                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${formData.sendToAll === val
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                                        : 'bg-white border border-[#EDE8E0] text-stone-700 hover:bg-[#FAF6F0]'}`}>
                                                    <Icon size={16} /> {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Student Selector */}
                                    {!formData.sendToAll && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                            <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2 font-bold">Select Student</label>
                                            <select value={formData.recipientId} onChange={e => setFormData({ ...formData, recipientId: e.target.value })}
                                                required className={INPUT}>
                                                <option value="">Choose a student…</option>
                                                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                            </select>
                                        </motion.div>
                                    )}

                                    {/* Title */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2 font-bold">Title</label>
                                        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Library Closing Early Tomorrow" required className={INPUT} />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2 font-bold">Message</label>
                                        <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Enter your announcement message here…" required rows={5}
                                            className={TEXTAREA} />
                                        <p className="text-xs text-stone-400 mt-1">{formData.message.length} characters</p>
                                    </div>

                                    {/* Preview */}
                                    <AnimatePresence>
                                        {(formData.title || formData.message) && (
                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl p-4 shadow-xs">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IoMegaphoneOutline size={14} className="text-orange-600" />
                                                    <p className="text-xs text-stone-500 uppercase tracking-wider font-bold">Preview</p>
                                                </div>
                                                {formData.title && <h3 className="font-bold text-[#0F172A] mb-1">{formData.title}</h3>}
                                                {formData.message && <p className="text-stone-700 text-xs whitespace-pre-wrap leading-relaxed">{formData.message}</p>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer">
                                        <IoSend size={15} />
                                        {sending ? 'Sending…' : formData.sendToAll ? 'Send to All Students' : 'Send Notification'}
                                    </motion.button>
                                    <p className="text-[11px] text-stone-400 text-center font-medium">Notifications appear in student dashboards in real time.</p>
                                </form>
                            </div>

                            {/* Sent Notification History Section */}
                            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-6 shadow-xs relative overflow-hidden">
                                <div className="h-[2px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 absolute top-0 left-0 right-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                                <IoTimeOutline size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Broadcast Archive</span>
                                        </div>
                                        <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                                            Sent History & Broadcasts
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                                {history.length}
                                            </span>
                                        </h2>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Filter buttons */}
                                        <div className="flex bg-[#FAF6F0] p-1 rounded-xl border border-[#EDE8E0]">
                                            {[
                                                { id: 'all', label: `All (${history.length})` },
                                                { id: 'broadcast', label: `Broadcasts (${history.filter(h => h.isBroadcast).length})` },
                                                { id: 'direct', label: `Direct (${history.filter(h => !h.isBroadcast).length})` },
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setHistoryFilter(f.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        historyFilter === f.id
                                                            ? 'bg-white text-orange-700 shadow-2xs border border-[#EDE8E0]'
                                                            : 'text-stone-500 hover:text-stone-800'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={fetchHistory}
                                            disabled={historyLoading}
                                            className="p-2 rounded-xl bg-[#FAF6F0] hover:bg-orange-50 border border-[#EDE8E0] text-stone-600 hover:text-orange-600 transition-all cursor-pointer"
                                            title="Refresh history"
                                        >
                                            <IoRefreshOutline size={16} className={historyLoading ? 'animate-spin text-orange-500' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {/* History List */}
                                {historyLoading && history.length === 0 ? (
                                    <div className="text-center py-10 text-stone-400 text-xs font-semibold flex items-center justify-center gap-2">
                                        <IoRefreshOutline size={16} className="animate-spin text-orange-500" /> Loading notification history...
                                    </div>
                                ) : history.filter(item => {
                                    if (historyFilter === 'broadcast') return item.isBroadcast;
                                    if (historyFilter === 'direct') return !item.isBroadcast;
                                    return true;
                                }).length === 0 ? (
                                    <div className="text-center py-12 rounded-xl bg-[#FAF6F0] border border-dashed border-[#EDE8E0]">
                                        <IoNotificationsOutline size={32} className="mx-auto text-stone-400 mb-2 opacity-60" />
                                        <p className="text-xs font-bold text-stone-700">No notifications found</p>
                                        <p className="text-[11px] text-stone-400 mt-0.5">
                                            {historyFilter === 'all'
                                                ? 'Send your first broadcast announcement using the form above.'
                                                : `No ${historyFilter} notifications sent yet.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {history.filter(item => {
                                            if (historyFilter === 'broadcast') return item.isBroadcast;
                                            if (historyFilter === 'direct') return !item.isBroadcast;
                                            return true;
                                        }).map((item) => (
                                            <div
                                                key={item._id}
                                                className="relative bg-white rounded-2xl border border-[#EDE8E0] hover:border-orange-300 p-4 transition-all shadow-[0_2px_10px_rgba(180,120,60,0.04)] overflow-hidden group"
                                            >
                                                {/* Top 3px accent bar */}
                                                <div
                                                    className={`h-[3px] absolute top-0 left-0 right-0 ${
                                                        item.isBroadcast
                                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                                                            : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                                                    }`}
                                                />

                                                {/* Top Row: Tag, Recipient Info, Timestamp, Delete */}
                                                <div className="flex items-start justify-between gap-3 mb-2 pt-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {item.isBroadcast ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold">
                                                                <IoMegaphoneOutline size={12} />
                                                                <span>All Students</span>
                                                                {item.recipientCount > 1 && (
                                                                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-orange-200/70 text-orange-900 text-[10px]">
                                                                        {item.recipientCount} sent
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-bold">
                                                                <IoPersonOutline size={12} />
                                                                <span>
                                                                    {item.recipient?.name || 'Direct Student'}
                                                                    {item.recipient?.rollNumber ? ` (${item.recipient.rollNumber})` : ''}
                                                                </span>
                                                            </span>
                                                        )}

                                                        {item.recipient?.email && (
                                                            <span className="text-[11px] text-stone-400 font-medium">
                                                                {item.recipient.email}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[11px] text-stone-400 font-medium">
                                                            {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })} · {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteNotification(item)}
                                                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                                            title="Delete this notification record"
                                                        >
                                                            <IoTrashOutline size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-extrabold text-sm text-[#0F172A] tracking-tight">
                                                    {item.title}
                                                </h3>

                                                {/* Message Box */}
                                                <div className="mt-2 p-3 bg-[#FAF6F0] rounded-xl border border-[#EDE8E0] text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                                                    {item.message}
                                                </div>

                                                {/* Footer / Metadata */}
                                                <div className="mt-2.5 flex items-center justify-between text-[10px] text-stone-400 font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <IoCheckmarkCircleOutline size={13} className="text-emerald-500" />
                                                        <span>Delivered to {item.isBroadcast ? `${item.recipientCount || 'all'} students` : 'student dashboard'}</span>
                                                    </span>
                                                    {item.createdBy?.name && (
                                                        <span>Sent by {item.createdBy.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="updates"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {updates.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-[#EDE8E0] shadow-xs">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-500">
                                        <IoMegaphoneOutline size={28} />
                                    </div>
                                    <h3 className="text-stone-800 font-bold text-base mb-1">No Updates Set</h3>
                                    <p className="text-stone-400 text-xs max-w-sm mx-auto">Create a dashboard ticker update that students can see scrolling at the top of their dashboard.</p>
                                </div>
                            ) : (
                                updates.map((update) => (
                                    <motion.div
                                        key={update._id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-[#EDE8E0] rounded-2xl p-5 shadow-xs hover:border-orange-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2.5 flex-1 min-w-0">
                                            {/* Header row in update card */}
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    update.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-stone-100 text-stone-500 border border-[#EDE8E0]'
                                                }`}>
                                                    {update.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs text-stone-400 font-medium">
                                                    Created: {new Date(update.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* English & Hindi Marquees */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 bg-orange-50 border border-orange-200/50 px-1.5 py-0.5 rounded shrink-0 select-none">EN</span>
                                                    <p className="text-sm font-bold text-stone-800 truncate" title={update.tickerEn}>{update.tickerEn}</p>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded shrink-0 select-none">HI</span>
                                                    <p className="text-sm font-medium text-stone-700 truncate" title={update.tickerHi}>{update.tickerHi}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 self-end md:self-auto">
                                            <button
                                                onClick={() => handleToggleActive(update._id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                    update.isActive
                                                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                                }`}
                                            >
                                                {update.isActive ? 'Deactivate' : 'Activate'}
                                            </button>

                                            <button
                                                onClick={() => startEditUpdate(update)}
                                                className="p-2 bg-[#FAF6F0] hover:bg-orange-50 border border-[#EDE8E0] text-stone-600 hover:text-orange-600 rounded-xl transition-all cursor-pointer"
                                                title="Edit Update"
                                            >
                                                <IoCreateOutline size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteUpdate(update._id)}
                                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 hover:text-rose-700 rounded-xl transition-all cursor-pointer"
                                                title="Delete Update"
                                            >
                                                <IoTrashOutline size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create/Edit Update Dialog */}
            <AnimatePresence>
                {showUpdateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUpdateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-[#EDE8E0]"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-[#EDE8E0] bg-[#FAF6F0] flex justify-between items-center">
                                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                                        <IoMegaphoneOutline size={16} />
                                    </div>
                                    {editingUpdate ? 'Edit Dashboard Update' : 'Create Dashboard Update'}
                                </h3>
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                                >
                                    <IoClose size={18} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* English Ticker */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Ticker Marquee (English)</label>
                                        <input
                                            type="text"
                                            value={updateForm.tickerEn}
                                            onChange={e => setUpdateForm({ ...updateForm, tickerEn: e.target.value })}
                                            placeholder="Scrolling English news ticker message"
                                            required
                                            className={INPUT}
                                        />
                                    </div>

                                    {/* Hindi Ticker */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Ticker Marquee (Hindi)</label>
                                        <input
                                            type="text"
                                            value={updateForm.tickerHi}
                                            onChange={e => setUpdateForm({ ...updateForm, tickerHi: e.target.value })}
                                            placeholder="स्क्रॉलिंग हिंदी समाचार टिकर संदेश"
                                            required
                                            className={INPUT}
                                        />
                                    </div>

                                    {/* English Title */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Modal Title (English)</label>
                                        <input
                                            type="text"
                                            value={updateForm.titleEn}
                                            onChange={e => setUpdateForm({ ...updateForm, titleEn: e.target.value })}
                                            placeholder="Title shown inside details modal"
                                            required
                                            className={INPUT}
                                        />
                                    </div>

                                    {/* Hindi Title */}
                                    <div>
                                        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Modal Title (Hindi)</label>
                                        <input
                                            type="text"
                                            value={updateForm.titleHi}
                                            onChange={e => setUpdateForm({ ...updateForm, titleHi: e.target.value })}
                                            placeholder="विवरण पॉपअप शीर्षक"
                                            required
                                            className={INPUT}
                                        />
                                    </div>
                                </div>

                                {/* English Content */}
                                <div>
                                    <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Modal Detailed Description (English)</label>
                                    <textarea
                                        value={updateForm.contentEn}
                                        onChange={e => setUpdateForm({ ...updateForm, contentEn: e.target.value })}
                                        placeholder="Enter full details of the notice in English..."
                                        required
                                        rows={4}
                                        className={TEXTAREA}
                                    />
                                </div>

                                {/* Hindi Content */}
                                <div>
                                    <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1 font-bold">Modal Detailed Description (Hindi)</label>
                                    <textarea
                                        value={updateForm.contentHi}
                                        onChange={e => setUpdateForm({ ...updateForm, contentHi: e.target.value })}
                                        placeholder="विवरण पॉपअप का हिंदी विस्तृत विवरण दर्ज करें..."
                                        required
                                        rows={4}
                                        className={TEXTAREA}
                                    />
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center justify-between p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#EDE8E0]">
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">Set Update as Active</p>
                                        <p className="text-xs text-stone-400 font-medium">Only active updates appear on the student dashboard ticker.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUpdateForm({ ...updateForm, isActive: !updateForm.isActive })}
                                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                            updateForm.isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500 justify-end' : 'bg-stone-300 justify-start'
                                        }`}
                                    >
                                        <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md" />
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="pt-3 border-t border-[#EDE8E0] flex justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="px-5 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <IoSend size={14} />
                                        {editingUpdate ? 'Save Changes' : 'Create Update'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationManagement;
