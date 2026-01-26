
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoChatbubbles, IoPerson, IoTrash, IoBan, IoCheckmarkCircle, IoCloseCircle, IoEye, IoWarning, IoRefresh, IoArrowBack, IoSettings } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import ChatMonitor from '../../components/admin/ChatMonitor';
import StudentChatList from '../../components/admin/StudentChatList';

const ChatManagement = () => {
    const navigate = useNavigate(); // For Back Button
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rooms'); // 'rooms', 'users'
    const [filter, setFilter] = useState('all'); // 'all', 'public', 'group', 'private'
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showMonitor, setShowMonitor] = useState(false);

    // Global Settings State
    const [isGlobalChatEnabled, setIsGlobalChatEnabled] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roomsRes, usersRes, settingsRes] = await Promise.all([
                api.get('/chat/admin/rooms'),
                api.get('/chat/admin/users?filter=active_chat_only'), // Filter active users
                api.get('/chat/admin/settings/chat_enabled') // Fetch current chat status
            ]);

            if (roomsRes.data.success) {
                setRooms(roomsRes.data.rooms);
            }
            if (usersRes.data.success) {
                setUsers(usersRes.data.students);
            }

            // Set initial chat enabled state from backend
            if (settingsRes.data.success) {
                setIsGlobalChatEnabled(settingsRes.data.value ?? true);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalToggle = async () => {
        try {
            const newState = !isGlobalChatEnabled;
            // Optimistic update
            setIsGlobalChatEnabled(newState);

            const response = await api.post('/chat/admin/global-settings', { enabled: newState });
            if (response.data.success) {
                showToast(response.data.message, 'success');
            }
        } catch (error) {
            console.error('Global toggle error:', error);
            setIsGlobalChatEnabled(!isGlobalChatEnabled); // Revert
            showToast('Failed to toggle chat', 'error');
        }
    };

    const handlePurgeAll = async () => {
        if (!window.confirm('DANGER: This will delete ALL chat history for EVERYONE. This cannot be undone. Are you sure?')) return;

        try {
            const response = await api.delete('/chat/admin/all-messages');
            if (response.data.success) {
                showToast(response.data.message, 'success');
                // Refresh data
                fetchData();
            }
        } catch (error) {
            console.error('Purge error:', error);
            showToast('Failed to purge messages', 'error');
        }
    };

    const handleDisableRoom = async (roomId) => {
        try {
            const response = await api.patch(`/chat/admin/rooms/${roomId}/disable`);
            if (response.data.success) {
                setRooms(prev => prev.map(r => r._id === roomId ? response.data.room : r));
                // Show toast
            }
        } catch (error) {
            console.error('Disable room error:', error);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Are you sure? This deletes all history permanently.')) return;
        try {
            const response = await api.delete(`/chat/admin/rooms/${roomId}`);
            if (response.data.success) {
                setRooms(prev => prev.filter(r => r._id !== roomId));
                if (selectedRoom?._id === roomId) setShowMonitor(false);
            }
        } catch (error) {
            console.error('Delete room error:', error);
        }
    };

    const handleBlockUser = async (userId) => {
        // Implementation for user blocking
        // We might need a separate endpoint to fetch users first
    };

    const openMonitor = async (room) => {
        setSelectedRoom(room);
        setShowMonitor(true);
        try {
            const response = await api.get(`/chat/admin/rooms/${room._id}/messages`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Load messages error:', error);
        }
    };

    const handleFactoryReset = async () => {
        const confirm1 = window.confirm('⚠ FACTORY RESET WARNING ⚠\n\nThis will Delete EVERYTHING:\n- All Messages\n- All Chat Rooms (Public/Group/Private)\n- All Group Settings\n\nAre you absolutely sure?');
        if (!confirm1) return;

        const confirm2 = window.confirm('Last Chance: This action cannot be undone. Type "RESET" to confirm.');
        if (!confirm2) return;

        try {
            const response = await api.delete('/chat/admin/factory-reset');
            if (response.data.success) {
                showToast(response.data.message, 'success');
                // Refresh data
                fetchData();
            }
        } catch (error) {
            console.error('Factory reset error:', error);
            showToast('Failed to factory reset', 'error');
        }
    };

    const getFilteredRooms = () => {
        if (filter === 'all') return rooms;
        return rooms.filter(room => room.type === filter);
    };

    const filteredRooms = getFilteredRooms();

    // ... (rest of filtering logic) ...

    return (
        <div className="p-6">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => navigate('/admin/dashboard')} variant="secondary" className="p-2 rounded-full">
                            <IoArrowBack size={24} />
                        </Button>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <IoChatbubbles className="text-blue-500" />
                            Discussion Management
                        </h1>
                    </div>
                    <Button onClick={fetchData} variant="secondary" className="flex items-center gap-2">
                        <IoRefresh /> Refresh
                    </Button>
                </div>

                {/* Configuration Panel */}
                <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <IoSettings className="text-gray-400" />
                            System Configuration
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={handleGlobalToggle}
                                    className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${isGlobalChatEnabled ? 'bg-green-500' : 'bg-red-500'}`}
                                >
                                    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isGlobalChatEnabled ? 'translate-x-8' : 'translate-x-0'}`}></div>
                                </div>
                                <span className={`font-semibold ${isGlobalChatEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                    {isGlobalChatEnabled ? 'Chat Enabled' : 'Chat Offline'}
                                </span>
                            </div>

                            <div className="w-px bg-gray-600 mx-2 hidden md:block"></div>

                            <Button
                                onClick={handlePurgeAll}
                                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[200px]"
                            >
                                <IoTrash className="inline mr-2" />
                                Clear Messages Only
                            </Button>

                            <Button
                                onClick={handleFactoryReset}
                                className="bg-red-900 hover:bg-red-800 text-red-100 border border-red-500/50 min-w-[200px]"
                            >
                                <IoWarning className="inline mr-2" />
                                FACTORY RESET ALL
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Main Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'rooms' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Chat Rooms
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        User Management
                    </button>
                </div>

                {/* Room List & Sub-filters */}
                {activeTab === 'rooms' && (
                    <>
                        {/* Filters */}
                        <div className="flex gap-2 mb-6">
                            {['all', 'public', 'group', 'private'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${filter === type
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRooms.map(room => (
                                <Card key={room._id} className={`relative overflow-hidden ${room.isDisabled ? 'opacity-75 grayscale' : ''}`}>
                                    {room.isDisabled && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">DISABLED</div>
                                    )}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">
                                                {room.type === 'private' ? 'Private Chat' : room.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {room.type === 'private'
                                                    ? room.participants?.map(p => p.name).join(', ')
                                                    : `${room.participants?.length || 0} members`}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openMonitor(room)}
                                                className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40"
                                                title="View Messages"
                                            >
                                                <IoEye />
                                            </button>
                                            <button
                                                onClick={() => handleDisableRoom(room._id)}
                                                className={`p-2 rounded ${room.isDisabled ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}
                                                title={room.isDisabled ? "Enable" : "Disable"}
                                            >
                                                {room.isDisabled ? <IoCheckmarkCircle /> : <IoBan />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoom(room._id)}
                                                className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"
                                                title="Delete Permanently"
                                            >
                                                <IoTrash />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}

                {/* Student List */}
                {activeTab === 'users' && <StudentChatList />}

                {/* Message Monitor Modal */}
                <AnimatePresence>
                    {showMonitor && selectedRoom && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50"
                        >
                            <ChatMonitor
                                room={selectedRoom}
                                messages={messages}
                                onClose={() => setShowMonitor(false)}
                                onDeleteMessage={(msgId) => setMessages(prev => prev.filter(m => m._id !== msgId))}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatManagement;
