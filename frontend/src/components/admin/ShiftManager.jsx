import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';
import Modal from '../ui/Modal';
import { IoAdd, IoTrash, IoPencil, IoTimeOutline, IoAlertCircle, IoIdCard, IoPeople } from 'react-icons/io5';

const ShiftManager = ({ allowDelete = true }) => {
    const navigate = useNavigate();
    const { refreshShifts } = useShifts();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', startTime: '', endTime: '' });
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [dbShifts, setDbShifts] = useState([]);
    const [dbLoading, setDbLoading] = useState(true);

    const handleViewStudents = (shiftId) => {
        navigate(`/admin/students?tab=id-cards&shift=${shiftId}`);
    };

    const fetchDbShifts = async () => {
        try {
            const response = await api.get('/admin/shifts');
            if (response.data.success) setDbShifts(response.data.shifts);
        } catch (err) {
            console.error('Failed to fetch DB shifts', err);
        } finally {
            setDbLoading(false);
        }
    };

    useState(() => { fetchDbShifts(); }, []);

    const handleCreateShift = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/admin/shifts/${editingId}`, formData);
            } else {
                await api.post('/admin/shifts', formData);
            }
            await fetchDbShifts();
            refreshShifts();
            setShowAddModal(false);
            setEditingId(null);
            setFormData({ name: '', startTime: '', endTime: '' });
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} shift`);
        } finally {
            setProcessing(false);
        }
    };

    const handleEditShift = (shift) => {
        setEditingId(shift._id);
        setFormData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
        setShowAddModal(true);
    };

    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;
        setProcessing(true);
        setError('');
        try {
            await api.delete(`/admin/shifts/${shiftId}`);
            await fetchDbShifts();
            refreshShifts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete shift');
        } finally {
            setProcessing(false);
        }
    };

    const INPUT = 'w-full bg-white border border-[#E2DBD2] rounded-xl px-3.5 py-2.5 text-[#0F172A] text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 outline-none transition-all placeholder-slate-400 shadow-2xs';
    const LABEL = 'block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5';

    // Generate a gradient for each shift based on index
    const shiftGradients = [
        'from-orange-500 to-amber-500',
        'from-amber-500 to-yellow-500',
        'from-stone-700 to-stone-900',
        'from-emerald-500 to-teal-500',
        'from-blue-500 to-indigo-500',
        'from-rose-500 to-pink-500',
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white border border-[#EDE8E0] p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-md shadow-orange-500/20">
                        <IoTimeOutline size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-[#0F172A]">Custom Shifts</h3>
                        <p className="text-xs text-stone-500 font-medium">Add, remove, or modify your shift timings</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowAddModal(true); setEditingId(null); setFormData({ name: '', startTime: '', endTime: '' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                    <IoAdd size={18} /> Add Shift
                </motion.button>
            </div>

            {/* Shift Cards */}
            {dbLoading ? (
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white border border-[#EDE8E0] rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : dbShifts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#EDE8E0] rounded-2xl bg-white">
                    <div className="p-3 bg-[#FAF6F0] rounded-2xl w-fit mx-auto mb-3">
                        <IoAlertCircle className="text-stone-400" size={28} />
                    </div>
                    <p className="text-stone-800 font-bold text-sm">No custom shifts yet</p>
                    <p className="text-xs text-stone-400 mt-1">Click "Add Shift" to create your first shift</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    <AnimatePresence>
                        {dbShifts.map((shift, idx) => {
                            const grad = shiftGradients[idx % shiftGradients.length];
                            return (
                                <motion.div
                                    key={shift._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-white border border-[#EDE8E0] hover:border-[#E2B08A] rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xs hover:shadow-xs transition-all"
                                >
                                    {/* Icon */}
                                    <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${grad} shadow-sm`}>
                                        <IoTimeOutline size={20} className="text-white" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[#0F172A] text-sm">{shift.name}</p>
                                        <p className="text-stone-500 text-xs font-mono mt-0.5">
                                            {shift.startTime && shift.endTime
                                                ? `${shift.startTime} – ${shift.endTime}`
                                                : 'Standard Timing'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => handleViewStudents(shift._id)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                                        >
                                            <IoPeople size={14} /> Students
                                        </motion.button>
                                        {allowDelete && (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleEditShift(shift)}
                                                    className="p-2 bg-white hover:bg-orange-50 border border-[#EDE8E0] hover:border-orange-200 text-stone-600 hover:text-orange-600 rounded-xl transition-all cursor-pointer"
                                                    title="Edit shift"
                                                >
                                                    <IoPencil size={15} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDeleteShift(shift._id)}
                                                    className="p-2 bg-white hover:bg-rose-50 border border-[#EDE8E0] hover:border-rose-200 text-stone-600 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                                                    title="Delete shift"
                                                >
                                                    <IoTrash size={15} />
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setEditingId(null); setFormData({ name: '', startTime: '', endTime: '' }); }}
                title={editingId ? 'Edit Shift' : 'Create New Shift'}
                theme="light"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreateShift} className="space-y-4">
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className={LABEL}>Shift Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={INPUT}
                            placeholder="e.g. Morning Shift, Afternoon"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL}>Start Time</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className={INPUT}
                                style={{ colorScheme: 'light' }}
                                required
                            />
                        </div>
                        <div>
                            <label className={LABEL}>End Time</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className={INPUT}
                                style={{ colorScheme: 'light' }}
                                required
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => { setShowAddModal(false); setEditingId(null); setFormData({ name: '', startTime: '', endTime: '' }); }}
                            className="flex-1 px-4 py-2.5 bg-[#FAF6F0] hover:bg-stone-100 border border-[#EDE8E0] text-stone-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 text-xs cursor-pointer"
                        >
                            {processing ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Update Shift' : 'Create Shift')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ShiftManager;
