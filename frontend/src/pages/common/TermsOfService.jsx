import { motion } from 'framer-motion';
import { IoArrowBack, IoDocumentText } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 relative overflow-x-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent" />
                <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] left-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-8">
                    <IoArrowBack /> Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-purple-500/20 rounded-2xl text-purple-400">
                            <IoDocumentText size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
                            <p className="text-gray-400 mt-1">Effective Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using the Apna Lakshay Library Management System and facilities, you agree to comply with and be bound by these Terms of Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. Facility Usage Rules</h2>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                <li><strong>Silence:</strong> Maintain strict silence in reading areas.</li>
                                <li><strong>Food & Drink:</strong> No edibles allowed at desks; water bottles must be sealed.</li>
                                <li><strong>Cleanliness:</strong> Keep your assigned seat clean and damage-free.</li>
                                <li><strong>Timings:</strong> Adhere strictly to your assigned shift timings.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. Membership & Fees</h2>
                            <p>
                                Membership fees are non-refundable. Fees must be paid on or before the due date to avoid penalty or suspension of access.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Disciplinary Action</h2>
                            <p>
                                Violation of rules may result in warning, fine, or termination of membership without refund, at the discretion of the administration.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">5. Personal Integrity</h2>
                            <p>
                                You are responsible for your personal belongings. The management is not liable for loss or damage to personal property.
                            </p>
                        </section>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default TermsOfService;
