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
        className="flex flex-col p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
        <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0 w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
                <Icon size={18} style={{ color: '#F97316' }} />
            </div>
            <h3 className="text-[14px] font-semibold tracking-wide" style={{ color: '#111827' }}>
                {title}
            </h3>
        </div>
        <p className="text-[12.5px] leading-relaxed font-medium" style={{ color: '#6B7280' }}>
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
        className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
        <div className="shrink-0 w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center mt-0.5">
            <Icon size={18} style={{ color: '#6B7280' }} />
        </div>
        <div className="pt-0.5 flex-1">
            <h4 className="text-[14px] font-semibold tracking-wide mb-1.5" style={{ color: '#111827' }}>{title}</h4>
            <p className="text-[12.5px] leading-relaxed font-medium" style={{ color: '#6B7280' }}>{text}</p>
        </div>
    </motion.div>
);

const LmsGuideSection = () => {
    const [activeTab, setActiveTab] = useState('features');

    return (
        <div className="mt-10 mb-10 relative w-full overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8 relative z-10"
            >
                <h2 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>
                    Library Resource Center
                </h2>
                <p className="text-[13px] max-w-xl mx-auto font-medium px-4" style={{ color: '#6B7280' }}>
                    Quickly access features, understand library guidelines, and manage your daily study routines all from your dashboard.
                </p>
            </motion.div>

            {/* Tabs */}
            <div className="flex justify-center mb-8 relative z-10">
                <div className="bg-gray-100 border border-gray-200 p-1 rounded-xl inline-flex">
                    {['features', 'guidelines'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="relative px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
                            style={{ color: activeTab === tab ? '#111827' : '#9CA3AF' }}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="guide-tab-bg"
                                    className="absolute inset-0 bg-white border border-gray-200 shadow-sm"
                                    style={{ borderRadius: '8px' }}
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}
                            <span className="relative z-10">
                                {tab === 'features' ? 'Quick Actions' : 'Library Guidelines'}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[360px] relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'features' ? (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            <GuideCard icon={IoQrCode}    title="Smart Attendance"  description="Simply scan the QR code at the entrance kiosk. No manual entry needed—your attendance is marked instantly." delay={0} />
                            <GuideCard icon={IoCard}      title="Fee & Payments"    description="Track your payment history and download receipts. Get automated reminders 5 days before your due date." delay={0.05} />
                            <GuideCard icon={IoBed}       title="Seat Management"   description="View your assigned seat on the digital map. Request seat changes or shift changes directly from your dashboard." delay={0.1} />
                            <GuideCard icon={IoHelpCircle} title="24/7 Support"     description="Facing an issue? Submit a ticket for WiFi, AC, or cleaning. Track the status and get resolved quickly." delay={0.15} />
                            <GuideCard icon={IoCalendar}  title="Study Planner"     description="Organize your daily tasks, set priorities, and track your study hours. Stay productive with the Pomodoro timer." delay={0.2} />
                            <GuideCard icon={IoPeople}    title="Community Connect" description="Join the Discussion Room to collaborate with peers. Share notes, ask questions, and learn together." delay={0.25} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="guidelines"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mx-auto"
                        >
                            <div className="space-y-4">
                                <RuleItem icon={IoVolumeMute} title="Maintain Silence"    text="Please keep your mobile on silent. Group discussions are only allowed in the designated Discussion Room." index={0} />
                                <RuleItem icon={IoWifi}       title="WiFi Usage"          text="WiFi is for educational purposes. Heavy downloads or gaming is strictly prohibited to ensure speed for everyone." index={1} />
                                <RuleItem icon={IoIdCard}     title="ID Card Mandatory"   text="Carry your virtual or physical ID card at all times. It is required for entry and exit scans." index={2} />
                            </div>
                            <div className="space-y-4">
                                <RuleItem icon={IoTime}    title="Shift Timings"    text="Adhere to your assigned slot (Morning/Evening). Extra hours require prior admin approval." index={0.5} />
                                <RuleItem icon={IoWarning} title="Cleanliness"      text="Keep your desk clean. Food and beverages (except water) are not allowed at the study desks." index={1.5} />
                                <RuleItem icon={IoBook}    title="Respect Resources" text="Handle library assets and furniture with care. Report any existing damages to the admin immediately." index={2.5} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LmsGuideSection;
