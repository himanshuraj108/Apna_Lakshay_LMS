import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { IoArrowBack, IoPerson, IoCamera, IoTrash, IoSend, IoLockClosed } from 'react-icons/io5';
import SeatChangeModal from '../../components/student/SeatChangeModal';
import useShifts from '../../hooks/useShifts';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { shifts, isCustom, getShiftTimeRange } = useShifts();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState('shift');
    const [requestData, setRequestData] = useState({});
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showSeatChangeModal, setShowSeatChangeModal] = useState(false);

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

    const submitRequest = async () => {
        try {
            if (requestType === 'password') {
                if (requestData.newPassword !== requestData.confirmPassword) {
                    setError('Passwords do not match');
                    setTimeout(() => setError(''), 3000);
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

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/student">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

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

                {/* Profile Card */}
                <Card className="mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Profile Image */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-gradient-primary flex items-center justify-center mb-4 overflow-hidden">
                                {profile?.profileImage ? (
                                    <img
                                        src={`${BASE_URL}${profile.profileImage}`}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <IoPerson size={64} />
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
                                className="cursor-pointer mb-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center font-semibold text-sm"
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
                            <h2 className="text-3xl font-bold mb-2">{profile?.name}</h2>
                            <p className="text-gray-400 mb-6">{profile?.email}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`rounded-lg p-4 border ${profile.registrationSource === 'self' && !profile.seat
                                    ? 'bg-yellow-500/20 border-yellow-500/30'
                                    : profile?.isActive
                                        ? 'bg-green-500/20 border-green-500/30'
                                        : 'bg-red-500/20 border-red-500/30'
                                    }`}>
                                    <p className={`text-sm mb-1 ${profile.registrationSource === 'self' && !profile.seat
                                        ? 'text-yellow-300'
                                        : profile?.isActive
                                            ? 'text-green-300'
                                            : 'text-red-300'
                                        }`}>Status</p>
                                    <p className={`text-lg font-bold ${profile.registrationSource === 'self' && !profile.seat
                                        ? 'text-yellow-400'
                                        : profile?.isActive
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }`}>
                                        {profile.registrationSource === 'self' && !profile.seat
                                            ? '⚠ Pending Allocation'
                                            : profile?.isActive
                                                ? '✓ Active'
                                                : '✗ Inactive'
                                        }
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">Member Since</p>
                                    <p className="text-lg font-semibold">
                                        {profile?.seatAssignedAt
                                            ? new Date(profile.seatAssignedAt).toLocaleDateString('en-IN')
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Change Requests - Only for Active Students */}
                <Card>
                    <h3 className="text-2xl font-bold mb-6">Request Changes</h3>

                    {profile?.isActive && !(profile.registrationSource === 'self' && !profile.seat) ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setRequestType('shift');
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
                <Card>
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
                                <label className="block text-sm font-medium mb-2">New Shift</label>
                                <select
                                    value={requestData.shift || ''}
                                    onChange={(e) => {
                                        const selected = e.target.value;
                                        if (profile.currentShift === selected) {
                                            setError("You are already in this shift!");
                                            setShowRequestModal(false);
                                            setTimeout(() => setError(''), 3000);
                                            return;
                                        }
                                        setRequestData({ shift: selected });
                                    }}
                                    className="input"
                                >
                                    <option value="">Select shift...</option>
                                    {shifts.map(shift => (
                                        <option key={shift.id} value={shift.id}>
                                            {shift.name} ({getShiftTimeRange(shift)})
                                        </option>
                                    ))}
                                    {!isCustom && !shifts.some(s => s.id === 'full') && (
                                        <option value="full">Full Day (9 AM - 9 PM)</option>
                                    )}
                                </select>
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
                            <Button variant="primary" onClick={submitRequest} className="flex-1">
                                Submit Request
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
            </div>
        </div>
    );
};

export default Profile;
