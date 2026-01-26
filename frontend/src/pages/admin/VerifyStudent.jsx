import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const VerifyStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyStudent = async () => {
            try {
                // In a real app, you might want a specific public endpoint or use the admin getStudentById
                // For now, assuming admin is logged in or this is a public verification endpoint
                // We'll use the existing admin endpoint. If checking as public, robust backend changes needed.
                // Assuming Admin Scan context as requested.

                const response = await api.get(`/admin/students/${id}`);
                if (response.data.success) {
                    setStudent(response.data.student);
                } else {
                    setError('Student not found');
                }
            } catch (err) {
                console.error('Verification failed:', err);
                setError(err.response?.data?.message || 'Verification Failed');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            verifyStudent();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p>Verifying Student Identity...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-md"
                >
                    <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-red-400 mb-2">Verification Failed</h1>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    // Determine valid status
    const isPending = !student?.seat;
    const isInactive = !student?.isActive;

    const getStatusTheme = () => {
        if (isInactive) return {
            color: 'red',
            bgColor: 'bg-red-500',
            shadow: 'shadow-red-500/30',
            icon: <FaTimesCircle className="text-5xl text-white" />,
            title: 'Inactive Member',
            subtitle: 'Membership Expired or Disabled',
            badge: 'bg-red-500/20 text-red-400 border border-red-500/30'
        };
        if (isPending) return {
            color: 'yellow',
            bgColor: 'bg-yellow-500',
            shadow: 'shadow-yellow-500/30',
            icon: <FaExclamationTriangle className="text-5xl text-white" />,
            title: 'Pending Allocation',
            subtitle: 'Waiting for Seat Assignment',
            badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        };
        return {
            color: 'green',
            bgColor: 'bg-green-500',
            shadow: 'shadow-green-500/30',
            icon: <FaCheckCircle className="text-5xl text-white" />,
            title: 'Verified Student',
            subtitle: 'Official Apna Lakshay Member',
            badge: 'bg-green-500/20 text-green-400 border border-green-500/30'
        };
    };

    const theme = getStatusTheme();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-[20%] -left-[20%] w-[50%] h-[50%] ${isInactive ? 'bg-red-500/20' : isPending ? 'bg-yellow-500/20' : 'bg-blue-500/20'} rounded-full blur-[100px]`}></div>
                <div className={`absolute -bottom-[20%] -right-[20%] w-[50%] h-[50%] ${isInactive ? 'bg-orange-500/20' : isPending ? 'bg-orange-500/20' : 'bg-purple-500/20'} rounded-full blur-[100px]`}></div>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                        className={`w-24 h-24 ${theme.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${theme.shadow}`}
                    >
                        {theme.icon}
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-1">{theme.title}</h1>
                    <p className={`font-medium tracking-wider uppercase text-sm opacity-80`} style={{ color: theme.color === 'yellow' ? '#facc15' : theme.color === 'red' ? '#f87171' : '#4ade80' }}>
                        {theme.subtitle}
                    </p>
                </div>

                <div className="bg-black/20 rounded-xl p-6 mb-8 border border-white/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-gray-700 shrink-0">
                            {student?.profileImage ? (
                                <img src={student.profileImage} alt={student?.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                                    {student?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-bold text-white">{student?.name}</h2>
                            <p className="text-blue-300 text-sm">{student?.email}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-gray-400 text-sm">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.badge}`}>
                                {isInactive ? 'INACTIVE' : isPending ? 'PENDING' : 'ACTIVE'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-gray-400 text-sm">Seat Number</span>
                            <span className="text-white font-mono font-bold">{student?.seat?.number || 'Not Assigned'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-gray-400 text-sm">Membership ID</span>
                            <span className="text-white font-mono text-xs">{student?._id?.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-gray-400 text-sm">Monthly Fee</span>
                            <span className="text-white font-bold text-lg">₹{student?.seat?.price || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-400 text-sm">Joined</span>
                            <span className="text-white text-sm">{student?.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                    Back to Dashboard
                </button>
            </motion.div>
        </div>
    );
};

export default VerifyStudent;
