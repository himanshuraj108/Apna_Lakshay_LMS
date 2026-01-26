import { motion } from 'framer-motion';
import { IoArrowBack, IoShieldCheckmark } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 relative overflow-x-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent" />
                <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8">
                    <IoArrowBack /> Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                            <IoShieldCheckmark size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                            <p className="text-gray-400 mt-1">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                            <p>We collect information necessary to provide our library services, including:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                <li>Personal identification (Name, Email, Student ID)</li>
                                <li>Attendance records and entry/exit times</li>
                                <li>Payment history and transaction details</li>
                                <li>Seat preferences and booking history</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
                            <p>Your data is used strictly for:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                <li>Managing access and security within the facility</li>
                                <li>Processing fee payments and generating receipts</li>
                                <li>Communicating important updates and reminders</li>
                                <li>Improving improved facility management and resource allocation</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your personal information.
                                Your data is encrypted and stored securely. We do not sell or share your personal data with third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-3">4. Contact Us</h2>
                            <p>
                                If you have questions about this policy, please contact the administration via the Help & Support section in your dashboard.
                            </p>
                        </section>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default PrivacyPolicy;
