import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoLogOutOutline, IoClose } from 'react-icons/io5';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!isOpen) {
            setCountdown(3);
            return;
        }

        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 select-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl z-10"
                        style={{
                            background: '#FFFFFF',
                            border: '1.5px solid #EDE8E0',
                            fontFamily: "'DM Sans', 'Inter', sans-serif"
                        }}
                    >
                        {/* 3px Top Gradient Accent */}
                        <div
                            className="h-[3px] w-full"
                            style={{ background: 'linear-gradient(90deg, #F97316, #EF4444, #DC2626)' }}
                        />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Close"
                        >
                            <IoClose size={18} />
                        </button>

                        <div className="p-6 text-center">
                            {/* Icon badge */}
                            <div
                                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner"
                                style={{
                                    background: '#FEF2F2',
                                    border: '1.5px solid #FECACA'
                                }}
                            >
                                <IoLogOutOutline size={28} style={{ color: '#DC2626' }} />
                            </div>

                            {/* Headline */}
                            <h3 className="text-lg font-black text-stone-900 mb-1 leading-snug">
                                Log Out Confirmation
                            </h3>

                            {/* Message */}
                            <p className="text-sm font-medium text-stone-600 mb-6 leading-relaxed">
                                Are you sure you want to log out of your session?
                            </p>

                            {/* Action Buttons: "No" & "Sure" */}
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                                    style={{
                                        background: '#FAF6F0',
                                        border: '1.5px solid #EDE8E0',
                                        color: '#574E45'
                                    }}
                                >
                                    No
                                </motion.button>

                                <AnimatePresence mode="wait">
                                    {countdown > 0 ? (
                                        <motion.button
                                            key="countdown"
                                            initial={{ opacity: 0.6 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            disabled
                                            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-red-400 bg-red-50 border border-red-200 cursor-not-allowed select-none flex items-center justify-center gap-1.5"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                                            <span>Sure ({countdown}s)</span>
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            key="sure-btn"
                                            initial={{ scale: 0.85, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={onConfirm}
                                            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black text-white transition-all cursor-pointer shadow-lg"
                                            style={{
                                                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
                                                border: '1.5px solid #B91C1C',
                                                boxShadow: '0 4px 18px rgba(220, 38, 38, 0.45)'
                                            }}
                                        >
                                            Sure
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LogoutConfirmationModal;
