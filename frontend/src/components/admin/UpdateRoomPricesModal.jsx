import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

const UpdateRoomPricesModal = ({ isOpen, onClose, room, onSuccess }) => {
    const [formData, setFormData] = useState({
        dayPrice: 800,
        nightPrice: 800,
        fullPrice: 1200
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);

        try {
            const response = await api.put(`/admin/rooms/${room._id}/prices`, {
                basePrices: {
                    day: formData.dayPrice,
                    night: formData.nightPrice,
                    full: formData.fullPrice
                }
            });

            if (response.data.success) {
                alert(response.data.message);
                onSuccess();
                onClose();
            } else {
                alert(response.data.message || 'Failed to update prices');
            }
        } catch (error) {
            console.error('Error updating prices:', error);
            alert(error.response?.data?.message || 'Failed to update prices. Please check the console.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !room) return null;

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
                        <div>
                            <h2 className="text-2xl font-bold">Update Room Prices</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {room.name} - {room.seats?.length || 0} seats
                            </p>
                        </div>
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
                                Morning Shift Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.dayPrice}
                                onChange={(e) => setFormData({ ...formData, dayPrice: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Evening Shift Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.nightPrice}
                                onChange={(e) => setFormData({ ...formData, nightPrice: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Full Day Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.fullPrice}
                                onChange={(e) => setFormData({ ...formData, fullPrice: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                                min="0"
                            />
                        </div>

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
                                {loading ? 'Updating...' : 'Update Prices'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UpdateRoomPricesModal;
