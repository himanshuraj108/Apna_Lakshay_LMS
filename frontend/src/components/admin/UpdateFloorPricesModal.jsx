import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

import useShifts from '../../hooks/useShifts';

const UpdateFloorPricesModal = ({ isOpen, onClose, floor, onSuccess }) => {
    const { shifts } = useShifts();
    const [formData, setFormData] = useState({
        basePrices: { day: 800, night: 800, full: 1200 }
    });
    const [loading, setLoading] = useState(false);

    const getTotalSeats = () => {
        if (!floor?.rooms) return 0;
        return floor.rooms.reduce((total, room) => total + (room.seats?.length || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();



        setLoading(true);

        try {
            const response = await api.put(`/admin/floors/${floor._id}/prices`, {
                basePrices: formData.basePrices,
                shiftPrices: formData.basePrices // Mirror required to persist Map-based dynamic custom shift IDs
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

    if (!isOpen || !floor) return null;

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
                    className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Update Floor Prices</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {floor.name} - {getTotalSeats()} seats in {floor.rooms?.length || 0} rooms
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Dynamic Shift Prices */}
                        {shifts.map(shift => (
                            <div key={shift.id}>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    {shift.name} Price (₹)
                                </label>
                                <input
                                    type="number"
                                    value={formData.basePrices?.[shift.id] || 800}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        basePrices: {
                                            ...formData.basePrices,
                                            [shift.id]: parseInt(e.target.value)
                                        }
                                    })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Leave blank to skip"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Full Day Price (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.basePrices?.full || 1200}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    basePrices: {
                                        ...formData.basePrices,
                                        full: parseInt(e.target.value)
                                    }
                                })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Leave blank to skip"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md"
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

export default UpdateFloorPricesModal;
