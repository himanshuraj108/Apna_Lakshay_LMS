import { motion } from 'framer-motion';
import { IoArrowBack, IoShieldCheckmark, IoLockClosed, IoPersonCircle, IoCashOutline, IoMailOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const SECTIONS = [
    {
        num: '01',
        title: 'Information We Collect',
        color: '#2563EB',
        bg: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
        icon: IoPersonCircle,
        content: null,
        list: [
            'Personal identification — Name, Email, Student ID',
            'Attendance records and entry / exit timestamps',
            'Payment history and transaction details',
            'Seat preferences and booking history',
        ],
    },
    {
        num: '02',
        title: 'How We Use Your Data',
        color: '#059669',
        bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
        icon: IoShieldCheckmark,
        content: 'Your data is used strictly for operational and academic purposes:',
        list: [
            'Managing access and security within the facility',
            'Processing fee payments and generating receipts',
            'Communicating important updates and reminders',
            'Improving facility management and resource allocation',
        ],
    },
    {
        num: '03',
        title: 'Data Security',
        color: '#7C3AED',
        bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
        icon: IoLockClosed,
        content:
            'We implement industry-standard security measures to protect your personal information. Your data is encrypted and stored securely. We do not sell or share your personal data with third parties under any circumstances.',
        list: null,
    },
    {
        num: '04',
        title: 'Contact Us',
        color: '#EA580C',
        bg: 'linear-gradient(135deg, #FFF7ED, #FED7AA)',
        icon: IoMailOutline,
        content:
            'If you have any questions about this privacy policy, please contact the administration via the Help & Support section in your student dashboard or email us at apnalakshaylms@gmail.com.',
        list: null,
    },
];

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen text-[#0F172A] relative overflow-x-hidden" style={{ background: '#FAF6F0' }}>

            {/* Warm dot-grid background */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #D6C8B8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                opacity: 0.35
            }} />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(249,115,22,0.08)' }} />
                <div className="absolute top-[30%] right-[5%] w-[380px] h-[380px] rounded-full blur-[120px]" style={{ background: 'rgba(124,58,237,0.05)' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 py-12">

                {/* Back link */}
                <Link
                    to="/student/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors"
                    style={{ color: '#EA580C' }}
                >
                    <IoArrowBack size={16} />
                    Back to Dashboard
                </Link>

                {/* Main card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl"
                    style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 8px 32px rgba(120,80,30,0.08)' }}
                >
                    {/* 3px gradient accent top bar */}
                    <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #F97316, #F59E0B, #EA580C)' }} />

                    <div className="p-8 md:p-12">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)' }}>
                                <IoShieldCheckmark size={36} style={{ color: '#EA580C' }} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#0F172A' }}>Privacy Policy</h1>
                                <p className="mt-1 text-sm font-medium" style={{ color: '#786D62' }}>
                                    Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Intro */}
                        <p className="text-sm leading-relaxed mb-10 px-1" style={{ color: '#574E45' }}>
                            At <span className="font-bold" style={{ color: '#0F172A' }}>Apna Lakshya Library</span>, we are committed to protecting the privacy and security of our students and members. This policy explains what data we collect, why we collect it, and how we keep it safe.
                        </p>

                        {/* Sections */}
                        <div className="space-y-5">
                            {SECTIONS.map((sec, idx) => {
                                const Icon = sec.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.07 }}
                                        className="rounded-xl overflow-hidden"
                                        style={{ border: '1.5px solid #EDE8E0' }}
                                    >
                                        {/* Section header */}
                                        <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: '#FAF6F0', borderBottom: '1px solid #EDE8E0' }}>
                                            <div className="p-2 rounded-lg shrink-0" style={{ background: sec.bg, color: sec.color }}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: sec.color }}>{sec.num}</span>
                                                <h2 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: '#0F172A' }}>{sec.title}</h2>
                                            </div>
                                        </div>

                                        {/* Section body */}
                                        <div className="px-5 py-4 bg-white space-y-3">
                                            {sec.content && (
                                                <p className="text-sm leading-relaxed" style={{ color: '#574E45' }}>{sec.content}</p>
                                            )}
                                            {sec.list && (
                                                <ul className="space-y-2">
                                                    {sec.list.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#574E45' }}>
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sec.color }} />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default PrivacyPolicy;
