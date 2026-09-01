import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoQrCode, IoCard, IoBed, IoHelpCircle, IoBook,
    IoWarning, IoTime, IoWifi, IoVolumeMute,
    IoCalendar, IoPeople, IoIdCard, IoShieldCheckmark,
    IoSparklesOutline, IoChevronForward
} from 'react-icons/io5';

/* ─── Feature Card ─────────────────────────────────────────────────────── */
const FEATURE_ACCENT = [
    '#f97316', '#6366f1', '#10b981',
    '#ec4899', '#0ea5e9', '#8b5cf6',
];

const GuideCard = ({ icon: Icon, title, description, delay, idx }) => {
    const accent = FEATURE_ACCENT[idx % FEATURE_ACCENT.length];
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-white group cursor-default"
            style={{
                border: `1.5px solid ${accent}20`,
                boxShadow: `0 2px 12px ${accent}0a`,
                padding: '18px 16px 18px',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}45`; e.currentTarget.style.boxShadow = `0 8px 28px -4px ${accent}22`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${accent}20`; e.currentTarget.style.boxShadow = `0 2px 12px ${accent}0a`; }}
        >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55, transparent)` }} />
            {/* Ghost watermark */}
            <Icon size={56} className="absolute -bottom-2 -right-2 pointer-events-none opacity-[0.05] group-hover:opacity-[0.08] transition-opacity" style={{ color: accent }} />
            {/* Icon pill */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-md transition-transform duration-200 group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
                <Icon size={19} className="text-white" />
            </div>
            <h3 className="text-[13.5px] font-bold mb-1.5 text-gray-900">{title}</h3>
            <p className="text-[12px] leading-relaxed font-medium text-gray-500 flex-1">{description}</p>
            {/* Subtle arrow */}
            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] font-bold" style={{ color: accent }}>Learn more</span>
                <IoChevronForward size={11} style={{ color: accent }} />
            </div>
        </motion.div>
    );
};

/* ─── Rule Card ────────────────────────────────────────────────────────── */
const RULE_ACCENT = [
    '#ef4444', '#f59e0b', '#8b5cf6',
    '#0ea5e9', '#10b981', '#f97316',
];

const RuleItem = ({ icon: Icon, title, text, index }) => {
    const accent = RULE_ACCENT[Math.floor(index) % RULE_ACCENT.length];
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (Math.floor(index)) * 0.07, duration: 0.35 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-white group"
            style={{
                border: `1.5px solid ${accent}18`,
                boxShadow: `0 2px 8px ${accent}08`,
            }}
        >
            {/* Left accent */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: accent }} />
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}08)`, border: `1px solid ${accent}25` }}>
                <Icon size={16} style={{ color: accent }} />
            </div>
            <div className="flex-1 pt-0.5">
                <h4 className="text-[13px] font-bold mb-1 text-gray-900">{title}</h4>
                <p className="text-[11.5px] leading-relaxed text-gray-500">{text}</p>
            </div>
        </motion.div>
    );
};

/* ─── Main Component ───────────────────────────────────────────────────── */
const LmsGuideSection = () => {
    const [activeTab, setActiveTab] = useState('features');

    return (
        <div className="mt-6 mb-6 relative w-full overflow-hidden">
            {/* Section header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl overflow-hidden mb-5"
                style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.1)', border: '1.5px solid #c4b5fd' }}
            >
                {/* Gradient header bar */}
                <div className="px-5 py-4 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg,#1e1b4b 0%,#3730a3 50%,#4f46e5 100%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <IoShieldCheckmark size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-wide">Library Resource Center</h2>
                            <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Features, guidelines & daily routines</p>
                        </div>
                    </div>
                    {/* Tab switcher inside header */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        {[{ key: 'features', label: 'Actions' }, { key: 'guidelines', label: 'Guidelines' }].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all duration-200"
                                style={activeTab === tab.key
                                    ? { background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }
                                    : { color: 'rgba(255,255,255,0.55)' }}
                            >{tab.label}</button>
                        ))}
                    </div>
                </div>

                {/* Cards area */}
                <div className="p-4" style={{ background: '#fafafa', minHeight: '180px' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'features' ? (
                            <motion.div
                                key="features"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                                className="grid grid-cols-2 md:grid-cols-3 gap-3"
                            >
                                <GuideCard idx={0} icon={IoQrCode}    title="Smart Attendance"  description="Scan the QR code at the kiosk. Attendance marked instantly — no manual entry." delay={0} />
                                <GuideCard idx={1} icon={IoCard}      title="Fee & Payments"    description="Track payment history, download receipts, get reminders 5 days before due date." delay={0.05} />
                                <GuideCard idx={2} icon={IoBed}       title="Seat Management"   description="View your assigned seat on the map. Request changes directly from the dashboard." delay={0.1} />
                                <GuideCard idx={3} icon={IoHelpCircle} title="24/7 Support"     description="Submit a ticket for WiFi, AC or cleaning issues. Track resolution status live." delay={0.15} />
                                <GuideCard idx={4} icon={IoCalendar}  title="Study Planner"     description="Organize daily tasks, set priorities, track study hours with Pomodoro timer." delay={0.2} />
                                <GuideCard idx={5} icon={IoPeople}    title="Community Connect" description="Collaborate with peers in the Discussion Room. Share notes and learn together." delay={0.25} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="guidelines"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                                {[
                                    { icon: IoVolumeMute, title: 'Maintain Silence',    text: 'Keep mobile on silent. Group discussions only in the designated Discussion Room.', index: 0 },
                                    { icon: IoWifi,       title: 'WiFi Usage',           text: 'WiFi is for education only. Heavy downloads or gaming is strictly prohibited.', index: 1 },
                                    { icon: IoIdCard,     title: 'ID Card Mandatory',    text: 'Carry your virtual or physical ID at all times — required for entry and exit scans.', index: 2 },
                                    { icon: IoTime,       title: 'Shift Timings',        text: 'Adhere to your assigned slot (Morning/Evening). Extra hours require admin approval.', index: 3 },
                                    { icon: IoWarning,    title: 'Cleanliness',          text: 'Keep your desk clean. Food (except water) not allowed at study desks.', index: 4 },
                                    { icon: IoBook,       title: 'Respect Resources',    text: 'Handle library assets with care. Report any existing damage to admin immediately.', index: 5 },
                                ].map((r, i) => (
                                    <div key={i} className="relative">
                                        <RuleItem icon={r.icon} title={r.title} text={r.text} index={r.index} />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LmsGuideSection;
