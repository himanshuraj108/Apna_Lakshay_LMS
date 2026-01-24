import React from 'react';
import { motion } from 'framer-motion';
import { IoConstructOutline, IoCodeSlashOutline, IoRocketOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center max-w-2xl"
            >
                {/* Icon Animation */}
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="mb-8 inline-block"
                >
                    <div className="p-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 backdrop-blur-xl">
                        <IoRocketOutline className="text-6xl text-blue-400" />
                    </div>
                </motion.div>

                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                    Coming Soon
                </h1>

                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    We are currently upgrading our system to bring you a better experience.
                    The library management system is under maintenance and will be live shortly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur text-sm text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block mr-2 animate-pulse" />
                        System Maintenance in Progress
                    </div>
                </div>
            </motion.div>

            {/* Admin Access Link (Subtle) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8"
            >
                <Link to="/login" className="text-gray-600 hover:text-gray-400 text-sm transition-colors flex items-center gap-2">
                    <IoConstructOutline /> Admin Access
                </Link>
            </motion.div>
        </div>
    );
};

export default MaintenancePage;
