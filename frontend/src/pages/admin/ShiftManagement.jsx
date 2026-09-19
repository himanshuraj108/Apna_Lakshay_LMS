import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useShifts from '../../hooks/useShifts';
import ShiftManager from '../../components/admin/ShiftManager';
import { IoArrowBack, IoAlertCircleOutline, IoTimeOutline } from 'react-icons/io5';

const PAGE_BG = { background: '#FAF6F0' };

const ShiftManagement = () => {
    const { isCustom } = useShifts();

    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/admin">
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                            <IoArrowBack size={15} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-600">
                                <IoTimeOutline size={14} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-orange-600">Admin Operations</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A]">Shift Management</h1>
                        <p className="text-stone-500 text-xs font-medium mt-0.5">Create custom shifts or use system defaults</p>
                    </div>
                </motion.div>

                {!isCustom && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 px-4 py-3.5 rounded-2xl mb-6">
                        <IoAlertCircleOutline className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-bold text-amber-900 text-sm">System Default Mode</h3>
                            <p className="text-xs text-amber-800/80 mt-0.5">
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
