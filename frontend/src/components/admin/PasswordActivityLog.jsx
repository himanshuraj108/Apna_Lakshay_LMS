import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoEye, IoEyeOff, IoTime, IoKeyOutline, IoLockClosed, IoClose } from 'react-icons/io5';
import api from '../../utils/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const PasswordActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [pendingLogId, setPendingLogId] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/admin/password-activity');
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Error fetching password logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestPasswordReveal = (logId) => {
        setPendingLogId(logId);
        setShowAuthModal(true);
        setAuthError('');
        setAdminPassword('');
    };

    const verifyAndReveal = async () => {
        try {
            // Verify admin password
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await api.post('/auth/login', {
                email: user.email,
                password: adminPassword
            });

            if (response.data.success) {
                // Password correct, show the student password
                setVisiblePasswords(prev => ({
                    ...prev,
                    [pendingLogId]: true
                }));
                setShowAuthModal(false);
                setAdminPassword('');
                setPendingLogId(null);
            }
        } catch (error) {
            setAuthError('Incorrect admin password');
        }
    };

    const hidePassword = (logId) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [logId]: false
        }));
    };

    if (loading) return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-xl">
                        <IoKeyOutline size={24} className="text-gray-900" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Password Activity</h3>
                        <p className="text-sm text-gray-600">Recent password changes</p>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3 glass p-3 rounded-lg">
                        <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-50 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <>
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-xl">
                            <IoKeyOutline size={24} className="text-gray-900" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Password Activity</h3>
                            <p className="text-sm text-gray-600">Recent password changes</p>
                        </div>
                    </div>
                    <Badge variant="red" className="animate-pulse">Live</Badge>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {logs.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 glass rounded-xl">
                            <IoKeyOutline size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No password changes recorded yet</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <motion.div
                                key={log._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass rounded-lg p-4 hover:bg-gray-100 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                                            {log.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{log.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-600">{log.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={log.source === 'forgot_reset' ? 'yellow' : 'blue'} className="text-xs">
                                        {log.source === 'forgot_reset' ? 'Reset' : 'Changed'}
                                    </Badge>
                                </div>

                                <div className={`flex items-center justify-between rounded-lg p-3 transition-all ${visiblePasswords[log._id] ? 'bg-white' : 'bg-black/20'}`}>
                                    <div className="flex items-center gap-2 flex-1">
                                        {visiblePasswords[log._id] ? (
                                            <span className="font-mono text-base font-semibold text-black">
                                                {log.newPassword}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-sm text-gray-500">
                                                ••••••••••••
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => visiblePasswords[log._id] ? hidePassword(log._id) : requestPasswordReveal(log._id)}
                                        className={`transition-colors p-2 hover:bg-gray-100 rounded-lg ${visiblePasswords[log._id] ? 'text-gray-700 hover:text-black' : 'text-gray-600 hover:text-gray-900'}`}
                                        title={visiblePasswords[log._id] ? "Hide" : "Show (Requires Auth)"}
                                    >
                                        {visiblePasswords[log._id] ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <IoTime size={12} />
                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </Card>

            {/* Admin Password Verification Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAuthModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-xl">
                                        <IoLockClosed size={24} className="text-gray-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Admin Authentication</h3>
                                        <p className="text-sm text-gray-600">Enter your password to view</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    <IoClose size={24} />
                                </button>
                            </div>

                            {authError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                                    {authError}
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Admin Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && verifyAndReveal()}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900 outline-none"
                                    placeholder="Enter your password"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl font-semibold transition-all text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={verifyAndReveal}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all text-white"
                                >
                                    Verify & Show
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PasswordActivityLog;
