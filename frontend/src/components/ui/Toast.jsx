import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle, IoClose } from 'react-icons/io5';
import { useEffect } from 'react';

const Toast = ({ show, message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    const variants = {
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.9 }
    };

    const types = {
        success: {
            icon: IoCheckmarkCircle,
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            text: 'text-green-400'
        },
        error: {
            icon: IoAlertCircle,
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-400'
        },
        info: {
            icon: IoInformationCircle,
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-400'
        }
    };

    const style = types[type] || types.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <motion.div
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`flex items-center gap-3 px-6 py-4 rounded-xl backdrop-blur-md border shadow-2xl ${style.bg} ${style.border} min-w-[300px]`}
                    >
                        <Icon className={`text-xl ${style.text}`} />
                        <p className="flex-1 text-white font-medium text-sm">{message}</p>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <IoClose size={18} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
