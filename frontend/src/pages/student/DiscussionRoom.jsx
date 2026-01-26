import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowBack, IoChatbubblesOutline, IoWarning, IoSend, IoAttach, IoPeople, IoPersonOutline, IoClose, IoCheckmarkDone, IoCloudDownload, IoAddCircle, IoSettings, IoEllipsisVertical, IoTrash, IoEyeOff, IoInformationCircle, IoSkull, IoLockClosed, IoBan } from 'react-icons/io5';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Toast from '../../components/ui/Toast';
import api from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import GroupCreationModal from '../../components/GroupCreationModal';
import GroupSettingsModal from '../../components/GroupSettingsModal';
import GroupInvitationPopup from '../../components/GroupInvitationPopup';

const DiscussionRoom = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const [showGuidelines, setShowGuidelines] = useState(true);
    const [activeTab, setActiveTab] = useState('public'); // 'public', 'private', 'groups'
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupModalMode, setGroupModalMode] = useState('group'); // 'group' or 'private'
    const [showGroupSettings, setShowGroupSettings] = useState(false);
    const [showPrivateMenu, setShowPrivateMenu] = useState(false);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [showInvitationPopup, setShowInvitationPopup] = useState(false);
    const [currentInvitation, setCurrentInvitation] = useState(null);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };
    const [sentInvitations, setSentInvitations] = useState([]);

    useEffect(() => {
        if (showGroupSettings && currentRoom?._id) {
            fetchSentInvitations(currentRoom._id);
        }
    }, [showGroupSettings, currentRoom]);

    const fetchSentInvitations = async (roomId) => {
        try {
            const response = await api.get(`/chat/groups/${roomId}/invitations`);
            if (response.data.success) {
                setSentInvitations(response.data.invitedUserIds);
            }
        } catch (error) {
            console.error('Fetch invitations error:', error);
        }
    };
    const [cursorPosition, setCursorPosition] = useState(0);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const messageRefs = useRef({});

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchRooms();
        fetchStudents();
        fetchGroups();
        fetchPendingInvitations();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await api.get('/chat/groups/my-groups');
            if (response.data.success) {
                setGroups(response.data.groups);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchPendingInvitations = async () => {
        try {
            const response = await api.get('/chat/invitations/pending');
            if (response.data.success) {
                setPendingInvitations(response.data.invitations);
                // Show popup for newest invitation if exists
                if (response.data.invitations.length > 0 && !showInvitationPopup) {
                    setCurrentInvitation(response.data.invitations[0]);
                    setShowInvitationPopup(true);
                }
            }
        } catch (error) {
            console.error('Error fetching invitations:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/chat/students');
            console.log('Students API response:', response.data);
            if (response.data.success) {
                setStudents(response.data.students);
                console.log('Students loaded:', response.data.students.length);
            } else {
                console.log('No students returned or success=false');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            console.error('Error response:', error.response?.data);
        }
    };

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new-message', (message) => {
            setMessages(prev => [...prev, message]);
            if (message.sender?.role === 'admin') {
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            }
        });

        socket.on('user-joined', (data) => {
            console.log(`${data.userName} joined`);
        });

        return () => {
            socket.off('new-message');
            socket.off('user-joined');
            socket.off('user-left');
        };
    }, [socket]);

    // Global Chat State
    const [isGlobalChatEnabled, setIsGlobalChatEnabled] = useState(true);

    // Initial check for global chat status
    useEffect(() => {
        const fetchChatStatus = async () => {
            try {
                const response = await api.get('/chat/settings/chat_enabled');
                if (response.data.success) {
                    setIsGlobalChatEnabled(response.data.value ?? true);
                }
            } catch (error) {
                console.error('Failed to fetch chat status:', error);
                // Default to enabled on error
            }
        };
        fetchChatStatus();
    }, []);

    // Socket listener for global status
    useEffect(() => {
        if (!socket) return;

        socket.on('global-chat-status', ({ enabled }) => {
            setIsGlobalChatEnabled(enabled);
            if (!enabled) {
                showToast('Chat has been disabled by administrator', 'error');
            } else {
                showToast('Chat is back online!', 'success');
            }
        });

        return () => {
            socket.off('global-chat-status');
        };
    }, [socket]);

    // Join public room on load
    useEffect(() => {
        if (!socket || !isConnected) return;

        // Find or create public room
        const publicRoom = rooms.find(r => r.type === 'public');
        if (publicRoom) {
            joinRoom(publicRoom._id);
        }
    }, [socket, isConnected, rooms]);

    const fetchRooms = async () => {
        try {
            const response = await api.get('/chat/rooms');
            if (response.data.success) {
                setRooms(response.data.rooms);
                // Auto-select public room
                const publicRoom = response.data.rooms.find(r => r.type === 'public');
                if (publicRoom) {
                    loadMessages(publicRoom._id);
                    setCurrentRoom(publicRoom);
                }
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = (roomId) => {
        if (!socket) return;
        socket.emit('join-room', roomId);
    };

    const loadMessages = async (roomId) => {
        try {
            const response = await api.get(`/chat/rooms/${roomId}/messages`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Only images (JPEG, PNG, GIF) and PDF files are allowed!');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB!');
            return;
        }

        setSelectedFile(file);
    };

    const uploadFile = async () => {
        if (!selectedFile) return null;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                return {
                    fileUrl: response.data.fileUrl,
                    fileName: response.data.fileName,
                    fileType: response.data.fileType
                };
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file');
            return null;
        } finally {
            setUploadingFile(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;

        setMessageInput(value);
        setCursorPosition(cursorPos);

        // Detect @ mention
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's a space after @ (means mention is complete)
            if (!textAfterAt.includes(' ')) {
                setMentionSearch(textAfterAt.toLowerCase());
                setShowMentionDropdown(true);
            } else {
                setShowMentionDropdown(false);
            }
        } else {
            setShowMentionDropdown(false);
        }
    };

    const handleMentionSelect = (student) => {
        const textBeforeCursor = messageInput.substring(0, cursorPosition);
        const textAfterCursor = messageInput.substring(cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const beforeAt = messageInput.substring(0, lastAtIndex);
            const newValue = beforeAt + `@${student.name} ` + textAfterCursor;
            setMessageInput(newValue);
            setShowMentionDropdown(false);

            // Focus back to input
            setTimeout(() => {
                if (inputRef.current) {
                    const newCursorPos = lastAtIndex + student.name.length + 2; // +2 for @ and space
                    inputRef.current.focus();
                    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }
    };

    const extractMentions = (text) => {
        const mentionRegex = /@(\w+)/g;
        const matches = text.matchAll(mentionRegex);
        const mentionedIds = [];

        for (const match of matches) {
            const name = match[1];
            const student = students.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (student) {
                mentionedIds.push(student._id);
            }
        }

        return mentionedIds;
    };

    const handleMentionClick = (mentionedName) => {
        // Remove @ symbol
        const name = mentionedName.replace('@', '');

        // Find the most recent message from this person
        const userMessages = messages.filter(msg =>
            msg.sender?.name?.toLowerCase() === name.toLowerCase()
        );

        if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            const messageElement = messageRefs.current[lastMessage._id];

            if (messageElement) {
                // Scroll to message
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Highlight briefly
                setHighlightedMessageId(lastMessage._id);
                setTimeout(() => setHighlightedMessageId(null), 2000);
            }
        }
    };

    const [isShaking, setIsShaking] = useState(false);

    const handleSwipe = (message, startX, endX) => {
        const swipeDistance = endX - startX;
        // Detect left-to-right swipe (at least 50px)
        if (swipeDistance > 50) {
            // Check for System Admin earthquake effect
            if (message.sender?.role === 'admin') {
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
                return;
            }

            setReplyToMessage(message);
            // Focus input for immediate reply
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const sendMessage = async () => {
        if (!socket || (!messageInput.trim() && !selectedFile) || !currentRoom) return;

        let fileData = null;
        if (selectedFile) {
            fileData = await uploadFile();
            if (!fileData) return; // Upload failed
        }

        // Extract mentioned user IDs
        const mentions = extractMentions(messageInput);

        const messageData = {
            roomId: currentRoom._id,
            content: messageInput.trim() || (fileData ? `Shared a ${fileData.fileType}` : ''),
            type: fileData ? fileData.fileType : 'text',
            mentions,
            replyTo: replyToMessage?._id || null
        };

        if (fileData) {
            messageData.fileUrl = fileData.fileUrl;
            messageData.fileName = fileData.fileName;
        }

        socket.emit('send-message', messageData);

        setMessageInput('');
        setSelectedFile(null);
        setShowMentionDropdown(false);
        setReplyToMessage(null); // Clear reply
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadImage = async (fileUrl, fileName) => {
        try {
            const response = await fetch(`http://localhost:5000${fileUrl}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleCreateGroup = async (groupData) => {
        try {
            if (groupModalMode === 'group') {
                const response = await api.post('/chat/groups/create', groupData);
                if (response.data.success) {
                    setGroups(prev => [response.data.group, ...prev]);
                    setShowGroupModal(false);
                    // Switch to the new group
                    setCurrentRoom(response.data.group);
                    setActiveTab('groups');
                    loadMessages(response.data.group._id);
                    joinRoom(response.data.group._id);
                }
            } else {
                // Private Invite logic
                // groupData in private mode is the studentId string passed from modal
                const response = await api.post('/chat/private/invite', {
                    recipientId: groupData,
                    message: 'I would like to chat with you.'
                });

                if (response.data.success) {
                    // Show success feedback
                    showToast('Invitation sent successfully! Chat will appear once accepted.', 'success');
                    setShowGroupModal(false);
                }
            }
        } catch (error) {
            console.error('Create group/chat error:', error);
            showToast(error.response?.data?.message || 'Failed to create group/chat', 'error');
        }
    };

    const switchToGroup = (group) => {
        console.log('Switching to group:', group);
        setCurrentRoom(group);
        setActiveTab('groups');
        loadMessages(group._id);
        joinRoom(group._id);
        console.log('Current room set to:', group.name);
    };

    const handleRenameGroup = async (newName) => {
        try {
            const response = await api.patch(`/chat/groups/${currentRoom._id}/rename`, {
                name: newName
            });
            if (response.data.success) {
                setCurrentRoom(response.data.group);
                setGroups(prev => prev.map(g => g._id === response.data.group._id ? response.data.group : g));
            }
        } catch (error) {
            console.error('Rename group error:', error);
            alert(error.response?.data?.message || 'Failed to rename group');
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const response = await api.delete(`/chat/groups/${currentRoom._id}/remove/${userId}`);
            if (response.data.success) {
                setCurrentRoom(response.data.group);
                setGroups(prev => prev.map(g => g._id === response.data.group._id ? response.data.group : g));
            }
        } catch (error) {
            console.error('Remove member error:', error);
            showToast(error.response?.data?.message || 'Failed to remove member', 'error');
        }
    };

    const handleDeleteGroup = async () => {
        try {
            const response = await api.delete(`/chat/groups/${currentRoom._id}`);
            if (response.data.success) {
                setGroups(prev => prev.filter(g => g._id !== currentRoom._id));
                setCurrentRoom(null);
                setShowGroupSettings(false);
            }
        } catch (error) {
            console.error('Delete group error:', error);
            showToast(error.response?.data?.message || 'Failed to delete group', 'error');
        }
    };

    const handleLeaveGroup = async () => {
        if (!currentRoom) return;
        if (!window.confirm('Are you sure you want to leave this group?')) return;

        try {
            const response = await api.post(`/chat/groups/${currentRoom._id}/leave`);
            if (response.data.success) {
                setGroups(prev => prev.filter(g => g._id !== currentRoom._id));
                setCurrentRoom(null);
                setShowGroupSettings(false);
            }
        } catch (error) {
            console.error('Leave group error:', error);
            showToast(error.response?.data?.message || 'Failed to leave group', 'error');
        }
    };

    const handleInviteMember = async (userId) => {
        try {
            const response = await api.post(`/chat/groups/${currentRoom._id}/invite`, {
                userId
            });
            if (response.data.success) {
                showToast('Invitation sent successfully!', 'success');
                setSentInvitations(prev => [...prev, userId]);
            }
        } catch (error) {
            console.error('Invite member error:', error);
            showToast(error.response?.data?.message || 'Failed to invite member', 'error');
        }
    };

    const handleAcceptInvitation = async (invitationId) => {
        try {
            const response = await api.post(`/chat/invitations/${invitationId}/accept`);
            if (response.data.success) {
                // Add to appropriate list
                if (response.data.group.type === 'private') {
                    setRooms(prev => [response.data.group, ...prev]);
                } else {
                    setGroups(prev => [response.data.group, ...prev]);
                }
                // Remove from pending
                setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
                // Close popup
                setShowInvitationPopup(false);
                setCurrentInvitation(null);
                // Show success message
                // Show success message
                showToast('Joined group successfully!', 'success');
            }
        } catch (error) {
            console.error('Accept invitation error:', error);
            showToast(error.response?.data?.message || 'Failed to accept invitation', 'error');
        }
    };

    const handleRejectInvitation = async (invitationId) => {
        try {
            const response = await api.post(`/chat/invitations/${invitationId}/reject`);
            if (response.data.success) {
                // Remove from pending
                setPendingInvitations(prev => prev.filter(inv => inv._id !== invitationId));
                // Close popup
                setShowInvitationPopup(false);
                setCurrentInvitation(null);
            }
        } catch (error) {
            console.error('Reject invitation error:', error);
            showToast(error.response?.data?.message || 'Failed to reject invitation', 'error');
        }
    };

    const handleDeleteForMe = async () => {
        if (!currentRoom) return;
        try {
            const response = await api.post(`/chat/rooms/${currentRoom._id}/hide`);
            if (response.data.success) {
                // Remove from local list
                setRooms(prev => prev.filter(r => r._id !== currentRoom._id));
                setCurrentRoom(null);
                showToast('Chat hidden successfully', 'success');
            }
        } catch (error) {
            console.error('Delete for me error:', error);
            showToast('Failed to delete chat', 'error');
        }
    };

    const handleDeleteEveryone = async () => {
        if (!currentRoom) return;
        if (!window.confirm('Are you sure? This will delete the chat history for both users permanently.')) return;

        try {
            const response = await api.delete(`/chat/rooms/${currentRoom._id}`);
            if (response.data.success) {
                setRooms(prev => prev.filter(r => r._id !== currentRoom._id));
                setCurrentRoom(null);
                showToast('Chat deleted for everyone', 'success');
            }
        } catch (error) {
            console.error('Delete everyone error:', error);
            showToast(error.response?.data?.message || 'Failed to delete chat', 'error');
        }
    };

    const getAvailableStudents = () => {
        if (!currentRoom || !students) return [];
        const memberIds = currentRoom.participants?.map(p => p._id) || [];
        return students.filter(s => !memberIds.includes(s._id));
    };

    // Access Control Check
    // If user is inactive, they should see "Pending Allocation" screen in dashboard, 
    // but here we specifically want to block inactive users from chat.
    // However, the issue reported is "active" users seeing this.
    // Ensure we are checking the correct property.
    if (user && user.isActive === false) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center bg-gray-900 text-white">
                <div className="max-w-md w-full text-center p-8 bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <IoBan size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Chat Access Disabled</h1>
                    <p className="text-gray-400 mb-6">
                        Discussion Room access is reserved for active members only.
                    </p>
                    <Link to="/student">
                        <Button variant="secondary" className="w-full">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 md:p-6 flex flex-col ${isShaking ? 'shake-screen' : ''}`}>
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col h-[calc(100vh-100px)]">
                {/* Header with Back Button - Hidden on mobile if chat is open */}
                <div className={`${currentRoom ? 'hidden md:flex' : 'flex'} items-center justify-between mb-4 md:mb-6`}>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/student')}
                            className="flex items-center gap-2"
                        >
                            <IoArrowBack size={20} />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-3">
                            <IoChatbubblesOutline className="text-orange-500" size={36} />
                            Discussion Room
                        </h1>
                        {isConnected && (
                            <span className="flex items-center gap-2 text-green-400 text-sm">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Connected
                            </span>
                        )}
                        {pendingInvitations.length > 0 && (
                            <button
                                onClick={() => {
                                    setCurrentInvitation(pendingInvitations[0]);
                                    setShowInvitationPopup(true);
                                }}
                                className="relative ml-4 text-orange-400 hover:text-orange-300 transition-colors"
                                title="Group invitations"
                            >
                                <IoPeople size={24} />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {pendingInvitations.length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Guidelines Banner */}
                <AnimatePresence>
                    {showGuidelines && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6 mb-6 relative"
                        >

                            <div className="flex items-start gap-4">
                                <div className="bg-orange-500/20 p-3 rounded-full">
                                    <IoWarning className="text-orange-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <IoInformationCircle className="text-blue-400" />
                                        Study Discussion Guidelines
                                    </h2>
                                    <div className="space-y-4 text-gray-300">
                                        <p>Welcome to the Study Discussion Room! This is a professional space for learning and collaboration. Please follow these guidelines:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Be Respectful:</strong> Treat everyone with courtesy. No harassment, hate speech, or bullying.</li>
                                            <li><strong>Stay on Topic:</strong> Keep discussions relevant to course materials, assignments, and study topics.</li>
                                            <li><strong>No Spam:</strong> Avoid repetitive messages or promotional content.</li>
                                            <li><strong>Privacy First:</strong> Do not share personal contact information like phone numbers or addresses.</li>
                                            <li><strong>Help Others:</strong> Constructive feedback and helping peers is encouraged.</li>
                                        </ul>
                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-4">
                                            <p className="text-sm text-blue-300">
                                                <strong>Note:</strong> Admins monitor this chat. Violations may result in suspension of chat privileges.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <Button onClick={() => setShowGuidelines(false)}>
                                            I Understand
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                    }
                </AnimatePresence >

                {/* Tab Switcher */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === 'public' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setActiveTab('public');
                                const publicRoom = rooms.find(r => r.type === 'public');
                                if (publicRoom) {
                                    setCurrentRoom(publicRoom);
                                    loadMessages(publicRoom._id);
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <IoPeople size={20} />
                            Public Chat
                        </Button>
                        <Button
                            variant={activeTab === 'groups' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setActiveTab('groups');
                                setCurrentRoom(null); // Clear room to show group list
                            }}
                            className="flex items-center gap-2"
                        >
                            <IoPeople size={20} />
                            Groups ({groups.length})
                        </Button>
                        <Button
                            variant={activeTab === 'private' ? 'primary' : 'secondary'}
                            onClick={() => {
                                setActiveTab('private');
                                setCurrentRoom(null);
                            }}
                            className="flex items-center gap-2"
                        >
                            <IoPersonOutline size={20} />
                            Private
                        </Button>
                    </div>

                    {
                        activeTab === 'groups' && (
                            <Button
                                variant="primary"
                                onClick={() => setShowGroupModal(true)}
                                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500"
                            >
                                <IoAddCircle size={20} />
                                Create Group
                            </Button>
                        )
                    }
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                    {/* Sidebar - Groups/Chat List */}
                    <div className={`w-full lg:w-80 flex flex-col gap-6 ${currentRoom ? 'hidden lg:flex' : 'flex'}`}>
                        {/* Groups List (when on groups tab and no group selected) */}
                        {
                            activeTab === 'groups' && !currentRoom && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mb-6 overflow-y-auto flex-1">
                                    {groups.length === 0 ? (
                                        <Card className="col-span-full text-center py-20">
                                            <IoPeople size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-400 mb-4">You haven't joined any groups yet</p>
                                            <Button
                                                variant="primary"
                                                onClick={() => setShowGroupModal(true)}
                                                className="bg-gradient-to-r from-orange-500 to-red-500"
                                            >
                                                <IoAddCircle size={20} className="inline mr-2" />
                                                Create Your First Group
                                            </Button>
                                        </Card>
                                    ) : (
                                        groups.map(group => (
                                            <Card
                                                key={group._id}
                                                className="cursor-pointer hover:border-orange-500/50 transition-all"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    console.log('Card clicked, group:', group);
                                                    switchToGroup(group);
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {group.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{group.name}</h3>
                                                            <p className="text-sm text-gray-400">{group.participants?.length || 0} members</p>
                                                        </div>
                                                    </div>
                                                    {group.creator._id === user?.id && (
                                                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">Admin</span>
                                                    )}
                                                </div>
                                                {group.description && (
                                                    <p className="text-sm text-gray-400 mb-2">{group.description}</p>
                                                )}
                                            </Card>
                                        ))
                                    )}
                                </div>
                            )
                        }

                        {/* Private Chat List */}
                        {
                            activeTab === 'private' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    <div className="mb-4">
                                        <Button
                                            onClick={() => {
                                                setGroupModalMode('private');
                                                setShowGroupModal(true);
                                            }}
                                            className="w-full justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-500/20 border border-indigo-400/30 py-8 rounded-2xl group transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="flex flex-col items-center gap-3 relative z-10">
                                                <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-lg backdrop-blur-sm">
                                                    <IoAddCircle size={32} className="text-white drop-shadow-md" />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-lg tracking-wider uppercase text-white/90 group-hover:text-white">Start New Chat</span>
                                                    <span className="text-xs text-indigo-200 group-hover:text-white/80 font-medium mt-1">Direct Message a Student</span>
                                                </div>
                                            </div>
                                        </Button>
                                    </div>
                                    {rooms.filter(r => r.type === 'private').length === 0 ? (
                                        <div className="text-center py-10">
                                            <IoPersonOutline size={32} className="mx-auto mb-2 opacity-30 text-gray-400" />
                                            <p className="text-gray-500 text-sm">No private chats yet</p>
                                        </div>
                                    ) : (
                                        rooms.filter(r => r.type === 'private').map(room => {
                                            const otherUser = room.participants.find(p => p._id !== user.id);
                                            return (
                                                <div
                                                    key={room._id}
                                                    onClick={() => {
                                                        if (room.isActive) {
                                                            setCurrentRoom(room);
                                                            loadMessages(room._id);
                                                            joinRoom(room._id);
                                                        } else {
                                                            // Check if I have a pending invitation for this room
                                                            const invite = pendingInvitations.find(inv => (inv.group._id || inv.group) === room._id);

                                                            if (invite) {
                                                                // Open invitation popup
                                                                setCurrentInvitation(invite);
                                                                setShowInvitationPopup(true);
                                                            } else {
                                                                showToast('Waiting for the other user to accept your request.', 'info');
                                                            }
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl cursor-pointer transition-all ${currentRoom?._id === room._id
                                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg border border-white/20'
                                                        : 'bg-white/5 hover:bg-white/10 border border-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border border-white/10 bg-gray-700">
                                                            {otherUser?.profileImage ? (
                                                                <img
                                                                    src={otherUser.profileImage.startsWith('http') ? otherUser.profileImage : `http://localhost:5000${otherUser.profileImage}`}
                                                                    alt={otherUser.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                                                    {otherUser?.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white">{otherUser?.name || 'Unknown User'}</h3>
                                                            {/* Seat Info */}
                                                            {(() => {
                                                                const studentInfo = students?.find(s => s._id === otherUser?._id);
                                                                if (studentInfo?.seatInfo) {
                                                                    return <p className="text-xs text-white/80">{studentInfo.seatInfo.number} | {studentInfo.seatInfo.shift}</p>;
                                                                }
                                                                return <p className="text-xs text-gray-400">{room.isActive ? 'Private Chat' : 'Request Pending'}</p>;
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                    </div>
                    {/* Main Chat Container */}
                    {
                        (activeTab === 'public' || ((activeTab === 'groups' || activeTab === 'private') && currentRoom)) && (
                            <div className={`flex-1 flex flex-col h-full absolute inset-0 md:relative md:inset-auto z-20 bg-gray-900 md:bg-transparent ${!currentRoom && 'hidden md:flex'}`}>
                                <Card className="flex flex-col h-full border-none md:border md:border-white/10 rounded-none md:rounded-2xl">
                                    {/* Chat Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            {/* Mobile Back Button */}
                                            <button
                                                onClick={() => setCurrentRoom(null)}
                                                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <IoArrowBack size={24} />
                                            </button>
                                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-full">
                                                <IoPeople size={24} className="text-white" />
                                            </div>
                                            <div
                                                onClick={() => currentRoom?.type === 'group' && setShowGroupSettings(true)}
                                                className={currentRoom?.type === 'group' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                                            >
                                                <h3 className="font-bold text-lg">
                                                    {currentRoom?.type === 'group'
                                                        ? currentRoom.name
                                                        : currentRoom?.type === 'private'
                                                            ? (currentRoom.participants.find(p => p._id !== user.id)?.name || 'Private Chat')
                                                            : 'Public Study Chat'}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    {currentRoom?.type === 'group'
                                                        ? `${currentRoom.participants?.length || 0} members (click to view)`
                                                        : currentRoom?.type === 'private'
                                                            ? 'Private Conversation'
                                                            : 'All students'}
                                                </p>
                                            </div>
                                        </div>
                                        {currentRoom?.type === 'group' && (
                                            <Button
                                                variant="secondary"
                                                onClick={() => setCurrentRoom(null)}
                                                className="text-sm"
                                            >
                                                <IoArrowBack size={16} className="inline mr-1" />
                                                Back to Groups
                                            </Button>
                                        )}
                                        {currentRoom?.type === 'private' && (
                                            <Button
                                                variant="secondary"
                                                onClick={() => setCurrentRoom(null)}
                                                className="text-sm"
                                            >
                                                <IoArrowBack size={16} className="inline mr-1" />
                                                Back
                                            </Button>
                                        )}
                                        {currentRoom?.type === 'private' && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowPrivateMenu(!showPrivateMenu)}
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                                >
                                                    <IoEllipsisVertical size={20} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {showPrivateMenu && (
                                                    <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                                        <button
                                                            onClick={handleDeleteForMe}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors text-gray-300"
                                                        >
                                                            <IoEyeOff size={16} />
                                                            Delete for Me
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteEveryone}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-500/20 text-red-400 transition-colors"
                                                        >
                                                            <IoTrash size={16} />
                                                            Delete for Everyone
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowPrivateMenu(false)}>
                                        {messages.length === 0 ? (
                                            <div className="text-center py-20 text-gray-400">
                                                <IoChatbubblesOutline size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isOwnMessage = msg.sender?._id === user?.id;

                                                return (
                                                    <motion.div
                                                        key={msg._id}
                                                        ref={el => messageRefs.current[msg._id] = el}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''} transition-all duration-300 ${highlightedMessageId === msg._id ? 'bg-yellow-500/10 rounded-lg p-2 -m-2' : ''
                                                            }`}
                                                        onMouseDown={(e) => {
                                                            msg.touchStartX = e.clientX;
                                                        }}
                                                        onMouseUp={(e) => {
                                                            if (msg.touchStartX) {
                                                                handleSwipe(msg, msg.touchStartX, e.clientX);
                                                            }
                                                        }}
                                                        onTouchStart={(e) => {
                                                            msg.touchStartX = e.touches[0].clientX;
                                                        }}
                                                        onTouchEnd={(e) => {
                                                            if (msg.touchStartX) {
                                                                handleSwipe(msg, msg.touchStartX, e.changedTouches[0].clientX);
                                                            }
                                                        }}
                                                    >
                                                        {/* Profile Image Placeholder */}
                                                        <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border ${msg.sender?.role === 'admin' ? 'border-red-500 bg-black shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/10 bg-gray-700'}`}>
                                                            {msg.sender?.role === 'admin' ? (
                                                                <div className="w-full h-full flex items-center justify-center text-red-500 animate-pulse">
                                                                    <IoSkull size={24} />
                                                                </div>
                                                            ) : msg.sender?.profileImage ? (
                                                                <img
                                                                    src={msg.sender.profileImage.startsWith('http') ? msg.sender.profileImage : `http://localhost:5000${msg.sender.profileImage}`}
                                                                    alt={msg.sender.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                                    {msg.sender?.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`flex-1 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                                                            <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                                                <span className="font-semibold text-sm">{msg.sender?.name || 'Unknown'}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div className={`rounded-lg px-4 py-2 border max-w-[70%] ${isOwnMessage
                                                                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30'
                                                                : msg.sender?.role === 'admin'
                                                                    ? 'bg-gradient-to-br from-red-900/90 to-black border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                                                    : 'bg-white/5 border-white/10'
                                                                }`}>
                                                                {/* Reply indicator */}
                                                                {msg.replyTo && (
                                                                    <div className={`mb-2 pb-2 border-b ${msg.sender?.role === 'admin' ? 'border-red-500/30' : 'border-white/10'}`}>
                                                                        <div className={`text-xs italic border-l-2 pl-2 ${msg.sender?.role === 'admin' ? 'text-red-400 border-red-500' : 'text-gray-400 border-blue-400'}`}>
                                                                            <div className="font-semibold">Reply to: {msg.replyTo.sender?.name || 'Unknown'}</div>
                                                                            <div className="text-gray-500 truncate mt-0.5">{msg.replyTo.content || 'Message'}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <p className={`whitespace-pre-wrap break-words ${msg.sender?.role === 'admin' ? 'text-red-100 font-bold tracking-wider drop-shadow-md font-mono text-lg uppercase' : 'text-gray-200'}`}>
                                                                    {msg.content.split(/(@\w+)/g).map((part, i) =>
                                                                        part.startsWith('@') ? (
                                                                            <span key={i} className={`font-semibold px-1 rounded ${msg.sender?.role === 'admin' ? 'text-white bg-red-600' : 'text-blue-400 bg-blue-500/10'}`}>
                                                                                {part}
                                                                            </span>
                                                                        ) : (
                                                                            <span key={i}>{part}</span>
                                                                        )
                                                                    )}
                                                                </p>
                                                                {msg.type === 'image' && msg.fileUrl && (
                                                                    <div className="relative mt-2 group inline-block">
                                                                        <img
                                                                            src={`http://localhost:5000${msg.fileUrl}`}
                                                                            alt={msg.fileName || 'Image'}
                                                                            className="max-w-md rounded-lg border border-white/20"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDownloadImage(msg.fileUrl, msg.fileName)}
                                                                            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            title="Download image"
                                                                        >
                                                                            <IoCloudDownload size={20} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {msg.type === 'pdf' && msg.fileUrl && (
                                                                    <a
                                                                        href={`http://localhost:5000${msg.fileUrl}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="mt-2 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                                    >
                                                                        <IoAttach size={16} />
                                                                        {msg.fileName || 'Download PDF'}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-white/10 relative">
                                        {/* Mention Autocomplete Dropdown */}
                                        <AnimatePresence>
                                            {showMentionDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50"
                                                >
                                                    {(() => {
                                                        // Get unique students from messages (left-side students)
                                                        const activeStudents = messages
                                                            .filter(msg => msg.sender?._id !== user?.id) // Exclude yourself
                                                            .reduce((acc, msg) => {
                                                                if (msg.sender && !acc.find(s => s._id === msg.sender._id)) {
                                                                    acc.push({
                                                                        _id: msg.sender._id,
                                                                        name: msg.sender.name,
                                                                        profileImage: msg.sender.profileImage
                                                                    });
                                                                }
                                                                return acc;
                                                            }, [])
                                                            .filter(s => s.name.toLowerCase().includes(mentionSearch));

                                                        return activeStudents.length > 0 ? (
                                                            activeStudents.map((student) => {
                                                                const fullStudentInfo = students?.find(s => s._id === student._id);
                                                                const seatDisplay = fullStudentInfo?.seatInfo
                                                                    ? `${fullStudentInfo.seatInfo.number} | ${fullStudentInfo.seatInfo.shift}`
                                                                    : fullStudentInfo?.studentId ? `ID: ${fullStudentInfo.studentId}` : '';

                                                                return (
                                                                    <div
                                                                        key={student._id}
                                                                        onClick={() => handleMentionSelect(student)}
                                                                        className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-white/10 bg-gray-700">
                                                                            {student.profileImage ? (
                                                                                <img
                                                                                    src={student.profileImage.startsWith('http') ? student.profileImage : `http://localhost:5000${student.profileImage}`}
                                                                                    alt={student.name}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                                                    {student.name.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-white font-medium">{student.name}</span>
                                                                            {seatDisplay && (
                                                                                <span className="text-xs text-gray-400">{seatDisplay}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="px-4 py-3 text-gray-400 text-sm">
                                                                No active students to mention
                                                            </div>
                                                        );
                                                    })()}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Reply Preview */}
                                        {replyToMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 border-l-2 border-blue-400 pl-3">
                                                        <div className="text-xs font-semibold text-blue-400">
                                                            Replying to {replyToMessage.sender?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-300 truncate mt-1">
                                                            {replyToMessage.content}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setReplyToMessage(null)}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        <IoClose size={20} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* File Preview */}
                                        {selectedFile && (
                                            <div className="mb-3 bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <IoAttach className="text-blue-400" size={20} />
                                                    <span className="text-sm text-gray-300">{selectedFile.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <IoClose size={20} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Chat Disabled Warning */}
                                        {!isGlobalChatEnabled && (
                                            <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
                                                <IoBan className="text-red-500" size={20} />
                                                <span className="text-red-400 text-sm font-semibold">
                                                    Messaging is disabled by administrator
                                                </span>
                                            </div>
                                        )}

                                        {/* User Blocked Warning */}
                                        {isGlobalChatEnabled && user?.isChatBlocked && (
                                            <div className="mb-3 bg-red-600/20 border border-red-600/50 rounded-lg p-4 flex items-center gap-3">
                                                <IoBan className="text-red-500" size={24} />
                                                <span className="text-red-300 text-sm font-semibold">
                                                    You are blocked from this chat due to unacceptable behaviour
                                                </span>
                                            </div>
                                        )}

                                        {/* Room Disabled Warning */}
                                        {isGlobalChatEnabled && !user?.isChatBlocked && currentRoom?.isDisabled && (
                                            <div className="mb-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-center gap-3">
                                                <IoBan className="text-orange-500" size={20} />
                                                <span className="text-orange-400 text-sm font-semibold">
                                                    This room has been disabled by administrator
                                                </span>
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-3 border rounded-lg px-4 py-2 ${(!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled) ? 'bg-gray-800/50 border-gray-700 opacity-60' : 'bg-white/5 border-white/10'}`}>
                                            {/* File Input Hidden */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                disabled={!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled}
                                            />

                                            <input
                                                type="text"
                                                ref={inputRef}
                                                value={!isGlobalChatEnabled ? "Currently chat is disabled" : (user?.isChatBlocked ? "You are blocked from chat" : (currentRoom?.isDisabled ? "This room is disabled" : messageInput))}
                                                onChange={(!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled) ? undefined : handleInputChange}
                                                onKeyPress={(!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled) ? undefined : handleKeyPress}
                                                placeholder={isGlobalChatEnabled && !user?.isChatBlocked && !currentRoom?.isDisabled ? `Message ${currentRoom?.type === 'private' ? 'student' : currentRoom?.name}...` : ""}
                                                className="flex-1 bg-transparent border-none text-white focus:ring-0 focus:outline-none placeholder-gray-500"
                                                readOnly={!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled}
                                            />

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingFile || !isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled}
                                                    className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                                    title="Attach file"
                                                >
                                                    <IoAttach size={24} />
                                                </button>

                                                <button
                                                    onClick={(!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled) ? undefined : sendMessage}
                                                    disabled={(!messageInput.trim() && !selectedFile) || uploadingFile || !isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled}
                                                    className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {(!isGlobalChatEnabled || user?.isChatBlocked || currentRoom?.isDisabled) ? <IoLockClosed size={20} /> : <IoSend size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        {!isConnected && (
                                            <p className="text-yellow-400 text-sm mt-2">Connecting to chat server...</p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        )
                    }
                </div>

                {/* Group Creation Modal */}
                <GroupCreationModal
                    isOpen={showGroupModal}
                    onClose={() => setShowGroupModal(false)}
                    onCreateGroup={handleCreateGroup}
                    students={students}
                    mode={groupModalMode}
                />
                {/* Group Settings Modal */}
                <GroupSettingsModal
                    isOpen={showGroupSettings}
                    onClose={() => setShowGroupSettings(false)}
                    group={currentRoom}
                    currentUserId={user?.id}
                    onRemoveMember={handleRemoveMember}
                    onInviteMember={handleInviteMember}
                    onRenameGroup={handleRenameGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onLeaveGroup={handleLeaveGroup}
                    onGetAvailableStudents={getAvailableStudents}
                    allStudents={students}
                    currentUser={user}
                    sentInvitations={sentInvitations}
                />

                {/* Group Invitation Popup */}
                {
                    showInvitationPopup && currentInvitation && (
                        <GroupInvitationPopup
                            invitation={currentInvitation}
                            onAccept={handleAcceptInvitation}
                            onReject={handleRejectInvitation}
                            onClose={() => {
                                setShowInvitationPopup(false);
                                setCurrentInvitation(null);
                            }}
                        />
                    )
                }
            </div>
        </div>

    );
};

export default DiscussionRoom;
