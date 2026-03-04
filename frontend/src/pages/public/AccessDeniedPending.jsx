import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoTimeOutline } from 'react-icons/io5';

const AccessDeniedPending = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative"
            style={{ background: 'linear-gradient(160deg, rgba(10,10,18,1) 0%, rgba(15,15,25,1) 100%)' }}
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/6 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-center"
                style={{ background: 'linear-gradient(160deg, rgba(14,14,22,0.99) 0%, rgba(20,20,32,0.99) 100%)' }}
            >
                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-16 bg-amber-500/8 blur-2xl pointer-events-none" />

                <div className="px-4 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
                    {/* Icon */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                        <IoTimeOutline className="text-amber-400 text-[28px] sm:text-[32px]" />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">Allocation Pending</h1>
                    <p className="text-amber-500 font-semibold mb-5 sm:mb-6 uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[10px] sm:text-xs">
                        Seat Assignment Required
                    </p>

                    <div className="bg-white/3 border border-white/8 rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 mb-5 sm:mb-7 text-gray-400 text-sm leading-relaxed text-left">
                        Your account is active, but you have not been assigned a seat yet.
                        Premium features like Chat, Study Planner, and Stats are locked until an admin allocates a seat to you.
                    </div>

                    <div className="space-y-2.5">
                        <Link
                            to="/student/profile"
                            className="block w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 active:scale-95 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                        >
                            Check Status
                        </Link>
                        <Link
                            to="/student"
                            className="block w-full py-3 px-4 bg-white/5 hover:bg-white/8 active:scale-95 border border-white/8 text-gray-300 rounded-xl font-semibold transition-all"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDeniedPending;
