import { motion } from 'framer-motion';
import { IoArrowBack, IoMail, IoCall, IoLocation, IoTime } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const ContactAdmin = () => {
    return (
        <div className="min-h-screen bg-black text-gray-300 relative overflow-x-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-green-900/20 to-transparent" />
                <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-green-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mb-8">
                    <IoArrowBack /> Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-green-500/20 rounded-2xl text-green-400">
                            <IoMail size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Contact Administration</h1>
                            <p className="text-gray-400 mt-1">We are here to help you</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Get in Touch</h2>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <IoLocation size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Visit Us</h3>
                                    <p className="text-sm text-gray-400">
                                        Apna Lakshay Library<br />
                                        123 Education Hub, Main Road<br />
                                        City Center, Delhi - 110001
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                                    <IoCall size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Call Us</h3>
                                    <p className="text-sm text-gray-400">+91 98765 43210</p>
                                    <p className="text-sm text-gray-400">+91 11 2345 6789</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                                    <IoMail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium mb-1">Email Us</h3>
                                    <p className="text-sm text-gray-400">admin@apnalakshay.com</p>
                                    <p className="text-sm text-gray-400">support@apnalakshay.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white mb-4">Office Hours</h2>
                            <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <IoTime className="text-yellow-500" />
                                            <span>Monday - Saturday</span>
                                        </div>
                                        <span className="text-white font-medium">8:00 AM - 8:00 PM</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <IoTime className="text-red-500" />
                                            <span>Sunday</span>
                                        </div>
                                        <span className="text-white font-medium">10:00 AM - 4:00 PM</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                                        For urgent issues outside office hours, please use the
                                        <span className="text-white font-medium mx-1">Help & Support</span>
                                        feature in your student dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default ContactAdmin;
