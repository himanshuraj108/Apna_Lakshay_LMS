import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import useShifts from '../../hooks/useShifts';
import api from '../../utils/api';

const EditSeatModal = ({ isOpen, onClose, seat, onSuccess }) => {
    const { shifts } = useShifts();
    const [formData, setFormData] = useState({
        seatNumber: seat?.number || '',
        basePrices: seat?.shiftPrices || seat?.basePrices || {}, // Use shiftPrices if available, fallback for legacy
        wall: seat?.position?.wall || 'north'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put(`/admin/seats/${seat._id}`, {
                number: formData.seatNumber,
                basePrices: formData.basePrices,
                shiftPrices: formData.basePrices // Ensure dynamic prices are saved
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating seat:', error);
            alert('Failed to update seat');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !seat) return null;

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
                        <h2 className="text-2xl font-bold">Edit Seat {seat.number}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Seat Number
                            </label>
                            <input
                                type="text"
                                value={formData.seatNumber}
                                onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        {/* Dynamic Shift Prices */}
                        {shifts.map(shift => (
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
                                    required
                                />
                            </div>
                        ))}

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
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Seat'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditSeatModal;
