import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoQrCode, IoCard, IoBed, IoHelpCircle, IoBook,
    IoWarning, IoTime, IoWifi, IoVolumeMute,
    IoCalendar, IoPeople, IoIdCard
} from 'react-icons/io5';

const GuideCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.05 }}
        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-6 rounded-xl flex flex-col items-center text-center cursor-pointer backdrop-blur-sm hover:border-blue-500/30 transition-all shadow-md dark:shadow-none"
    >
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mb-4 text-blue-500 dark:text-blue-400">
            <Icon size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
);

const RuleItem = ({ icon: Icon, title, text, index }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
    >
        <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 group-hover:bg-yellow-400/20 dark:group-hover:bg-yellow-400/10 transition-colors">
            <Icon size={24} />
        </div>
        <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-1 group-hover:text-yellow-600 dark:group-hover:text-yellow-200">{title}</h4>
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    </motion.div>
);

const LmsGuideSection = () => {
    const [activeTab, setActiveTab] = useState('features');

    return (
        <div className="mt-16 mb-8">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    Master Your Library Experience
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Everything you need to know about using the LMS, managing your seat, and following library guidelines.
                </p>
            </motion.div>

            {/* Interactive Tabs */}
            <div className="flex justify-center mb-10 gap-4">
                {['features', 'guidelines'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === tab
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                    >
                        {tab === 'features' ? 'Quick Actions Guide' : 'Library Guidelines'}
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'features' ? (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <GuideCard
                                icon={IoQrCode}
                                title="Smart Attendance"
                                description="Simply scan the QR code at the entrance kiosk. No manual entry needed—your attendance is marked instantly."
                                delay={0}
                            />
                            <GuideCard
                                icon={IoCard}
                                title="Fee & Payments"
                                description="Track your payment history and download receipts. Get automated reminders 5 days before your due date."
                                delay={0.1}
                            />
                            <GuideCard
                                icon={IoBed}
                                title="Seat Management"
                                description="View your assigned seat on the digital map. Request seat changes or shift changes directly from your dashboard."
                                delay={0.2}
                            />
                            <GuideCard
                                icon={IoHelpCircle}
                                title="24/7 Support"
                                description="Facing an issue? Submit a ticket for WiFi, AC, or cleaning. Track the status and get resolved quickly."
                                delay={0.3}
                            />
                            <GuideCard
                                icon={IoCalendar}
                                title="Study Planner"
                                description="Organize your daily tasks, set priorities, and track your study hours. Stay productive with the Pomodoro timer."
                                delay={0.4}
                            />
                            <GuideCard
                                icon={IoPeople}
                                title="Community Connect"
                                description="Join the Discussion Room to collaborate with peers. Share notes, ask questions, and learn together."
                                delay={0.5}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="guidelines"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                        >
                            <div className="space-y-2">
                                <RuleItem
                                    icon={IoVolumeMute}
                                    title="Maintain Silence"
                                    text="Please keep your mobile on silent. Group discussions are only allowed in the designated Discussion Room."
                                    index={0}
                                />
                                <RuleItem
                                    icon={IoWifi}
                                    title="WiFi Usage"
                                    text="WiFi is for educational purposes. Heavy downloads or gaming is strictly prohibited to ensure speed for everyone."
                                    index={1}
                                />
                                <RuleItem
                                    icon={IoIdCard}
                                    title="ID Card Mandatory"
                                    text="Carry your virtual or physical ID card at all times. It is required for entry and exit scans."
                                    index={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <RuleItem
                                    icon={IoTime}
                                    title="Shift Timings"
                                    text="Adhere to your assigned slot (Morning/Evening). Extra hours require prior admin approval."
                                    index={2}
                                />
                                <RuleItem
                                    icon={IoWarning}
                                    title="Cleanliness"
                                    text="Keep your desk clean. Food and beverages (except water) are not allowed at the study desks."
                                    index={3}
                                />
                                <RuleItem
                                    icon={IoBook}
                                    title="Respect Resources"
                                    text="Handle library assets and furniture with care. Report any existing damages to the admin immediately."
                                    index={5}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LmsGuideSection;
