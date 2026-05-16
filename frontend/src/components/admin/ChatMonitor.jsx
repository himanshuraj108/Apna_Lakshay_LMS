
import { useState, useEffect, useRef } from 'react';
import { IoClose, IoTrash, IoTime, IoBan, IoCheckmarkCircle } from 'react-icons/io5';
import Button from '../ui/Button';
import api from '../../utils/api';

const ChatMonitor = ({ room, messages: initialMessages, onClose, onDeleteMessage }) => {
    const scrollRef = useRef();
    const [messagesState, setMessagesState] = useState(initialMessages);

    useEffect(() => {
        setMessagesState(initialMessages);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [initialMessages]);

    const handleDelete = async (msgId) => {
        try {
            await api.delete(`/chat/admin/messages/${msgId}`);
            // Update local state
            setMessagesState(prev => prev.filter(m => m._id !== msgId));
            onDeleteMessage(msgId); // Notify parent if needed, though local state handles view
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleToggleBlock = async (userId, currentStatus) => {
        try {
            const response = await api.patch(`/chat/admin/users/${userId}/block`);
            if (response.data.success) {
                // Update all messages from this user in the list to reflect new status
                setMessagesState(prev => prev.map(msg =>
                    msg.sender && msg.sender._id === userId
                        ? { ...msg, sender: { ...msg.sender, isChatBlocked: response.data.isChatBlocked } }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Block toggle error:', error);
        }
    };

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await api.post('/chat/admin/messages', {
                roomId: room._id,
                content: newMessage.trim()
            });

            if (response.data.success) {
                setNewMessage('');
                // Optimistically add to list (optional, but waiting for re-fetch is safer for consistency? 
                // Actually we get the message back, let's add it)
                setMessagesState(prev => [...prev, response.data.message]);
            }
        } catch (error) {
            console.error('Send message error:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white h-full border-l border-gray-200 shadow-2xl flex flex-col transform transition-transform duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{room.name || 'Private Chat'}</h2>
                        <p className="text-sm text-gray-600">Monitoring & Moderation</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-900">
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-500">
                    {messagesState.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">No messages found</div>
                    ) : (
                        messagesState.map(msg => (
                            <div key={msg._id} className="group flex gap-3 p-3 rounded-lg hover:bg-gray-50 relative">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                    {msg.sender?.profileImage ? (
                                        <img src={msg.sender.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-900 font-bold">
                                            {msg.sender?.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{msg.sender?.name || 'Unknown'}</span>
                                            {msg.sender?.isChatBlocked && (
                                                <span className="text-xs bg-red-500 text-white px-1 rounded">BLOCKED</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <IoTime size={12} />
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{msg.content}</p>
                                    {msg.fileUrl && (
                                        <div className="mt-2 text-sm text-blue-400 underline">
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Attachment</a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Overlay */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {msg.sender && (
                                        <button
                                            onClick={() => handleToggleBlock(msg.sender._id, msg.sender.isChatBlocked)}
                                            className={`p-2 rounded transition-colors ${msg.sender.isChatBlocked
                                                ? 'bg-green-500/80 hover:bg-green-500 text-white'
                                                : 'bg-orange-500/80 hover:bg-orange-500 text-white'
                                                }`}
                                            title={msg.sender.isChatBlocked ? "Unblock User" : "Block User"}
                                        >
                                            {msg.sender.isChatBlocked ? <IoCheckmarkCircle size={16} /> : <IoBan size={16} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(msg._id)}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors"
                                        title="Delete Message"
                                    >
                                        <IoTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Admin Message Input */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Send an official message..."
                            className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={sending}
                            className={sending ? 'opacity-50' : ''}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatMonitor;
