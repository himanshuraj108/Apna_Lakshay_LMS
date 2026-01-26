import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoHelpCircle, IoSend } from 'react-icons/io5';
import Button from '../ui/Button';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const HelpSupportModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [category, setCategory] = useState('facility');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [ticketId, setTicketId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/student/request', {
                type: 'support',
                requestedData: {
                    category,
                    message
                }
            });
            setSuccess(true);
            setTicketId(response.data.request.ticketId);
            setTimeout(() => {
                setSuccess(false);
                setMessage('');
                setCategory('facility');
                setTicketId(null);
                onClose();
            }, 3000);
        } catch (error) {
            console.error('Support request failed:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-600" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    >
                        <IoClose size={24} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                            <IoHelpCircle size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Help & Support</h2>
                            <p className="text-sm text-gray-400">Report an issue or request help</p>
                        </div>
                    </div>

                    {!user?.isActive ? (
                        <div className="py-8 text-center">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                                <h3 className="text-lg font-bold text-red-500 mb-2">Access Restricted</h3>
                                <p className="text-sm text-gray-300">
                                    Support requests are only available for active members. Please visit the library admin to renew your membership.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={onClose} className="w-full">
                                Close
                            </Button>
                        </div>
                    ) : (user?.isActive && !user?.seat) ? (
                        <div className="py-8 text-center">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                                <h3 className="text-lg font-bold text-yellow-500 mb-2">Allocation Pending</h3>
                                <p className="text-sm text-gray-300">
                                    Support requests are available once a seat is assigned. Please wait for admin approval.
                                </p>
                            </div>
                            <Button variant="secondary" onClick={onClose} className="w-full">
                                Close
                            </Button>
                        </div>
                    ) : success ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IoSend className="text-green-500 text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
                            <p className="text-xs text-gray-500 mt-2">Admin will review your request shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Issue Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none appearance-none"
                                >
                                    <option value="facility">Facility Issue (AC, Chair, WiFi)</option>
                                    <option value="electricity">Electricity / Power</option>
                                    <option value="seat">Seat Problem</option>
                                    <option value="billing">Billing / Fees</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none h-32 resize-none"
                                    placeholder="Describe your issue in detail..."
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full justify-center bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white border-0"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default HelpSupportModal;
