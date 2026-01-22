import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoEye, IoEyeOff, IoTime, IoPersonCircle } from 'react-icons/io5';
import api from '../../utils/api';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const PasswordActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visiblePasswords, setVisiblePasswords] = useState({});

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

    const togglePassword = (id) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) return (
        <Card className="h-full">
            <h3 className="text-xl font-bold mb-6">Password Activity</h3>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                            <div className="h-3 bg-white/5 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <Card className="h-full max-h-[500px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Password Activity
                </h3>
                <Badge variant="red" className="animate-pulse">Live Updates</Badge>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2">
                {logs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        No password changes recorded yet.
                    </div>
                ) : (
                    logs.map((log) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0">
                                        <span className="font-bold text-xs">
                                            {log.user?.name?.[0] || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{log.user?.name || log.email}</p>
                                        <p className="text-xs text-gray-400">{log.email}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
                                    <IoTime size={10} />
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between bg-black/30 rounded-lg p-3 mt-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={log.source === 'forgot_reset' ? 'yellow' : 'blue'} className="text-[10px] px-2 py-0.5">
                                        {log.source === 'forgot_reset' ? 'FORGOT' : 'PROFILE'}
                                    </Badge>
                                    <span className={`font-mono text-sm ${visiblePasswords[log._id] ? 'text-green-400' : 'text-gray-500'}`}>
                                        {visiblePasswords[log._id] ? log.newPassword : '••••••••••••'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => togglePassword(log._id)}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                    title={visiblePasswords[log._id] ? "Hide Password" : "Show Password"}
                                >
                                    {visiblePasswords[log._id] ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </Card>
    );
};

export default PasswordActivityLog;
