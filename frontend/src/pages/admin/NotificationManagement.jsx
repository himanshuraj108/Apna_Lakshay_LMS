import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoSend, IoPeopleOutline, IoPersonOutline,
    IoNotificationsOutline, IoCheckmarkCircle, IoCloseCircle,
    IoMegaphoneOutline, IoCreateOutline, IoTrashOutline, IoAdd, IoClose,
    IoCheckmarkCircleOutline, IoCloseCircleOutline
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

const PAGE_BG = { background: '#F8FAFC' };

const INPUT = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all";
const TEXTAREA = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all resize-y";

const NotificationManagement = () => {
    const backPath = useBackPath();
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'updates'
    
    // In-app notifications state
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({ title: '', message: '', sendToAll: true, recipientId: '' });
    const [sending, setSending] = useState(false);
    
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

    const handleSubmit = async (e) => {
        e.preventDefault(); setSending(true); setError(''); setSuccess('');
        try {
            await api.post('/admin/notifications', formData);
            setSuccess(formData.sendToAll ? `Announcement sent to all ${students.length} students!` : 'Notification sent successfully!');
            setFormData({ title: '', message: '', sendToAll: true, recipientId: '' });
            setTimeout(() => setSuccess(''), 5000);
        } catch (e) { setError(e.response?.data?.message || 'Failed to send'); }
        finally { setSending(false); }
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
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-6%] w-[500px] h-[500px] rounded-full bg-pink-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-6%] w-[400px] h-[400px] rounded-full bg-rose-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 mb-8 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link to={backPath}>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all shadow-sm">
                                <IoArrowBack size={16} /> <span className="hidden sm:inline">Back</span>
                            </motion.button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                                    <IoNotificationsOutline size={14} className="text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-pink-500">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Notifications & Updates</h1>
                        </div>
                    </div>

                    {activeTab === 'updates' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startCreateUpdate}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-md shadow-pink-500/25 transition-all"
                        >
                            <IoAdd size={18} />
                            Add New Update
                        </motion.button>
                    )}
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6 border border-gray-200/50 shadow-inner">
                    <button
                        onClick={() => { setActiveTab('notifications'); setError(''); setSuccess(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
                            activeTab === 'notifications'
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/20'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <IoNotificationsOutline size={16} />
                        In-App Notifications
                    </button>
                    <button
                        onClick={() => { setActiveTab('updates'); setError(''); setSuccess(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
                            activeTab === 'updates'
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/20'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <IoMegaphoneOutline size={16} />
                        Dashboard Updates Ticker
                    </button>
                </div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCheckmarkCircle size={18} className="text-green-600" />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm font-medium"><IoCloseCircle size={18} className="text-red-600" />{error}</motion.div>}
                </AnimatePresence>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                    {activeTab === 'notifications' ? (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                        >
                            <div className="h-px bg-gradient-to-r from-pink-500 to-rose-500" />
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Send To */}
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Send To</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: `All Students (${students.length})`, icon: IoPeopleOutline, val: true },
                                            { label: 'Individual Student', icon: IoPersonOutline, val: false },
                                        ].map(({ label, icon: Icon, val }) => (
                                            <button key={String(val)} type="button" onClick={() => setFormData({ ...formData, sendToAll: val, recipientId: '' })}
                                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${formData.sendToAll === val
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 border-transparent'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                <Icon size={16} /> {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Student Selector */}
                                {!formData.sendToAll && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Select Student</label>
                                        <select value={formData.recipientId} onChange={e => setFormData({ ...formData, recipientId: e.target.value })}
                                            required className={INPUT}>
                                            <option value="">Choose a student…</option>
                                            {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                        </select>
                                    </motion.div>
                                )}

                                {/* Title */}
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Title</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Library Closing Early Tomorrow" required className={INPUT} />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Message</label>
                                    <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Enter your announcement message here…" required rows={5}
                                        className={TEXTAREA} />
                                    <p className="text-xs text-gray-400 mt-1">{formData.message.length} characters</p>
                                </div>

                                {/* Preview */}
                                <AnimatePresence>
                                    {(formData.title || formData.message) && (
                                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <IoMegaphoneOutline size={14} className="text-pink-500" />
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Preview</p>
                                            </div>
                                            {formData.title && <h3 className="font-bold text-gray-900 mb-1">{formData.title}</h3>}
                                            {formData.message && <p className="text-gray-700 text-sm whitespace-pre-wrap">{formData.message}</p>}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit */}
                                <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                                    <IoSend size={16} />
                                    {sending ? 'Sending…' : formData.sendToAll ? 'Send to All Students' : 'Send Notification'}
                                </motion.button>
                                <p className="text-xs text-gray-400 text-center">Notifications appear in student dashboards in real time.</p>
                            </form>
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
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                    <IoMegaphoneOutline className="mx-auto text-gray-300 mb-3" size={48} />
                                    <h3 className="text-gray-700 font-bold text-lg mb-1">No Updates Set</h3>
                                    <p className="text-gray-400 text-sm max-w-sm mx-auto">Create a dashboard ticker update that students can see scrolling at the top of their dashboard.</p>
                                </div>
                            ) : (
                                updates.map((update) => (
                                    <motion.div
                                        key={update._id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2.5 flex-1 min-w-0">
                                            {/* Header row in update card */}
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    update.isActive
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                                                }`}>
                                                    {update.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Created: {new Date(update.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* English & Hindi Marquees */}
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[10px] uppercase font-black tracking-wider text-pink-500 shrink-0 select-none">EN</span>
                                                    <p className="text-sm font-bold text-gray-800 truncate" title={update.tickerEn}>{update.tickerEn}</p>
                                                </div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 shrink-0 select-none">HI</span>
                                                    <p className="text-sm font-medium text-gray-700 truncate" title={update.tickerHi}>{update.tickerHi}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 self-end md:self-auto">
                                            <button
                                                onClick={() => handleToggleActive(update._id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                    update.isActive
                                                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                }`}
                                            >
                                                {update.isActive ? 'Deactivate' : 'Activate'}
                                            </button>

                                            <button
                                                onClick={() => startEditUpdate(update)}
                                                className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl transition-all"
                                                title="Edit Update"
                                            >
                                                <IoCreateOutline size={16} />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteUpdate(update._id)}
                                                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all"
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
                            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-gray-100"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <IoMegaphoneOutline size={18} className="text-pink-500" />
                                    {editingUpdate ? 'Edit Dashboard Update' : 'Create Dashboard Update'}
                                </h3>
                                <button
                                    onClick={() => setShowUpdateModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* English Ticker */}
                                    <div>
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Ticker Marquee (English)</label>
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
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Ticker Marquee (Hindi)</label>
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
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Modal Title (English)</label>
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
                                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Modal Title (Hindi)</label>
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
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Modal Detailed Description (English)</label>
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
                                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Modal Detailed Description (Hindi)</label>
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
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Set Update as Active</p>
                                        <p className="text-xs text-gray-400">Only active updates appear on the student dashboard ticker.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUpdateForm({ ...updateForm, isActive: !updateForm.isActive })}
                                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                                            updateForm.isActive ? 'bg-pink-500 justify-end' : 'bg-gray-300 justify-start'
                                        }`}
                                    >
                                        <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-md" />
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowUpdateModal(false)}
                                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm rounded-xl shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5"
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
