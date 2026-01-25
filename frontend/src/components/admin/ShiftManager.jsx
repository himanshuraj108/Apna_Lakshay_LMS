import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { IoAdd, IoTrash, IoPencil, IoTimeOutline, IoAlertCircle } from 'react-icons/io5';

const ShiftManager = ({ allowDelete = true }) => {
    const { shifts, isCustom, loading, refreshShifts } = useShifts();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', startTime: '', endTime: '' });
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Filter to only show REAL custom shifts (from DB) for management
    // useShifts might return default shifts if isCustom is false, but for the Manager, 
    // we want to explicitly show DB shifts or empty state to encourage creation.
    // If we are in "Default Mode" via Settings, useShifts might force defaults. 
    // This component needs raw access to DB shifts to manage them.
    // Actually, useShifts returns what is *active*. 
    // If Settings Mode is "Default", useShifts returns Default.
    // But the Admin needs to see Custom Shifts to EDIT them even if Default Mode is active.
    // So we should fetch shifts DIRECTLY here, separate from useShifts hook which obeys global state.

    // We'll reimplement a direct fetch here to ensure we are managing the DB state.
    const [dbShifts, setDbShifts] = useState([]);
    const [dbLoading, setDbLoading] = useState(true);

    const fetchDbShifts = async () => {
        try {
            const response = await api.get('/admin/shifts');
            if (response.data.success) {
                setDbShifts(response.data.shifts);
            }
        } catch (err) {
            console.error('Failed to fetch DB shifts', err);
        } finally {
            setDbLoading(false);
        }
    };

    // Initial fetch
    useState(() => {
        fetchDbShifts();
    }, []);

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
            await fetchDbShifts(); // Refresh local list
            refreshShifts(); // Refresh global hook
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
        setFormData({
            name: shift.name,
            startTime: shift.startTime,
            endTime: shift.endTime
        });
        setShowAddModal(true);
    };

    const handleDeleteShift = async (shiftId) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) {
            return;
        }
        setProcessing(true);
        setError('');

        try {
            await api.delete(`/admin/shifts/${shiftId}`);
            await fetchDbShifts(); // Refresh local list
            refreshShifts(); // Refresh global hook
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete shift');
        } finally {
            setProcessing(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-white/5">
                <div>
                    <h3 className="font-bold text-lg text-white">Manage Custom Shifts</h3>
                    <p className="text-sm text-gray-400">Add, remove, or modify your custom shift definitions.</p>
                </div>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    <IoAdd className="inline mr-2" /> Add Shift
                </Button>
            </div>

            {dbLoading ? (
                <div className="text-center py-10 text-gray-500">Loading custom shifts...</div>
            ) : (
                <div className="grid gap-4">
                    {dbShifts.map((shift) => (
                        <Card key={shift._id} className="border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                                        <IoTimeOutline size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{shift.name}</h3>
                                        <p className="text-gray-400 font-mono text-sm">
                                            {shift.startTime && shift.endTime
                                                ? `${shift.startTime} - ${shift.endTime}`
                                                : 'Standard Timing'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {allowDelete && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white"
                                                onClick={() => handleEditShift(shift)}
                                            >
                                                <IoPencil size={20} />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                                                onClick={() => handleDeleteShift(shift._id)}
                                            >
                                                <IoTrash size={20} />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {dbShifts.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                            <IoAlertCircle className="mx-auto text-gray-500 mb-2" size={32} />
                            <p className="text-gray-300 font-medium">No custom shifts found</p>
                            <p className="text-sm text-gray-500 mt-1">Create your first shift to enable Custom Mode capabilities.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    setFormData({ name: '', startTime: '', endTime: '' });
                }}
                title={editingId ? "Edit Shift" : "Create New Shift"}
            >
                <form onSubmit={handleCreateShift} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Shift Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            placeholder="e.g. Shift 1, Afternoon Shift"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">End Time</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="secondary" onClick={() => {
                            setShowAddModal(false);
                            setEditingId(null);
                            setFormData({ name: '', startTime: '', endTime: '' });
                        }} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={processing} className="flex-1">
                            {processing ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Shift' : 'Create Shift')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ShiftManager;
