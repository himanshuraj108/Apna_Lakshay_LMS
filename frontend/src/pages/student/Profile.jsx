import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader, { ProfileSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL } from '../../utils/api';
import { IoArrowBack, IoPerson, IoMail, IoCall, IoLocation, IoCalendar, IoTime, IoSave, IoCamera, IoTrash, IoCloudUpload, IoClose, IoHelpCircle, IoLogOut, IoQrCode, IoSend, IoLockClosed, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoBed as IoBedOutline, IoShieldCheckmark } from 'react-icons/io5';
import { QRCodeSVG } from 'qrcode.react';
import SeatChangeModal from '../../components/student/SeatChangeModal';
import CombinedSeatShiftModal from '../../components/student/CombinedSeatShiftModal';
import MotivationBanner from '../../components/student/MotivationBanner';
import useShifts from '../../hooks/useShifts';


const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    // ... existing hooks ...
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState('shift');
    const [requestData, setRequestData] = useState({});
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showSeatChangeModal, setShowSeatChangeModal] = useState(false);
    const [showCombinedChangeModal, setShowCombinedChangeModal] = useState(false);
    const [availableShifts, setAvailableShifts] = useState([]);
    const [occupiedShifts, setOccupiedShifts] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setProfile(response.data.user);
            updateUser(response.data.user); // Sync with global context
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation - max 4MB, images only
        if (file.size > 4 * 1024 * 1024) {
            setError('File size must be less than 4MB');
            setTimeout(() => setError(''), 3000);
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            await api.post('/student/profile/image', formData);
            setSuccess('Profile image uploaded successfully!');
            fetchProfile();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to upload image');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleImageDelete = async () => {
        try {
            await api.delete('/student/profile/image');
            setSuccess('Profile image removed successfully!');
            fetchProfile(); // This now calls updateUser internally
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to delete image');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchAvailableShifts = async () => {
        console.log('🔍 Fetching available shifts...', { hasSeat: !!profile?.seat, seatNumber: profile?.seat });

        if (!profile?.seat) {
            console.warn('❌ No seat assigned, cannot fetch shifts');
            return;
        }

        setLoadingShifts(true);
        try {
            const response = await api.get('/student/available-shifts');
            console.log('✅ Available shifts response:', response.data);
            setAvailableShifts(response.data.availableShifts || []);
            setOccupiedShifts(response.data.occupiedShifts || []);
            console.log('📊 State updated:', {
                availableCount: response.data.availableShifts?.length || 0,
                occupiedCount: response.data.occupiedShifts?.length || 0
            });
        } catch (error) {
            console.error('❌ Error fetching available shifts:', error);
            setError('Failed to load shift availability');
            setTimeout(() => setError(''), 3000);
        } finally {
            setLoadingShifts(false);
        }
    };

    const [submittingRequest, setSubmittingRequest] = useState(false);

    const submitRequest = async () => {
        setSubmittingRequest(true);
        try {
            if (requestType === 'password') {
                if (requestData.newPassword !== requestData.confirmPassword) {
                    setError('Passwords do not match');
                    setTimeout(() => setError(''), 3000);
                    setSubmittingRequest(false);
                    return;
                }
                await api.put('/student/password', {
                    currentPassword: requestData.currentPassword,
                    newPassword: requestData.newPassword
                });
                setSuccess('Password changed successfully!');
            } else {
                await api.post('/student/request', {
                    type: requestType,
                    requestedData: requestData
                });
                setSuccess('Change request submitted successfully!');
            }

            setShowRequestModal(false);
            setRequestData({});
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Operation failed');
            setTimeout(() => setError(''), 3000);
        } finally {
            setSubmittingRequest(false);
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }


    // ─── derived ──────────────────────────────────────────────────────
    const memberStatus = !profile?.isActive ? 'inactive' : !profile?.seat ? 'pending' : 'active';
    const statusConfig = {
        active: { label: 'Active Member', color: 'from-green-400 to-emerald-500', border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
        pending: { label: 'Pending Allocation', color: 'from-yellow-400 to-amber-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
        inactive: { label: 'Inactive', color: 'from-red-400 to-rose-500', border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
    }[memberStatus];

    const initials = (profile?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const imgSrc = profile?.profileImage
        ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${BASE_URL}${profile.profileImage}`)
        : null;

    const InfoRow = ({ icon: Icon, label, value, color = 'text-gray-400' }) => (
        <div className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0 group">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{label}</p>
                <p className="text-sm text-gray-200 font-medium truncate mt-0.5">{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen overflow-x-hidden pb-16" style={{ background: '#050508' }}>
            {/* ── Animated background orbs ── */}
            <style>{`
                @keyframes orbA{0%,100%{transform:translate(0,0) scale(1);}40%{transform:translate(35px,-45px) scale(1.1);}70%{transform:translate(-20px,15px) scale(0.95);}}
                @keyframes orbB{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-30px,30px) scale(1.12);}}
                @keyframes shimmerP{0%{background-position:200% center;}100%{background-position:-200% center;}}
                .shimmer-p{background:linear-gradient(90deg,#a78bfa,#60a5fa,#34d399,#60a5fa,#a78bfa);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerP 4s linear infinite;}
                .glass-card{background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.07);}
            `}</style>
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div style={{ animation: 'orbA 14s ease-in-out infinite' }} className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
                <div style={{ animation: 'orbB 17s ease-in-out infinite' }} className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-blue-600/7 blur-3xl" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Top bar ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-3">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05, x: -3 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            <IoArrowBack size={16} /> Back to Dashboard
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-sm font-medium transition-all"
                        >
                            <IoLogOut size={15} /> Logout
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Toast alerts ── */}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl text-sm font-medium">
                        <IoCheckmarkCircleOutline size={18} /> {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-sm font-medium">
                        <IoCloseCircleOutline size={18} /> {error}
                    </motion.div>
                )}

                {/* ── Hero Profile Banner ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="glass-card relative rounded-2xl overflow-hidden mb-6"
                >
                    {/* Gradient banner */}
                    <div className="min-h-[7rem] bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-blue-600/30 relative flex flex-col justify-center">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(139,92,246,0.3), transparent 60%), radial-gradient(circle at 70% 50%, rgba(59,130,246,0.2), transparent 60%)' }} />
                        <div className="relative z-10 w-full pl-36 pr-6 py-4">
                            <MotivationBanner />
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        {/* Avatar */}
                        <div className="relative -mt-12 mb-4 flex items-end justify-between flex-wrap gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-gray-950 shadow-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                    {imgSrc ? (
                                        <img src={imgSrc} alt={profile?.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <IoPerson size={44} className="text-white/40" />
                                    )}
                                </div>
                                {/* Upload overlay */}
                                <label htmlFor="image-upload" className={`absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer transition-all group ${imgSrc ? 'bg-black/0 hover:bg-black/50' : 'bg-black/30 hover:bg-black/50'}`}>
                                    <IoCamera size={22} className={`text-white transition-opacity ${imgSrc ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} />
                                </label>
                                <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                {memberStatus === 'active' && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-950 shadow" />
                                )}
                            </div>

                            <div className="flex gap-2">
                                {profile?.profileImage && (
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleImageDelete}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all"
                                    >
                                        <IoTrash size={13} /> Remove Photo
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <h1 className="shimmer-p text-3xl font-black">{profile?.name}</h1>
                                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                                    <IoMail size={13} /> {profile?.email}
                                </p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} border ${statusConfig.border}`}>
                                <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
                                <span className={`text-xs font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

                    {/* QR / ID Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass-card rounded-2xl p-5 flex flex-col items-center text-center overflow-hidden relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                        <div className="flex items-center gap-2 mb-4 self-start">
                            <IoQrCode className="text-violet-400" size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Digital ID</span>
                        </div>

                        {profile?.isActive && profile?.seat ? (
                            <>
                                <div className="p-3 bg-white rounded-xl shadow-2xl shadow-violet-500/20 mb-4">
                                    <QRCodeSVG
                                        value={JSON.stringify({ token: user.qrToken, id: user.id })}
                                        size={140} level="H" includeMargin={false}
                                    />
                                </div>
                                <p className="text-white font-bold text-base">{user?.name}</p>
                                <p className="text-violet-400 text-xs mt-1 font-mono">
                                    {user?.qrToken ? '🔒 Secure Token Active' : 'Legacy ID Mode'}
                                </p>
                                <p className="text-gray-600 text-xs mt-3">Scan for Entry / Exit</p>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-6">
                                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <IoLockClosed size={28} className="text-gray-600" />
                                </div>
                                <p className="text-gray-400 font-semibold text-sm">ID Unavailable</p>
                                <p className="text-gray-600 text-xs mt-1.5 max-w-[140px] leading-relaxed">
                                    {memberStatus === 'inactive' ? 'Membership inactive' : 'Pending seat allocation'}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Info Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="glass-card rounded-2xl p-5 md:col-span-2 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                        <div className="flex items-center gap-2 mb-4">
                            <IoPerson className="text-blue-400" size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Profile Information</span>
                        </div>

                        <InfoRow icon={IoPerson} label="Full Name" value={profile?.name} color="text-purple-400" />
                        <InfoRow icon={IoMail} label="Email Address" value={profile?.email} color="text-blue-400" />
                        <InfoRow icon={IoCall} label="Phone Number" value={profile?.mobile || 'Not provided'} color="text-green-400" />
                        <InfoRow icon={IoLocation} label="Address" value={profile?.address || 'Not provided'} color="text-orange-400" />
                        <InfoRow icon={IoBedOutline} label="Seat Number" value={profile?.seatNumber || 'Not Assigned'} color="text-cyan-400" />
                        <InfoRow icon={IoCalendar} label="Member Since"
                            value={profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Not available'
                            } color="text-pink-400"
                        />
                    </motion.div>
                </div>

                {/* ── Change Requests ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-5 mb-5 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                    <div className="flex items-center gap-2 mb-5">
                        <IoSend className="text-orange-400" size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Request Changes</h3>
                    </div>

                    {profile?.isActive && profile?.seat ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setRequestType('shift'); fetchAvailableShifts(); setShowRequestModal(true); }}
                                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                                >
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30">
                                        <IoTime size={18} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold text-sm">Request Shift Change</p>
                                        <p className="text-blue-400 text-xs mt-0.5">Change your study session timing</p>
                                    </div>
                                </motion.button>

                                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowSeatChangeModal(true)}
                                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all"
                                >
                                    <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg shadow-purple-500/30">
                                        <IoBedOutline size={18} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-semibold text-sm">Request Seat Change</p>
                                        <p className="text-purple-400 text-xs mt-0.5">Move to a different seat</p>
                                    </div>
                                </motion.button>
                            </div>

                            <div className="mt-4 flex items-start gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                                <IoHelpCircle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Change requests need admin approval. You'll be notified once reviewed.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                                <IoLockClosed size={24} className="text-gray-600" />
                            </div>
                            <p className="text-gray-400 font-semibold">Requests Unavailable</p>
                            <p className="text-gray-600 text-sm mt-1.5 max-w-xs leading-relaxed">
                                {memberStatus === 'inactive'
                                    ? 'Your account is currently inactive. Please reactivate your membership.'
                                    : 'You are pending seat allocation. Requests will be available once a seat is assigned.'}
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* ── Security Settings ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="glass-card rounded-2xl p-5 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                    <div className="flex items-center gap-2 mb-5">
                        <IoShieldCheckmark className="text-red-400" size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Security Settings</h3>
                    </div>

                    <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setRequestType('password'); setShowRequestModal(true); }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 hover:border-red-400/40 hover:shadow-xl hover:shadow-red-500/10 transition-all w-full sm:w-auto"
                    >
                        <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/30">
                            <IoLockClosed size={18} className="text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-white font-semibold text-sm">Change Password</p>
                            <p className="text-red-400 text-xs mt-0.5">Update your login credentials</p>
                        </div>
                    </motion.button>
                </motion.div>
            </div>

            {/* ── Request Modal ── */}
            <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}
                title={requestType === 'password' ? 'Change Password' : `Request ${requestType === 'shift' ? 'Shift' : 'Seat'} Change`}
            >
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Describe your requested {requestType} change below:</p>

                    {requestType === 'shift' && (
                        <div>
                            {profile?.currentShift && (
                                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Current Shift</p>
                                    <p className="text-white font-bold">
                                        {shifts.find(s => s.id === profile.currentShift)?.name || profile.currentShift}
                                        <span className="text-sm text-gray-400 ml-2">({getShiftTimeRange(shifts.find(s => s.id === profile.currentShift) || { id: profile.currentShift })})</span>
                                    </p>
                                </div>
                            )}
                            {occupiedShifts.length > 0 && (
                                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <p className="text-xs text-yellow-500 font-semibold mb-2">⚠️ Unavailable Shifts (Occupied)</p>
                                    {occupiedShifts.map((o, i) => (
                                        <div key={i} className="text-sm text-gray-400 mb-1">• {o.name} ({o.startTime} - {o.endTime}) - {o.occupiedBy}</div>
                                    ))}
                                </div>
                            )}
                            <label className="block text-sm font-medium mb-2">New Shift</label>
                            {loadingShifts ? (
                                <div className="flex items-center gap-2 py-4 bg-gray-800/30 border border-gray-700 rounded-lg px-4">
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                                    <span className="text-gray-400 text-sm">Loading shifts...</span>
                                </div>
                            ) : (
                                <select value={requestData.shift || ''} onChange={(e) => setRequestData({ shift: e.target.value })}
                                    className="input" disabled={loadingShifts || availableShifts.length === 0}
                                >
                                    <option value="">Select an available shift...</option>
                                    {availableShifts.length > 0
                                        ? availableShifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime} - {s.endTime})</option>)
                                        : <option value="" disabled>No available shifts</option>
                                    }
                                </select>
                            )}
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-xs text-blue-400 mb-2">💡 Looking for different options?</p>
                                <Button variant="primary" className="w-full" onClick={() => { setShowRequestModal(false); setShowCombinedChangeModal(true); }}>
                                    Shift not available? Want to change seat? CLICK HERE
                                </Button>
                            </div>
                            {availableShifts.length === 0 && !loadingShifts && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-sm text-red-400">❌ No shifts available on your current seat (#{profile?.seat?.number || profile?.seat})</p>
                                </div>
                            )}
                            {availableShifts.length > 0 && !loadingShifts && (
                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <p className="text-xs text-green-500 font-semibold mb-1">✓ {availableShifts.length} Available Shift{availableShifts.length !== 1 ? 's' : ''}</p>
                                    <p className="text-sm text-gray-400">Select one to submit your request.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {requestType === 'seat' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Reason for Change</label>
                            <textarea value={requestData.reason || ''} onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                className="input min-h-[100px]" placeholder="Please explain why you need a seat change..."
                            />
                        </div>
                    )}

                    {requestType === 'password' && (
                        <div className="space-y-4">
                            {[['currentPassword', 'Current Password', 'Enter current password'], ['newPassword', 'New Password', 'Enter new password'], ['confirmPassword', 'Confirm New Password', 'Confirm new password']].map(([field, label, ph]) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium mb-2">{label}</label>
                                    <input type="password" className="input" placeholder={ph} onChange={(e) => setRequestData({ ...requestData, [field]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="primary" onClick={submitRequest} className="flex-1" disabled={submittingRequest}>
                            {submittingRequest ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Submitting...</>) : 'Submit Request'}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowRequestModal(false)} className="flex-1">Cancel</Button>
                    </div>
                </div>
            </Modal>

            <SeatChangeModal isOpen={showSeatChangeModal} onClose={() => setShowSeatChangeModal(false)} currentSeat={profile?.seat}
                onSuccess={() => { setSuccess('Seat change request submitted!'); setTimeout(() => setSuccess(''), 3000); fetchProfile(); }}
            />
            <CombinedSeatShiftModal isOpen={showCombinedChangeModal} onClose={() => setShowCombinedChangeModal(false)} currentSeat={profile?.seat}
                onSuccess={() => { setShowCombinedChangeModal(false); fetchProfile(); setSuccess('Combined request submitted!'); setTimeout(() => setSuccess(''), 3000); }}
            />
        </div >
    );
};

export default Profile;
