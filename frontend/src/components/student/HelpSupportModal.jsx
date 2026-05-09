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
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden bg-white"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-orange-400 to-orange-600" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-7 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <IoHelpCircle size={22} className="text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
                                <p className="text-xs text-gray-500">Report an issue or request help</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <div className="mx-6 h-px bg-gray-200 mb-5" />

                    <div className="px-6 pb-6">
                        {/* Access restricted */}
                        {!user?.isActive ? (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                                    <IoWarningOutline size={20} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-red-700 mb-1">Access Restricted</h3>
                                        <p className="text-sm text-red-600">Support requests are only available for active members. Please visit the library admin to renew your membership.</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium transition-all">Close</button>
                            </div>
                        ) : (user?.isActive && !user?.seat) ? (
                            <div className="space-y-4">
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
                                    <IoWarningOutline size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-orange-800 mb-1">Allocation Pending</h3>
                                        <p className="text-sm text-orange-700">Support requests are available once a seat is assigned. Please wait for admin approval.</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium transition-all">Close</button>
                            </div>
                        ) : success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-10 text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <IoCheckmarkCircle size={34} className="text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Request Sent!</h3>
                                <p className="text-sm text-gray-600">Admin will review your request shortly.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Issue Category</label>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {CATEGORIES.map(({ value, label, Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setCategory(value)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${category === value
                                                    ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500/50'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon size={18} className={category === value ? 'text-orange-500' : 'text-gray-400'} />
                                                <span className="font-medium">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all h-24 resize-none placeholder-gray-400"
                                        placeholder="Describe your issue in detail…"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 disabled:opacity-60"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <IoSend size={18} />
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
