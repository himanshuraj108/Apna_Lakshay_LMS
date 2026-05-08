import { motion } from 'framer-motion';
import { IoArrowBack, IoMail, IoCall, IoLocation, IoTime, IoShieldCheckmark } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const ContactAdmin = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-700 relative overflow-x-hidden">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-100/50 to-transparent" />
                <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-orange-400/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors mb-8 font-medium">
                    <IoArrowBack /> Back to Dashboard
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 md:p-12 shadow-xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-orange-100 rounded-2xl text-orange-600">
                            <IoMail size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Contact Administration</h1>
                            <p className="text-gray-500 mt-1">We are here to help you</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>

                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <IoLocation size={24} />
                                </div>
                                <div className="w-full">
                                    <h3 className="text-gray-900 font-medium mb-1">Visit Us</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Basbariya Chawk Near Nahar<br />
                                        Sitamarhi, Bihar - 843302
                                    </p>

                                    <a href={import.meta.env.VITE_LIBRARY_LOCATION_URL || '#'} target="_blank" rel="noopener noreferrer" className="block w-full">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl text-white font-bold shadow-lg shadow-orange-500/25 transition-all group text-sm"
                                        >
                                            <IoShieldCheckmark size={20} className="text-white" />
                                            CHECK IN LOCATION
                                        </motion.button>
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <IoCall size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-medium mb-1">Call Us</h3>
                                    <p className="text-sm text-gray-600">+91 97989 08881</p>
                                    <p className="text-sm text-gray-600">+91 62057 72574</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100 transition-colors">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <IoMail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 font-medium mb-1">Email Us</h3>
                                    <p className="text-sm text-gray-600">apnalakshaylms@gmail.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Hours</h2>
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <IoTime className="text-yellow-500" />
                                            <span>Monday - Saturday</span>
                                        </div>
                                        <span className="text-gray-900 font-medium">8:00 AM - 8:00 PM</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <IoTime className="text-red-500" />
                                            <span>Sunday</span>
                                        </div>
                                        <span className="text-gray-900 font-medium">10:00 AM - 4:00 PM</span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 text-center leading-relaxed">
                                        For urgent issues outside office hours, please use the
                                        <span className="text-gray-900 font-medium mx-1">Help & Support</span>
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
