import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';
const AddSeatModal = ({ isOpen, onClose, wall, roomId, floorId, onSuccess }) => {
    const { shifts } = useShifts();
    const [formData, setFormData] = useState({
        basePrices: {}
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/admin/seats', {
                roomId,
                floorId,
                wall,
                basePrices: formData.basePrices,
                shiftPrices: formData.basePrices // Using shiftPrices for dynamic shifts
            });

            onSuccess();
            onClose();
            setFormData({ basePrices: {} });
        } catch (error) {
            console.error('Error adding seat:', error);
            alert(error.response?.data?.message || 'Failed to add seat');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Add Seat to {wall} Wall</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {shifts.length === 0 ? (
                            <div className="text-center text-red-400 p-4 bg-red-400/10 rounded-lg">
                                No shifts found. Please create shifts in Shift Management first.
                            </div>
                        ) : (
                            shifts.map(shift => (
                                <div key={shift.id}>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        {shift.name} Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.basePrices?.[shift.id] || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            basePrices: {
                                                ...formData.basePrices,
                                                [shift.id]: parseInt(e.target.value) || 0
                                            }
                                        })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 800"
                                        required
                                    />
                                </div>
                            ))
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || shifts.length === 0}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add Seat'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddSeatModal;
