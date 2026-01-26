import React from 'react';
import { motion } from 'framer-motion';
import { IoWarning, IoConstruct, IoRefresh, IoServer } from 'react-icons/io5';
import Button from '../components/ui/Button';

const ServerCrash = () => {
    const handleRetry = () => {
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white relative overflow-hidden">
            {/* Background Chaos */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 text-9xl text-red-500 animate-pulse">!</div>
                <div className="absolute bottom-20 right-20 text-9xl text-red-500 animate-pulse" style={{ animationDelay: '0.5s' }}>!</div>
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center relative z-10"
            >
                <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    className="inline-block mb-8"
                >
                    <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center border-4 border-red-500/30 mx-auto">
                        <IoServer size={64} className="text-red-500" />
                    </div>
                </motion.div>

                <h1 className="text-4xl font-bold mb-4 text-red-400">System Failure</h1>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 text-left">
                    <div className="flex items-start gap-4 mb-4">
                        <IoWarning className="text-red-400 shrink-0 mt-1" size={24} />
                        <div>
                            <h3 className="font-bold text-red-200">Critical Server Error</h3>
                            <p className="text-red-300/70 text-sm font-mono mt-1">Error Code: 500_CRASH_SIMULATION</p>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        The website is currently in <span className="text-yellow-400 font-bold">Maintenance Mode</span>.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-2 rounded border border-white/5 font-mono">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        SYSTEM_STATUS :: MAINTENANCE_ACTIVE
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-gray-300 mb-6 font-medium text-lg">
                        Please try again after some time. <br />
                        Website is in Maintenance.
                    </p>

                    <Button
                        onClick={handleRetry}
                        variant="primary"
                        className="w-full justify-center py-4 text-lg bg-red-600 hover:bg-red-700 shadow-red-500/20"
                    >
                        <IoRefresh className="mr-2" />
                        Retry Connection
                    </Button>
                </div>

                <p className="mt-8 text-xs text-gray-600">
                    If this persists, contact the Administrator manually.
                </p>
            </motion.div>
        </div>
    );
};

export default ServerCrash;
