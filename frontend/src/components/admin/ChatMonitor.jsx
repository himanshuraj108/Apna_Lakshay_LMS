
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[#FAF6F0] h-full border-l border-[#EDE8E0] shadow-2xl flex flex-col transform transition-transform duration-300">
                {/* Header */}
                <div className="p-4 border-b border-[#EDE8E0] flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-stone-900">{room.name || 'Private Chat'}</h2>
                        <p className="text-xs text-stone-500 font-medium">Monitoring & Moderation</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#FAF6F0] rounded-xl text-stone-400 hover:text-stone-700 transition-colors cursor-pointer">
                        <IoClose size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.06) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}>
                    {messagesState.length === 0 ? (
                        <div className="text-center text-stone-400 text-sm py-12">No messages found</div>
                    ) : (
                        messagesState.map(msg => (
                            <div key={msg._id} className="group flex gap-3 p-3.5 rounded-2xl bg-white border border-[#EDE8E0] shadow-2xs hover:border-orange-200 transition-all relative">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 overflow-hidden shrink-0 flex items-center justify-center text-orange-600 font-bold text-xs">
                                    {msg.sender?.profileImage ? (
                                        <img src={msg.sender.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{msg.sender?.name?.[0] || 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-stone-900 text-xs">{msg.sender?.name || 'Unknown'}</span>
                                            {msg.sender?.isChatBlocked && (
                                                <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-bold">BLOCKED</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-stone-400 flex items-center gap-1 font-medium">
                                            <IoTime size={11} />
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-stone-700 text-xs mt-1 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    {msg.fileUrl && (
                                        <div className="mt-2 text-xs text-orange-600 font-medium underline">
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Attachment</a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Overlay */}
                                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {msg.sender && (
                                        <button
                                            onClick={() => handleToggleBlock(msg.sender._id, msg.sender.isChatBlocked)}
                                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${msg.sender.isChatBlocked
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                                }`}
                                            title={msg.sender.isChatBlocked ? "Unblock User" : "Block User"}
                                        >
                                            {msg.sender.isChatBlocked ? <IoCheckmarkCircle size={14} /> : <IoBan size={14} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(msg._id)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Message"
                                    >
                                        <IoTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Admin Message Input */}
                <div className="p-4 border-t border-[#EDE8E0] bg-white">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Send an official message..."
                            className="flex-1 bg-white text-stone-900 text-sm border border-[#E2DBD2] rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 shadow-2xs font-medium placeholder:text-stone-400"
                        />
                        <button
                            type="submit"
                            disabled={sending}
                            className={`px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer ${sending ? 'opacity-50' : ''}`}
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatMonitor;
