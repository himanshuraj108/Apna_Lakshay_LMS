import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../utils/api';
import { motion } from 'framer-motion';
import { IoCheckmarkCircle, IoCloseCircle, IoAlertCircle, IoArrowBack, IoShieldCheckmark } from 'react-icons/io5';

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
                else setError('Student record not found');
            } catch (e) {
                setError(e.response?.data?.message || 'Verification Failed');
            } finally {
                setLoading(false);
            }
        };
        verifyStudent();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">Verifying Student Identity...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white border border-[#EDE8E0] rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
                    <IoCloseCircle size={36} />
                </div>
                <h1 className="text-xl font-black text-stone-900 mb-1">Verification Failed</h1>
                <p className="text-stone-500 text-xs font-medium mb-6">{error}</p>
                <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-white hover:bg-[#FAF6F0] border border-[#EDE8E0] text-stone-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
                    Return to Home
                </button>
            </motion.div>
        </div>
    );

    const isPending = !student?.seat;
    const isInactive = !student?.isActive;

    const THEME = isInactive
        ? {
            icon: IoCloseCircle,
            bg: 'from-rose-500 to-red-600',
            badge: 'text-rose-700 bg-rose-50 border-rose-200',
            label: 'INACTIVE',
            title: 'Inactive Member',
            sub: 'Membership Expired or Disabled'
        }
        : isPending
            ? {
                icon: IoAlertCircle,
                bg: 'from-amber-500 to-orange-500',
                badge: 'text-amber-700 bg-amber-50 border-amber-200',
                label: 'PENDING',
                title: 'Pending Allocation',
                sub: 'Waiting for Seat Assignment'
            }
            : {
                icon: IoCheckmarkCircle,
                bg: 'from-emerald-500 to-teal-600',
                badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                label: 'ACTIVE',
                title: 'Verified Student',
                sub: 'Official Library Member'
            };

    const Icon = THEME.icon;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#FAF6F0', fontFamily: "'Inter', sans-serif" }}>
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                }}
            />

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100 }}
                className="bg-white border border-[#EDE8E0] rounded-3xl p-7 max-w-md w-full relative z-10 shadow-xl">

                {/* Status header */}
                <div className="text-center mb-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                        className={`w-16 h-16 bg-gradient-to-br ${THEME.bg} rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-md shadow-orange-500/10 text-white`}>
                        <Icon size={34} />
                    </motion.div>
                    <h1 className="text-xl font-black text-stone-900 tracking-tight">{THEME.title}</h1>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mt-0.5">{THEME.sub}</p>
                </div>

                {/* Info card */}
                <div className="bg-[#FAF6F0] border border-[#EDE8E0] rounded-2xl p-4.5 mb-6">
                    <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-[#EDE8E0]">
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-[#EDE8E0] bg-white shrink-0 shadow-2xs">
                            {student?.profileImage ? (
                                <img src={student.profileImage.startsWith('http') ? student.profileImage : `${BASE_URL}${student.profileImage}`} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-black text-amber-500 bg-stone-900">
                                    {student?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-black text-stone-900 truncate">{student?.name}</h2>
                            <p className="text-xs text-stone-500 truncate font-medium">{student?.email}</p>
                            {student?.phone && <p className="text-[11px] text-stone-400 font-mono mt-0.5">{student.phone}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: 'Status', value: <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${THEME.badge}`}>{THEME.label}</span> },
                            { label: 'Seat Number', value: <span className="font-bold text-stone-900">{student?.seat?.number || 'Not Assigned'}</span> },
                            { label: 'Student ID', value: <span className="font-mono text-[11px] text-stone-600 select-all">{student?._id?.toUpperCase()}</span> },
                            { label: 'Shift', value: student?.seat?.shift?.name || student?.shift || 'Regular' },
                            { label: 'Monthly Fee', value: student?.seat?.price ? `₹${student.seat.price}` : 'N/A' },
                            { label: 'Joined', value: student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#EDE8E0]/70 last:border-0 text-xs">
                                <span className="text-stone-500 font-medium">{label}</span>
                                <span className="text-stone-900 font-semibold">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/admin')}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 cursor-pointer transition-all">
                    Back to Admin Portal
                </motion.button>
            </motion.div>
        </div>
    );
};

export default VerifyStudent;
