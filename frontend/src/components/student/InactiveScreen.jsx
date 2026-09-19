import React from 'react';
import { motion } from 'framer-motion';
import {
    IoLockClosedOutline, IoCallOutline, IoLogOutOutline,
    IoTimeOutline, IoShieldCheckmarkOutline, IoDocumentTextOutline,
    IoAlertCircleOutline, IoPersonOutline
} from 'react-icons/io5';

const InactiveScreen = ({ user, onLogout }) => {
    const isAwaited = user?.inactivationStatus === 'awaited';
    const fullName = user?.name || 'Scholar';
    const studentId = user?.studentId || user?.enrollmentNumber || user?._id?.toString().slice(-6).toUpperCase() || 'N/A';
    const contact = user?.mobile || user?.phoneNumber || user?.email || 'N/A';

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
                    {/* Top Status Border */}
                    <div className={`h-1.5 w-full ${isAwaited ? 'bg-amber-500' : 'bg-rose-500'}`} />

                    <div className="p-6 sm:p-8">
                        {/* Status Icon & Header */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                                isAwaited ? 'bg-amber-500/10 text-amber-600 border border-amber-200' : 'bg-rose-500/10 text-rose-600 border border-rose-200'
                            }`}>
                                {isAwaited ? <IoTimeOutline size={28} /> : <IoLockClosedOutline size={28} />}
                            </div>

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 border">
                                {isAwaited ? (
                                    <span className="text-amber-700 bg-amber-50 border-amber-200">
                                        Inactivation Awaiting Approval
                                    </span>
                                ) : (
                                    <span className="text-rose-700 bg-rose-50 border-rose-200">
                                        Account Inactive
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                                {isAwaited ? 'Status: Awaiting Review' : 'Membership Inactive'}
                            </h1>
                            <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm leading-relaxed">
                                {isAwaited
                                    ? 'A sub-admin has requested inactivation for your scholar profile. Your previous desk was released and is pending Super Admin review.'
                                    : 'Your library membership is currently paused. Physical desk access, attendance, and study tools are temporarily locked.'}
                            </p>
                        </div>

                        {/* Scholar Snapshot Card */}
                        <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl p-4 mb-5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-3">
                                Scholar Information
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-stone-500 block text-[11px]">Name</span>
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
                                    <span className="text-stone-500 block text-[11px]">Membership</span>
                                    <span className={`font-bold block ${isAwaited ? 'text-amber-600' : 'text-rose-600'}`}>
                                        {isAwaited ? 'Pending Review' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notice Boxes */}
                        <div className="space-y-2.5 mb-6">
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                                <IoShieldCheckmarkOutline size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-stone-700 leading-snug">
                                    <span className="font-bold text-[#0F172A] block">Records Preserved</span>
                                    All your previous attendance history, mock test credits, and fee receipts are safely preserved.
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50/50 border border-orange-200/60">
                                <IoAlertCircleOutline size={18} className="text-orange-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-stone-700 leading-snug">
                                    <span className="font-bold text-[#0F172A] block">Reactivation</span>
                                    To restore your desk allocation and resume study sessions, please contact administration.
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5">
                            <motion.a
                                href="https://www.apnalakshay.com/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                            >
                                <IoCallOutline size={15} />
                                <span>Contact Administration</span>
                            </motion.a>

                            <motion.button
                                onClick={onLogout}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
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

export default InactiveScreen;
