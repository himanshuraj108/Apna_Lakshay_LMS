import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    IoHourglassOutline, IoCheckmarkCircle, IoTimeOutline,
    IoPersonOutline, IoRefreshOutline, IoLogOutOutline,
    IoShieldCheckmarkOutline, IoLibraryOutline
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';

const AccessDeniedPending = ({ user: propUser }) => {
    const { user: authUser, logout } = useAuth();
    const navigate = useNavigate();
    const user = propUser || authUser;

    const fullName = user?.name || 'Scholar';
    const studentId = user?.studentId || user?.enrollmentNumber || user?._id?.toString().slice(-6).toUpperCase() || 'N/A';
    const contact = user?.mobile || user?.phoneNumber || user?.email || 'N/A';

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleLogout = async () => {
        if (logout) {
            await logout();
        }
        navigate('/login');
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            style={{
                backgroundColor: '#FAF6F0',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.08) 1px, transparent 0)',
                backgroundSize: '28px 28px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-lg my-auto"
            >
                <div className="bg-white border border-[#EDE8E0] rounded-3xl shadow-xl overflow-hidden">
                    {/* Top Accent Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />

                    <div className="p-6 sm:p-8">
                        {/* Header & Status Icon */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-amber-500/10 text-amber-600 border border-amber-200">
                                <IoHourglassOutline size={28} />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 bg-amber-50 border border-amber-200 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Desk Allocation Pending</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                                Allocation In Progress
                            </h1>
                            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm leading-relaxed">
                                Your scholar account is active and registered. An administrator will assign your physical desk and shift shortly.
                            </p>
                        </div>

                        {/* Scholar Snapshot Card */}
                        <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl p-4 mb-5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3">
                                Registration Snapshot
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-stone-500 block text-[11px]">Scholar Name</span>
                                    <span className="font-bold text-[#0F172A] truncate block">{fullName}</span>
                                </div>
                                <div>
                                    <span className="text-stone-500 block text-[11px]">Scholar ID</span>
                                    <span className="font-mono font-bold text-stone-800 block">{studentId}</span>
                                </div>
                                <div>
                                    <span className="text-stone-500 block text-[11px]">Contact</span>
                                    <span className="font-mono text-stone-700 block truncate">{contact}</span>
                                </div>
                                <div>
                                    <span className="text-stone-500 block text-[11px]">Assigned Desk</span>
                                    <span className="font-bold text-amber-600 block">Pending Assignment</span>
                                </div>
                            </div>
                        </div>

                        {/* Onboarding Steps */}
                        <div className="space-y-2.5 mb-6">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                                <IoCheckmarkCircle size={18} className="text-emerald-600 shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-emerald-950 block">Profile Created</span>
                                    <span className="text-emerald-700 text-[11px]">Registration and login credentials active</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                                <IoTimeOutline size={18} className="text-amber-600 shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-amber-950 block">Desk & Shift Allocation</span>
                                    <span className="text-amber-700 text-[11px]">Awaiting seat allocation by administrative staff</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80 opacity-70">
                                <IoLibraryOutline size={18} className="text-stone-400 shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-stone-600 block">Study Suite & Attendance Access</span>
                                    <span className="text-stone-500 text-[11px]">Unlocks automatically once desk is assigned</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                                <motion.button
                                    onClick={handleRefresh}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center justify-center gap-1.5 py-3 px-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                                >
                                    <IoRefreshOutline size={15} />
                                    <span>Refresh Status</span>
                                </motion.button>

                                <Link to="/student/profile" className="block">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center justify-center gap-1.5 py-3 px-3 bg-white hover:bg-stone-50 border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <IoPersonOutline size={15} />
                                        <span>View Profile</span>
                                    </motion.button>
                                </Link>
                            </div>

                            <motion.button
                                onClick={handleLogout}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#EDE8E0] text-stone-500 hover:text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                                <IoLogOutOutline size={15} />
                                <span>Sign Out</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 bg-[#FAF6F0] border-t border-[#EDE8E0] text-center">
                        <p className="text-[11px] text-stone-500 font-medium">
                            Apna Lakshay Library Management System
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDeniedPending;
