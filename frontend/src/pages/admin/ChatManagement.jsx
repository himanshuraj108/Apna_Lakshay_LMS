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
    public: 'from-orange-500 to-amber-500',
    group: 'from-blue-500 to-indigo-500',
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
        <div className="relative min-h-screen" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                            <IoArrowBack size={16} /> Back
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                    <IoChatbubbles size={14} />
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Admin Console</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Discussion Management</h1>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                        <IoRefresh size={16} className={loading ? 'animate-spin text-orange-500' : ''} /> Refresh
                    </button>
                </motion.div>

                {/* Config Panel */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
                    className="bg-white border border-[#EDE8E0] rounded-2xl p-5 mb-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
                            <IoSettings size={14} />
                        </div>
                        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">System Configuration</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Global toggle */}
                        <div className="flex items-center gap-3">
                            <div onClick={handleGlobalToggle}
                                className={`w-12 h-6.5 rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isGlobalChatEnabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-stone-300'}`}>
                                <div className={`bg-white w-5.5 h-5.5 rounded-full shadow transition-transform duration-300 ${isGlobalChatEnabled ? 'translate-x-5.5' : 'translate-x-0'}`} />
                            </div>
                            <span className={`font-bold text-xs uppercase tracking-wider ${isGlobalChatEnabled ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full' : 'text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full'}`}>
                                {isGlobalChatEnabled ? 'Chat Active' : 'Chat Offline'}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-stone-200 hidden sm:block" />
                        <button onClick={handlePurgeAll}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer">
                            <IoTrash size={14} /> Clear Messages Only
                        </button>
                        <button onClick={handleFactoryReset}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer">
                            <IoWarning size={14} /> Factory Reset All
                        </button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: 'rooms', label: 'Chat Rooms', icon: IoGridOutline },
                        { key: 'users', label: 'User Moderation', icon: IoPeopleOutline },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === key
                                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                                : 'bg-white border border-[#EDE8E0] text-stone-600 hover:bg-[#FAF6F0]'}`}>
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
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${filter === t
                                        ? 'bg-orange-50 border border-orange-300 text-orange-600'
                                        : 'bg-white border border-[#EDE8E0] text-stone-500 hover:bg-[#FAF6F0]'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-[#EDE8E0] rounded-2xl h-28 animate-pulse shadow-xs" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredRooms.map(room => (
                                    <motion.div key={room._id} whileHover={{ y: -2 }}
                                        className={`bg-white border border-[#EDE8E0] rounded-2xl overflow-hidden shadow-xs hover:border-orange-200 transition-all ${room.isDisabled ? 'opacity-60 bg-stone-50' : ''}`}>
                                        <div className={`h-1 w-full bg-gradient-to-r ${ROOM_TYPE_COLORS[room.type] || 'from-orange-500 to-amber-500'}`} />
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    {room.isDisabled && <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-bold mb-1.5 inline-block">DISABLED</span>}
                                                    <h3 className="font-bold text-stone-900 text-sm truncate">{room.type === 'private' ? 'Private Chat' : room.name}</h3>
                                                    <p className="text-xs text-stone-400 font-medium mt-0.5">
                                                        {room.type === 'private' ? room.participants?.map(p => p.name).join(', ') : `${room.participants?.length || 0} members`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <button onClick={() => openMonitor(room)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 rounded-xl transition-all cursor-pointer" title="View"><IoEye size={15} /></button>
                                                    <button onClick={() => handleDisableRoom(room._id)} className={`p-2 rounded-xl transition-all cursor-pointer border ${room.isDisabled ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'}`} title={room.isDisabled ? 'Enable' : 'Disable'}>
                                                        {room.isDisabled ? <IoCheckmarkCircle size={15} /> : <IoBan size={15} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteRoom(room._id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all cursor-pointer" title="Delete"><IoTrash size={15} /></button>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-3 inline-block capitalize bg-[#FAF6F0] text-stone-600 border border-[#EDE8E0]`}>{room.type}</span>
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
