import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api, { BASE_URL } from '../../utils/api';
import { IoArrowBack, IoPerson, IoMail, IoCall, IoLocation, IoCalendar, IoTime, IoSave, IoCamera, IoTrash, IoCloudUpload, IoClose, IoHelpCircle, IoLogOut, IoQrCode, IoSend, IoLockClosed, IoSunny, IoMoon, IoDesktopOutline } from 'react-icons/io5';
import { QRCodeSVG } from 'qrcode.react';
import SeatChangeModal from '../../components/student/SeatChangeModal';
import CombinedSeatShiftModal from '../../components/student/CombinedSeatShiftModal';
import useShifts from '../../hooks/useShifts';
import { useTheme } from '../../context/ThemeContext';

const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme, setTheme } = useTheme();
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
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto">
                    <SkeletonLoader type="card" count={2} />
                </div>
            </div>
        );
    }

    // Scroll down to return JSX
    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/student">
                        <Button variant="secondary">
                            <IoArrowBack className="inline mr-2" /> Back
                        </Button>
                    </Link>
                    <div className="flex gap-4 items-center">
                        {/* Theme Toggle - Segmented Control */}
                        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full border border-gray-300 dark:border-gray-700">
                            <button
                                onClick={() => setTheme('system')}
                                className={`p-2 rounded-full transition-all ${theme === 'system'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="System Theme"
                            >
                                <IoDesktopOutline size={18} />
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 rounded-full transition-all ${theme === 'light'
                                    ? 'bg-yellow-500 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="Light Mode"
                            >
                                <IoSunny size={18} />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 rounded-full transition-all ${theme === 'dark'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title="Dark Mode"
                            >
                                <IoMoon size={18} />
                            </button>
                        </div>
                        <Button variant="danger" onClick={handleLogout}>
                            <IoLogOut className="inline mr-2" /> Logout
                        </Button>
                    </div>
                </div>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    My Profile
                </h1>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-500/20 border border-green-500/50 text-green-400 p-4 rounded-lg mb-6"
                    >
                        {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Digital ID Card */}
                    <div className="md:col-span-1">
                        {profile?.isActive && profile?.seat ? (
                            /* QR Code ID Card - Active & Seated */
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-lg dark:shadow-none">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-4 flex items-center gap-2 relative z-10">
                                    <IoQrCode className="text-blue-500 dark:text-blue-400" /> DIGITAL ID
                                </h3>

                                <div className="bg-white p-2 rounded-xl shadow-2xl relative z-10">
                                    <QRCodeSVG
                                        value={JSON.stringify({
                                            token: user.qrToken,
                                            id: user.id
                                        })}
                                        size={160}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="mt-4 relative z-10">
                                    <p className="text-gray-900 dark:text-white font-bold text-lg tracking-wide">{user.name}</p>
                                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-1 font-mono">
                                        {user.qrToken ? 'Secure Token Active' : 'Legacy ID Mode'}
                                    </p>
                                </div>

                                <p className="text-xs text-gray-500 mt-4 relative z-10">
                                    Scan for Entry/Exit by Admin
                                </p>
                            </div>
                        ) : (
                            /* Locked State - Inactive or Pending */
                            <div className="bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full relative overflow-hidden shadow-sm dark:shadow-none">
                                <div className="absolute inset-0 bg-red-500/5" />
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 relative z-10">
                                    <IoLockClosed size={32} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-300 relative z-10">ID Unavailable</h3>
                                <p className="text-gray-600 dark:text-gray-500 text-sm mt-2 relative z-10">
                                    {!profile?.isActive ? 'Membership Inactive' : 'Pending Seat Allocation'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Profile Card */}
                    <div className="md:col-span-2">
                        <Card className="h-full">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Profile Image */}
                                <div className="flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center mb-4 overflow-hidden border-4 border-white dark:border-white/10 shadow-lg">
                                        {profile?.profileImage ? (
                                            <img
                                                src={profile.profileImage.startsWith('http') ? profile.profileImage : `${BASE_URL}${profile.profileImage}`}
                                                alt={profile.name}
                                                className="w-full h-full object-cover"
                                                crossOrigin="anonymous"
                                            />
                                        ) : (
                                            <IoPerson size={64} className="text-white/80" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer mb-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white rounded-lg transition-colors flex items-center font-semibold text-sm"
                                    >
                                        <IoCamera className="mr-2" /> Upload Photo
                                    </label>
                                    {profile?.profileImage && (
                                        <Button variant="danger" onClick={handleImageDelete} className="text-sm">
                                            <IoTrash className="inline mr-2" /> Remove
                                        </Button>
                                    )}
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{profile?.name}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                                        {profile?.email}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`rounded-lg p-4 border ${!profile?.isActive
                                            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                                            : !profile?.seat
                                                ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30'
                                                : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                                            }`}>
                                            <p className={`text-sm mb-1 ${!profile?.isActive
                                                ? 'text-red-600 dark:text-red-300'
                                                : !profile?.seat
                                                    ? 'text-yellow-600 dark:text-yellow-300'
                                                    : 'text-green-600 dark:text-green-300'
                                                }`}>Membership Status</p>
                                            <p className={`text-lg font-bold ${!profile?.isActive
                                                ? 'text-red-700 dark:text-red-400'
                                                : !profile?.seat
                                                    ? 'text-yellow-700 dark:text-yellow-400'
                                                    : 'text-green-700 dark:text-green-400'
                                                }`}>
                                                {!profile?.isActive
                                                    ? 'Inactive'
                                                    : !profile?.seat
                                                        ? 'Pending Allocation'
                                                        : 'Active Member'
                                                }
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/5">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {profile?.seatAssignedAt
                                                    ? new Date(profile.seatAssignedAt).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })
                                                    : 'Not assigned yet'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Change Requests - Only for Active Students */}
                <Card>
                    <h3 className="text-2xl font-bold mb-6">Request Changes</h3>

                    {profile?.isActive && profile?.seat ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setRequestType('shift');
                                        fetchAvailableShifts();
                                        setShowRequestModal(true);
                                    }}
                                >
                                    <IoSend className="inline mr-2" /> Request Shift Change
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowSeatChangeModal(true)}
                                >
                                    <IoSend className="inline mr-2" /> Request Seat Change
                                </Button>
                            </div>

                            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-sm">
                                    💡 <strong>Note:</strong> Change requests need to be approved by admin. You'll be notified once reviewed.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="p-6 bg-gray-800/50 rounded-lg text-center border border-gray-700">
                            <IoLockClosed className="mx-auto text-gray-500 mb-3" size={32} />
                            <h4 className="text-lg font-semibold text-gray-300 mb-2">Requests Unavailable</h4>
                            <p className="text-gray-400 text-sm max-w-md mx-auto">
                                {!profile?.isActive
                                    ? "Your account is currently inactive. Please reactivate your membership to make requests."
                                    : "You are pending seat allocation. You can make requests once a seat is assigned."}
                            </p>
                        </div>
                    )}
                </Card>

                {/* Security Settings */}
                <Card className="mt-6">
                    <h3 className="text-2xl font-bold mb-6">Security Settings</h3>
                    <Button
                        variant="danger"
                        onClick={() => {
                            setRequestType('password');
                            setShowRequestModal(true);
                        }}
                        className="w-full md:w-auto"
                    >
                        <IoLockClosed className="inline mr-2" /> Change Password
                    </Button>
                </Card>

                {/* Request/Change Modal */}
                <Modal
                    isOpen={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    title={
                        requestType === 'password' ? 'Change Password' :
                            `Request ${requestType === 'shift' ? 'Shift' : 'Seat'} Change`
                    }
                >
                    <div className="space-y-4">
                        <p className="text-gray-400">
                            Describe your requested {requestType} change below:
                        </p>

                        {requestType === 'shift' && (
                            <div>
                                {/* Current Shift Display */}
                                {profile?.currentShift && (
                                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Current Shift</p>
                                        <p className="text-white font-bold">
                                            {shifts.find(s => s.id === profile.currentShift)?.name || profile.currentShift}
                                            <span className="text-sm text-gray-400 ml-2">
                                                ({getShiftTimeRange(shifts.find(s => s.id === profile.currentShift) || { id: profile.currentShift })})
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Occupied Shifts Warning */}
                                {occupiedShifts.length > 0 && (
                                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-xs text-yellow-500 font-semibold mb-2">⚠️ Unavailable Shifts (Occupied)</p>
                                        {occupiedShifts.map((occupied, idx) => (
                                            <div key={idx} className="text-sm text-gray-400 mb-1">
                                                • {occupied.name} ({occupied.startTime} - {occupied.endTime}) - {occupied.occupiedBy}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <label className="block text-sm font-medium mb-2">New Shift</label>
                                {loadingShifts ? (
                                    <div className="flex items-center justify-center py-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                                        <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                        <span className="ml-2 text-gray-400">Loading shifts...</span>
                                    </div>
                                ) : (
                                    <select
                                        value={requestData.shift || ''}
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            setRequestData({ shift: selected });
                                        }}
                                        className="input"
                                        disabled={loadingShifts || availableShifts.length === 0}
                                    >
                                        <option value="">Select an available shift...</option>
                                        {availableShifts.length > 0 ? (
                                            availableShifts.map(shift => (
                                                <option key={shift._id} value={shift._id}>
                                                    {shift.name} ({shift.startTime} - {shift.endTime})
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No available shifts</option>
                                        )}
                                    </select>
                                )}

                                {/* Always Visible: Browse Other Seats Button */}
                                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <p className="text-xs text-blue-400 mb-2">💡 Looking for different options?</p>
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => {
                                            setShowRequestModal(false);
                                            setShowCombinedChangeModal(true);
                                        }}
                                    >
                                        Shift not available? Want to change shift? CLICK HERE
                                    </Button>
                                </div>

                                {/* Availability Messages */}
                                {availableShifts.length === 0 && !loadingShifts && (
                                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                        <p className="text-sm text-red-400">
                                            ❌ No shifts available on your current seat (#{profile?.seat?.number || profile?.seat})
                                        </p>
                                    </div>
                                )}
                                {availableShifts.length > 0 && !loadingShifts && (
                                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <p className="text-xs text-green-500 font-semibold mb-1">✓ {availableShifts.length} Available Shift{availableShifts.length !== 1 ? 's' : ''}</p>
                                        <p className="text-sm text-gray-400">
                                            The shifts above don't conflict with any existing bookings. Select one to submit your request.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {requestType === 'seat' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Reason for Change</label>
                                <textarea
                                    value={requestData.reason || ''}
                                    onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="Please explain why you need a seat change..."
                                />
                            </div>
                        )}

                        {requestType === 'password' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Enter current password"
                                        onChange={(e) => setRequestData({ ...requestData, currentPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">New Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Enter new password"
                                        onChange={(e) => setRequestData({ ...requestData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Confirm new password"
                                        onChange={(e) => setRequestData({ ...requestData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button variant="primary" onClick={submitRequest} className="flex-1" disabled={submittingRequest}>
                                {submittingRequest ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : 'Submit Request'}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Seat Change Modal */}
                <SeatChangeModal
                    isOpen={showSeatChangeModal}
                    onClose={() => setShowSeatChangeModal(false)}
                    currentSeat={profile?.seat}
                    onSuccess={() => {
                        setSuccess('Seat change request submitted successfully!');
                        setTimeout(() => setSuccess(''), 3000);
                        fetchProfile();
                    }}
                />

                {/* Combined Seat + Shift Change Modal */}
                <CombinedSeatShiftModal
                    isOpen={showCombinedChangeModal}
                    onClose={() => setShowCombinedChangeModal(false)}
                    currentSeat={profile?.seat}
                    onSuccess={() => {
                        setShowCombinedChangeModal(false);
                        fetchProfile();
                        setSuccess('Combined seat and shift change request submitted!');
                        setTimeout(() => setSuccess(''), 3000);
                    }}
                />
            </div>
        </div>
    );
};

export default Profile;
