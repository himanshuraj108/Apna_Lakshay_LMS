import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader, { ProfileSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL } from '../../utils/api';
import { IoArrowBack, IoPerson, IoMail, IoCall, IoLocation, IoCalendar, IoTime, IoSave, IoCamera, IoTrash, IoCloudUpload, IoClose, IoHelpCircle, IoLogOut, IoQrCode, IoSend, IoLockClosed, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoBed as IoBedOutline, IoShieldCheckmark, IoChevronForward, IoDocumentTextOutline, IoReceiptOutline } from 'react-icons/io5';
import { QRCodeSVG } from 'qrcode.react';
import SeatChangeModal from '../../components/student/SeatChangeModal';
import CombinedSeatShiftModal from '../../components/student/CombinedSeatShiftModal';
import MotivationBanner from '../../components/student/MotivationBanner';
import useShifts from '../../hooks/useShifts';
import AdmissionForm from '../../components/admin/AdmissionForm';
import PaymentReceipt from '../../components/admin/PaymentReceipt';


const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    // ... existing hooks ...
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdmissionModal, setShowAdmissionModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [latestFee, setLatestFee] = useState(null);
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
        fetchFirstFee();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setProfile(response.data.user);
            updateUser(response.data.user);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFirstFee = async () => {
        try {
            const res = await api.get('/student/fees');
            const fees = res.data.fees || [];
            // pick the oldest paid fee (first fee)
            const paid = fees.filter(f => f.status === 'paid').sort((a, b) => new Date(a.paidDate) - new Date(b.paidDate));
            setLatestFee(paid[0] || fees[0] || null);
        } catch(e) { /* silent */ }
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
        active:  { label: 'Active Member',      color: 'from-green-400 to-emerald-500', border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-600', dot: 'bg-green-400' },
        pending: { label: 'Pending Allocation', color: 'from-yellow-400 to-amber-500',  border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-600', dot: 'bg-amber-400' },
        inactive:{ label: 'Inactive',           color: 'from-red-400 to-rose-500',      border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-500',  dot: 'bg-red-400' },
    }[memberStatus];

    const initials = (profile?.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const imgSrc = profile?.profileImage
        ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${BASE_URL}${profile.profileImage}`)
        : null;

    const InfoRow = ({ icon: Icon, label, value, color = 'text-gray-400' }) => (
        <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0 group">
            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 transition-colors">
                <Icon size={15} className={color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{label}</p>
                <p className="text-sm font-medium truncate mt-0.5" style={{ color: '#111827' }}>{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen overflow-x-hidden pb-16" style={{ background: '#F8FAFC', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            <style>{`
                @keyframes shimmerP{0%{background-position:200% center;}100%{background-position:-200% center;}}
                .shimmer-p{background:linear-gradient(90deg,#F97316,#FB923C,#FBBF24,#FB923C,#F97316);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmerP 4s linear infinite;}
            `}</style>
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* ── Content ── */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Top bar ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 flex-wrap gap-3">
                    <Link to="/student">
                        <motion.button whileHover={{ scale: 1.05, x: -3 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                            style={{ color: '#374151' }}
                        >
                            <IoArrowBack size={16} /> Back to Dashboard
                        </motion.button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-500 rounded-xl text-sm font-medium transition-all"
                        >
                            <IoLogOut size={15} /> Logout
                        </motion.button>
                    </div>
                </motion.div>

                {/* ── Toast alerts ── */}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm font-medium">
                        <IoCheckmarkCircleOutline size={18} /> {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 text-red-500 rounded-xl text-sm font-medium">
                        <IoCloseCircleOutline size={18} /> {error}
                    </motion.div>
                )}

                {/* ── Hero Profile Banner ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-white border border-gray-200 relative rounded-2xl overflow-hidden mb-6"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
                >
                    {/* Gradient banner */}
                    <div className="min-h-[7rem] relative flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' }}>
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #F97316, #FB923C, #FBBF24)' }} />
                        <div className="relative z-10 w-full pl-36 pr-6 py-4">
                            <MotivationBanner />
                        </div>
                    </div>

                    <div className="px-6 pb-6">
                        {/* Avatar */}
                        <div className="relative -mt-12 mb-4 flex items-end justify-between flex-wrap gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                                    {imgSrc ? (
                                        <img src={imgSrc} alt={profile?.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <IoPerson size={44} className="text-white/70" />
                                    )}
                                </div>
                                {/* Upload overlay */}
                                <label htmlFor="image-upload" className={`absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer transition-all group ${imgSrc ? 'bg-black/0 hover:bg-black/50' : 'bg-black/30 hover:bg-black/50'}`}>
                                    <IoCamera size={22} className={`text-white transition-opacity ${imgSrc ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`} />
                                </label>
                                <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                {memberStatus === 'active' && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" />
                                )}
                            </div>

                            <div className="flex gap-2">
                                {profile?.profileImage && (
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleImageDelete}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 rounded-lg text-xs font-medium transition-all"
                                    >
                                        <IoTrash size={13} /> Remove Photo
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <h1 className="shimmer-p text-3xl font-black">{profile?.name}</h1>
                                <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                                    <IoMail size={13} /> {profile?.email}
                                </p>
                                {/* Download buttons */}
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowAdmissionModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                        <IoDocumentTextOutline size={13} /> Download Admission Form
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => { fetchFirstFee(); setShowReceiptModal(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                        <IoReceiptOutline size={13} /> Download Receipt
                                    </motion.button>
                                </div>
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
                        className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center overflow-hidden relative"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #F97316, #FB923C, transparent)' }} />
                        <div className="flex items-center gap-2 mb-4 self-start">
                            <IoQrCode className="text-orange-400" size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Digital ID</span>
                        </div>

                        {profile?.isActive && profile?.seat ? (
                            <>
                                <div className="p-3 bg-white rounded-xl shadow-md border border-gray-100 mb-4">
                                    <QRCodeSVG
                                        value={JSON.stringify({ token: user.qrToken, id: user.id })}
                                        size={140} level="H" includeMargin={false}
                                    />
                                </div>
                                <p className="font-bold text-base" style={{ color: '#111827' }}>{user?.name}</p>
                                <p className="text-orange-500 text-xs mt-1 font-mono">
                                    {user?.qrToken ? '🔒 Secure Token Active' : 'Legacy ID Mode'}
                                </p>
                                <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>Scan for Entry / Exit</p>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-6">
                                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                                    <IoLockClosed size={28} style={{ color: '#D1D5DB' }} />
                                </div>
                                <p className="font-semibold text-sm" style={{ color: '#6B7280' }}>ID Unavailable</p>
                                <p className="text-xs mt-1.5 max-w-[140px] leading-relaxed" style={{ color: '#9CA3AF' }}>
                                    {memberStatus === 'inactive' ? 'Membership inactive' : 'Pending seat allocation'}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Info Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-white border border-gray-200 rounded-2xl p-5 md:col-span-2 relative overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1, transparent)' }} />
                        <div className="flex items-center gap-2 mb-4">
                            <IoPerson className="text-blue-500" size={16} />
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Profile Information</span>
                        </div>

                        <InfoRow icon={IoPerson}    label="Full Name"    value={profile?.name}                    color="text-purple-500" />
                        <InfoRow icon={IoMail}      label="Email Address" value={profile?.email}                  color="text-blue-500" />
                        <InfoRow icon={IoCall}      label="Phone Number"  value={profile?.mobile || 'Not provided'} color="text-green-500" />
                        <InfoRow icon={IoLocation}  label="Address"       value={profile?.address || 'Not provided'} color="text-orange-500" />
                        <InfoRow icon={IoBedOutline} label="Seat Number"  value={(profile?.seat?.roomId ? `${profile.seat.roomId} - ${profile.seatNumber || profile.seat.number}` : profile?.seatNumber) || 'Not Assigned'} color="text-cyan-500" />
                        <InfoRow icon={IoCalendar}  label="Member Since"
                            value={profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Not available'
                            } color="text-pink-500"
                        />
                    </motion.div>
                </div>

                {/* ── Change Requests ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl overflow-hidden mb-4 bg-white border border-gray-200 shadow-sm"
                >
                    {/* Panel header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-orange-50">
                            <IoSend size={12} className="text-orange-500" />
                        </div>
                        <p className="text-gray-900 font-bold text-sm">Request Changes</p>
                    </div>

                    <div className="p-4">
                    {profile?.isActive && profile?.seat ? (
                        <>
                            <div className="flex flex-col gap-2.5">
                                {/* Shift Change */}
                                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { setRequestType('shift'); fetchAvailableShifts(); setShowRequestModal(true); }}
                                    className="relative flex items-center gap-4 rounded-xl overflow-hidden cursor-pointer bg-blue-50 border border-blue-100 px-4 py-3.5"
                                >
                                    {/* Accent left line */}
                                    <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-blue-500" />
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-100/50">
                                        <IoTime size={17} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-bold text-sm">Request Shift Change</p>
                                        <p className="text-[12px] mt-0.5 text-blue-500">Change your study session timing</p>
                                    </div>
                                    <IoChevronForward size={16} className="text-gray-400 shrink-0" />
                                </motion.div>

                                {/* Seat Change */}
                                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowSeatChangeModal(true)}
                                    className="relative flex items-center gap-4 rounded-xl overflow-hidden cursor-pointer bg-purple-50 border border-purple-100 px-4 py-3.5"
                                >
                                    <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-purple-500" />
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-purple-100/50">
                                        <IoBedOutline size={17} className="text-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-bold text-sm">Request Seat Change</p>
                                        <p className="text-[12px] mt-0.5 text-purple-500">Move to a different seat</p>
                                    </div>
                                    <IoChevronForward size={16} className="text-gray-400 shrink-0" />
                                </motion.div>
                            </div>

                            <div className="mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                                <IoHelpCircle size={13} className="text-gray-400 shrink-0" />
                                <p className="text-gray-500 text-xs">Change requests need admin approval. You'll be notified once reviewed.</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gray-50 border border-gray-200">
                                <IoLockClosed size={20} className="text-gray-400" />
                            </div>
                            <p className="text-gray-700 font-semibold text-sm">Requests Unavailable</p>
                            <p className="text-gray-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                                {memberStatus === 'inactive'
                                    ? 'Your account is currently inactive. Please reactivate your membership.'
                                    : 'You are pending seat allocation. Requests will be available once a seat is assigned.'}
                            </p>
                        </div>
                    )}
                    </div>
                </motion.div>

                {/* ── Security Settings ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-200"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <IoShieldCheckmark size={13} className="text-red-500" />
                        </div>
                        <p className="font-bold text-sm" style={{ color: '#111827' }}>Security Settings</p>
                    </div>
                    <div className="p-4">
                        <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                            onClick={() => { setRequestType('password'); setShowRequestModal(true); }}
                            className="relative flex items-center gap-4 rounded-xl overflow-hidden cursor-pointer"
                            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', padding: '14px 16px' }}>
                            <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full" style={{ background: '#ef4444' }} />
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.08)' }}>
                                <IoLockClosed size={16} style={{ color: '#ef4444' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm" style={{ color: '#111827' }}>Change Password</p>
                                <p className="text-[12px] mt-0.5" style={{ color: '#f87171' }}>Update your login credentials</p>
                            </div>
                            <IoChevronForward size={16} style={{ color: '#9CA3AF' }} className="shrink-0" />
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* ── Request Modal ── */}
            <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}
                title={requestType === 'password' ? 'Change Password' : `Request ${requestType === 'shift' ? 'Shift' : 'Seat'} Change`}
            >
                <div className="space-y-4">
                    <p className="text-gray-500 text-sm mb-2">Describe your requested {requestType} change below:</p>

                    {requestType === 'shift' && (
                        <div>
                            {profile?.currentShift && (
                                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Current Shift</p>
                                    <p className="text-gray-900 font-bold">
                                        {shifts.find(s => s.id === profile.currentShift)?.name || profile.currentShift}
                                        <span className="text-sm text-gray-500 ml-2">({getShiftTimeRange(shifts.find(s => s.id === profile.currentShift) || { id: profile.currentShift })})</span>
                                    </p>
                                </div>
                            )}
                            {occupiedShifts.length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-600 font-bold mb-2">⚠️ Unavailable Shifts (Occupied)</p>
                                    {occupiedShifts.map((o, i) => (
                                        <div key={i} className="text-sm text-amber-800 mb-1">• {o.name} ({o.startTime} - {o.endTime}) - {o.occupiedBy}</div>
                                    ))}
                                </div>
                            )}
                            <label className="block text-sm font-medium mb-2">New Shift</label>
                            {loadingShifts ? (
                                <div className="flex items-center gap-2 py-4 bg-gray-50 border border-gray-200 rounded-lg px-4">
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                                    <span className="text-gray-500 text-sm">Loading shifts...</span>
                                </div>
                            ) : (
                                <select value={requestData.shift || ''} onChange={(e) => setRequestData({ shift: e.target.value })}
                                    className="input !text-gray-900 !bg-white !border-gray-300" disabled={loadingShifts || availableShifts.length === 0}
                                >
                                    <option value="">Select an available shift...</option>
                                    {availableShifts.length > 0
                                        ? availableShifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.startTime} - {s.endTime})</option>)
                                        : <option value="" disabled>No available shifts</option>
                                    }
                                </select>
                            )}
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs text-orange-600 font-semibold mb-2">💡 Looking for different options?</p>
                                <Button variant="primary" className="w-full !bg-gradient-to-r !from-orange-500 !to-amber-500 hover:!from-orange-400 hover:!to-amber-400 !border-none !text-white" onClick={() => { setShowRequestModal(false); setShowCombinedChangeModal(true); }}>
                                    Shift not available? Want to change seat? CLICK HERE
                                </Button>
                            </div>
                            {availableShifts.length === 0 && !loadingShifts && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">❌ No shifts available on your current seat (#{profile?.seat?.number || profile?.seat})</p>
                                </div>
                            )}
                            {availableShifts.length > 0 && !loadingShifts && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs text-green-600 font-bold mb-1">✓ {availableShifts.length} Available Shift{availableShifts.length !== 1 ? 's' : ''}</p>
                                    <p className="text-sm text-gray-600">Select one to submit your request.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {requestType === 'seat' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Reason for Change</label>
                            <textarea value={requestData.reason || ''} onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                className="input !text-gray-900 !bg-white !border-gray-300 min-h-[100px]" placeholder="Please explain why you need a seat change..."
                            />
                        </div>
                    )}

                    {requestType === 'password' && (
                        <div className="space-y-4">
                            {[['currentPassword', 'Current Password', 'Enter current password'], ['newPassword', 'New Password', 'Enter new password'], ['confirmPassword', 'Confirm New Password', 'Confirm new password']].map(([field, label, ph]) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium mb-2">{label}</label>
                                    <input type="password" className="input !text-gray-900 !bg-white !border-gray-300" placeholder={ph} onChange={(e) => setRequestData({ ...requestData, [field]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="primary" onClick={submitRequest} className="flex-1 !bg-gradient-to-r !from-orange-500 !to-amber-500 hover:!from-orange-400 hover:!to-amber-400 !border-none !text-white" disabled={submittingRequest}>
                            {submittingRequest ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Submitting...</>) : 'Submit Request'}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowRequestModal(false)} className="flex-1 !bg-gray-100 !text-gray-700 !border-gray-300 hover:!bg-gray-200">Cancel</Button>
                    </div>
                </div>
            </Modal>

            <SeatChangeModal isOpen={showSeatChangeModal} onClose={() => setShowSeatChangeModal(false)} currentSeat={profile?.seat}
                onSuccess={() => { setSuccess('Seat change request submitted!'); setTimeout(() => setSuccess(''), 3000); fetchProfile(); }}
            />
            <CombinedSeatShiftModal isOpen={showCombinedChangeModal} onClose={() => setShowCombinedChangeModal(false)} currentSeat={profile?.seat}
                onSuccess={() => { setShowCombinedChangeModal(false); fetchProfile(); setSuccess('Combined request submitted!'); setTimeout(() => setSuccess(''), 3000); }}
            />

            {/* ── Admission Form Modal ── */}
            <AnimatePresence>
                {showAdmissionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowAdmissionModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-3xl my-6 shadow-xl"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                                        <IoDocumentTextOutline size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Admission Form</h3>
                                        <p className="text-xs text-gray-500">Apna Lakshya Library — Download your form</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowAdmissionModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <IoClose size={18} />
                                </motion.button>
                            </div>

                            {/* Scrollable form area */}
                            <div className="overflow-x-auto">
                                <AdmissionForm profile={profile} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ── Receipt Modal ── */}
            <AnimatePresence>
                {showReceiptModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                        onClick={() => setShowReceiptModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-2xl my-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-gradient-to-br from-rose-600 to-red-600 rounded-xl">
                                        <IoReceiptOutline size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Payment Receipt</h3>
                                        <p className="text-xs text-gray-500">Apna Lakshya Library</p>
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowReceiptModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                                >
                                    <IoClose size={18} />
                                </motion.button>
                            </div>
                            <div className="overflow-x-auto flex justify-center">
                                {latestFee ? (
                                    <PaymentReceipt student={profile} fee={latestFee} slNo={1} />
                                ) : (
                                    <div className="py-10 text-center text-gray-500">
                                        <IoReceiptOutline size={36} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No fee records found yet.</p>
                                        <p className="text-xs mt-1 text-gray-600">Receipts appear here after your first payment is recorded.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Profile;
