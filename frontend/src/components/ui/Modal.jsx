import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', accentColor = 'from-orange-400 via-orange-500 to-amber-500', theme = 'light' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
                    />

                    {/* Modal container */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 24 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${theme === 'light' ? 'bg-white border-gray-200' : 'border-white/10'}`}
                            style={theme === 'dark' ? { background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(20,20,35,0.98) 100%)' } : {}}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top accent bar */}
                            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${accentColor} rounded-t-2xl`} />

                            {/* Glow behind accent */}
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-gradient-to-r ${accentColor} opacity-10 blur-2xl pointer-events-none`} />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-7 pb-4">
                                <h2 className={`text-xl font-bold tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{title}</h2>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-xl transition-all duration-200 ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900' : 'bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white'}`}
                                >
                                    <IoClose size={20} />
                                </button>
                            </div>

                            {/* Divider */}
                            <div className={`mx-6 h-px mb-5 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/6'}`} />

                            {/* Content */}
                            <div className="px-6 pb-6">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
