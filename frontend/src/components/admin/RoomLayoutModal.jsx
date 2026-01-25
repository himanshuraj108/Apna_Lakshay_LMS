import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

const RoomLayoutModal = ({ isOpen, onClose, room, onSuccess }) => {
    const [formData, setFormData] = useState({
        width: 4,
        height: 4,
        doorPosition: 'south'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (room) {
            setFormData({
                width: room.dimensions?.width || 4,
                height: room.dimensions?.height || 4,
                doorPosition: room.doorPosition || 'south'
            });
        }
    }, [room]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put(`/admin/rooms/${room._id}/layout`, formData);

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating room layout:', error);
            alert('Failed to update room layout');
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
                        <h2 className="text-2xl font-bold">Configure {room.name} Layout</h2>
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
                                Room Width (meters)
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="10"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Room Height (meters)
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="10"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Door Position
                            </label>
                            <select
                                value={formData.doorPosition}
                                onChange={(e) => setFormData({ ...formData, doorPosition: e.target.value })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize"
                            >
                                <option value="north">North (Top)</option>
                                <option value="south">South (Bottom)</option>
                                <option value="east">East (Right)</option>
                                <option value="west">West (Left)</option>
                            </select>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-300">
                                💡 Preview: {formData.width}m x {formData.height}m room with door on <span className="capitalize font-bold">{formData.doorPosition}</span> wall
                            </p>
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
                                {loading ? 'Updating...' : 'Update Layout'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RoomLayoutModal;
