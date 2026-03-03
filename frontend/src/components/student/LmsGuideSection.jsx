import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoQrCode, IoCard, IoBed, IoHelpCircle, IoBook,
    IoWarning, IoTime, IoWifi, IoVolumeMute,
    IoCalendar, IoPeople, IoIdCard
} from 'react-icons/io5';

const GuideCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        className="flex flex-col p-6 rounded-[20px] bg-[#0c0c0e] border border-white/5 hover:border-white/10 transition-colors duration-300"
    >
        <div className="flex items-center gap-4 mb-4">
            <div className="shrink-0 w-11 h-11 bg-[#16171b] border border-white/5 rounded-[14px] flex items-center justify-center">
                <Icon size={20} className="text-gray-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-100 tracking-wide">
                {title}
            </h3>
        </div>
        <p className="text-[13px] text-[#888888] leading-relaxed font-medium">
            {description}
        </p>
    </motion.div>
);

const RuleItem = ({ icon: Icon, title, text, index }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="flex items-start gap-4 p-5 sm:p-6 rounded-[20px] bg-[#0a0a0c] border border-white/5 hover:border-white/10 transition-colors duration-300"
    >
        <div className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-[#16171b] border border-white/5 rounded-[14px] flex items-center justify-center mt-0.5">
            <Icon size={20} className="text-[#777]" />
        </div>
        <div className="pt-0.5 flex-1 p-1">
            <h4 className="text-[14px] sm:text-[15px] font-semibold text-gray-100 tracking-wide mb-1.5">{title}</h4>
            <p className="text-[12px] sm:text-[13px] text-[#888888] leading-relaxed font-medium">{text}</p>
        </div>
    </motion.div>
);

const LmsGuideSection = () => {
    const [activeTab, setActiveTab] = useState('features');

    return (
        <div className="mt-16 mb-20 relative w-full overflow-hidden font-sans">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10 relative z-10"
            >
                <h2 className="text-2xl font-semibold text-gray-100 mb-3 tracking-tight">
                    Library Resource Center
                </h2>
                <p className="text-[#888] text-[13px] max-w-xl mx-auto font-medium px-4">
                    Quickly access features, understand library guidelines, and manage your daily study routines all from your dashboard.
                </p>
            </motion.div>

            {/* Interactive Tabs */}
            <div className="flex justify-center mb-10 relative z-10">
                <div className="bg-[#0a0a0c] border border-white/5 p-1 rounded-xl inline-flex shadow-sm">
                    {['features', 'guidelines'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-6 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-[#666] hover:text-[#bbb]'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="guide-tab-bg"
                                    className="absolute inset-0 bg-[#222]"
                                    style={{ borderRadius: '8px' }}
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                            <span className="relative z-10">{tab === 'features' ? 'Quick Actions' : 'Library Guidelines'}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[400px] relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'features' ? (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
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
                                delay={0.05}
                            />
                            <GuideCard
                                icon={IoBed}
                                title="Seat Management"
                                description="View your assigned seat on the digital map. Request seat changes or shift changes directly from your dashboard."
                                delay={0.1}
                            />
                            <GuideCard
                                icon={IoHelpCircle}
                                title="24/7 Support"
                                description="Facing an issue? Submit a ticket for WiFi, AC, or cleaning. Track the status and get resolved quickly."
                                delay={0.15}
                            />
                            <GuideCard
                                icon={IoCalendar}
                                title="Study Planner"
                                description="Organize your daily tasks, set priorities, and track your study hours. Stay productive with the Pomodoro timer."
                                delay={0.2}
                            />
                            <GuideCard
                                icon={IoPeople}
                                title="Community Connect"
                                description="Join the Discussion Room to collaborate with peers. Share notes, ask questions, and learn together."
                                delay={0.25}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="guidelines"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full mx-auto"
                        >
                            <div className="space-y-4 sm:space-y-5">
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
                                    index={2}
                                />
                            </div>
                            <div className="space-y-4 sm:space-y-5">
                                <RuleItem
                                    icon={IoTime}
                                    title="Shift Timings"
                                    text="Adhere to your assigned slot (Morning/Evening). Extra hours require prior admin approval."
                                    index={0.5}
                                />
                                <RuleItem
                                    icon={IoWarning}
                                    title="Cleanliness"
                                    text="Keep your desk clean. Food and beverages (except water) are not allowed at the study desks."
                                    index={1.5}
                                />
                                <RuleItem
                                    icon={IoBook}
                                    title="Respect Resources"
                                    text="Handle library assets and furniture with care. Report any existing damages to the admin immediately."
                                    index={2.5}
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
