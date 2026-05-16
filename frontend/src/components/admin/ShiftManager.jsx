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

    const INPUT = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-400';
    const LABEL = 'block text-sm font-semibold text-gray-700 mb-2';

    // Generate a gradient for each shift based on index
    const shiftGradients = [
        'from-blue-500 to-indigo-500',
        'from-green-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-purple-500 to-violet-500',
        'from-pink-500 to-rose-500',
        'from-cyan-500 to-blue-500',
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25">
                        <IoTimeOutline size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Custom Shifts</h3>
                        <p className="text-sm text-gray-500">Add, remove, or modify your shift timings</p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { setShowAddModal(true); setEditingId(null); setFormData({ name: '', startTime: '', endTime: '' }); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                >
                    <IoAdd size={18} /> Add Shift
                </motion.button>
            </div>

            {/* Shift Cards */}
            {dbLoading ? (
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : dbShifts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <div className="p-3 bg-gray-100 rounded-2xl w-fit mx-auto mb-3">
                        <IoAlertCircle className="text-gray-400" size={28} />
                    </div>
                    <p className="text-gray-700 font-semibold">No custom shifts yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click "Add Shift" to create your first shift</p>
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
                                    className="group bg-white border border-gray-200 hover:border-gray-300 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* Icon */}
                                    <div className={`shrink-0 p-3 rounded-xl bg-gradient-to-br ${grad} shadow-md`}>
                                        <IoTimeOutline size={20} className="text-white" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm">{shift.name}</p>
                                        <p className="text-gray-500 text-xs font-mono mt-0.5">
                                            {shift.startTime && shift.endTime
                                                ? `${shift.startTime} – ${shift.endTime}`
                                                : 'Standard Timing'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleViewStudents(shift._id)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold transition-all"
                                        >
                                            <IoPeople size={14} /> Students
                                        </motion.button>
                                        {allowDelete && (
                                            <>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleEditShift(shift)}
                                                    className="p-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-500 hover:text-indigo-600 rounded-xl transition-all"
                                                    title="Edit shift"
                                                >
                                                    <IoPencil size={15} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDeleteShift(shift._id)}
                                                    className="p-2 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-500 rounded-xl transition-all"
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
                accentColor="from-indigo-400 via-purple-500 to-pink-500"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreateShift} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
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
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 text-sm"
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
