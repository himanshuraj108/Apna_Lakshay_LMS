import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { IoCheckmarkCircle, IoCloseCircle, IoAlertCircle, IoArrowBack } from 'react-icons/io5';

const VerifyStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const verifyStudent = async () => {
            try {
                const res = await api.get(`/admin/students/${id}`);
                if (res.data.success) setStudent(res.data.student);
                else setError('Student not found');
            } catch (e) { setError(e.response?.data?.message || 'Verification Failed'); }
            finally { setLoading(false); }
        };
        verifyStudent();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Verifying identity…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-red-500/8 border border-red-500/25 rounded-2xl p-8 max-w-md w-full text-center">
                <IoCloseCircle size={56} className="text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-red-400 mb-2">Verification Failed</h1>
                <p className="text-gray-600 text-sm mb-6">{error}</p>
                <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all">
                    Go Home
                </button>
            </motion.div>
        </div>
    );

    const isPending = !student?.seat;
    const isInactive = !student?.isActive;

    const THEME = isInactive
        ? { icon: IoCloseCircle, iconColor: 'text-red-400', bg: 'from-red-600 to-rose-600', glow: 'rgba(239,68,68,0.35)', badge: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'INACTIVE', title: 'Inactive Member', sub: 'Membership Expired or Disabled', orb1: 'bg-red-500/8', orb2: 'bg-orange-500/8' }
        : isPending
            ? { icon: IoAlertCircle, iconColor: 'text-yellow-400', bg: 'from-yellow-500 to-amber-500', glow: 'rgba(245,158,11,0.35)', badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'PENDING', title: 'Pending Allocation', sub: 'Waiting for Seat Assignment', orb1: 'bg-yellow-500/8', orb2: 'bg-orange-500/8' }
            : { icon: IoCheckmarkCircle, iconColor: 'text-green-400', bg: 'from-green-500 to-emerald-500', glow: 'rgba(16,185,129,0.35)', badge: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'ACTIVE', title: 'Verified Student', sub: 'Official Apna Lakshay Member', orb1: 'bg-blue-500/8', orb2: 'bg-purple-500/8' };

    const Icon = THEME.icon;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute -top-[20%] -left-[20%] w-[50%] h-[50%] ${THEME.orb1} rounded-full blur-3xl`} />
                <div className={`absolute -bottom-[20%] -right-[20%] w-[50%] h-[50%] ${THEME.orb2} rounded-full blur-3xl`} />
            </div>

            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 80 }}
                className="bg-white/4 backdrop-blur-2xl border border-gray-200 rounded-3xl p-7 max-w-md w-full relative z-10 shadow-2xl">

                {/* Status header */}
                <div className="text-center mb-7">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.15 }}
                        className={`w-20 h-20 bg-gradient-to-br ${THEME.bg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}
                        style={{ boxShadow: `0 0 40px 0 ${THEME.glow}` }}>
                        <Icon size={40} className="text-gray-900" />
                    </motion.div>
                    <h1 className="text-2xl font-black text-gray-900 mb-1">{THEME.title}</h1>
                    <p className={`text-xs font-bold uppercase tracking-widest ${THEME.iconColor}`}>{THEME.sub}</p>
                </div>

                {/* Info card */}
                <div className="bg-black/20 border border-gray-100 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/15 bg-gray-50 shrink-0">
                            {student?.profileImage ? (
                                <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-600">
                                    {student?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">{student?.name}</h2>
                            <p className="text-blue-300 text-xs">{student?.email}</p>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {[
                            { label: 'Status', value: <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${THEME.badge}`}>{THEME.label}</span> },
                            { label: 'Seat Number', value: student?.seat?.number || 'Not Assigned' },
                            { label: 'Membership ID', value: <span className="font-mono text-[10px]">{student?._id?.toUpperCase()}</span> },
                            { label: 'Monthly Fee', value: `₹${student?.seat?.price || 'N/A'}` },
                            { label: 'Joined', value: student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN') : 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-500 text-xs">{label}</span>
                                <span className="text-gray-900 text-sm font-medium">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/admin')}
                    className={`w-full py-3 bg-gradient-to-r ${THEME.bg} text-gray-900 font-bold rounded-xl text-sm shadow-lg transition-all`}
                    style={{ boxShadow: `0 6px 20px -4px ${THEME.glow}` }}>
                    Back to Dashboard
                </motion.button>
            </motion.div>
        </div>
    );
};

export default VerifyStudent;
