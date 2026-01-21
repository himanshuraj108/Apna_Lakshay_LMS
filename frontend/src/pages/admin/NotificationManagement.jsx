import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../utils/api';
import { IoArrowBack, IoSend, IoPeople, IoPerson } from 'react-icons/io5';

const NotificationManagement = () => {
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        sendToAll: true,
        recipientId: ''
    });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/admin/students');
            setStudents(response.data.students.filter(s => s.isActive));
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/admin/notifications', formData);
            setSuccess(
                formData.sendToAll
                    ? `Announcement sent to all ${students.length} students!`
                    : 'Notification sent successfully!'
            );
            setFormData({
                title: '',
                message: '',
                sendToAll: true,
                recipientId: ''
            });
            setTimeout(() => setSuccess(''), 5000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/admin">
                    <Button variant="secondary" className="mb-6">
                        <IoArrowBack className="inline mr-2" /> Back to Dashboard
                    </Button>
                </Link>

                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-8">
                    Notifications & Announcements
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

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Send To */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Send To</label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={formData.sendToAll ? 'primary' : 'secondary'}
                                    onClick={() => setFormData({ ...formData, sendToAll: true, recipientId: '' })}
                                    className="flex-1"
                                >
                                    <IoPeople className="inline mr-2" /> All Students ({students.length})
                                </Button>
                                <Button
                                    type="button"
                                    variant={!formData.sendToAll ? 'primary' : 'secondary'}
                                    onClick={() => setFormData({ ...formData, sendToAll: false })}
                                    className="flex-1"
                                >
                                    <IoPerson className="inline mr-2" /> Individual Student
                                </Button>
                            </div>
                        </div>

                        {/* Student Selector (if individual) */}
                        {!formData.sendToAll && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Student</label>
                                <select
                                    value={formData.recipientId}
                                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                                    className="input"
                                    required={!formData.sendToAll}
                                >
                                    <option value="">Choose a student...</option>
                                    {students.map((student) => (
                                        <option key={student._id} value={student._id}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="input"
                                placeholder="e.g., Library Closing Early Tomorrow"
                                required
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="input min-h-[150px] resize-y"
                                placeholder="Enter your announcement message here..."
                                required
                            />
                            <p className="text-sm text-gray-400 mt-2">
                                {formData.message.length} characters
                            </p>
                        </div>

                        {/* Preview */}
                        {(formData.title || formData.message) && (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                <p className="text-sm text-gray-400 mb-2">Preview</p>
                                <h3 className="text-xl font-bold mb-2">📢 {formData.title}</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{formData.message}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={sending}
                            className="w-full"
                        >
                            <IoSend className="inline mr-2" />
                            {sending ? 'Sending...' : formData.sendToAll ? 'Send to All Students' : 'Send Notification'}
                        </Button>

                        <p className="text-sm text-gray-400 text-center">
                            Note: Email sending is temporarily disabled. Notifications will appear in student dashboards.
                        </p>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default NotificationManagement;
