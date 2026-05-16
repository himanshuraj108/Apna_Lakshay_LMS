import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFan } from 'react-icons/fa';
import { IoSnowOutline } from 'react-icons/io5';
import api from '../../utils/api';

const POSITIONS = ['north', 'south', 'east', 'west'];
const POS_LABEL = { north: 'Top', south: 'Bottom', east: 'Right', west: 'Left' };

const RoomLayoutModal = ({ isOpen, onClose, room, onSuccess }) => {
    const [layoutData, setLayoutData] = useState({ width: 4, height: 4, doorPosition: 'south' });
    const [roomData, setRoomData] = useState({ name: '', roomId: '', hasAc: false, acPosition: 'north', hasFan: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (room) {
            setLayoutData({
                width: room.dimensions?.width ?? 4,
                height: room.dimensions?.height ?? 4,
                doorPosition: room.doorPosition || 'south',
            });
            setRoomData({
                name: room.name || '',
                roomId: room.roomId || '',
                hasAc: room.hasAc || false,
                acPosition: room.acPosition || 'north',
                hasFan: room.hasFan || false,
            });
        }
    }, [room]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // 1. Update layout (dimensions, door, fan)
            await api.put(`/admin/rooms/${room._id}/layout`, {
                ...layoutData,
                hasFan: roomData.hasFan,
            });
            // 2. Update room meta (name, AC)
            await api.put(`/admin/rooms/${room._id}`, roomData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating room:', err);
            setError(err.response?.data?.message || 'Failed to update room');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !room) return null;

    const INPUT = 'w-full px-4 py-2.5 bg-white shadow-sm border border-gray-200 text-gray-900 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-blue-500/60 outline-none transition-all';
    const LABEL = 'block text-[11px] text-gray-500 uppercase tracking-wider mb-1.5';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header accent */}
                    <div className="h-px w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

                    <div className="p-6">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-0.5">Configure Room</p>
                                <h2 className="text-xl font-black text-gray-900">{room.name}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Room Name */}
                            <div>
                                <label className={LABEL}>Room Name</label>
                                <input
                                    type="text"
                                    value={roomData.name}
                                    onChange={e => setRoomData({ ...roomData, name: e.target.value })}
                                    className={INPUT}
                                    placeholder="e.g. Study Hall A"
                                    required
                                />
                            </div>

                            {/* Room ID */}
                            <div>
                                <label className={LABEL}>Room ID (shown on ID card)</label>
                                <input
                                    type="text"
                                    value={roomData.roomId}
                                    onChange={e => setRoomData({ ...roomData, roomId: e.target.value.toUpperCase() })}
                                    className={INPUT}
                                    placeholder="e.g. A, B, C1"
                                    maxLength={10}
                                />
                                <p className="text-[11px] text-gray-600 mt-1 px-1">Shown on student ID card as: <span className="font-bold text-blue-400">{roomData.roomId || 'X'} - Seat No.</span></p>
                            </div>

                            {/* Dimensions */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>Width (cols)</label>
                                    <input type="number" min="0" max="10" value={layoutData.width}
                                        onChange={e => setLayoutData({ ...layoutData, width: parseInt(e.target.value) || 0 })}
                                        className={INPUT} />
                                </div>
                                <div>
                                    <label className={LABEL}>Height (rows)</label>
                                    <input type="number" min="0" max="10" value={layoutData.height}
                                        onChange={e => setLayoutData({ ...layoutData, height: parseInt(e.target.value) || 0 })}
                                        className={INPUT} />
                                </div>
                            </div>
                            {layoutData.width === 0 && layoutData.height === 0 ? (
                                <p className="text-[11px] text-amber-400/80 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-1.5">
                                    ⚠ Room interior box will be hidden (no center area shown)
                                </p>
                            ) : (
                                <p className="text-[11px] text-gray-600 px-1">
                                    Set both to 0 to hide the interior center area
                                </p>
                            )}

                            {/* Door */}
                            <div>
                                <label className={LABEL}>Door Position</label>
                                <select value={layoutData.doorPosition}
                                    onChange={e => setLayoutData({ ...layoutData, doorPosition: e.target.value })}
                                    className={INPUT}>
                                    {POSITIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} ({POS_LABEL[p]})</option>)}
                                </select>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100" />

                            {/* AC Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${roomData.hasAc ? 'bg-cyan-500/20' : 'bg-gray-50'} transition-colors`}>
                                            <IoSnowOutline size={14} className={roomData.hasAc ? 'text-cyan-400' : 'text-gray-500'} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Air Conditioning</p>
                                            <p className="text-[10px] text-gray-500">Toggle AC for this room</p>
                                        </div>
                                    </div>
                                    {/* Toggle switch */}
                                    <button type="button"
                                        onClick={() => setRoomData({ ...roomData, hasAc: !roomData.hasAc })}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${roomData.hasAc ? 'bg-cyan-500' : 'bg-gray-200 border border-gray-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${roomData.hasAc ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {/* AC Position */}
                                <AnimatePresence>
                                    {roomData.hasAc && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden">
                                            <label className={LABEL}>AC Unit Position</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {POSITIONS.map(p => (
                                                    <button key={p} type="button"
                                                        onClick={() => setRoomData({ ...roomData, acPosition: p })}
                                                        className={`py-2 rounded-xl text-xs font-bold transition-all ${roomData.acPosition === p
                                                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                                                            : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-white/8'}`}>
                                                        {POS_LABEL[p]}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-2 px-3 py-2 bg-cyan-500/8 border border-cyan-500/15 rounded-lg">
                                                <p className="text-[11px] text-cyan-400/80">❄️ AC unit placed on <span className="font-bold capitalize">{roomData.acPosition}</span> wall. Cool air flows inward.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Fan Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${roomData.hasFan ? 'bg-amber-500/20' : 'bg-gray-50'} transition-colors`}>
                                            <motion.div
                                                animate={roomData.hasFan ? { rotate: 360 } : { rotate: 0 }}
                                                transition={{ repeat: roomData.hasFan ? Infinity : 0, duration: 1.2, ease: 'linear' }}
                                            >
                                                <FaFan size={14} className={roomData.hasFan ? 'text-amber-400' : 'text-gray-500'} />
                                            </motion.div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Ceiling Fan</p>
                                            <p className="text-[10px] text-gray-500">Toggle fan overlay for this room</p>
                                        </div>
                                    </div>
                                    <button type="button"
                                        onClick={() => setRoomData({ ...roomData, hasFan: !roomData.hasFan })}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${roomData.hasFan ? 'bg-amber-500' : 'bg-gray-200 border border-gray-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${roomData.hasFan ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                {roomData.hasFan && (
                                    <div className="mt-2 px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                                        <p className="text-[11px] text-amber-400/80">🌀 Ceiling fan animation will show inside the room interior.</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all">
                                    {loading ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RoomLayoutModal;
