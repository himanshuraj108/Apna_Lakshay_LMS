import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowBack, IoKey } from 'react-icons/io5';
import PasswordActivityLog from '../../components/admin/PasswordActivityLog';

const PasswordActivityPage = () => {
    return (
        <div className="relative min-h-screen" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/admin">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer">
                            <IoArrowBack size={15} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-sm">
                                <IoKey size={13} className="text-white" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">Audit Logs</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Password Activity</h1>
                        <p className="text-stone-500 text-xs mt-0.5 font-medium">Track and audit student password change events</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                    <PasswordActivityLog />
                </motion.div>
            </div>
        </div>
    );
};

export default PasswordActivityPage;
