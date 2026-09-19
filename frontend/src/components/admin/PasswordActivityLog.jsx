import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoEye, IoEyeOff, IoTime, IoKeyOutline, IoLockClosed, IoClose } from 'react-icons/io5';
import api from '../../utils/api';

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
            setLogs(response.data.logs || []);
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
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await api.post('/auth/login', {
                email: user.email,
                password: adminPassword
            });

            if (response.data.success) {
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

    if (loading) {
        return (
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EDE8E0]">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-sm">
                            <IoKeyOutline size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-stone-900">Password Audit Trail</h3>
                            <p className="text-xs text-stone-500">Loading student credential updates...</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-3.5 bg-[#FAF6F0] p-4 rounded-xl border border-[#EDE8E0]/60">
                            <div className="w-10 h-10 bg-stone-200 rounded-full shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-stone-200 rounded-md w-1/3"></div>
                                <div className="h-3 bg-stone-200 rounded-md w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-[#EDE8E0] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EDE8E0] flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-sm">
                            <IoKeyOutline size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-stone-900">Password Audit Trail</h3>
                            <p className="text-xs text-stone-500 font-medium">Recent security and credential reset events</p>
                        </div>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Sync
                    </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {logs.length === 0 ? (
                        <div className="text-center text-stone-400 py-12 bg-[#FAF6F0] rounded-2xl border border-[#EDE8E0]">
                            <IoKeyOutline size={40} className="mx-auto mb-2 opacity-30 text-stone-500" />
                            <p className="text-sm font-semibold text-stone-600">No password changes recorded yet</p>
                            <p className="text-xs text-stone-400 mt-1">Student credential resets will appear here</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <motion.div
                                key={log._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#FAF6F0] hover:bg-[#F5EFE6] border border-[#EDE8E0] rounded-xl p-4 transition-all duration-150"
                            >
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center text-xs font-black shrink-0 border border-amber-400/20">
                                            {log.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-stone-900">{log.user?.name || 'Unknown Student'}</p>
                                            <p className="text-[11px] text-stone-500 font-medium">{log.email}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        log.source === 'forgot_reset'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                        {log.source === 'forgot_reset' ? 'Forgot Reset' : 'Profile Change'}
                                    </span>
                                </div>

                                <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all border ${
                                    visiblePasswords[log._id]
                                        ? 'bg-white border-orange-300 shadow-xs'
                                        : 'bg-stone-100/80 border-[#E2DBD2]'
                                }`}>
                                    <div className="flex items-center gap-2 flex-1">
                                        {visiblePasswords[log._id] ? (
                                            <span className="font-mono text-sm font-black text-orange-600 tracking-wide select-all">
                                                {log.newPassword}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-xs text-stone-400 select-none">
                                                ••••••••••••
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => visiblePasswords[log._id] ? hidePassword(log._id) : requestPasswordReveal(log._id)}
                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            visiblePasswords[log._id]
                                                ? 'text-orange-600 hover:bg-orange-50'
                                                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200/60'
                                        }`}
                                        title={visiblePasswords[log._id] ? "Hide password" : "Show password (Admin verification required)"}
                                    >
                                        {visiblePasswords[log._id] ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-stone-400 font-medium">
                                    <IoTime size={13} className="text-stone-400" />
                                    <span>{new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Admin Password Verification Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAuthModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-[#EDE8E0] rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#EDE8E0]">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl text-white shadow-xs">
                                        <IoLockClosed size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-stone-900">Admin Authentication</h3>
                                        <p className="text-xs text-stone-500">Confirm identity to view sensitive credentials</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {authError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-bold mb-4">
                                    {authError}
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="block text-xs font-bold text-stone-700 mb-1.5">Your Admin Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyAndReveal()}
                                    className="w-full bg-white border border-[#E2DBD2] rounded-xl px-4 py-2.5 text-stone-900 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none shadow-2xs font-medium placeholder:text-stone-400"
                                    placeholder="Enter your current password"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={verifyAndReveal}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl text-xs font-bold text-white shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                                >
                                    Verify & Reveal
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
