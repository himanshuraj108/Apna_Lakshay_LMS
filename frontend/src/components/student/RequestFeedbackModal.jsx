import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStar, IoClose, IoChatboxEllipsesOutline, IoCheckmarkCircle } from 'react-icons/io5';
import api from '../../utils/api';

const RequestFeedbackModal = ({ request, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!request) return null;

    const handleSubmit = async (isDismissed = false) => {
        if (!isDismissed && rating === 0) return;
        setSubmitting(true);
        try {
            await api.post(`/student/request/${request._id}/rate`, {
                rating: isDismissed ? null : rating,
                feedback: isDismissed ? null : feedback,
                dismissed: isDismissed
            });
            if (!isDismissed) {
                setSuccess(true);
                setTimeout(() => onClose(), 2000);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100"
                >
                    {/* Only show standard form layout, use button to show success state */}
                    <>
                        {/* Header */}
                            <div className="relative pt-8 pb-4 px-6 text-center">
                                <button onClick={() => handleSubmit(true)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                    <IoClose size={20} />
                                </button>
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                                    <IoChatboxEllipsesOutline size={32} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-1">How did we do?</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Your request regarding <span className="font-bold text-gray-700 capitalize">{request.type.replace('_', ' ')}</span> was recently marked as <span className={`font-bold ${request.status === 'approved' ? 'text-green-500' : 'text-red-500'}`}>{request.status}</span>.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-8">
                                {/* Stars */}
                                <div className="flex justify-center gap-2 mb-6">
                                    {[...Array(5)].map((star, i) => {
                                        const ratingValue = i + 1;
                                        return (
                                            <motion.button
                                                key={i}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setRating(ratingValue)}
                                                onMouseEnter={() => setHover(ratingValue)}
                                                onMouseLeave={() => setHover(0)}
                                                className="focus:outline-none"
                                            >
                                                <IoStar
                                                    size={36}
                                                    className={`transition-colors ${
                                                        ratingValue <= (hover || rating) ? 'text-amber-400 drop-shadow-md' : 'text-gray-200'
                                                    }`}
                                                />
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Comment Box (only shows if a rating is selected) */}
                                <AnimatePresence>
                                    {rating > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mb-6 overflow-hidden"
                                        >
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                placeholder="Tell us more about your experience (optional)..."
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                                rows="3"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Actions */}
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={rating === 0 || submitting || success}
                                    className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all disabled:opacity-40 disabled:hover:bg-gray-900 ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-900 hover:bg-black'}`}
                                >
                                    {success ? 'Submitted!' : submitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                                {!success && (
                                    <button
                                        onClick={() => handleSubmit(true)}
                                        className="w-full mt-3 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        Maybe Later
                                    </button>
                                )}
                            </div>
                        </>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RequestFeedbackModal;
