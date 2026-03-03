import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoArrowBack, IoKey } from 'react-icons/io5';
import PasswordActivityLog from '../../components/admin/PasswordActivityLog';

const PAGE_BG = { background: '#050508' };

const PasswordActivityPage = () => {
    return (
        <div className="relative min-h-screen" style={PAGE_BG}>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-red-600/6 blur-3xl" />
                <div className="absolute bottom-[10%] left-[-6%] w-[400px] h-[400px] rounded-full bg-orange-600/6 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
                    <Link to="/admin">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all">
                            <IoArrowBack size={16} /> Back
                        </motion.button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg"><IoKey size={14} className="text-white" /></div>
                            <span className="text-xs font-bold uppercase tracking-widest text-red-400">Admin</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">Password Activity</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Track all student password changes</p>
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
