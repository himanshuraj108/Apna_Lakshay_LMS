import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader, { ProfileSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL, getDeterministicAvatar } from '../../utils/api';
import { IoArrowBack, IoPerson, IoMail, IoCall, IoLocation, IoCalendar, IoTime, IoSave, IoCamera, IoTrash, IoCloudUpload, IoClose, IoHelpCircle, IoLogOut, IoQrCode, IoSend, IoLockClosed, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoBed as IoBedOutline, IoShieldCheckmark, IoChevronForward, IoDocumentTextOutline, IoReceiptOutline, IoMaleFemale, IoSparkles } from 'react-icons/io5';
import { QRCodeSVG } from 'qrcode.react';
import SeatChangeModal from '../../components/student/SeatChangeModal';
import CombinedSeatShiftModal from '../../components/student/CombinedSeatShiftModal';
import MotivationBanner from '../../components/student/MotivationBanner';
import useShifts from '../../hooks/useShifts';
import AdmissionForm from '../../components/admin/AdmissionForm';
import PaymentReceipt from '../../components/admin/PaymentReceipt';


const EXAM_TARGETS = [
    { value: 'ssc_cgl', label: 'SSC CGL' },
    { value: 'ssc_chsl', label: 'SSC CHSL' },
    { value: 'ssc_gd', label: 'SSC GD Constable' },
    { value: 'ssc_mts', label: 'SSC MTS' },
    { value: 'ssc_cpo', label: 'SSC CPO' },
    { value: 'upsc_cse', label: 'UPSC CSE' },
    { value: 'upsc_cds', label: 'UPSC CDS' },
    { value: 'ibps_po', label: 'IBPS PO' },
    { value: 'ibps_clerk', label: 'IBPS Clerk' },
    { value: 'sbi_po', label: 'SBI PO' },
    { value: 'sbi_clerk', label: 'SBI Clerk' },
    { value: 'rrb_ntpc', label: 'RRB NTPC' },
    { value: 'jee_main', label: 'JEE Main' },
    { value: 'neet_ug', label: 'NEET UG' },
    { value: 'generic', label: 'General Aptitude & Knowledge' }
];

// Dynamic gender-specific study avatars are loaded inside the component

const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const selectRef = useRef(null);
    const [pulseHighlight, setPulseHighlight] = useState(false);
    const [showQrZoom, setShowQrZoom] = useState(false);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
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
    const [streakStats, setStreakStats] = useState(null);
    const [loadingStreak, setLoadingStreak] = useState(true);
    const [coverQuote, setCoverQuote] = useState({ content: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" });


    const getStudyAvatars = () => {
        const gender = (profile?.gender || 'male').toLowerCase();
        if (gender === 'female') {
            return Array.from({ length: 10 }, (_, i) => `/uploads/avatars/avatar_female${i + 1}.svg`);
        } else if (gender === 'other') {
            return Array.from({ length: 10 }, (_, i) => 
                i % 2 === 0 
                    ? `/uploads/avatars/avatar_female${i + 1}.svg`
                    : `/uploads/avatars/avatar_male${i + 1}.svg`
            );
        } else {
            return Array.from({ length: 10 }, (_, i) => `/uploads/avatars/avatar_male${i + 1}.svg`);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchFirstFee();
        fetchStreakStats();

        // Choose random motivation quote for card cover
        const quotes = [
            { content: "The expert in anything was once a beginner.", author: "Helen Hayes" },
            { content: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
            { content: "Strive for progress, not perfection.", author: "Unknown" },
            { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
            { content: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
            { content: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
            { content: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" }
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setCoverQuote(randomQuote);
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('focus') === 'examTarget') {
            if (profile) {
                const timer = setTimeout(() => {
                    if (selectRef.current) {
                        selectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        selectRef.current.focus();
                        setPulseHighlight(true);
                        // Turn off pulse highlight after 6 seconds
                        setTimeout(() => setPulseHighlight(false), 6000);
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [location.search, profile]);

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

    const fetchStreakStats = async () => {
        try {
            const res = await api.get('/student/engagement/streak-stats');
            if (res.data.success) setStreakStats(res.data.stats);
        } catch(e) { /* silent */ } finally {
            setLoadingStreak(false);
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

    const handleExamTargetChange = async (e) => {
        const newTarget = e.target.value;
        try {
            const response = await api.put('/student/profile', { examTarget: newTarget });
            setProfile(prev => ({ ...prev, ...response.data.user }));
            updateUser(response.data.user);
            setSuccess('Exam target updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update exam target');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleAvatarChange = async (avatarPath) => {
        try {
            const response = await api.put('/student/profile', { avatar: avatarPath });
            setProfile(prev => ({ ...prev, ...response.data.user }));
            updateUser(response.data.user);
            setSuccess('Avatar updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update avatar');
            setTimeout(() => setError(''), 3000);
        }
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
    const imgSrc = (() => {
        const img = (!profile?.profileImage || profile.profileImage === '/uploads/avatars/avatar1.svg')
            ? getDeterministicAvatar(profile?._id || profile?.id, profile?.gender)
            : profile.profileImage;
        return img.startsWith('http') ? img : `${BASE_URL}${img}`;
    })();
    const isDefaultAvatar = !profile?.profileImage || profile.profileImage.startsWith('/uploads/avatars/');

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

                {/* ── Center aligned Top Bar and Redesigned Profile Card ── */}
                <div className="w-full max-w-[420px] mx-auto mb-8">
                    {/* ── Top bar ── */}
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-3">
                        <Link to="/student">
                            <motion.button whileHover={{ scale: 1.03, x: -2 }} whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-[20px] text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm text-gray-700"
                            >
                                <IoArrowBack size={16} /> Back to Dashboard
                            </motion.button>
                        </Link>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
                            className="flex items-center justify-center w-12 h-12 bg-[#FFF2F2] hover:bg-[#FFE5E5] border border-[#FFE0E0] hover:border-[#FFCCCC] text-red-500 rounded-[18px] transition-all shadow-sm"
                        >
                            <IoLogOut size={20} />
                        </motion.button>
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

                    {/* ── Redesigned Premium Profile Card (Like Screenshot Mockup) ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-white border border-gray-200 relative rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                        {/* Orange/Yellow Gradient stripe and Motivation Quote Cover */}
                        <div className="h-32 relative overflow-hidden bg-gradient-to-br from-[#FEF6EB] to-[#FFF9F2] flex items-center px-4 sm:px-8 select-none">
                            {/* Gradient thin top stripe */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300" />
                            
                            {/* Decorative grid pattern overlay */}
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_#F39C12_1px,_transparent_0)] bg-[size:16px_16px]" />
                            
                            {/* Responsive Motivation Quote (Restricted to right side to avoid avatar overlap) */}
                            <div className="relative z-10 flex gap-3 items-center ml-auto max-w-[calc(100%-120px)] sm:max-w-md pr-2">
                                {/* Sparkle Icon (hidden on extra small mobile screens) */}
                                <div className="shrink-0 p-2 rounded-xl bg-orange-100/80 border border-orange-200/60 text-orange-600 shadow-sm hidden xs:flex">
                                    <IoSparkles size={16} className="animate-pulse" />
                                </div>
                                
                                {/* Quote Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-800 text-[10px] sm:text-xs italic leading-relaxed font-semibold">
                                        "{coverQuote.content}"
                                    </p>
                                    <p className="text-orange-600 text-[8px] sm:text-[10px] font-bold mt-0.5 tracking-wide uppercase">
                                        — {coverQuote.author}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 pb-8 relative">
                            {/* Avatar & Remove Photo Button */}
                            <div className="flex items-start justify-between gap-4 -mt-14 mb-6">
                                <div className="relative shrink-0 z-10">
                                    <div className="w-28 h-28 rounded-[24px] overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                                        {imgSrc ? (
                                            <img 
                                                src={imgSrc} 
                                                alt={profile?.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.removeAttribute('crossorigin');
                                                    e.target.src = getDeterministicAvatar(profile?._id || profile?.id, profile?.gender);
                                                }}
                                            />
                                        ) : (
                                            <IoPerson size={44} className="text-white/70" />
                                        )}
                                    </div>
                                    {/* Upload overlay clickable area */}
                                    <label htmlFor="image-upload" className="absolute inset-0 flex items-center justify-center rounded-[20px] cursor-pointer transition-all group hover:bg-black/45 bg-transparent">
                                        <IoCamera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </label>
                                    <input type="file" id="image-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    
                                    {/* Green Active Dot */}
                                    {memberStatus === 'active' && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2ECC71] rounded-full border-4 border-white shadow-md z-20" />
                                    )}
                                </div>

                                <div className="pt-16">
                                    {profile?.profileImage && !isDefaultAvatar ? (
                                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleImageDelete}
                                            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#E53E3E] rounded-full text-xs font-bold transition-all shadow-sm"
                                        >
                                            <IoTrash size={14} /> Remove Photo
                                        </motion.button>
                                    ) : (
                                        <label htmlFor="image-upload" className="flex items-center gap-1.5 px-4 py-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">
                                            <IoCloudUpload size={14} /> Upload Photo
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Name, Email and Actions */}
                            <div className="text-left">
                                <h1 className="text-3xl font-extrabold tracking-tight text-[#E28743] uppercase mb-1 leading-tight font-sans">
                                    {profile?.name}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-400 mb-6">
                                    <IoMail size={16} />
                                    <span className="text-sm font-medium text-gray-500">{profile?.email}</span>
                                </div>

                                <div className="flex flex-col gap-3.5">
                                    {/* Download Admission Form */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowAdmissionModal(true)}
                                        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-2xl text-sm font-bold transition-all shadow-sm"
                                    >
                                        <IoDocumentTextOutline size={18} /> Download Admission Form
                                    </motion.button>

                                    {/* Download Receipt */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => { fetchFirstFee(); setShowReceiptModal(true); }}
                                        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#D3524A] hover:bg-[#C0392B] text-white rounded-2xl text-sm font-bold transition-all shadow-sm"
                                    >
                                        <IoReceiptOutline size={18} /> Download Receipt
                                    </motion.button>

                                    {/* Dynamic Active/Pending/Inactive Badge */}
                                    <div className={`w-full flex items-center justify-center gap-2.5 py-3.5 ${
                                        memberStatus === 'active' ? 'bg-[#EAFBF1] border-[#D5F5E3] text-[#27AE60]' :
                                        memberStatus === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                        'bg-red-50 border-red-200 text-red-500'
                                    } border rounded-2xl text-sm font-bold shadow-sm`}>
                                        <span className={`w-2.5 h-2.5 rounded-full ${
                                            memberStatus === 'active' ? 'bg-[#2ECC71]' :
                                            memberStatus === 'pending' ? 'bg-amber-400' :
                                            'bg-red-400'
                                        }`} />
                                        {statusConfig.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Avatar Selection Grid ── */}
                {isDefaultAvatar && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 relative overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24, transparent)' }} />
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 animate-pulse">
                                <IoPerson size={13} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Choose Your Study Avatar</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Select one of the premium study-themed face avatars below. If you upload your own profile photo, this list will be hidden.
                        </p>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                            {getStudyAvatars().map((avatarPath, index) => {
                                const isSelected = profile?.profileImage === avatarPath;
                                const avatarUrl = `${BASE_URL}${avatarPath}`;
                                return (
                                    <motion.button
                                        key={avatarPath}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAvatarChange(avatarPath)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 flex items-center justify-center ${
                                            isSelected
                                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-md shadow-orange-500/10'
                                                : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/20'
                                        }`}
                                        title={`Study Avatar ${index + 1}`}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={`Avatar ${index + 1}`}
                                            className="w-full h-full object-contain rounded-lg"
                                            crossOrigin="anonymous"
                                        />
                                        {isSelected && (
                                            <div className="absolute bottom-1 right-1 bg-orange-500 text-white rounded-full p-0.5 shadow-sm flex items-center justify-center w-4 h-4 z-10">
                                                <IoCheckmarkCircleOutline size={12} className="text-white" />
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

                    {/* ── Flip ID Card ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="flex flex-col items-center"
                        style={{ perspective: '1000px' }}
                    >
                        <style>{`
                            .id-card-wrap { width: 280px; height: 175px; position: relative; cursor: pointer; }
                            .id-card-wrap:hover .id-card-inner { box-shadow: 0 20px 60px rgba(0,0,0,0.45); }
                            .id-card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.65s cubic-bezier(0.4,0.2,0.2,1), box-shadow 0.3s; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.28); }
                            .id-card-inner.flipped { transform: rotateY(180deg); }
                            .id-card-face { position: absolute; inset: 0; border-radius: 14px; backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; }
                            .id-card-back { transform: rotateY(180deg); }
                            .id-card-shine { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(255,255,255,0.06) 100%); pointer-events: none; border-radius: 14px; }
                            .id-card-pattern { position: absolute; inset: 0; opacity: 0.06; background-image: repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%); background-size: 8px 8px; pointer-events: none; }
                        `}</style>

                        <div className="id-card-wrap" onClick={() => setIsCardFlipped(f => !f)}>
                            <div className={`id-card-inner${isCardFlipped ? ' flipped' : ''}`}>

                                {/* ── FRONT ── */}
                                <div className="id-card-face" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 40%, #2d1060 100%)' }}>
                                    <div className="id-card-pattern" />
                                    <div className="id-card-shine" />
                                    {/* Orange accent top stripe */}
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#F97316,#FBBF24,#F97316)' }} />

                                    {/* Header */}
                                    <div style={{ position:'absolute', top:'10px', left:'12px', right:'12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                        <div>
                                            <p style={{ fontSize:'8px', fontWeight:900, color:'#F97316', letterSpacing:'0.15em', textTransform:'uppercase', margin:0 }}>APNA LAKSHYA</p>
                                            <p style={{ fontSize:'6px', color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>Library Member Card</p>
                                        </div>
                                        <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:'linear-gradient(135deg,#F97316,#FB923C)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <IoShieldCheckmark size={12} style={{ color:'#fff' }} />
                                        </div>
                                    </div>

                                    {/* Main content row */}
                                    <div style={{ position:'absolute', top:'34px', left:'12px', right:'12px', bottom:'28px', display:'flex', alignItems:'center', gap:'10px' }}>
                                        {/* Left: avatar + info */}
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'linear-gradient(135deg,#F97316,#FBBF24)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'6px', border:'2px solid rgba(255,255,255,0.2)', overflow:'hidden' }}>
                                                {imgSrc ? (
                                                    <img src={imgSrc} alt={profile?.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                ) : (
                                                    <IoPerson size={18} style={{ color:'#fff' }} />
                                                )}
                                            </div>
                                            <p style={{ fontSize:'9px', fontWeight:900, color:'#ffffff', letterSpacing:'0.04em', margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.name}</p>
                                            <p style={{ fontSize:'6px', color:'rgba(255,255,255,0.45)', margin:'0 0 3px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.email}</p>
                                            <p style={{ fontSize:'6px', color:'rgba(255,255,255,0.35)', margin:0, fontFamily:'monospace', letterSpacing:'0.08em' }}>
                                                AL-{(profile?._id || profile?.id || '').slice(-6).toUpperCase()}
                                            </p>
                                            {/* Status badge */}
                                            <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', background: profile?.isActive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', border:`1px solid ${profile?.isActive ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`, borderRadius:'99px', padding:'2px 7px', marginTop:'5px' }}>
                                                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: profile?.isActive ? '#4ade80' : '#f87171', display:'inline-block', boxShadow: profile?.isActive ? '0 0 5px #4ade80' : 'none' }} />
                                                <span style={{ fontSize:'6px', fontWeight:800, color: profile?.isActive ? '#4ade80' : '#f87171', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                                                    {profile?.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: QR code */}
                                        {profile?.isActive && profile?.seat ? (
                                            <div
                                                onClick={e => { e.stopPropagation(); setShowQrZoom(true); }}
                                                title="Tap to zoom QR"
                                                style={{ background:'#ffffff', borderRadius:'8px', padding:'5px', boxShadow:'0 4px 12px rgba(0,0,0,0.4)', flexShrink:0, cursor:'zoom-in', position:'relative' }}
                                            >
                                                <QRCodeSVG
                                                    value={JSON.stringify({ token: user?.qrToken, id: user?.id || user?._id })}
                                                    size={62} level="H" includeMargin={false}
                                                />
                                                <div style={{ position:'absolute', bottom:'-3px', right:'-3px', background:'#F97316', borderRadius:'50%', width:'14px', height:'14px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }}>
                                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/><path d="M11 8v6M8 11h6" strokeLinecap="round"/></svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ width:'72px', height:'72px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                <IoLockClosed size={20} style={{ color:'rgba(255,255,255,0.25)' }} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom row */}
                                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'24px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', background:'rgba(0,0,0,0.2)' }}>
                                        <span style={{ fontSize:'6px', color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                                            {profile?.seat ? `Seat: ${profile.seatNumber || profile.seat?.number || profile.seat}` : 'No Seat Assigned'}
                                        </span>
                                        <span style={{ fontSize:'6px', color:'rgba(255,140,0,0.65)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>TAP TO FLIP →</span>
                                    </div>
                                </div>

                                {/* ── BACK (Instructions) ── */}
                                <div className="id-card-back id-card-face" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 40%, #2d1060 100%)' }}>
                                    <div className="id-card-pattern" />
                                    <div className="id-card-shine" />
                                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#F97316,#FBBF24,#F97316)' }} />

                                    {/* Mag stripe */}
                                    <div style={{ position:'absolute', top:'16px', left:0, right:0, height:'22px', background:'linear-gradient(to bottom,#111,#000)', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.8)' }} />

                                    {/* Tap back hint */}
                                    <div style={{ position:'absolute', top:'6px', right:'10px', fontSize:'6px', color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>← TAP TO FLIP BACK</div>

                                    {/* Rules content */}
                                    <div style={{ position:'absolute', top:'44px', left:'12px', right:'12px', bottom:'24px', overflow:'hidden' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'7px' }}>
                                            <IoQrCode size={9} style={{ color:'#F97316', flexShrink:0 }} />
                                            <span style={{ fontSize:'7px', fontWeight:900, color:'#ffffff', letterSpacing:'0.12em', textTransform:'uppercase' }}>LMS Rules &amp; Rewards</span>
                                        </div>
                                        {[
                                            { icon:'⚡', title:'Daily Streak', desc:'Check-in daily to keep your streak alive.' },
                                            { icon:'✨', title:'Earn XP', desc:'+50 XP check-in · +70 XP Daily Quiz.' },
                                            { icon:'📈', title:'Level Up', desc:'Every 1,000 XP = new rank level!' },
                                            { icon:'🎁', title:'Rewards', desc:'Milestones unlock mock test credits.' },
                                        ].map((item, i) => (
                                            <div key={i} style={{ display:'flex', gap:'5px', marginBottom:'5px' }}>
                                                <span style={{ fontSize:'9px', flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                                                <div>
                                                    <p style={{ fontSize:'7px', fontWeight:900, color:'#ffffff', margin:'0 0 1px', letterSpacing:'0.03em' }}>{item.title}</p>
                                                    <p style={{ fontSize:'6px', color:'rgba(255,255,255,0.45)', margin:0, lineHeight:1.4 }}>{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom bar */}
                                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'24px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', background:'rgba(0,0,0,0.2)' }}>
                                        <span style={{ fontSize:'6px', color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>APNA LAKSHYA LMS</span>
                                        <span style={{ fontSize:'6px', color:'rgba(255,140,0,0.6)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>COMPETE &amp; EXCEL</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <p className="text-xs mt-3 text-gray-400">Tap card to flip · Tap QR to zoom</p>
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
                        <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 group">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 transition-colors text-orange-500 animate-pulse">
                                <IoSend size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Exam Target (For Daily Quiz & Mock Tests)</p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <select
                                        ref={selectRef}
                                        value={profile?.examTarget || 'generic'}
                                        onChange={handleExamTargetChange}
                                        className={`text-sm font-semibold mt-1 bg-white border rounded-lg px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer ${
                                            pulseHighlight 
                                                ? 'border-orange-500 ring-4 ring-orange-500/50 scale-[1.02] shadow-lg shadow-orange-500/20' 
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        {EXAM_TARGETS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <AnimatePresence>
                                        {pulseHighlight && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-1 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-lg shadow-md shadow-orange-500/30"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                First step: Please select your target exam to customize your daily challenges!
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                        <InfoRow 
                            icon={IoMaleFemale} 
                            label="Gender" 
                            value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'} 
                            color="text-pink-500" 
                        />
                        <InfoRow icon={IoBedOutline} label="Seat Number"  value={(profile?.roomId ? `${profile.roomId} - ${profile.seatNumber || profile.seat?.number}` : profile?.seatNumber) || 'Not Assigned'} color="text-cyan-500" />
                        <InfoRow icon={IoCalendar}  label="Member Since"
                            value={profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Not available'
                            } color="text-pink-500"
                        />
                    </motion.div>
                </div>

                {/* ── Activity Stats & Achievements ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl overflow-hidden bg-white border border-gray-200 mb-5"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                            <IoTime size={13} className="text-orange-500" />
                        </div>
                        <p className="font-bold text-sm" style={{ color: '#111827' }}>Activity &amp; Achievements</p>
                    </div>

                    <div className="p-5">
                        {loadingStreak ? (
                            <div className="flex items-center justify-center py-8 gap-3">
                                <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                                <span className="text-sm text-gray-400">Loading activity...</span>
                            </div>
                        ) : (
                            <>
                                {/* Stat Cards */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[
                                        { label: 'Current Streak', value: `${streakStats?.currentStreak ?? 0}`, unit: 'days', color: '#F97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
                                        { label: 'Longest Streak', value: `${streakStats?.longestStreak ?? 0}`, unit: 'days', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
                                        { label: 'Focus Time', value: `${Math.round((streakStats?.totalFocusTime ?? 0) / 60)}`, unit: 'hrs', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                                    ].map(({ label, value, unit, color, bg, border }) => (
                                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
                                            <p className="text-xl font-black" style={{ color }}>{value}<span className="text-xs font-semibold ml-0.5 opacity-70">{unit}</span></p>
                                            <p className="text-[10px] font-semibold mt-0.5 text-gray-500 leading-tight">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* 30-Day Heatmap */}
                                <div className="mb-5">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">30-Day Activity</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {(() => {
                                            const today = new Date();
                                            const days = Array.from({ length: 30 }, (_, i) => {
                                                const d = new Date(today);
                                                d.setDate(today.getDate() - (29 - i));
                                                return d.toISOString().slice(0, 10);
                                            });
                                            const logMap = {};
                                            (streakStats?.activityLog || []).forEach(entry => {
                                                const k = new Date(entry.date).toISOString().slice(0, 10);
                                                logMap[k] = (logMap[k] || 0) + (entry.count || 1);
                                            });
                                            return days.map(dateStr => {
                                                const count = logMap[dateStr] || 0;
                                                const opacity = count === 0 ? 0 : count < 3 ? 0.4 : count < 6 ? 0.7 : 1;
                                                return (
                                                    <div
                                                        key={dateStr}
                                                        title={`${dateStr}: ${count} activities`}
                                                        className="rounded"
                                                        style={{
                                                            width: 18, height: 18, flexShrink: 0,
                                                            background: count === 0 ? '#E5E7EB' : `rgba(249,115,22,${opacity})`,
                                                            border: count > 0 ? '1px solid rgba(249,115,22,0.3)' : '1px solid #D1D5DB',
                                                        }}
                                                    />
                                                );
                                            });
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className="text-[10px] text-gray-400">Less</span>
                                        {[0, 0.35, 0.6, 0.85, 1].map((o, i) => (
                                            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: i === 0 ? '#E5E7EB' : `rgba(249,115,22,${o})` }} />
                                        ))}
                                        <span className="text-[10px] text-gray-400">More</span>
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Unlocked Achievements</p>
                                    {(streakStats?.achievements || []).length === 0 ? (
                                        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <IoShieldCheckmark size={18} className="text-gray-300 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-600">No achievements yet</p>
                                                <p className="text-xs text-gray-400">Keep a 5-day streak to earn your first badge.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {(streakStats?.achievements || []).map((ach, i) => {
                                                const meta = {
                                                    'streak_5':  { title: '5-Day Streak Explorer',  color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
                                                    'streak_10': { title: '10-Day Streak Warrior',   color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)' },
                                                    'streak_15': { title: '15-Day Streak Master',    color: '#6366F1', bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.25)' },
                                                    'streak_30': { title: '30-Day Streak Legend',    color: '#F97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.25)' },
                                                }[ach.id] || { title: ach.id, color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' };
                                                return (
                                                    <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                                                        <IoShieldCheckmark size={18} style={{ color: meta.color, flexShrink: 0 }} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.title}</p>
                                                            <p className="text-[11px] text-gray-500">Unlocked {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                                        </div>
                                                        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: meta.color, color: '#fff' }}>EARNED</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

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

            {/* ── QR ZOOM MODAL ── */}
            {showQrZoom && (
                <div
                    onClick={() => setShowQrZoom(false)}
                    style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.80)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',borderRadius:'20px',padding:'24px 20px 20px',boxShadow:'0 24px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',alignItems:'center',maxWidth:'300px',width:'90%' }}
                    >
                        {/* Header row */}
                        <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px',width:'100%' }}>
                            <div style={{ width:'30px',height:'30px',borderRadius:'9px',background:'linear-gradient(135deg,#F97316,#FB923C)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                <IoQrCode size={15} style={{ color:'#fff' }} />
                            </div>
                            <div style={{ flex:1 }}>
                                <p style={{ fontSize:'12px',fontWeight:900,color:'#ffffff',letterSpacing:'0.08em',textTransform:'uppercase',margin:0 }}>Digital ID</p>
                                <p style={{ fontSize:'9px',color:'rgba(255,255,255,0.45)',fontWeight:600,margin:0 }}>Scan for Entry / Exit</p>
                            </div>
                            <button onClick={() => setShowQrZoom(false)} style={{ background:'rgba(255,255,255,0.08)',border:'none',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,0.6)',flexShrink:0 }}>
                                <IoClose size={15} />
                            </button>
                        </div>

                        {/* QR code */}
                        <div style={{ background:'#ffffff',borderRadius:'14px',padding:'14px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)',marginBottom:'14px' }}>
                            <QRCodeSVG
                                value={JSON.stringify({ token: user?.qrToken, id: user?.id || user?._id })}
                                size={210}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        {/* Name & ID */}
                        <p style={{ fontSize:'13px',fontWeight:900,color:'#ffffff',letterSpacing:'0.1em',textTransform:'uppercase',margin:'0 0 3px' }}>{profile?.name}</p>
                        <p style={{ fontSize:'10px',color:'rgba(255,255,255,0.4)',fontFamily:'monospace',letterSpacing:'0.12em',margin:'0 0 12px' }}>
                            AL-{(profile?._id || profile?.id || user?._id || user?.id || '').slice(-6).toUpperCase()}
                        </p>

                        {/* Active badge */}
                        <div style={{ display:'flex',alignItems:'center',gap:'6px',background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'99px',padding:'5px 14px' }}>
                            <span style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80',display:'inline-block',boxShadow:'0 0 6px #4ade80' }} />
                            <span style={{ fontSize:'9px',fontWeight:800,color:'#4ade80',letterSpacing:'0.08em',textTransform:'uppercase' }}>Active Member</span>
                        </div>

                        <p style={{ fontSize:'8px',color:'rgba(255,255,255,0.22)',marginTop:'12px',textAlign:'center' }}>Tap outside to dismiss</p>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Profile;
