import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoSend, IoPeopleOutline, IoPersonOutline,
    IoNotificationsOutline, IoCheckmarkCircle, IoCloseCircle,
    IoMegaphoneOutline
} from 'react-icons/io5';
import useBackPath from '../../hooks/useBackPath';

const PAGE_BG = { background: '#F8FAFC' };

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all";

const NotificationManagement = () => {
    const backPath = useBackPath();
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({ title: '', message: '', sendToAll: true, recipientId: '' });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/students');
            setStudents(res.data.students.filter(s => s.isActive));
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

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-6%] w-[500px] h-[500px] rounded-full bg-pink-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-6%] w-[400px] h-[400px] rounded-full bg-rose-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8 flex-wrap">
                    <Link to={backPath}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> <span className="hidden sm:inline">Back</span>
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                                <IoNotificationsOutline size={14} className="text-gray-900" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Notifications</h1>
                    </div>
                </motion.div>

                {/* Toasts */}
                <AnimatePresence>
                    {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCheckmarkCircle size={18} />{success}</motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm"><IoCloseCircle size={18} />{error}</motion.div>}
                </AnimatePresence>

                {/* Form */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <div className="h-px bg-gradient-to-r from-pink-500 to-rose-500" />
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Send To */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Send To</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: `All Students (${students.length})`, icon: IoPeopleOutline, val: true },
                                    { label: 'Individual Student', icon: IoPersonOutline, val: false },
                                ].map(({ label, icon: Icon, val }) => (
                                    <button key={String(val)} type="button" onClick={() => setFormData({ ...formData, sendToAll: val, recipientId: '' })}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${formData.sendToAll === val
                                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                                            : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                        <Icon size={16} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Student Selector */}
                        {!formData.sendToAll && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Select Student</label>
                                <select value={formData.recipientId} onChange={e => setFormData({ ...formData, recipientId: e.target.value })}
                                    required className={INPUT} style={{ background: '#0d0d10' }}>
                                    <option value="">Choose a student…</option>
                                    {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                </select>
                            </motion.div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Title</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Library Closing Early Tomorrow" required className={INPUT} />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Message</label>
                            <textarea value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter your announcement message here…" required rows={5}
                                className={INPUT + " resize-y"} />
                            <p className="text-xs text-gray-600 mt-1">{formData.message.length} characters</p>
                        </div>

                        {/* Preview */}
                        <AnimatePresence>
                            {(formData.title || formData.message) && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <IoMegaphoneOutline size={14} className="text-pink-400" />
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Preview</p>
                                    </div>
                                    {formData.title && <h3 className="font-bold text-gray-900 mb-1">{formData.title}</h3>}
                                    {formData.message && <p className="text-gray-700 text-sm whitespace-pre-wrap">{formData.message}</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                            <IoSend size={16} />
                            {sending ? 'Sending…' : formData.sendToAll ? 'Send to All Students' : 'Send Notification'}
                        </motion.button>
                        <p className="text-xs text-gray-600 text-center">Notifications appear in student dashboards in real time.</p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default NotificationManagement;
