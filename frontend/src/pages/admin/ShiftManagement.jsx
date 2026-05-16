import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useShifts from '../../hooks/useShifts';
import ShiftManager from '../../components/admin/ShiftManager';
import { IoArrowBack, IoAlertCircleOutline, IoTimeOutline } from 'react-icons/io5';

const PAGE_BG = { background: '#F8FAFC' };

const ShiftManagement = () => {
    const { isCustom } = useShifts();

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-6%] w-[500px] h-[500px] rounded-full bg-cyan-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-6%] w-[400px] h-[400px] rounded-full bg-blue-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/admin">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                                <IoTimeOutline size={14} className="text-gray-900" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Shift Management</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Create custom shifts or use system defaults</p>
                    </div>
                </motion.div>

                {!isCustom && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/20 px-4 py-3.5 rounded-2xl mb-6">
                        <IoAlertCircleOutline className="text-blue-400 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-400 text-sm">System Default Mode</h3>
                            <p className="text-xs text-blue-200/70 mt-0.5">
                                You are using default shifts (Morning / Evening).
                                Creating your first custom shift will replace these across the entire system.
                            </p>
                        </div>
                    </motion.div>
                )}

                <ShiftManager />
            </div>
        </div>
    );
};

export default ShiftManagement;
