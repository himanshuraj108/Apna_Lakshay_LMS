import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { IoArrowBack, IoPerson, IoCamera, IoTrash, IoSend } from 'react-icons/io5';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestType, setRequestType] = useState('shift');
    const [requestData, setRequestData] = useState({});
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            setProfile(response.data.user);
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
        formData.append('image', file);

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
            fetchProfile();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to delete image');
            setTimeout(() => setError(''), 3000);
        }
    };

    const submitRequest = async () => {
        try {
            await api.post('/student/request', {
                type: requestType,
                requestedData: requestData
            });

            setSuccess('Change request submitted successfully!');
            setShowRequestModal(false);
            setRequestData({});
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to submit request');
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
                                        src={`http://localhost:5000${profile.profileImage}`}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
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
                            <label htmlFor="image-upload">
                                <Button variant="secondary" className="cursor-pointer mb-2">
                                    <IoCamera className="inline mr-2" /> Upload Photo
                                </Button>
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
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">Status</p>
                                    <p className="text-lg font-semibold">
                                        {profile?.isActive ? '✓ Active' : '✗ Inactive'}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">Member Since</p>
                                    <p className="text-lg font-semibold">
                                        {new Date(profile?.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Change Requests */}
                <Card>
                    <h3 className="text-2xl font-bold mb-6">Request Changes</h3>
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
                            onClick={() => {
                                setRequestType('seat');
                                setShowRequestModal(true);
                            }}
                        >
                            <IoSend className="inline mr-2" /> Request Seat Change
                        </Button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm">
                            💡 <strong>Note:</strong> Change requests need to be approved by admin. You'll be notified once reviewed.
                        </p>
                    </div>
                </Card>

                {/* Request Modal */}
                <Modal
                    isOpen={showRequestModal}
                    onClose={() => setShowRequestModal(false)}
                    title={`Request ${requestType === 'shift' ? 'Shift' : 'Seat'} Change`}
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
                                    onChange={(e) => setRequestData({ shift: e.target.value })}
                                    className="input"
                                >
                                    <option value="">Select shift...</option>
                                    <option value="day">Day (9AM - 3PM)</option>
                                    <option value="night">Night (3PM - 9PM)</option>
                                    <option value="full">Full Day (9AM - 9PM)</option>
                                </select>
                            </div>
                        )}

                        {requestType === 'seat' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Reason for Change</label>
                                <textarea
                                    value={requestData.reason || ''}
                                    onChange={(e) => setRequestData({ reason: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="Please explain why you need a seat change..."
                                />
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
            </div>
        </div>
    );
};

export default Profile;
