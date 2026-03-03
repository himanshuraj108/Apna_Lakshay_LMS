import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoClose, IoHelpCircle, IoCheckmarkCircle, IoWarningOutline, IoSend,
    IoBuildOutline, IoFlashOutline, IoScanOutline, IoCardOutline, IoChatbubbleOutline
} from 'react-icons/io5';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    { value: 'facility', label: 'Facility Issue (AC, Chair, WiFi)', Icon: IoBuildOutline },
    { value: 'electricity', label: 'Electricity / Power', Icon: IoFlashOutline },
    { value: 'seat', label: 'Seat Problem', Icon: IoScanOutline },
    { value: 'billing', label: 'Billing / Fees', Icon: IoCardOutline },
    { value: 'other', label: 'Other', Icon: IoChatbubbleOutline },
];

const HelpSupportModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [category, setCategory] = useState('facility');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/student/request', { type: 'support', requestedData: { category, message } });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setMessage('');
                setCategory('facility');
                onClose();
            }, 2800);
        } catch {
            alert('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, rgba(13,13,22,0.99) 0%, rgba(18,18,28,0.99) 100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-14 bg-amber-500/10 blur-2xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                                <IoHelpCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Help & Support</h2>
                                <p className="text-xs text-gray-500">Report an issue or request help</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-white/6 mb-5" />

                    <div className="px-6 pb-6">
                        {/* Access restricted */}
                        {!user?.isActive ? (
                            <div className="space-y-4">
                                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex gap-3">
                                    <IoWarningOutline size={20} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-red-300 mb-1">Access Restricted</h3>
                                        <p className="text-sm text-gray-400">Support requests are only available for active members. Please visit the library admin to renew your membership.</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition-all">Close</button>
                            </div>
                        ) : (user?.isActive && !user?.seat) ? (
                            <div className="space-y-4">
                                <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                                    <IoWarningOutline size={20} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-amber-300 mb-1">Allocation Pending</h3>
                                        <p className="text-sm text-gray-400">Support requests are available once a seat is assigned. Please wait for admin approval.</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-medium transition-all">Close</button>
                            </div>
                        ) : success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-10 text-center"
                            >
                                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <IoCheckmarkCircle size={34} className="text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Request Sent!</h3>
                                <p className="text-sm text-gray-500">Admin will review your request shortly.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Category — custom pill selector instead of native select */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issue Category</label>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {CATEGORIES.map(({ value, label, Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setCategory(value)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${category === value
                                                    ? 'bg-amber-500/12 border-amber-500/40 text-amber-200'
                                                    : 'bg-white/3 border-white/8 text-gray-400 hover:bg-white/6 hover:text-gray-200'
                                                    }`}
                                            >
                                                <Icon size={15} className={category === value ? 'text-amber-400' : 'text-gray-600'} />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all h-24 resize-none placeholder-gray-600"
                                        placeholder="Describe your issue in detail…"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 rounded-xl font-semibold text-black shadow-lg shadow-amber-500/20 transition-all duration-200 disabled:opacity-60"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <IoSend size={16} />
                                    )}
                                    {loading ? 'Sending…' : 'Submit Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HelpSupportModal;
