import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoChatbubbles, IoTrash, IoBan, IoCheckmarkCircle, IoCloseCircle,
    IoEye, IoWarning, IoRefresh, IoArrowBack, IoSettings, IoPowerOutline,
    IoGridOutline, IoPeopleOutline
} from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ChatMonitor from '../../components/admin/ChatMonitor';
import StudentChatList from '../../components/admin/StudentChatList';

const PAGE_BG = { background: '#F8FAFC' };

const ROOM_TYPE_COLORS = {
    public: 'from-blue-500 to-cyan-500',
    group: 'from-indigo-500 to-purple-500',
    private: 'from-rose-500 to-pink-500',
};

const ChatManagement = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rooms');
    const [filter, setFilter] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showMonitor, setShowMonitor] = useState(false);
    const [isGlobalChatEnabled, setIsGlobalChatEnabled] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roomsRes, usersRes, settingsRes] = await Promise.all([
                api.get('/chat/admin/rooms'),
                api.get('/chat/admin/users?filter=active_chat_only'),
                api.get('/chat/admin/settings/chat_enabled')
            ]);
            if (roomsRes.data.success) setRooms(roomsRes.data.rooms);
            if (usersRes.data.success) setUsers(usersRes.data.students);
            if (settingsRes.data.success) setIsGlobalChatEnabled(settingsRes.data.value ?? true);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleGlobalToggle = async () => {
        const newState = !isGlobalChatEnabled;
        setIsGlobalChatEnabled(newState);
        try { await api.post('/chat/admin/global-settings', { enabled: newState }); }
        catch (e) { setIsGlobalChatEnabled(!newState); }
    };

    const handlePurgeAll = async () => {
        if (!window.confirm('DANGER: Delete ALL chat messages for everyone? This cannot be undone.')) return;
        try {
            await api.delete('/chat/admin/all-messages');
            fetchData();
        } catch (e) { alert('Failed to purge messages'); }
    };

    const handleFactoryReset = async () => {
        if (!window.confirm('⚠ FACTORY RESET: Delete ALL messages, rooms, and settings permanently?')) return;
        if (!window.confirm('Last chance — this cannot be undone.')) return;
        try { await api.delete('/chat/admin/factory-reset'); fetchData(); }
        catch (e) { alert('Factory reset failed'); }
    };

    const handleDisableRoom = async (roomId) => {
        try {
            const res = await api.patch(`/chat/admin/rooms/${roomId}/disable`);
            if (res.data.success) setRooms(prev => prev.map(r => r._id === roomId ? res.data.room : r));
        } catch (e) { console.error(e); }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Delete this room permanently?')) return;
        try {
            await api.delete(`/chat/admin/rooms/${roomId}`);
            setRooms(prev => prev.filter(r => r._id !== roomId));
            if (selectedRoom?._id === roomId) setShowMonitor(false);
        } catch (e) { console.error(e); }
    };

    const openMonitor = async (room) => {
        setSelectedRoom(room); setShowMonitor(true);
        try {
            const res = await api.get(`/chat/admin/rooms/${room._id}/messages`);
            if (res.data.success) setMessages(res.data.messages);
        } catch (e) { console.error(e); }
    };

    const filteredRooms = filter === 'all' ? rooms : rooms.filter(r => r.type === filter);

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-3xl" />
                <div className="absolute bottom-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg"><IoChatbubbles size={14} className="text-gray-900" /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Admin</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Discussion Management</h1>
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                        <IoRefresh size={16} /> Refresh
                    </motion.button>
                </motion.div>

                {/* Config Panel */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <IoSettings size={16} className="text-gray-500" />
                        <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">System Configuration</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Global toggle */}
                        <div className="flex items-center gap-3">
                            <div onClick={handleGlobalToggle}
                                className={`w-14 h-7 rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isGlobalChatEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                                <div className={`bg-white w-6 h-6 rounded-full shadow transition-transform duration-300 ${isGlobalChatEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                            </div>
                            <span className={`font-semibold text-sm ${isGlobalChatEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                {isGlobalChatEnabled ? 'Chat Enabled' : 'Chat Offline'}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-gray-100 hidden sm:block" />
                        <motion.button whileHover={{ scale: 1.04 }} onClick={handlePurgeAll}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-xl text-sm font-semibold transition-all">
                            <IoTrash size={14} /> Clear Messages Only
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.04 }} onClick={handleFactoryReset}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-xl text-sm font-semibold transition-all">
                            <IoWarning size={14} /> Factory Reset All
                        </motion.button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: 'rooms', label: 'Chat Rooms', icon: IoGridOutline },
                        { key: 'users', label: 'User Management', icon: IoPeopleOutline },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === key
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                                : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </div>

                {/* Room List */}
                {activeTab === 'rooms' && (
                    <>
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {['all', 'public', 'group', 'private'].map(t => (
                                <button key={t} onClick={() => setFilter(t)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === t
                                        ? 'bg-white/15 border border-white/20 text-gray-900'
                                        : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => <div key={i} className="bg-white/3 border border-white/8 rounded-2xl h-28 animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.map(room => (
                                    <motion.div key={room._id} whileHover={{ y: -3 }}
                                        className={`bg-white/3 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden ${room.isDisabled ? 'opacity-60' : ''}`}>
                                        <div className={`h-px w-full bg-gradient-to-r ${ROOM_TYPE_COLORS[room.type] || 'from-gray-500 to-slate-500'}`} />
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    {room.isDisabled && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold mb-1 inline-block">DISABLED</span>}
                                                    <h3 className="font-bold text-gray-900 text-sm truncate">{room.type === 'private' ? 'Private Chat' : room.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {room.type === 'private' ? room.participants?.map(p => p.name).join(', ') : `${room.participants?.length || 0} members`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => openMonitor(room)} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all" title="View"><IoEye size={15} /></button>
                                                    <button onClick={() => handleDisableRoom(room._id)} className={`p-1.5 rounded-lg transition-all ${room.isDisabled ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20'}`} title={room.isDisabled ? 'Enable' : 'Disable'}>
                                                        {room.isDisabled ? <IoCheckmarkCircle size={15} /> : <IoBan size={15} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteRoom(room._id)} className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all" title="Delete"><IoTrash size={15} /></button>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 inline-block capitalize bg-gradient-to-r ${ROOM_TYPE_COLORS[room.type] || 'from-gray-500 to-slate-500'} bg-clip-text text-transparent border border-gray-200`}>{room.type}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'users' && <StudentChatList />}

                {/* Monitor Modal */}
                <AnimatePresence>
                    {showMonitor && selectedRoom && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
                            <ChatMonitor room={selectedRoom} messages={messages} onClose={() => setShowMonitor(false)}
                                onDeleteMessage={id => setMessages(prev => prev.filter(m => m._id !== id))} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatManagement;
